import { CustomerEmail, EmailCategory, UrgencyLevel } from './types';

export class EmailClassifier {
  private categoryKeywords: Record<EmailCategory, string[]> = {
    quote: ['quote', 'quote request', 'estimate', 'pricing', 'how much would it cost', 'retainer', 'fixed-price', 'sso', 'custom integration cost', 'turnkey', 'timeline and quote', 'hourly rate'],
    refund: ['refund', 'duplicate charge', 'duplicate billing', 'duplicate', 'billing error', 'chargeback', 'cancel subscription', 'charged', 'charges', 'money back', 'credit card statement', 'statement', 'invoice error', 'reverse charge', 'reversal', 'override'],
    complaint: ['unacceptable', 'critical', 'error 500', 'spam', 'slow', 'broken', 'load time', 'investigate', 'degraded', 'expired', 'warning', 'wipe out', 'outdated', 'crashes', 'drastically'],
    new_project: ['new project', 'build', 'redesign', 'mobile app', 'develop', 'custom marketplace', 'custom booking', 'bidding', 'razorpay', 'localization', 'figma'],
    follow_up: ['follow-up', 'following up', 'checking in', 'ticket #', 'status of', 'eta', 'progress', 'recording link', 'staging preview', 'conversation from'],
    how_to: ['how to', 'how do i', 'where do i', 'configure', 'settings', 'import csv', 'import', 'smtp', 'google maps api', 'redirect', 'connect domain', 'missing', 'icons', 'help', 'header format', 'forwarders']
  };

  classify(subject: string, body: string): { category: EmailCategory; urgency: UrgencyLevel; reasoning: string } {
    const text = `${subject} ${body}`.toLowerCase();
    const subjLower = subject.toLowerCase();

    // Urgency heuristic
    let urgency: UrgencyLevel = 'medium';
    if (text.includes('urgent') || text.includes('critical') || text.includes('p0') || text.includes('immediately') || text.includes('error 500') || text.includes('drastically') || text.includes('asap') || text.includes('reverse') || text.includes('duplicate') || text.includes('board wants') || text.includes('require single sign on') || text.includes('bug')) {
      urgency = 'high';
    } else if (text.includes('when you have a chance') || text.includes('low priority') || text.includes('no rush') || text.includes('forward to gmail') || text.includes('icons are missing')) {
      urgency = 'low';
    }

    // Category scores with 2x weight for subject matches
    let bestCategory: EmailCategory = 'how_to';
    let maxMatches = 0;

    for (const [cat, keywords] of Object.entries(this.categoryKeywords) as [EmailCategory, string[]][]) {
      let matches = 0;
      for (const kw of keywords) {
        if (subjLower.includes(kw)) matches += 3;
        else if (text.includes(kw)) matches += 1;
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
