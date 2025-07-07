# WhatsApp Invoicing App - Deployment Guide

## Quick Start

Your WhatsApp Invoicing App is now complete and ready for deployment! This guide will help you get it running in production.

## What's Included

✅ **Complete Full-Stack Application**
- React frontend with professional UI
- Node.js/Express backend with all integrations
- Supabase database schema
- All necessary configuration files

✅ **Integrations Ready**
- WhatsApp messaging via Twilio
- QuickBooks synchronization
- Stripe subscription management
- User authentication with Supabase

✅ **Production Features**
- Responsive design for mobile/desktop
- Subscription-based access control
- Error handling and logging
- Security best practices

## Pre-Deployment Checklist

### 1. Supabase Setup
- [ ] Execute `supabase_setup.sql` in your Supabase project
- [ ] Enable Row Level Security (RLS)
- [ ] Create storage bucket for invoice attachments

### 2. Environment Variables
Update your production environment variables:

**Backend (.env)**
```env
SUPABASE_URL=your_production_supabase_url
SUPABASE_ANON_KEY=your_production_supabase_key
STRIPE_SECRET_KEY=your_production_stripe_key
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
QUICKBOOKS_COMPANY_ID=your_quickbooks_company_id
QUICKBOOKS_ACCESS_TOKEN=your_quickbooks_token
QUICKBOOKS_REFRESH_TOKEN=your_quickbooks_refresh_token
CLIENT_URL=https://your-frontend-domain.com
```

**Frontend (.env)**
```env
REACT_APP_API_URL=https://your-backend-domain.com
```

## Deployment Options

### Option 1: Heroku + Vercel (Recommended)

**Backend (Heroku):**
1. Create new Heroku app
2. Connect to your GitHub repository
3. Set environment variables in Heroku dashboard
4. Deploy from `server/` directory

**Frontend (Vercel):**
1. Connect GitHub repository to Vercel
2. Set build directory to `client/`
3. Set environment variables in Vercel dashboard
4. Deploy automatically

### Option 2: Railway + Netlify

**Backend (Railway):**
1. Connect GitHub repository
2. Set root directory to `server/`
3. Configure environment variables
4. Deploy

**Frontend (Netlify):**
1. Connect GitHub repository
2. Set build directory to `client/dist`
3. Set build command: `cd client && pnpm build`
4. Configure environment variables

### Option 3: DigitalOcean App Platform

1. Create new app from GitHub
2. Configure both frontend and backend services
3. Set environment variables
4. Deploy both services together

## Post-Deployment Steps

### 1. Stripe Webhook Configuration
- Set webhook endpoint: `https://your-backend-domain.com/api/subscription/webhook`
- Enable events: `checkout.session.completed`, `customer.subscription.updated`, etc.

### 2. QuickBooks App Configuration
- Update redirect URIs in QuickBooks Developer dashboard
- Set production OAuth endpoints

### 3. Twilio WhatsApp Setup
- Move from sandbox to production WhatsApp Business API
- Update webhook URLs if needed

### 4. Testing Checklist
- [ ] User registration/login works
- [ ] Invoice creation and management
- [ ] WhatsApp message sending
- [ ] Stripe subscription flow
- [ ] QuickBooks synchronization (for Pro users)

## Monitoring & Maintenance

### Logs to Monitor
- Supabase database logs
- Heroku/Railway application logs
- Stripe webhook events
- Twilio message delivery status

### Regular Maintenance
- Monitor subscription renewals
- Check QuickBooks token expiration
- Review WhatsApp message delivery rates
- Update dependencies monthly

## Troubleshooting

### Common Issues

**CORS Errors:**
- Ensure backend allows frontend domain in CORS settings
- Check environment variable `CLIENT_URL`

**Database Connection:**
- Verify Supabase URL and keys
- Check RLS policies are properly configured

**Payment Issues:**
- Confirm Stripe webhook endpoint is accessible
- Verify webhook secret matches environment variable

**WhatsApp Not Sending:**
- Check Twilio credentials and phone number format
- Verify WhatsApp Business API approval status

## Support

If you encounter any issues during deployment:

1. Check the application logs first
2. Verify all environment variables are set correctly
3. Ensure database schema is properly applied
4. Test API endpoints individually

## Security Notes

- Never commit `.env` files to version control
- Use strong, unique encryption keys
- Enable HTTPS for all production domains
- Regularly rotate API keys and tokens
- Monitor for suspicious activity in logs

## Performance Optimization

- Enable CDN for static assets
- Configure database connection pooling
- Set up Redis for session management (optional)
- Monitor API response times
- Implement rate limiting for public endpoints

Your WhatsApp Invoicing App is now ready for production! 🚀

