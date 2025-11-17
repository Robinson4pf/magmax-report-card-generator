import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Download } from "lucide-react";
import Layout from "@/components/Layout";
import { toast } from "sonner";

export default function Reports() {
  const [selectedStudent, setSelectedStudent] = useState("");

  const { data: students } = useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      const { data, error } = await supabase.from("students").select("*").order("name");
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

      // Get ranking
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
      const { data, error } = await supabase.functions.invoke("generate-report-pdf", {
        body: { reportData },
      });

      if (error) throw error;

      // Create blob and download
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
          <Card className="shadow-lg">
            <CardHeader className="border-b bg-gradient-to-r from-primary to-secondary text-primary-foreground">
              <div className="space-y-2">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-center">MAGMAX EDUCATIONAL CENTRE</h1>
                <CardTitle className="text-lg sm:text-xl md:text-2xl text-center">Report Card Preview</CardTitle>
                <div className="text-xs sm:text-sm opacity-90">
                  <p className="font-semibold">Name: {reportData.student.name}</p>
                  <p>Class: {reportData.student.class}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 p-3 sm:p-6">
              {reportData.scores.length > 0 && (
                <div className="overflow-x-auto -mx-3 sm:mx-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs sm:text-sm">Subject</TableHead>
                        <TableHead className="text-right text-xs sm:text-sm">Mid-Term</TableHead>
                        <TableHead className="text-right text-xs sm:text-sm">End Term</TableHead>
                        <TableHead className="text-right text-xs sm:text-sm">Total</TableHead>
                        <TableHead className="text-xs sm:text-sm">Comment</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.scores.map((score: any) => {
                        const total = (score.mid_term_score / 2 + score.end_term_score / 2).toFixed(2);
                        return (
                          <TableRow key={score.id}>
                            <TableCell className="font-medium text-xs sm:text-sm">{score.subjects.name}</TableCell>
                            <TableCell className="text-right text-xs sm:text-sm">{score.mid_term_score}</TableCell>
                            <TableCell className="text-right text-xs sm:text-sm">{score.end_term_score}</TableCell>
                            <TableCell className="text-right text-xs sm:text-sm">{total}</TableCell>
                            <TableCell className="text-muted-foreground text-xs sm:text-sm">
                              {score.comment || "-"}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      <TableRow className="bg-muted/50 font-semibold">
                        <TableCell colSpan={3} className="text-xs sm:text-sm">Grand Total</TableCell>
                        <TableCell className="text-right text-xs sm:text-sm">{reportData.grandTotal.toFixed(2)}</TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}

              <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
                <div>
                  <h3 className="font-semibold text-foreground mb-2 text-sm sm:text-base">Performance Summary</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Class Position: {reportData.rank} of {reportData.totalStudents}
                  </p>
                </div>
                {reportData.attendance && (
                  <div>
                    <h3 className="font-semibold text-foreground mb-2 text-sm sm:text-base">Attendance</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {reportData.attendance.present_days} of {reportData.attendance.total_days} days (
                      {((reportData.attendance.present_days / reportData.attendance.total_days) * 100).toFixed(2)}
                      %)
                    </p>
                  </div>
                )}
              </div>

              {reportData.comments && (
                <div>
                  <h3 className="font-semibold text-foreground mb-2 text-sm sm:text-base">Teacher's Comments</h3>
                  {reportData.comments.interest && (
                    <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                      <strong>Interest:</strong> {reportData.comments.interest}
                    </p>
                  )}
                  {reportData.comments.conduct && (
                    <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                      <strong>Conduct:</strong> {reportData.comments.conduct}
                    </p>
                  )}
                  {reportData.comments.behavior && (
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      <strong>Behavior:</strong> {reportData.comments.behavior}
                    </p>
                  )}
                </div>
              )}

              <Button onClick={handleGeneratePDF} className="w-full gap-2 text-sm sm:text-base">
                <Download className="h-4 w-4" />
                Generate PDF Report
              </Button>
            </CardContent>
          </Card>
        )}

        {!selectedStudent && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Select a student to preview and generate their report card</p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
