const express = require('express');
const { 
  getBalance, 
  getAccount, 
  getTransaction, 
  getBlock, 
  getChainHeight,
  queryContract 
} = require('../xion-queries');

const router = express.Router();

// Get token balance
router.get('/balance/:address', async (req, res, next) => {
  try {
    const { address } = req.params;
    const { denom = 'uxion' } = req.query;
    
    const balance = await getBalance(address, denom);
    res.json({ success: true, address, denom, balance });
  } catch (error) {
    next(error);
  }
});

// Get account details
router.get('/account/:address', async (req, res, next) => {
  try {
    const { address } = req.params;
    const account = await getAccount(address);
    res.json({ success: true, account });
  } catch (error) {
    next(error);
  }
});

// Get transaction details
router.get('/transaction/:hash', async (req, res, next) => {
  try {
    const { hash } = req.params;
    const transaction = await getTransaction(hash);
    res.json({ success: true, transaction });
  } catch (error) {
    next(error);
  }
});

// Get block details
router.get('/block', async (req, res, next) => {
  try {
    const { height } = req.query;
    const block = await getBlock(height ? parseInt(height) : undefined);
    res.json({ success: true, block });
  } catch (error) {
    next(error);
  }
});

// Get current chain height
router.get('/height', async (req, res, next) => {
  try {
    const height = await getChainHeight();
    res.json({ success: true, height });
  } catch (error) {
    next(error);
  }
});

// Query smart contract
router.post('/contract/:address', async (req, res, next) => {
  try {
    const { address } = req.params;
    const queryMsg = req.body;
    
    if (!queryMsg) {
      return res.status(400).json({ success: false, error: 'Query message is required' });
    }
    
    const result = await queryContract(address, queryMsg);
    res.json({ success: true, result });
  } catch (error) {
    next(error);
  }
});

module.exports = router;