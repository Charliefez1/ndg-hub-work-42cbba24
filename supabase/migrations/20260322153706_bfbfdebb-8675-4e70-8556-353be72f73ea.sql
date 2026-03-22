
ALTER TABLE public.partners DROP CONSTRAINT partners_type_check;
ALTER TABLE public.partners ADD CONSTRAINT partners_type_check CHECK (type = ANY (ARRAY['referral', 'delivery', 'technology', 'content', 'edi', 'wellbeing', 'other']));
