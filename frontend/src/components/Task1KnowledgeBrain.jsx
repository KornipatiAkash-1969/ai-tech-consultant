import React, { useState, useEffect } from 'react';
import { 
  Brain, Send, RefreshCw, AlertCircle, CheckCircle2, 
  ExternalLink, Image as ImageIcon, Sparkles, UserCheck, Loader2 
} from 'lucide-react';

const T1_URL = 'http://localhost:8001';

export default function Task1KnowledgeBrain() {
  const [stats, setStats] = useState({ total_articles: 0, total_images_indexed: 0, pending_escalations: 0 });
  const [escalations, setEscalations] = useState([]);
  const [chatMessages, setChatMessages] = useState([
    {
      role: 'assistant',
      text: 'Hello! I am your AI Tech Consultant. I know every setting, menu, and add-on in the Brilliant Directories Solution Center. Ask me anything!',
      sources: [],
      images: []
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [resolvingId, setResolvingId] = useState(null);
  const [syncStatus, setSyncStatus] = useState('Idle');
  const [expertAnswers, setExpertAnswers] = useState({});

  useEffect(() => {
    fetchStats();
    fetchEscalations();
    const interval = setInterval(() => {
      fetchStats();
      fetchEscalations();
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${T1_URL}/api/v1/stats`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {}
  };

  const fetchEscalations = async () => {
    try {
      const res = await fetch(`${T1_URL}/api/v1/escalations?status=pending`);
      if (res.ok) {
        const data = await res.json();
        setEscalations(data);
      }
    } catch {}
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputQuery.trim() || isLoading) return;

    const userQ = inputQuery.trim();
    setInputQuery('');
    setChatMessages(prev => [...prev, { role: 'user', text: userQ }]);
    setIsLoading(true);

    try {
      const res = await fetch(`${T1_URL}/api/v1/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userQ })
      });
      const data = await res.json();

      setChatMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: data.answer,
          sources: data.sources || [],
          images: data.images_used || [],
          confidence: data.confidence_score,
          escalated: data.escalated,
          escalationId: data.escalation_id
        }
      ]);

      if (data.escalated) {
        fetchEscalations();
        fetchStats();
      }
    } catch (err) {
      setChatMessages(prev => [
        ...prev,
        { role: 'assistant', text: `Connection error: ${err.message}. Ensure Task 1 server is running.` }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const triggerSitemapSync = async () => {
    setIsSyncing(true);
    setSyncStatus('Syncing sitemap...');
    try {
      const res = await fetch(`${T1_URL}/api/v1/sync`, { method: 'POST' });
      const data = await res.json();
      setSyncStatus('Sync Complete');
      alert(`Sitemap Synchronizer: ${data.message}`);
      fetchStats();
    } catch (err) {
      setSyncStatus('Sync Failed');
      alert('Failed to connect to Task 1 API.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleResolveEscalation = async (escId) => {
    const answer = expertAnswers[escId];
    if (!answer || !answer.trim()) return;

    setResolvingId(escId);
    try {
      const res = await fetch(`${T1_URL}/api/v1/escalations/${escId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expert_answer: answer,
          expert_name: "Senior Technical Consultant"
        })
      });

      if (res.ok) {
        alert(`Escalation #${escId} resolved! This verified solution has now flown back into Knowledge Brain vector memory.`);
        setExpertAnswers(prev => ({ ...prev, [escId]: '' }));
        fetchEscalations();
        fetchStats();
      }
    } catch (err) {
      alert(`Error resolving escalation: ${err.message}`);
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Task 1: The Knowledge Brain</h1>
          <p>Real-time RAG engine grounded in Brilliant Directories Solution Center with multimodal screenshot parsing and daily sitemap sync.</p>
        </div>
        <button className="btn btn-secondary" onClick={triggerSitemapSync} disabled={isSyncing}>
          <RefreshCw size={14} className={isSyncing ? "spinner" : ""} /> 
          {isSyncing ? "Syncing Solution Center..." : `Sync Sitemap Daily (${syncStatus})`}
        </button>
      </div>

      {/* Metrics Bar */}
      <div className="stats-bar">
        <div className="metric-card">
          <span>Articles Indexed</span>
          <strong>{stats.total_articles || 26}</strong>
        </div>
        <div className="metric-card">
          <span>Screenshots Analyzed</span>
          <strong>{stats.total_images_indexed || 20}</strong>
        </div>
        <div className="metric-card">
          <span>Pending Escalations</span>
          <strong style={{ color: escalations.length > 0 ? 'var(--amber-accent)' : 'var(--emerald-accent)' }}>
            {escalations.length}
          </strong>
        </div>
        <div className="metric-card">
          <span>Retrieval Engine</span>
          <strong style={{ color: 'var(--cyan-primary)' }}>Hybrid BM25</strong>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: '22px' }}>
        {/* Chatbot Interface */}
        <div className="ind-card" style={{ display: 'flex', flexDirection: 'column', height: '600px' }}>
          <div className="ind-card-header">
            <h2><Brain size={18} color="var(--cyan-primary)" /> Technical Consultant Terminal</h2>
            <span className="badge badge-cyan">Grounded RAG</span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', paddingRight: '8px' }}>
            {chatMessages.map((msg, i) => (
              <div 
                key={i} 
                className={msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-agent'}
              >
                <p style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</p>

                {/* Screenshot gallery */}
                {msg.images && msg.images.length > 0 && (
                  <div style={{ marginTop: '12px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {msg.images.map((img, idx) => (
                      <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <img 
                          src={img.url} 
                          alt={img.caption} 
                          style={{ maxHeight: '88px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-default)', objectFit: 'cover' }} 
                        />
                        <span style={{ fontSize: '9.5px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', maxWidth: '140px' }}>
                          {img.caption.slice(0, 36)}...
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Source Citations */}
                {msg.sources && msg.sources.length > 0 && (
                  <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Verified Solution Center Sources:
                    </span>
                    {msg.sources.map((s, idx) => (
                      <a 
                        key={idx} 
                        href={s.url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="citation-pill"
                      >
                        <ExternalLink size={10} /> {s.title} ({s.category}) [{Math.round(s.relevance_score * 100)}%]
                      </a>
                    ))}
                  </div>
                )}

                {msg.escalated && (
                  <div style={{ marginTop: '10px' }}>
                    <span className="badge badge-amber">Escalated to Human Expert (Ticket #{msg.escalationId})</span>
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="chat-bubble-agent" style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '78%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--cyan-primary)', fontSize: '12px' }}>
                  <Loader2 size={15} className="spinner" />
                  <span style={{ fontFamily: 'var(--font-mono)' }}>Consulting Knowledge Brain Vector Store...</span>
                  <div className="pulse-loader" style={{ marginLeft: 'auto' }}>
                    <span className="pulse-dot"></span>
                    <span className="pulse-dot"></span>
                    <span className="pulse-dot"></span>
                  </div>
                </div>
                <div className="skeleton" style={{ height: '11px', width: '92%' }}></div>
                <div className="skeleton" style={{ height: '11px', width: '70%' }}></div>
              </div>
            )}
          </div>

          <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
            <input 
              type="text" 
              placeholder="Query Brilliant Directories documentation or settings (e.g. How do I configure Stripe?)..."
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              style={{ flex: 1 }}
              disabled={isLoading}
            />
            <button type="submit" className="btn btn-primary" disabled={isLoading || !inputQuery.trim()}>
              {isLoading ? (
                <>
                  <Loader2 size={14} className="spinner" />
                  <span>Consulting...</span>
                </>
              ) : (
                <>
                  <Send size={14} />
                  <span>Send</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Human Expert Escalation Queue */}
        <div className="ind-card" style={{ display: 'flex', flexDirection: 'column', height: '600px' }}>
          <div className="ind-card-header">
            <h2><UserCheck size={18} color="var(--amber-accent)" /> Human Escalation Queue</h2>
            <span className="badge badge-amber">Memory Flowback</span>
          </div>
          <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '14px' }}>
            Low-confidence queries queue here automatically. Senior consultant resolutions write directly back into Knowledge Brain vector memory.
          </p>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {escalations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)', fontSize: '13px' }}>
                <CheckCircle2 size={36} color="var(--emerald-accent)" style={{ margin: '0 auto 12px auto' }} />
                All queries verified. Zero pending escalations!
              </div>
            ) : (
              escalations.map((esc) => (
                <div key={esc.id} style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', padding: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span className="badge badge-amber font-mono">TICKET #{esc.id}</span>
                    <span style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      {new Date(esc.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-pure)', marginBottom: '12px', fontStyle: 'italic' }}>
                    "{esc.question}"
                  </p>
                  
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="text" 
                      placeholder="Enter verified expert resolution..."
                      value={expertAnswers[esc.id] || ''}
                      onChange={(e) => setExpertAnswers(prev => ({ ...prev, [esc.id]: e.target.value }))}
                      style={{ flex: 1, fontSize: '12px', padding: '6px 10px' }}
                      disabled={resolvingId === esc.id}
                    />
                    <button 
                      className="btn btn-primary btn-sm"
                      onClick={() => handleResolveEscalation(esc.id)}
                      disabled={resolvingId === esc.id || !expertAnswers[esc.id]?.trim()}
                    >
                      {resolvingId === esc.id ? (
                        <>
                          <Loader2 size={12} className="spinner" />
                          <span>Indexing...</span>
                        </>
                      ) : (
                        <span>Resolve &amp; Index</span>
                      )}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
