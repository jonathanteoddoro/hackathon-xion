const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// Import route modules
const walletRoutes = require('./routes/wallet');
const queryRoutes = require('./routes/query');
const transactionRoutes = require('./routes/transaction');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use('/api/wallet', walletRoutes);
app.use('/api/query', queryRoutes);
app.use('/api/transaction', transactionRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Xion API server running on port ${PORT}`);
});