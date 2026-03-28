import { getCocToken } from "./coc-token-manager";

const COC_API_BASE = "https://api.clashofclans.com/v1";

function getToken() {
  return getCocToken();
}

function encodeTag(tag: string): string {
  return encodeURIComponent(tag.startsWith("#") ? tag : `#${tag}`);
}

async function cocFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${COC_API_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`CoC API error ${res.status}: ${body}`);
  }

  return res.json() as Promise<T>;
}

export interface CocHero {
  name: string;
  level: number;
}

export interface CocPlayer {
  tag: string;
  name: string;
  townHallLevel: number;
  townHallWeaponLevel?: number;
  expLevel: number;
  trophies: number;
  bestTrophies: number;
  warStars: number;
  attackWins: number;
  defenseWins: number;
  donations: number;
  donationsReceived: number;
  warPreference?: "in" | "out";
  role?: string;
  clan?: {
    name: string;
    tag: string;
  };
  league?: {
    name: string;
  };
  heroes?: CocHero[];
  builderHallLevel?: number;
  builderBaseTrophies?: number;
}

export interface CocClanMember {
  name: string;
  tag: string;
  role: string;
}

export interface CocClan {
  tag: string;
  name: string;
  description?: string;
  type?: string;
  badgeUrls: {
    small: string;
    medium: string;
    large: string;
  };
  clanLevel: number;
  clanPoints: number;
  members: number;
  memberList?: CocClanMember[];
}

export async function getPlayer(tag: string): Promise<CocPlayer> {
  return cocFetch<CocPlayer>(`/players/${encodeTag(tag)}`);
}

export async function getClan(tag: string): Promise<CocClan> {
  return cocFetch<CocClan>(`/clans/${encodeTag(tag)}`);
}

export function clanInGameLink(tag: string): string {
  const bare = tag.startsWith("#") ? tag.slice(1) : tag;
  return `https://link.clashofclans.com/en?action=OpenClanProfile&tag=%23${bare}`;
}

export function clanStatsLink(tag: string): string {
  const bare = tag.startsWith("#") ? tag.slice(1) : tag;
  return `https://www.clashofstats.com/clans/${bare}/summary`;
}
