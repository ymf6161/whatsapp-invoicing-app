import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Check, MessageSquare, FileText, Zap, CreditCard } from 'lucide-react';

const Subscription = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Check for success/cancel parameters from Stripe redirect
    if (searchParams.get('success') === 'true') {
      setSuccess('Payment successful! Your Pro subscription is now active.');
      // Refresh user data
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } else if (searchParams.get('canceled') === 'true') {
      setError('Payment was canceled. You can try again anytime.');
    }

    fetchSubscriptionStatus();
  }, [searchParams]);

  const fetchSubscriptionStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/subscription/status`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setSubscriptionStatus(response.data);
    } catch (error) {
      console.error('Error fetching subscription status:', error);
    }
  };

  const handleUpgrade = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/subscription/create-checkout`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Redirect to Stripe Checkout
      window.location.href = response.data.url;
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to create checkout session');
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel your subscription? You will lose access to Pro features at the end of your billing period.')) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/subscription/cancel`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setSuccess(response.data.message);
      fetchSubscriptionStatus();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to cancel subscription');
    } finally {
      setLoading(false);
    }
  };

  const features = {
    free: [
      'Up to 5 invoices per month',
      'Basic WhatsApp integration',
      'Simple invoice templates',
      'Email support'
    ],
    paid: [
      'Unlimited invoices',
      'Advanced WhatsApp integration',
      'QuickBooks sync',
      'Custom invoice templates',
      'Priority support',
      'Analytics dashboard',
      'Bulk invoice sending'
    ]
  };

  const isProUser = subscriptionStatus?.subscription_status === 'paid';

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Choose Your Plan</h1>
          <p className="text-lg text-gray-600">
            Start with our free plan or upgrade for unlimited features
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          {/* Free Plan */}
          <Card className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Free Plan</CardTitle>
                {!isProUser && <Badge variant="secondary">Current</Badge>}
              </div>
              <CardDescription>Perfect for getting started</CardDescription>
              <div className="mt-4">
                <span className="text-3xl font-bold">$0</span>
                <span className="text-gray-600">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {features.free.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <Check className="h-4 w-4 text-green-600 mr-3" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              {isProUser ? (
                <Button 
                  variant="outline" 
                  className="w-full mt-6"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Downgrade to Free'}
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  className="w-full mt-6"
                  onClick={() => navigate('/dashboard')}
                >
                  Continue with Free
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Paid Plan */}
          <Card className="relative border-green-200 shadow-lg">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-green-600 text-white">Most Popular</Badge>
            </div>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Pro Plan</CardTitle>
                {isProUser && <Badge variant="default">Current</Badge>}
              </div>
              <CardDescription>For growing businesses</CardDescription>
              <div className="mt-4">
                <span className="text-3xl font-bold">$29</span>
                <span className="text-gray-600">/month</span>
              </div>
              {subscriptionStatus?.renewal_date && isProUser && (
                <p className="text-xs text-gray-500 mt-2">
                  Renews on {new Date(subscriptionStatus.renewal_date).toLocaleDateString()}
                </p>
              )}
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {features.paid.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <Check className="h-4 w-4 text-green-600 mr-3" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              {isProUser ? (
                <Button 
                  variant="outline" 
                  className="w-full mt-6"
                  onClick={() => navigate('/dashboard')}
                >
                  Go to Dashboard
                </Button>
              ) : (
                <Button 
                  className="w-full mt-6 bg-green-600 hover:bg-green-700"
                  onClick={handleUpgrade}
                  disabled={loading}
                >
                  {loading ? (
                    'Processing...'
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Upgrade to Pro
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Feature Highlights */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-semibold mb-2">WhatsApp Integration</h3>
            <p className="text-sm text-gray-600">
              Send invoices directly through WhatsApp to your customers
            </p>
          </div>
          <div className="text-center">
            <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
              <FileText className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-semibold mb-2">QuickBooks Sync</h3>
            <p className="text-sm text-gray-600">
              Automatically sync your invoices with QuickBooks
            </p>
          </div>
          <div className="text-center">
            <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Zap className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-semibold mb-2">Fast & Reliable</h3>
            <p className="text-sm text-gray-600">
              Create and send invoices in seconds, not minutes
            </p>
          </div>
        </div>

        {/* Back to Dashboard */}
        <div className="mt-8 text-center">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard')}
            className="text-gray-600 hover:text-gray-900"
          >
            ← Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Subscription;

