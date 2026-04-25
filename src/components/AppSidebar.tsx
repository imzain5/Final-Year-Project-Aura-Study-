import { Brain, LayoutDashboard, FileText, CreditCard, MessageSquare, Calendar, Settings, TrendingUp, BookOpen, ArrowUpFromLine } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { motion } from "framer-motion";

const mainNav = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "AI Tutor", url: "/tutor", icon: MessageSquare },
  { title: "Notes", url: "/notes", icon: FileText },
  { title: "Flashcards", url: "/flashcards", icon: CreditCard },
  { title: "Quizzes", url: "/quizzes", icon: BookOpen },
];

const toolsNav = [
  { title: "Study Planner", url: "/planner", icon: Calendar },
  { title: "Insights", url: "/insights", icon: TrendingUp },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const navigate = useNavigate();

  return (
    <Sidebar className="border-r border-border/8">
      <SidebarContent className="bg-[hsl(var(--sidebar-background))]">
        {/* Logo */}
        <div className="px-5 py-5 flex items-center gap-3 border-b border-border/8 relative">
          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/15 to-transparent" />
          <motion.div
            className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-glow-primary relative overflow-hidden"
            whileHover={{ scale: 1.05, rotate: 5 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/15" />
            <Brain className="w-4.5 h-4.5 relative z-10" style={{ color: 'white' }} />
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-accent animate-pulse border border-background" />
          </motion.div>
          {open && (
            <div className="flex flex-col">
              <span className="font-extrabold text-base text-foreground tracking-tight">BrainGrid</span>
              <span className="text-[8px] text-muted-foreground/40 uppercase tracking-[0.25em] font-bold">Pro Edition</span>
            </div>
          )}
        </div>

        {/* Upload CTA */}
        {open ? (
          <div className="px-3 py-3">
            <motion.button
              onClick={() => navigate("/uploads")}
              className="relative w-full p-3.5 rounded-2xl border border-primary/20 overflow-hidden group cursor-pointer transition-all duration-300 hover:border-primary/40 hover:shadow-glow-primary"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/8 to-primary/10 animate-gradient bg-[length:200%_100%]" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/8 to-transparent animate-shimmer bg-[length:200%_100%] opacity-0 group-hover:opacity-100" />
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
              <div className="relative flex items-center gap-3">
                <motion.div
                  className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow-primary relative overflow-hidden"
                  animate={{ y: [0, -3, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/15" />
                  <ArrowUpFromLine className="w-4 h-4 relative z-10" style={{ color: 'white' }} />
                </motion.div>
                <div className="flex-1 text-left">
                  <p className="text-[11px] font-bold text-foreground flex items-center gap-2">
                    Upload Document
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
                    </span>
                  </p>
                  <p className="text-[9px] text-muted-foreground/40 font-medium">Start here — powers all features</p>
                </div>
              </div>
            </motion.button>
          </div>
        ) : (
          <div className="px-2 py-3 flex justify-center">
            <motion.button
              onClick={() => navigate("/uploads")}
              className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-glow-primary relative overflow-hidden"
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              whileHover={{ scale: 1.1 }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/15" />
              <ArrowUpFromLine className="w-4 h-4 relative z-10" style={{ color: 'white' }} />
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent border border-background"></span>
              </span>
            </motion.button>
          </div>
        )}

        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground/30 px-5 py-2 text-[8px] uppercase tracking-[0.25em] font-bold">Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="mx-2">
                    <NavLink 
                      to={item.url} 
                      end={item.url === "/"}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all duration-300 hover:bg-muted/15 text-muted-foreground/60 hover:text-foreground text-[12px]"
                      activeClassName="bg-primary/10 text-primary border border-primary/15 shadow-glow-primary/20"
                    >
                      <item.icon className="w-[15px] h-[15px]" />
                      {open && <span className="font-semibold">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground/30 px-5 py-2 text-[8px] uppercase tracking-[0.25em] font-bold">Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {toolsNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="mx-2">
                    <NavLink 
                      to={item.url} 
                      end
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all duration-300 hover:bg-muted/15 text-muted-foreground/60 hover:text-foreground text-[12px]"
                      activeClassName="bg-primary/10 text-primary border border-primary/15"
                    >
                      <item.icon className="w-[15px] h-[15px]" />
                      {open && <span className="font-semibold">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Bottom branding */}
        {open && (
          <div className="mt-auto px-5 py-4 border-t border-border/8">
            <div className="flex items-center gap-2 opacity-30">
              <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              <span className="text-[8px] uppercase tracking-[0.2em] font-bold text-muted-foreground">Systems Active</span>
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
