import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Medal } from "lucide-react";
import Layout from "@/components/Layout";

export default function Rankings() {
  const { data: rankings, isLoading } = useQuery({
    queryKey: ["rankings"],
    queryFn: async () => {
      const { data: students, error: studentsError } = await supabase
        .from("students")
        .select("id, name, class");

      if (studentsError) throw studentsError;

      const studentsWithScores = await Promise.all(
        students.map(async (student) => {
          const { data: scores } = await supabase
            .from("scores")
            .select("mid_term_score, end_term_score")
            .eq("student_id", student.id);

          const grandTotal = scores?.reduce(
            (sum, score) => sum + (score.mid_term_score / 2 + score.end_term_score / 2),
            0
          ) || 0;

          return {
            ...student,
            grandTotal,
            subjectCount: scores?.length || 0,
          };
        })
      );

      return studentsWithScores
        .sort((a, b) => b.grandTotal - a.grandTotal)
        .map((student, index) => ({ ...student, rank: index + 1 }));
    },
  });

  const getRankColor = (rank: number) => {
    if (rank === 1) return "text-accent";
    if (rank === 2) return "text-muted-foreground";
    if (rank === 3) return "text-secondary";
    return "text-foreground";
  };

  const getRankIcon = (rank: number) => {
    if (rank <= 3) {
      return <Trophy className={`h-6 w-6 ${getRankColor(rank)}`} />;
    }
    return <Medal className="h-6 w-6 text-muted-foreground" />;
  };

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Class Rankings</h2>

        {isLoading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8 sm:py-12">
              <p className="text-muted-foreground text-sm sm:text-base">Loading rankings...</p>
            </CardContent>
          </Card>
        ) : !rankings?.length ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12">
              <Trophy className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-sm sm:text-base text-center px-4">No scores available yet. Enter scores to see rankings.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {rankings.map((student) => (
              <Card
                key={student.id}
                className={`shadow-sm transition-all ${
                  student.rank === 1 ? "border-accent shadow-lg" : ""
                }`}
              >
                <CardHeader className="pb-3 p-3 sm:p-6 sm:pb-3">
                  <CardTitle className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                      <div className="flex items-center justify-center w-8 sm:w-12 shrink-0">
                        {getRankIcon(student.rank)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <span className={`text-lg sm:text-2xl font-bold ${getRankColor(student.rank)}`}>
                            #{student.rank}
                          </span>
                          <span className="font-semibold text-sm sm:text-lg truncate">{student.name}</span>
                        </div>
                        <div className="text-xs sm:text-sm font-normal text-muted-foreground">
                          {student.class}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xl sm:text-3xl font-bold text-foreground">
                        {student.grandTotal.toFixed(2)}
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground">
                        {student.subjectCount} subject{student.subjectCount !== 1 ? "s" : ""}
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
