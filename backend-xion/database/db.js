const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to database or create it if it doesn't exist
const dbPath = path.join(__dirname, '../data/phone_memos.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    createTables();
  }
});

// Create tables if they don't exist
function createTables() {
  db.run(`
    CREATE TABLE IF NOT EXISTS phone_memos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone_number TEXT UNIQUE NOT NULL,
      memo TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Error creating tables:', err.message);
    } else {
      console.log('Tables created or already exist');
    }
  });
}

// Save a phone number and memo
function saveMemo(phoneNumber, memo) {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO phone_memos (phone_number, memo)
      VALUES (?, ?)
      ON CONFLICT(phone_number) DO UPDATE SET
      memo = excluded.memo,
      created_at = CURRENT_TIMESTAMP
    `;
    
    db.run(sql, [phoneNumber, memo], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID });
      }
    });
  });
}

// Get a memo by phone number
function getMemoByPhone(phoneNumber) {
  return new Promise((resolve, reject) => {
    const sql = `SELECT memo FROM phone_memos WHERE phone_number = ?`;
    
    db.get(sql, [phoneNumber], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row ? row.memo : null);
      }
    });
  });
}

// Delete all records from phone_memos table
function deleteAllMemos() {
  return new Promise((resolve, reject) => {
    const sql = `DELETE FROM phone_memos`;
    
    db.run(sql, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ 
          success: true,
          rowsDeleted: this.changes 
        });
      }
    });
  });
}

module.exports = {
  saveMemo,
  getMemoByPhone,
  deleteAllMemos
};
