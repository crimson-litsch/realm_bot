const COC_API_BASE = "https://api.clashofclans.com/v1";

function getToken() {
  const token = process.env["COC_API_TOKEN"];
  if (!token) throw new Error("COC_API_TOKEN is not set");
  return token;
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

export async function getPlayer(tag: string): Promise<CocPlayer> {
  return cocFetch<CocPlayer>(`/players/${encodeTag(tag)}`);
}
