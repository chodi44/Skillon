import { useEffect, useRef, useState } from "react";
import { usePersonalAlarms, usePersonalTimetable } from "@/lib/personal-store";
import { Bell, X } from "lucide-react";

type Ringing = { title: string; subtitle?: string };

function beep(durationSec: number) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const AC: typeof AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AC) return () => {};
    const ctx = new AC();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.value = 0.0001;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    const t0 = ctx.currentTime;
    // pulsing envelope
    for (let i = 0; i < durationSec * 2; i++) {
      const t = t0 + i * 0.5;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.35, t + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
    }
    osc.stop(t0 + durationSec);
    return () => {
      try {
        osc.stop();
        ctx.close();
      } catch {}
    };
  } catch {
    return () => {};
  }
}

function vibrate() {
  try {
    navigator.vibrate?.([400, 200, 400, 200, 800]);
  } catch {}
}

function notify(title: string, body?: string) {
  try {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body, tag: "skillon-alarm", renotify: true } as NotificationOptions);
    }
  } catch {}
}

function todayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(
    d.getHours(),
  ).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function AlarmRunner() {
  const { alarms, updateAlarm, removeAlarm } = usePersonalAlarms();
  const { slots, updateSlot } = usePersonalTimetable();
  const [ringing, setRinging] = useState<Ringing | null>(null);
  const stopRef = useRef<() => void>(() => {});

  // Ask for notification permission once user is present
  useEffect(() => {
    if (typeof window === "undefined") return;
    if ("Notification" in window && Notification.permission === "default") {
      // Fire on first user gesture to avoid autoplay/perm issues
      const onTouch = () => {
        Notification.requestPermission().catch(() => {});
        window.removeEventListener("pointerdown", onTouch);
      };
      window.addEventListener("pointerdown", onTouch, { once: true });
      return () => window.removeEventListener("pointerdown", onTouch);
    }
  }, []);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const dow = now.getDay();
      const key = todayKey(now);

      // Alarms
      for (const a of alarms) {
        if (!a.enabled) continue;
        if (a.time !== hhmm) continue;
        if (a.lastFired === key) continue;
        const daysOk = a.days.length === 0 ? true : a.days.includes(dow);
        if (!daysOk) continue;
        updateAlarm(a.id, { lastFired: key });
        setRinging({ title: `⏰ ${a.label || "Alarm"}`, subtitle: a.time });
        notify("Alarm", a.label || a.time);
        vibrate();
        stopRef.current?.();
        stopRef.current = beep(20);
        if (a.days.length === 0) {
          // one-shot: disable after firing
          updateAlarm(a.id, { enabled: false, lastFired: key });
        }
        return;
      }

      // Timetable slots (5 min before start)
      for (const s of slots) {
        if (!s.notify) continue;
        if (s.day !== dow) continue;
        // fire at exactly start time
        if (s.start !== hhmm) continue;
        if (s.lastNotified === key) continue;
        updateSlot(s.id, { lastNotified: key });
        setRinging({ title: `📚 ${s.title}`, subtitle: `${s.start} — ${s.end}` });
        notify("Timetable", `${s.title} · ${s.start}–${s.end}`);
        vibrate();
        stopRef.current?.();
        stopRef.current = beep(10);
        return;
      }
    };
    tick();
    const id = setInterval(tick, 15_000);
    return () => clearInterval(id);
  }, [alarms, slots, updateAlarm, updateSlot]);

  // clean up beep on unmount
  useEffect(() => () => stopRef.current?.(), []);

  if (!ringing) return null;
  return (
    <div className="fixed inset-0 z-[9999] grid place-items-center bg-black/70 px-6" role="alertdialog" aria-live="assertive">
      <div className="w-full max-w-sm rounded-3xl bg-butter p-6 text-[#12121a] shadow-2xl ring-1 ring-black/10 animate-pulse">
        <div className="flex items-start gap-3">
          <Bell className="mt-1 h-6 w-6" />
          <div className="flex-1">
            <div className="text-[10px] font-black uppercase tracking-widest text-black/60">Alarm</div>
            <div className="mt-1 font-display text-2xl leading-tight">{ringing.title}</div>
            {ringing.subtitle && <div className="mt-1 text-sm text-black/70">{ringing.subtitle}</div>}
          </div>
          <button
            onClick={() => {
              stopRef.current?.();
              setRinging(null);
            }}
            className="rounded-full bg-black/10 p-1.5"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <button
          onClick={() => {
            stopRef.current?.();
            setRinging(null);
          }}
          className="btn-primary mt-5 w-full"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
