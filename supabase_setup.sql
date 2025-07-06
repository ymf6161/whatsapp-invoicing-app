-- Create the 'users' table
CREATE TABLE public.users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text UNIQUE NOT NULL,
  password text NOT NULL,
  phone text,
  subscription_status text DEFAULT 'free' NOT NULL,
  renewal_date timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- Create the 'invoices' table
CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  invoice_number text NOT NULL,
  customer_name text NOT NULL,
  total numeric NOT NULL,
  sync_status text DEFAULT 'pending' NOT NULL,
  issued_at timestamp with time zone DEFAULT now(),
  due_at timestamp with time zone,
  pdf_url text
);

-- Create the 'quotes' table
CREATE TABLE public.quotes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  quote_number text NOT NULL,
  customer_name text NOT NULL,
  total numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Create the 'customers' table
CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  phone text,
  address text,
  created_at timestamp with time zone DEFAULT now()
);

-- Create the 'products_services' table
CREATE TABLE public.products_services (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price numeric NOT NULL,
  type text NOT NULL, -- 'product' or 'service'
  created_at timestamp with time zone DEFAULT now()
);

-- Create the 'bot_settings' table
CREATE TABLE public.bot_settings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  setting_name text UNIQUE NOT NULL,
  setting_value text,
  created_at timestamp with time zone DEFAULT now()
);

-- Create the 'integrations' table
CREATE TABLE public.integrations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  integration_name text NOT NULL,
  access_token text NOT NULL,
  refresh_token text,
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- Create the 'sync_history' table
CREATE TABLE public.sync_history (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE CASCADE,
  sync_date timestamp with time zone DEFAULT now(),
  status text NOT NULL, -- 'success' or 'failed'
  message text
);

-- Create the 'bot_logs' table
CREATE TABLE public.bot_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  log_type text NOT NULL,
  message text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable Row Level Security (RLS) for tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for 'users' table
CREATE POLICY "Users can view their own user data." ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own user data." ON public.users FOR UPDATE USING (auth.uid() = id);

-- RLS policies for 'invoices' table
CREATE POLICY "Users can view their own invoices." ON public.invoices FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create invoices." ON public.invoices FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own invoices." ON public.invoices FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own invoices." ON public.invoices FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for 'quotes' table
CREATE POLICY "Users can view their own quotes." ON public.quotes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create quotes." ON public.quotes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own quotes." ON public.quotes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own quotes." ON public.quotes FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for 'customers' table
CREATE POLICY "Users can view their own customers." ON public.customers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create customers." ON public.customers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own customers." ON public.customers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own customers." ON public.customers FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for 'products_services' table
CREATE POLICY "Users can view their own products_services." ON public.products_services FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create products_services." ON public.products_services FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own products_services." ON public.products_services FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own products_services." ON public.products_services FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for 'bot_settings' table
CREATE POLICY "Users can view their own bot_settings." ON public.bot_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own bot_settings." ON public.bot_settings FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for 'integrations' table
CREATE POLICY "Users can view their own integrations." ON public.integrations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create integrations." ON public.integrations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own integrations." ON public.integrations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own integrations." ON public.integrations FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for 'sync_history' table
CREATE POLICY "Users can view their own sync_history." ON public.sync_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create sync_history." ON public.sync_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own sync_history." ON public.sync_history FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own sync_history." ON public.sync_history FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for 'bot_logs' table
CREATE POLICY "Users can view their own bot_logs." ON public.bot_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create bot_logs." ON public.bot_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own bot_logs." ON public.bot_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own bot_logs." ON public.bot_logs FOR DELETE USING (auth.uid() = user_id);

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public)
VALUES (
  'documents',
  'documents',
  TRUE
);

-- Set up storage policies (example: allow authenticated users to upload/download their own files)
CREATE POLICY "Allow authenticated users to upload their own files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated users to download their own files" ON storage.objects FOR SELECT USING (bucket_id = 'documents' AND auth.uid() IS NOT NULL);


