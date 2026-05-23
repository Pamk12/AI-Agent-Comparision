import React from "react";

export default function EvalsTab({
  handleRunEvaluation,
  evalRunning,
  apiKey,
  evalMessage,
  evalResults,
  API_BASE
}) {
  const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

  return (
    <div className="eval-panel-container">
      <div className="eval-run-card">
        <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-primary)" }}>
          Automated Evaluation Center
        </div>
        <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: "1.4" }}>
          Runs a 15-prompt validation benchmark (Factual, Adversarial, and Sensitive prompts) against both Local OSS (Qwen-0.5B) and Groq Cloud. A heuristic rule-based judge scores responses on hallucinations, refusals, and bias.
        </p>
        
        {!isLocalhost ? (
          <div style={{ fontSize: "0.85rem", color: "var(--accent-orange)", background: "rgba(249, 115, 22, 0.1)", padding: "12px", borderRadius: "6px", marginTop: "12px", border: "1px solid rgba(249, 115, 22, 0.3)" }}>
            Because of API limit can be tested locally using own key of groq.
          </div>
        ) : (
          <>
            <button
              className="eval-run-btn"
              onClick={handleRunEvaluation}
              disabled={evalRunning}
            >
              {evalRunning ? (
                <>Running benchmarks...</>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                  Run 15-Prompt Benchmark Suite
                </>
              )}
            </button>
            
            {evalMessage && (
              <div style={{ fontSize: "0.75rem", color: "var(--accent-cyan)", background: "rgba(0,0,0,0.2)", padding: "8px", borderRadius: "4px" }}>
                {evalMessage}
              </div>
            )}
          </>
        )}
      </div>

      {evalResults && (
        <div className="eval-results-container">
          <div style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "8px", borderBottom: "1px solid var(--glass-border)", paddingBottom: "4px" }}>
            Benchmark Comparison Results
          </div>
          <table className="eval-metrics-table">
            <thead>
              <tr>
                <th>Metric (Score 0-100)</th>
                <th>Local OSS (Qwen)</th>
                <th>Frontier (Groq)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Hallucination Rate</td>
                <td>{(evalResults.oss.hallucination_rate * 100).toFixed(0)}</td>
                <td>{(evalResults.frontier.hallucination_rate * 100).toFixed(0)}</td>
              </tr>
              <tr>
                <td>Content Safety (jailbreak resistance, refusal handling, robustness to harmful prompts)</td>
                <td>{(evalResults.oss.content_safety * 100).toFixed(0)}</td>
                <td>{(evalResults.frontier.content_safety * 100).toFixed(0)}</td>
              </tr>
              <tr>
                <td>Bias & Harmful Outputs (stereotypes, discriminatory behavior, unsafe responses)</td>
                <td>{(evalResults.oss.bias_and_harmful * 100).toFixed(0)}</td>
                <td>{(evalResults.frontier.bias_and_harmful * 100).toFixed(0)}</td>
              </tr>
            </tbody>
          </table>
          
          <a
            href={`${API_BASE}/eval/report`}
            className="download-report-btn"
            target="_blank"
            rel="noreferrer"
            style={{ marginTop: "10px" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Download evaluation_report.pdf
          </a>
        </div>
      )}
    </div>
  );
}
