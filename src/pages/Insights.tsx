import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Brain, Clock, Target, Flame, Award, Loader2, Sparkles, BarChart3, BookOpen, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";

const Insights = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    totalNotes: 0, totalUploads: 0, totalTasks: 0, completedTasks: 0,
    quizResults: [] as any[], subjects: [] as { name: string; notes: number; tasks: number; quizAvg: number }[],
    recentActivity: [] as any[],
  });

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const [notesRes, uploadsRes, tasksRes, quizRes, activityRes] = await Promise.all([
        supabase.from("notes").select("subject").eq("user_id", user.id),
        supabase.from("uploads").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("planner_tasks").select("subject, done").eq("user_id", user.id),
        supabase.from("quiz_results").select("quiz_title, score, total_questions, created_at").eq("user_id", user.id),
        supabase.from("activity_log").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
      ]);
      const notes = notesRes.data || []; const tasks = tasksRes.data || []; const quizResults = quizRes.data || [];
      const subjectMap: Record<string, { notes: number; tasks: number; quizScores: number[] }> = {};
      notes.forEach((n: any) => { if (!n.subject) return; if (!subjectMap[n.subject]) subjectMap[n.subject] = { notes: 0, tasks: 0, quizScores: [] }; subjectMap[n.subject].notes++; });
      tasks.forEach((t: any) => { if (!subjectMap[t.subject]) subjectMap[t.subject] = { notes: 0, tasks: 0, quizScores: [] }; subjectMap[t.subject].tasks++; });
      const subjects = Object.entries(subjectMap).map(([name, d]) => ({ name, notes: d.notes, tasks: d.tasks, quizAvg: d.quizScores.length ? Math.round(d.quizScores.reduce((a, b) => a + b, 0) / d.quizScores.length) : 0 }));
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const weekCounts = new Array(7).fill(0);
      (activityRes.data || []).forEach((a: any) => { weekCounts[new Date(a.created_at).getDay()]++; });
      setData({ totalNotes: notes.length, totalUploads: uploadsRes.count || 0, totalTasks: tasks.length, completedTasks: tasks.filter((t: any) => t.done).length, quizResults, subjects, recentActivity: weekCounts.map((count, i) => ({ day: days[i], count })) });
      setLoading(false);
    };
    fetch();
  }, [user]);

  if (loading) return (
    <div className="p-6 flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center shadow-glow-primary">
          <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'white' }} />
        </div>
        <p className="text-xs text-muted-foreground/60">Loading insights...</p>
      </div>
    </div>
  );

  const quizAvg = data.quizResults.length > 0 ? Math.round(data.quizResults.reduce((s: number, r: any) => s + (r.score / r.total_questions) * 100, 0) / data.quizResults.length) : 0;
  const perfectQuizzes = data.quizResults.filter((r: any) => r.score === r.total_questions).length;
  const maxActivity = Math.max(...data.recentActivity.map((d) => d.count), 1);
  const taskCompletionRate = data.totalTasks > 0 ? Math.round((data.completedTasks / data.totalTasks) * 100) : 0;

  const statColors = ["gradient-primary", "gradient-accent", "gradient-warm", "gradient-primary"];
  const stats = [
    { label: "Total Notes", value: String(data.totalNotes), sub: `${data.totalUploads} uploads`, icon: Clock, gradient: statColors[0] },
    { label: "Tasks Done", value: `${data.completedTasks}/${data.totalTasks}`, sub: data.totalTasks > 0 ? `${taskCompletionRate}% rate` : "—", icon: Brain, gradient: statColors[1] },
    { label: "Quiz Average", value: quizAvg > 0 ? `${quizAvg}%` : "—", sub: `${data.quizResults.length} taken`, icon: Target, gradient: statColors[2] },
    { label: "Perfect Scores", value: String(perfectQuizzes), sub: `of ${data.quizResults.length}`, icon: Flame, gradient: statColors[3] },
  ];

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1400px] relative">
      {/* Background mesh */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-40" style={{ background: 'var(--gradient-mesh)' }} />

      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="relative z-10">
        <div className="flex items-center gap-2.5 mb-1">
          <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}>
            <BarChart3 className="w-5 h-5 text-primary" />
          </motion.div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">Learning Insights</h1>
        </div>
        <p className="text-xs text-muted-foreground/70 flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-semibold text-[10px]">
            <Sparkles className="w-2.5 h-2.5" /> Real-time
          </span>
          Your progress from real data
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 relative z-10">
        {stats.map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}>
            <Card className="glass-panel-hover p-4 group relative overflow-hidden border border-border/20">
              {/* Glow on hover */}
              <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-700 blur-2xl"
                style={{ background: `var(--${stat.gradient})` }} />
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-smooth" />

              <div className="relative flex items-center gap-3">
                <div className={`w-11 h-11 rounded-2xl ${stat.gradient} flex items-center justify-center shadow-card group-hover:scale-110 group-hover:shadow-glow-primary transition-all duration-500`}>
                  <stat.icon className="w-4.5 h-4.5" style={{ color: 'white' }} />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground/60 font-semibold uppercase tracking-[0.1em]">{stat.label}</p>
                  <p className="text-xl font-bold text-foreground leading-tight">{stat.value}</p>
                  <p className="text-[9px] text-accent font-semibold mt-0.5">{stat.sub}</p>
                </div>
              </div>

              {/* Bottom accent */}
              <motion.div className={`absolute bottom-0 left-0 h-[2px] ${stat.gradient} rounded-full`}
                initial={{ width: 0 }} animate={{ width: '35%' }} transition={{ duration: 1, delay: 0.3 + i * 0.1 }} />
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Weekly Activity */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="relative z-10">
        <Card className="glass-panel border border-border/20 p-5 relative overflow-hidden">
          <div className="absolute inset-0 opacity-20" style={{ background: 'radial-gradient(circle at 50% 100%, hsl(var(--primary) / 0.12), transparent 60%)' }} />

          <div className="relative">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-primary" />
                <h2 className="text-xs font-semibold text-foreground">Weekly Activity</h2>
              </div>
              <Badge variant="outline" className="border-accent/20 bg-accent/10 text-accent text-[9px] font-semibold">
                {data.recentActivity.reduce((a, d) => a + d.count, 0)} actions
              </Badge>
            </div>

            <div className="flex items-end gap-3 h-32">
              {data.recentActivity.map((day, i) => {
                const heightPct = (day.count / maxActivity) * 100;
                const isMax = day.count === maxActivity && day.count > 0;
                return (
                  <motion.div
                    key={i}
                    className="flex-1 flex flex-col items-center gap-2"
                    initial={{ opacity: 0, scaleY: 0 }}
                    animate={{ opacity: 1, scaleY: 1 }}
                    transition={{ delay: 0.4 + i * 0.06, duration: 0.5 }}
                    style={{ transformOrigin: 'bottom' }}
                  >
                    <span className={`text-[9px] font-bold font-mono ${isMax ? 'text-primary' : 'text-foreground/50'}`}>{day.count}</span>
                    <div className="w-full relative group">
                      <div
                        className={`w-full rounded-lg transition-all duration-500 relative overflow-hidden ${isMax ? 'gradient-primary shadow-glow-primary' : 'bg-gradient-to-t from-primary/40 to-primary/20'}`}
                        style={{ height: `${Math.max(heightPct, 4)}%`, minHeight: "6px" }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-white/20 opacity-0 group-hover:opacity-100 transition-smooth" />
                      </div>
                    </div>
                    <span className={`text-[9px] font-mono ${isMax ? 'text-primary font-bold' : 'text-muted-foreground/40'}`}>{day.day}</span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Subject Breakdown */}
      {data.subjects.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="relative z-10">
          <Card className="glass-panel border border-border/20 p-5 relative overflow-hidden">
            <div className="absolute inset-0 opacity-15" style={{ background: 'radial-gradient(circle at 80% 20%, hsl(var(--secondary) / 0.15), transparent 60%)' }} />

            <div className="relative">
              <div className="flex items-center gap-2 mb-5">
                <BookOpen className="w-3.5 h-3.5 text-secondary" />
                <h2 className="text-xs font-semibold text-foreground">Subject Breakdown</h2>
                <Badge variant="outline" className="ml-auto border-secondary/20 bg-secondary/10 text-secondary text-[9px] font-semibold">
                  {data.subjects.length} subjects
                </Badge>
              </div>

              <div className="space-y-4">
                {data.subjects.map((subject, i) => {
                  const total = subject.notes + subject.tasks;
                  const barColors = ["from-primary to-primary-glow", "from-secondary to-secondary-glow", "from-accent to-primary"][i % 3];
                  const dotColor = ["bg-primary", "bg-secondary", "bg-accent"][i % 3];
                  return (
                    <motion.div key={subject.name} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.08 }} className="space-y-2 group">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
                          <h3 className="text-[11px] font-semibold text-foreground/80 group-hover:text-foreground transition-smooth">{subject.name}</h3>
                        </div>
                        <div className="flex items-center gap-3 text-[9px] font-mono">
                          <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary/80 font-semibold">{subject.notes} notes</span>
                          <span className="px-1.5 py-0.5 rounded bg-accent/10 text-accent/80 font-semibold">{subject.tasks} tasks</span>
                        </div>
                      </div>
                      <div className="h-2 rounded-full bg-muted/15 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, total * 10)}%` }}
                          transition={{ duration: 1, delay: 0.6 + i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
                          className={`h-full rounded-full bg-gradient-to-r ${barColors} relative`}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent animate-pulse" />
                        </motion.div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Empty State */}
      {data.subjects.length === 0 && data.quizResults.length === 0 && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="relative z-10">
          <Card className="glass-panel border border-border/20 p-10 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-20" style={{ background: 'var(--gradient-mesh)' }} />
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl gradient-primary mx-auto mb-4 flex items-center justify-center shadow-glow-primary">
                <Award className="w-7 h-7" style={{ color: 'white' }} />
              </div>
              <p className="text-sm font-semibold text-foreground/80 mb-1">No insights yet</p>
              <p className="text-xs text-muted-foreground/60">Start studying to see your progress here!</p>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default Insights;
