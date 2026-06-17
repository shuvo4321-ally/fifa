import "./globals.css";
import Header from "./components/Header";
import { GROUPS_2026 } from "./data/schedule2026";
import { Hanken_Grotesk } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";

const hankenGrotesk = Hanken_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-hanken",
});

export const metadata = {
  title: "Match Archive",
  description: "One data model, three safe source types.",
};

export default function RootLayout({ children }) {
  const flags = GROUPS_2026.flatMap(g => g.teams.map(t => t.flag)).filter(Boolean);

  return (
    <html lang="en" className={hankenGrotesk.variable}>
      <head>
        {flags.map((flag, idx) => (
          <link key={idx} rel="preload" href={flag} as="image" fetchPriority="low" />
        ))}
      </head>
      <body>
        {/* Shaka Player is loaded on demand by HlsPlayer only when a DASH
            channel actually plays — not site-wide — so it's off every other
            page and doesn't trip React 19's "script tag while rendering". */}
        <Header />
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
