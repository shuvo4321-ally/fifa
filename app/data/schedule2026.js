// FIFA World Cup 2026 — transcribed from the official-style fixture graphic.
// NOTE: One team was unreadable in the source image — the side facing France in
// Group I and the 3rd team in Group F both render like "Senegal". Senegal is
// placed in Group I; Group F's 3rd is set to Sweden. Verify/swap if needed.
// Match times are placeholders (BD) — the graphic didn't list per-match times.
export const GROUPS_2026 = [
  {
    name: "Group A",
    teams: [
      { name: "Mexico", flag: "/flags/mx.svg" },
      { name: "South Africa", flag: "/flags/za.svg" },
      { name: "South Korea", flag: "/flags/kr.svg" },
      { name: "Uruguay", flag: "/flags/uy.svg" },
    ],
  },
  {
    name: "Group B",
    teams: [
      { name: "Canada", flag: "/flags/ca.svg" },
      { name: "Ireland", flag: "/flags/ie.svg" },
      { name: "Qatar", flag: "/flags/qa.svg" },
      { name: "Switzerland", flag: "/flags/ch.svg" },
    ],
  },
  {
    name: "Group C",
    teams: [
      { name: "Brazil", flag: "/flags/br.svg" },
      { name: "Morocco", flag: "/flags/ma.svg" },
      { name: "Haiti", flag: "/flags/ht.svg" },
      { name: "Scotland", flag: "/flags/gb-sct.svg" },
    ],
  },
  {
    name: "Group D",
    teams: [
      { name: "United States", flag: "/flags/us.svg" },
      { name: "Paraguay", flag: "/flags/py.svg" },
      { name: "Australia", flag: "/flags/au.svg" },
      { name: "Tunisia", flag: "/flags/tn.svg" },
    ],
  },
  {
    name: "Group E",
    teams: [
      { name: "Germany", flag: "/flags/de.svg" },
      { name: "Ecuador", flag: "/flags/ec.svg" },
      { name: "Ivory Coast", flag: "/flags/ci.svg" },
      { name: "Curaçao", flag: "/flags/cw.svg" },
    ],
  },
  {
    name: "Group F",
    teams: [
      { name: "Netherlands", flag: "/flags/nl.svg" },
      { name: "Japan", flag: "/flags/jp.svg" },
      { name: "Sweden", flag: "/flags/se.svg" },
      { name: "Iran", flag: "/flags/ir.svg" },
    ],
  },
  {
    name: "Group G",
    teams: [
      { name: "Belgium", flag: "/flags/be.svg" },
      { name: "Egypt", flag: "/flags/eg.svg" },
      { name: "Panama", flag: "/flags/pa.svg" },
      { name: "New Zealand", flag: "/flags/nz.svg" },
    ],
  },
  {
    name: "Group H",
    teams: [
      { name: "Spain", flag: "/flags/es.svg" },
      { name: "Saudi Arabia", flag: "/flags/sa.svg" },
      { name: "Cape Verde", flag: "/flags/cv.svg" },
      { name: "Uzbekistan", flag: "/flags/uz.svg" },
    ],
  },
  {
    name: "Group I",
    teams: [
      { name: "France", flag: "/flags/fr.svg" },
      { name: "Senegal", flag: "/flags/sn.svg" },
      { name: "Norway", flag: "/flags/no.svg" },
      { name: "Bolivia", flag: "/flags/bo.svg" },
    ],
  },
  {
    name: "Group J",
    teams: [
      { name: "Argentina", flag: "/flags/ar.svg" },
      { name: "Algeria", flag: "/flags/dz.svg" },
      { name: "Austria", flag: "/flags/at.svg" },
      { name: "Jordan", flag: "/flags/jo.svg" },
    ],
  },
  {
    name: "Group K",
    teams: [
      { name: "Portugal", flag: "/flags/pt.svg" },
      { name: "Ghana", flag: "/flags/gh.svg" },
      { name: "Türkiye", flag: "/flags/tr.svg" },
      { name: "Honduras", flag: "/flags/hn.svg" },
    ],
  },
  {
    name: "Group L",
    teams: [
      { name: "England", flag: "/flags/gb-eng.svg" },
      { name: "Croatia", flag: "/flags/hr.svg" },
      { name: "Mali", flag: "/flags/ml.svg" },
      { name: "Jamaica", flag: "/flags/jm.svg" },
    ],
  },
];

export const FIXTURES_2026 = [
  // ── Group A ──
  { date: "Jun 12, 2026", match: "Mexico vs South Africa", group: "Group A", time: "07:00 AM", stage: "Group Stage" },
  { date: "Jun 12, 2026", match: "South Korea vs Uruguay", group: "Group A", time: "10:00 AM", stage: "Group Stage" },
  { date: "Jun 17, 2026", match: "Mexico vs South Korea", group: "Group A", time: "07:00 AM", stage: "Group Stage" },
  { date: "Jun 17, 2026", match: "Uruguay vs South Africa", group: "Group A", time: "10:00 AM", stage: "Group Stage" },
  { date: "Jun 22, 2026", match: "Mexico vs Uruguay", group: "Group A", time: "01:00 AM", stage: "Group Stage" },
  { date: "Jun 22, 2026", match: "South Africa vs South Korea", group: "Group A", time: "01:00 AM", stage: "Group Stage" },

  // ── Group B ──
  { date: "Jun 11, 2026", match: "Canada vs Ireland", group: "Group B", time: "06:00 AM", stage: "Group Stage" },
  { date: "Jun 11, 2026", match: "Qatar vs Switzerland", group: "Group B", time: "09:00 AM", stage: "Group Stage" },
  { date: "Jun 16, 2026", match: "Canada vs Qatar", group: "Group B", time: "04:00 AM", stage: "Group Stage" },
  { date: "Jun 16, 2026", match: "Switzerland vs Ireland", group: "Group B", time: "07:00 AM", stage: "Group Stage" },
  { date: "Jun 21, 2026", match: "Canada vs Switzerland", group: "Group B", time: "01:00 AM", stage: "Group Stage" },
  { date: "Jun 21, 2026", match: "Ireland vs Qatar", group: "Group B", time: "01:00 AM", stage: "Group Stage" },

  // ── Group C ──
  { date: "Jun 13, 2026", match: "Brazil vs Morocco", group: "Group C", time: "04:00 AM", stage: "Group Stage" },
  { date: "Jun 13, 2026", match: "Haiti vs Scotland", group: "Group C", time: "07:00 AM", stage: "Group Stage" },
  { date: "Jun 18, 2026", match: "Brazil vs Haiti", group: "Group C", time: "04:00 AM", stage: "Group Stage" },
  { date: "Jun 18, 2026", match: "Scotland vs Morocco", group: "Group C", time: "07:00 AM", stage: "Group Stage" },
  { date: "Jun 23, 2026", match: "Brazil vs Scotland", group: "Group C", time: "01:00 AM", stage: "Group Stage" },
  { date: "Jun 23, 2026", match: "Morocco vs Haiti", group: "Group C", time: "01:00 AM", stage: "Group Stage" },

  // ── Group D ──
  { date: "Jun 12, 2026", match: "United States vs Paraguay", group: "Group D", time: "01:00 AM", stage: "Group Stage" },
  { date: "Jun 12, 2026", match: "Australia vs Tunisia", group: "Group D", time: "04:00 AM", stage: "Group Stage" },
  { date: "Jun 17, 2026", match: "United States vs Australia", group: "Group D", time: "01:00 AM", stage: "Group Stage" },
  { date: "Jun 17, 2026", match: "Tunisia vs Paraguay", group: "Group D", time: "04:00 AM", stage: "Group Stage" },
  { date: "Jun 22, 2026", match: "United States vs Tunisia", group: "Group D", time: "07:00 AM", stage: "Group Stage" },
  { date: "Jun 22, 2026", match: "Paraguay vs Australia", group: "Group D", time: "10:00 AM", stage: "Group Stage" },

  // ── Group E ──
  { date: "Jun 13, 2026", match: "Germany vs Ecuador", group: "Group E", time: "10:00 AM", stage: "Group Stage" },
  { date: "Jun 13, 2026", match: "Ivory Coast vs Curaçao", group: "Group E", time: "11:00 PM", stage: "Group Stage" },
  { date: "Jun 18, 2026", match: "Germany vs Ivory Coast", group: "Group E", time: "10:00 AM", stage: "Group Stage" },
  { date: "Jun 18, 2026", match: "Curaçao vs Ecuador", group: "Group E", time: "11:00 PM", stage: "Group Stage" },
  { date: "Jun 23, 2026", match: "Germany vs Curaçao", group: "Group E", time: "04:00 AM", stage: "Group Stage" },
  { date: "Jun 23, 2026", match: "Ecuador vs Ivory Coast", group: "Group E", time: "07:00 AM", stage: "Group Stage" },

  // ── Group F ──
  { date: "Jun 14, 2026", match: "Netherlands vs Japan", group: "Group F", time: "01:00 AM", stage: "Group Stage" },
  { date: "Jun 14, 2026", match: "Sweden vs Iran", group: "Group F", time: "04:00 AM", stage: "Group Stage" },
  { date: "Jun 19, 2026", match: "Netherlands vs Sweden", group: "Group F", time: "01:00 AM", stage: "Group Stage" },
  { date: "Jun 19, 2026", match: "Iran vs Japan", group: "Group F", time: "04:00 AM", stage: "Group Stage" },
  { date: "Jun 24, 2026", match: "Netherlands vs Iran", group: "Group F", time: "07:00 AM", stage: "Group Stage" },
  { date: "Jun 24, 2026", match: "Japan vs Sweden", group: "Group F", time: "10:00 AM", stage: "Group Stage" },

  // ── Group G ──
  { date: "Jun 14, 2026", match: "Belgium vs Egypt", group: "Group G", time: "07:00 AM", stage: "Group Stage" },
  { date: "Jun 14, 2026", match: "Panama vs New Zealand", group: "Group G", time: "10:00 AM", stage: "Group Stage" },
  { date: "Jun 19, 2026", match: "Belgium vs Panama", group: "Group G", time: "07:00 AM", stage: "Group Stage" },
  { date: "Jun 19, 2026", match: "New Zealand vs Egypt", group: "Group G", time: "10:00 AM", stage: "Group Stage" },
  { date: "Jun 24, 2026", match: "Belgium vs New Zealand", group: "Group G", time: "01:00 AM", stage: "Group Stage" },
  { date: "Jun 24, 2026", match: "Egypt vs Panama", group: "Group G", time: "01:00 AM", stage: "Group Stage" },

  // ── Group H ──
  { date: "Jun 15, 2026", match: "Spain vs Saudi Arabia", group: "Group H", time: "10:00 PM", stage: "Group Stage" },
  { date: "Jun 15, 2026", match: "Cape Verde vs Uzbekistan", group: "Group H", time: "07:00 AM", stage: "Group Stage" },
  { date: "Jun 20, 2026", match: "Spain vs Cape Verde", group: "Group H", time: "10:00 PM", stage: "Group Stage" },
  { date: "Jun 20, 2026", match: "Uzbekistan vs Saudi Arabia", group: "Group H", time: "07:00 AM", stage: "Group Stage" },
  { date: "Jun 25, 2026", match: "Spain vs Uzbekistan", group: "Group H", time: "01:00 AM", stage: "Group Stage" },
  { date: "Jun 25, 2026", match: "Saudi Arabia vs Cape Verde", group: "Group H", time: "01:00 AM", stage: "Group Stage" },

  // ── Group I ──
  { date: "Jun 15, 2026", match: "France vs Senegal", group: "Group I", time: "01:00 AM", stage: "Group Stage" },
  { date: "Jun 15, 2026", match: "Norway vs Bolivia", group: "Group I", time: "04:00 AM", stage: "Group Stage" },
  { date: "Jun 20, 2026", match: "France vs Norway", group: "Group I", time: "01:00 AM", stage: "Group Stage" },
  { date: "Jun 20, 2026", match: "Bolivia vs Senegal", group: "Group I", time: "04:00 AM", stage: "Group Stage" },
  { date: "Jun 25, 2026", match: "France vs Bolivia", group: "Group I", time: "07:00 AM", stage: "Group Stage" },
  { date: "Jun 25, 2026", match: "Senegal vs Norway", group: "Group I", time: "10:00 AM", stage: "Group Stage" },

  // ── Group J ──
  { date: "Jun 16, 2026", match: "Argentina vs Algeria", group: "Group J", time: "10:00 PM", stage: "Group Stage" },
  { date: "Jun 16, 2026", match: "Austria vs Jordan", group: "Group J", time: "10:00 AM", stage: "Group Stage" },
  { date: "Jun 21, 2026", match: "Argentina vs Austria", group: "Group J", time: "07:00 AM", stage: "Group Stage" },
  { date: "Jun 21, 2026", match: "Jordan vs Algeria", group: "Group J", time: "10:00 AM", stage: "Group Stage" },
  { date: "Jun 26, 2026", match: "Argentina vs Jordan", group: "Group J", time: "01:00 AM", stage: "Group Stage" },
  { date: "Jun 26, 2026", match: "Algeria vs Austria", group: "Group J", time: "01:00 AM", stage: "Group Stage" },

  // ── Group K ──
  { date: "Jun 16, 2026", match: "Portugal vs Ghana", group: "Group K", time: "01:00 AM", stage: "Group Stage" },
  { date: "Jun 16, 2026", match: "Türkiye vs Honduras", group: "Group K", time: "04:00 AM", stage: "Group Stage" },
  { date: "Jun 21, 2026", match: "Portugal vs Türkiye", group: "Group K", time: "01:00 AM", stage: "Group Stage" },
  { date: "Jun 21, 2026", match: "Honduras vs Ghana", group: "Group K", time: "04:00 AM", stage: "Group Stage" },
  { date: "Jun 26, 2026", match: "Portugal vs Honduras", group: "Group K", time: "07:00 AM", stage: "Group Stage" },
  { date: "Jun 26, 2026", match: "Ghana vs Türkiye", group: "Group K", time: "10:00 AM", stage: "Group Stage" },

  // ── Group L ──
  { date: "Jun 17, 2026", match: "England vs Croatia", group: "Group L", time: "10:00 PM", stage: "Group Stage" },
  { date: "Jun 17, 2026", match: "Mali vs Jamaica", group: "Group L", time: "07:00 AM", stage: "Group Stage" },
  { date: "Jun 22, 2026", match: "England vs Mali", group: "Group L", time: "10:00 PM", stage: "Group Stage" },
  { date: "Jun 22, 2026", match: "Jamaica vs Croatia", group: "Group L", time: "07:00 AM", stage: "Group Stage" },
  { date: "Jun 27, 2026", match: "England vs Jamaica", group: "Group L", time: "01:00 AM", stage: "Group Stage" },
  { date: "Jun 27, 2026", match: "Croatia vs Mali", group: "Group L", time: "01:00 AM", stage: "Group Stage" },

  // ── Round of 32 (group placeholders) ──
  { date: "Jun 28, 2026", match: "A1 vs C2", group: "Knockout", time: "01:00 AM", stage: "Round of 32" },
  { date: "Jun 28, 2026", match: "B1 vs D2", group: "Knockout", time: "04:00 AM", stage: "Round of 32" },
  { date: "Jun 29, 2026", match: "E1 vs G2", group: "Knockout", time: "01:00 AM", stage: "Round of 32" },
  { date: "Jun 29, 2026", match: "F1 vs H2", group: "Knockout", time: "04:00 AM", stage: "Round of 32" },
  { date: "Jun 30, 2026", match: "I1 vs K2", group: "Knockout", time: "01:00 AM", stage: "Round of 32" },
  { date: "Jun 30, 2026", match: "J1 vs L2", group: "Knockout", time: "04:00 AM", stage: "Round of 32" },
  { date: "Jul 1, 2026", match: "C1 vs A2", group: "Knockout", time: "01:00 AM", stage: "Round of 32" },
  { date: "Jul 1, 2026", match: "D1 vs B2", group: "Knockout", time: "04:00 AM", stage: "Round of 32" },
  { date: "Jul 2, 2026", match: "G1 vs E2", group: "Knockout", time: "01:00 AM", stage: "Round of 32" },
  { date: "Jul 2, 2026", match: "H1 vs F2", group: "Knockout", time: "04:00 AM", stage: "Round of 32" },
  { date: "Jul 3, 2026", match: "K1 vs I2", group: "Knockout", time: "01:00 AM", stage: "Round of 32" },
  { date: "Jul 3, 2026", match: "L1 vs J2", group: "Knockout", time: "04:00 AM", stage: "Round of 32" },

  // ── Round of 16 ──
  { date: "Jul 6, 2026", match: "Winner R32-1 vs Winner R32-2", group: "Knockout", time: "01:00 AM", stage: "Round of 16" },
  { date: "Jul 6, 2026", match: "Winner R32-3 vs Winner R32-4", group: "Knockout", time: "04:00 AM", stage: "Round of 16" },
  { date: "Jul 7, 2026", match: "Winner R32-5 vs Winner R32-6", group: "Knockout", time: "01:00 AM", stage: "Round of 16" },
  { date: "Jul 7, 2026", match: "Winner R32-7 vs Winner R32-8", group: "Knockout", time: "04:00 AM", stage: "Round of 16" },
  { date: "Jul 8, 2026", match: "Winner R32-9 vs Winner R32-10", group: "Knockout", time: "01:00 AM", stage: "Round of 16" },
  { date: "Jul 8, 2026", match: "Winner R32-11 vs Winner R32-12", group: "Knockout", time: "04:00 AM", stage: "Round of 16" },
  { date: "Jul 9, 2026", match: "Winner R32-13 vs Winner R32-14", group: "Knockout", time: "01:00 AM", stage: "Round of 16" },
  { date: "Jul 9, 2026", match: "Winner R32-15 vs Winner R32-16", group: "Knockout", time: "04:00 AM", stage: "Round of 16" },

  // ── Quarter-finals ──
  { date: "Jul 10, 2026", match: "Winner R16-1 vs Winner R16-2", group: "Knockout", time: "01:00 AM", stage: "Quarter-Final" },
  { date: "Jul 11, 2026", match: "Winner R16-3 vs Winner R16-4", group: "Knockout", time: "01:00 AM", stage: "Quarter-Final" },
  { date: "Jul 11, 2026", match: "Winner R16-5 vs Winner R16-6", group: "Knockout", time: "04:00 AM", stage: "Quarter-Final" },
  { date: "Jul 12, 2026", match: "Winner R16-7 vs Winner R16-8", group: "Knockout", time: "01:00 AM", stage: "Quarter-Final" },

  // ── Semi-finals ──
  { date: "Jul 14, 2026", match: "Winner QF-1 vs Winner QF-2", group: "Knockout", time: "01:00 AM", stage: "Semi-Final" },
  { date: "Jul 15, 2026", match: "Winner QF-3 vs Winner QF-4", group: "Knockout", time: "01:00 AM", stage: "Semi-Final" },

  // ── Third place & Final ──
  { date: "Jul 18, 2026", match: "Loser SF-1 vs Loser SF-2", group: "Third-place", time: "01:00 AM", stage: "Final" },
  { date: "Jul 19, 2026", match: "Winner SF-1 vs Winner SF-2", group: "Final", time: "01:00 AM", stage: "Final" },
];
