import { CustomerEmail, DraftReply } from './types';
import { Task1Client } from './task1_client';
import { LearningEngine } from './learning_engine';
import { AutonomyTracker } from './autonomy_tracker';

export class DraftGenerator {
  private task1Client: Task1Client;
  private learningEngine: LearningEngine;
  private autonomyTracker: AutonomyTracker;

  constructor(
    task1Client: Task1Client,
    learningEngine: LearningEngine,
    autonomyTracker: AutonomyTracker
  ) {
    this.task1Client = task1Client;
    this.learningEngine = learningEngine;
    this.autonomyTracker = autonomyTracker;
  }

  async generateDraft(email: CustomerEmail): Promise<DraftReply> {
    // 1. Fetch factual grounding from Task 1 API
    const searchQuery = `${email.subject} ${email.body.substring(0, 150)}`;
    const kbResults = await this.task1Client.search(searchQuery, 2);

    // 2. Fetch active learned preferences for this category
    const activeRules = this.learningEngine.getActiveRules(email.category);

    // 3. Compose facts and citations
    const factsUsed: string[] = [];
    const sourceArticles: string[] = [];

    for (const r of kbResults) {
      factsUsed.push(`${r.title} (${r.category} > ${r.folder}): ${r.snippet}`);
      sourceArticles.push(`[${r.title}](${r.url})`);
    }

    // 4. Generate draft in company voice
    const draftText = this.composeDraftText(email, kbResults, activeRules);

    // 5. Check if autonomy mode is active
    const isAuto = this.autonomyTracker.isAutonomous(email.category);
    if (isAuto) {
      this.autonomyTracker.recordAutoSend(email.category);
    }

    return {
      id: `draft_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      email_id: email.id,
      category: email.category,
      recipient_email: email.sender,
      recipient_name: email.sender_name || 'Customer',
      subject: `Re: ${email.subject}`,
      draft_text: draftText,
      facts_used: factsUsed,
      source_articles: sourceArticles,
      confidence_score: kbResults.length > 0 ? kbResults[0].score : 0.60,
      company_voice: "Professional, Empathetic, Actionable, Factual",
      auto_sent: isAuto,
      created_at: new Date().toISOString()
    };
  }

  private composeDraftText(
    email: CustomerEmail, 
    kbResults: any[], 
    rules: any[]
  ): string {
    const greetingName = email.sender_name ? email.sender_name.split(' ')[0] : 'there';
    const lines: string[] = [];

    lines.push(`Hi ${greetingName},`);
    lines.push('');

    switch (email.category) {
      case 'how_to': {
        lines.push(`Thank you for reaching out to technical support. Here are the steps to address your question:`);
        lines.push('');
        if (kbResults.length > 0) {
          const top = kbResults[0];
          lines.push(`Under your Brilliant Directories admin panel, navigate to **${top.category} > ${top.folder}** and open **${top.title}**.`);
          lines.push(top.snippet);
          lines.push('');
          lines.push(`Official Documentation Guide: ${top.url}`);
        } else {
          lines.push(`You can configure this setting directly inside your Brilliant Directories dashboard under Settings > General Settings.`);
        }
        break;
      }

      case 'refund': {
        lines.push(`Thank you for contacting our billing department. We understand you are requesting a refund regarding your recent charge.`);
        lines.push('');
        lines.push(`To verify this on our payment gateway, could you please confirm your latest Invoice # or the last 4 digits of the card charged?`);
        lines.push(`Once verified, our team will process the refund to your original payment method within 3 to 5 business days.`);
        break;
      }

      case 'complaint': {
        lines.push(`We sincerely apologize for the frustration and inconvenience this issue has caused to your directory operations.`);
        lines.push('');
        lines.push(`Our senior technical engineering team has logged this incident with high priority. We are actively investigating the root cause and deploying a resolution.`);
        if (kbResults.length > 0) {
          lines.push(`In the interim, please verify that your settings align with: ${kbResults[0].title} (${kbResults[0].url}).`);
        }
        lines.push(`We will follow up with you directly within the next 2 hours with an update.`);
        break;
      }

      case 'new_project': {
        lines.push(`Thank you for sharing your project vision with us! That sounds like an exciting milestone for your directory platform.`);
        lines.push('');
        lines.push(`Our technical consulting team has reviewed your request. Many directory features can be achieved using native Brilliant Directories platform settings or built-in add-ons, which saves you significant custom development costs.`);
        lines.push(`For the custom engineering components, we would be delighted to schedule a 30-minute discovery scoping call to define the exact technical deliverables.`);
        break;
      }

      case 'quote': {
        lines.push(`Thank you for requesting an estimate. We specialize in scaling and customizing Brilliant Directories platforms.`);
        lines.push('');
        lines.push(`We are preparing a preliminary Scope of Work (SOW) with itemized developer hour breakdowns. To ensure our estimate is exact, we first evaluate which requirements are supported natively by platform add-ons versus custom API integrations.`);
        lines.push(`Expect our formal proposal and milestone timeline in your inbox shortly.`);
        break;
      }

      case 'follow_up': {
        lines.push(`Thank you for following up with us. We appreciate your patience while our team works through your ticket.`);
        lines.push('');
        lines.push(`Our developers are currently reviewing the progress on your request and ensuring all quality assurance checks pass on staging.`);
        lines.push(`We will send you a direct link and confirmation as soon as the deployment is complete.`);
        break;
      }
    }

    // Apply learned preference rules if active
    if (rules.length > 0) {
      lines.push('');
      for (const rule of rules) {
        lines.push(`Note: ${rule.rule_text}`);
      }
    }

    lines.push('');
    lines.push(`Best regards,`);
    lines.push(`AI Tech Support Team`);
    lines.push(`BusinessLabs Technical Operations`);

    return lines.join('\n');
  }
}
