import express from 'express';
import { getMonthlyReport, getCategoryReport, getYearlyStats } from '../controllers/reportController.js';

const router = express.Router();

router.get('/month', getMonthlyReport);
router.get('/categories', getCategoryReport);
router.get('/yearly', getYearlyStats);

export default router;
