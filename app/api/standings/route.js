import { NextResponse } from 'next/server';
import { GROUPS_2026 } from '../../data/schedule2026';
import { getWcStandings, lookupWcRecord } from '../../lib/wcStandings';

// Live group standings from API-Football (primary) and football-data.org (fallback).
// We no longer use ESPN standings to avoid any dependencies on it.
export async function GET() {
  try {
    const standings = await getWcStandings();
    if (!standings) {
      return NextResponse.json(
        { groups: null, error: "Standings data not available from upstream APIs" },
        { status: 502 }
      );
    }

    const groups = {};
    for (const g of GROUPS_2026) {
      let rows = g.teams.map((t) => {
        const wcRec = lookupWcRecord(standings, t.name);
        if (!wcRec) {
          return { name: t.name, rank: null, gp: 0, w: 0, d: 0, l: 0, gd: 0, pts: 0 };
        }
        return {
          name: t.name,
          rank: null,
          gp: wcRec.gp || 0,
          w: wcRec.w || 0,
          d: wcRec.d || 0,
          l: wcRec.l || 0,
          gd: wcRec.gd || 0,
          pts: wcRec.pts || 0,
        };
      });

      // Sort rows: 1) points desc, 2) gd desc, 3) w desc, 4) alphabetical name
      rows = [...rows].sort((a, b) => {
        if (b.pts !== a.pts) return b.pts - a.pts;
        if (b.gd !== a.gd) return b.gd - a.gd;
        if (b.w !== a.w) return b.w - a.w;
        return a.name.localeCompare(b.name);
      });

      // Set rank based on sorted order
      rows = rows.map((r, idx) => ({ ...r, rank: idx + 1 }));

      groups[g.name] = rows;
    }

    return NextResponse.json({ groups, updatedAt: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json(
      { groups: null, error: error.message },
      { status: 502 }
    );
  }
}
