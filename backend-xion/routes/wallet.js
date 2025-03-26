const express = require("express");
const { getMyAddress } = require("../xion-wallets");
const { getCachedMnemonic } = require("../xion-connect");

const router = express.Router();

// Get wallet address
router.get("/address", async (req, res, next) => {
  try {
    // Check if we have a cached mnemonic
    const hasCachedMnemonic = !!getCachedMnemonic();
    
    if (!hasCachedMnemonic && !process.env.MNEMONIC) {
      return res.status(400).json({
        success: false,
        error: "No mnemonic available. Please set one using /transaction/signing-client-by-phone/:phoneNumber first"
      });
    }
    
    const address = await getMyAddress();
    res.json({ 
      success: true, 
      address,
      usingCachedMnemonic: hasCachedMnemonic
    });
  } catch (error) {
    console.error("Error getting wallet address:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Internal server error"
    });
  }
});

module.exports = router;