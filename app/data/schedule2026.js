// FIFA World Cup 2026 — Parsed from official schedule

export const GROUPS_2026 = [
  {
    name: "Group A",
    teams: [
      { name: "Czechia", flag: "/flags/cz.png" },
      { name: "Korea Republic", flag: "/flags/kr.png" },
      { name: "Mexico", flag: "/flags/mx.png" },
      { name: "South Africa", flag: "/flags/za.png" },
    ],
  },
  {
    name: "Group B",
    teams: [
      { name: "Bosnia & Herzegovina", flag: "/flags/ba.png" },
      { name: "Canada", flag: "/flags/ca.png" },
      { name: "Qatar", flag: "/flags/qa.png" },
      { name: "Switzerland", flag: "/flags/ch.png" },
    ],
  },
  {
    name: "Group C",
    teams: [
      { name: "Brazil", flag: "/flags/br.png" },
      { name: "Haiti", flag: "/flags/ht.png" },
      { name: "Morocco", flag: "/flags/ma.png" },
      { name: "Scotland", flag: "/flags/gb-sct.png" },
    ],
  },
  {
    name: "Group D",
    teams: [
      { name: "Australia", flag: "/flags/au.png" },
      { name: "Paraguay", flag: "/flags/py.png" },
      { name: "Türkiye", flag: "/flags/tr.png" },
      { name: "USA", flag: "/flags/us.png" },
    ],
  },
  {
    name: "Group E",
    teams: [
      { name: "Curaçao", flag: "/flags/cw.png" },
      { name: "Ecuador", flag: "/flags/ec.png" },
      { name: "Germany", flag: "/flags/de.png" },
      { name: "Ivory Coast", flag: "/flags/ci.png" },
    ],
  },
  {
    name: "Group F",
    teams: [
      { name: "Japan", flag: "/flags/jp.png" },
      { name: "Netherlands", flag: "/flags/nl.png" },
      { name: "Sweden", flag: "/flags/se.png" },
      { name: "Tunisia", flag: "/flags/tn.png" },
    ],
  },
  {
    name: "Group G",
    teams: [
      { name: "Belgium", flag: "/flags/be.png" },
      { name: "Egypt", flag: "/flags/eg.png" },
      { name: "Iran", flag: "/flags/ir.png" },
      { name: "New Zealand", flag: "/flags/nz.png" },
    ],
  },
  {
    name: "Group H",
    teams: [
      { name: "Cabo Verde", flag: "/flags/cv.png" },
      { name: "Saudi Arabia", flag: "/flags/sa.png" },
      { name: "Spain", flag: "/flags/es.png" },
      { name: "Uruguay", flag: "/flags/uy.png" },
    ],
  },
  {
    name: "Group I",
    teams: [
      { name: "France", flag: "/flags/fr.png" },
      { name: "Iraq", flag: "/flags/iq.png" },
      { name: "Norway", flag: "/flags/no.png" },
      { name: "Senegal", flag: "/flags/sn.png" },
    ],
  },
  {
    name: "Group J",
    teams: [
      { name: "Algeria", flag: "/flags/dz.png" },
      { name: "Argentina", flag: "/flags/ar.png" },
      { name: "Austria", flag: "/flags/at.png" },
      { name: "Jordan", flag: "/flags/jo.png" },
    ],
  },
  {
    name: "Group K",
    teams: [
      { name: "Colombia", flag: "/flags/co.png" },
      { name: "Congo", flag: "/flags/cg.png" },
      { name: "Portugal", flag: "/flags/pt.png" },
      { name: "Uzbekistan", flag: "/flags/uz.png" },
    ],
  },
  {
    name: "Group L",
    teams: [
      { name: "Croatia", flag: "/flags/hr.png" },
      { name: "England", flag: "/flags/gb-eng.png" },
      { name: "Ghana", flag: "/flags/gh.png" },
      { name: "Panama", flag: "/flags/pa.png" },
    ],
  },
];

export const FIXTURES_2026 = [
  // ── Group A ──
  { date: "Jun 12, 2026", match: "Mexico vs South Africa", group: "Group A", time: "01:00 AM", stage: "Group Stage" },
  { date: "Jun 12, 2026", match: "Korea Republic vs Czechia", group: "Group A", time: "08:00 AM", stage: "Group Stage" },
  { date: "Jun 18, 2026", match: "Czechia vs South Africa", group: "Group A", time: "10:00 PM", stage: "Group Stage" },
  { date: "Jun 19, 2026", match: "Mexico vs Korea Republic", group: "Group A", time: "07:00 AM", stage: "Group Stage" },
  { date: "Jun 25, 2026", match: "Czechia vs Mexico", group: "Group A", time: "07:00 AM", stage: "Group Stage" },
  { date: "Jun 25, 2026", match: "South Africa vs Korea Republic", group: "Group A", time: "07:00 AM", stage: "Group Stage" },

  // ── Group B ──
  { date: "Jun 13, 2026", match: "Canada vs Bosnia & Herzegovina", group: "Group B", time: "01:00 AM", stage: "Group Stage" },
  { date: "Jun 14, 2026", match: "Qatar vs Switzerland", group: "Group B", time: "01:00 AM", stage: "Group Stage" },
  { date: "Jun 19, 2026", match: "Switzerland vs Bosnia & Herzegovina", group: "Group B", time: "01:00 AM", stage: "Group Stage" },
  { date: "Jun 19, 2026", match: "Canada vs Qatar", group: "Group B", time: "04:00 AM", stage: "Group Stage" },
  { date: "Jun 25, 2026", match: "Switzerland vs Canada", group: "Group B", time: "01:00 AM", stage: "Group Stage" },
  { date: "Jun 25, 2026", match: "Bosnia & Herzegovina vs Qatar", group: "Group B", time: "01:00 AM", stage: "Group Stage" },

  // ── Group C ──
  { date: "Jun 14, 2026", match: "Brazil vs Morocco", group: "Group C", time: "04:00 AM", stage: "Group Stage" },
  { date: "Jun 14, 2026", match: "Haiti vs Scotland", group: "Group C", time: "07:00 AM", stage: "Group Stage" },
  { date: "Jun 20, 2026", match: "Scotland vs Morocco", group: "Group C", time: "04:00 AM", stage: "Group Stage" },
  { date: "Jun 20, 2026", match: "Brazil vs Haiti", group: "Group C", time: "06:30 AM", stage: "Group Stage" },
  { date: "Jun 25, 2026", match: "Scotland vs Brazil", group: "Group C", time: "04:00 AM", stage: "Group Stage" },
  { date: "Jun 25, 2026", match: "Morocco vs Haiti", group: "Group C", time: "04:00 AM", stage: "Group Stage" },

  // ── Group D ──
  { date: "Jun 13, 2026", match: "USA vs Paraguay", group: "Group D", time: "07:00 AM", stage: "Group Stage" },
  { date: "Jun 14, 2026", match: "Australia vs Türkiye", group: "Group D", time: "10:00 AM", stage: "Group Stage" },
  { date: "Jun 20, 2026", match: "USA vs Australia", group: "Group D", time: "01:00 AM", stage: "Group Stage" },
  { date: "Jun 20, 2026", match: "Türkiye vs Paraguay", group: "Group D", time: "09:00 AM", stage: "Group Stage" },
  { date: "Jun 26, 2026", match: "Türkiye vs USA", group: "Group D", time: "08:00 AM", stage: "Group Stage" },
  { date: "Jun 26, 2026", match: "Paraguay vs Australia", group: "Group D", time: "08:00 AM", stage: "Group Stage" },

  // ── Group E ──
  { date: "Jun 14, 2026", match: "Germany vs Curaçao", group: "Group E", time: "11:00 PM", stage: "Group Stage" },
  { date: "Jun 15, 2026", match: "Ivory Coast vs Ecuador", group: "Group E", time: "05:00 AM", stage: "Group Stage" },
  { date: "Jun 21, 2026", match: "Germany vs Ivory Coast", group: "Group E", time: "02:00 AM", stage: "Group Stage" },
  { date: "Jun 21, 2026", match: "Ecuador vs Curaçao", group: "Group E", time: "06:00 AM", stage: "Group Stage" },
  { date: "Jun 26, 2026", match: "Curaçao vs Ivory Coast", group: "Group E", time: "02:00 AM", stage: "Group Stage" },
  { date: "Jun 26, 2026", match: "Ecuador vs Germany", group: "Group E", time: "02:00 AM", stage: "Group Stage" },

  // ── Group F ──
  { date: "Jun 15, 2026", match: "Netherlands vs Japan", group: "Group F", time: "02:00 AM", stage: "Group Stage" },
  { date: "Jun 15, 2026", match: "Sweden vs Tunisia", group: "Group F", time: "08:00 AM", stage: "Group Stage" },
  { date: "Jun 20, 2026", match: "Netherlands vs Sweden", group: "Group F", time: "11:00 PM", stage: "Group Stage" },
  { date: "Jun 21, 2026", match: "Tunisia vs Japan", group: "Group F", time: "10:00 AM", stage: "Group Stage" },
  { date: "Jun 26, 2026", match: "Japan vs Sweden", group: "Group F", time: "05:00 AM", stage: "Group Stage" },
  { date: "Jun 26, 2026", match: "Tunisia vs Netherlands", group: "Group F", time: "05:00 AM", stage: "Group Stage" },

  // ── Group G ──
  { date: "Jun 16, 2026", match: "Belgium vs Egypt", group: "Group G", time: "01:00 AM", stage: "Group Stage" },
  { date: "Jun 16, 2026", match: "Iran vs New Zealand", group: "Group G", time: "07:00 AM", stage: "Group Stage" },
  { date: "Jun 22, 2026", match: "Belgium vs Iran", group: "Group G", time: "01:00 AM", stage: "Group Stage" },
  { date: "Jun 22, 2026", match: "New Zealand vs Egypt", group: "Group G", time: "07:00 AM", stage: "Group Stage" },
  { date: "Jun 27, 2026", match: "Egypt vs Iran", group: "Group G", time: "09:00 AM", stage: "Group Stage" },
  { date: "Jun 27, 2026", match: "New Zealand vs Belgium", group: "Group G", time: "09:00 AM", stage: "Group Stage" },

  // ── Group H ──
  { date: "Jun 15, 2026", match: "Spain vs Cabo Verde", group: "Group H", time: "10:00 PM", stage: "Group Stage" },
  { date: "Jun 16, 2026", match: "Saudi Arabia vs Uruguay", group: "Group H", time: "04:00 AM", stage: "Group Stage" },
  { date: "Jun 21, 2026", match: "Spain vs Saudi Arabia", group: "Group H", time: "10:00 PM", stage: "Group Stage" },
  { date: "Jun 22, 2026", match: "Uruguay vs Cabo Verde", group: "Group H", time: "04:00 AM", stage: "Group Stage" },
  { date: "Jun 27, 2026", match: "Cabo Verde vs Saudi Arabia", group: "Group H", time: "06:00 AM", stage: "Group Stage" },
  { date: "Jun 27, 2026", match: "Uruguay vs Spain", group: "Group H", time: "06:00 AM", stage: "Group Stage" },

  // ── Group I ──
  { date: "Jun 17, 2026", match: "France vs Senegal", group: "Group I", time: "01:00 AM", stage: "Group Stage" },
  { date: "Jun 17, 2026", match: "Iraq vs Norway", group: "Group I", time: "04:00 AM", stage: "Group Stage" },
  { date: "Jun 23, 2026", match: "France vs Iraq", group: "Group I", time: "03:00 AM", stage: "Group Stage" },
  { date: "Jun 23, 2026", match: "Norway vs Senegal", group: "Group I", time: "06:00 AM", stage: "Group Stage" },
  { date: "Jun 27, 2026", match: "Norway vs France", group: "Group I", time: "01:00 AM", stage: "Group Stage" },
  { date: "Jun 27, 2026", match: "Senegal vs Iraq", group: "Group I", time: "01:00 AM", stage: "Group Stage" },

  // ── Group J ──
  { date: "Jun 17, 2026", match: "Argentina vs Algeria", group: "Group J", time: "07:00 AM", stage: "Group Stage" },
  { date: "Jun 17, 2026", match: "Austria vs Jordan", group: "Group J", time: "10:00 AM", stage: "Group Stage" },
  { date: "Jun 22, 2026", match: "Argentina vs Austria", group: "Group J", time: "11:00 PM", stage: "Group Stage" },
  { date: "Jun 23, 2026", match: "Jordan vs Algeria", group: "Group J", time: "09:00 AM", stage: "Group Stage" },
  { date: "Jun 28, 2026", match: "Algeria vs Austria", group: "Group J", time: "08:00 AM", stage: "Group Stage" },
  { date: "Jun 28, 2026", match: "Jordan vs Argentina", group: "Group J", time: "08:00 AM", stage: "Group Stage" },

  // ── Group K ──
  { date: "Jun 17, 2026", match: "Portugal vs Congo", group: "Group K", time: "11:00 PM", stage: "Group Stage" },
  { date: "Jun 18, 2026", match: "Uzbekistan vs Colombia", group: "Group K", time: "08:00 AM", stage: "Group Stage" },
  { date: "Jun 23, 2026", match: "Portugal vs Uzbekistan", group: "Group K", time: "11:00 PM", stage: "Group Stage" },
  { date: "Jun 24, 2026", match: "Colombia vs Congo", group: "Group K", time: "08:00 AM", stage: "Group Stage" },
  { date: "Jun 28, 2026", match: "Colombia vs Portugal", group: "Group K", time: "05:30 AM", stage: "Group Stage" },
  { date: "Jun 28, 2026", match: "Congo vs Uzbekistan", group: "Group K", time: "05:30 AM", stage: "Group Stage" },

  // ── Group L ──
  { date: "Jun 18, 2026", match: "England vs Croatia", group: "Group L", time: "02:00 AM", stage: "Group Stage" },
  { date: "Jun 18, 2026", match: "Ghana vs Panama", group: "Group L", time: "05:00 AM", stage: "Group Stage" },
  { date: "Jun 24, 2026", match: "England vs Ghana", group: "Group L", time: "02:00 AM", stage: "Group Stage" },
  { date: "Jun 24, 2026", match: "Panama vs Croatia", group: "Group L", time: "05:00 AM", stage: "Group Stage" },
  { date: "Jun 28, 2026", match: "Panama vs England", group: "Group L", time: "03:00 AM", stage: "Group Stage" },
  { date: "Jun 28, 2026", match: "Croatia vs Ghana", group: "Group L", time: "03:00 AM", stage: "Group Stage" },

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
