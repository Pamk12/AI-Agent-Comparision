import React, { useState, useEffect, useRef } from "react";
import "./App.css";

import Sidebar from "./components/Sidebar";
import ChatArea from "./components/ChatArea";
import MemoryTab from "./components/Tabs/MemoryTab";

import EvalsTab from "./components/Tabs/EvalsTab";
import MetricsTab from "./components/Tabs/MetricsTab";
import ErrorBoundary from "./components/ErrorBoundary";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

export default function App() {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState("");
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("memory");
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  
  // Observability logs
  const [logs, setLogs] = useState([]);
  
  // Toast notifications
  const [toast, setToast] = useState({ show: false, message: "", type: "error" });
  const showToast = (message, type = "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 5000);
  };
  
  // Evals state
  const [evalRunning, setEvalRunning] = useState(false);
  const [evalResults, setEvalResults] = useState(null);
  const [evalMessage, setEvalMessage] = useState("");

  // Config fields
  const [provider, setProvider] = useState("groq");
  const [apiKey, setApiKey] = useState("");
  const [modelName, setModelName] = useState("llama-3.1-8b-instant");
  const [k, setK] = useState(3);
  const [sessionNameInput, setSessionNameInput] = useState("");

  const messagesEndRef = useRef(null);

  // Auto-scroll chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    fetchSessions();
    fetchLogs();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [sessions, activeSessionId]);

  // Sync config state with selected session
  const activeSession = sessions.find((s) => s.id === activeSessionId);
  
  useEffect(() => {
    if (activeSession) {
      setProvider(activeSession.config.provider);
      setApiKey(activeSession.config.apiKey || "");
      setModelName(activeSession.config.modelName || "");
      setK(activeSession.config.k);
    }
  }, [activeSessionId, activeSession]);

  // Update default model names when provider changes
  const handleProviderChange = (newProvider) => {
    setProvider(newProvider);
    if (newProvider === "groq") {
      setModelName("llama-3.1-8b-instant");
    } else {
      setModelName("Qwen/Qwen3.6-27B");
    }
  };

  const fetchSessions = async () => {
    try {
      const res = await fetch(`${API_BASE}/sessions`);
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
        if (data.length > 0 && !activeSessionId) {
          setActiveSessionId(data[0].id);
        }
      }
    } catch (err) {
      console.error("Error fetching sessions:", err);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch(`${API_BASE}/observability`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error("Error fetching logs:", err);
    }
  };

  const handleCreateSession = async () => {
    try {
      const payload = {
        name: sessionNameInput ? sessionNameInput.trim() : undefined,
        config: {
          provider,
          apiKey: apiKey ? apiKey.trim() : null,
          modelName: modelName ? modelName.trim() : null,
          k: parseInt(k, 10) || 5,
        },
      };

      const res = await fetch(`${API_BASE}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const newSession = await res.json();
        setSessions((prev) => [newSession, ...prev]);
        setActiveSessionId(newSession.id);
        setSessionNameInput("");
      } else {
        const errData = await res.json();
        showToast(`Failed to create session: ${errData.detail}`);
      }
    } catch (err) {
      showToast(`Network error creating session: ${err}`);
    }
  };

  const handleDeleteSession = async (id, e) => {
    e.stopPropagation();
    try {
      const res = await fetch(`${API_BASE}/sessions/${id}`, { method: "DELETE" });
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== id));
        if (activeSessionId === id) {
          setActiveSessionId("");
        }
      } else {
        const errData = await res.json();
        showToast(`Failed to delete session: ${errData.detail}`);
      }
    } catch (err) {
      console.error("Error deleting session:", err);
      showToast(`Network error deleting session: ${err}`);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || loading || !activeSessionId) return;

    const userMsg = inputMessage;
    setInputMessage("");
    setLoading(true);

    const optimisticMessage = {
      role: "user",
      content: userMsg,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      in_context: true
    };
    
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === activeSessionId) {
          return { ...s, messages: [...s.messages, optimisticMessage] };
        }
        return s;
      })
    );

    try {
      const res = await fetch(`${API_BASE}/sessions/${activeSessionId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg }),
      });

      if (res.ok) {
        const responseData = await res.json();
        setSessions((prev) =>
          prev.map((s) => {
            if (s.id === activeSessionId) {
              return {
                ...s,
                messages: responseData.in_context_messages,
                user_facts: responseData.user_facts,
              };
            }
            return s;
          })
        );
        fetchLogs();
      } else {
        const errData = await res.json();
        showToast(`API Error: ${errData.detail || "Unknown error"}`);
        fetchSessions();
      }
    } catch (err) {
      showToast(`Network error sending message: ${err}`);
      fetchSessions();
    } finally {
      setLoading(false);
    }
  };

  const handleRunEvaluation = async () => {
    // Note: the backend will fallback to env vars if apiKey isn't provided here
    setEvalRunning(true);
    setEvalMessage("Running benchmark test cases (15 prompts) against Local OSS (Qwen) and Groq Cloud models... Please wait.");
    setEvalResults(null);
    
    try {
      const res = await fetch(`${API_BASE}/eval/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groqApiKey: apiKey || null
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        setEvalResults(data.metrics);
        setEvalMessage("Evaluation completed! You can now download the PDF report.");
      } else {
        const errData = await res.ok ? {} : await res.json();
        setEvalMessage(`Evaluation failed: ${errData.detail || "Unknown error"}`);
      }
    } catch (err) {
      setEvalMessage(`Network error during evaluation: ${err}`);
    } finally {
      setEvalRunning(false);
    }
  };

  const renderMessageContent = (content) => {
    let text = content
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    text = text.replace(/```([\s\S]+?)```/g, (_, code) => `<pre><code>${code.trim()}</code></pre>`);
    text = text.replace(/`([^`]+)`/g, (_, code) => `<code>${code}</code>`);
    text = text.replace(/\*\*([\s\S]+?)\*\*/g, (_, bold) => `<strong>${bold}</strong>`);
    text = text.replace(/\n/g, "<br />");

    return <div className="markdown-content" dangerouslySetInnerHTML={{ __html: text }} />;
  };

  return (
    <div className={`app-container ${leftPanelOpen ? "left-open" : ""} ${rightPanelOpen ? "right-open" : ""}`}>
      {toast.show && (
        <div className={`toast-notification toast-${toast.type}`}>
          {toast.message}
          <button className="toast-close" onClick={() => setToast((prev) => ({ ...prev, show: false }))}>×</button>
        </div>
      )}

      <ErrorBoundary showToast={showToast}>
        <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        setActiveSessionId={setActiveSessionId}
        handleCreateSession={handleCreateSession}
        handleDeleteSession={handleDeleteSession}
        sessionNameInput={sessionNameInput}
        setSessionNameInput={setSessionNameInput}
        provider={provider}
        handleProviderChange={handleProviderChange}
        apiKey={apiKey}
        setApiKey={setApiKey}
        modelName={modelName}
        setModelName={setModelName}
        k={k}
        setK={setK}
        leftPanelOpen={leftPanelOpen}
        setLeftPanelOpen={setLeftPanelOpen}
      />

      <ChatArea
        activeSession={activeSession}
        loading={loading}
        inputMessage={inputMessage}
        setInputMessage={setInputMessage}
        handleSendMessage={handleSendMessage}
        renderMessageContent={renderMessageContent}
        messagesEndRef={messagesEndRef}
        handleCreateSession={handleCreateSession}
        rightPanelOpen={rightPanelOpen}
        setRightPanelOpen={setRightPanelOpen}
        leftPanelOpen={leftPanelOpen}
        setLeftPanelOpen={setLeftPanelOpen}
      />

      <div className={`right-panel ${rightPanelOpen ? "open" : ""}`}>
        <div className="panel-tabs">

          <button
            className={`tab-btn ${activeTab === "memory" ? "active" : ""}`}
            onClick={() => setActiveTab("memory")}
          >
            🧠 Memory
          </button>

          <button
            className={`tab-btn ${activeTab === "evals" ? "active" : ""}`}
            onClick={() => setActiveTab("evals")}
          >
            🔬 Evals
          </button>

          <button
            className={`tab-btn ${activeTab === "metrics" ? "active" : ""}`}
            onClick={() => setActiveTab("metrics")}
          >
            📊 Metrics
          </button>
        </div>

        <div className="panel-content">


          {activeTab === "memory" && <MemoryTab activeSession={activeSession} />}
          
          {activeTab === "metrics" && <MetricsTab logs={logs} activeSessionId={activeSessionId} />}

          {activeTab === "evals" && (
            <EvalsTab
              handleRunEvaluation={handleRunEvaluation}
              evalRunning={evalRunning}
              apiKey={apiKey}
              evalMessage={evalMessage}
              evalResults={evalResults}
              API_BASE={API_BASE}
            />
          )}
        </div>
      </div>
      </ErrorBoundary>
    </div>
  );
}
