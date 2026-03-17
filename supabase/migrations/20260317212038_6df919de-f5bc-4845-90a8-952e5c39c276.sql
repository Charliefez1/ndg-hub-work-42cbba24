DO $$
DECLARE
  barclays_id uuid;
  nhs_id uuid;
  deloitte_id uuid;
  proj1_id uuid;
  proj2_id uuid;
  proj3_id uuid;
  proj4_id uuid;
  proj5_id uuid;
  proj6_id uuid;
  svc_fundamentals_id uuid;
  svc_masterclass_id uuid;
  svc_thriving_id uuid;
  svc_summit_id uuid;
BEGIN
  SELECT id INTO barclays_id FROM public.organisations WHERE name = 'Barclays';
  SELECT id INTO nhs_id FROM public.organisations WHERE name = 'NHS England';
  SELECT id INTO deloitte_id FROM public.organisations WHERE name = 'Deloitte';
  SELECT id INTO svc_fundamentals_id FROM public.services WHERE name = 'Neurodiversity Fundamentals';
  SELECT id INTO svc_masterclass_id FROM public.services WHERE name = 'Manager Masterclass';
  SELECT id INTO svc_thriving_id FROM public.services WHERE name = 'Thriving at Work';
  SELECT id INTO svc_summit_id FROM public.services WHERE name = 'Neurodiversity Leadership Summit';

  INSERT INTO public.projects (name, organisation_id, status, budget, start_date, end_date, intended_neuro_phase)
  VALUES ('Neurodiversity Awareness Programme', barclays_id, 'delivery', 15000, '2026-01-15'::date, '2026-06-30'::date, 'needs')
  RETURNING id INTO proj1_id;

  INSERT INTO public.projects (name, organisation_id, status, budget, start_date, end_date, intended_neuro_phase)
  VALUES ('Manager Masterclass Series', barclays_id, 'project_planning', 24000, '2026-04-01'::date, '2026-09-30'::date, 'understand')
  RETURNING id INTO proj2_id;

  INSERT INTO public.projects (name, organisation_id, status, budget, start_date, end_date, intended_neuro_phase)
  VALUES ('NHS Inclusive Workplace Programme', nhs_id, 'delivery', 30000, '2026-02-01'::date, '2026-12-31'::date, 'engage')
  RETURNING id INTO proj3_id;

  INSERT INTO public.projects (name, organisation_id, status, budget, start_date, end_date, intended_neuro_phase)
  VALUES ('Clinical Staff Neurodiversity Training', nhs_id, 'contracting', 18000, '2026-05-01'::date, '2026-08-31'::date, 'understand')
  RETURNING id INTO proj4_id;

  INSERT INTO public.projects (name, organisation_id, status, budget, start_date, end_date, intended_neuro_phase)
  VALUES ('Deloitte Leadership Summit', deloitte_id, 'session_planning', 20000, '2026-03-01'::date, '2026-07-31'::date, 'realise')
  RETURNING id INTO proj5_id;

  INSERT INTO public.projects (name, organisation_id, status, budget, start_date, end_date, intended_neuro_phase)
  VALUES ('Inclusive Recruitment Workshop', deloitte_id, 'closed', 8000, '2025-10-01'::date, '2025-12-15'::date, 'ongoing')
  RETURNING id INTO proj6_id;

  INSERT INTO public.deliveries (title, project_id, organisation_id, service_id, status, delivery_date, duration_minutes, delegate_count, neuro_phase) VALUES
    ('Fundamentals Workshop - Cohort 1', proj1_id, barclays_id, svc_fundamentals_id, 'delivered', '2026-02-10'::date, 180, 25, 'needs'),
    ('Fundamentals Workshop - Cohort 2', proj1_id, barclays_id, svc_fundamentals_id, 'scheduled', '2026-04-15'::date, 180, 30, 'needs'),
    ('Fundamentals Workshop - Cohort 3', proj1_id, barclays_id, svc_fundamentals_id, 'planning', NULL, 180, NULL, 'needs'),
    ('Masterclass Session 1', proj2_id, barclays_id, svc_masterclass_id, 'planning', '2026-04-20'::date, 240, 15, 'understand'),
    ('Masterclass Session 2', proj2_id, barclays_id, svc_masterclass_id, 'planning', '2026-05-18'::date, 240, 15, 'understand'),
    ('NHS Awareness Day 1', proj3_id, nhs_id, svc_fundamentals_id, 'delivered', '2026-02-28'::date, 180, 40, 'engage'),
    ('NHS Awareness Day 2', proj3_id, nhs_id, svc_fundamentals_id, 'delivered', '2026-03-15'::date, 180, 35, 'engage'),
    ('NHS Thriving Workshop', proj3_id, nhs_id, svc_thriving_id, 'scheduled', '2026-04-25'::date, 180, 30, 'engage'),
    ('Leadership Summit Day 1', proj5_id, deloitte_id, svc_summit_id, 'scheduled', '2026-04-10'::date, 360, 50, 'realise'),
    ('Leadership Summit Day 2', proj5_id, deloitte_id, svc_summit_id, 'planning', '2026-04-11'::date, 360, 50, 'realise'),
    ('Recruitment Workshop', proj6_id, deloitte_id, svc_thriving_id, 'delivered', '2025-11-20'::date, 180, 20, 'ongoing');

  INSERT INTO public.tasks (title, project_id, status, priority, due_date) VALUES
    ('Finalise workshop materials', proj1_id, 'in_progress', 'high', '2026-03-20'::date),
    ('Book venue for Cohort 2', proj1_id, 'todo', 'medium', '2026-03-25'::date),
    ('Send delegate invitations', proj1_id, 'todo', 'medium', '2026-03-28'::date),
    ('Review masterclass curriculum', proj2_id, 'todo', 'high', '2026-03-30'::date),
    ('Prepare NHS case studies', proj3_id, 'in_progress', 'high', '2026-03-22'::date),
    ('Collect feedback from Day 1', proj3_id, 'done', 'medium', '2026-03-05'::date),
    ('Design summit agenda', proj5_id, 'in_progress', 'urgent', '2026-03-18'::date),
    ('Confirm keynote speakers', proj5_id, 'todo', 'high', '2026-03-25'::date),
    ('Final report for recruitment workshop', proj6_id, 'done', 'low', '2025-12-20'::date);

  INSERT INTO public.invoices (invoice_number, project_id, organisation_id, status, subtotal, vat_amount, total, issue_date, due_date, paid_date) VALUES
    ('NDG-2026-001', proj1_id, barclays_id, 'paid', 2500, 500, 3000, '2026-02-15'::date, '2026-03-15'::date, '2026-03-10'::date),
    ('NDG-2026-002', proj3_id, nhs_id, 'paid', 5000, 1000, 6000, '2026-03-01'::date, '2026-03-31'::date, '2026-03-25'::date),
    ('NDG-2026-003', proj3_id, nhs_id, 'sent', 2500, 500, 3000, '2026-03-16'::date, '2026-04-16'::date, NULL),
    ('NDG-2026-004', proj5_id, deloitte_id, 'draft', 8000, 1600, 9600, NULL, NULL, NULL),
    ('NDG-2025-010', proj6_id, deloitte_id, 'paid', 8000, 1600, 9600, '2025-12-01'::date, '2025-12-31'::date, '2025-12-28'::date);
END $$;