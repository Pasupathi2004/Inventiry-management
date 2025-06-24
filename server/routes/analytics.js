import express from 'express';
import { readJSON, DB_PATHS } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// Get analytics data
router.get('/', authenticateToken, asyncHandler(async (req, res) => {
  const inventory = readJSON(DB_PATHS.INVENTORY);
  const transactions = readJSON(DB_PATHS.TRANSACTIONS);

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlyTransactions = transactions.filter(t => {
    const date = new Date(t.timestamp);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });

  const analytics = {
    totalItems: inventory.length,
    lowStockItems: inventory.filter(i => i.quantity <= 5).length,
    totalTransactions: monthlyTransactions.length,
    itemsConsumed: monthlyTransactions
      .filter(t => t.type === 'taken')
      .reduce((sum, t) => sum + t.quantity, 0),
    itemsAdded: monthlyTransactions
      .filter(t => t.type === 'added')
      .reduce((sum, t) => sum + t.quantity, 0),
    activeUsers: [...new Set(monthlyTransactions.map(t => t.user))].length,
    recentTransactions: transactions
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10),
    lowStockAlerts: inventory.filter(i => i.quantity <= 5)
  };

  res.json({
    success: true,
    analytics
  });
}));

export default router;