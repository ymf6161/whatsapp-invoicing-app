import { useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MessageSquare, Send } from 'lucide-react';

const SendWhatsAppModal = ({ isOpen, onClose, invoice, onSuccess }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSend = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/invoices/${invoice.id}/send-whatsapp`,
        { phone_number: phoneNumber },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setSuccess('Invoice sent successfully via WhatsApp!');
      if (onSuccess) onSuccess();
      
      setTimeout(() => {
        onClose();
        setPhoneNumber('');
        setSuccess('');
      }, 2000);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to send WhatsApp message');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPhoneNumber('');
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
            <MessageSquare className="h-5 w-5 text-green-600 mr-2" />
            Send Invoice via WhatsApp
          </DialogTitle>
          <DialogDescription>
            Send invoice {invoice.invoice_number} to your customer via WhatsApp
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
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
              {invoice.due_at && (
                <div className="flex justify-between">
                  <span>Due Date:</span>
                  <span>{new Date(invoice.due_at).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleSend} className="space-y-4">
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

            <div className="space-y-2">
              <Label htmlFor="phone">Customer Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1234567890"
                required
                disabled={loading || success}
              />
              <p className="text-xs text-gray-500">
                Include country code (e.g., +1 for US numbers)
              </p>
            </div>

            <div className="flex space-x-3">
              <Button
                type="submit"
                className="flex-1 bg-green-600 hover:bg-green-700"
                disabled={loading || success}
              >
                {loading ? (
                  'Sending...'
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send via WhatsApp
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>

          <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded">
            <strong>Note:</strong> This uses Twilio's WhatsApp sandbox for testing. 
            In production, you'll need to set up a verified WhatsApp Business account.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SendWhatsAppModal;

