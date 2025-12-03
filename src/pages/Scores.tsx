import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import Layout from "@/components/Layout";

export default function Scores() {
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [midTermScore, setMidTermScore] = useState("");
  const [endTermScore, setEndTermScore] = useState("");
  const [totalDays, setTotalDays] = useState("");
  const [presentDays, setPresentDays] = useState("");
  const [interest, setInterest] = useState("");
  const [conduct, setConduct] = useState("");
  const [behavior, setBehavior] = useState("");
  const queryClient = useQueryClient();

  const { data: students } = useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      const { data, error } = await supabase.from("students").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: subjects } = useQuery({
    queryKey: ["subjects"],
    queryFn: async () => {
      const { data, error } = await supabase.from("subjects").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const scoreMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      
      const { error } = await supabase.from("scores").upsert([
        {
          student_id: selectedStudent,
          subject_id: selectedSubject,
          mid_term_score: parseFloat(midTermScore),
          end_term_score: parseFloat(endTermScore),
          teacher_id: user.id
        },
      ]);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Score saved successfully!");
      setSelectedSubject("");
      setMidTermScore("");
      setEndTermScore("");
    },
    onError: () => toast.error("Failed to save score"),
  });

  const attendanceMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      
      const { error } = await supabase.from("attendance").upsert([
        {
          student_id: selectedStudent,
          total_days: parseInt(totalDays),
          present_days: parseInt(presentDays),
          teacher_id: user.id
        },
      ]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      toast.success("Attendance saved successfully!");
    },
    onError: () => toast.error("Failed to save attendance"),
  });

  const commentsMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      
      const { error } = await supabase.from("teacher_comments").upsert([
        {
          student_id: selectedStudent,
          interest,
          conduct,
          behavior,
          teacher_id: user.id
        },
      ]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments"] });
      toast.success("Comments saved successfully!");
    },
    onError: () => toast.error("Failed to save comments"),
  });

  const { data: studentData } = useQuery({
    queryKey: ["student-data", selectedStudent],
    queryFn: async () => {
      if (!selectedStudent) return null;

      const [scoresRes, attendanceRes, commentsRes] = await Promise.all([
        supabase.from("scores").select("*, subjects(name)").eq("student_id", selectedStudent),
        supabase.from("attendance").select("*").eq("student_id", selectedStudent).single(),
        supabase.from("teacher_comments").select("*").eq("student_id", selectedStudent).single(),
      ]);

      return {
        scores: scoresRes.data || [],
        attendance: attendanceRes.data,
        comments: commentsRes.data,
      };
    },
    enabled: !!selectedStudent,
  });

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Enter Scores & Data</h2>

        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Select Student</CardTitle>
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

        {selectedStudent && (
          <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Subject Scores</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm sm:text-base">Subject</Label>
                  <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                    <SelectTrigger className="text-sm sm:text-base">
                      <SelectValue placeholder="Choose a subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects?.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id} className="text-sm sm:text-base">
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedSubject && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-sm sm:text-base">SBA / Class Score (out of 50)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="50"
                        step="0.01"
                        value={midTermScore}
                        onChange={(e) => setMidTermScore(e.target.value)}
                        className="text-sm sm:text-base"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm sm:text-base">End of Term Score (out of 50)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="50"
                        step="0.01"
                        value={endTermScore}
                        onChange={(e) => setEndTermScore(e.target.value)}
                        className="text-sm sm:text-base"
                        required
                      />
                    </div>

                    {midTermScore && endTermScore && (
                      <div className="rounded-lg bg-muted p-3 sm:p-4">
                        <p className="text-xs sm:text-sm font-medium">Calculated Totals:</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          SBA (50): {parseFloat(midTermScore).toFixed(2)}
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          End of Term (50): {parseFloat(endTermScore).toFixed(2)}
                        </p>
                        <p className="text-xs sm:text-sm font-semibold text-foreground">
                          Total (100): {(parseFloat(midTermScore) + parseFloat(endTermScore)).toFixed(2)}
                        </p>
                      </div>
                    )}

                    <Button onClick={() => scoreMutation.mutate()} className="w-full text-sm sm:text-base">
                      Save Score
                    </Button>
                  </>
                )}

                {studentData?.scores && studentData.scores.length > 0 && (
                  <div className="mt-4 sm:mt-6 space-y-2">
                    <h4 className="font-semibold text-sm sm:text-base">Saved Scores:</h4>
                    {studentData.scores.map((score: any) => (
                      <div key={score.id} className="rounded-lg border border-border p-2.5 sm:p-3">
                        <p className="font-medium text-sm sm:text-base">{score.subjects.name}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Total: {(score.mid_term_score + score.end_term_score).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-4 sm:space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">Attendance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm sm:text-base">Total School Days</Label>
                    <Input
                      type="number"
                      min="1"
                      value={totalDays}
                      onChange={(e) => setTotalDays(e.target.value)}
                      placeholder={studentData?.attendance?.total_days?.toString() || ""}
                      className="text-sm sm:text-base"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm sm:text-base">Days Present</Label>
                    <Input
                      type="number"
                      min="0"
                      value={presentDays}
                      onChange={(e) => setPresentDays(e.target.value)}
                      placeholder={studentData?.attendance?.present_days?.toString() || ""}
                      className="text-sm sm:text-base"
                    />
                  </div>

                  {totalDays && presentDays && (
                    <div className="rounded-lg bg-muted p-3 sm:p-4">
                      <p className="text-xs sm:text-sm font-medium">
                        Attendance: {((parseInt(presentDays) / parseInt(totalDays)) * 100).toFixed(2)}%
                      </p>
                    </div>
                  )}

                  <Button onClick={() => attendanceMutation.mutate()} className="w-full text-sm sm:text-base">
                    Save Attendance
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">Teacher Comments</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm sm:text-base">Student Interest</Label>
                    <Textarea
                      value={interest}
                      onChange={(e) => setInterest(e.target.value)}
                      placeholder={studentData?.comments?.interest || "Enter student's interests..."}
                      className="text-sm sm:text-base min-h-[80px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm sm:text-base">Conduct</Label>
                    <Textarea
                      value={conduct}
                      onChange={(e) => setConduct(e.target.value)}
                      placeholder={studentData?.comments?.conduct || "Enter conduct assessment..."}
                      className="text-sm sm:text-base min-h-[80px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm sm:text-base">Behavior</Label>
                    <Textarea
                      value={behavior}
                      onChange={(e) => setBehavior(e.target.value)}
                      placeholder={studentData?.comments?.behavior || "Enter behavior notes..."}
                      className="text-sm sm:text-base min-h-[80px]"
                    />
                  </div>

                  <Button onClick={() => commentsMutation.mutate()} className="w-full text-sm sm:text-base">
                    Save Comments
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
