import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, DollarSign, Clock, MessageSquare, Send, BookOpen } from 'lucide-react';
import SendWhatsAppModal from '../components/SendWhatsAppModal';
import QuickBooksModal from '../components/QuickBooksModal';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [whatsappModal, setWhatsappModal] = useState({ isOpen: false, invoice: null });
  const [quickbooksModal, setQuickbooksModal] = useState({ isOpen: false, invoice: null });
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (!userData || !token) {
      navigate('/login');
      return;
    }

    setUser(JSON.parse(userData));
    fetchInvoices();
  }, [navigate]);

  const fetchInvoices = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/invoices`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInvoices(response.data.invoices || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleSendWhatsApp = (invoice) => {
    setWhatsappModal({ isOpen: true, invoice });
  };

  const handleSyncQuickBooks = (invoice) => {
    setQuickbooksModal({ isOpen: true, invoice });
  };

  const handleWhatsAppSuccess = () => {
    // Optionally refresh invoices or show success message
    fetchInvoices();
  };

  const handleQuickBooksSuccess = () => {
    // Refresh invoices to update sync status
    fetchInvoices();
  };

  const stats = {
    total: invoices.length,
    paid: invoices.filter(inv => inv.sync_status === 'synced').length,
    pending: invoices.filter(inv => inv.sync_status === 'pending').length,
    totalAmount: invoices.reduce((sum, inv) => sum + parseFloat(inv.total || 0), 0)
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img 
                src="/src/assets/logo.png" 
                alt="WhatsApp Invoicing" 
                className="h-8 w-8 mr-3"
              />
              <h1 className="text-xl font-semibold text-gray-900">WhatsApp Invoicing</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Badge 
                variant={user?.subscription_status === 'paid' ? 'default' : 'secondary'}
                className={user?.subscription_status === 'paid' ? 'bg-green-600' : ''}
              >
                {user?.subscription_status === 'paid' ? 'Pro' : 'Free'}
              </Badge>
              <span className="text-sm text-gray-600 hidden sm:block">{user?.email}</span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalAmount.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Paid</CardTitle>
              <div className="h-4 w-4 bg-green-500 rounded-full" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.paid}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Invoices List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Recent Invoices</CardTitle>
                    <CardDescription>Your latest invoicing activity</CardDescription>
                  </div>
                  <Button 
                    onClick={() => navigate('/invoices/create')}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Invoice
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {invoices.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices yet</h3>
                    <p className="text-gray-600 mb-4">Create your first invoice to get started</p>
                    <Button 
                      onClick={() => navigate('/invoices/create')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Invoice
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {invoices.slice(0, 5).map((invoice) => (
                      <div key={invoice.id} className="invoice-card animate-fade-in p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{invoice.invoice_number}</h4>
                            <p className="text-sm text-gray-600">{invoice.customer_name}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(invoice.issued_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="text-right">
                              <p className="font-medium">${parseFloat(invoice.total).toFixed(2)}</p>
                              <Badge 
                                variant={invoice.sync_status === 'synced' ? 'default' : 'secondary'}
                                className={`text-xs ${
                                  invoice.sync_status === 'synced' 
                                    ? 'status-badge-synced' 
                                    : invoice.sync_status === 'failed'
                                    ? 'status-badge-failed'
                                    : 'status-badge-pending'
                                }`}
                              >
                                {invoice.sync_status}
                              </Badge>
                            </div>
                            <div className="flex space-x-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSendWhatsApp(invoice)}
                                className="text-green-600 border-green-200 hover:bg-green-50 transition-colors"
                                title="Send via WhatsApp"
                              >
                                <Send className="h-3 w-3" />
                              </Button>
                              {user?.subscription_status === 'paid' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleSyncQuickBooks(invoice)}
                                  className="text-blue-600 border-blue-200 hover:bg-blue-50 transition-colors"
                                  title="Sync to QuickBooks"
                                  disabled={invoice.sync_status === 'synced'}
                                >
                                  <BookOpen className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks and shortcuts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/invoices/create')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Invoice
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/customers')}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Manage Customers
                </Button>
                {user?.subscription_status === 'free' && (
                  <Button 
                    variant="outline" 
                    className="w-full justify-start border-green-200 text-green-700"
                    onClick={() => navigate('/subscription')}
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Upgrade to Pro
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* WhatsApp Send Modal */}
      <SendWhatsAppModal
        isOpen={whatsappModal.isOpen}
        onClose={() => setWhatsappModal({ isOpen: false, invoice: null })}
        invoice={whatsappModal.invoice}
        onSuccess={handleWhatsAppSuccess}
      />

      {/* QuickBooks Sync Modal */}
      <QuickBooksModal
        isOpen={quickbooksModal.isOpen}
        onClose={() => setQuickbooksModal({ isOpen: false, invoice: null })}
        invoice={quickbooksModal.invoice}
        onSuccess={handleQuickBooksSuccess}
      />
    </div>
  );
};

export default Dashboard;

