// xion-queries.js
const { getQueryClient } = require("./xion-connect");

/**
 * Gets an account's balance for a specific token
 * 
 * @param {string} address - The account address to check
 * @param {string} denom - The token denomination (default: uxion)
 * @returns {string} The account balance amount
 */
async function getBalance(address, denom = "uxion") {
  const client = await getQueryClient();
  const balance = await client.getBalance(address, denom);
  return balance.amount;
}

/**
 * Gets detailed account information
 * 
 * @param {string} address - The account address to check
 * @returns {object} Account information including sequence numbers
 */
async function getAccount(address) {
  const client = await getQueryClient();
  return await client.getAccount(address);
}

/**
 * Gets transaction details by hash
 * 
 * @param {string} hash - The transaction hash
 * @returns {object} Complete transaction details
 */
async function getTransaction(hash) {
  const client = await getQueryClient();
  return await client.getTx(hash);
}

/**
 * Gets block data at a specific height
 * If no height is provided, gets the latest block
 * 
 * @param {number} height - The block height (optional)
 * @returns {object} Block data including transactions
 */
async function getBlock(height) {
  const client = await getQueryClient();
  return await client.getBlock(height);
}

/**
 * Gets the current blockchain height
 * 
 * @returns {number} The current block height
 */
async function getChainHeight() {
  const client = await getQueryClient();
  return await client.getHeight();
}

/**
 * Queries a smart contract
 * 
 * @param {string} contractAddress - The contract address
 * @param {object} queryMsg - The query message in JSON format
 * @returns {object} Query result from the contract
 */
async function queryContract(contractAddress, queryMsg) {
  const client = await getQueryClient();
  return await client.queryContractSmart(contractAddress, queryMsg);
}

module.exports = {
  getBalance,
  getAccount,
  getTransaction,
  getBlock,
  getChainHeight,
  queryContract
};