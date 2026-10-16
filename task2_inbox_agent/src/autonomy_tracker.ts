import * as fs from 'fs';
import * as path from 'path';
import { EmailCategory, AutonomyState } from './types';

export class AutonomyTracker {
  private statePath: string;
  private states: Record<EmailCategory, AutonomyState>;
  private readonly AUTONOMY_THRESHOLD = 20;
  private readonly UNCHANGED_SIMILARITY_THRESHOLD = 0.95;

  constructor(statePath?: string) {
    this.statePath = statePath || path.resolve(__dirname, '../data/autonomy_state.json');
    this.states = this.initDefaultStates();
    this.load();
  }

  private initDefaultStates(): Record<EmailCategory, AutonomyState> {
    const categories: EmailCategory[] = ['how_to', 'new_project', 'refund', 'complaint', 'quote', 'follow_up'];
    const initial: Partial<Record<EmailCategory, AutonomyState>> = {};
    for (const cat of categories) {
      initial[cat] = {
        category: cat,
        consecutive_approvals: 0,
        threshold: this.AUTONOMY_THRESHOLD,
        is_autonomous: false,
        total_processed: 0,
        total_auto_sent: 0,
        regressions_count: 0,
        last_regression_reason: null,
        last_updated: new Date().toISOString()
      };
    }
    return initial as Record<EmailCategory, AutonomyState>;
  }

  private load(): void {
    if (fs.existsSync(this.statePath)) {
      try {
        const raw = fs.readFileSync(this.statePath, 'utf-8');
        const loaded = JSON.parse(raw);
        this.states = { ...this.initDefaultStates(), ...loaded };
      } catch (err) {
        console.error(`[AutonomyTracker] Failed to read ${this.statePath}:`, err);
      }
    }
  }

  private save(): void {
    const dir = path.dirname(this.statePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(this.statePath, JSON.stringify(this.states, null, 2), 'utf-8');
  }

  getState(category: EmailCategory): AutonomyState {
    return this.states[category];
  }

  getAllStates(): Record<EmailCategory, AutonomyState> {
    return { ...this.states };
  }

  isAutonomous(category: EmailCategory): boolean {
    return this.states[category]?.is_autonomous ?? false;
  }

  recordReview(category: EmailCategory, isUnchanged: boolean, similarity: number): {
    nowAutonomous: boolean;
    consecutive: number;
    wasReset: boolean;
  } {
    const state = this.states[category];
    state.total_processed += 1;
    state.last_updated = new Date().toISOString();

    const qualifiesAsUnchanged = isUnchanged || similarity >= this.UNCHANGED_SIMILARITY_THRESHOLD;

    if (qualifiesAsUnchanged) {
      state.consecutive_approvals += 1;
      let nowAutonomous = false;
      if (state.consecutive_approvals >= this.AUTONOMY_THRESHOLD && !state.is_autonomous) {
        state.is_autonomous = true;
        nowAutonomous = true;
      }
      this.save();
      return { nowAutonomous, consecutive: state.consecutive_approvals, wasReset: false };
    } else {
      // Draft was edited or modified by human -> reset streak
      const hadAutonomous = state.is_autonomous;
      state.consecutive_approvals = 0;
      let wasReset = false;
      if (hadAutonomous) {
        state.is_autonomous = false;
        state.regressions_count += 1;
        state.last_regression_reason = `Human made significant edits (similarity: ${similarity}). Freedom revoked.`;
        wasReset = true;
      }
      this.save();
      return { nowAutonomous: false, consecutive: 0, wasReset };
    }
  }

  recordAutoSend(category: EmailCategory): void {
    const state = this.states[category];
    state.total_auto_sent += 1;
    state.last_updated = new Date().toISOString();
    this.save();
  }

  triggerRegression(category: EmailCategory, reason: string): void {
    const state = this.states[category];
    state.is_autonomous = false;
    state.consecutive_approvals = 0;
    state.regressions_count += 1;
    state.last_regression_reason = reason;
    state.last_updated = new Date().toISOString();
    this.save();
  }
}
