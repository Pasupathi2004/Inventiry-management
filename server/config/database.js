import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database file paths
export const DB_PATHS = {
  USERS: path.join(__dirname, '..', 'data', 'users.json'),
  INVENTORY: path.join(__dirname, '..', 'data', 'inventory.json'),
  TRANSACTIONS: path.join(__dirname, '..', 'data', 'transactions.json')
};

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Helper functions for JSON file operations
export const readJSON = (filename) => {
  try {
    if (!fs.existsSync(filename)) {
      return [];
    }
    const data = fs.readFileSync(filename, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filename}:`, error);
    return [];
  }
};

export const writeJSON = (filename, data) => {
  try {
    fs.writeFileSync(filename, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error writing ${filename}:`, error);
    return false;
  }
};

// Initialize default data
export const initializeDatabase = async () => {
  try {
    // Initialize users with default admin (plain text password)
    if (!fs.existsSync(DB_PATHS.USERS)) {
      const defaultUsers = [
        {
          id: 1,
          username: 'pasu',
          password: '123', // Plain text password
          role: 'admin',
          createdAt: new Date().toISOString()
        }
      ];
      writeJSON(DB_PATHS.USERS, defaultUsers);
      console.log('Default admin user created: username=pasu, password=123');
    }

    // Initialize empty inventory
    if (!fs.existsSync(DB_PATHS.INVENTORY)) {
      writeJSON(DB_PATHS.INVENTORY, []);
    }

    // Initialize empty transactions
    if (!fs.existsSync(DB_PATHS.TRANSACTIONS)) {
      writeJSON(DB_PATHS.TRANSACTIONS, []);
    }
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};