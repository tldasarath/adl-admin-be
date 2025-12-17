// controllers/adminController/analyticsController.js (ESM)
import fastCsv from 'fast-csv';
import { getOverview, getTopPages, streamReportRows, getRealtime, getPerformance, getPerformanceTrend, getKpis, getSessionsByCountry, getActiveUsersByDevice } from '../../services/analytics/analyticsService.js';

export const overview = async (req, res) => {
  try { const days = parseInt(req.query.days) || 7; 
    const data = await getOverview({ days }); 
    return res.json({ success: true, data }); }
  catch (err) { console.error('Analytics overview error:', err); return res.status(500).json({ success: false, message: err.message || 'Server error' }); }
};


export const topPages = async (req, res) => {
  try { const days = parseInt(req.query.days) || 7;
     const limit = parseInt(req.query.limit) || 10; const data = await getTopPages({ days, limit }); return res.json({ success: true, data }); }
  catch (err) { console.error('Analytics topPages error:', err);
     return res.status(500).json({ success: false, message: err.message || 'Server error' }); }
};

export const realtime = async (req, res) => {
  try { const limit = parseInt(req.query.limit) || 50; 
    const data = await getRealtime({ limit }); 
    return res.json({ success: true, data }); }
  catch (err) { console.error('Analytics realtime error:', err && err.message, err); const message = err && err.message ? err.message : 'Server error'; return res.status(500).json({ success: false, message }); }
};

export const exportCsv = async (req, res) => {
  try {
    const { start, end, dimensions, metrics } = req.query;
    if (!start || !end) return res.status(400).json({ success: false, message: 'start and end query params required (YYYY-MM-DD)' });

    const dims = dimensions ? dimensions.split(',').map(d => d.trim()) : ['pagePath'];
    const mets = metrics ? metrics.split(',').map(m => m.trim()) : ['screenPageViews'];

    // Protect: limit date range (max 31 days) for synchronous exports
    const maxRangeDays = Number(process.env.MAX_EXPORT_DAYS || 31);
    const from = new Date(start); const to = new Date(end);
    if ((to - from) / (1000 * 60 * 60 * 24) > maxRangeDays) {
      return res.status(400).json({ success: false, message: `Max export range is ${maxRangeDays} days. For larger exports use job-based export.` });
    }

    const fileName = `analytics_${start}_${end}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    const csvStream = fastCsv.format({ headers: true });
    csvStream.pipe(res);

    const rowGenerator = streamReportRows({ startDate: start, endDate: end, dimensions: dims, metrics: mets, pageSize: 10000 });

    for await (const { dimensionHeaders, metricHeaders, row } of rowGenerator) {
      const outObj = {};
      if (dimensionHeaders && row.dimensionValues) dimensionHeaders.forEach((h, idx) => { outObj[h.name] = row.dimensionValues[idx]?.value || ''; });
      if (metricHeaders && row.metricValues) metricHeaders.forEach((h, idx) => { outObj[h.name] = row.metricValues[idx]?.value || ''; });
      csvStream.write(outObj);
    }

    csvStream.end();
  } catch (err) {
    console.error('Export CSV error:', err);
    if (!res.headersSent) return res.status(500).json({ success: false, message: err.message || 'Server error' });
    else res.end();
  }
};

export const performance = async (req, res) => {
  try {
    const range = (req.query.range || '7d').toLowerCase();
    const topN = parseInt(req.query.topN) || 5;
    const data = await getPerformance({ range, topN });
    return res.json({ success: true, data });
  } catch (err) {
    console.error('Analytics performance error:', err && err.message, err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};


export const performanceTrend = async (req, res) => {
  try {
    const range = (req.query.range || '7d').toLowerCase();
    const metric = req.query.metric || 'screenPageViews';
    const data = await getPerformanceTrend({ range, metric });
    return res.json({ success: true, data });
  } catch (err) {
    console.error('performanceTrend error:', err && err.message);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};


export const kpis = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const data = await getKpis({ days });
    return res.json({ success: true, data });
  } catch (err) {
    console.error('Analytics kpis error:', err && err.message, err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};


export const sessionsByCountry = async (req, res) => {
  try {
    const range = (req.query.range || '28d').toLowerCase();
    const topN = parseInt(req.query.topN) || 10;
    const metric = req.query.metric || 'screenPageViews';
    const data = await getSessionsByCountry({ range, topN, metric });
    return res.json({ success: true, data });
  } catch (err) {
    console.error('Analytics sessionsByCountry error:', err && err.message);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};


export const activeUsersByDevice = async (req, res) => {
  try {
    const range = (req.query.range || "28d").toLowerCase();
    const data = await getActiveUsersByDevice({ range });
    return res.json({ success: true, data });
  } catch (err) {
    console.error("Active users by device error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Server error"
    });
  }
};
