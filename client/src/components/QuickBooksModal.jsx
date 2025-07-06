import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { FileText, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';

const QuickBooksModal = ({ isOpen, onClose, invoice, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [connectionStatus, setConnectionStatus] = useState(null);

  useEffect(() => {
    if (isOpen) {
      checkConnectionStatus();
    }
  }, [isOpen]);

  const checkConnectionStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/quickbooks/status`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setConnectionStatus(response.data);
    } catch (error) {
      console.error('Error checking QuickBooks status:', error);
    }
  };

  const handleSync = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/quickbooks/sync/${invoice.id}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setSuccess('Invoice synced to QuickBooks successfully!');
      if (onSuccess) onSuccess();
      
      setTimeout(() => {
        onClose();
        setSuccess('');
      }, 2000);
    } catch (error) {
      if (error.response?.status === 403) {
        setError('This feature requires a Pro subscription. Please upgrade to sync with QuickBooks.');
      } else {
        setError(error.response?.data?.error || 'Failed to sync with QuickBooks');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = () => {
    // In a real implementation, this would redirect to QuickBooks OAuth
    setError('QuickBooks OAuth integration requires additional setup. Please contact support.');
  };

  const handleClose = () => {
    setError('');
    setSuccess('');
    onClose();
  };

  if (!invoice) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <FileText className="h-5 w-5 text-blue-600 mr-2" />
            Sync to QuickBooks
          </DialogTitle>
          <DialogDescription>
            Sync invoice {invoice.invoice_number} to your QuickBooks account
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Connection Status */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2 flex items-center">
              QuickBooks Connection Status
              {connectionStatus?.connected ? (
                <CheckCircle className="h-4 w-4 text-green-600 ml-2" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600 ml-2" />
              )}
            </h4>
            <div className="space-y-2">
              <Badge 
                variant={connectionStatus?.connected ? 'default' : 'destructive'}
                className="text-xs"
              >
                {connectionStatus?.connected ? 'Connected' : 'Not Connected'}
              </Badge>
              {connectionStatus?.connected && connectionStatus?.is_expired && (
                <p className="text-xs text-amber-600">
                  ⚠️ Connection expired. Please reconnect to QuickBooks.
                </p>
              )}
            </div>
          </div>

          {/* Invoice Preview */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Invoice Details:</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Invoice:</span>
                <span className="font-medium">{invoice.invoice_number}</span>
              </div>
              <div className="flex justify-between">
                <span>Customer:</span>
                <span>{invoice.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span>Amount:</span>
                <span className="font-medium">${parseFloat(invoice.total).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <Badge 
                  variant={invoice.sync_status === 'synced' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {invoice.sync_status}
                </Badge>
              </div>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          <div className="flex space-x-3">
            {!connectionStatus?.connected ? (
              <Button
                onClick={handleConnect}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Connect QuickBooks
              </Button>
            ) : invoice.sync_status === 'synced' ? (
              <Button
                variant="outline"
                className="flex-1"
                disabled
              >
                Already Synced
              </Button>
            ) : (
              <Button
                onClick={handleSync}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={loading || success || connectionStatus?.is_expired}
              >
                {loading ? 'Syncing...' : 'Sync to QuickBooks'}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Close
            </Button>
          </div>

          <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded">
            <strong>Note:</strong> This will create a new invoice in your QuickBooks account. 
            Make sure your QuickBooks account is properly configured with the necessary items and customers.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuickBooksModal;

