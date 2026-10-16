import React, { useState, useEffect } from 'react';
import { 
  Mail, Send, Edit3, XCircle, AlertTriangle, 
  RotateCcw, Sparkles, Check, ArrowRight 
} from 'lucide-react';

const T2_URL = 'http://localhost:8002';

export default function Task2InboxAgent() {
  const [emails, setEmails] = useState([]);
  const [autonomyStates, setAutonomyStates] = useState({});
  const [learnedRules, setLearnedRules] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [draftText, setDraftText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isDrafting, setIsDrafting] = useState(false);

  useEffect(() => {
    fetchAutonomy();
    fetchEmails();
    fetchRules();
  }, []);

  const fetchAutonomy = async () => {
    try {
      const res = await fetch(`${T2_URL}/api/v1/autonomy/status`);
      if (res.ok) {
        const data = await res.json();
        setAutonomyStates(data);
      }
    } catch {}
  };

  const fetchEmails = async () => {
    try {
      const res = await fetch(`${T2_URL}/api/v1/emails`);
      if (res.ok) {
        const data = await res.json();
        setEmails(data);
        if (data.length > 0 && !selectedEmail) {
          selectEmail(data[0]);
        }
      }
    } catch {}
  };

  const fetchRules = async () => {
    try {
      const res = await fetch(`${T2_URL}/api/v1/learning/rules`);
      if (res.ok) {
        const data = await res.json();
        setLearnedRules(data);
      }
    } catch {}
  };

  const selectEmail = async (email) => {
    setSelectedEmail(email);
    if (email.draft) {
      setDraftText(email.draft.draft_text);
    } else {
      setIsDrafting(true);
      try {
        const res = await fetch(`${T2_URL}/api/v1/emails/${email.id}/draft`, { method: 'POST' });
        const draft = await res.json();
        email.draft = draft;
        setDraftText(draft.draft_text);
      } catch (err) {
        setDraftText('Error drafting reply.');
      } finally {
        setIsDrafting(false);
      }
    }
  };

  const handleReview = async (action) => {
    if (!selectedEmail) return;

    try {
      const res = await fetch(`${T2_URL}/api/v1/emails/${selectedEmail.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          edited_text: draftText,
          reviewer_name: "Senior Technical Support Specialist"
        })
      });
      const data = await res.json();

      alert(`Action Recorded: ${action.toUpperCase()}\nSimilarity: ${Math.round(data.similarity_score * 100)}%\nAutonomy Streak: ${data.autonomy.consecutive_approvals}/20`);
      fetchAutonomy();
      fetchEmails();
      fetchRules();
    } catch (err) {
      alert(`Error submitting review: ${err.message}`);
    }
  };

  const handleSimulateRegression = async () => {
    const cat = prompt("Enter category to trigger regression on (e.g. how_to, refund, quote):", "how_to");
    if (!cat) return;

    try {
      const res = await fetch(`${T2_URL}/api/v1/autonomy/regression`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: cat, reason: "Safety audit simulation triggered by human QA" })
      });
      if (res.ok) {
        alert(`Safety regression triggered for '${cat}'. Streak reset to 0 and autonomy revoked.`);
        fetchAutonomy();
      }
    } catch (err) {
      alert('Error triggering regression.');
    }
  };

  const handleUndoRule = async (ruleId) => {
    try {
      const res = await fetch(`${T2_URL}/api/v1/learning/rules/${ruleId}/undo`, { method: 'POST' });
      if (res.ok) {
        alert('Learned rule undone successfully.');
        fetchRules();
      }
    } catch (err) {
      alert('Error undoing rule.');
    }
  };

  const filteredEmails = categoryFilter === 'all' 
    ? emails 
    : emails.filter(e => e.category === categoryFilter);

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Task 2: The Inbox Agent</h1>
          <p>Autonomous self-improving email agent in strict TypeScript. Learns from human edits until 20 unedited approvals unlock autonomy.</p>
        </div>
        <button className="btn btn-danger btn-sm" onClick={handleSimulateRegression}>
          <AlertTriangle size={14} /> Simulate Safety Regression Rollback
        </button>
      </div>

      {/* Autonomy Meter */}
      <div className="ind-card" style={{ marginBottom: '22px' }}>
        <div className="ind-card-header">
          <h2>Autonomy Progress Telemetry (20 Consecutive Approvals Rule)</h2>
          <span className="badge badge-cyan font-mono">STRICT TYPESCRIPT ENGINE</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px' }}>
          {Object.entries(autonomyStates).map(([cat, s]) => {
            const pct = Math.min(100, Math.round((s.consecutive_approvals / s.threshold) * 100));
            return (
              <div 
                key={cat} 
                className={`autonomy-meter-card ${s.is_autonomous ? 'autonomous' : ''}`}
              >
                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-pure)', marginBottom: '4px' }}>
                  {cat.replace('_', ' ')}
                </div>
                <div style={{ fontSize: '18px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: s.is_autonomous ? 'var(--emerald-accent)' : 'var(--cyan-primary)' }}>
                  {s.consecutive_approvals} / 20
                </div>
                <span className={`badge ${s.is_autonomous ? 'badge-green' : 'badge-blue'}`} style={{ marginTop: '4px', fontSize: '9.5px' }}>
                  {s.is_autonomous ? '⚡ AUTONOMOUS' : 'HUMAN REVIEW'}
                </span>
                <div className="autonomy-bar-track">
                  <div className="autonomy-bar-fill" style={{ width: `${pct}%`, backgroundColor: s.is_autonomous ? 'var(--emerald-accent)' : 'var(--cyan-primary)' }}></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Inbox Workspace */}
      <div style={{ display: 'grid', gridTemplateColumns: '370px 1fr', gap: '20px', marginBottom: '22px' }}>
        {/* Email List */}
        <div className="ind-card" style={{ display: 'flex', flexDirection: 'column', height: '620px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', paddingBottom: '10px', borderBottom: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
              Inbox ({emails.length})
            </span>
            <select 
              value={categoryFilter} 
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{ padding: '4px 8px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}
            >
              <option value="all">ALL CATEGORIES (50)</option>
              <option value="how_to">HOW-TO (10)</option>
              <option value="new_project">NEW PROJECT (8)</option>
              <option value="refund">REFUND (8)</option>
              <option value="complaint">COMPLAINT (8)</option>
              <option value="quote">QUOTE (8)</option>
              <option value="follow_up">FOLLOW-UP (8)</option>
            </select>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '7px', paddingRight: '4px' }}>
            {filteredEmails.map((email) => (
              <div 
                key={email.id}
                onClick={() => selectEmail(email)}
                className={`email-item-card ${selectedEmail?.id === email.id ? 'selected' : ''}`}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-pure)' }}>{email.sender_name || email.sender}</span>
                  <span className={`badge ${email.urgency === 'high' ? 'badge-amber' : ''}`} style={{ fontSize: '9.5px' }}>
                    {email.category}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {email.subject}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '10px', fontFamily: 'var(--font-mono)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{new Date(email.received_at).toLocaleDateString()}</span>
                  <span style={{ color: email.status === 'approved' ? 'var(--emerald-accent)' : email.status === 'edited' ? 'var(--cyan-primary)' : 'var(--text-muted)', fontWeight: 600 }}>
                    {email.status ? email.status.toUpperCase() : 'PENDING REVIEW'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Review & Triage Workspace */}
        {selectedEmail ? (
          <div className="ind-card" style={{ display: 'flex', flexDirection: 'column', height: '620px' }}>
            <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px', marginBottom: '14px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-pure)', marginBottom: '6px' }}>{selectedEmail.subject}</h2>
              <div style={{ display: 'flex', gap: '16px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                <span>FROM: <strong style={{ color: 'var(--text-primary)' }}>{selectedEmail.sender_name}</strong> &lt;{selectedEmail.sender}&gt;</span>
                <span>CATEGORY: <strong style={{ color: 'var(--cyan-primary)', textTransform: 'uppercase' }}>{selectedEmail.category.replace('_', ' ')}</strong></span>
                <span>URGENCY: <strong style={{ color: selectedEmail.urgency === 'high' ? 'var(--amber-accent)' : 'var(--cyan-primary)' }}>{selectedEmail.urgency.toUpperCase()}</strong></span>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Customer Body */}
              <div>
                <span style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.06em' }}>
                  Customer Inbound Payload:
                </span>
                <div style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', padding: '12px 14px', fontSize: '12.5px', lineHeight: '1.6', marginTop: '6px', whiteSpace: 'pre-wrap', color: 'var(--text-primary)' }}>
                  {selectedEmail.body}
                </div>
              </div>

              {/* AI Draft Box */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.06em' }}>
                    Agent Drafted Resolution (Company Tone &amp; Knowledge Grounded):
                  </span>
                  {selectedEmail.draft?.auto_sent && (
                    <span className="badge badge-green font-mono">⚡ AUTO-DISPATCHED</span>
                  )}
                </div>

                <textarea 
                  value={draftText}
                  onChange={(e) => setDraftText(e.target.value)}
                  style={{ flex: 1, width: '100%', minHeight: '160px', lineHeight: '1.6', fontFamily: 'var(--font-sans)', fontSize: '13px' }}
                  disabled={isDrafting}
                />
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
              <button className="btn btn-success" onClick={() => handleReview('send_as_is')}>
                <Check size={14} /> Send As-Is (Approve Draft)
              </button>
              <button className="btn btn-primary" onClick={() => handleReview('edit_and_send')}>
                <Edit3 size={14} /> Edit &amp; Send (Teach Diff Learner)
              </button>
              <button className="btn btn-danger" onClick={() => handleReview('reject_and_rewrite')}>
                <XCircle size={14} /> Reject &amp; Rewrite
              </button>
            </div>
          </div>
        ) : (
          <div className="ind-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>SELECT AN INBOUND EMAIL TO INITIALIZE TRIAGE PANE</span>
          </div>
        )}
      </div>

      {/* Learned Rules Table */}
      <div className="ind-card">
        <div className="ind-card-header">
          <h2>Self-Improving Memory Store (Learned Policy Rules)</h2>
          <span className="badge badge-cyan font-mono">DYNAMIC AUDIT LOG</span>
        </div>
        <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '14px' }}>
          When human specialists edit drafts, the diff learner automatically extracts actionable policy rules to prevent repeating the mistake on future emails.
        </p>

        {learnedRules.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontSize: '12.5px', fontFamily: 'var(--font-mono)' }}>
            NO CUSTOM POLICIES LEARNED YET. EDIT ANY DRAFT ABOVE TO TEACH THE AGENT!
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="ind-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Learned Policy / Rule</th>
                  <th>Source Email</th>
                  <th>Times Applied</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {learnedRules.map((r) => (
                  <tr key={r.id}>
                    <td><span className="badge font-mono">{r.category}</span></td>
                    <td style={{ color: 'var(--text-pure)', fontWeight: 500 }}>{r.rule_text}</td>
                    <td><code style={{ color: 'var(--cyan-primary)' }}>{r.source_email_id}</code></td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{r.times_applied}</td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => handleUndoRule(r.id)}>
                        <RotateCcw size={12} /> Undo Rule
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
