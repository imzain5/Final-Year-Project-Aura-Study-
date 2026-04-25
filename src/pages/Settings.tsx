import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { User, Bell, Lock, Palette, Globe, Save, Shield, Trash2, LogOut } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

const Settings = () => {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState({ name: "", goal: "" });

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const { data } = await supabase.from("profiles").select("display_name").eq("user_id", user.id).single();
      setProfile({ name: data?.display_name || user.user_metadata?.display_name || user.email || "", goal: "" });
    };
    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    const { error } = await supabase.from("profiles").update({ display_name: profile.name }).eq("user_id", user.id);
    toast[error ? "error" : "success"](error ? "Failed to save" : "Settings saved! ✨");
  };

  const [notifications, setNotifications] = useState({ reminders: true, quizDeadlines: true, achievements: false, weekly: true, aiRecs: true });
  const [appearance, setAppearance] = useState({ darkMode: true, animations: true, compact: false, aiAvatar: true });

  const toggleNotif = (key: keyof typeof notifications) => { setNotifications(p => ({ ...p, [key]: !p[key] })); toast.success(!notifications[key] ? "Enabled" : "Disabled"); };
  const toggleAppearance = (key: keyof typeof appearance) => { setAppearance(p => ({ ...p, [key]: !p[key] })); toast.success(!appearance[key] ? "Enabled" : "Disabled"); };

  const sections = [
    {
      icon: User, title: "Profile", gradient: "gradient-primary",
      content: (
        <div className="space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center text-xl font-bold shadow-glow-primary" style={{ color: 'white' }}>{profile.name.charAt(0).toUpperCase() || "?"}</div>
            <div>
              <p className="text-xs font-semibold text-foreground">{profile.name}</p>
              <p className="text-[10px] text-muted-foreground/60">{user?.email}</p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Display Name</Label>
              <Input value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} className="bg-muted/10 border-border/15 focus:border-primary/30 h-8 text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Study Goal</Label>
              <Input value={profile.goal} onChange={e => setProfile(p => ({ ...p, goal: e.target.value }))} className="bg-muted/10 border-border/15 focus:border-primary/30 h-8 text-xs" />
            </div>
          </div>
        </div>
      ),
    },
    {
      icon: Bell, title: "Notifications", gradient: "gradient-accent",
      content: (
        <div className="space-y-2">
          {[
            { key: "reminders" as const, label: "Study Reminders", desc: "Get reminded when it's time to study" },
            { key: "quizDeadlines" as const, label: "Quiz Deadlines", desc: "Alerts before quizzes are due" },
            { key: "achievements" as const, label: "Achievement Alerts", desc: "Celebrate when you unlock badges" },
            { key: "weekly" as const, label: "Weekly Reports", desc: "Summary of your progress every Sunday" },
            { key: "aiRecs" as const, label: "AI Recommendations", desc: "Smart suggestions for what to study next" },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between py-2 px-1 rounded-lg hover:bg-muted/8 transition-smooth">
              <div>
                <Label className="text-[11px] font-medium text-foreground/90">{item.label}</Label>
                <p className="text-[9px] text-muted-foreground/50">{item.desc}</p>
              </div>
              <Switch checked={notifications[item.key]} onCheckedChange={() => toggleNotif(item.key)} />
            </div>
          ))}
        </div>
      ),
    },
    {
      icon: Palette, title: "Appearance", gradient: "gradient-warm",
      content: (
        <div className="space-y-2">
          {[
            { key: "darkMode" as const, label: "Dark Mode", desc: "Use dark theme" },
            { key: "animations" as const, label: "Animations", desc: "Enable UI animations" },
            { key: "compact" as const, label: "Compact View", desc: "Reduce spacing" },
            { key: "aiAvatar" as const, label: "Show AI Avatar", desc: "Display AI avatar in chat" },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between py-2 px-1 rounded-lg hover:bg-muted/8 transition-smooth">
              <div>
                <Label className="text-[11px] font-medium text-foreground/90">{item.label}</Label>
                <p className="text-[9px] text-muted-foreground/50">{item.desc}</p>
              </div>
              <Switch checked={appearance[item.key]} onCheckedChange={() => toggleAppearance(item.key)} />
            </div>
          ))}
        </div>
      ),
    },
    {
      icon: Globe, title: "Language & Region", gradient: "gradient-primary",
      content: (
        <div className="grid md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Language</Label>
            <Input defaultValue="English (US)" className="bg-muted/10 border-border/15 h-8 text-xs" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Timezone</Label>
            <Input defaultValue="EST (UTC-5)" className="bg-muted/10 border-border/15 h-8 text-xs" />
          </div>
        </div>
      ),
    },
    {
      icon: Shield, title: "Security", gradient: "gradient-accent",
      content: (
        <div className="space-y-1.5">
          <Button onClick={() => toast.info("Password change dialog")} variant="ghost" className="w-full justify-start h-8 text-[11px] text-foreground/70 hover:bg-muted/10 gap-2">
            <Lock className="w-3 h-3" /> Change Password
          </Button>
          <Button onClick={() => toast.info("2FA setup")} variant="ghost" className="w-full justify-start h-8 text-[11px] text-foreground/70 hover:bg-muted/10 gap-2">
            <Shield className="w-3 h-3" /> Two-Factor Authentication
            <Badge variant="outline" className="ml-auto border-accent/15 text-accent text-[8px]">Enabled</Badge>
          </Button>
          <Separator className="bg-border/10 my-1" />
          <Button onClick={signOut} variant="ghost" className="w-full justify-start h-8 text-[11px] text-foreground/70 hover:bg-muted/10 gap-2">
            <LogOut className="w-3 h-3" /> Sign Out
          </Button>
          <Button onClick={() => toast.error("Requires confirmation")} variant="ghost" className="w-full justify-start h-8 text-[11px] text-destructive/80 hover:bg-destructive/5 gap-2">
            <Trash2 className="w-3 h-3" /> Delete Account
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-3xl">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">Settings</h1>
        <p className="text-xs text-muted-foreground/70">Customize your experience</p>
      </motion.div>

      {sections.map((section, i) => (
        <motion.div key={section.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
          <Card className="glass-panel border border-border/15 p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className={`w-8 h-8 rounded-lg ${section.gradient} flex items-center justify-center shadow-card`}>
                <section.icon className="w-3.5 h-3.5" style={{ color: 'white' }} />
              </div>
              <h2 className="text-xs font-semibold text-foreground">{section.title}</h2>
            </div>
            {section.content}
          </Card>
        </motion.div>
      ))}

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="flex justify-end">
        <Button onClick={handleSave} className="gradient-primary shadow-card hover:shadow-glow-primary text-xs h-8 px-6 transition-smooth">
          <Save className="w-3.5 h-3.5 mr-1.5" /> Save Changes
        </Button>
      </motion.div>
    </div>
  );
};

export default Settings;
