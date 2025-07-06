const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { authenticateUser, requirePaidSubscription } = require('../middleware/auth');
const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Create invoice endpoint
router.post('/invoices/create', authenticateUser, async (req, res) => {
  try {
    const { customer_name, total, due_at, description } = req.body;
    const user_id = req.user.id;

    // Check if user is on free plan and has reached limit
    if (req.user.subscription_status === 'free') {
      const { data: existingInvoices, error: countError } = await supabase
        .from('invoices')
        .select('id')
        .eq('user_id', user_id);

      if (countError) {
        return res.status(400).json({ error: countError.message });
      }

      if (existingInvoices.length >= 5) {
        return res.status(403).json({ 
          error: 'Free plan limit reached. Upgrade to Pro for unlimited invoices.',
          limit_reached: true
        });
      }
    }

    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}`;

    const { data: invoice, error } = await supabase
      .from('invoices')
      .insert([
        {
          user_id,
          invoice_number: invoiceNumber,
          customer_name,
          total: parseFloat(total),
          due_at: due_at ? new Date(due_at).toISOString() : null,
          sync_status: 'pending'
        }
      ])
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({
      message: 'Invoice created successfully',
      invoice
    });
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// List invoices endpoint
router.get('/invoices', authenticateUser, async (req, res) => {
  try {
    const user_id = req.user.id;
    const { page = 1, limit = 10, status } = req.query;
    
    let query = supabase
      .from('invoices')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('sync_status', status);
    }

    const { data: invoices, error } = await query
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user_id);

    if (countError) {
      return res.status(400).json({ error: countError.message });
    }

    res.json({
      invoices,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single invoice endpoint
router.get('/invoices/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    const { data: invoice, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', id)
      .eq('user_id', user_id)
      .single();

    if (error) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json({ invoice });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update invoice endpoint
router.put('/invoices/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;
    const { customer_name, total, due_at, sync_status } = req.body;

    const updateData = {};
    if (customer_name !== undefined) updateData.customer_name = customer_name;
    if (total !== undefined) updateData.total = parseFloat(total);
    if (due_at !== undefined) updateData.due_at = due_at ? new Date(due_at).toISOString() : null;
    if (sync_status !== undefined) updateData.sync_status = sync_status;

    const { data: invoice, error } = await supabase
      .from('invoices')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user_id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      message: 'Invoice updated successfully',
      invoice
    });
  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete invoice endpoint
router.delete('/invoices/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id)
      .eq('user_id', user_id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send invoice via WhatsApp endpoint
router.post('/invoices/:id/send-whatsapp', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { phone_number } = req.body;
    const user_id = req.user.id;

    if (!phone_number) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // Get invoice details
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', id)
      .eq('user_id', user_id)
      .single();

    if (invoiceError) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Send via WhatsApp using Twilio
    const WhatsAppService = require('../services/whatsapp');
    const whatsappService = new WhatsAppService();
    
    const result = await whatsappService.sendInvoiceMessage(phone_number, invoice);

    if (result.success) {
      // Log the successful send
      await supabase
        .from('bot_logs')
        .insert([
          {
            user_id,
            log_type: 'whatsapp_send',
            message: `Invoice ${invoice.invoice_number} sent to ${phone_number}`
          }
        ]);

      res.json({
        message: 'Invoice sent via WhatsApp successfully',
        invoice_id: id,
        phone_number,
        whatsapp_message_id: result.messageId
      });
    } else {
      res.status(400).json({
        error: 'Failed to send WhatsApp message',
        details: result.error
      });
    }
  } catch (error) {
    console.error('Error sending invoice via WhatsApp:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

