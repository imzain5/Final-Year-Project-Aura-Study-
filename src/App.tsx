import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import DashboardHeader from "@/components/DashboardHeader";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Tutor from "./pages/Tutor";
import Notes from "./pages/Notes";
import Flashcards from "./pages/Flashcards";
import Quizzes from "./pages/Quizzes";
import Planner from "./pages/Planner";
import Uploads from "./pages/Uploads";
import Insights from "./pages/Insights";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

const ScrollToTop = () => {
  const location = useLocation();
  useEffect(() => {
    // Reset scroll on all possible scroll containers
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    // Also scroll any sidebar layout containers
    const mainEl = document.querySelector("main");
    if (mainEl) mainEl.scrollTop = 0;
    const flexContainers = document.querySelectorAll("[class*='flex-1']");
    flexContainers.forEach((el) => { (el as HTMLElement).scrollTop = 0; });
  }, [location.pathname]);
  return null;
};

const ProtectedLayout = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-mesh">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  return (
    <SidebarProvider>
      <div className="min-h-screen w-full flex gradient-mesh">
        <AppSidebar />
        <div className="flex-1 flex flex-col w-full">
          <DashboardHeader />
          <main className="flex-1 w-full">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/tutor" element={<Tutor />} />
              <Route path="/notes" element={<Notes />} />
              <Route path="/flashcards" element={<Flashcards />} />
              <Route path="/quizzes" element={<Quizzes />} />
              <Route path="/planner" element={<Planner />} />
              <Route path="/uploads" element={<Uploads />} />
              <Route path="/insights" element={<Insights />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

const AuthRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return <Auth />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<AuthRoute />} />
            <Route path="/*" element={<ProtectedLayout />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
