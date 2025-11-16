-- Create students table
CREATE TABLE public.students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  class TEXT NOT NULL,
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create subjects table
CREATE TABLE public.subjects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create student_subjects junction table
CREATE TABLE public.student_subjects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  UNIQUE(student_id, subject_id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create scores table
CREATE TABLE public.scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  mid_term_score DECIMAL(5,2) NOT NULL CHECK (mid_term_score >= 0 AND mid_term_score <= 100),
  end_term_score DECIMAL(5,2) NOT NULL CHECK (end_term_score >= 0 AND end_term_score <= 100),
  UNIQUE(student_id, subject_id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create attendance table
CREATE TABLE public.attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE UNIQUE,
  total_days INTEGER NOT NULL CHECK (total_days > 0),
  present_days INTEGER NOT NULL CHECK (present_days >= 0 AND present_days <= total_days),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create teacher_comments table
CREATE TABLE public.teacher_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE UNIQUE,
  interest TEXT,
  conduct TEXT,
  behavior TEXT,
  class_teacher_signature TEXT,
  headmaster_signature TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_comments ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (teacher-facing system)
CREATE POLICY "Allow all operations on students" ON public.students FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on subjects" ON public.subjects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on student_subjects" ON public.student_subjects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on scores" ON public.scores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on attendance" ON public.attendance FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on teacher_comments" ON public.teacher_comments FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_student_subjects_student ON public.student_subjects(student_id);
CREATE INDEX idx_student_subjects_subject ON public.student_subjects(subject_id);
CREATE INDEX idx_scores_student ON public.scores(student_id);
CREATE INDEX idx_scores_subject ON public.scores(subject_id);
CREATE INDEX idx_attendance_student ON public.attendance(student_id);
CREATE INDEX idx_teacher_comments_student ON public.teacher_comments(student_id);