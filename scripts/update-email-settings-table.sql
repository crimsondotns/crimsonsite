-- Update email_settings table to support multiple email addresses
ALTER TABLE public.email_settings 
DROP COLUMN IF EXISTS email_address,
ADD COLUMN IF NOT EXISTS email_addresses JSONB DEFAULT '[]'::jsonb;

-- Update alerts table to include alert type and percentage information
ALTER TABLE public.alerts 
ADD COLUMN IF NOT EXISTS alert_type TEXT DEFAULT 'price',
ADD COLUMN IF NOT EXISTS percentage_value DECIMAL;

-- Create index for better performance on email_addresses
CREATE INDEX IF NOT EXISTS email_settings_email_addresses_idx ON public.email_settings USING GIN (email_addresses);
