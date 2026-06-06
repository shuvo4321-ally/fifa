import Link from "next/link";
import JitsiRoomClientWrapper from "../components/JitsiRoomClientWrapper";

export const metadata = {
  title: "Live TV — CRON",
  description: "Live fan-broadcast.",
};

export default function BroadcastGuide() {
  return (
    <main
      className="live-page"
      style={{
        padding: "var(--page-gutter)",
        minHeight: "80vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <div className="live-stage" style={{ width: "100%", maxWidth: "1200px", margin: "0 auto" }}>
        <JitsiRoomClientWrapper role="viewer" room="CRON-GLOBAL-LIVE" />
      </div>

      <p style={{ textAlign: "center", marginTop: "var(--space-6)" }}>
        <Link href="/studio" className="live-broadcast-link">
          Are you the broadcaster? Open Studio →
        </Link>
      </p>
    </main>
  );
}
