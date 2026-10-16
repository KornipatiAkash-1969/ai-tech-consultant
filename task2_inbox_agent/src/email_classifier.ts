import { CustomerEmail, EmailCategory, UrgencyLevel } from './types';

export class EmailClassifier {
  private categoryKeywords: Record<EmailCategory, string[]> = {
    refund: ['refund', 'duplicate charge', 'billing error', 'chargeback', 'cancel subscription', 'charged', 'money back', 'credit card statement', 'invoice error'],
    complaint: ['unacceptable', 'critical', 'error 500', 'spam', 'slow', 'broken', 'load time', 'investigate', 'degraded', 'expired', 'warning', 'wipe out'],
    quote: ['quote', 'estimate', 'pricing', 'how much would it cost', 'retainer', 'fixed-price', 'sso', 'custom integration cost', 'turnkey'],
    new_project: ['new project', 'build', 'redesign', 'mobile app', 'develop', 'custom marketplace', 'custom booking', 'bidding', 'razorpay', 'localization'],
    follow_up: ['follow-up', 'following up', 'checking in', 'ticket #', 'status of', 'eta', 'progress', 'recording link', 'staging preview'],
    how_to: ['how to', 'how do i', 'where do i', 'configure', 'settings', 'import csv', 'smtp', 'google maps api', 'redirect', 'connect domain']
  };

  classify(subject: string, body: string): { category: EmailCategory; urgency: UrgencyLevel; reasoning: string } {
    const text = `${subject} ${body}`.toLowerCase();

    // Urgency heuristic
    let urgency: UrgencyLevel = 'medium';
    if (text.includes('urgent') || text.includes('critical') || text.includes('p0') || text.includes('immediately') || text.includes('error 500')) {
      urgency = 'high';
    } else if (text.includes('when you have a chance') || text.includes('low priority') || text.includes('no rush')) {
      urgency = 'low';
    }

    // Category scores
    let bestCategory: EmailCategory = 'how_to';
    let maxMatches = -1;

    for (const [cat, keywords] of Object.entries(this.categoryKeywords) as [EmailCategory, string[]][]) {
      let matches = 0;
      for (const kw of keywords) {
        if (text.includes(kw)) {
          matches += 1;
        }
      }
      if (matches > maxMatches) {
        maxMatches = matches;
        bestCategory = cat;
      }
    }

    return {
      category: bestCategory,
      urgency,
      reasoning: `Matched ${maxMatches} keyword triggers for category '${bestCategory}' with urgency '${urgency}'.`
    };
  }

  enrichEmail(email: CustomerEmail): CustomerEmail {
    const classified = this.classify(email.subject, email.body);
    return {
      ...email,
      category: email.category || classified.category,
      urgency: email.urgency || classified.urgency
    };
  }
}
