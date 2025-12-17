// route/admin/analyticsRoute.js
import express from 'express'
import {overview,topPages,realtime,exportCsv,performance,performanceTrend,kpis,sessionsByCountry,activeUsersByDevice} from '../../controllers/adminController/analyticsController.js';

const analyticsRoute = express.Router();

analyticsRoute.get('/overview', overview);
analyticsRoute.get('/top-pages', topPages);
analyticsRoute.get('/realtime', realtime);
analyticsRoute.get('/export', exportCsv);
analyticsRoute.get('/performance', performance);
analyticsRoute.get('/performance/trend', performanceTrend);
analyticsRoute.get('/kpis', kpis); 
analyticsRoute.get('/sessions-by-country', sessionsByCountry);
analyticsRoute.get("/active-users-by-device",activeUsersByDevice);

export default analyticsRoute;
