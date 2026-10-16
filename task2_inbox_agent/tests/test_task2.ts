import { EmailClassifier } from '../src/email_classifier';
import { LearningEngine } from '../src/learning_engine';
import { AutonomyTracker } from '../src/autonomy_tracker';
import { DraftGenerator } from '../src/draft_generator';
import { Task1Client } from '../src/task1_client';
import { CustomerEmail } from '../src/types';

async function runTask2Tests() {
  console.log('--- RUNNING TASK 2 INBOX AGENT TESTS ---');

  // Test 1: Email Classification
  console.log('Testing Email Classifier...');
  const classifier = new EmailClassifier();
  const refundClass = classifier.classify('Duplicate charge on credit card statement', 'I was charged twice $79. Please refund immediately.');
  if (refundClass.category !== 'refund') throw new Error(`Expected refund, got ${refundClass.category}`);
  if (refundClass.urgency !== 'high') throw new Error(`Expected high urgency, got ${refundClass.urgency}`);

  const howToClass = classifier.classify('How to import CSV members', 'Where in the admin panel do I upload my member list?');
  if (howToClass.category !== 'how_to') throw new Error(`Expected how_to, got ${howToClass.category}`);
  console.log('PASS: Email Classifier');

  // Test 2: Draft Generation
  console.log('Testing Draft Generator & Task 1 integration...');
  const task1Client = new Task1Client();
  const learningEngine = new LearningEngine();
  const autonomyTracker = new AutonomyTracker();
  const draftGen = new DraftGenerator(task1Client, learningEngine, autonomyTracker);

  const testEmail: CustomerEmail = {
    id: 'test_em_01',
    sender: 'user@example.com',
    sender_name: 'Alex Rivera',
    subject: 'How do I import members via CSV?',
    body: 'I have 500 members in Excel, what format is required?',
    category: 'how_to',
    urgency: 'medium',
    received_at: new Date().toISOString()
  };

  const draft = await draftGen.generateDraft(testEmail);
  if (!draft.draft_text.includes('Hi Alex,')) throw new Error('Greeting name missing in draft');
  if (!draft.draft_text.includes('Brilliant Directories')) throw new Error('Platform context missing');
  console.log('PASS: Draft Generator');

  // Test 3: Learning Engine (Diff, Extraction, Undo)
  console.log('Testing Feedback Learning Engine...');
  const originalDraft = "Hi Alex,\nYou can import members using the CSV import tool.\nBest regards,\nSupport";
  const humanEdited = "Hi Alex,\nYou can import members using the CSV import tool under Settings > General Settings. Be sure to backup your existing members first!\nBest regards,\nSupport";
  
  const learnedRule = learningEngine.learnFromFeedback('test_em_01', 'how_to', originalDraft, humanEdited);
  if (!learnedRule) throw new Error('Expected rule to be learned from human edit');
  console.log(`Learned rule extracted: "${learnedRule.rule_text}"`);

  // Verify undo capability
  const undone = learningEngine.undoRule(learnedRule.id);
  if (!undone) throw new Error('Failed to undo learned rule');
  console.log('PASS: Feedback Learning Engine & Undo');

  // Test 4: Autonomy Progression (20 Unchanged Approvals)
  console.log('Testing 20-Approval Autonomy Threshold...');
  // Reset category for test
  autonomyTracker.triggerRegression('how_to', 'Test baseline reset');
  if (autonomyTracker.isAutonomous('how_to')) throw new Error('Should not be autonomous at start');

  for (let i = 1; i <= 19; i++) {
    const res = autonomyTracker.recordReview('how_to', true, 1.0);
    if (res.nowAutonomous) throw new Error(`Should not unlock autonomy at iteration ${i}`);
    if (res.consecutive !== i) throw new Error(`Expected consecutive ${i}, got ${res.consecutive}`);
  }

  // 20th approval!
  const finalApproval = autonomyTracker.recordReview('how_to', true, 1.0);
  if (!finalApproval.nowAutonomous) throw new Error('20th approval MUST unlock autonomy!');
  if (!autonomyTracker.isAutonomous('how_to')) throw new Error('isAutonomous must return true');
  console.log('PASS: Autonomy Unlocked on 20th Unchanged Review');

  // Test 5: Autonomy Loss / Safety Regression
  console.log('Testing Autonomy Loss & Regression Safety...');
  autonomyTracker.triggerRegression('how_to', 'Customer complained about inaccurate documentation URL');
  if (autonomyTracker.isAutonomous('how_to')) throw new Error('Autonomy must be revoked after regression');
  const state = autonomyTracker.getState('how_to');
  if (state.consecutive_approvals !== 0) throw new Error('Streak must be reset to 0');
  if (state.regressions_count < 1) throw new Error('Regressions count must increment');
  console.log('PASS: Autonomy Safety Regression Rollback');

  console.log('--- ALL TASK 2 TESTS PASSED! ---');
}

runTask2Tests().catch(err => {
  console.error('Task 2 Test Failed:', err);
  process.exit(1);
});
