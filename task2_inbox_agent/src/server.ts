import express, { Request, Response } from 'express';
import cors from 'cors';
import * as fs from 'fs';
import * as path from 'path';
import { CustomerEmail, DraftReply } from './types';
import { Task1Client } from './task1_client';
import { EmailClassifier } from './email_classifier';
import { LearningEngine } from './learning_engine';
import { AutonomyTracker } from './autonomy_tracker';
import { DraftGenerator } from './draft_generator';

export function createServer() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // Instantiate core components
  const task1Client = new Task1Client();
  const classifier = new EmailClassifier();
  const learningEngine = new LearningEngine();
  const autonomyTracker = new AutonomyTracker();
  const draftGenerator = new DraftGenerator(task1Client, learningEngine, autonomyTracker);

  // Load emails
  const emailsPath = path.resolve(__dirname, '../data/realistic_emails_50.json');
  let emails: CustomerEmail[] = [];
  if (fs.existsSync(emailsPath)) {
    emails = JSON.parse(fs.readFileSync(emailsPath, 'utf-8'));
    // Enrich with classifier
    emails = emails.map(e => classifier.enrichEmail(e));
  }

  // In-memory cache for drafts
  const drafts: Map<string, DraftReply> = new Map();

  app.get('/', (_req: Request, res: Response) => {
    res.json({
      service: 'AI Tech Consultant - Inbox Agent',
      version: '1.0.0',
      total_emails: emails.length,
      autonomy_states: autonomyTracker.getAllStates(),
      learned_rules_count: learningEngine.getAllRules().length,
      endpoints: [
        'GET /api/v1/emails',
        'POST /api/v1/emails/:id/draft',
        'POST /api/v1/emails/:id/review',
        'GET /api/v1/autonomy/status',
        'POST /api/v1/autonomy/regression',
        'GET /api/v1/learning/rules',
        'POST /api/v1/learning/rules/:id/undo'
      ]
    });
  });

  app.get('/health', async (_req: Request, res: Response) => {
    const task1Healthy = await task1Client.isHealthy();
    res.json({
      status: 'healthy',
      task1_api_connected: task1Healthy,
      emails_count: emails.length,
      drafts_generated: drafts.size
    });
  });

  app.get('/api/v1/emails', (_req: Request, res: Response) => {
    const enriched = emails.map(e => ({
      ...e,
      has_draft: drafts.has(e.id),
      draft: drafts.get(e.id) || null,
      is_category_autonomous: autonomyTracker.isAutonomous(e.category)
    }));
    res.json(enriched);
  });

  app.post('/api/v1/emails/:id/draft', async (req: Request, res: Response) => {
    const email = emails.find(e => e.id === req.params.id);
    if (!email) {
      return res.status(404).json({ error: 'Email not found' });
    }

    const draft = await draftGenerator.generateDraft(email);
    drafts.set(email.id, draft);
    return res.json(draft);
  });

  app.post('/api/v1/emails/:id/review', (req: Request, res: Response) => {
    const email = emails.find(e => e.id === req.params.id);
    if (!email) {
      return res.status(404).json({ error: 'Email not found' });
    }

    const { action, edited_text, reviewer_name } = req.body;
    let draft = drafts.get(email.id);
    if (!draft) {
      return res.status(400).json({ error: 'Draft must be generated before review' });
    }

    const originalDraft = draft.draft_text;
    const finalText = (action === 'edit_and_send' || action === 'reject_and_rewrite') && edited_text
      ? edited_text
      : originalDraft;

    const isUnchanged = action === 'send_as_is';
    const similarity = learningEngine.computeSimilarity(originalDraft, finalText);

    // 1. Update autonomy engine
    const autonomyResult = autonomyTracker.recordReview(email.category, isUnchanged, similarity);

    // 2. Extract learned preference if modified
    let learnedRule = null;
    if (!isUnchanged) {
      learnedRule = learningEngine.learnFromFeedback(email.id, email.category, originalDraft, finalText);
    }

    // 3. Update email status
    email.status = isUnchanged ? 'approved' : 'edited';

    return res.json({
      success: true,
      email_id: email.id,
      action_taken: action,
      similarity_score: similarity,
      autonomy: {
        category: email.category,
        consecutive_approvals: autonomyResult.consecutive,
        threshold: 20,
        is_autonomous: autonomyTracker.isAutonomous(email.category),
        was_reset: autonomyResult.wasReset
      },
      learned_rule: learnedRule,
      reviewer: reviewer_name || 'Support Specialist'
    });
  });

  app.get('/api/v1/autonomy/status', (_req: Request, res: Response) => {
    return res.json(autonomyTracker.getAllStates());
  });

  app.post('/api/v1/autonomy/regression', (req: Request, res: Response) => {
    const { category, reason } = req.body;
    if (!category) {
      return res.status(400).json({ error: 'Category required' });
    }
    autonomyTracker.triggerRegression(category, reason || 'Human safety audit regression');
    return res.json({
      success: true,
      category,
      updated_state: autonomyTracker.getState(category)
    });
  });

  app.get('/api/v1/learning/rules', (_req: Request, res: Response) => {
    return res.json(learningEngine.getAllRules());
  });

  app.post('/api/v1/learning/rules/:id/undo', (req: Request, res: Response) => {
    const success = learningEngine.undoRule(req.params.id);
    return res.json({ success });
  });

  app.post('/api/v1/learning/rules/:id/toggle', (req: Request, res: Response) => {
    const { active } = req.body;
    const success = learningEngine.toggleRule(req.params.id, Boolean(active));
    return res.json({ success });
  });

  return app;
}
