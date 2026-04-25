
CREATE TABLE public.generated_quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  subject text DEFAULT '',
  upload_id uuid REFERENCES public.uploads(id) ON DELETE SET NULL,
  questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.generated_quizzes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own quizzes" ON public.generated_quizzes FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
