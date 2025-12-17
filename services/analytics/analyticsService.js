// services/analytics/analyticsService.js (ESM)
import { createGaClient } from '../../utils/gaClient.js';

const GA_PROPERTY = process.env.GA4_PROPERTY_ID;
if (!GA_PROPERTY) console.warn('GA4_PROPERTY_ID not set. Analytics will fail until set.');

const client = createGaClient();

async function runReport(requestBody) {
  const [response] = await client.runReport({
    property: `properties/${GA_PROPERTY}`,
    ...requestBody
  });
  return response;
}






export async function getOverview({ days = 7 } = {}) {
  const dateRange = [{ startDate: `${days}daysAgo`, endDate: 'yesterday' }];
  const res = await runReport({
    dateRanges: dateRange,
    metrics: [{ name: 'activeUsers' }, { name: 'sessions' }, { name: 'screenPageViews' }]
  });

  const metrics = {};
  const headers = res.metricHeaders || [];
  const values = (res.rows && res.rows[0] && res.rows[0].metricValues) || [];
  headers.forEach((h, i) => { metrics[h.name] = values[i] ? values[i].value : '0'; });

  return { raw: res, metrics };
}



export async function getKpis({ days = 7 } = {}) {
  // GA date range used in many places: use yesterday as end for stable full-days
  const startDate = `${days}daysAgo`;
  const endDate = 'yesterday';

  // Request GA4 totals for the selected range
  const totalsRes = await runReport({
    dateRanges: [{ startDate, endDate }],
    metrics: [
      { name: 'screenPageViews' }, // page views
      { name: 'eventCount' },      // total events
      { name: 'newUsers' },        // new users
      { name: 'activeUsers' }
    ]
  });

  // Extract GA4 numeric totals safely
  const totals = { screenPageViews: 0, eventCount: 0, newUsers: 0, activeUsers: 0 };
  if (totalsRes && totalsRes.metricHeaders && totalsRes.rows && totalsRes.rows[0]) {
    totalsRes.metricHeaders.forEach((h, idx) => {
      totals[h.name] = Number(totalsRes.rows[0].metricValues[idx]?.value ?? 0);
    });
  }

  // Search Console impressions (optional) — only if configured
  let impressions = null;
  if (process.env.GA_SERVICE_ACCOUNT && process.env.WEBSITE_BASE_URL) {
    try {
      // convert to ISO dates using yesterday as end
      const end = new Date(); end.setDate(end.getDate() - 1);
      const start = new Date(end.getTime() - (days - 1) * 24 * 3600 * 1000);
      const startStr = start.toISOString().slice(0,10), endStr = end.toISOString().slice(0,10);

      const gsc = await fetchSearchConsoleMetrics({ startDate: startStr, endDate: endStr });
      impressions = Number(gsc.impressions ?? 0);
    } catch (e) {
      console.warn('GSC impressions fetch failed:', e && (e.message || e));
      impressions = null; // keep null so frontend can show fallback
    }
  }

  return {
    rangeDays: days,
    screenPageViews: totals.screenPageViews,
    eventCount: totals.eventCount,
    newUsers: totals.newUsers,
    activeUsers: totals.activeUsers,
    impressions
  };
}


export async function getTopPages({ days = 7, limit = 10 } = {}) {
  const res = await runReport({
    dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'yesterday' }],
    dimensions: [{ name: 'pagePath' }],
    metrics: [{ name: 'screenPageViews' }, { name: 'activeUsers' }],
    limit
  });

  const rows = (res.rows || []).map(row => {
    const dv = row.dimensionValues || [];
    const mv = row.metricValues || [];
    return { pagePath: (dv[0] && dv[0].value) || '', screenPageViews: +(mv[0]?.value || 0), activeUsers: +(mv[1]?.value || 0) };
  });

  return { raw: res, rows };
}

export async function getRealtime({ limit = 50 } = {}) {
  if (!GA_PROPERTY) throw new Error('GA4_PROPERTY_ID not set');
  const property = `properties/${GA_PROPERTY}`;

  // minimal request
  const realtimeReq = { property, metrics: [{ name: 'activeUsers' }], dimensions: [{ name: 'pagePath' }], limit };
  try {
    if (typeof client.runRealtimeReport !== 'function') {
      throw new Error('Realtime method not available in GA client');
    }
    const [resp] = await client.runRealtimeReport(realtimeReq);
    const rows = (resp.rows || []).map(r => ({
      pagePath: r.dimensionValues?.[0]?.value || '',
      activeUsers: +(r.metricValues?.[0]?.value || 0)
    }));
    return { raw: resp, rows };
  } catch (e) {
    console.error('Realtime error:', e.code, e.message || e);
    // fallback runReport
    const [fallbackRes] = await client.runReport({
      property,
      dateRanges: [{ startDate: '1daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'pagePath' }],
      metrics: [{ name: 'screenPageViews' }, { name: 'activeUsers' }],
      limit
    });
    const fallbackRows = (fallbackRes.rows || []).map(r => ({
      pagePath: r.dimensionValues?.[0]?.value || '',
      screenPageViews: +(r.metricValues?.[0]?.value || 0),
      activeUsers: +(r.metricValues?.[1]?.value || 0)
    }));
    return { fallback: true, raw: fallbackRes, rows: fallbackRows, message: 'Realtime not available; returned recent report.' };
  }
}

export async function* streamReportRows({ startDate, endDate, dimensions = [], metrics = [], pageSize = 10000 }) {
  if (!GA_PROPERTY) throw new Error('GA4_PROPERTY_ID not set');
  let offset = 0;
  while (true) {
    const request = {
      property: `properties/${GA_PROPERTY}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: dimensions.map(n => ({ name: n })),
      metrics: metrics.map(n => ({ name: n })),
      limit: pageSize,
      offset
    };
    const [response] = await client.runReport(request);
    const rows = response.rows || [];
    if (!rows.length) break;
    for (const r of rows) yield { dimensionHeaders: response.dimensionHeaders || [], metricHeaders: response.metricHeaders || [], row: r };
    if (rows.length < pageSize) break;
    offset += pageSize;
  }
}


const RANGE_TO_DAYS = {
  '24h': 1,
  '7d': 7,
  '28d': 28,
  '3mo': 90
};

export async function getPerformance({ range = "7d", topN = 5 } = {}) {
  const days = RANGE_TO_DAYS[range] || 7;

  //-------------------------
  // GA4 DATE RANGE
  //-------------------------
  const endDate = "yesterday"; // more accurate than "today"
  const startDate = `${days}daysAgo`;

  //-------------------------
  // 1. GA4 TOTALS
  //-------------------------
  const totalsReport = await runReport({
    dateRanges: [{ startDate, endDate }],
    metrics: [
      { name: "activeUsers" },
      { name: "screenPageViews" },
      { name: "sessions" }
    ]
  });

  const totals = {};
  if (totalsReport.rows?.[0]) {
    totalsReport.metricHeaders.forEach((h, i) => {
      totals[h.name] = Number(totalsReport.rows[0].metricValues[i]?.value || 0);
    });
  }

  //-------------------------
  // 2. GA4 TOP PAGES
  //-------------------------
  const topPagesReport = await runReport({
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: "pagePath" }],
    metrics: [{ name: "screenPageViews" }],
    limit: topN
  });

  const topPages = (topPagesReport.rows || []).map(r => ({
    pagePath: r.dimensionValues?.[0]?.value || "",
    screenPageViews: Number(r.metricValues?.[0]?.value || 0)
  }));

  //-------------------------
  // 3. SEARCH CONSOLE METRICS
  //-------------------------
  let sc = {
    clicks: null,
    impressions: null,
    ctr: null,
    averagePosition: null
  };

  if (process.env.GA_SERVICE_ACCOUNT && process.env.WEBSITE_BASE_URL) {
    try {
      // Convert GA4's "daysAgo" into real ISO dates
      const end = new Date();
      end.setDate(end.getDate() - 1); // yesterday
      const start = new Date(end.getTime() - (days - 1) * 86400000);

      const startStr = start.toISOString().slice(0, 10);
      const endStr = end.toISOString().slice(0, 10);

      sc = await fetchSearchConsoleMetrics({
        startDate: startStr,
        endDate: endStr
      });
    } catch (e) {
      console.warn("Search console unavailable:", e.message);
    }
  }

  //-------------------------
  // 4. FINAL METRICS
  //-------------------------
  const metrics = {
    activeUsers: totals.activeUsers ?? 0,
    screenPageViews: totals.screenPageViews ?? 0,
    sessions: totals.sessions ?? 0,

    // Search Console data
    clicks: sc.clicks,
    impressions: sc.impressions,
    ctr: sc.ctr,
    averagePosition: sc.averagePosition
  };

  //-------------------------
  // Return stable API to frontend
  //-------------------------
  return {
    range,
    metrics,
    topPages,
    raw: {
      ga4Totals: totalsReport,
      ga4TopPages: topPagesReport,
      searchConsole: sc
    }
  };
}

export async function getPerformanceTrend({ range = '7d', metric = 'screenPageViews', endDateMode = 'today' } = {}) {
  if (!RANGE_TO_DAYS[range]) throw new Error('Invalid range');

  const days = RANGE_TO_DAYS[range];

  // use hourly for 24h (dateHour), daily otherwise
  const isHourly = range === '24h';
  const endDate = endDateMode === 'yesterday' ? 'yesterday' : 'today';
  const startDate = `${days}daysAgo`; // GA accepts "7daysAgo", "1daysAgo", etc.

  // prepare GA request shape
  const request = {
    dateRanges: [{ startDate, endDate }],
    metrics: [{ name: metric }],
    limit: days + 10 // safety
  };

  // choose dimensions for granularity
  if (isHourly) {
    // date + hour to get hourly rows (GA commonly exposes "date" + "hour" or "dateHour")
    // We'll request 'date' and 'hour' separately and format as "YYYY-MM-DD HH:00"
    request.dimensions = [{ name: 'date' }, { name: 'hour' }];
  } else {
    request.dimensions = [{ name: 'date' }]; // daily granularity
  }

  // run report
  const res = await runReport(request);
  const rows = res.rows || [];

  // Build map from formatted x -> value
  const map = new Map();
  for (const r of rows) {
    // dimensionValues are in same order as dimensions requested
    const dims = r.dimensionValues || [];
    const metricVals = r.metricValues || [];
    const value = Number(metricVals[0]?.value ?? 0);

    if (isHourly) {
      const dateRaw = dims[0]?.value; // 'YYYYMMDD'
      const hourRaw = dims[1]?.value; // '0'..'23'
      if (!dateRaw) continue;
      const dateFormatted = `${dateRaw.slice(0,4)}-${dateRaw.slice(4,6)}-${dateRaw.slice(6,8)}`;
      const hourPadded = hourRaw?.padStart ? hourRaw.padStart(2,'0') : String(hourRaw).padStart(2,'0');
      const key = `${dateFormatted} ${hourPadded}:00`; // e.g. '2025-12-10 09:00'
      map.set(key, (map.get(key) || 0) + value);
    } else {
      const dateRaw = dims[0]?.value; // 'YYYYMMDD'
      if (!dateRaw) continue;
      const dateFormatted = `${dateRaw.slice(0,4)}-${dateRaw.slice(4,6)}-${dateRaw.slice(6,8)}`;
      map.set(dateFormatted, (map.get(dateFormatted) || 0) + value);
    }
  }

  // Build deterministic series array in chronological order
  const series = [];
  if (isHourly) {
    // build last 24 hour labels from (now - (hours-1)) to now OR the property date range endpoint
    // We'll construct hours for the last 24 hours ending at endDate (today or yesterday).
    // If endDate is 'today', include current hour (partial).
    const now = new Date();
    // Determine the end point (use local server timezone; GA uses property timezone)
    // We'll construct labels for days*24 hours.
    const totalHours = 24 * days; // for 24h it's 24
    // build starting date-time
    const endMoment = new Date(); // now
    // get the start moment
    const startMoment = new Date(endMoment.getTime() - (totalHours - 1) * 60 * 60 * 1000);
    for (let i = 0; i < totalHours; i++) {
      const d = new Date(startMoment.getTime() + i * 60 * 60 * 1000);
      const isoDate = d.toISOString().slice(0,10); // YYYY-MM-DD
      const hh = String(d.getHours()).padStart(2,'0');
      const key = `${isoDate} ${hh}:00`;
      series.push({ x: key, y: Number(map.get(key) ?? 0) });
    }
  } else {
    // daily series: from (days-1) days ago to today
    const end = new Date(); // today
    const start = new Date(end.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
    for (let i = 0; i < days; i++) {
      const d = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
      const iso = d.toISOString().slice(0,10);
      series.push({ x: iso, y: Number(map.get(iso) ?? 0) });
    }
  }

  return { series, raw: res };
}






/**
 * Fetch sessions/visitors by country with proper ISO codes for heatmap
 * Returns ALL countries with data (not just top N)
 */
export async function getSessionsByCountry({ 
  range = '3mo', 
  topN = 250, // Increased to get all countries globally
  metric = 'activeUsers' 
} = {}) {
  const RANGE_TO_DAYS = { 
    '24h': 1, 
    '7d': 7, 
    '28d': 28, 
    '3mo': 90 
  };
  
  const days = RANGE_TO_DAYS[range] || 90;
  const startDate = `${days}daysAgo`;
  const endDate = 'yesterday';

  console.log(`[getSessionsByCountry] Range: ${range} (${days} days), Metric: ${metric}`);

  try {
    // IMPORTANT: Use 'countryId' dimension for ISO Alpha-2 codes (IN, US, GB, etc.)
    // Some GA4 properties might use 'countryIsoCode' instead
    const res = await runReport({
      dateRanges: [{ startDate, endDate }],
      dimensions: [
        { name: 'country' },      // Human-readable name: "India", "United States"
        { name: 'countryId' }     // ISO Alpha-2: "IN", "US" (CRITICAL for map)
      ],
      metrics: [{ name: metric }],
      orderBys: [{ 
        metric: { metricName: metric }, 
        desc: true 
      }],
      limit: topN
    });

    const rows = (res.rows || []).map(r => {
      const dv = r.dimensionValues || [];
      const mv = r.metricValues || [];
      
      // Extract values
      const country = (dv[0]?.value || '').trim();
      let iso = (dv[1]?.value || '').trim().toUpperCase();
      const value = Number(mv[0]?.value || 0);
      
      // Handle edge cases
      if (country === '(not set)' || country === '' || !iso) {
        iso = null; // Exclude from map
      }
      
      // Fix common GA4 ISO code issues
      if (iso === 'UK') iso = 'GB'; // United Kingdom correction
      if (iso === 'ZZ') iso = null; // Unknown country
      
      return { 
        country: country || '(not set)', 
        iso, 
        value 
      };
    });

    // Filter for valid map data
    const validRows = rows.filter(r => r.iso && r.value > 0);
    
    console.log(`[getSessionsByCountry] Found ${validRows.length} countries with visitors`);
    console.log(`[getSessionsByCountry] Total visitors: ${validRows.reduce((s, r) => s + r.value, 0)}`);

    return { 
      rows: validRows,
      allRows: rows, // Include all (even without ISO) for debugging
      totalCountries: validRows.length,
      range,
      metric,
      dateRange: { startDate, endDate }
    };
  } catch (error) {
    console.error('[getSessionsByCountry] GA4 API Error:', error.message);
    throw new Error(`Failed to fetch country data: ${error.message}`);
  }
}



export async function getActiveUsersByDevice({
  range = "28d"
} = {}) {
  const RANGE_TO_DAYS = {
    "24h": 1,
    "7d": 7,
    "28d": 28,
    "3mo": 90
  };

  const days = RANGE_TO_DAYS[range] || 28;
  const startDate = `${days}daysAgo`;
  const endDate = "yesterday";

  const res = await runReport({
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: "deviceCategory" }],
    metrics: [{ name: "activeUsers" }]
  });

  const rows = res.rows || [];

  // Normalize output
  const deviceMap = {
    desktop: 0,
    mobile: 0,
    tablet: 0
  };

  rows.forEach(r => {
    const device = r.dimensionValues?.[0]?.value;
    const users = Number(r.metricValues?.[0]?.value || 0);

    if (deviceMap[device] !== undefined) {
      deviceMap[device] += users;
    }
  });

  const devices = Object.entries(deviceMap).map(([device, users]) => ({
    device,
    users
  }));

  const totalActiveUsers = devices.reduce((s, d) => s + d.users, 0);

  return {
    range,
    totalActiveUsers,
    devices,
    raw: res
  };
}