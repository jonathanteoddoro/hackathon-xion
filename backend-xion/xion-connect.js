// xion-connect.js
const { StargateClient, SigningStargateClient, GasPrice } = require("@cosmjs/stargate");
const { DirectSecp256k1HdWallet } = require("@cosmjs/proto-signing");
const config = require('./config');

// Validate configuration before proceeding
config.validateConfig();

// Mnemonic cache to store the last used mnemonic
let cachedMnemonic = null;

/**
 * Creates a read-only client for querying the blockchain
 * This client can be used for all operations that don't require signing
 */
async function getQueryClient() {
  return await StargateClient.connect(config.XION_RPC_URL);
}

/**
 * Gets the signing client for Xion blockchain
 * @param {string} mnemonic - Optional mnemonic to use (will override environment variable)
 * @returns {Promise<SigningCosmWasmClient>} The signing client
 */
async function getSigningClient(mnemonic = null) {
  try {
    // If mnemonic is provided, cache it for future use
    if (mnemonic) {
      cachedMnemonic = mnemonic;
      console.log("Mnemonic has been cached for future use");
    }
    
    // Use cached mnemonic if available, otherwise fallback to environment variable
    const mnemonicToUse = cachedMnemonic || process.env.MNEMONIC;
    
    if (!mnemonicToUse) {
      throw new Error("No mnemonic provided or cached");
    }
    
    // Create wallet from mnemonic
    const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonicToUse, {
      prefix: "xion" // XION address prefix
    });
    
    // Create and return a signing client
    return await SigningStargateClient.connectWithSigner(
      config.XION_RPC_URL,
      wallet,
      { gasPrice: GasPrice.fromString("0.025uxion") }
    );
  } catch (error) {
    console.error("Error creating signing client:", error);
    throw error;
  }
}

/**
 * Gets the currently cached mnemonic
 * @returns {string|null} The cached mnemonic or null if none is cached
 */
function getCachedMnemonic() {
  return cachedMnemonic;
}

/**
 * Clears the cached mnemonic
 */
function clearCachedMnemonic() {
  cachedMnemonic = null;
  console.log("Cached mnemonic has been cleared");
  return { success: true };
}

module.exports = {
  getQueryClient,
  getSigningClient,
  getCachedMnemonic,
  clearCachedMnemonic,
  CHAIN_ID: config.CHAIN_ID
};