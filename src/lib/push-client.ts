import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./auth";
import { subscribeToPush } from "./push.functions";
import { useServerFn } from "@tanstack/react-start";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY ?? "";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

type PushState = "unsupported" | "prompt" | "denied" | "subscribed" | "loading";

export function usePushSubscription() {
  const { user } = useAuth();
  const subscribe = useServerFn(subscribeToPush);
  const [state, setState] = useState<PushState>("loading");

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !VAPID_PUBLIC_KEY) {
      setState("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setState("denied");
      return;
    }

    // Check if already subscribed
    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      setState(sub ? "subscribed" : "prompt");
    });
  }, []);

  const requestSubscription = useCallback(async () => {
    if (!user || !VAPID_PUBLIC_KEY) return;
    setState("loading");

    try {
      const permission = await Notification.requestPermission();
      if (permission === "denied") {
        setState("denied");
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();

      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
      }

      const json = sub.toJSON();
      await subscribe({
        data: {
          endpoint: sub.endpoint,
          keys: {
            p256dh: json.keys?.p256dh ?? "",
            auth: json.keys?.auth ?? "",
          },
        },
      });

      setState("subscribed");
    } catch (err) {
      console.error("Push subscription error:", err);
      setState("prompt");
    }
  }, [user, subscribe]);

  return { state, requestSubscription };
}
