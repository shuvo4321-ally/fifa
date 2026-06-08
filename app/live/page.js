"use client";

import { useState } from "react";
import { FIXTURES_2026 } from "../data/schedule2026";

export default function PredictionHub() {
  const [activeMatch, setActiveMatch] = useState(null);
  const [prediction, setPrediction] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);

  // Group fixtures to only show upcoming ones
  const upcomingFixtures = FIXTURES_2026.slice(0, 12); // Just show first 12 for the UI

  async function handlePredict(matchStr) {
    setActiveMatch(matchStr);
    setPrediction("");
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "predict", match: matchStr }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch prediction");

      setPrediction(data.text);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleChat(e) {
    e.preventDefault();
    if (!chatMessage.trim() || chatLoading) return;

    const msg = chatMessage.trim();
    setChatMessage("");
    setChatHistory((prev) => [...prev, { role: "user", text: msg }]);
    setChatLoading(true);

    try {
      const res = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "chat", message: msg }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Chat failed");

      setChatHistory((prev) => [...prev, { role: "ai", text: data.text }]);
    } catch (err) {
      setChatHistory((prev) => [...prev, { role: "ai", text: "Error: " + err.message }]);
    } finally {
      setChatLoading(false);
    }
  }

  return (
    <div className="live-page" style={{ paddingTop: "120px" }}>
      <div className="live-head">
        <div>
          <span className="live-kicker">
            <span className="live-dot is-on" />
            AI Match Predictor
          </span>
          <h1 className="live-title">World Cup 2026 Analytics</h1>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", marginTop: "2rem" }}>
        
        {/* Left Col: Fixtures */}
        <div>
          <h2 style={{ color: "white", marginBottom: "1rem" }}>Upcoming Matches</h2>
          <div className="live-matches" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {upcomingFixtures.map((f, i) => (
              <div key={i} className="fixture-card" style={{ padding: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div className="fixture-card-meta">{f.date} | {f.group}</div>
                  <div className="fixture-card-team" style={{ marginTop: "0.5rem" }}>
                    {f.match}
                  </div>
                </div>
                <button
                  onClick={() => handlePredict(f.match)}
                  className="studio-golive"
                  style={{ padding: "8px 16px", fontSize: "14px" }}
                  disabled={loading}
                >
                  Predict
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: Prediction & Chat */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          
          {/* Prediction Box */}
          <div style={{ background: "var(--color-surface-raised)", borderRadius: "14px", padding: "1.5rem", minHeight: "300px", border: "1px solid rgba(255,255,255,0.1)" }}>
            {activeMatch ? (
              <>
                <h3 style={{ color: "var(--brand-yellow)", marginBottom: "1rem" }}>Prediction: {activeMatch}</h3>
                {loading ? (
                  <div style={{ color: "white", opacity: 0.7 }}>
                    Fetching live squads & running AI simulation...
                  </div>
                ) : error ? (
                  <div style={{ color: "#ff6b6b" }}>{error}</div>
                ) : (
                  <div className="markdown-body" style={{ color: "white", fontSize: "15px", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                    {prediction}
                  </div>
                )}
              </>
            ) : (
              <div style={{ color: "rgba(255,255,255,0.4)", display: "flex", height: "100%", alignItems: "center", justifyContent: "center" }}>
                Select a match to generate an AI prediction.
              </div>
            )}
          </div>

          {/* AI Chat */}
          <div style={{ background: "var(--color-surface-raised)", borderRadius: "14px", padding: "1.5rem", border: "1px solid rgba(255,255,255,0.1)", display: "flex", flexDirection: "column", height: "400px" }}>
            <h3 style={{ color: "white", marginBottom: "1rem" }}>Ask the Analyst</h3>
            
            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1rem" }}>
              {chatHistory.map((msg, i) => (
                <div key={i} style={{ 
                  background: msg.role === "user" ? "rgba(255,255,255,0.1)" : "rgba(232,185,74,0.1)", 
                  padding: "12px", 
                  borderRadius: "8px",
                  color: "white",
                  alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                  maxWidth: "90%"
                }}>
                  <div style={{ whiteSpace: "pre-wrap" }}>{msg.text}</div>
                </div>
              ))}
              {chatLoading && <div style={{ color: "rgba(255,255,255,0.5)" }}>Typing...</div>}
            </div>

            <form onSubmit={handleChat} style={{ display: "flex", gap: "0.5rem" }}>
              <input 
                type="text" 
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Ask about team form, players..."
                style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.2)", background: "rgba(0,0,0,0.5)", color: "white" }}
              />
              <button type="submit" disabled={chatLoading || !chatMessage.trim()} className="studio-golive" style={{ padding: "0 20px" }}>
                Send
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
