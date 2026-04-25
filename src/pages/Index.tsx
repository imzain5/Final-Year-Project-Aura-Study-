import { useState, useEffect } from "react";
import StatCard from "@/components/StatCard";
import ActivityFeed from "@/components/ActivityFeed";
import QuickActions from "@/components/QuickActions";
import StudyProgress from "@/components/StudyProgress";
import AIChat from "@/components/AIChat";
import { Brain, Clock, Target, Zap, ArrowRight, Calendar, Sparkles, Shield } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "there";

  const [stats, setStats] = useState({ uploads: 0, notes: 0, quizAvg: 0, tasks: 0, tasksDone: 0 });
  const [upcomingTasks, setUpcomingTasks] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      const [uploadsRes, notesRes, quizRes, tasksRes] = await Promise.all([
        supabase.from("uploads").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("notes").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("quiz_results").select("score, total_questions").eq("user_id", user.id),
        supabase.from("planner_tasks").select("*").eq("user_id", user.id).order("scheduled_time"),
      ]);
      const quizResults = quizRes.data || [];
      const quizAvg = quizResults.length > 0
        ? Math.round(quizResults.reduce((sum: number, r: any) => sum + (r.score / r.total_questions) * 100, 0) / quizResults.length)
        : 0;
      const allTasks = tasksRes.data || [];
      const today = new Date().toISOString().split("T")[0];
      const todayTasks = allTasks.filter((t: any) => t.task_date === today);
      const upcoming = allTasks.filter((t: any) => !t.done).slice(0, 3);
      setStats({ uploads: uploadsRes.count || 0, notes: notesRes.count || 0, quizAvg, tasks: todayTasks.length, tasksDone: todayTasks.filter((t: any) => t.done).length });
      setUpcomingTasks(upcoming);
    };
    fetchStats();
  }, [user]);

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? "Good morning" : currentHour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1400px] relative min-h-screen">
      {/* Background mesh */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-30" style={{ background: 'var(--gradient-mesh)' }} />
      {/* Dot grid */}
      <div className="fixed inset-0 pointer-events-none z-0 dot-pattern opacity-20" />

      {/* Hero Welcome */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10"
      >
        <Card className="glass-panel border border-border/15 p-6 md:p-8 relative overflow-hidden rounded-2xl">
          {/* Animated gradient bg */}
          <div className="absolute inset-0 opacity-30" style={{ background: 'radial-gradient(ellipse at 20% 50%, hsl(var(--primary) / 0.12), transparent 50%), radial-gradient(ellipse at 80% 50%, hsl(var(--secondary) / 0.08), transparent 50%)' }} />
          {/* Top shimmer */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          
          <div className="relative flex items-start justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <motion.div
                  className="w-10 h-10 rounded-2xl gradient-primary flex items-center justify-center shadow-glow-primary"
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity, repeatDelay: 3 }}
                >
                  <Sparkles className="w-5 h-5" style={{ color: 'white' }} />
                </motion.div>
                <div>
                  <p className="text-[10px] text-muted-foreground/50 uppercase tracking-[0.2em] font-semibold">{greeting}</p>
                  <h1 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">
                    Welcome back, <span className="text-gradient-primary">{displayName}</span>
                  </h1>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/8 border border-accent/15">
                  <Shield className="w-3 h-3 text-accent" />
                  <span className="text-[10px] text-accent font-bold">{stats.tasksDone}/{stats.tasks} tasks done</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/8 border border-primary/15">
                  <Brain className="w-3 h-3 text-primary" />
                  <span className="text-[10px] text-primary font-bold">{stats.notes} notes</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/8 border border-secondary/15">
                  <Zap className="w-3 h-3 text-secondary" />
                  <span className="text-[10px] text-secondary font-bold">{stats.uploads} uploads</span>
                </div>
              </div>
            </div>
            <Button onClick={() => navigate("/planner")} variant="ghost" className="hidden md:flex text-xs gap-2 text-muted-foreground hover:text-foreground h-9 border border-border/15 hover:border-primary/25 rounded-xl hover:bg-primary/5 transition-all duration-300">
              <Calendar className="w-3.5 h-3.5" />
              Planner
              <ArrowRight className="w-3 h-3" />
            </Button>
          </div>
        </Card>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 relative z-10">
        <StatCard icon={Clock} label="Tasks Today" value={`${stats.tasksDone}/${stats.tasks}`} change={stats.tasks > 0 ? `${Math.round((stats.tasksDone / stats.tasks) * 100)}% done` : "No tasks"} trend="up" index={0} />
        <StatCard icon={Brain} label="Notes" value={String(stats.notes)} change={`${stats.uploads} uploads`} trend="up" gradient="gradient-accent" index={1} />
        <StatCard icon={Target} label="Quiz Average" value={stats.quizAvg > 0 ? `${stats.quizAvg}%` : "—"} change={stats.quizAvg >= 80 ? "Great!" : "Keep going"} trend={stats.quizAvg >= 50 ? "up" : "down"} gradient="gradient-warm" index={2} />
        <StatCard icon={Zap} label="Uploads" value={String(stats.uploads)} change="Files processed" trend="up" index={3} />
      </div>

      <div className="relative z-10">
        <QuickActions />
      </div>

      {/* Upcoming Tasks */}
      {upcomingTasks.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="relative z-10">
          <Card className="glass-panel border border-border/15 p-5 relative overflow-hidden rounded-2xl">
            <div className="absolute inset-0 opacity-15" style={{ background: 'radial-gradient(circle at 60% 30%, hsl(var(--primary) / 0.12), transparent 60%)' }} />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-primary/10 border border-primary/15 flex items-center justify-center">
                    <Calendar className="w-3 h-3 text-primary" />
                  </div>
                  <h3 className="text-xs font-bold text-foreground tracking-tight">Upcoming Tasks</h3>
                </div>
                <button onClick={() => navigate("/planner")} className="text-[10px] text-primary hover:text-primary/80 font-bold flex items-center gap-1 transition-smooth">
                  View all <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <div className="grid md:grid-cols-3 gap-2.5">
                {upcomingTasks.map((task: any, i: number) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.55 + i * 0.08 }}
                    whileHover={{ y: -2, scale: 1.01 }}
                    className="flex items-center gap-3 p-3.5 rounded-xl bg-muted/5 border border-border/10 hover:border-primary/20 transition-all duration-300 cursor-pointer group"
                    onClick={() => navigate("/planner")}
                  >
                    <div className="w-1.5 h-10 rounded-full gradient-primary flex-shrink-0 group-hover:shadow-glow-primary transition-all duration-300" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-foreground/90 truncate group-hover:text-foreground transition-smooth">{task.topic}</p>
                      <p className="text-[9px] text-muted-foreground/40 mt-0.5 uppercase tracking-wider">{task.subject} · {task.scheduled_time}</p>
                    </div>
                    <ArrowRight className="w-3 h-3 text-muted-foreground/30 group-hover:text-primary transition-smooth opacity-0 group-hover:opacity-100" />
                  </motion.div>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 relative z-10">
        <div className="lg:col-span-2">
          <AIChat />
        </div>
        <div className="space-y-4">
          <StudyProgress />
          <ActivityFeed />
        </div>
      </div>
    </div>
  );
};

export default Index;
