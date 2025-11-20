import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

type Teacher = {
  id: string;
  email: string;
};

type Student = {
  id: string;
  name: string;
  class: string;
  teacher_id: string | null;
};

export default function Admin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    checkAdminAndLoadData();
  }, []);

  const checkAdminAndLoadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      // Check if user is admin
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .single();

      if (!roleData) {
        toast({
          title: "Access Denied",
          description: "You must be an admin to access this page.",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      setIsAdmin(true);

      // Fetch teachers
      const { data: teachersData, error: teachersError } = await supabase
        .rpc("get_teachers");

      if (teachersError) throw teachersError;
      setTeachers(teachersData || []);

      // Fetch all students
      const { data: studentsData, error: studentsError } = await supabase
        .from("students")
        .select("id, name, class, teacher_id")
        .order("name");

      if (studentsError) throw studentsError;
      setStudents(studentsData || []);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "Failed to load data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedStudents.size === students.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(students.map(s => s.id)));
    }
  };

  const handleToggleStudent = (studentId: string) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
  };

  const handleBulkAssign = async () => {
    if (selectedStudents.size === 0) {
      toast({
        title: "No students selected",
        description: "Please select at least one student.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedTeacherId) {
      toast({
        title: "No teacher selected",
        description: "Please select a teacher.",
        variant: "destructive",
      });
      return;
    }

    setAssigning(true);
    try {
      // Update each student with the selected teacher_id
      const { error } = await supabase
        .from("students")
        .update({ teacher_id: selectedTeacherId })
        .in("id", Array.from(selectedStudents));

      if (error) throw error;

      toast({
        title: "Success",
        description: `Assigned ${selectedStudents.size} student(s) to teacher.`,
      });

      // Refresh students data
      await checkAdminAndLoadData();
      setSelectedStudents(new Set());
      setSelectedTeacherId("");
    } catch (error) {
      console.error("Error assigning students:", error);
      toast({
        title: "Error",
        description: "Failed to assign students. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAssigning(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const getTeacherEmail = (teacherId: string | null) => {
    if (!teacherId) return "Unassigned";
    const teacher = teachers.find(t => t.id === teacherId);
    return teacher?.email || "Unknown";
  };

  return (
    <Layout>
      <Card>
        <CardHeader>
          <CardTitle>Bulk Assign Students to Teachers</CardTitle>
          <CardDescription>
            Select students and assign them to a teacher. Only admins can access this page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
              <div className="flex-1 space-y-2 w-full">
                <label className="text-sm font-medium">Select Teacher</label>
                <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleBulkAssign}
                disabled={assigning || selectedStudents.size === 0 || !selectedTeacherId}
                className="w-full sm:w-auto"
              >
                {assigning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  `Assign ${selectedStudents.size} Student(s)`
                )}
              </Button>
            </div>

            <div className="border rounded-lg">
              <div className="border-b bg-muted/50 p-4 flex items-center gap-3">
                <Checkbox
                  checked={selectedStudents.size === students.length && students.length > 0}
                  onCheckedChange={handleSelectAll}
                  id="select-all"
                />
                <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                  Select All ({students.length} students)
                </label>
              </div>

              <div className="divide-y max-h-[500px] overflow-y-auto">
                {students.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    No students found
                  </div>
                ) : (
                  students.map((student) => (
                    <div
                      key={student.id}
                      className="p-4 flex items-center gap-3 hover:bg-muted/30 transition-colors"
                    >
                      <Checkbox
                        checked={selectedStudents.has(student.id)}
                        onCheckedChange={() => handleToggleStudent(student.id)}
                        id={`student-${student.id}`}
                      />
                      <label
                        htmlFor={`student-${student.id}`}
                        className="flex-1 cursor-pointer"
                      >
                        <div className="font-medium">{student.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Class: {student.class} • Teacher: {getTeacherEmail(student.teacher_id)}
                        </div>
                      </label>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Layout>
  );
}
