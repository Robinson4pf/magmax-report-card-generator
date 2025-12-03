-- Create report_history table to track generated reports
CREATE TABLE public.report_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  teacher_id UUID NOT NULL,
  student_name TEXT NOT NULL,
  student_class TEXT NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  downloaded BOOLEAN NOT NULL DEFAULT false
);

-- Enable RLS
ALTER TABLE public.report_history ENABLE ROW LEVEL SECURITY;

-- Teachers can view their own report history
CREATE POLICY "Teachers can view their own report history"
ON public.report_history
FOR SELECT
USING ((teacher_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

-- Teachers can create report history entries
CREATE POLICY "Teachers can create report history"
ON public.report_history
FOR INSERT
WITH CHECK ((teacher_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

-- Teachers can update their own report history
CREATE POLICY "Teachers can update their own report history"
ON public.report_history
FOR UPDATE
USING ((teacher_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

-- Teachers can delete their own report history
CREATE POLICY "Teachers can delete their own report history"
ON public.report_history
FOR DELETE
USING ((teacher_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));