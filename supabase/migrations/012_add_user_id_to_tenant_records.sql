-- Add user_id column to tenant_records to link with auth.users/public.users
-- This allows Renters to have a login account

ALTER TABLE public.tenant_records
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add index for performance on lookups
CREATE INDEX idx_tenant_records_user_id ON public.tenant_records(user_id);

-- Update RLS policies to allow the user themselves to view their record
CREATE POLICY "Users can view their own tenant record"
ON public.tenant_records
FOR SELECT
USING (
  auth.uid() = user_id
);
