// config.js
require('dotenv').config();

module.exports = {
  // Network configuration
  XION_RPC_URL: process.env.XION_RPC_URL || "https://rpc.xion-testnet-2.burnt.com",
  CHAIN_ID: process.env.XION_CHAIN_ID || "xion-testnet-2",
  
  // Wallet configuration
  
  // Make sure we have required values
  validateConfig: function() {
    if (!this.XION_RPC_URL) {
      throw new Error("XION_RPC_URL is required in .env file");
    }
    return true;
  }
};