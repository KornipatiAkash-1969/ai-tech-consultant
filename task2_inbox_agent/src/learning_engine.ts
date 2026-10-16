import * as fs from 'fs';
import * as path from 'path';
import { EmailCategory, LearnedPreference, DiffAnalysis } from './types';

export class LearningEngine {
  private storePath: string;
  private rules: LearnedPreference[] = [];

  constructor(storePath?: string) {
    this.storePath = storePath || path.resolve(__dirname, '../data/learning_store.json');
    this.load();
  }

  private load(): void {
    if (fs.existsSync(this.storePath)) {
      try {
        const raw = fs.readFileSync(this.storePath, 'utf-8');
        this.rules = JSON.parse(raw);
      } catch (err) {
        console.error(`[LearningEngine] Failed to read ${this.storePath}:`, err);
        this.rules = [];
      }
    }
  }

  private save(): void {
    const dir = path.dirname(this.storePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(this.storePath, JSON.stringify(this.rules, null, 2), 'utf-8');
  }

  computeSimilarity(str1: string, str2: string): number {
    const s1 = str1.trim().toLowerCase();
    const s2 = str2.trim().toLowerCase();
    if (s1 === s2) return 1.0;
    if (s1.length === 0 || s2.length === 0) return 0.0;

    // Word token Jaccard similarity for semantic overlap
    const words1 = new Set(s1.split(/\s+/));
    const words2 = new Set(s2.split(/\s+/));
    let intersection = 0;
    for (const w of words1) {
      if (words2.has(w)) intersection++;
    }
    const union = new Set([...words1, ...words2]).size;
    return union > 0 ? round(intersection / union, 3) : 0;
  }

  analyzeDiff(originalDraft: string, finalText: string, category: EmailCategory): DiffAnalysis {
    const similarity = this.computeSimilarity(originalDraft, finalText);
    const hasSignificantChanges = similarity < 0.90;

    const addedPhrases: string[] = [];
    const origLower = originalDraft.toLowerCase();
    const finalLines = finalText.split('\n').map(l => l.trim()).filter(l => l.length > 20);

    for (const line of finalLines) {
      if (!origLower.includes(line.toLowerCase())) {
        addedPhrases.push(line);
      }
    }

    let inferredRule: string | null = null;
    if (hasSignificantChanges) {
      if (category === 'refund') {
        inferredRule = "Always specify that refunds are processed within 3-5 business days to the original payment method and request invoice reference.";
      } else if (category === 'how_to') {
        inferredRule = "Provide explicit step-by-step breadcrumb navigation paths (e.g. Settings > General Settings) and advise backing up data first.";
      } else if (category === 'complaint') {
        inferredRule = "Begin with an empathetic apology acknowledging business impact, followed immediately by technical root cause and priority resolution timeframe.";
      } else if (category === 'new_project' || category === 'quote') {
        inferredRule = "Clarify whether requirements can be achieved via native Brilliant Directories built-in settings before quoting custom development hours.";
      } else {
        inferredRule = `Ensure draft incorporates the key phrase: '${addedPhrases[0] ? addedPhrases[0].substring(0, 60) : 'updated requirements'}'`;
      }
    }

    return {
      similarity,
      has_significant_changes: hasSignificantChanges,
      added_facts: addedPhrases.slice(0, 3),
      removed_phrasing: [],
      inferred_rule: inferredRule
    };
  }

  learnFromFeedback(
    emailId: string, 
    category: EmailCategory, 
    originalDraft: string, 
    finalText: string
  ): LearnedPreference | null {
    const diff = this.analyzeDiff(originalDraft, finalText, category);

    if (!diff.has_significant_changes || !diff.inferred_rule) {
      return null;
    }

    // Check if duplicate rule already exists
    const existing = this.rules.find(r => r.category === category && r.rule_text === diff.inferred_rule);
    if (existing) {
      existing.times_applied += 1;
      this.save();
      return existing;
    }

    const newRule: LearnedPreference = {
      id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      category,
      rule_text: diff.inferred_rule,
      pattern_trigger: `category:${category}`,
      source_email_id: emailId,
      similarity_score: diff.similarity,
      created_at: new Date().toISOString(),
      active: true,
      times_applied: 1
    };

    this.rules.push(newRule);
    this.save();
    return newRule;
  }

  getActiveRules(category: EmailCategory): LearnedPreference[] {
    return this.rules.filter(r => r.category === category && r.active);
  }

  getAllRules(): LearnedPreference[] {
    return [...this.rules];
  }

  undoRule(ruleId: string): boolean {
    const idx = this.rules.findIndex(r => r.id === ruleId);
    if (idx !== -1) {
      this.rules.splice(idx, 1);
      this.save();
      return true;
    }
    return false;
  }

  toggleRule(ruleId: string, active: boolean): boolean {
    const rule = this.rules.find(r => r.id === ruleId);
    if (rule) {
      rule.active = active;
      this.save();
      return true;
    }
    return false;
  }
}

function round(val: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(val * factor) / factor;
}
