import { useEffect, useState, useCallback } from "react";
import { useAuth } from "./auth";
import { supabase } from "@/integrations/supabase/client";

export type PersonalItem = {
  id: string;
  title: string;
  description?: string;
  link?: string;
  done?: boolean;
  createdAt: number;
};

export type PersonalTrack = {
  id: string;
  name: string;
  color: string;
  createdAt: number;
  items: PersonalItem[];
};

export type PersonalNote = {
  id: string;
  title: string;
  body: string;
  createdAt: number;
  updatedAt: number;
};

export type PersonalAlarm = {
  id: string;
  time: string; // HH:MM (24h)
  label: string;
  enabled: boolean;
  days: number[]; // 0=Sun..6=Sat; [] = one-shot next occurrence
  lastFired?: string; // YYYY-MM-DD HH:MM key
};

export type TimetableSlot = {
  id: string;
  day: number; // 0..6
  start: string; // HH:MM
  end: string; // HH:MM
  title: string;
  notes?: string;
  notify: boolean;
  lastNotified?: string;
};

const PALETTE = ["#ffd970", "#a3e4a1", "#f7a1c4", "#8fbcff", "#ffb178", "#c8a2ff"];

export function usePersonalTracks() {
  const { user } = useAuth();
  const [tracks, setTracks] = useState<PersonalTrack[]>([]);

  const fetchTracks = useCallback(async () => {
    if (!user) return setTracks([]);
    const { data: tData } = await supabase
      .from("personal_tracks")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (!tData) return setTracks([]);

    const { data: iData } = await supabase
      .from("personal_items")
      .select("*")
      .order("created_at", { ascending: false });

    const itemsByTrack = (iData || []).reduce((acc: any, item: any) => {
      acc[item.track_id] = acc[item.track_id] || [];
      acc[item.track_id].push({
        id: item.id,
        title: item.title,
        description: item.description,
        link: item.link,
        done: item.done,
        createdAt: new Date(item.created_at).getTime(),
      });
      return acc;
    }, {});

    const mapped = tData.map((t: any) => ({
      id: t.id,
      name: t.name,
      color: t.color,
      createdAt: new Date(t.created_at).getTime(),
      items: itemsByTrack[t.id] || [],
    }));
    
    setTracks(mapped);
  }, [user]);

  useEffect(() => {
    void fetchTracks();
  }, [fetchTracks]);

  const addTrack = async (name: string) => {
    if (!user) return;
    const color = PALETTE[tracks.length % PALETTE.length];
    const { data, error } = await supabase
      .from("personal_tracks")
      .insert({ user_id: user.id, name: name.trim() || "Untitled", color })
      .select()
      .single();
    if (!error && data) {
      setTracks((p) => [{
        id: data.id, name: data.name, color: data.color, createdAt: new Date(data.created_at).getTime(), items: []
      }, ...p]);
    }
  };

  const renameTrack = async (id: string, name: string) => {
    if (!user) return;
    setTracks((p) => p.map((t) => (t.id === id ? { ...t, name } : t)));
    await supabase.from("personal_tracks").update({ name }).eq("id", id);
  };

  const removeTrack = async (id: string) => {
    if (!user) return;
    setTracks((p) => p.filter((t) => t.id !== id));
    await supabase.from("personal_tracks").delete().eq("id", id);
  };

  const addItem = async (trackId: string, item: Omit<PersonalItem, "id" | "createdAt">) => {
    if (!user) return;
    const tempId = Math.random().toString();
    setTracks((p) => p.map((t) => t.id === trackId ? { ...t, items: [{ ...item, id: tempId, createdAt: Date.now() }, ...t.items] } : t));
    
    const { data, error } = await supabase.from("personal_items").insert({
      track_id: trackId,
      title: item.title,
      description: item.description,
      link: item.link,
      done: item.done || false
    }).select().single();
    
    if (!error && data) {
      setTracks((p) => p.map((t) => t.id === trackId ? {
        ...t,
        items: t.items.map(i => i.id === tempId ? { ...i, id: data.id, createdAt: new Date(data.created_at).getTime() } : i)
      } : t));
    }
  };

  const updateItem = async (trackId: string, itemId: string, patch: Partial<PersonalItem>) => {
    if (!user) return;
    setTracks((p) => p.map((t) => t.id === trackId ? { ...t, items: t.items.map((i) => (i.id === itemId ? { ...i, ...patch } : i)) } : t));
    await supabase.from("personal_items").update(patch).eq("id", itemId);
  };

  const removeItem = async (trackId: string, itemId: string) => {
    if (!user) return;
    setTracks((p) => p.map((t) => t.id === trackId ? { ...t, items: t.items.filter((i) => i.id !== itemId) } : t));
    await supabase.from("personal_items").delete().eq("id", itemId);
  };

  return { tracks, addTrack, renameTrack, removeTrack, addItem, updateItem, removeItem };
}

export function usePersonalNotes() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<PersonalNote[]>([]);

  const fetchNotes = useCallback(async () => {
    if (!user) return setNotes([]);
    const { data } = await supabase
      .from("personal_notes")
      .select("*")
      .order("updated_at", { ascending: false });
    
    if (data) {
      setNotes(data.map((n: any) => ({
        id: n.id,
        title: n.title,
        body: n.body,
        createdAt: new Date(n.created_at).getTime(),
        updatedAt: new Date(n.updated_at).getTime(),
      })));
    }
  }, [user]);

  useEffect(() => {
    void fetchNotes();
  }, [fetchNotes]);

  const addNote = async (title: string, body: string) => {
    if (!user) return "";
    const tempId = Math.random().toString();
    const now = Date.now();
    setNotes((p) => [{ id: tempId, title: title.trim() || "Untitled note", body, createdAt: now, updatedAt: now }, ...p]);
    
    const { data, error } = await supabase.from("personal_notes").insert({
      user_id: user.id,
      title: title.trim() || "Untitled note",
      body
    }).select().single();
    
    if (!error && data) {
      setNotes((p) => p.map(n => n.id === tempId ? { ...n, id: data.id, createdAt: new Date(data.created_at).getTime(), updatedAt: new Date(data.updated_at).getTime() } : n));
      return data.id;
    }
    return tempId;
  };

  const updateNote = async (id: string, patch: Partial<Pick<PersonalNote, "title" | "body">>) => {
    if (!user) return;
    setNotes((p) => p.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n)));
    await supabase.from("personal_notes").update(patch).eq("id", id);
  };

  const removeNote = async (id: string) => {
    if (!user) return;
    setNotes((p) => p.filter((n) => n.id !== id));
    await supabase.from("personal_notes").delete().eq("id", id);
  };

  return { notes, addNote, updateNote, removeNote };
}

export function usePersonalAlarms() {
  const { user } = useAuth();
  const [alarms, setAlarms] = useState<PersonalAlarm[]>([]);

  const fetchAlarms = useCallback(async () => {
    if (!user) return setAlarms([]);
    const { data } = await supabase
      .from("personal_alarms")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (data) {
      setAlarms(data.map((a: any) => ({
        id: a.id,
        time: a.time,
        label: a.label,
        enabled: a.enabled,
        days: a.days || [],
        lastFired: a.last_fired || undefined,
      })));
    }
  }, [user]);

  useEffect(() => {
    void fetchAlarms();
  }, [fetchAlarms]);

  const addAlarm = async (time: string, label: string, days: number[] = []) => {
    if (!user) return;
    const tempId = Math.random().toString();
    setAlarms((p) => [{ id: tempId, time, label: label.trim(), enabled: true, days }, ...p]);
    
    const { data, error } = await supabase.from("personal_alarms").insert({
      user_id: user.id,
      time,
      label: label.trim(),
      enabled: true,
      days
    }).select().single();
    
    if (!error && data) {
      setAlarms((p) => p.map(a => a.id === tempId ? { ...a, id: data.id } : a));
    }
  };

  const updateAlarm = async (id: string, patch: Partial<PersonalAlarm>) => {
    if (!user) return;
    setAlarms((p) => p.map((a) => (a.id === id ? { ...a, ...patch } : a)));
    
    const dbPatch: any = { ...patch };
    if (patch.lastFired !== undefined) dbPatch.last_fired = patch.lastFired;
    
    await supabase.from("personal_alarms").update(dbPatch).eq("id", id);
  };

  const removeAlarm = async (id: string) => {
    if (!user) return;
    setAlarms((p) => p.filter((a) => a.id !== id));
    await supabase.from("personal_alarms").delete().eq("id", id);
  };
  
  const persist = async (next: PersonalAlarm[]) => {
    // Legacy helper: the new flow updates individually.
    setAlarms(next);
  };

  return { alarms, addAlarm, updateAlarm, removeAlarm, persist };
}

export function usePersonalTimetable() {
  const { user } = useAuth();
  const [slots, setSlots] = useState<TimetableSlot[]>([]);

  const fetchSlots = useCallback(async () => {
    if (!user) return setSlots([]);
    const { data } = await supabase
      .from("timetable_slots")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (data) {
      setSlots(data.map((s: any) => ({
        id: s.id,
        day: s.day,
        start: s.start_time,
        end: s.end_time,
        title: s.title,
        notes: s.notes || undefined,
        notify: s.notify,
        lastNotified: s.last_notified || undefined,
      })));
    }
  }, [user]);

  useEffect(() => {
    void fetchSlots();
  }, [fetchSlots]);

  const addSlot = async (s: Omit<TimetableSlot, "id">) => {
    if (!user) return;
    const tempId = Math.random().toString();
    setSlots((p) => [{ id: tempId, ...s }, ...p]);
    
    const { data, error } = await supabase.from("timetable_slots").insert({
      user_id: user.id,
      day: s.day,
      start_time: s.start,
      end_time: s.end,
      title: s.title,
      notes: s.notes,
      notify: s.notify,
      last_notified: s.lastNotified
    }).select().single();
    
    if (!error && data) {
      setSlots((p) => p.map(slot => slot.id === tempId ? { ...slot, id: data.id } : slot));
    }
  };

  const updateSlot = async (id: string, patch: Partial<TimetableSlot>) => {
    if (!user) return;
    setSlots((p) => p.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    
    const dbPatch: any = {};
    if (patch.day !== undefined) dbPatch.day = patch.day;
    if (patch.start !== undefined) dbPatch.start_time = patch.start;
    if (patch.end !== undefined) dbPatch.end_time = patch.end;
    if (patch.title !== undefined) dbPatch.title = patch.title;
    if (patch.notes !== undefined) dbPatch.notes = patch.notes;
    if (patch.notify !== undefined) dbPatch.notify = patch.notify;
    if (patch.lastNotified !== undefined) dbPatch.last_notified = patch.lastNotified;
    
    await supabase.from("timetable_slots").update(dbPatch).eq("id", id);
  };

  const removeSlot = async (id: string) => {
    if (!user) return;
    setSlots((p) => p.filter((s) => s.id !== id));
    await supabase.from("timetable_slots").delete().eq("id", id);
  };

  const persist = async (next: TimetableSlot[]) => {
    setSlots(next);
  };

  return { slots, addSlot, updateSlot, removeSlot, persist };
}

export const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
