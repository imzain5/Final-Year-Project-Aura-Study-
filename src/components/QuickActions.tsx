import { Card } from "@/components/ui/card";
import { Upload, Brain, FileText, Calendar, Zap, BookOpen, Sparkles, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const QuickActions = () => {
  const navigate = useNavigate();

  const actions = [
    { icon: Upload, label: "Upload", desc: "PDF, DOCX, TXT", gradient: "gradient-primary", path: "/uploads", glow: "shadow-glow-primary", ring: "ring-primary/20" },
    { icon: Brain, label: "AI Tutor", desc: "Ask anything", gradient: "gradient-accent", path: "/tutor", glow: "shadow-glow-accent", ring: "ring-accent/20" },
    { icon: FileText, label: "Flashcards", desc: "Auto-generate", gradient: "gradient-warm", path: "/flashcards", glow: "shadow-glow-secondary", ring: "ring-secondary/20" },
    { icon: Zap, label: "Quiz", desc: "Test yourself", gradient: "gradient-primary", path: "/quizzes", glow: "shadow-glow-primary", ring: "ring-primary/20" },
    { icon: Calendar, label: "Planner", desc: "Smart schedule", gradient: "gradient-accent", path: "/planner", glow: "shadow-glow-accent", ring: "ring-accent/20" },
    { icon: BookOpen, label: "Library", desc: "All notes", gradient: "gradient-warm", path: "/notes", glow: "shadow-glow-secondary", ring: "ring-secondary/20" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <Card className="glass-panel border border-border/15 p-5 relative overflow-hidden rounded-2xl">
        {/* Background mesh */}
        <div className="absolute inset-0 opacity-20" style={{ background: 'var(--gradient-mesh)' }} />
        {/* Dot pattern */}
        <div className="absolute inset-0 dot-pattern opacity-30" />
        
        <div className="relative">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-primary/10 border border-primary/15 flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-primary" />
              </div>
              <h3 className="text-xs font-bold text-foreground tracking-tight">Quick Actions</h3>
            </div>
            <span className="text-[9px] text-muted-foreground/40 uppercase tracking-widest font-semibold">Navigate</span>
          </div>

          <div className="grid grid-cols-3 md:grid-cols-6 gap-2.5">
            {actions.map((action, index) => (
              <motion.button
                key={index}
                onClick={() => navigate(action.path)}
                className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-muted/5 border border-border/10 hover:border-primary/20 transition-all duration-400 group cursor-pointer relative overflow-hidden"
                whileHover={{ y: -6, scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 + index * 0.06 }}
              >
                {/* Hover radial glow */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-600 rounded-2xl" 
                  style={{ background: 'radial-gradient(circle at 50% 20%, hsl(var(--primary) / 0.1), transparent 70%)' }} />
                
                {/* Bottom accent line on hover */}
                <div className={`absolute bottom-0 left-1/4 right-1/4 h-[2px] ${action.gradient} opacity-0 group-hover:opacity-100 transition-all duration-500 rounded-full`} />
                
                <motion.div 
                  className={`w-11 h-11 rounded-xl ${action.gradient} flex items-center justify-center shadow-card relative overflow-hidden`}
                  whileHover={{ rotate: 5 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/15" />
                  <action.icon className="w-5 h-5 relative z-10" style={{ color: 'white' }} />
                </motion.div>
                <div className="text-center relative">
                  <span className="text-[11px] font-bold text-foreground/90 block leading-tight group-hover:text-foreground transition-smooth">{action.label}</span>
                  <span className="text-[8px] text-muted-foreground/40 mt-0.5 block tracking-wider uppercase">{action.desc}</span>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default QuickActions;
