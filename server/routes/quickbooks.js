const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { authenticateUser, requirePaidSubscription } = require('../middleware/auth');
const QuickBooksService = require('../services/quickbooks');
const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Sync invoice to QuickBooks
router.post('/quickbooks/sync/:invoiceId', authenticateUser, requirePaidSubscription, async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const userId = req.user.id;

    // Get invoice details
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .eq('user_id', userId)
      .single();

    if (invoiceError || !invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Check if already synced
    if (invoice.sync_status === 'synced') {
      return res.status(400).json({ error: 'Invoice is already synced to QuickBooks' });
    }

    const quickbooksService = new QuickBooksService();
    const result = await quickbooksService.syncInvoice(userId, invoice);

    if (result.success) {
      res.json({
        message: 'Invoice synced to QuickBooks successfully',
        quickbooks_id: result.quickbooks_id
      });
    } else {
      res.status(400).json({
        error: 'Failed to sync invoice to QuickBooks',
        details: result.error
      });
    }
  } catch (error) {
    console.error('Error syncing to QuickBooks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get QuickBooks connection status
router.get('/quickbooks/status', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const quickbooksService = new QuickBooksService();
    const status = await quickbooksService.getConnectionStatus(userId);

    res.json(status);
  } catch (error) {
    console.error('Error getting QuickBooks status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Connect QuickBooks (OAuth callback handler)
router.post('/quickbooks/connect', authenticateUser, requirePaidSubscription, async (req, res) => {
  try {
    const { access_token, refresh_token, expires_in } = req.body;
    const userId = req.user.id;

    if (!access_token || !refresh_token) {
      return res.status(400).json({ error: 'Missing required OAuth tokens' });
    }

    const quickbooksService = new QuickBooksService();
    const result = await quickbooksService.connectQuickBooks(
      userId,
      access_token,
      refresh_token,
      expires_in || 3600
    );

    if (result.success) {
      res.json({ message: 'QuickBooks connected successfully' });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    console.error('Error connecting QuickBooks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Disconnect QuickBooks
router.delete('/quickbooks/disconnect', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;

    const { error } = await supabase
      .from('integrations')
      .delete()
      .eq('user_id', userId)
      .eq('integration_name', 'quickbooks');

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'QuickBooks disconnected successfully' });
  } catch (error) {
    console.error('Error disconnecting QuickBooks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get sync history
router.get('/quickbooks/sync-history', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const { data: syncHistory, error } = await supabase
      .from('sync_history')
      .select(`
        *,
        invoices (
          invoice_number,
          customer_name,
          total
        )
      `)
      .eq('user_id', userId)
      .order('sync_date', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ sync_history: syncHistory });
  } catch (error) {
    console.error('Error getting sync history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

