-- LanaMind onboarding/topic flow fixes
-- Adds trigger functions for topic unlocking and ensures topics default to locked.

CREATE OR REPLACE FUNCTION public.unlock_next_topic()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed' THEN
    UPDATE public.topics
    SET
      status = 'available',
      unlocked_at = now(),
      updated_at = now()
    WHERE id = (
      SELECT id
      FROM public.topics
      WHERE
        term_plan_id = NEW.term_plan_id
        AND user_id = NEW.user_id
        AND status = 'locked'
        AND (
          week_number > NEW.week_number
          OR (week_number = NEW.week_number AND order_index > NEW.order_index)
        )
      ORDER BY week_number ASC, order_index ASC
      LIMIT 1
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_unlock_next ON public.topics;
CREATE TRIGGER trg_unlock_next
  AFTER UPDATE OF status ON public.topics
  FOR EACH ROW
  EXECUTE FUNCTION public.unlock_next_topic();

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.unlock_first_topic_on_plan()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.topics
  SET
    status = 'available',
    unlocked_at = now(),
    updated_at = now()
  WHERE id = (
    SELECT id
    FROM public.topics
    WHERE term_plan_id = NEW.id
      AND status = 'locked'
    ORDER BY week_number ASC, order_index ASC
    LIMIT 1
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_unlock_first ON public.term_plans;
CREATE TRIGGER trg_unlock_first
  AFTER INSERT ON public.term_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.unlock_first_topic_on_plan();

ALTER TABLE public.topics
  ALTER COLUMN status SET DEFAULT 'locked';
