-- Enable pg_cron extension (requires Supabase Pro plan)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Invoice overdue check (daily 9am UTC)
-- Sets invoices to 'overdue' if past due_date and still 'sent'
SELECT cron.schedule(
  'invoice-overdue-check',
  '0 9 * * *',
  $$
  UPDATE invoices
  SET status = 'overdue', updated_at = now()
  WHERE status = 'sent'
    AND due_date < CURRENT_DATE;

  -- Create notifications for overdue invoices
  INSERT INTO notifications (user_id, type, title, body, entity_type, entity_id)
  SELECT p.owner_id, 'invoice_overdue',
    'Invoice overdue: ' || i.invoice_number,
    'Invoice ' || i.invoice_number || ' is past due (' || i.due_date || '). Total: £' || i.total,
    'invoice', i.id
  FROM invoices i
  JOIN projects p ON p.id = i.project_id
  WHERE i.status = 'overdue'
    AND i.due_date = CURRENT_DATE - INTERVAL '1 day'
    AND p.owner_id IS NOT NULL;
  $$
);

-- Task overdue check (daily 8am UTC)
-- Notifies assignees of overdue tasks
SELECT cron.schedule(
  'task-overdue-check',
  '0 8 * * *',
  $$
  INSERT INTO notifications (user_id, type, title, body, entity_type, entity_id)
  SELECT t.assignee, 'task_assigned',
    'Task overdue: ' || t.title,
    'Task "' || t.title || '" was due on ' || t.due_date,
    'task', t.id
  FROM tasks t
  WHERE t.status NOT IN ('done', 'blocked')
    AND t.due_date < CURRENT_DATE
    AND t.assignee IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM notifications n
      WHERE n.entity_id = t.id
        AND n.type = 'task_assigned'
        AND n.created_at > CURRENT_DATE - INTERVAL '1 day'
    );
  $$
);

-- Delivery reminder (daily 6pm UTC)
-- Reminds facilitators of tomorrow's scheduled deliveries
SELECT cron.schedule(
  'delivery-reminder',
  '0 18 * * *',
  $$
  INSERT INTO notifications (user_id, type, title, body, entity_type, entity_id)
  SELECT d.facilitator_id, 'delivery_reminder',
    'Workshop tomorrow: ' || d.title,
    'You have "' || d.title || '" scheduled for tomorrow (' || d.delivery_date || '). Location: ' || COALESCE(d.location, 'TBC'),
    'delivery', d.id
  FROM deliveries d
  WHERE d.status IN ('scheduled', 'in_progress')
    AND d.delivery_date = CURRENT_DATE + INTERVAL '1 day'
    AND d.facilitator_id IS NOT NULL;
  $$
);

-- AI cache cleanup (weekly Sunday 2am UTC)
-- Delete orphaned ai_generations older than 30 days
SELECT cron.schedule(
  'ai-cache-cleanup',
  '0 2 * * 0',
  $$
  DELETE FROM ai_generations
  WHERE created_at < now() - INTERVAL '30 days'
    AND entity_id IS NULL;
  $$
);
