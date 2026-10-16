const T1_URL = 'http://localhost:8001';
const T2_URL = 'http://localhost:8002';
const T3_URL = 'http://localhost:8003';

let currentSelectedEmailId = null;
let currentSOWId = null;
let transcriptsCache = {};

document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  checkTelemetry();
  setInterval(checkTelemetry, 5000);

  // Task 1 Init
  initTask1();

  // Task 2 Init
  initTask2();

  // Task 3 Init
  initTask3();
});

// Navigation Tabs
function initTabs() {
  const navButtons = document.querySelectorAll('.nav-item');
  const panes = document.querySelectorAll('.tab-pane');

  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-tab');
      navButtons.forEach(b => b.classList.remove('active'));
      panes.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const activePane = document.getElementById(target);
      if (activePane) activePane.classList.add('active');
    });
  });
}

// Telemetry check
async function checkTelemetry() {
  // Task 1
  try {
    const res = await fetch(`${T1_URL}/health`);
    if (res.ok) {
      document.getElementById('t1-dot').className = 'dot online';
      document.getElementById('t1-status').innerText = 'Online';
    } else throw new Error();
  } catch {
    document.getElementById('t1-dot').className = 'dot offline';
    document.getElementById('t1-status').innerText = 'Offline';
  }

  // Task 2
  try {
    const res = await fetch(`${T2_URL}/health`);
    if (res.ok) {
      document.getElementById('t2-dot').className = 'dot online';
      document.getElementById('t2-status').innerText = 'Online';
    } else throw new Error();
  } catch {
    document.getElementById('t2-dot').className = 'dot offline';
    document.getElementById('t2-status').innerText = 'Offline';
  }

  // Task 3
  try {
    const res = await fetch(`${T3_URL}/health`);
    if (res.ok) {
      document.getElementById('t3-dot').className = 'dot online';
      document.getElementById('t3-status').innerText = 'Online';
    } else throw new Error();
  } catch {
    document.getElementById('t3-dot').className = 'dot offline';
    document.getElementById('t3-status').innerText = 'Offline';
  }
}

/* ============================================================
   TASK 1: KNOWLEDGE BRAIN LOGIC
   ============================================================ */
function initTask1() {
  loadTask1Stats();
  loadEscalations();

  document.getElementById('btn-sync-sitemap').addEventListener('click', async () => {
    try {
      const res = await fetch(`${T1_URL}/api/v1/sync`, { method: 'POST' });
      const data = await res.json();
      alert(`Sitemap Sync Triggered: ${data.message}`);
      loadTask1Stats();
    } catch (err) {
      alert('Failed to trigger sitemap sync. Ensure Task 1 server is running.');
    }
  });

  const chatForm = document.getElementById('t1-chat-form');
  const chatInput = document.getElementById('t1-input-query');
  const chatMessages = document.getElementById('t1-chat-messages');

  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const query = chatInput.value.trim();
    if (!query) return;

    // Render User Message
    appendMessage(chatMessages, 'user', query);
    chatInput.value = '';

    // Render Loading indicator
    const loadingEl = appendMessage(chatMessages, 'assistant', 'Consulting Knowledge Brain...');

    try {
      const res = await fetch(`${T1_URL}/api/v1/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: query })
      });
      const data = await res.json();

      let html = `<p>${formatMarkdown(data.answer)}</p>`;
      
      // Images preview
      if (data.images_used && data.images_used.length > 0) {
        html += `<div style="margin-top: 10px; display: flex; gap: 8px;">`;
        for (const img of data.images_used) {
          html += `<img src="${img.url}" alt="${img.caption}" style="max-height: 80px; border-radius: 6px; border: 1px solid #334155;" title="${img.caption}">`;
        }
        html += `</div>`;
      }

      // Source citations
      if (data.sources && data.sources.length > 0) {
        html += `<div class="citations"><strong>Verified Sources:</strong>`;
        for (const s of data.sources) {
          html += `<a href="${s.url}" target="_blank">📄 ${s.title} (${s.category} > ${s.folder}) [Confidence: ${Math.round(s.relevance_score * 100)}%]</a>`;
        }
        html += `</div>`;
      }

      if (data.escalated) {
        html += `<div style="margin-top: 8px;"><span class="badge badge-warning">Escalated to Human Expert (Ticket #${data.escalation_id})</span></div>`;
        loadEscalations();
        loadTask1Stats();
      }

      loadingEl.innerHTML = html;
    } catch (err) {
      loadingEl.innerHTML = `<p style="color: #ef4444;">Error connecting to Knowledge Brain: ${err.message}</p>`;
    }
  });
}

async function loadTask1Stats() {
  try {
    const res = await fetch(`${T1_URL}/api/v1/stats`);
    if (res.ok) {
      const data = await res.json();
      document.getElementById('t1-stat-articles').innerText = data.total_articles;
      document.getElementById('t1-stat-images').innerText = data.total_images_indexed;
      document.getElementById('t1-stat-escalations').innerText = data.pending_escalations;
    }
  } catch {}
}

async function loadEscalations() {
  try {
    const res = await fetch(`${T1_URL}/api/v1/escalations?status=pending`);
    if (!res.ok) return;
    const items = await res.json();
    const container = document.getElementById('t1-escalation-list');

    if (items.length === 0) {
      container.innerHTML = `<div class="empty-state">No pending escalations. All customer queries are currently resolved!</div>`;
      return;
    }

    container.innerHTML = items.map(item => `
      <div class="escalation-item" id="esc-${item.id}">
        <strong>Ticket #${item.id}</strong>
        <p style="margin: 4px 0 8px 0; color: #e2e8f0;">"${item.question}"</p>
        <small style="color: #94a3b8;">Created: ${new Date(item.created_at).toLocaleTimeString()}</small>
        <form class="escalation-resolve-form" onsubmit="resolveEscalation(event, '${item.id}')">
          <input type="text" placeholder="Enter expert solution to feed into memory..." required id="input-esc-${item.id}">
          <button type="submit" class="btn btn-primary btn-sm">Resolve & Index</button>
        </form>
      </div>
    `).join('');
  } catch {}
}

window.resolveEscalation = async function(e, id) {
  e.preventDefault();
  const input = document.getElementById(`input-esc-${id}`);
  const answer = input.value.trim();
  if (!answer) return;

  try {
    const res = await fetch(`${T1_URL}/api/v1/escalations/${id}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ expert_answer: answer, expert_name: "Lead Support Specialist" })
    });
    if (res.ok) {
      alert(`Escalation #${id} resolved! Answer has been indexed into Knowledge Brain memory.`);
      loadEscalations();
      loadTask1Stats();
    }
  } catch (err) {
    alert(`Failed to resolve escalation: ${err.message}`);
  }
};

/* ============================================================
   TASK 2: INBOX AGENT LOGIC
   ============================================================ */
let allEmailsCache = [];

function initTask2() {
  loadAutonomyStates();
  loadEmails();
  loadLearnedRules();

  document.getElementById('email-category-filter').addEventListener('change', (e) => {
    filterEmails(e.target.value);
  });

  document.getElementById('btn-trigger-regression').addEventListener('click', async () => {
    const cat = prompt('Enter category to trigger safety regression on (e.g. how_to, refund, quote):', 'how_to');
    if (!cat) return;
    try {
      const res = await fetch(`${T2_URL}/api/v1/autonomy/regression`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: cat, reason: "Manual safety regression audit simulation" })
      });
      if (res.ok) {
        alert(`Safety regression triggered for '${cat}'. Consecutive streak reset to 0 and autonomy revoked.`);
        loadAutonomyStates();
        loadEmails();
      }
    } catch (err) {
      alert('Error triggering regression.');
    }
  });
}

async function loadAutonomyStates() {
  try {
    const res = await fetch(`${T2_URL}/api/v1/autonomy/status`);
    if (!res.ok) return;
    const states = await res.json();
    const grid = document.getElementById('autonomy-grid');

    grid.innerHTML = Object.entries(states).map(([cat, s]) => {
      const pct = Math.min(100, Math.round((s.consecutive_approvals / s.threshold) * 100));
      const isAuto = s.is_autonomous;
      return `
        <div class="meter-box ${isAuto ? 'autonomous' : ''}">
          <h4>${cat.replace('_', ' ')}</h4>
          <div class="meter-counter">${s.consecutive_approvals} / 20</div>
          <span class="badge ${isAuto ? 'badge-success' : ''}">${isAuto ? '⚡ Autonomous' : 'Human Approval'}</span>
          <div class="meter-bar">
            <div class="meter-fill" style="width: ${pct}%;"></div>
          </div>
          <div style="font-size: 10px; color: #64748b; margin-top: 6px;">Total Sent: ${s.total_processed}</div>
        </div>
      `;
    }).join('');
  } catch {}
}

async function loadEmails() {
  try {
    const res = await fetch(`${T2_URL}/api/v1/emails`);
    if (!res.ok) return;
    allEmailsCache = await res.json();
    filterEmails(document.getElementById('email-category-filter').value);
  } catch {}
}

function filterEmails(category) {
  const container = document.getElementById('email-items-container');
  const filtered = category === 'all' 
    ? allEmailsCache 
    : allEmailsCache.filter(e => e.category === category);

  container.innerHTML = filtered.map(email => `
    <div class="email-item ${email.id === currentSelectedEmailId ? 'active' : ''}" onclick="selectEmail('${email.id}')">
      <div class="email-item-header">
        <span class="email-sender">${email.sender_name || email.sender}</span>
        <span class="badge ${email.urgency === 'high' ? 'badge-warning' : ''}">${email.category}</span>
      </div>
      <div class="email-subject">${email.subject}</div>
      <div style="font-size: 11px; margin-top: 4px; display: flex; justify-content: space-between;">
        <span style="color: #64748b;">${new Date(email.received_at).toLocaleDateString()}</span>
        <span style="color: ${email.status === 'approved' ? '#10b981' : email.status === 'edited' ? '#38bdf8' : '#94a3b8'};">
          ${email.status ? email.status.toUpperCase() : 'PENDING'}
        </span>
      </div>
    </div>
  `).join('');
}

window.selectEmail = async function(emailId) {
  currentSelectedEmailId = emailId;
  filterEmails(document.getElementById('email-category-filter').value);

  const email = allEmailsCache.find(e => e.id === emailId);
  const pane = document.getElementById('email-review-pane');
  if (!email) return;

  pane.innerHTML = `<div class="empty-state">Loading or generating AI draft for ${email.sender_name}...</div>`;

  // Fetch or generate draft
  let draft = email.draft;
  if (!draft) {
    try {
      const res = await fetch(`${T2_URL}/api/v1/emails/${emailId}/draft`, { method: 'POST' });
      draft = await res.json();
      email.draft = draft;
    } catch (err) {
      pane.innerHTML = `<div class="empty-state" style="color: #ef4444;">Error generating draft: ${err.message}</div>`;
      return;
    }
  }

  pane.innerHTML = `
    <div class="review-header">
      <h3>${email.subject}</h3>
      <div class="review-meta">
        <span>From: <strong>${email.sender_name}</strong> (${email.sender})</span>
        <span>Category: <strong style="text-transform: capitalize;">${email.category.replace('_', ' ')}</strong></span>
        <span>Urgency: <strong>${email.urgency.toUpperCase()}</strong></span>
        <span>Autonomy: <strong>${draft.auto_sent ? '⚡ AUTO-SENT' : 'Human Review Needed'}</strong></span>
      </div>
    </div>

    <h4>Customer Message:</h4>
    <div class="email-body-box">${email.body.replace(/\n/g, '<br>')}</div>

    <h4>AI Drafted Reply (Voice: ${draft.company_voice}):</h4>
    <div class="draft-box">
      <textarea id="draft-textarea-${emailId}">${draft.draft_text}</textarea>
    </div>

    <div class="review-actions">
      <button class="btn btn-success" onclick="reviewEmail('${emailId}', 'send_as_is')">🚀 Send As-Is (Approve Draft)</button>
      <button class="btn btn-primary" onclick="reviewEmail('${emailId}', 'edit_and_send')">✏️ Edit & Send (Teach Agent)</button>
      <button class="btn btn-danger" onclick="reviewEmail('${emailId}', 'reject_and_rewrite')">❌ Reject & Rewrite</button>
    </div>
  `;
};

window.reviewEmail = async function(emailId, action) {
  const textarea = document.getElementById(`draft-textarea-${emailId}`);
  const editedText = textarea ? textarea.value : '';

  try {
    const res = await fetch(`${T2_URL}/api/v1/emails/${emailId}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        edited_text: editedText,
        reviewer_name: "Senior Support Manager"
      })
    });
    const data = await res.json();

    alert(`Action Recorded: ${action.replace(/_/g, ' ').toUpperCase()}\nSimilarity: ${Math.round(data.similarity_score * 100)}%\nAutonomy Streak: ${data.autonomy.consecutive_approvals}/20`);
    loadAutonomyStates();
    loadEmails();
    loadLearnedRules();
  } catch (err) {
    alert('Error submitting review.');
  }
};

async function loadLearnedRules() {
  try {
    const res = await fetch(`${T2_URL}/api/v1/learning/rules`);
    if (!res.ok) return;
    const rules = await res.json();
    const tbody = document.getElementById('learned-rules-body');

    if (rules.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center">No custom rules learned yet. Edit any draft above to teach the agent!</td></tr>`;
      return;
    }

    tbody.innerHTML = rules.map(r => `
      <tr>
        <td><span class="badge">${r.category}</span></td>
        <td>${r.rule_text}</td>
        <td><code>${r.source_email_id}</code></td>
        <td>${r.times_applied}</td>
        <td><span class="badge ${r.active ? 'badge-success' : ''}">${r.active ? 'Active' : 'Disabled'}</span></td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="undoRule('${r.id}')">Undo Rule</button>
        </td>
      </tr>
    `).join('');
  } catch {}
}

window.undoRule = async function(ruleId) {
  try {
    const res = await fetch(`${T2_URL}/api/v1/learning/rules/${ruleId}/undo`, { method: 'POST' });
    if (res.ok) {
      alert(`Rule ${ruleId} undone successfully.`);
      loadLearnedRules();
    }
  } catch {}
};

/* ============================================================
   TASK 3: MEETING TO SOW LOGIC
   ============================================================ */
function initTask3() {
  loadTranscripts();

  document.getElementById('t3-transcript-select').addEventListener('change', (e) => {
    const key = e.target.value;
    document.getElementById('t3-transcript-preview').value = transcriptsCache[key] || '';
  });

  document.getElementById('btn-run-pipeline').addEventListener('click', async () => {
    const text = document.getElementById('t3-transcript-preview').value;
    if (!text) return;

    const btn = document.getElementById('btn-run-pipeline');
    btn.disabled = true;
    btn.innerText = 'Running Multi-Agent Pipeline...';

    try {
      const res = await fetch(`${T3_URL}/api/v1/sow/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript_text: text,
          meeting_name: "Discovery Meeting"
        })
      });
      const data = await res.json();
      renderSOWResults(data);
    } catch (err) {
      alert(`Error generating SOW: ${err.message}`);
    } finally {
      btn.disabled = false;
      btn.innerText = '🚀 Run Multi-Agent Team';
    }
  });

  document.getElementById('btn-run-diff').addEventListener('click', async () => {
    const m2Text = transcriptsCache['meeting_2'];
    if (!m2Text) {
      alert('Meeting 2 transcript not found.');
      return;
    }

    const btn = document.getElementById('btn-run-diff');
    btn.disabled = true;
    btn.innerText = 'Detecting Scope Diff & Creep...';

    try {
      const res = await fetch(`${T3_URL}/api/v1/sow/diff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base_sow_id: currentSOWId || "sow_baseline",
          new_transcript_text: m2Text,
          meeting_name: "Meeting 2 (Scope Revision & Creep)"
        })
      });
      const data = await res.json();
      renderSOWResults(data);
    } catch (err) {
      alert(`Error running diff: ${err.message}`);
    } finally {
      btn.disabled = false;
      btn.innerText = '🔍 Run Meeting 2 Scope Diff & Creep Detector';
    }
  });

  document.getElementById('btn-approve-sow').addEventListener('click', async () => {
    if (!currentSOWId) return;
    try {
      const res = await fetch(`${T3_URL}/api/v1/sow/${currentSOWId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approver_name: "Senior Partner Alex Rivera" })
      });
      const data = await res.json();
      alert('Scope of Work & Proposal formally APPROVED! Ready for client transmission.');
      renderSOWResults(data);
    } catch (err) {
      alert('Failed to approve SOW.');
    }
  });
}

async function loadTranscripts() {
  try {
    const res = await fetch(`${T3_URL}/api/v1/transcripts`);
    if (!res.ok) return;
    transcriptsCache = await res.json();
    document.getElementById('t3-transcript-preview').value = transcriptsCache['meeting_1'] || '';
  } catch {}
}

function renderSOWResults(sow) {
  currentSOWId = sow.id;
  const card = document.getElementById('t3-results-card');
  card.style.display = 'block';

  document.getElementById('t3-sow-title').innerText = `${sow.client_name}: ${sow.project_name}`;
  const badge = document.getElementById('t3-sow-badge');
  badge.innerText = sow.status.toUpperCase();
  badge.className = `badge ${sow.status === 'human_approved' ? 'badge-success' : 'badge-warning'}`;

  // Savings
  document.getElementById('t3-savings-amount').innerText = `$${sow.built_in_savings_usd.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

  // Proposal HTML render
  document.getElementById('t3-proposal-body').innerHTML = formatMarkdown(sow.proposal_markdown);

  // Scroll into view
  card.scrollIntoView({ behavior: 'smooth' });
}

// Helpers
function appendMessage(container, role, text) {
  const el = document.createElement('div');
  el.className = `message ${role}`;
  el.innerHTML = `<p>${text}</p>`;
  container.appendChild(el);
  container.scrollTop = container.scrollHeight;
  return el;
}

function formatMarkdown(md) {
  if (!md) return '';
  return md
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/`([^`]+)`/gim, '<code>$1</code>')
    .replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank">$1</a>')
    .replace(/\|(.+)\|/gim, (match) => {
      const cells = match.split('|').filter(c => c.trim().length > 0);
      if (cells.some(c => c.includes('---'))) return '';
      return '<tr>' + cells.map(c => `<td>${c.trim()}</td>`).join('') + '</tr>';
    })
    .replace(/\n/gim, '<br>');
}
