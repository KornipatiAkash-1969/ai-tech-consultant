import React, { useState, useEffect } from 'react';
import { 
  FileText, Play, CheckCircle, AlertTriangle, 
  DollarSign, Clock, Layers, ShieldCheck, ChevronRight 
} from 'lucide-react';

const T3_URL = 'http://localhost:8003';

export default function Task3MeetingSOW() {
  const [transcripts, setTranscripts] = useState({});
  const [selectedKey, setSelectedKey] = useState('meeting_1');
  const [transcriptText, setTranscriptText] = useState('');
  const [currentSOW, setCurrentSOW] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isDiffing, setIsDiffing] = useState(false);

  useEffect(() => {
    fetchTranscripts();
  }, []);

  const fetchTranscripts = async () => {
    try {
      const res = await fetch(`${T3_URL}/api/v1/transcripts`);
      if (res.ok) {
        const data = await res.json();
        setTranscripts(data);
        setTranscriptText(data['meeting_1'] || '');
      }
    } catch {}
  };

  const handleSelectTranscript = (key) => {
    setSelectedKey(key);
    setTranscriptText(transcripts[key] || '');
  };

  const handleRunPipeline = async () => {
    setIsRunning(true);
    try {
      const res = await fetch(`${T3_URL}/api/v1/sow/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript_text: transcriptText,
          meeting_name: selectedKey === 'meeting_1' ? "Meeting 1: Discovery" : "Meeting 3: Restaurant Portal"
        })
      });
      const data = await res.json();
      setCurrentSOW(data);
    } catch (err) {
      alert(`Error running pipeline: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleRunDiff = async () => {
    setIsDiffing(true);
    const m2Text = transcripts['meeting_2'];
    if (!m2Text) {
      alert('Meeting 2 transcript not found.');
      setIsDiffing(false);
      return;
    }

    try {
      const res = await fetch(`${T3_URL}/api/v1/sow/diff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base_sow_id: currentSOW?.id || "sow_baseline",
          new_transcript_text: m2Text,
          meeting_name: "Meeting 2: Scope Revision & Creep"
        })
      });
      const data = await res.json();
      setCurrentSOW(data);
      alert(`Scope diff complete! Detected ${data.diff_items.length} scope modifications and change order items.`);
    } catch (err) {
      alert(`Error detecting scope diff: ${err.message}`);
    } finally {
      setIsDiffing(false);
    }
  };

  const handleApproveSOW = async () => {
    if (!currentSOW) return;

    try {
      const res = await fetch(`${T3_URL}/api/v1/sow/${currentSOW.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approver_name: "Lead Partner Alex Rivera" })
      });
      const data = await res.json();
      setCurrentSOW(data);
      alert("Scope of Work formally APPROVED! Ready for transmission to client.");
    } catch (err) {
      alert('Error approving SOW.');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Task 3: Meeting to Scope of Work</h1>
          <p>5-agent team turning messy client transcripts into verified SOWs, built-in vs custom setting breakdowns, and client proposals.</p>
        </div>
      </div>

      {/* Transcript Input Workspace */}
      <div className="glass-card" style={{ marginBottom: '24px' }}>
        <div className="glass-card-header">
          <h2><FileText size={18} color="#38bdf8" /> Select Discovery Call Transcript</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-primary" onClick={handleRunPipeline} disabled={isRunning}>
              <Play size={14} /> {isRunning ? 'Running 5 Agents...' : 'Run Multi-Agent Pipeline'}
            </button>
            <button className="btn btn-secondary" onClick={handleRunDiff} disabled={isDiffing}>
              <Layers size={14} /> {isDiffing ? 'Detecting Creep...' : 'Run Meeting 2 Scope Diff & Creep'}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
          <select 
            value={selectedKey} 
            onChange={(e) => handleSelectTranscript(e.target.value)}
            style={{ flex: 1 }}
          >
            <option value="meeting_1">Meeting 1: Initial Discovery (Metro Doctors Directory)</option>
            <option value="meeting_2">Meeting 2: Scope Revision &amp; Creep (Metro Doctors Directory)</option>
            <option value="meeting_3">Meeting 3: Discovery Call (GreenEats Restaurant Portal)</option>
          </select>
        </div>

        <textarea 
          value={transcriptText}
          onChange={(e) => setTranscriptText(e.target.value)}
          rows={7}
          style={{ width: '100%', fontFamily: 'JetBrains Mono', fontSize: '12px', lineHeight: '1.6', color: '#94a3b8' }}
        />
      </div>

      {/* Results View */}
      {currentSOW && (
        <div className="glass-card">
          <div className="glass-card-header">
            <div>
              <h2 style={{ fontSize: '18px', color: '#fff' }}>{currentSOW.client_name}: {currentSOW.project_name}</h2>
              <span className={`badge ${currentSOW.status === 'human_approved' ? 'badge-green' : 'badge-amber'}`} style={{ marginTop: '4px' }}>
                {currentSOW.status.toUpperCase()}
              </span>
            </div>
            {currentSOW.status !== 'human_approved' && (
              <button className="btn btn-success" onClick={handleApproveSOW}>
                <ShieldCheck size={16} /> Human Consultant Sign-Off &amp; Approve
              </button>
            )}
          </div>

          {/* Savings Showcase Banner */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(56, 189, 248, 0.15))',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: '10px',
            padding: '18px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '24px'
          }}>
            <DollarSign size={32} color="#10b981" />
            <div>
              <h3 style={{ fontSize: '17px', color: '#fff' }}>
                Client Capital Preserved: <span style={{ color: '#10b981', fontWeight: 700 }}>${currentSOW.built_in_savings_usd.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD</span>
              </h3>
              <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '2px' }}>
                Achieved by mapping requirements to native Brilliant Directories built-in settings rather than billing unnecessary custom code.
              </p>
            </div>
          </div>

          {/* Scope Diff Table (if present) */}
          {currentSOW.diff_items && currentSOW.diff_items.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '15px', color: '#fff', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertTriangle size={16} color="#f59e0b" /> Scope Delta &amp; Change Order Analysis
              </h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #24324f', color: '#94a3b8', textAlign: 'left' }}>
                    <th style={{ padding: '8px 12px' }}>Feature</th>
                    <th style={{ padding: '8px 12px' }}>Status</th>
                    <th style={{ padding: '8px 12px' }}>Revised Spec</th>
                    <th style={{ padding: '8px 12px' }}>Extra Hours</th>
                    <th style={{ padding: '8px 12px' }}>Business Impact</th>
                  </tr>
                </thead>
                <tbody>
                  {currentSOW.diff_items.map((diff) => (
                    <tr key={diff.id} style={{ borderBottom: '1px solid #1e293b' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: '#fff' }}>{diff.title}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span className={`badge ${diff.status === 'OUT_OF_SCOPE_CREEP' ? 'badge-red' : diff.status === 'MODIFIED' ? 'badge-amber' : 'badge-blue'}`}>
                          {diff.status}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', color: '#cbd5e1' }}>{diff.new_spec}</td>
                      <td style={{ padding: '10px 12px', color: diff.extra_hours > 0 ? '#f59e0b' : '#94a3b8', fontWeight: 600 }}>
                        {diff.extra_hours > 0 ? `+${diff.extra_hours}h` : '0h'}
                      </td>
                      <td style={{ padding: '10px 12px', color: '#94a3b8' }}>{diff.rationale}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Formatted Proposal Body */}
          <div style={{ backgroundColor: '#0b1120', border: '1px solid #24324f', borderRadius: '10px', padding: '24px', lineHeight: '1.7', fontSize: '13.5px' }}>
            <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'Inter', color: '#e2e8f0' }}>
              {currentSOW.proposal_markdown}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
