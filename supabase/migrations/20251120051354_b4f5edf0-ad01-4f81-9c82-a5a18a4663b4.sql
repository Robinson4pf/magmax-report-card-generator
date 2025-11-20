-- Create a function to get all teachers with their basic info
CREATE OR REPLACE FUNCTION public.get_teachers()
RETURNS TABLE (
  id uuid,
  email text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT au.id, au.email
  FROM auth.users au
  INNER JOIN public.user_roles ur ON ur.user_id = au.id
  WHERE ur.role = 'teacher'
  ORDER BY au.email;
$$;