import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Brain, Zap, FileText, Trophy, BookOpen, Loader2, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";

const iconMap: Record<string, any> = {
  task_complete: CheckCircle2, quiz_complete: Trophy, flashcard_session: Brain,
  note_create: FileText, task_add: BookOpen, deck_create: Zap, upload: FileText,
};

const accentMap: Record<string, { text: string; bg: string; glow: string }> = {
  task_complete: { text: "text-accent", bg: "bg-accent/10 border-accent/15", glow: "group-hover:shadow-glow-accent" },
  quiz_complete: { text: "text-primary", bg: "bg-primary/10 border-primary/15", glow: "group-hover:shadow-glow-primary" },
  flashcard_session: { text: "text-secondary", bg: "bg-secondary/10 border-secondary/15", glow: "group-hover:shadow-glow-secondary" },
  note_create: { text: "text-primary", bg: "bg-primary/10 border-primary/15", glow: "group-hover:shadow-glow-primary" },
  task_add: { text: "text-accent", bg: "bg-accent/10 border-accent/15", glow: "group-hover:shadow-glow-accent" },
  deck_create: { text: "text-secondary", bg: "bg-secondary/10 border-secondary/15", glow: "group-hover:shadow-glow-secondary" },
  upload: { text: "text-primary", bg: "bg-primary/10 border-primary/15", glow: "group-hover:shadow-glow-primary" },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "1d" : `${days}d`;
}

const ActivityFeed = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase.from("activity_log").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(6);
      if (data) setActivities(data);
      setLoading(false);
    };
    fetch();
  }, [user]);

  return (
    <Card className="glass-panel border border-border/15 p-4 relative overflow-hidden rounded-2xl">
      <div className="absolute inset-0 opacity-10" style={{ background: 'radial-gradient(circle at 20% 80%, hsl(var(--accent) / 0.15), transparent 60%)' }} />
      
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-accent/10 border border-accent/15 flex items-center justify-center">
              <Activity className="w-3 h-3 text-accent" />
            </div>
            <h3 className="text-xs font-bold text-foreground tracking-tight">Activity</h3>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/8 border border-accent/15">
            <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            <span className="text-[8px] text-accent font-bold uppercase tracking-[0.15em]">Live</span>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-4 h-4 animate-spin text-primary" /></div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8 space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-muted/10 border border-border/15 flex items-center justify-center mx-auto">
              <Activity className="w-4 h-4 text-muted-foreground/30" />
            </div>
            <p className="text-[11px] text-muted-foreground/40">No activity yet</p>
          </div>
        ) : (
          <div className="space-y-1">
            {activities.map((activity, i) => {
              const Icon = iconMap[activity.activity_type] || FileText;
              const accent = accentMap[activity.activity_type] || { text: "text-primary", bg: "bg-primary/10 border-primary/15", glow: "" };
              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-muted/8 transition-all duration-300 cursor-pointer group"
                >
                  <div className={`w-8 h-8 rounded-xl ${accent.bg} border flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-all duration-300`}>
                    <Icon className={`w-3.5 h-3.5 ${accent.text}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-foreground/85 leading-tight truncate group-hover:text-foreground transition-smooth">{activity.title}</p>
                    <p className="text-[9px] text-muted-foreground/40 mt-0.5 truncate">{activity.description}</p>
                  </div>
                  <span className="text-[9px] text-muted-foreground/30 flex-shrink-0 font-mono px-2 py-0.5 rounded-lg bg-muted/8 border border-border/10">
                    {timeAgo(activity.created_at)}
                  </span>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
};

export default ActivityFeed;
