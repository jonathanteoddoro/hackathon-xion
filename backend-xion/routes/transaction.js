const express = require('express');
const fs = require('fs');
const { 
  sendTokens, 
  executeContract, 
  uploadContract, 
  instantiateContract,
} = require('../xion-transactions');

const { 
  getSigningClient,
  getCachedMnemonic,
  clearCachedMnemonic 
} = require('../xion-connect');
const { saveMemo, getMemoByPhone } = require('../database/db');

const router = express.Router();

// Send tokens to a recipient
router.post('/send', async (req, res, next) => {
  try {
    const { recipientAddress, amount, denom = 'uxion', memo = '' } = req.body;
    
    if (!recipientAddress || !amount) {
      return res.status(400).json({ 
        success: false, 
        error: 'Recipient address and amount are required' 
      });
    }
    
    const result = await sendTokens(recipientAddress, amount, denom, memo);
    
    // Custom JSON serialization
    const safeResult = JSON.parse(JSON.stringify(result, (key, value) => 
      typeof value === 'bigint' ? value.toString() : value
    ));
    
    res.json({ 
      success: true, 
      result: safeResult 
    });
  } catch (error) {
    // Improved error handling
    console.error('Send tokens error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    });
  }
});

// Execute a contract function
router.post('/execute-contract/:address', async (req, res, next) => {
  try {
    const { address } = req.params;
    const { msg, funds = [] } = req.body;
    
    if (!msg) {
      return res.status(400).json({ 
        success: false, 
        error: 'Execute message is required' 
      });
    }
    
    const result = await executeContract(address, msg, funds);
    res.json({ success: true, result });
  } catch (error) {
    next(error);
  }
});

// Upload a contract WASM file
router.post('/upload-contract', async (req, res, next) => {
  try {
    const { wasmPath } = req.body;
    
    if (!wasmPath) {
      return res.status(400).json({ 
        success: false, 
        error: 'WASM file path is required' 
      });
    }
    
    // Read WASM file from disk
    const wasmBinary = fs.readFileSync(wasmPath);
    
    const result = await uploadContract(wasmBinary);
    res.json({ success: true, result });
  } catch (error) {
    next(error);
  }
});

// Instantiate a contract
router.post('/instantiate-contract', async (req, res, next) => {
  try {
    const { codeId, initMsg, label, funds = [] } = req.body;
    
    if (!codeId || !initMsg || !label) {
      return res.status(400).json({ 
        success: false, 
        error: 'Code ID, initialization message, and label are required' 
      });
    }
    
    const result = await instantiateContract(codeId, initMsg, label, funds);
    res.json({ success: true, result });
  } catch (error) {
    next(error);
  }
});

// Save phone number with memo
router.post('/save-phone-memo', async (req, res, next) => {
  try {
    const { phoneNumber, memo } = req.body;
    
    if (!phoneNumber || !memo) {
      return res.status(400).json({ 
        success: false, 
        error: 'Phone number and memo are required' 
      });
    }
    
    const result = await saveMemo(phoneNumber, memo);
    res.json({ 
      success: true, 
      message: 'Phone number and memo saved successfully',
      data: result
    });
  } catch (error) {
    console.error('Save phone memo error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    });
  }
});

// Get signing client by phone number
router.get('/signing-client-by-phone/:phoneNumber', async (req, res, next) => {
  try {
    const { phoneNumber } = req.params;
    
    if (!phoneNumber) {
      return res.status(400).json({ 
        success: false, 
        error: 'Phone number is required' 
      });
    }
    
    // Get the memo associated with this phone number
    const memo = await getMemoByPhone(phoneNumber);
    
    if (!memo) {
      return res.status(404).json({ 
        success: false, 
        error: 'No memo found for this phone number' 
      });
    }
    
    // Use the memo as mnemonic to get the signing client 
    // This will also cache the mnemonic for future use
    const client = await getSigningClient(memo);
    
    res.json({ 
      success: true, 
      message: 'Signing client retrieved successfully and mnemonic cached for future transactions',
      phoneNumber,
      memoIsStored: !!getCachedMnemonic()
    });
  } catch (error) {
    console.error('Get signing client by phone error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    });
  }
});

// Clear cached mnemonic (useful for security purposes)
router.post('/clear-cached-mnemonic', async (req, res, next) => {
  try {
    const result = clearCachedMnemonic();
    res.json({ 
      success: result.success, 
      message: 'Cached mnemonic has been cleared'
    });
  } catch (error) {
    console.error('Clear cached mnemonic error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    });
  }
});

module.exports = router;