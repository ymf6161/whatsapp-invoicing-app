const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const invoiceRoutes = require('./routes/invoices');
const quickbooksRoutes = require('./routes/quickbooks');
const subscriptionRoutes = require('./routes/subscription');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());

// Special handling for Stripe webhooks (raw body)
app.use('/api/subscription/webhook', express.raw({ type: 'application/json' }));

// Regular JSON parsing for other routes
app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/api', invoiceRoutes);
app.use('/api', quickbooksRoutes);
app.use('/api', subscriptionRoutes);

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ message: 'WhatsApp Invoicing App API is running!' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});

