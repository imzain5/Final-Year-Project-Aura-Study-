import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Bell, Search, LogOut, Settings, Command } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const DashboardHeader = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const displayName = user?.user_metadata?.display_name || user?.email || "User";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <header className="h-14 border-b border-border/10 bg-background/40 backdrop-blur-3xl sticky top-0 z-50 relative">
      {/* Top shimmer line */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      
      <div className="h-full px-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-smooth" />
          <div className="relative w-72 hidden md:block group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50 group-focus-within:text-primary transition-smooth" />
            <Input 
              placeholder="Search anything..."
              className="pl-9 pr-20 h-9 bg-muted/10 border-border/10 focus:border-primary/30 focus:bg-muted/20 text-xs rounded-xl transition-all duration-300 placeholder:text-muted-foreground/30"
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-60 group-focus-within:opacity-40 transition-smooth">
              <kbd className="flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] bg-muted/20 border border-border/15 rounded-md text-muted-foreground/50 font-mono">
                <Command className="w-2.5 h-2.5" />K
              </kbd>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Status indicator */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/5 border border-accent/15 mr-1">
            <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            <span className="text-[9px] text-accent font-semibold uppercase tracking-wider">Online</span>
          </div>

          <Button variant="ghost" size="icon" className="relative h-9 w-9 text-muted-foreground hover:text-foreground rounded-xl hover:bg-muted/15">
            <Bell className="w-4 h-4" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-accent rounded-full border-2 border-background" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="h-9 w-9 rounded-xl gradient-primary flex items-center justify-center cursor-pointer shadow-card hover:shadow-glow-primary transition-all duration-300 text-xs font-bold relative overflow-hidden"
                style={{ color: 'white' }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/10" />
                <span className="relative z-10">{initial}</span>
              </motion.button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 glass-panel border-border/15 rounded-xl p-1.5">
              <div className="px-3 py-3 mb-1">
                <p className="text-xs font-semibold text-foreground">{displayName}</p>
                <p className="text-[10px] text-muted-foreground/60 mt-0.5 font-mono">{user?.email}</p>
              </div>
              <DropdownMenuSeparator className="bg-border/10 mx-1" />
              <DropdownMenuItem onClick={() => navigate("/settings")} className="text-[11px] cursor-pointer gap-2.5 rounded-lg py-2.5 px-3 focus:bg-muted/15">
                <Settings className="w-3.5 h-3.5 text-muted-foreground" /> Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border/10 mx-1" />
              <DropdownMenuItem onClick={signOut} className="text-[11px] text-destructive cursor-pointer gap-2.5 rounded-lg py-2.5 px-3 focus:bg-destructive/10">
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
