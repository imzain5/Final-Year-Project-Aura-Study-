import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Calendar, Plus, Clock, Target, CheckCircle2, Circle, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useActivityLog } from "@/hooks/useActivityLog";
import { motion } from "framer-motion";

interface PlannerTask { id: string; subject: string; topic: string; scheduled_time: string; duration: string; done: boolean; task_date: string; }

const Planner = () => {
  const { user } = useAuth();
  const { logActivity } = useActivityLog();
  const [schedule, setSchedule] = useState<PlannerTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState({ subject: "", topic: "", time: "", duration: "" });
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (!user) return;
    const fetchTasks = async () => {
      const { data, error } = await supabase.from("planner_tasks").select("*").eq("user_id", user.id).order("scheduled_time", { ascending: true });
      if (!error && data) setSchedule(data as PlannerTask[]);
      setLoading(false);
    };
    fetchTasks();
  }, [user]);

  const toggleTask = async (id: string) => {
    const task = schedule.find((t) => t.id === id); if (!task) return;
    const newDone = !task.done;
    setSchedule((prev) => prev.map((t) => (t.id === id ? { ...t, done: newDone } : t)));
    await supabase.from("planner_tasks").update({ done: newDone }).eq("id", id);
    if (newDone) { logActivity("task_complete", "Task Completed", `${task.subject}: ${task.topic}`); toast.success("Done! ✓"); } else { toast("Marked incomplete"); }
  };

  const deleteTask = async (id: string) => {
    setSchedule((prev) => prev.filter((t) => t.id !== id));
    await supabase.from("planner_tasks").delete().eq("id", id);
    toast("Removed");
  };

  const addTask = async () => {
    if (!newTask.subject || !newTask.topic || !user) { toast.error("Fill in subject & topic"); return; }
    const { data, error } = await supabase.from("planner_tasks").insert({ user_id: user.id, subject: newTask.subject, topic: newTask.topic, scheduled_time: newTask.time || "TBD", duration: newTask.duration || "30m", done: false, task_date: today }).select().single();
    if (error) { toast.error("Failed"); return; }
    setSchedule((prev) => [...prev, data as PlannerTask]);
    setNewTask({ subject: "", topic: "", time: "", duration: "" }); setDialogOpen(false);
    logActivity("task_add", "Task Added", `${newTask.subject}: ${newTask.topic}`);
    toast.success("Added! 📝");
  };

  const todayTasks = schedule.filter((t) => t.task_date === today);
  const doneCount = todayTasks.filter((t) => t.done).length;

  if (loading) return <div className="p-6 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>;

  const plannerStats = [
    { label: "Today", value: `${todayTasks.length}`, icon: Calendar, gradient: "gradient-primary" },
    { label: "Done", value: `${doneCount}/${todayTasks.length}`, icon: Clock, gradient: "gradient-accent" },
    { label: "Progress", value: `${todayTasks.length > 0 ? Math.round((doneCount / todayTasks.length) * 100) : 0}%`, icon: Target, gradient: "gradient-warm" },
  ];

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1400px]">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">Study Planner</h1>
          <p className="text-xs text-muted-foreground/70">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })} · {doneCount} of {todayTasks.length} done</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary shadow-card hover:shadow-glow-primary text-xs h-8 transition-smooth gap-1.5"><Plus className="w-3.5 h-3.5" /> Add Task</Button>
          </DialogTrigger>
          <DialogContent className="glass-panel border border-border/15">
            <DialogHeader><DialogTitle className="text-sm">Add Task</DialogTitle></DialogHeader>
            <div className="space-y-3 pt-2">
              <div className="space-y-1.5"><Label className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Subject</Label><Input value={newTask.subject} onChange={(e) => setNewTask((p) => ({ ...p, subject: e.target.value }))} placeholder="e.g. Biology" className="bg-muted/10 border-border/15 h-8 text-xs" /></div>
              <div className="space-y-1.5"><Label className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Topic</Label><Input value={newTask.topic} onChange={(e) => setNewTask((p) => ({ ...p, topic: e.target.value }))} placeholder="e.g. Chapter 5" className="bg-muted/10 border-border/15 h-8 text-xs" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Time</Label><Input value={newTask.time} onChange={(e) => setNewTask((p) => ({ ...p, time: e.target.value }))} placeholder="14:00" className="bg-muted/10 border-border/15 h-8 text-xs" /></div>
                <div className="space-y-1.5"><Label className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Duration</Label><Input value={newTask.duration} onChange={(e) => setNewTask((p) => ({ ...p, duration: e.target.value }))} placeholder="1h" className="bg-muted/10 border-border/15 h-8 text-xs" /></div>
              </div>
              <Button onClick={addTask} className="w-full gradient-primary shadow-card text-xs h-8">Add Task</Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      <div className="grid grid-cols-3 gap-3">
        {plannerStats.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <Card className="glass-panel-hover p-3.5">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl ${stat.gradient} flex items-center justify-center shadow-card`}>
                  <stat.icon className="w-4 h-4" style={{ color: 'white' }} />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground/60">{stat.label}</p>
                  <p className="text-lg font-bold text-foreground leading-tight">{stat.value}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="glass-panel border border-border/15 p-5">
        <h2 className="text-xs font-semibold text-foreground mb-3">Today's Schedule</h2>
        <div className="space-y-1.5">
          {todayTasks.map((item, i) => (
            <motion.div key={item.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
              className={`p-3 rounded-xl border transition-smooth group ${item.done ? "bg-muted/5 border-border/8 opacity-60" : "bg-muted/8 border-border/12 hover:border-primary/15"}`}
            >
              <div className="flex items-center gap-2.5">
                <button onClick={() => toggleTask(item.id)} className="flex-shrink-0">
                  {item.done ? <CheckCircle2 className="w-4.5 h-4.5 text-accent" /> : <Circle className="w-4.5 h-4.5 text-muted-foreground/25 hover:text-primary transition-smooth" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-[11px] font-medium ${item.done ? "text-muted-foreground/50 line-through" : "text-foreground/90"}`}>{item.subject}: {item.topic}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[9px] text-muted-foreground/40 font-mono">{item.scheduled_time}</span>
                    <span className="text-[9px] text-muted-foreground/30">·</span>
                    <span className="text-[9px] text-muted-foreground/40 font-mono">{item.duration}</span>
                  </div>
                </div>
                <Button onClick={() => deleteTask(item.id)} variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground/30 hover:text-destructive"><X className="w-3 h-3" /></Button>
              </div>
            </motion.div>
          ))}
          {todayTasks.length === 0 && <div className="text-center py-8 text-muted-foreground/50 text-xs">No tasks yet. Add one above!</div>}
        </div>
      </Card>

      {schedule.filter((t) => t.task_date !== today).length > 0 && (
        <Card className="glass-panel border border-border/15 p-5">
          <h2 className="text-xs font-semibold text-foreground mb-3">Other Tasks</h2>
          <div className="space-y-1.5">
            {schedule.filter((t) => t.task_date !== today).map((item) => (
              <div key={item.id} className="p-2.5 rounded-xl bg-muted/5 border border-border/10 flex items-center gap-2.5 group">
                <button onClick={() => toggleTask(item.id)} className="flex-shrink-0">
                  {item.done ? <CheckCircle2 className="w-4 h-4 text-accent" /> : <Circle className="w-4 h-4 text-muted-foreground/25" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-foreground/80">{item.subject}: {item.topic}</p>
                  <p className="text-[9px] text-muted-foreground/40 font-mono">{item.task_date} · {item.scheduled_time} · {item.duration}</p>
                </div>
                <Button onClick={() => deleteTask(item.id)} variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground/30 hover:text-destructive"><X className="w-3 h-3" /></Button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default Planner;
