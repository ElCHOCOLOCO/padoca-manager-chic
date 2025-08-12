-- Create entradas table for monetary inputs per institute and user
CREATE TABLE IF NOT EXISTS public.entradas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  institute_id text NOT NULL,
  entry_date date NOT NULL DEFAULT (now()::date),
  period text NOT NULL DEFAULT 'daily',
  amount numeric NOT NULL CHECK (amount >= 0),
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.entradas ENABLE ROW LEVEL SECURITY;

-- RLS Policies: access restricted to current institute or admin
CREATE POLICY IF NOT EXISTS "p_entradas_select_by_institute_or_admin"
ON public.entradas
FOR SELECT
USING (
  institute_id = public.get_current_user_institute() OR public.get_current_user_role() = 'admin'
);

CREATE POLICY IF NOT EXISTS "p_entradas_insert_by_institute_or_admin"
ON public.entradas
FOR INSERT
WITH CHECK (
  institute_id = public.get_current_user_institute() OR public.get_current_user_role() = 'admin'
);

CREATE POLICY IF NOT EXISTS "p_entradas_update_by_institute_or_admin"
ON public.entradas
FOR UPDATE
USING (
  institute_id = public.get_current_user_institute() OR public.get_current_user_role() = 'admin'
)
WITH CHECK (
  institute_id = public.get_current_user_institute() OR public.get_current_user_role() = 'admin'
);

CREATE POLICY IF NOT EXISTS "p_entradas_delete_by_institute_or_admin"
ON public.entradas
FOR DELETE
USING (
  institute_id = public.get_current_user_institute() OR public.get_current_user_role() = 'admin'
);

-- Update trigger for updated_at
CREATE TRIGGER update_entradas_updated_at
BEFORE UPDATE ON public.entradas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_entradas_institute_date ON public.entradas (institute_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_entradas_user ON public.entradas (user_id);

-- Validate period values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'entradas_period_valid'
  ) THEN
    ALTER TABLE public.entradas
      ADD CONSTRAINT entradas_period_valid CHECK (period IN ('daily','weekly','monthly'));
  END IF;
END $$;