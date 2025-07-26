-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret-here';

-- Create portfolios table
CREATE TABLE IF NOT EXISTS public.portfolios (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    positions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create alerts table
CREATE TABLE IF NOT EXISTS public.alerts (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    position_id TEXT NOT NULL,
    token_symbol TEXT NOT NULL,
    token_name TEXT NOT NULL,
    contract_address TEXT NOT NULL,
    target_price DECIMAL NOT NULL,
    is_one_time BOOLEAN DEFAULT true,
    sound_enabled BOOLEAN DEFAULT true,
    sound_file TEXT,
    volume DECIMAL DEFAULT 0.5,
    browser_notification BOOLEAN DEFAULT false,
    email_notification BOOLEAN DEFAULT false,
    email_address TEXT,
    triggered BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_triggered TIMESTAMP WITH TIME ZONE
);

-- Create email_settings table
CREATE TABLE IF NOT EXISTS public.email_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    enabled BOOLEAN DEFAULT false,
    email_address TEXT NOT NULL,
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for portfolios
CREATE POLICY "Users can view their own portfolios" ON public.portfolios
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own portfolios" ON public.portfolios
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own portfolios" ON public.portfolios
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own portfolios" ON public.portfolios
    FOR DELETE USING (auth.uid() = user_id);

-- Create policies for alerts
CREATE POLICY "Users can view their own alerts" ON public.alerts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own alerts" ON public.alerts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own alerts" ON public.alerts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own alerts" ON public.alerts
    FOR DELETE USING (auth.uid() = user_id);

-- Create policies for email_settings
CREATE POLICY "Users can view their own email settings" ON public.email_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own email settings" ON public.email_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own email settings" ON public.email_settings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own email settings" ON public.email_settings
    FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS portfolios_user_id_idx ON public.portfolios(user_id);
CREATE INDEX IF NOT EXISTS alerts_user_id_idx ON public.alerts(user_id);
CREATE INDEX IF NOT EXISTS alerts_position_id_idx ON public.alerts(position_id);
CREATE INDEX IF NOT EXISTS email_settings_user_id_idx ON public.email_settings(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER handle_portfolios_updated_at
    BEFORE UPDATE ON public.portfolios
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_email_settings_updated_at
    BEFORE UPDATE ON public.email_settings
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
