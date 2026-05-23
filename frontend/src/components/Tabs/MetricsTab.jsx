import React from "react";

export default function MetricsTab({ logs = [], activeSessionId }) {
  const sessionLogs = logs.filter(l => l.session_id === activeSessionId).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  const latestLog = sessionLogs.length > 0 ? sessionLogs[0] : null;

  return (
    <div className="eval-panel-container">
      <div className="eval-run-card">
        <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-primary)" }}>
          OSS Deployment Metrics
        </div>
        <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: "1.4" }}>
          Cost and Latency table directly comparing your local CPU deployment for the Qwen Open Source model against public deployment targets.
        </p>
      </div>

      {latestLog && (
        <div className="eval-results-container" style={{ marginBottom: "16px" }}>
          <div style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "8px", borderBottom: "1px solid var(--glass-border)", paddingBottom: "4px" }}>
            Real-Time Breakdown (Last Message)
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
            <div style={{ background: "var(--glass-bg)", padding: "10px", borderRadius: "6px" }}>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: "4px" }}>Latency</div>
              <div style={{ color: "var(--accent-orange)", fontWeight: 600 }}>{(latestLog.latency_ms / 1000).toFixed(2)}s</div>
            </div>
            <div style={{ background: "var(--glass-bg)", padding: "10px", borderRadius: "6px" }}>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: "4px" }}>Cost</div>
              <div style={{ color: "var(--accent-cyan)", fontWeight: 600 }}>${latestLog.cost ? latestLog.cost.toFixed(6) : "0.000000"}</div>
            </div>
            <div style={{ background: "var(--glass-bg)", padding: "10px", borderRadius: "6px" }}>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: "4px" }}>Tokens In</div>
              <div style={{ color: "var(--text-primary)", fontWeight: 600 }}>{latestLog.tokens_in}</div>
            </div>
            <div style={{ background: "var(--glass-bg)", padding: "10px", borderRadius: "6px" }}>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: "4px" }}>Tokens Out</div>
              <div style={{ color: "var(--text-primary)", fontWeight: 600 }}>{latestLog.tokens_out}</div>
            </div>
          </div>
        </div>
      )}

      <div className="eval-results-container">
        <div style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "8px", borderBottom: "1px solid var(--glass-border)", paddingBottom: "4px" }}>
          Deployment Cost + Latency Analysis
        </div>
        <table className="eval-metrics-table">
          <thead>
            <tr>
              <th>Model Environment</th>
              <th>Avg. Latency</th>
              <th>Cost (1M Tokens)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Qwen-0.5B</strong><br/><span style={{fontSize: '0.65rem', color: 'var(--text-muted)'}}>Local CPU (Current)</span></td>
              <td style={{ color: "var(--accent-orange)" }}>~950ms</td>
              <td style={{ color: "var(--accent-cyan)" }}>~$1.20 / ~$1.20</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
