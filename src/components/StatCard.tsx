import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  change?: string;
  trend?: "up" | "down";
  gradient?: string;
  index?: number;
}

const gradientVars: Record<string, string> = {
  "gradient-primary": "var(--gradient-primary)",
  "gradient-accent": "var(--gradient-accent)",
  "gradient-warm": "var(--gradient-warm)",
};

const StatCard = ({ icon: Icon, label, value, change, trend, gradient = "gradient-primary", index = 0 }: StatCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <Card className="glass-panel-hover p-5 group relative overflow-hidden border border-border/15 rounded-2xl">
        {/* Animated corner glow */}
        <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-0 group-hover:opacity-60 transition-all duration-700 blur-3xl"
          style={{ background: gradientVars[gradient] || gradientVars["gradient-primary"] }} />
        
        {/* Top shimmer line */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/25 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />
        
        {/* Subtle noise texture */}
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />
        
        <div className="relative flex items-start justify-between">
          <div className="space-y-2.5 flex-1">
            <p className="text-[10px] text-muted-foreground/50 font-semibold uppercase tracking-[0.15em]">{label}</p>
            <motion.p 
              className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tighter leading-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 + index * 0.1 }}
            >
              {value}
            </motion.p>
            {change && (
              <div className="flex items-center gap-1.5 pt-0.5">
                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${trend === 'up' ? 'bg-accent/8 border border-accent/15' : 'bg-destructive/8 border border-destructive/15'}`}>
                  {trend === 'up' ? (
                    <TrendingUp className="w-2.5 h-2.5 text-accent" />
                  ) : (
                    <TrendingDown className="w-2.5 h-2.5 text-destructive" />
                  )}
                  <p className={`text-[9px] font-bold ${trend === 'up' ? 'text-accent' : 'text-destructive'}`}>
                    {change}
                  </p>
                </div>
              </div>
            )}
          </div>
          <motion.div 
            className={`w-12 h-12 rounded-2xl ${gradient} flex items-center justify-center shadow-card relative overflow-hidden`}
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/15" />
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all duration-500" />
            <Icon className="w-5 h-5 relative z-10" style={{ color: 'white' }} />
          </motion.div>
        </div>

        {/* Bottom progress accent */}
        <motion.div
          className={`absolute bottom-0 left-0 h-[2px] ${gradient} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: '35%' }}
          transition={{ duration: 1.2, delay: 0.4 + index * 0.12, ease: [0.25, 0.46, 0.45, 0.94] }}
        />
      </Card>
    </motion.div>
  );
};

export default StatCard;
