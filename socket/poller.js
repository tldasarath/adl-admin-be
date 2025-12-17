// socket/poller.js
import mongoose from 'mongoose';
import { getIo } from './socketServer.js';
import { v4 as uuidv4 } from 'uuid';
import { getRealtime, getTopPages } from '../services/analytics/analyticsService.js';

const LOCK_ID = 'analytics-poller-lock';
const DEFAULT_POLL_MS = Number(process.env.ANALYTICS_POLL_MS || 15000); // default 15s
const LOCK_TTL_MS = Number(process.env.POLL_LEADER_TTL_MS || DEFAULT_POLL_MS * 4); // leader lease
const MAX_BACKOFF_MS = Number(process.env.MAX_POLL_BACKOFF_MS || 5 * 60 * 1000); // up to 5 minutes
let performanceCache = {};
let lastPerfAt = 0;
const PERF_REFRESH_MS = Number(process.env.PERF_REFRESH_MS || 1000 * 60 * 5); // default 5 minutes

// Lock schema (single small collection)
const lockSchema = new mongoose.Schema({
  _id: { type: String, default: LOCK_ID },
  owner: String,
  expiresAt: Date
}, { collection: 'pollerLocks' });

const LockModel = mongoose.models.PollerLock || mongoose.model('PollerLock', lockSchema);

// internal state
let pollerInterval = null;
let renewerInterval = null;
let attemptInterval = null;
let leaderId = null;
let lastPayload = null;
let consecutiveFailures = 0;
let stopped = false;

/**
 * Robust tryAcquireLock implementation.
 * Handles duplicate-key races by reading the lock document and retrying with jitter.
 */
async function tryAcquireLock(instanceId, maxAttempts = 3) {
  const now = new Date();

  async function readLock() {
    try {
      return await LockModel.findById(LOCK_ID).lean().exec();
    } catch (e) {
      console.error('Error reading lock doc:', e && e.message);
      return null;
    }
  }

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const expiresAt = new Date(Date.now() + LOCK_TTL_MS);

    try {
      const filter = {
        _id: LOCK_ID,
        $or: [
          { expiresAt: { $lt: now } },
          { expiresAt: null },
          { owner: instanceId }
        ]
      };

      const update = { _id: LOCK_ID, owner: instanceId, expiresAt };
      // new:true returns the updated doc
      const res = await LockModel.findOneAndUpdate(filter, update, { upsert: true, new: true }).exec();

      if (res && res.owner === instanceId) {
        // We are the leader (either we inserted it or we took over)
        return true;
      }
      // If res exists but owner != instanceId, we didn't get lock this attempt
    } catch (err) {
      // Handle duplicate key (E11000) race - treat as benign and read the doc
      const isDupKey = err && (err.code === 11000 || (err.errorResponse && err.errorResponse.code === 11000));
      if (isDupKey) {
        // another process inserted concurrently; read the doc to decide
        const doc = await readLock();
        if (doc && doc.owner === instanceId) return true;
        if (doc && doc.expiresAt && new Date(doc.expiresAt) > now) {
          // exists and not expired -> cannot acquire now
          return false;
        }
        // otherwise doc may be expired - allow retry
      } else {
        // Unexpected error - log and continue retry attempts
        console.error('Lock acquire unexpected error:', err && (err.message || err));
      }
    }

    // jitter before retry to avoid thundering herd
    const jitter = Math.floor(Math.random() * 200) + 50; // 50-250ms
    await new Promise(r => setTimeout(r, jitter));
  }

  // final read to confirm ownership
  const finalDoc = await LockModel.findById(LOCK_ID).lean().exec();
  return !!(finalDoc && finalDoc.owner === instanceId && (!finalDoc.expiresAt || new Date(finalDoc.expiresAt) > new Date()));
}

/**
 * Renew the lock lease for owner instance
 */
async function renewLock(instanceId) {
  const expiresAt = new Date(Date.now() + LOCK_TTL_MS);
  try {
    const res = await LockModel.findOneAndUpdate({ _id: LOCK_ID, owner: instanceId }, { expiresAt }, { new: true }).exec();
    return !!res;
  } catch (e) {
    console.error('Lock renew error', e && e.message);
    return false;
  }
}

/**
 * Release the lock if owned by this instance.
 */
async function releaseLock(instanceId) {
  try {
    await LockModel.deleteOne({ _id: LOCK_ID, owner: instanceId }).exec();
  } catch (e) {
    console.error('Lock release error', e && e.message);
  }
}

/**
 * The actual poll operation - small, deterministic payload
 */
async function pollOnce() {
  let data;
  try {
    data = await getRealtime({ limit: 10 });
  } catch (e) {
    console.warn('getRealtime failed in pollOnce, falling back to getTopPages:', e && (e.message || e));
    data = await getTopPages({ days: 1, limit: 10 });
  }

  const rows = data && (data.rows || data) ? (data.rows || data) : [];

  const payload = {
    ts: new Date().toISOString(),
    rows: rows.slice(0, 10).map(r => ({
      pagePath: r.pagePath || r.path || (r.dimensionValues && r.dimensionValues[0] && r.dimensionValues[0].value) || '',
      activeUsers: Number(r.activeUsers ?? r.active ?? 0),
      screenPageViews: Number(r.screenPageViews ?? r.views ?? 0)
    }))
  };

  const payloadStr = JSON.stringify(payload);
  if (payloadStr !== lastPayload) {
    lastPayload = payloadStr;
    const io = getIo();
    if (io) {
      io.to('admins').volatile.emit('analytics:live', payload);
    }
  }
}

/**
 * Poll wrapper with exponential backoff on repeated failures.
 */
async function pollOnceWithBackoff() {
  try {
    await pollOnce();
    consecutiveFailures = 0;
  } catch (e) {
    consecutiveFailures++;
    const backoff = Math.min(2 ** consecutiveFailures * 1000, MAX_BACKOFF_MS);
    console.warn(`Poller failure #${consecutiveFailures}, backing off ${backoff}ms`, e && (e.message || e));
    await new Promise(r => setTimeout(r, backoff));
  }
}

/**
 * Start the poller: become leader and poll periodically.
 */
export async function startPoller(opts = {}) {
  if (stopped) return;
  const instanceId = opts.instanceId || uuidv4();
  const pollMs = opts.pollMs || DEFAULT_POLL_MS;

  const isLeader = await tryAcquireLock(instanceId);
  if (!isLeader) {
    // schedule attempts to become leader later
    attemptInterval = setInterval(async () => {
      try {
        const ok = await tryAcquireLock(instanceId);
        if (ok) {
          clearInterval(attemptInterval);
          attemptInterval = null;
          startPoller({ instanceId, pollMs });
        }
      } catch (e) {
        console.error('Leader acquire attempt failed:', e && e.message);
      }
    }, Math.max(5000, pollMs * 2));
    return;
  }

  leaderId = instanceId;
  console.log('Poller started as leader:', instanceId);

  // initial poll
  await pollOnceWithBackoff();

  // renew lease periodically
  renewerInterval = setInterval(async () => {
    try {
      await renewLock(instanceId);
    } catch (e) {
      console.error('Error renewing lock:', e && e.message);
    }
  }, Math.max(1000, Math.floor(pollMs / 2)));

  // periodic poller
  pollerInterval = setInterval(async () => {
    try {
      await pollOnceWithBackoff();
    } catch (e) {
      console.error('Unexpected poller error:', e && e.message);
    }
  }, pollMs);

  // cleanup handlers
  const cleanup = async () => {
    if (stopped) return;
    stopped = true;
    try {
      if (pollerInterval) { clearInterval(pollerInterval); pollerInterval = null; }
      if (renewerInterval) { clearInterval(renewerInterval); renewerInterval = null; }
      if (attemptInterval) { clearInterval(attemptInterval); attemptInterval = null; }
      await releaseLock(instanceId);
      console.log('Poller stopped and lock released:', instanceId);
    } catch (e) {
      console.error('Error during poller cleanup:', e && e.message);
    }
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}

/**
 * Stop the poller programmatically (useful in tests).
 */
export async function stopPoller() {
  stopped = true;
  if (pollerInterval) { clearInterval(pollerInterval); pollerInterval = null; }
  if (renewerInterval) { clearInterval(renewerInterval); renewerInterval = null; }
  if (attemptInterval) { clearInterval(attemptInterval); attemptInterval = null; }
  if (leaderId) {
    try { await releaseLock(leaderId); } catch (e) { /* ignore */ }
    leaderId = null;
  }
  console.log('Poller stopped via stopPoller()');
}

const now = Date.now();
if (now - lastPerfAt > PERF_REFRESH_MS) {
  try {
    // fetch aggregated ranges but do them in parallel
    const [p24, p7, p28, p90] = await Promise.all([
      getPerformance({ range: '24h', topN: 5 }),
      getPerformance({ range: '7d', topN: 5 }),
      getPerformance({ range: '28d', topN: 5 }),
      getPerformance({ range: '3mo', topN: 5 })
    ]);
    performanceCache = { '24h': p24, '7d': p7, '28d': p28, '3mo': p90, fetchedAt: new Date().toISOString() };
    lastPerfAt = Date.now();

    const io = getIo();
    if (io) io.to('admins').volatile.emit('analytics:performance', performanceCache);
  } catch (e) {
    console.warn('perf refresh failed:', e && e.message);
  }
}