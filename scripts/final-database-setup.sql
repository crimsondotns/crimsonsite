-- Final database setup with all required tables and policies

-- Update email_settings table structure
ALTER TABLE public.email_settings 
DROP COLUMN IF EXISTS email_address,
ADD COLUMN IF NOT EXISTS email_addresses JSONB DEFAULT '[]'::jsonb;

-- Update alerts table with new fields
ALTER TABLE public.alerts 
ADD COLUMN IF NOT EXISTS alert_type TEXT DEFAULT 'price',
ADD COLUMN IF NOT EXISTS percentage_value DECIMAL;

-- Create admin_settings table for admin configuration
CREATE TABLE IF NOT EXISTS public.admin_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    password_hash TEXT NOT NULL,
    admin_email TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert default admin settings (password: admin123)
INSERT INTO public.admin_settings (password_hash, admin_email) 
VALUES ('$2b$10$rOvHPGkwxAFBNVnAeN8.2eKJ9Z8qF5vN3mF2sL8pQ7wX9yT6uE4vK', 'admin@cryptoportfolio.com')
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS email_settings_email_addresses_idx ON public.email_settings USING GIN (email_addresses);
CREATE INDEX IF NOT EXISTS alerts_alert_type_idx ON public.alerts(alert_type);
CREATE INDEX IF NOT EXISTS alerts_percentage_value_idx ON public.alerts(percentage_value);

-- Enable RLS on admin_settings
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for admin_settings (read-only for authenticated users)
CREATE POLICY "Admin settings are readable by authenticated users" ON public.admin_settings
    FOR SELECT USING (auth.role() = 'authenticated');

-- Update triggers
CREATE TRIGGER handle_admin_settings_updated_at
    BEFORE UPDATE ON public.admin_settings
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
