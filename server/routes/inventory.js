import express from 'express';
import { readJSON, writeJSON, DB_PATHS } from '../config/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// Get all inventory items
router.get('/', authenticateToken, asyncHandler(async (req, res) => {
  const inventory = readJSON(DB_PATHS.INVENTORY);
  
  res.json({
    success: true,
    items: inventory
  });
}));

// Create inventory item (admin only)
router.post('/', authenticateToken, requireRole(['admin']), asyncHandler(async (req, res) => {
  const { name, make, model, specification, rack, bin, quantity } = req.body;

  if (!name || !make || !model || !specification || !rack || !bin || quantity === undefined) {
    return res.status(400).json({
      success: false,
      message: 'All fields are required'
    });
  }

  if (quantity < 0) {
    return res.status(400).json({
      success: false,
      message: 'Quantity cannot be negative'
    });
  }

  const inventory = readJSON(DB_PATHS.INVENTORY);
  const transactions = readJSON(DB_PATHS.TRANSACTIONS);

  const newItem = {
    id: Math.max(...inventory.map(i => i.id), 0) + 1,
    name,
    make,
    model,
    specification,
    rack,
    bin,
    quantity: parseInt(quantity),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    updatedBy: req.user.username
  };

  inventory.push(newItem);
  
  if (!writeJSON(DB_PATHS.INVENTORY, inventory)) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create inventory item'
    });
  }

  // Add transaction
  const transaction = {
    id: Math.max(...transactions.map(t => t.id), 0) + 1,
    itemId: newItem.id,
    itemName: name,
    type: 'added',
    quantity: parseInt(quantity),
    user: req.user.username,
    timestamp: new Date().toISOString()
  };
  
  transactions.push(transaction);
  writeJSON(DB_PATHS.TRANSACTIONS, transactions);

  res.status(201).json({
    success: true,
    item: newItem
  });
}));

// Update inventory item
router.put('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const itemId = parseInt(id);

  const inventory = readJSON(DB_PATHS.INVENTORY);
  const itemIndex = inventory.findIndex(i => i.id === itemId);
  
  if (itemIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Item not found'
    });
  }

  if (updates.quantity !== undefined && updates.quantity < 0) {
    return res.status(400).json({
      success: false,
      message: 'Quantity cannot be negative'
    });
  }

  const oldQuantity = inventory[itemIndex].quantity;
  
  inventory[itemIndex] = { 
    ...inventory[itemIndex], 
    ...updates, 
    updatedAt: new Date().toISOString(),
    updatedBy: req.user.username
  };

  if (!writeJSON(DB_PATHS.INVENTORY, inventory)) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update inventory item'
    });
  }

  // Add transaction if quantity changed
  if (updates.quantity !== undefined && updates.quantity !== oldQuantity) {
    const transactions = readJSON(DB_PATHS.TRANSACTIONS);
    const transaction = {
      id: Math.max(...transactions.map(t => t.id), 0) + 1,
      itemId: itemId,
      itemName: inventory[itemIndex].name,
      type: updates.quantity > oldQuantity ? 'added' : 'taken',
      quantity: Math.abs(updates.quantity - oldQuantity),
      user: req.user.username,
      timestamp: new Date().toISOString()
    };
    
    transactions.push(transaction);
    writeJSON(DB_PATHS.TRANSACTIONS, transactions);
  }

  res.json({
    success: true,
    item: inventory[itemIndex]
  });
}));

// Delete inventory item (admin only)
router.delete('/:id', authenticateToken, requireRole(['admin']), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const itemId = parseInt(id);

  const inventory = readJSON(DB_PATHS.INVENTORY);
  const itemIndex = inventory.findIndex(i => i.id === itemId);
  
  if (itemIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Item not found'
    });
  }

  const deletedItem = inventory[itemIndex];
  const filteredInventory = inventory.filter(i => i.id !== itemId);
  
  if (!writeJSON(DB_PATHS.INVENTORY, filteredInventory)) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete inventory item'
    });
  }

  // Add transaction
  const transactions = readJSON(DB_PATHS.TRANSACTIONS);
  const transaction = {
    id: Math.max(...transactions.map(t => t.id), 0) + 1,
    itemId: itemId,
    itemName: deletedItem.name,
    type: 'deleted',
    quantity: deletedItem.quantity,
    user: req.user.username,
    timestamp: new Date().toISOString()
  };
  
  transactions.push(transaction);
  writeJSON(DB_PATHS.TRANSACTIONS, transactions);

  res.json({
    success: true,
    message: 'Item deleted successfully'
  });
}));

export default router;