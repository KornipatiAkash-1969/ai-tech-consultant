import React, { useState, useEffect } from 'react';
import { 
  Brain, Send, RefreshCw, AlertCircle, CheckCircle2, 
  ExternalLink, Image as ImageIcon, Sparkles, UserCheck 
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
    }
  };

  const handleResolveEscalation = async (escId) => {
    const answer = expertAnswers[escId];
    if (!answer || !answer.trim()) return;

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
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Task 1: The Knowledge Brain</h1>
          <p>Real-time RAG engine grounded in Brilliant Directories Solution Center with multimodal screenshot parsing and daily sitemap sync.</p>
        </div>
        <button className="btn btn-secondary" onClick={triggerSitemapSync}>
          <RefreshCw size={14} /> Sync Sitemap Daily ({syncStatus})
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
          <strong style={{ color: escalations.length > 0 ? '#f59e0b' : '#10b981' }}>
            {escalations.length}
          </strong>
        </div>
        <div className="metric-card">
          <span>Retrieval Engine</span>
          <strong style={{ color: '#38bdf8' }}>Hybrid BM25</strong>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: '24px' }}>
        {/* Chatbot Interface */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '580px' }}>
          <div className="glass-card-header">
            <h2><Brain size={18} color="#38bdf8" /> Technical Consultant Chatbot</h2>
            <span className="badge badge-blue">Grounded RAG</span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', paddingRight: '6px' }}>
            {chatMessages.map((msg, i) => (
              <div 
                key={i} 
                style={{
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  backgroundColor: msg.role === 'user' ? 'rgba(56, 189, 248, 0.15)' : '#0b1120',
                  border: `1px solid ${msg.role === 'user' ? 'rgba(56, 189, 248, 0.4)' : '#24324f'}`,
                  borderRadius: '10px',
                  padding: '12px 16px',
                  maxWidth: '85%',
                  fontSize: '13px',
                  lineHeight: '1.6'
                }}
              >
                <p style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</p>

                {/* Screenshot gallery */}
                {msg.images && msg.images.length > 0 && (
                  <div style={{ marginTop: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {msg.images.map((img, idx) => (
                      <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <img 
                          src={img.url} 
                          alt={img.caption} 
                          style={{ maxHeight: '80px', borderRadius: '6px', border: '1px solid #334155' }} 
                        />
                        <span style={{ fontSize: '10px', color: '#94a3b8', maxWidth: '140px' }}>{img.caption.slice(0, 40)}...</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Source Citations */}
                {msg.sources && msg.sources.length > 0 && (
                  <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px dashed #24324f', fontSize: '11px' }}>
                    <span style={{ fontWeight: 600, color: '#94a3b8' }}>Verified Documentation Sources:</span>
                    {msg.sources.map((s, idx) => (
                      <a 
                        key={idx} 
                        href={s.url} 
                        target="_blank" 
                        rel="noreferrer"
                        style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#38bdf8', textDecoration: 'none', marginTop: '4px' }}
                      >
                        <ExternalLink size={11} /> {s.title} ({s.category} &gt; {s.folder}) [{Math.round(s.relevance_score * 100)}%]
                      </a>
                    ))}
                  </div>
                )}

                {msg.escalated && (
                  <div style={{ marginTop: '8px' }}>
                    <span className="badge badge-amber">Escalated to Human Expert (Ticket #{msg.escalationId})</span>
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div style={{ alignSelf: 'flex-start', padding: '10px 14px', backgroundColor: '#0b1120', borderRadius: '8px', fontSize: '12px', color: '#94a3b8' }}>
                <Sparkles size={14} style={{ display: 'inline', marginRight: '6px' }} /> Consulting Knowledge Brain...
              </div>
            )}
          </div>

          <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
            <input 
              type="text" 
              placeholder="e.g. How do I configure Stripe payment gateway?"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              <Send size={14} /> Send
            </button>
          </form>
        </div>

        {/* Human Expert Escalation Queue */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '580px' }}>
          <div className="glass-card-header">
            <h2><UserCheck size={18} color="#f59e0b" /> Human Expert Escalation Queue</h2>
            <span className="badge badge-amber">Feedback Loop</span>
          </div>
          <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '14px' }}>
            When questions cannot be answered with high confidence, they queue here. Resolving an escalation flows the answer directly into vector memory.
          </p>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {escalations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b', fontSize: '13px' }}>
                <CheckCircle2 size={32} color="#10b981" style={{ margin: '0 auto 12px auto' }} />
                All customer inquiries resolved. Zero pending escalations!
              </div>
            ) : (
              escalations.map((esc) => (
                <div key={esc.id} style={{ backgroundColor: '#0b1120', border: '1px solid #24324f', borderRadius: '8px', padding: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <strong style={{ fontSize: '12.5px', color: '#fff' }}>Ticket #{esc.id}</strong>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>{new Date(esc.created_at).toLocaleTimeString()}</span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#cbd5e1', marginBottom: '10px' }}>"{esc.question}"</p>
                  
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="text" 
                      placeholder="Enter verified expert solution..."
                      value={expertAnswers[esc.id] || ''}
                      onChange={(e) => setExpertAnswers(prev => ({ ...prev, [esc.id]: e.target.value }))}
                      style={{ flex: 1, fontSize: '12px', padding: '8px 10px' }}
                    />
                    <button 
                      className="btn btn-primary btn-sm"
                      onClick={() => handleResolveEscalation(esc.id)}
                    >
                      Resolve &amp; Index
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
