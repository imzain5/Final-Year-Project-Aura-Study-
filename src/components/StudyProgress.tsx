import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Loader2, TrendingUp, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";

const colors = [
  { bar: "from-primary to-primary-glow", dot: "bg-primary", ring: "ring-primary/20" },
  { bar: "from-secondary to-secondary-glow", dot: "bg-secondary", ring: "ring-secondary/20" },
  { bar: "from-accent to-primary", dot: "bg-accent", ring: "ring-accent/20" },
  { bar: "from-primary to-secondary", dot: "bg-primary", ring: "ring-primary/20" },
  { bar: "from-secondary to-accent", dot: "bg-secondary", ring: "ring-secondary/20" },
];

const StudyProgress = () => {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<{ name: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const [notesRes, tasksRes, decksRes] = await Promise.all([
        supabase.from("notes").select("subject").eq("user_id", user.id),
        supabase.from("planner_tasks").select("subject").eq("user_id", user.id),
        supabase.from("flashcard_decks").select("name").eq("user_id", user.id),
      ]);
      const counts: Record<string, number> = {};
      notesRes.data?.forEach((n: any) => { if (n.subject) counts[n.subject] = (counts[n.subject] || 0) + 1; });
      tasksRes.data?.forEach((t: any) => { if (t.subject) counts[t.subject] = (counts[t.subject] || 0) + 1; });
      decksRes.data?.forEach((d: any) => { if (d.name) counts[d.name] = (counts[d.name] || 0) + 1; });
      const sorted = Object.entries(counts).sort(([, a], [, b]) => b - a).slice(0, 5).map(([name, count]) => ({ name, count }));
      setSubjects(sorted);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const maxCount = Math.max(...subjects.map((s) => s.count), 1);
  const totalActivity = subjects.reduce((s, sub) => s + sub.count, 0);

  return (
    <Card className="glass-panel border border-border/15 p-4 relative overflow-hidden rounded-2xl">
      <div className="absolute inset-0 opacity-15" style={{ background: 'radial-gradient(circle at 80% 20%, hsl(var(--primary) / 0.15), transparent 60%)' }} />
      
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-primary/10 border border-primary/15 flex items-center justify-center">
              <BarChart3 className="w-3 h-3 text-primary" />
            </div>
            <h3 className="text-xs font-bold text-foreground tracking-tight">Study Progress</h3>
          </div>
          <span className="text-[9px] px-2.5 py-1 rounded-full bg-primary/8 border border-primary/15 text-primary font-bold">{totalActivity} total</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-4 h-4 animate-spin text-primary" /></div>
        ) : subjects.length === 0 ? (
          <div className="text-center py-8 space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-muted/10 border border-border/15 flex items-center justify-center mx-auto">
              <TrendingUp className="w-4 h-4 text-muted-foreground/30" />
            </div>
            <p className="text-[11px] text-muted-foreground/40">No data yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {subjects.map((subject, index) => {
              const pct = Math.round((subject.count / maxCount) * 100);
              const color = colors[index % colors.length];
              return (
                <motion.div
                  key={subject.name}
                  initial={{ opacity: 0, x: -14 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.08 }}
                  className="space-y-2 group cursor-pointer"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${color.dot} ring-2 ${color.ring}`} />
                      <span className="text-[11px] font-semibold text-foreground/75 group-hover:text-foreground transition-smooth">{subject.name}</span>
                    </div>
                    <span className="text-[10px] font-bold text-foreground/50 font-mono bg-muted/10 px-2 py-0.5 rounded-md border border-border/10">{subject.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted/10 overflow-hidden border border-border/5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 1.2, delay: 0.3 + index * 0.12, ease: [0.25, 0.46, 0.45, 0.94] }}
                      className={`h-full rounded-full bg-gradient-to-r ${color.bar} relative overflow-hidden`}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer bg-[length:200%_100%]" />
                    </motion.div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
};

export default StudyProgress;
