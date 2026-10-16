import React, { useState, useEffect } from 'react';
import { 
  Zap, Brain, Mail, FileText, Award, 
  Layers, Shield, Activity, ExternalLink 
} from 'lucide-react';

import Task1KnowledgeBrain from './components/Task1KnowledgeBrain';
import Task2InboxAgent from './components/Task2InboxAgent';
import Task3MeetingSOW from './components/Task3MeetingSOW';
import EvalsBenchmark from './components/EvalsBenchmark';

const T1_URL = 'http://localhost:8001';
const T2_URL = 'http://localhost:8002';
const T3_URL = 'http://localhost:8003';

export default function App() {
  const [activeTab, setActiveTab] = useState('task1');
  const [telemetry, setTelemetry] = useState({
    task1: false,
    task2: false,
    task3: false
  });

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  const checkHealth = async () => {
    // Task 1
    let t1 = false, t2 = false, t3 = false;
    try {
      const r1 = await fetch(`${T1_URL}/health`);
      t1 = r1.ok;
    } catch {}

    // Task 2
    try {
      const r2 = await fetch(`${T2_URL}/health`);
      t2 = r2.ok;
    } catch {}

    // Task 3
    try {
      const r3 = await fetch(`${T3_URL}/health`);
      t3 = r3.ok;
    } catch {}

    setTelemetry({ task1: t1, task2: t2, task3: t3 });
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="brand-section">
          <div className="brand-logo">
            <Zap size={22} />
          </div>
          <div className="brand-info">
            <h2>AI Tech Consultant</h2>
            <span>BusinessLabs Applied AI</span>
          </div>
        </div>

        <nav className="nav-group">
          <button 
            className={`nav-btn ${activeTab === 'task1' ? 'active' : ''}`}
            onClick={() => setActiveTab('task1')}
          >
            <Brain size={18} />
            <div className="nav-btn-text">
              <strong>1. Knowledge Brain</strong>
              <small>Polite RAG &amp; Vision</small>
            </div>
          </button>

          <button 
            className={`nav-btn ${activeTab === 'task2' ? 'active' : ''}`}
            onClick={() => setActiveTab('task2')}
          >
            <Mail size={18} />
            <div className="nav-btn-text">
              <strong>2. Inbox Agent</strong>
              <small>50 Emails &amp; Autonomy</small>
            </div>
          </button>

          <button 
            className={`nav-btn ${activeTab === 'task3' ? 'active' : ''}`}
            onClick={() => setActiveTab('task3')}
          >
            <FileText size={18} />
            <div className="nav-btn-text">
              <strong>3. Meeting to SOW</strong>
              <small>Multi-Agent Pipeline</small>
            </div>
          </button>

          <button 
            className={`nav-btn ${activeTab === 'evals' ? 'active' : ''}`}
            onClick={() => setActiveTab('evals')}
          >
            <Award size={18} />
            <div className="nav-btn-text">
              <strong>Evals Benchmark</strong>
              <small>Sonnet vs Haiku (60 Cases)</small>
            </div>
          </button>
        </nav>

        {/* Live Service Telemetry */}
        <div className="telemetry-card">
          <div className="telemetry-header">
            <span>Service Telemetry</span>
            <Activity size={12} color="#38bdf8" />
          </div>

          <div className="telemetry-row">
            <span>Task 1 (Port 8001):</span>
            <span className={`status-badge ${telemetry.task1 ? 'online' : 'offline'}`}>
              <span className="status-dot"></span>
              {telemetry.task1 ? 'Online' : 'Offline'}
            </span>
          </div>

          <div className="telemetry-row">
            <span>Task 2 (Port 8002):</span>
            <span className={`status-badge ${telemetry.task2 ? 'online' : 'offline'}`}>
              <span className="status-dot"></span>
              {telemetry.task2 ? 'Online' : 'Offline'}
            </span>
          </div>

          <div className="telemetry-row">
            <span>Task 3 (Port 8003):</span>
            <span className={`status-badge ${telemetry.task3 ? 'online' : 'offline'}`}>
              <span className="status-dot"></span>
              {telemetry.task3 ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <main className="main-viewport">
        {activeTab === 'task1' && <Task1KnowledgeBrain />}
        {activeTab === 'task2' && <Task2InboxAgent />}
        {activeTab === 'task3' && <Task3MeetingSOW />}
        {activeTab === 'evals' && <EvalsBenchmark />}
      </main>
    </div>
  );
}
