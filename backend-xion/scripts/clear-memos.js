/**
 * Script to delete all records from the phone_memos table
 * 
 * Run with: node scripts/clear-memos.js
 */

const { deleteAllMemos } = require('../database/db');

async function clearDatabase() {
  try {
    console.log('Clearing all phone memos from database...');
    const result = await deleteAllMemos();
    
    if (result.success) {
      console.log(`Successfully deleted ${result.rowsDeleted} record(s) from phone_memos table.`);
    } else {
      console.error('Failed to delete records.');
    }
  } catch (error) {
    console.error('Error while clearing database:', error.message);
  } finally {
    // Force exit to close the database connection
    process.exit(0);
  }
}

// Run the script
clearDatabase();
