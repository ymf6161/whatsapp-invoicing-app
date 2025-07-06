const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

class QuickBooksService {
  constructor() {
    this.baseURL = 'https://sandbox-quickbooks.api.intuit.com';
    this.companyId = process.env.QUICKBOOKS_COMPANY_ID;
  }

  async getAccessToken(userId) {
    try {
      // Get stored access token from integrations table
      const { data: integration, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('user_id', userId)
        .eq('integration_name', 'quickbooks')
        .single();

      if (error || !integration) {
        throw new Error('QuickBooks integration not found. Please connect your QuickBooks account.');
      }

      // Check if token is expired
      const now = new Date();
      const expiresAt = new Date(integration.expires_at);

      if (now >= expiresAt) {
        // Token is expired, refresh it
        return await this.refreshAccessToken(integration);
      }

      return integration.access_token;
    } catch (error) {
      console.error('Error getting access token:', error);
      throw error;
    }
  }

  async refreshAccessToken(integration) {
    try {
      // For demo purposes, we'll use the stored refresh token
      // In production, you'd implement proper OAuth refresh flow
      const response = await axios.post('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
        grant_type: 'refresh_token',
        refresh_token: integration.refresh_token
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${process.env.QUICKBOOKS_CLIENT_ID}:${process.env.QUICKBOOKS_CLIENT_SECRET}`).toString('base64')}`
        }
      });

      const { access_token, expires_in } = response.data;
      const expiresAt = new Date(Date.now() + expires_in * 1000);

      // Update the stored token
      await supabase
        .from('integrations')
        .update({
          access_token,
          expires_at: expiresAt.toISOString()
        })
        .eq('id', integration.id);

      return access_token;
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw new Error('Failed to refresh QuickBooks access token');
    }
  }

  async syncInvoice(userId, invoice) {
    try {
      const accessToken = await this.getAccessToken(userId);

      // First, check if customer exists or create one
      const customerId = await this.ensureCustomer(accessToken, invoice.customer_name);

      // Create invoice in QuickBooks
      const qbInvoice = {
        Line: [{
          Amount: parseFloat(invoice.total),
          DetailType: 'SalesItemLineDetail',
          SalesItemLineDetail: {
            ItemRef: {
              value: '1', // Default item - you might want to create/manage items
              name: 'Services'
            }
          }
        }],
        CustomerRef: {
          value: customerId
        },
        DueDate: invoice.due_at ? new Date(invoice.due_at).toISOString().split('T')[0] : undefined,
        DocNumber: invoice.invoice_number
      };

      const response = await axios.post(
        `${this.baseURL}/v3/company/${this.companyId}/invoice`,
        qbInvoice,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

      // Log the sync in sync_history
      await supabase
        .from('sync_history')
        .insert([
          {
            user_id: userId,
            invoice_id: invoice.id,
            status: 'success',
            message: `Invoice synced to QuickBooks with ID: ${response.data.QueryResponse?.Invoice?.[0]?.Id}`
          }
        ]);

      // Update invoice sync status
      await supabase
        .from('invoices')
        .update({ sync_status: 'synced' })
        .eq('id', invoice.id);

      return {
        success: true,
        quickbooks_id: response.data.QueryResponse?.Invoice?.[0]?.Id,
        message: 'Invoice synced successfully to QuickBooks'
      };
    } catch (error) {
      console.error('QuickBooks sync error:', error);

      // Log the failed sync
      await supabase
        .from('sync_history')
        .insert([
          {
            user_id: userId,
            invoice_id: invoice.id,
            status: 'failed',
            message: error.message
          }
        ]);

      // Update invoice sync status
      await supabase
        .from('invoices')
        .update({ sync_status: 'failed' })
        .eq('id', invoice.id);

      return {
        success: false,
        error: error.response?.data?.Fault?.Error?.[0]?.Detail || error.message
      };
    }
  }

  async ensureCustomer(accessToken, customerName) {
    try {
      // Search for existing customer
      const searchResponse = await axios.get(
        `${this.baseURL}/v3/company/${this.companyId}/query?query=SELECT * FROM Customer WHERE Name = '${customerName}'`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json'
          }
        }
      );

      const existingCustomer = searchResponse.data.QueryResponse?.Customer?.[0];
      if (existingCustomer) {
        return existingCustomer.Id;
      }

      // Create new customer
      const newCustomer = {
        Name: customerName,
        CompanyName: customerName
      };

      const createResponse = await axios.post(
        `${this.baseURL}/v3/company/${this.companyId}/customer`,
        newCustomer,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

      return createResponse.data.QueryResponse?.Customer?.[0]?.Id;
    } catch (error) {
      console.error('Error ensuring customer:', error);
      throw new Error('Failed to create/find customer in QuickBooks');
    }
  }

  async connectQuickBooks(userId, accessToken, refreshToken, expiresIn) {
    try {
      const expiresAt = new Date(Date.now() + expiresIn * 1000);

      // Store or update the integration
      const { data, error } = await supabase
        .from('integrations')
        .upsert([
          {
            user_id: userId,
            integration_name: 'quickbooks',
            access_token: accessToken,
            refresh_token: refreshToken,
            expires_at: expiresAt.toISOString()
          }
        ])
        .select();

      if (error) {
        throw error;
      }

      return {
        success: true,
        message: 'QuickBooks connected successfully'
      };
    } catch (error) {
      console.error('Error connecting QuickBooks:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getConnectionStatus(userId) {
    try {
      const { data: integration, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('user_id', userId)
        .eq('integration_name', 'quickbooks')
        .single();

      if (error || !integration) {
        return { connected: false };
      }

      // Check if token is still valid
      const now = new Date();
      const expiresAt = new Date(integration.expires_at);

      return {
        connected: true,
        expires_at: integration.expires_at,
        is_expired: now >= expiresAt
      };
    } catch (error) {
      console.error('Error checking connection status:', error);
      return { connected: false };
    }
  }
}

module.exports = QuickBooksService;

