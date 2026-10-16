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
      <div className="glass-card" style={{ marginBottom: '20px' }}>
        <div className="glass-card-header">
          <h2>Autonomy Progress Meter (20 Consecutive Approvals Rule)</h2>
          <span className="badge badge-blue">Category Scoped</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px' }}>
          {Object.entries(autonomyStates).map(([cat, s]) => {
            const pct = Math.min(100, Math.round((s.consecutive_approvals / s.threshold) * 100));
            return (
              <div 
                key={cat} 
                style={{
                  backgroundColor: '#0b1120',
                  border: `1px solid ${s.is_autonomous ? '#10b981' : '#24324f'}`,
                  borderRadius: '10px',
                  padding: '12px',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 600, textTransform: 'capitalize', color: '#fff', marginBottom: '4px' }}>
                  {cat.replace('_', ' ')}
                </div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: s.is_autonomous ? '#10b981' : '#38bdf8' }}>
                  {s.consecutive_approvals} / 20
                </div>
                <span className={`badge ${s.is_autonomous ? 'badge-green' : 'badge-blue'}`} style={{ marginTop: '4px' }}>
                  {s.is_autonomous ? '⚡ Autonomous' : 'Human Review'}
                </span>
                <div style={{ height: '5px', backgroundColor: '#1e293b', borderRadius: '999px', overflow: 'hidden', marginTop: '8px' }}>
                  <div style={{ height: '100%', width: `${pct}%`, backgroundColor: s.is_autonomous ? '#10b981' : '#38bdf8', transition: 'width 0.3s ease' }}></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Inbox Workspace */}
      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '20px', marginBottom: '24px' }}>
        {/* Email List */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '620px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <strong style={{ fontSize: '13.5px', color: '#fff' }}>Customer Inbox ({emails.length})</strong>
            <select 
              value={categoryFilter} 
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{ padding: '6px 10px', fontSize: '11.5px' }}
            >
              <option value="all">All (50)</option>
              <option value="how_to">How-To (10)</option>
              <option value="new_project">New Project (8)</option>
              <option value="refund">Refund (8)</option>
              <option value="complaint">Complaint (8)</option>
              <option value="quote">Quote (8)</option>
              <option value="follow_up">Follow-Up (8)</option>
            </select>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredEmails.map((email) => (
              <div 
                key={email.id}
                onClick={() => selectEmail(email)}
                style={{
                  padding: '12px',
                  backgroundColor: selectedEmail?.id === email.id ? 'rgba(56, 189, 248, 0.12)' : '#0b1120',
                  border: `1px solid ${selectedEmail?.id === email.id ? '#38bdf8' : '#24324f'}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#fff' }}>{email.sender_name || email.sender}</span>
                  <span className={`badge ${email.urgency === 'high' ? 'badge-amber' : ''}`} style={{ fontSize: '10px' }}>
                    {email.category}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {email.subject}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '10.5px' }}>
                  <span style={{ color: '#64748b' }}>{new Date(email.received_at).toLocaleDateString()}</span>
                  <span style={{ color: email.status === 'approved' ? '#10b981' : email.status === 'edited' ? '#38bdf8' : '#94a3b8' }}>
                    {email.status ? email.status.toUpperCase() : 'PENDING'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Review & Triage Workspace */}
        {selectedEmail ? (
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '620px' }}>
            <div style={{ borderBottom: '1px solid #24324f', paddingBottom: '12px', marginBottom: '14px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>{selectedEmail.subject}</h2>
              <div style={{ display: 'flex', gap: '16px', fontSize: '11.5px', color: '#94a3b8', marginTop: '6px' }}>
                <span>From: <strong style={{ color: '#cbd5e1' }}>{selectedEmail.sender_name}</strong> ({selectedEmail.sender})</span>
                <span>Category: <strong style={{ color: '#cbd5e1', textTransform: 'capitalize' }}>{selectedEmail.category.replace('_', ' ')}</strong></span>
                <span>Urgency: <strong style={{ color: selectedEmail.urgency === 'high' ? '#f59e0b' : '#38bdf8' }}>{selectedEmail.urgency.toUpperCase()}</strong></span>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Customer Body */}
              <div>
                <span style={{ fontSize: '11.5px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 600 }}>Customer Message:</span>
                <div style={{ backgroundColor: '#0b1120', border: '1px solid #24324f', borderRadius: '8px', padding: '12px 14px', fontSize: '13px', lineHeight: '1.6', marginTop: '4px', whiteSpace: 'pre-wrap' }}>
                  {selectedEmail.body}
                </div>
              </div>

              {/* AI Draft Box */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '11.5px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 600 }}>
                    AI Drafted Reply (Company Voice):
                  </span>
                  {selectedEmail.draft?.auto_sent && (
                    <span className="badge badge-green">⚡ Auto-Sent to Client</span>
                  )}
                </div>

                <textarea 
                  value={draftText}
                  onChange={(e) => setDraftText(e.target.value)}
                  style={{ flex: 1, width: '100%', minHeight: '160px', lineHeight: '1.6' }}
                  disabled={isDrafting}
                />
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #24324f' }}>
              <button className="btn btn-success" onClick={() => handleReview('send_as_is')}>
                <Check size={14} /> Send As-Is (Approve Draft)
              </button>
              <button className="btn btn-primary" onClick={() => handleReview('edit_and_send')}>
                <Edit3 size={14} /> Edit &amp; Send (Teach Agent)
              </button>
              <button className="btn btn-danger" onClick={() => handleReview('reject_and_rewrite')}>
                <XCircle size={14} /> Reject &amp; Rewrite
              </button>
            </div>
          </div>
        ) : (
          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#64748b' }}>Select an email from the left pane to begin review.</span>
          </div>
        )}
      </div>

      {/* Learned Rules Table */}
      <div className="glass-card">
        <div className="glass-card-header">
          <h2>Self-Improving Memory Store (Learned Preferences)</h2>
          <span className="badge badge-blue">Measurable &amp; Undoable</span>
        </div>
        <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '14px' }}>
          When human specialists edit drafts, the diff learner extracts policy rules to prevent repeating the mistake on subsequent emails.
        </p>

        {learnedRules.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', color: '#64748b', fontSize: '13px' }}>
            No custom rules learned yet. Edit any draft above to teach the agent!
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #24324f', color: '#94a3b8', textAlign: 'left' }}>
                  <th style={{ padding: '8px 12px' }}>Category</th>
                  <th style={{ padding: '8px 12px' }}>Learned Policy / Rule</th>
                  <th style={{ padding: '8px 12px' }}>Source Email</th>
                  <th style={{ padding: '8px 12px' }}>Times Applied</th>
                  <th style={{ padding: '8px 12px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {learnedRules.map((r) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #1e293b' }}>
                    <td style={{ padding: '10px 12px' }}><span className="badge">{r.category}</span></td>
                    <td style={{ padding: '10px 12px', color: '#fff' }}>{r.rule_text}</td>
                    <td style={{ padding: '10px 12px', color: '#94a3b8' }}><code>{r.source_email_id}</code></td>
                    <td style={{ padding: '10px 12px' }}>{r.times_applied}</td>
                    <td style={{ padding: '10px 12px' }}>
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
