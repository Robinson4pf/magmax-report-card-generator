import { Link, useLocation } from "react-router-dom";
import { Home, Users, BookOpen, FileText, Trophy, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Students", href: "/students", icon: Users },
  { name: "Subjects", href: "/subjects", icon: BookOpen },
  { name: "Enter Scores", href: "/scores", icon: PlusCircle },
  { name: "Rankings", href: "/rankings", icon: Trophy },
  { name: "Reports", href: "/reports", icon: FileText },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-50 border-b border-border bg-card shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary">
                <BookOpen className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Report Card System</h1>
                <p className="text-xs text-muted-foreground">School Management</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <nav className="mb-6">
          <div className="flex flex-wrap gap-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </nav>

        <main>{children}</main>
      </div>
    </div>
  );
}
