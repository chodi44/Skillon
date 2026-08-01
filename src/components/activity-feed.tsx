import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

export interface Activity {
  id: string;
  user_id: string;
  action_type: string;
  metadata: any;
  created_at: string;
  profiles: { full_name: string; avatar_url: string };
}

export function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    // Initial fetch
    supabase
      .from("activity_feed")
      .select("*, profiles(full_name, avatar_url)")
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (data) setActivities(data as any);
      });

    // Subscribe to realtime updates
    const sub = supabase
      .channel("activity_updates")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "activity_feed" }, async (payload) => {
        // Fetch profile data for the new activity
        const { data } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("id", payload.new.user_id)
          .single();
        
        const newAct = { ...payload.new, profiles: data } as Activity;
        setActivities((prev) => [newAct, ...prev].slice(0, 20));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
    };
  }, []);

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg text-foreground">Cohort Activity</h3>
      <div className="flex flex-col gap-3">
        {activities.map((act) => (
          <motion.div
            key={act.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-3 rounded-lg bg-card/50 backdrop-blur-md border border-white/5"
          >
            <div className="h-8 w-8 rounded-full overflow-hidden bg-muted">
              {act.profiles?.avatar_url ? (
                <img src={act.profiles.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-primary/20 text-primary font-medium text-xs">
                  {act.profiles?.full_name?.charAt(0) || "?"}
                </div>
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm">
                <span className="font-medium text-foreground">{act.profiles?.full_name || "Unknown"}</span>
                {" "}
                <span className="text-muted-foreground">{act.action_type}</span>
              </p>
              <p className="text-xs text-muted-foreground/60">
                {new Date(act.created_at).toLocaleString(undefined, {
                  month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                })}
              </p>
            </div>
          </motion.div>
        ))}
        {activities.length === 0 && (
          <div className="text-sm text-muted-foreground p-4 text-center border border-dashed border-white/10 rounded-lg">
            No activity yet.
          </div>
        )}
      </div>
    </div>
  );
}
