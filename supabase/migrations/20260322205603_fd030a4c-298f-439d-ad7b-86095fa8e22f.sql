
-- Phase B: Schema Alignment — Add missing columns from spec

-- 1. organisations: add logo_url
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS logo_url text;

-- 2. contacts: add first_name, last_name, linkedin_url (keep existing 'name' for backward compat)
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS first_name text;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS last_name text;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS linkedin_url text;

-- 3. tasks: add organisation_id (nullable for now, existing tasks lack it)
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS organisation_id uuid REFERENCES public.organisations(id);

-- 4. knowledge_articles: add organisation_id, author_id, is_published
ALTER TABLE public.knowledge_articles ADD COLUMN IF NOT EXISTS organisation_id uuid REFERENCES public.organisations(id);
ALTER TABLE public.knowledge_articles ADD COLUMN IF NOT EXISTS author_id uuid;
ALTER TABLE public.knowledge_articles ADD COLUMN IF NOT EXISTS is_published boolean DEFAULT false;

-- 5. emails: add contact_id, status, body, sent_at
ALTER TABLE public.emails ADD COLUMN IF NOT EXISTS contact_id uuid REFERENCES public.contacts(id);
ALTER TABLE public.emails ADD COLUMN IF NOT EXISTS status text DEFAULT 'received';
ALTER TABLE public.emails ADD COLUMN IF NOT EXISTS body text;
ALTER TABLE public.emails ADD COLUMN IF NOT EXISTS sent_at timestamptz;

-- 6. meetings: add transcript, analysis
ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS transcript text;
ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS analysis jsonb;

-- 7. contracts: add document_url, notes
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS document_url text;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS notes text;

-- 8. forms: add organisation_id, public_token
ALTER TABLE public.forms ADD COLUMN IF NOT EXISTS organisation_id uuid REFERENCES public.organisations(id);
ALTER TABLE public.forms ADD COLUMN IF NOT EXISTS public_token text UNIQUE;

-- 9. form_responses: add submitted_by, satisfaction_score
ALTER TABLE public.form_responses ADD COLUMN IF NOT EXISTS submitted_by uuid;
ALTER TABLE public.form_responses ADD COLUMN IF NOT EXISTS satisfaction_score numeric;

-- 10. curriculum_workshops: add description
ALTER TABLE public.curriculum_workshops ADD COLUMN IF NOT EXISTS description text;

-- 11. partners: add notes
ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS notes text;

-- 12. sessions: add notes
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS notes text;
