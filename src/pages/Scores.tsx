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
      const { error } = await supabase.from("scores").upsert([
        {
          student_id: selectedStudent,
          subject_id: selectedSubject,
          mid_term_score: parseFloat(midTermScore),
          end_term_score: parseFloat(endTermScore),
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
      const { error } = await supabase.from("attendance").upsert([
        {
          student_id: selectedStudent,
          total_days: parseInt(totalDays),
          present_days: parseInt(presentDays),
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
      const { error } = await supabase.from("teacher_comments").upsert([
        {
          student_id: selectedStudent,
          interest,
          conduct,
          behavior,
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
      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-foreground">Enter Scores & Data</h2>

        <Card>
          <CardHeader>
            <CardTitle>Select Student</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a student" />
              </SelectTrigger>
              <SelectContent>
                {students?.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.name} - {student.class}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {selectedStudent && (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Subject Scores</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects?.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedSubject && (
                  <>
                    <div className="space-y-2">
                      <Label>Mid-Term Score (out of 100)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={midTermScore}
                        onChange={(e) => setMidTermScore(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>End-Term Score (out of 100)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={endTermScore}
                        onChange={(e) => setEndTermScore(e.target.value)}
                        required
                      />
                    </div>

                    {midTermScore && endTermScore && (
                      <div className="rounded-lg bg-muted p-4">
                        <p className="text-sm font-medium">Calculated Totals:</p>
                        <p className="text-sm text-muted-foreground">
                          Mid-Term 50%: {(parseFloat(midTermScore) / 2).toFixed(2)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          End-Term 50%: {(parseFloat(endTermScore) / 2).toFixed(2)}
                        </p>
                        <p className="text-sm font-semibold text-foreground">
                          Total (100%): {(parseFloat(midTermScore) / 2 + parseFloat(endTermScore) / 2).toFixed(2)}
                        </p>
                      </div>
                    )}

                    <Button onClick={() => scoreMutation.mutate()} className="w-full">
                      Save Score
                    </Button>
                  </>
                )}

                {studentData?.scores && studentData.scores.length > 0 && (
                  <div className="mt-6 space-y-2">
                    <h4 className="font-semibold">Saved Scores:</h4>
                    {studentData.scores.map((score: any) => (
                      <div key={score.id} className="rounded-lg border border-border p-3">
                        <p className="font-medium">{score.subjects.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Total: {(score.mid_term_score / 2 + score.end_term_score / 2).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Attendance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Total School Days</Label>
                    <Input
                      type="number"
                      min="1"
                      value={totalDays}
                      onChange={(e) => setTotalDays(e.target.value)}
                      placeholder={studentData?.attendance?.total_days?.toString() || ""}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Days Present</Label>
                    <Input
                      type="number"
                      min="0"
                      value={presentDays}
                      onChange={(e) => setPresentDays(e.target.value)}
                      placeholder={studentData?.attendance?.present_days?.toString() || ""}
                    />
                  </div>

                  {totalDays && presentDays && (
                    <div className="rounded-lg bg-muted p-4">
                      <p className="text-sm font-medium">
                        Attendance: {((parseInt(presentDays) / parseInt(totalDays)) * 100).toFixed(2)}%
                      </p>
                    </div>
                  )}

                  <Button onClick={() => attendanceMutation.mutate()} className="w-full">
                    Save Attendance
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Teacher Comments</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Student Interest</Label>
                    <Textarea
                      value={interest}
                      onChange={(e) => setInterest(e.target.value)}
                      placeholder={studentData?.comments?.interest || "Enter student's interests..."}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Conduct</Label>
                    <Textarea
                      value={conduct}
                      onChange={(e) => setConduct(e.target.value)}
                      placeholder={studentData?.comments?.conduct || "Enter conduct assessment..."}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Behavior</Label>
                    <Textarea
                      value={behavior}
                      onChange={(e) => setBehavior(e.target.value)}
                      placeholder={studentData?.comments?.behavior || "Enter behavior notes..."}
                    />
                  </div>

                  <Button onClick={() => commentsMutation.mutate()} className="w-full">
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
