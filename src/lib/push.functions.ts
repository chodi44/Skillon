import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// VAPID keys generated via: npx web-push generate-vapid-keys
const publicVapidKey = process.env.VITE_VAPID_PUBLIC_KEY ?? "";
const privateVapidKey = process.env.VAPID_PRIVATE_KEY ?? "";
const subject = process.env.VAPID_SUBJECT ?? "mailto:admin@skillon.local";

export const subscribeToPush = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { endpoint: string; keys: { p256dh: string; auth: string } }) => d)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("push_subscriptions").upsert({
      user_id: userId,
      endpoint: data.endpoint,
      p256dh: data.keys.p256dh,
      auth: data.keys.auth,
    }, { onConflict: "endpoint" });
    
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const sendPushNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { title: string; body: string; targetUserId?: string }) => d)
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    
    // Only admins should ideally call this, but simplified for now
    let query = supabase.from("push_subscriptions").select("*");
    if (data.targetUserId) {
      query = query.eq("user_id", data.targetUserId);
    }
    
    const { data: subs, error } = await query;
    if (error) throw new Error(error.message);
    
    const payload = JSON.stringify({ title: data.title, body: data.body });
    
    // Dynamically import web-push on the server to prevent bundler errors on client
    const webpush = await import("web-push");
    if (publicVapidKey && privateVapidKey) {
      webpush.setVapidDetails(subject, publicVapidKey, privateVapidKey);
    }
    
    const results = await Promise.allSettled(
      (subs || []).map(sub => 
        webpush.sendNotification({
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth }
        }, payload)
      )
    );
    
    return { sent: results.filter(r => r.status === 'fulfilled').length, total: subs?.length || 0 };
  });
