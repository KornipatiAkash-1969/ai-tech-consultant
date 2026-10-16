export type EmailCategory = 
  | 'how_to' 
  | 'new_project' 
  | 'refund' 
  | 'complaint' 
  | 'quote' 
  | 'follow_up';

export type UrgencyLevel = 'low' | 'medium' | 'high';

export interface CustomerEmail {
  id: string;
  sender: string;
  sender_name: string;
  subject: string;
  body: string;
  category: EmailCategory;
  urgency: UrgencyLevel;
  received_at: string;
  status?: 'pending' | 'drafted' | 'approved' | 'edited' | 'auto_sent';
}

export interface Task1SearchResult {
  article_id: string;
  title: string;
  url: string;
  category: string;
  folder: string;
  snippet: string;
  score: number;
}

export interface Task1ChatResponse {
  answer: string;
  confidence_score: number;
  sources: Array<{
    title: string;
    url: string;
    category: string;
    folder: string;
    relevance_score: number;
  }>;
  escalated: boolean;
  escalation_id?: string;
}

export interface DraftReply {
  id: string;
  email_id: string;
  category: EmailCategory;
  recipient_email: string;
  recipient_name: string;
  subject: string;
  draft_text: string;
  facts_used: string[];
  source_articles: string[];
  confidence_score: number;
  company_voice: string;
  auto_sent: boolean;
  created_at: string;
}

export interface HumanReviewAction {
  email_id: string;
  action: 'send_as_is' | 'edit_and_send' | 'reject_and_rewrite';
  edited_text?: string;
  reviewer_name: string;
  review_notes?: string;
}

export interface LearnedPreference {
  id: string;
  category: EmailCategory;
  rule_text: string;
  pattern_trigger: string;
  source_email_id: string;
  similarity_score: number;
  created_at: string;
  active: boolean;
  times_applied: number;
}

export interface AutonomyState {
  category: EmailCategory;
  consecutive_approvals: number;
  threshold: number; // 20
  is_autonomous: boolean;
  total_processed: number;
  total_auto_sent: number;
  regressions_count: number;
  last_regression_reason: string | null;
  last_updated: string;
}

export interface DiffAnalysis {
  similarity: number;
  has_significant_changes: boolean;
  added_facts: string[];
  removed_phrasing: string[];
  inferred_rule: string | null;
}
