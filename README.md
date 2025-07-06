# WhatsApp Invoicing App

A comprehensive SaaS application for creating, managing, and sending invoices via WhatsApp with QuickBooks integration.

## Features

### Core Features
- **User Authentication**: Secure signup/login with Supabase
- **Invoice Management**: Create, edit, and manage invoices
- **WhatsApp Integration**: Send invoices directly via WhatsApp using Twilio
- **QuickBooks Sync**: Automatic synchronization with QuickBooks Online
- **Subscription Management**: Freemium model with Stripe integration
- **Responsive Design**: Works on desktop and mobile devices

### Subscription Tiers
- **Free Plan**: Up to 5 invoices per month, basic WhatsApp integration
- **Pro Plan ($29/month)**: Unlimited invoices, QuickBooks sync, priority support

## Tech Stack

### Frontend
- React 18 with Vite
- Tailwind CSS for styling
- Shadcn/UI components
- Lucide React icons
- Axios for API calls

### Backend
- Node.js with Express
- Supabase for database and authentication
- Twilio for WhatsApp messaging
- Stripe for payment processing
- QuickBooks API integration

### Database
- PostgreSQL (via Supabase)
- Row Level Security (RLS) policies
- Real-time subscriptions

## Installation

### Prerequisites
- Node.js 18+ and npm/pnpm
- Supabase account
- Stripe account (test mode)
- Twilio account with WhatsApp sandbox
- QuickBooks Developer account

### Environment Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/ymf6161/whatsapp-invoicing-app.git
   cd whatsapp-invoicing-app
   ```

2. **Backend Setup**
   ```bash
   cd server
   npm install
   ```

   Create `.env` file in the server directory:
   ```env
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   STRIPE_SECRET_KEY=your_stripe_secret_key
   TWILIO_ACCOUNT_SID=your_twilio_account_sid
   TWILIO_AUTH_TOKEN=your_twilio_auth_token
   QUICKBOOKS_COMPANY_ID=your_quickbooks_company_id
   QUICKBOOKS_ACCESS_TOKEN=your_quickbooks_access_token
   QUICKBOOKS_REFRESH_TOKEN=your_quickbooks_refresh_token
   ENCRYPTION_KEY=your_32_character_encryption_key
   ```

3. **Frontend Setup**
   ```bash
   cd ../client
   pnpm install
   ```

   Create `.env` file in the client directory:
   ```env
   REACT_APP_API_URL=http://localhost:3001
   ```

4. **Database Setup**
   - Execute the SQL script in `supabase_setup.sql` in your Supabase project
   - This creates all necessary tables and RLS policies

### Running the Application

1. **Start the backend server**
   ```bash
   cd server
   npm start
   ```
   Server runs on http://localhost:3001

2. **Start the frontend development server**
   ```bash
   cd client
   pnpm dev
   ```
   Frontend runs on http://localhost:5173

## API Endpoints

### Authentication
- `POST /auth/signup` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout

### Invoices
- `GET /api/invoices` - Get user invoices
- `POST /api/invoices` - Create new invoice
- `PUT /api/invoices/:id` - Update invoice
- `DELETE /api/invoices/:id` - Delete invoice
- `POST /api/invoices/:id/send-whatsapp` - Send invoice via WhatsApp

### QuickBooks Integration
- `GET /api/quickbooks/status` - Get connection status
- `POST /api/quickbooks/connect` - Connect QuickBooks account
- `POST /api/quickbooks/sync/:invoiceId` - Sync invoice to QuickBooks
- `DELETE /api/quickbooks/disconnect` - Disconnect QuickBooks

### Subscription Management
- `GET /api/subscription/status` - Get subscription status
- `POST /api/subscription/create-checkout` - Create Stripe checkout session
- `POST /api/subscription/cancel` - Cancel subscription
- `POST /api/subscription/webhook` - Stripe webhook handler

## Database Schema

### Tables
- `users` - User accounts and subscription status
- `invoices` - Invoice data and metadata
- `integrations` - Third-party service connections
- `sync_history` - QuickBooks sync logs
- `bot_logs` - WhatsApp and system logs

### Storage
- `invoice_attachments` - File storage for invoice documents

## Deployment

### Backend Deployment (Heroku)
1. Create a new Heroku app
2. Set environment variables in Heroku dashboard
3. Deploy using Git or GitHub integration

### Frontend Deployment (Vercel)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Environment Variables for Production
- Update `REACT_APP_API_URL` to your production backend URL
- Set `CLIENT_URL` in backend to your production frontend URL
- Configure Stripe webhook endpoint for production

## Features in Detail

### WhatsApp Integration
- Uses Twilio's WhatsApp Business API
- Sends formatted invoice messages with customer details
- Supports both sandbox and production environments
- Logs all WhatsApp interactions

### QuickBooks Integration
- OAuth 2.0 authentication flow
- Automatic customer creation in QuickBooks
- Invoice synchronization with line items
- Token refresh handling
- Comprehensive error logging

### Subscription Management
- Stripe Checkout integration
- Webhook handling for subscription events
- Automatic feature gating based on subscription status
- Subscription cancellation and renewal

### Security Features
- Row Level Security (RLS) in Supabase
- JWT token authentication
- Environment variable protection
- CORS configuration
- Input validation and sanitization

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, email support@whatsappinvoicing.com or create an issue in the GitHub repository.

## Roadmap

- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Custom invoice templates
- [ ] Bulk invoice operations
- [ ] API rate limiting
- [ ] Advanced reporting features

