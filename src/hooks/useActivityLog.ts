import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useActivityLog = () => {
  const { user } = useAuth();

  const logActivity = async (activity_type: string, title: string, description: string = "") => {
    if (!user) return;
    await supabase.from("activity_log").insert({
      user_id: user.id,
      activity_type,
      title,
      description,
    });
  };

  return { logActivity };
};
