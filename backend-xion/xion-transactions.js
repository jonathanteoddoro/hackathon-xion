// xion-transactions.js
const { 
  getSigningClient: getConnectSigningClient,
  getCachedMnemonic 
} = require("./xion-connect");
const { getMyAddress } = require("./xion-wallets");
const config = require('./config');

/**
 * Sends tokens from your address to a recipient
 * Uses the cached mnemonic if available
 * 
 * @param {string} recipientAddress - The recipient's address
 * @param {string} amount - The amount to send
 * @param {string} denom - The token denomination (default: uxion)
 * @param {string} memo - Optional transaction memo
 * @returns {object} Transaction result with hash and gas usage
 */
async function sendTokens(recipientAddress, amount, denom = "uxion", memo = "") {
  // Check if we have a mnemonic available
  const mnemonic = getCachedMnemonic() || process.env.MNEMONIC;
  if (!mnemonic) {
    throw new Error("No mnemonic available. Please set one using /transaction/signing-client-by-phone/:phoneNumber first");
  }
  
  const client = await getConnectSigningClient(mnemonic);
  const senderAddress = await getMyAddress();
  
  const result = await client.sendTokens(
    senderAddress,
    recipientAddress,
    [{ denom, amount }],
    "auto", // fee calculation
    memo || "Transfer via XION backend"
  );
  
  return {
    transactionHash: result.transactionHash,
    gasUsed: result.gasUsed,
    gasWanted: result.gasWanted
  };
}

/**
 * Executes a smart contract function
 * 
 * @param {string} contractAddress - The contract address
 * @param {object} msg - The execute message in JSON format
 * @param {array} funds - Optional funds to send with the execution
 * @returns {object} Transaction result with hash and gas usage
 */
async function executeContract(contractAddress, msg, funds = []) {
  // Check if we have a mnemonic available
  const mnemonic = getCachedMnemonic() || process.env.MNEMONIC;
  if (!mnemonic) {
    throw new Error("No mnemonic available. Please set one using /transaction/signing-client-by-phone/:phoneNumber first");
  }
  
  const client = await getConnectSigningClient(mnemonic);
  const senderAddress = await getMyAddress();
  
  const result = await client.executeContract(
    senderAddress,
    contractAddress,
    msg,
    "auto",
    "Execute contract via XION backend",
    funds
  );
  
  return {
    transactionHash: result.transactionHash,
    gasUsed: result.gasUsed,
    gasWanted: result.gasWanted
  };
}

/**
 * Uploads a smart contract WASM binary
 * 
 * @param {Uint8Array} wasmBinary - The contract WASM binary
 * @returns {object} Upload result with code ID and transaction hash
 */
async function uploadContract(wasmBinary) {
  // Check if we have a mnemonic available
  const mnemonic = getCachedMnemonic() || process.env.MNEMONIC;
  if (!mnemonic) {
    throw new Error("No mnemonic available. Please set one using /transaction/signing-client-by-phone/:phoneNumber first");
  }
  
  const client = await getConnectSigningClient(mnemonic);
  const senderAddress = await getMyAddress();
  
  const result = await client.upload(
    senderAddress,
    wasmBinary,
    "auto"
  );
  
  return {
    codeId: result.codeId,
    transactionHash: result.transactionHash
  };
}

/**
 * Instantiates a smart contract from an uploaded code ID
 * 
 * @param {number} codeId - The uploaded contract code ID
 * @param {object} initMsg - Initialization message in JSON format
 * @param {string} label - Human-readable label for the contract
 * @param {array} funds - Optional funds to send with instantiation
 * @returns {object} Result with contract address and transaction hash
 */
async function instantiateContract(codeId, initMsg, label, funds = []) {
  // Check if we have a mnemonic available
  const mnemonic = getCachedMnemonic() || process.env.MNEMONIC;
  if (!mnemonic) {
    throw new Error("No mnemonic available. Please set one using /transaction/signing-client-by-phone/:phoneNumber first");
  }
  
  const client = await getConnectSigningClient(mnemonic);
  const senderAddress = await getMyAddress();
  
  const result = await client.instantiate(
    senderAddress,
    codeId,
    initMsg,
    label,
    "auto",
    { funds }
  );
  
  return {
    contractAddress: result.contractAddress,
    transactionHash: result.transactionHash
  };
}


module.exports = {
  sendTokens,
  executeContract,
  uploadContract,
  instantiateContract,
};