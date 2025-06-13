-- Create a cron job to run subscription reminders daily at 9 AM UTC
SELECT cron.schedule(
  'send-subscription-reminders',
  '0 9 * * *', -- Every day at 9 AM UTC
  $$
  SELECT net.http_post(
    url := 'https://xuobvbyyghehffqrlkfq.supabase.co/functions/v1/send-subscription-reminders',
    headers := '{"Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '", "Content-Type": "application/json"}',
    body := '{}'
  );
  $$
); 