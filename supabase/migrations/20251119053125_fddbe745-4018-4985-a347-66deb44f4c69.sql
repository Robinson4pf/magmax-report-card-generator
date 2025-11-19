-- Add teacher_id column to students table
ALTER TABLE public.students 
ADD COLUMN teacher_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add teacher_id column to scores table
ALTER TABLE public.scores 
ADD COLUMN teacher_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add teacher_id column to attendance table
ALTER TABLE public.attendance 
ADD COLUMN teacher_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add teacher_id column to teacher_comments table
ALTER TABLE public.teacher_comments 
ADD COLUMN teacher_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Drop existing RLS policies for students
DROP POLICY IF EXISTS "Authenticated users can create students" ON public.students;
DROP POLICY IF EXISTS "Authenticated users can update students" ON public.students;
DROP POLICY IF EXISTS "Authenticated users can view students" ON public.students;
DROP POLICY IF EXISTS "Only admins can delete students" ON public.students;

-- Create new RLS policies for students
CREATE POLICY "Teachers can view their own students"
ON public.students
FOR SELECT
TO authenticated
USING (teacher_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers can create students"
ON public.students
FOR INSERT
TO authenticated
WITH CHECK (teacher_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers can update their own students"
ON public.students
FOR UPDATE
TO authenticated
USING (teacher_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete students"
ON public.students
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Drop existing RLS policies for scores
DROP POLICY IF EXISTS "Authenticated users can create scores" ON public.scores;
DROP POLICY IF EXISTS "Authenticated users can delete scores" ON public.scores;
DROP POLICY IF EXISTS "Authenticated users can update scores" ON public.scores;
DROP POLICY IF EXISTS "Authenticated users can view scores" ON public.scores;

-- Create new RLS policies for scores
CREATE POLICY "Teachers can view their own scores"
ON public.scores
FOR SELECT
TO authenticated
USING (teacher_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers can create scores"
ON public.scores
FOR INSERT
TO authenticated
WITH CHECK (teacher_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers can update their own scores"
ON public.scores
FOR UPDATE
TO authenticated
USING (teacher_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers can delete their own scores"
ON public.scores
FOR DELETE
TO authenticated
USING (teacher_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Drop existing RLS policies for attendance
DROP POLICY IF EXISTS "Authenticated users can create attendance" ON public.attendance;
DROP POLICY IF EXISTS "Authenticated users can delete attendance" ON public.attendance;
DROP POLICY IF EXISTS "Authenticated users can update attendance" ON public.attendance;
DROP POLICY IF EXISTS "Authenticated users can view attendance" ON public.attendance;

-- Create new RLS policies for attendance
CREATE POLICY "Teachers can view their own attendance"
ON public.attendance
FOR SELECT
TO authenticated
USING (teacher_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers can create attendance"
ON public.attendance
FOR INSERT
TO authenticated
WITH CHECK (teacher_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers can update their own attendance"
ON public.attendance
FOR UPDATE
TO authenticated
USING (teacher_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers can delete their own attendance"
ON public.attendance
FOR DELETE
TO authenticated
USING (teacher_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Drop existing RLS policies for teacher_comments
DROP POLICY IF EXISTS "Authenticated users can create teacher_comments" ON public.teacher_comments;
DROP POLICY IF EXISTS "Authenticated users can delete teacher_comments" ON public.teacher_comments;
DROP POLICY IF EXISTS "Authenticated users can update teacher_comments" ON public.teacher_comments;
DROP POLICY IF EXISTS "Authenticated users can view teacher_comments" ON public.teacher_comments;

-- Create new RLS policies for teacher_comments
CREATE POLICY "Teachers can view their own comments"
ON public.teacher_comments
FOR SELECT
TO authenticated
USING (teacher_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers can create comments"
ON public.teacher_comments
FOR INSERT
TO authenticated
WITH CHECK (teacher_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers can update their own comments"
ON public.teacher_comments
FOR UPDATE
TO authenticated
USING (teacher_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers can delete their own comments"
ON public.teacher_comments
FOR DELETE
TO authenticated
USING (teacher_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));