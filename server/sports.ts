/**
 * Sports router — fetches from TheSportsDB (free tier, no key needed)
 * Leagues: EPL 4328 | NBA 4387 | UFC 4380 | La Liga 4329 | Champions League 4346
 */

import { eq, desc, and, or, like } from "drizzle-orm";
import { getDb } from "./db";
import { sportEvents, sportStreams, type InsertSportEvent } from "../drizzle/schema";

const LEAGUES = [
  { id: "4328", name: "English Premier League", sport: "Football" },
  { id: "4387", name: "NBA",                   sport: "Basketball" },
  { id: "4380", name: "UFC",                   sport: "MMA" },
  { id: "4329", name: "La Liga",               sport: "Football" },
  { id: "4346", name: "UEFA Champions League", sport: "Football" },
];

function mapEventFromSportsDB(ev: any, sport: string, league: string, leagueId: string): InsertSportEvent {
  const startTime = ev.strTimestamp
    ? new Date(ev.strTimestamp)
    : ev.dateEvent
      ? new Date(`${ev.dateEvent}T${ev.strTime ?? "00:00:00"}`)
      : new Date();

  const now = new Date();
  let status: "live" | "upcoming" | "finished" = "upcoming";
  const diffMs = startTime.getTime() - now.getTime();
  if (diffMs < -3 * 60 * 60 * 1000) status = "finished";
  else if (diffMs < 0) status = "live";

  // Extract YouTube ID from strVideo if present
  let youtubeVideoId: string | undefined;
  const vid: string = ev.strVideo ?? "";
  const ytMatch = vid.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  if (ytMatch) youtubeVideoId = ytMatch[1];

  return {
    title: ev.strEvent ?? `${ev.strHomeTeam} vs ${ev.strAwayTeam}`,
    sport,
    league,
    leagueId,
    homeTeam: ev.strHomeTeam ?? "",
    awayTeam: ev.strAwayTeam ?? "",
    homeScore: ev.intHomeScore ?? null,
    awayScore: ev.intAwayScore ?? null,
    thumbnailUrl: ev.strThumb ?? ev.strPoster ?? ev.strSquare ?? null,
    startTime,
    status,
    youtubeVideoId: youtubeVideoId ?? null,
    strVideo: ev.strVideo ?? null,
    strThumb: ev.strThumb ?? null,
    externalId: ev.idEvent ?? null,
    venue: ev.strVenue ?? null,
    country: ev.strCountry ?? null,
  };
}

async function fetchAndUpsertLeague(leagueId: string, sport: string, leagueName: string) {
  try {
    const [upcomingRes, pastRes] = await Promise.allSettled([
      fetch(`https://www.thesportsdb.com/api/v1/json/3/eventsnext.php?id=${leagueId}`).then(r => r.json()),
      fetch(`https://www.thesportsdb.com/api/v1/json/3/eventspastleague.php?id=${leagueId}`).then(r => r.json()),
    ]);

    const events: any[] = [];
    if (upcomingRes.status === "fulfilled" && upcomingRes.value?.events) {
      events.push(...upcomingRes.value.events);
    }
    if (pastRes.status === "fulfilled" && pastRes.value?.events) {
      events.push(...pastRes.value.events.slice(0, 20));
    }

    for (const ev of events) {
      if (!ev.idEvent) continue;
      const mapped = mapEventFromSportsDB(ev, sport, leagueName, leagueId);

      // Upsert by externalId
      const existing = await drizzleDb
        .select({ id: sportEvents.id })
        .from(sportEvents)
        .where(eq(sportEvents.externalId, ev.idEvent))
        .limit(1);

      if (existing.length > 0) {
        await drizzleDb
          .update(sportEvents)
          .set({ ...mapped, updatedAt: new Date() })
          .where(eq(sportEvents.id, existing[0].id));
      } else {
        await const drizzleDb = await getDb(); drizzleDb?.insert(sportEvents).values(mapped);
      }
    }
  } catch (err) {
    console.error(`[sports] Failed to fetch league ${leagueId}:`, err);
  }
}

// Background auto-update every 60s
let updateInterval: ReturnType<typeof setInterval> | null = null;
export function startSportsAutoUpdate() {
  if (updateInterval) return;
  const run = async () => {
    for (const l of LEAGUES) {
      await fetchAndUpsertLeague(l.id, l.sport, l.name);
    }
  };
  run(); // initial load
  updateInterval = setInterval(run, 60_000);
  console.log("[sports] Auto-update started (60s interval)");
}

// ── Query helpers ─────────────────────────────────────────────────────────

export async function listEvents(opts?: { sport?: string; status?: string; search?: string; limit?: number }) {
  const { sport, status, search, limit = 50 } = opts ?? {};
  let query = const drizzleDb = await getDb(); drizzleDb?.select().from(sportEvents).orderBy(desc(sportEvents.startTime));
  const results = await query.limit(limit);
  return results.filter(ev => {
    if (sport && ev.sport !== sport) return false;
    if (status && ev.status !== status) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        ev.title.toLowerCase().includes(q) ||
        (ev.homeTeam ?? "").toLowerCase().includes(q) ||
        (ev.awayTeam ?? "").toLowerCase().includes(q)
      );
    }
    return true;
  });
}

export async function getLiveEvents() {
  // First update statuses
  const now = new Date();
  // Mark as finished if more than 3h old and was live
  await drizzleDb
    .update(sportEvents)
    .set({ status: "finished" })
    .where(
      and(
        eq(sportEvents.status, "live"),
      )
    );

  return drizzleDb
    .select()
    .from(sportEvents)
    .where(eq(sportEvents.status, "live"))
    .orderBy(desc(sportEvents.startTime))
    .limit(20);
}

export async function getUpcomingEvents(limit = 30) {
  return drizzleDb
    .select()
    .from(sportEvents)
    .where(eq(sportEvents.status, "upcoming"))
    .orderBy(sportEvents.startTime)
    .limit(limit);
}

export async function getFinishedEvents(limit = 30) {
  return drizzleDb
    .select()
    .from(sportEvents)
    .where(eq(sportEvents.status, "finished"))
    .orderBy(desc(sportEvents.startTime))
    .limit(limit);
}

export async function getEventById(id: number) {
  const [event] = await drizzleDb
    .select()
    .from(sportEvents)
    .where(eq(sportEvents.id, id))
    .limit(1);
  if (!event) return null;
  const streams = await drizzleDb
    .select()
    .from(sportStreams)
    .where(eq(sportStreams.eventId, id));
  return { ...event, streams };
}

export async function upsertEvent(data: InsertSportEvent & { id?: number }) {
  if (data.id) {
    await const drizzleDb = await getDb(); drizzleDb?.update(sportEvents).set(data).where(eq(sportEvents.id, data.id));
    return data.id;
  }
  const [res] = await const drizzleDb = await getDb(); drizzleDb?.insert(sportEvents).values(data);
  return (res as any).insertId as number;
}

export async function deleteEvent(id: number) {
  await const drizzleDb = await getDb(); drizzleDb?.delete(sportStreams).where(eq(sportStreams.eventId, id));
  await const drizzleDb = await getDb(); drizzleDb?.delete(sportEvents).where(eq(sportEvents.id, id));
}

export async function addStream(data: { eventId: number; name: string; url: string; quality?: string }) {
  await const drizzleDb = await getDb(); drizzleDb?.insert(sportStreams).values({
    eventId: data.eventId,
    name: data.name,
    url: data.url,
    quality: data.quality ?? "HD",
  });
}

export async function removeStream(streamId: number) {
  await const drizzleDb = await getDb(); drizzleDb?.delete(sportStreams).where(eq(sportStreams.id, streamId));
}
