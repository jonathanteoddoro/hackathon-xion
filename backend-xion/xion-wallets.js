// xion-wallets.js
const { DirectSecp256k1HdWallet } = require("@cosmjs/proto-signing");
const { getCachedMnemonic } = require("./xion-connect");
require('dotenv').config();
const config = require('./config');

/**
 * Gets the wallet address from the mnemonic
 * Uses the cached mnemonic first, then falls back to environment variables
 * @returns {Promise<string>} The wallet address
 */
async function getMyAddress() {
  // First try to get the cached mnemonic
  let mnemonic = getCachedMnemonic();
  
  // If no cached mnemonic, try to get from environment variables
  if (!mnemonic) {
    mnemonic = process.env.MNEMONIC;
  }
  
  // If we still don't have a mnemonic, throw an error
  if (!mnemonic) {
    throw new Error("No mnemonic available - you need to call getSigningClient with a mnemonic first or set MNEMONIC environment variable");
  }
  
  const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
    prefix: "xion"
  });
  
  const [firstAccount] = await wallet.getAccounts();
  return firstAccount.address;
}

/**
 * Generates a new wallet (useful for creating recipient wallets for testing)
 * 
 * @returns {Promise<object>} Object containing mnemonic and address
 */
async function generateWallet() {
  const wallet = await DirectSecp256k1HdWallet.generate(24, {
    prefix: "xion" // XION address prefix
  });
  
  const [firstAccount] = await wallet.getAccounts();
  
  return {
    mnemonic: wallet.mnemonic,
    address: firstAccount.address
  };
}

/**
 * Gets address from a specific mnemonic
 * 
 * @param {string} mnemonic - The wallet mnemonic
 * @returns {Promise<string>} The wallet address
 */
async function getAddressFromMnemonic(mnemonic) {
  const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
    prefix: "xion" // XION address prefix
  });
  
  const [firstAccount] = await wallet.getAccounts();
  return firstAccount.address;
}

module.exports = {
  getMyAddress,
  generateWallet,
  getAddressFromMnemonic
};