import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, History, Calendar, User } from "lucide-react";
import Layout from "@/components/Layout";
import { toast } from "sonner";
import ReportCardPreview from "@/components/ReportCardPreview";
import { format } from "date-fns";

export default function Reports() {
  const [selectedStudent, setSelectedStudent] = useState("");
  const queryClient = useQueryClient();

  const { data: students } = useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      const { data, error } = await supabase.from("students").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: reportHistory } = useQuery({
    queryKey: ["report-history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("report_history")
        .select("*")
        .order("generated_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
  });

  const { data: reportData, isLoading } = useQuery({
    queryKey: ["report", selectedStudent],
    queryFn: async () => {
      if (!selectedStudent) return null;

      const [studentRes, scoresRes, attendanceRes, commentsRes] = await Promise.all([
        supabase.from("students").select("*").eq("id", selectedStudent).single(),
        supabase.from("scores").select("*, subjects(name)").eq("student_id", selectedStudent),
        supabase.from("attendance").select("*").eq("student_id", selectedStudent).maybeSingle(),
        supabase.from("teacher_comments").select("*").eq("student_id", selectedStudent).maybeSingle(),
      ]);

      const grandTotal = scoresRes.data?.reduce(
        (sum, score) => sum + (score.mid_term_score / 2 + score.end_term_score / 2),
        0
      ) || 0;

      const { data: allStudents } = await supabase.from("students").select("id");
      const rankings = await Promise.all(
        allStudents?.map(async (s) => {
          const { data: scores } = await supabase
            .from("scores")
            .select("mid_term_score, end_term_score")
            .eq("student_id", s.id);
          const total = scores?.reduce(
            (sum, score) => sum + (score.mid_term_score / 2 + score.end_term_score / 2),
            0
          ) || 0;
          return { id: s.id, total };
        }) || []
      );

      const sortedRankings = rankings.sort((a, b) => b.total - a.total);
      const rank = sortedRankings.findIndex((r) => r.id === selectedStudent) + 1;

      return {
        student: studentRes.data,
        scores: scoresRes.data || [],
        attendance: attendanceRes.data,
        comments: commentsRes.data,
        grandTotal,
        rank,
        totalStudents: allStudents?.length || 0,
      };
    },
    enabled: !!selectedStudent,
  });

  const handleGeneratePDF = async () => {
    if (!reportData) return;

    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase.functions.invoke("generate-report-pdf", {
        body: { reportData },
      });

      if (error) throw error;

      // Log to history
      if (userData.user) {
        await supabase.from("report_history").insert({
          student_id: reportData.student.id,
          teacher_id: userData.user.id,
          student_name: reportData.student.name,
          student_class: reportData.student.class,
          downloaded: true,
        });
        queryClient.invalidateQueries({ queryKey: ["report-history"] });
      }

      const blob = new Blob([Uint8Array.from(atob(data.pdf), c => c.charCodeAt(0))], {
        type: "application/pdf",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `report-${reportData.student.name.replace(/\s+/g, "-")}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("PDF generated successfully!");
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Failed to generate PDF");
    }
  };

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Generate Report Cards</h2>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Select Student</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
              <SelectTrigger className="text-sm sm:text-base">
                <SelectValue placeholder="Choose a student" />
              </SelectTrigger>
              <SelectContent>
                {students?.map((student) => (
                  <SelectItem key={student.id} value={student.id} className="text-sm sm:text-base">
                    {student.name} - {student.class}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {isLoading && (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Loading report data...</p>
            </CardContent>
          </Card>
        )}

        {reportData && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-center">Report Card Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <ReportCardPreview reportData={reportData} />
              </CardContent>
            </Card>
            
            <Button onClick={handleGeneratePDF} className="w-full gap-2" size="lg">
              <Download className="h-5 w-5" />
              Download PDF Report
            </Button>
          </div>
        )}

        {!selectedStudent && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Select a student to preview and generate their report card</p>
            </CardContent>
          </Card>
        )}

        {/* Report History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <History className="h-5 w-5" />
              Recent Report History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {reportHistory && reportHistory.length > 0 ? (
              <div className="space-y-3">
                {reportHistory.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border"
                  >
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{entry.student_name}</p>
                        <p className="text-xs text-muted-foreground">{entry.student_class}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(entry.generated_at), "MMM d, yyyy h:mm a")}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-6">No reports generated yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
