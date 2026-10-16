import React, { useState, useEffect } from 'react';
import { 
  FileText, Play, CheckCircle, AlertTriangle, 
  DollarSign, Clock, Layers, ShieldCheck, ChevronRight, Loader2, Sparkles 
} from 'lucide-react';

const T3_URL = 'http://localhost:8003';

export default function Task3MeetingSOW() {
  const [transcripts, setTranscripts] = useState({});
  const [selectedKey, setSelectedKey] = useState('meeting_1');
  const [transcriptText, setTranscriptText] = useState('');
  const [currentSOW, setCurrentSOW] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isDiffing, setIsDiffing] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [agentStep, setAgentStep] = useState(1);

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
    setAgentStep(1);

    // Dynamic progression through the 5 agents
    const timer1 = setTimeout(() => setAgentStep(2), 350);
    const timer2 = setTimeout(() => setAgentStep(3), 700);
    const timer3 = setTimeout(() => setAgentStep(4), 1050);
    const timer4 = setTimeout(() => setAgentStep(5), 1400);

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
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      setIsRunning(false);
      setAgentStep(1);
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

    setIsApproving(true);
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
    } finally {
      setIsApproving(false);
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
      <div className="ind-card" style={{ marginBottom: '22px' }}>
        <div className="ind-card-header">
          <h2><FileText size={18} color="var(--cyan-primary)" /> Select Discovery Call Transcript</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-primary" onClick={handleRunPipeline} disabled={isRunning || isDiffing}>
              {isRunning ? <Loader2 size={14} className="spinner" /> : <Play size={14} />} 
              {isRunning ? 'Orchestrating 5 Agents...' : 'Run 5-Agent Pipeline'}
            </button>
            <button className="btn btn-secondary" onClick={handleRunDiff} disabled={isRunning || isDiffing}>
              {isDiffing ? <Loader2 size={14} className="spinner" /> : <Layers size={14} />} 
              {isDiffing ? 'Auditing Scope Creep...' : 'Run Meeting 2 Scope Diff & Creep'}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
          <select 
            value={selectedKey} 
            onChange={(e) => handleSelectTranscript(e.target.value)}
            style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: '12px' }}
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
          style={{ width: '100%', fontFamily: 'var(--font-mono)', fontSize: '11.5px', lineHeight: '1.6', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-input)' }}
          disabled={isRunning || isDiffing}
        />

        {/* Multi-Agent Stepper Loader */}
        {isRunning && (
          <div className="agent-pipeline-loader" style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--cyan-primary)', fontSize: '12.5px', fontWeight: 600 }}>
                <Loader2 size={15} className="spinner" />
                <span>Collaborative Multi-Agent Synthesis in Progress...</span>
              </div>
              <span className="badge badge-cyan font-mono">AGENT {agentStep} OF 5 ACTIVE</span>
            </div>

            <div className={`agent-step-item ${agentStep === 1 ? 'active' : agentStep > 1 ? 'completed' : ''}`}>
              {agentStep > 1 ? <CheckCircle size={14} color="var(--emerald-accent)" /> : agentStep === 1 ? <Loader2 size={14} className="spinner" /> : <Clock size={14} />}
              <span>Agent 1: Senior Consultant (Extracting technical requirements &amp; constraints)</span>
            </div>

            <div className={`agent-step-item ${agentStep === 2 ? 'active' : agentStep > 2 ? 'completed' : ''}`}>
              {agentStep > 2 ? <CheckCircle size={14} color="var(--emerald-accent)" /> : agentStep === 2 ? <Loader2 size={14} className="spinner" /> : <Clock size={14} />}
              <span>Agent 2: Feature Matcher (Querying Task 1 Knowledge Brain for built-in settings)</span>
            </div>

            <div className={`agent-step-item ${agentStep === 3 ? 'active' : agentStep > 3 ? 'completed' : ''}`}>
              {agentStep > 3 ? <CheckCircle size={14} color="var(--emerald-accent)" /> : agentStep === 3 ? <Loader2 size={14} className="spinner" /> : <Clock size={14} />}
              <span>Agent 3: Developer Estimator (Calculating hours &amp; complexity tiers)</span>
            </div>

            <div className={`agent-step-item ${agentStep === 4 ? 'active' : agentStep > 4 ? 'completed' : ''}`}>
              {agentStep > 4 ? <CheckCircle size={14} color="var(--emerald-accent)" /> : agentStep === 4 ? <Loader2 size={14} className="spinner" /> : <Clock size={14} />}
              <span>Agent 4: Scope Diff &amp; Creep Detector (Auditing baseline diffs &amp; exclusions)</span>
            </div>

            <div className={`agent-step-item ${agentStep === 5 ? 'active' : ''}`}>
              {agentStep === 5 ? <Loader2 size={14} className="spinner" /> : <Clock size={14} />}
              <span>Agent 5: Proposal Generator (Assembling itemized client agreement &amp; legal clauses)</span>
            </div>
          </div>
        )}

        {/* Scope Creep Diff Scanner Loader */}
        {isDiffing && (
          <div style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--amber-border)', borderRadius: 'var(--radius-sm)', padding: '14px', marginTop: '16px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--amber-accent)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
            <Loader2 size={16} className="spinner" />
            <span>Auditing Meeting 2 transcript for scope creep, Twilio SMS additions, and WebRTC exclusions...</span>
          </div>
        )}
      </div>

      {/* Results View */}
      {currentSOW && (
        <div className="ind-card">
          <div className="ind-card-header">
            <div>
              <h2 style={{ fontSize: '16px', color: 'var(--text-pure)' }}>{currentSOW.client_name}: {currentSOW.project_name}</h2>
              <span className={`badge ${currentSOW.status === 'human_approved' ? 'badge-green' : 'badge-amber'}`} style={{ marginTop: '6px' }}>
                {currentSOW.status === 'human_approved' ? '✓ FORMALLY APPROVED' : '⚠ PENDING HUMAN SIGN-OFF'}
              </span>
            </div>
            {currentSOW.status !== 'human_approved' && (
              <button className="btn btn-success" onClick={handleApproveSOW} disabled={isApproving}>
                {isApproving ? <Loader2 size={16} className="spinner" /> : <ShieldCheck size={16} />} 
                {isApproving ? "Transmitting..." : "Human Consultant Sign-Off & Transmit"}
              </button>
            )}
          </div>

          {/* Savings Showcase Banner */}
          <div className="savings-highlight-banner">
            <DollarSign size={36} color="var(--emerald-accent)" style={{ flexShrink: 0 }} />
            <div>
              <h3 style={{ fontSize: '16px', color: 'var(--text-pure)' }}>
                Client Capital Preserved: <span style={{ color: 'var(--emerald-accent)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>${currentSOW.built_in_savings_usd.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD</span>
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Achieved by mapping business requirements directly to native Brilliant Directories settings instead of billing unnecessary custom software engineering.
              </p>
            </div>
          </div>

          {/* Scope Diff Table (if present) */}
          {currentSOW.diff_items && currentSOW.diff_items.length > 0 && (
            <div style={{ marginBottom: '22px' }}>
              <h3 style={{ fontSize: '13.5px', color: 'var(--text-pure)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={16} color="var(--amber-accent)" /> Scope Delta &amp; Change Order Audit Log
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table className="ind-table">
                  <thead>
                    <tr>
                      <th>Feature</th>
                      <th>Status</th>
                      <th>Revised Spec</th>
                      <th>Extra Hours</th>
                      <th>Consultant Impact Analysis</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentSOW.diff_items.map((diff) => (
                      <tr key={diff.id}>
                        <td style={{ fontWeight: 600, color: 'var(--text-pure)' }}>{diff.title}</td>
                        <td>
                          <span className={`badge ${diff.status === 'OUT_OF_SCOPE_CREEP' ? 'badge-red' : diff.status === 'MODIFIED' ? 'badge-amber' : 'badge-blue'}`}>
                            {diff.status}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-primary)' }}>{diff.new_spec}</td>
                        <td style={{ color: diff.extra_hours > 0 ? 'var(--amber-accent)' : 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                          {diff.extra_hours > 0 ? `+${diff.extra_hours}h` : '0h'}
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }}>{diff.rationale}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Formatted Proposal Body */}
          <div className="sow-document-sheet">
            <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'var(--font-sans)', color: 'var(--text-primary)', fontSize: '13px', lineHeight: '1.7' }}>
              {currentSOW.proposal_markdown}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
