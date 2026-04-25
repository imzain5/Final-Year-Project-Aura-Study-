import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Brain, Mail, Lock, User, ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success("Account created! Check your email to confirm.");
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4">
      {/* Background layers */}
      <div className="absolute inset-0 gradient-mesh" />
      <div className="absolute inset-0 dot-pattern opacity-15" />
      
      {/* Floating orbs */}
      <motion.div
        className="absolute w-72 h-72 rounded-full blur-[100px] opacity-20"
        style={{ background: 'hsl(var(--primary))' }}
        animate={{ x: [0, 60, 0], y: [0, -40, 0] }}
        transition={{ duration: 12, repeat: Infinity }}
      />
      <motion.div
        className="absolute w-96 h-96 rounded-full blur-[120px] opacity-15 right-0 bottom-0"
        style={{ background: 'hsl(var(--secondary))' }}
        animate={{ x: [0, -50, 0], y: [0, 30, 0] }}
        transition={{ duration: 15, repeat: Infinity }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative z-10 w-full max-w-md"
      >
        <Card className="glass-panel border border-border/15 p-8 md:p-10 space-y-8 rounded-3xl relative overflow-hidden">
          {/* Top shimmer */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
          {/* Corner glow */}
          <div className="absolute -top-20 -left-20 w-40 h-40 rounded-full blur-3xl opacity-20" style={{ background: 'hsl(var(--primary))' }} />
          
          <div className="flex flex-col items-center space-y-4 relative">
            <motion.div 
              className="w-16 h-16 rounded-3xl gradient-primary flex items-center justify-center shadow-glow-primary relative overflow-hidden"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/15" />
              <Brain className="w-8 h-8 relative z-10" style={{ color: 'white' }} />
            </motion.div>
            <div className="text-center space-y-1.5">
              <h1 className="text-2xl font-extrabold text-foreground tracking-tight">BrainGrid</h1>
              <p className="text-[11px] text-muted-foreground/50 uppercase tracking-[0.2em] font-semibold">
                {isLogin ? "Welcome back" : "Get started"}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 relative">
            {!isLogin && (
              <motion.div 
                className="space-y-2"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ duration: 0.3 }}
              >
                <Label htmlFor="name" className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">Display Name</Label>
                <div className="relative group">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within:text-primary transition-smooth" />
                  <Input
                    id="name"
                    placeholder="Alex"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="pl-11 h-12 bg-muted/10 border-border/15 focus:border-primary/40 rounded-xl text-sm transition-all duration-300"
                    required
                  />
                </div>
              </motion.div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">Email</Label>
              <div className="relative group">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within:text-primary transition-smooth" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-11 h-12 bg-muted/10 border-border/15 focus:border-primary/40 rounded-xl text-sm transition-all duration-300"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">Password</Label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within:text-primary transition-smooth" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-11 h-12 bg-muted/10 border-border/15 focus:border-primary/40 rounded-xl text-sm transition-all duration-300"
                  minLength={6}
                  required
                />
              </div>
            </div>

            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
              <Button type="submit" className="w-full h-12 gradient-primary shadow-glow-primary rounded-xl text-sm font-bold relative overflow-hidden group" disabled={loading}>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-[-100%] group-hover:translate-x-[100%]" />
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span className="flex items-center gap-2 relative z-10">
                    {isLogin ? "Sign In" : "Create Account"}
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </motion.div>
          </form>

          <div className="text-center relative">
            <div className="absolute left-0 right-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-border/20 to-transparent" />
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-[11px] text-muted-foreground/60 hover:text-primary transition-smooth pt-2 font-medium"
            >
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <span className="text-primary font-bold">{isLogin ? "Sign up" : "Sign in"}</span>
            </button>
          </div>
        </Card>

        {/* Bottom tagline */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-6 flex items-center justify-center gap-2"
        >
          <Sparkles className="w-3 h-3 text-primary/40" />
          <span className="text-[10px] text-muted-foreground/30 uppercase tracking-[0.2em] font-semibold">AI-Powered Learning Platform</span>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Auth;
