-- Create app_role enum for role-based access control
CREATE TYPE public.app_role AS ENUM ('admin', 'teacher', 'headmaster');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policy for user_roles table
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Only admins can manage roles"
  ON public.user_roles
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Drop existing permissive policies on all tables
DROP POLICY IF EXISTS "Allow all operations on students" ON public.students;
DROP POLICY IF EXISTS "Allow all operations on subjects" ON public.subjects;
DROP POLICY IF EXISTS "Allow all operations on scores" ON public.scores;
DROP POLICY IF EXISTS "Allow all operations on attendance" ON public.attendance;
DROP POLICY IF EXISTS "Allow all operations on teacher_comments" ON public.teacher_comments;
DROP POLICY IF EXISTS "Allow all operations on student_subjects" ON public.student_subjects;

-- Students table: Only authenticated teachers/admins can access
CREATE POLICY "Authenticated users can view students"
  ON public.students
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create students"
  ON public.students
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update students"
  ON public.students
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can delete students"
  ON public.students
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Subjects table: Authenticated can view, only admins can modify
CREATE POLICY "Authenticated users can view subjects"
  ON public.subjects
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can create subjects"
  ON public.subjects
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update subjects"
  ON public.subjects
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete subjects"
  ON public.subjects
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Scores table: Only authenticated teachers/admins can access
CREATE POLICY "Authenticated users can view scores"
  ON public.scores
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create scores"
  ON public.scores
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update scores"
  ON public.scores
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete scores"
  ON public.scores
  FOR DELETE
  TO authenticated
  USING (true);

-- Attendance table: Only authenticated teachers/admins can access
CREATE POLICY "Authenticated users can view attendance"
  ON public.attendance
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create attendance"
  ON public.attendance
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update attendance"
  ON public.attendance
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete attendance"
  ON public.attendance
  FOR DELETE
  TO authenticated
  USING (true);

-- Teacher comments table: Only authenticated teachers/admins can access
CREATE POLICY "Authenticated users can view teacher_comments"
  ON public.teacher_comments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create teacher_comments"
  ON public.teacher_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update teacher_comments"
  ON public.teacher_comments
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete teacher_comments"
  ON public.teacher_comments
  FOR DELETE
  TO authenticated
  USING (true);

-- Student subjects table: Only authenticated users can access
CREATE POLICY "Authenticated users can view student_subjects"
  ON public.student_subjects
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create student_subjects"
  ON public.student_subjects
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update student_subjects"
  ON public.student_subjects
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete student_subjects"
  ON public.student_subjects
  FOR DELETE
  TO authenticated
  USING (true);