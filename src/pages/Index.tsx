import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, FileText, Trophy } from "lucide-react";
import Layout from "@/components/Layout";

export default function Index() {
  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [studentsRes, subjectsRes, scoresRes] = await Promise.all([
        supabase.from("students").select("id", { count: "exact" }),
        supabase.from("subjects").select("id", { count: "exact" }),
        supabase.from("scores").select("id", { count: "exact" }),
      ]);

      return {
        students: studentsRes.count || 0,
        subjects: subjectsRes.count || 0,
        scores: scoresRes.count || 0,
      };
    },
  });

  const cards = [
    {
      title: "Total Students",
      value: stats?.students || 0,
      icon: Users,
      color: "from-primary to-primary/80",
    },
    {
      title: "Total Subjects",
      value: stats?.subjects || 0,
      icon: BookOpen,
      color: "from-secondary to-secondary/80",
    },
    {
      title: "Scores Entered",
      value: stats?.scores || 0,
      icon: FileText,
      color: "from-accent to-accent/80",
    },
  ];

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h2 className="text-4xl font-bold text-foreground mb-2">Dashboard</h2>
          <p className="text-muted-foreground">Welcome to the Report Card Management System</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <Card key={card.title} className="overflow-hidden shadow-lg">
                <CardHeader className={`bg-gradient-to-br ${card.color} pb-4`}>
                  <div className="flex items-center justify-between text-white">
                    <CardTitle className="text-lg font-medium">{card.title}</CardTitle>
                    <Icon className="h-8 w-8 opacity-80" />
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <p className="text-4xl font-bold text-foreground">{card.value}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-accent" />
              Quick Start Guide
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3 text-muted-foreground">
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  1
                </span>
                <span>Add your students from the Students page</span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  2
                </span>
                <span>Configure your subjects in the Subjects page</span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  3
                </span>
                <span>Enter student scores, attendance, and comments</span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  4
                </span>
                <span>View class rankings and generate PDF report cards</span>
              </li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
