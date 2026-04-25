
-- Planner tasks
CREATE TABLE public.planner_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  topic text NOT NULL,
  scheduled_time text DEFAULT '',
  duration text DEFAULT '30m',
  done boolean DEFAULT false,
  task_date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.planner_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own tasks" ON public.planner_tasks FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Notes
CREATE TABLE public.notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  subject text DEFAULT '',
  content text DEFAULT '',
  summary text DEFAULT '',
  starred boolean DEFAULT false,
  upload_id uuid REFERENCES public.uploads(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own notes" ON public.notes FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Flashcard decks
CREATE TABLE public.flashcard_decks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  cards jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.flashcard_decks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own decks" ON public.flashcard_decks FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Quiz results
CREATE TABLE public.quiz_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_title text NOT NULL,
  score integer NOT NULL,
  total_questions integer NOT NULL,
  answers jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own results" ON public.quiz_results FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Activity log
CREATE TABLE public.activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type text NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own activity" ON public.activity_log FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_planner_tasks_updated_at BEFORE UPDATE ON public.planner_tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON public.notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_flashcard_decks_updated_at BEFORE UPDATE ON public.flashcard_decks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
