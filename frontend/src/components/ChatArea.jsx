import React from "react";

export default function ChatArea({
  activeSession,
  loading,
  inputMessage,
  setInputMessage,
  handleSendMessage,
  renderMessageContent,
  messagesEndRef,
  handleCreateSession,
  rightPanelOpen,
  setRightPanelOpen,
  leftPanelOpen,
  setLeftPanelOpen
}) {
  return (
    <div className="chat-area">
      {activeSession ? (
        <>
          <div className="chat-header">
            <div className="chat-title-container">
              <span className="chat-title">{activeSession.name}</span>

            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <button 
                className={`panel-toggle-btn ${leftPanelOpen ? 'active' : ''}`}
                onClick={() => setLeftPanelOpen(!leftPanelOpen)}
                title="Toggle Sessions"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="9" y1="3" x2="9" y2="21"></line>
                </svg>
              </button>
              <button 
                className={`panel-toggle-btn ${rightPanelOpen ? 'active' : ''}`}
                onClick={() => setRightPanelOpen(!rightPanelOpen)}
                title="Toggle Config & Tools"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="15" y1="3" x2="15" y2="21"></line>
                </svg>
              </button>
            </div>
          </div>

          <div className="messages-container">
            {activeSession.messages.map((msg, i) => {
              // Determine message classes for custom tool displays
              let bubbleClass = "message-bubble";
              let isToolText = false;
              
              if (msg.content.includes("I am calling tool")) {
                bubbleClass += " tool-indicator";
                isToolText = true;
              } else if (msg.content.includes("Tool '") && msg.content.includes("returned output:")) {
                bubbleClass += " tool-output";
                isToolText = true;
              } else if (msg.content.includes("Request rejected:") || msg.content.includes("Output blocked:")) {
                bubbleClass += " safety-blocked";
              }

              return (
                <div key={i} className={`message-wrapper ${msg.role}`}>
                  <div className="message-header">
                    <span>{msg.role === "user" ? "You" : isToolText ? "⚙️ Agent System" : "🤖 Assistant"}</span>
                    <span>•</span>
                    <span>{msg.timestamp || "Just now"}</span>
                  </div>
                  <div className={bubbleClass}>
                    {renderMessageContent(msg.content)}
                  </div>
                  
                  {/* Sliding Window Context Indicator */}
                  {msg.role === "assistant" && !isToolText && (
                    <div className="message-status">
                      <span className={`status-badge ${msg.in_context ? "status-active" : "status-expired"}`}>
                        {msg.in_context ? "In Context Window" : "Expired Context"}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
            {loading && (
              <div className="message-wrapper assistant">
                <div className="message-header">
                  <span>🤖 Assistant</span>
                </div>
                <div className="message-bubble" style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                  <span style={{ color: "var(--accent-cyan)" }}>Agent thinking</span>
                  <span className="welcome-logo" style={{ fontSize: "1rem" }}>...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-container">
            <form className="chat-input-form" onSubmit={handleSendMessage}>
              <input
                type="text"
                className="chat-input"
                placeholder="Ask a question (e.g. 'What is 45*132?' or 'My name is Bob')..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                disabled={loading}
              />
              <button type="submit" className="send-btn" disabled={loading || !inputMessage.trim()}>
                {loading ? "Sending..." : "Send"}
              </button>
            </form>
          </div>
        </>
      ) : (
        <div className="welcome-screen">
          <span className="welcome-logo">🤖</span>
          <h2>Founding Engineer AI Assistant</h2>
          <p>
            Welcome to the conversational playground. Create a session in the left sidebar, configure your keys, and test multi-turn conversations, guardrails, and tool actions.
          </p>
          <button 
            className="new-chat-btn" 
            style={{ width: "200px", marginTop: "10px" }}
            onClick={handleCreateSession}
          >
            Create First Session
          </button>
        </div>
      )}
    </div>
  );
}
