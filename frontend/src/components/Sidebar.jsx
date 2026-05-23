import React from "react";

export default function Sidebar({
  sessions,
  activeSessionId,
  setActiveSessionId,
  handleCreateSession,
  handleDeleteSession,
  sessionNameInput,
  setSessionNameInput,
  provider,
  handleProviderChange,
  apiKey,
  setApiKey,
  baseUrl,
  setBaseUrl,
  modelName,
  setModelName,
  k,
  setK
}) {
  const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#00f2fe" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M2 17L12 22L22 17" stroke="#9d4edd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M2 12L12 17L22 12" stroke="#00f2fe" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <h1>Founding Agent Playground</h1>
      </div>

      <div className="session-section">
        <button className="new-chat-btn" onClick={handleCreateSession}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          New Session
        </button>
        
        <div className="form-group" style={{ marginBottom: "15px" }}>
          <input
            type="text"
            className="form-input"
            placeholder="Custom session name..."
            value={sessionNameInput}
            onChange={(e) => setSessionNameInput(e.target.value)}
          />
        </div>

        <div className="sidebar-config-section" style={{ background: "var(--bg-secondary)", padding: "12px", borderRadius: "8px", marginBottom: "15px", border: "1px solid var(--glass-border)", fontSize: "0.85rem" }}>
          <div style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: "10px" }}>Session Settings</div>
          
          <div className="form-group" style={{ marginBottom: "8px" }}>
            <label style={{ fontSize: "0.75rem" }}>Provider</label>
            <select
              className="form-select"
              value={provider}
              onChange={(e) => handleProviderChange(e.target.value)}
              style={{ padding: "6px", fontSize: "0.8rem" }}
            >
              <option value="groq">Groq Cloud</option>
              <option value="local">Local OSS (Qwen-0.5B)</option>
            </select>
          </div>

          {provider === "groq" && (
            <div className="form-group" style={{ marginBottom: "8px" }}>
              <label style={{ fontSize: "0.75rem" }}>Model Name</label>
              <input
                type="text"
                className="form-input"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                style={{ padding: "6px", fontSize: "0.8rem" }}
              />
            </div>
          )}

          {!isLocalhost && (
            <div className="form-group" style={{ marginBottom: "8px" }}>
              <label style={{ fontSize: "0.75rem" }}>API Key</label>
              <input
                type="password"
                className="form-input"
                placeholder="Optional (falls back to .env)"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                style={{ padding: "6px", fontSize: "0.8rem" }}
              />
            </div>
          )}

          {provider === "local" && (
            <div className="form-group" style={{ marginBottom: "8px" }}>
              <label style={{ fontSize: "0.75rem", display: "flex", justifyContent: "space-between" }}>
                Model Name
                <span className="info-icon" title="Using local transformers model offline">ℹ️</span>
              </label>
              <input 
                type="text" 
                value="Qwen/Qwen2.5-0.5B-Instruct" 
                disabled
                className="form-input"
                style={{ 
                  background: "rgba(255, 255, 255, 0.05)", 
                  borderColor: "rgba(255, 255, 255, 0.1)",
                  color: "var(--text-secondary)",
                  cursor: "not-allowed",
                  padding: "6px", 
                  fontSize: "0.8rem"
                }} 
              />
            </div>
          )}

          <div className="form-group" style={{ marginBottom: "0" }}>
            <label style={{ fontSize: "0.75rem", display: "flex", justifyContent: "space-between" }}>
              <span>Memory (k)</span>
              <span style={{ color: "var(--accent-purple)", fontWeight: "bold" }}>{k}</span>
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={k}
              onChange={(e) => setK(e.target.value)}
              style={{ width: "100%", accentColor: "var(--accent-purple)", marginTop: "4px" }}
            />
          </div>
        </div>

        <div className="session-dropdown-container" style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "10px" }}>
          <select 
            className="form-select" 
            value={activeSessionId} 
            onChange={(e) => setActiveSessionId(e.target.value)}
            style={{ flex: 1, padding: "8px", background: "rgba(10, 10, 20, 0.8)", border: "1px solid var(--border-light)", color: "white", borderRadius: "8px" }}
          >
            {sessions.length === 0 && (
              <option value="" disabled>No active sessions</option>
            )}
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.config.provider})
              </option>
            ))}
          </select>
          
          <button 
            className="delete-session-btn" 
            onClick={(e) => {
              if (activeSessionId) handleDeleteSession(activeSessionId, e);
            }}
            disabled={!activeSessionId || sessions.length === 0}
            style={{ 
              opacity: 1, 
              padding: "8px", 
              background: "var(--bg-tertiary)", 
              border: "1px solid var(--border-light)",
              borderRadius: "8px",
              cursor: (!activeSessionId || sessions.length === 0) ? "not-allowed" : "pointer"
            }}
            title="Delete Session"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-red)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
