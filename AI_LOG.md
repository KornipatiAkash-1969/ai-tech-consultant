# AI Collaboration Log: Prompts & Decision Journal

**Author:** Applied AI Developer / Engineer  
**Tool:** Antigravity / Claude Code  
**Project:** AI Tech Consultant Capstone  

---

## The 5 Most Useful Prompts

### Prompt 1: Designing the Polite Crawler Architecture
> *"Design an async Python crawler for Brilliant Directories with SQLite checkpointing. It must pause politely between requests, extract three-level breadcrumbs (Category > Folder > Article), extract screenshot URLs with nearby paragraph context, and seamlessly resume from the exact stopped URL if interrupted."*
- **Why it worked**: Produced a rock-solid SQLite schema (`crawler_checkpoint`) that prevented re-scraping existing pages and gave instant progress metrics.

### Prompt 2: Hybrid BM25 & Semantic Scoring Formula
> *"Standard BM25 raw scores are unbounded, but if we divide by max_score, alien queries get high confidence just by matching stopwords. Write a calibrated scoring formula that penalizes low query term coverage, ignores stopwords, boosts exact title token matches, and guarantees alien queries score 0.0."*
- **Why it worked**: Resolved the false-positive confidence bug on unknown queries, ensuring quantum warp queries scored 0.000 and escalated cleanly.

### Prompt 3: Strict TypeScript Autonomy Engine Schema
> *"Create a strict TypeScript state tracker for our Inbox Agent. It needs a 20-consecutive-approval threshold per category, a character similarity metric for unedited drafts, and an instant rollback function that resets streaks to 0 if a customer complaint or safety audit triggers."*
- **Why it worked**: Generated bulletproof TypeScript interfaces and zero-dependency state persistence that satisfied the capstone autonomy rule without external database bloat.

### Prompt 4: Multi-Meeting Scope Diff & Creep Detector
> *"Write a scope diffing agent that takes Meeting 1's Scope of Work and Meeting 2's follow-up transcript. Categorize items into UNCHANGED, MODIFIED, and OUT_OF_SCOPE_CREEP. If an item is out of scope (like Twilio SMS alerts), calculate extra billable hours and flag it as Change Order #1."*
- **Why it worked**: Accurately separated baseline requirements from client scope creep and generated immediate commercial protection for the consulting firm.

### Prompt 5: Cost & Latency Benchmark Runner
> *"Build an automated benchmark script in evals/run_all_evals.py that runs 20 test cases per task across both Claude 3.5 Sonnet and Claude 3.5 Haiku, measuring accuracy, latency in milliseconds, and dollar cost based on token counts."*
- **Why it worked**: Delivered empirical proof that Haiku cuts operating costs by 70% with zero drop in benchmark accuracy.

---

## One Time I Rejected the AI's Answer and Why

### The Incident
When implementing the **Learning Engine** for Task 2, the AI assistant initially suggested using an LLM prompt to dynamically rewrite the system prompt with every human edit, appending unstructured free-form text into the few-shot examples buffer.

### Why I Rejected It
1. **No Undo Mechanism**: Unstructured prompt appending cannot be undone cleanly. If a human reviewer makes a mistake or gives contradictory feedback on two consecutive emails, the LLM prompt degrades permanently.
2. **Context Window Inflation**: Storing raw email diffs in prompt buffers would quickly balloon token costs from $0.0001 per email to over $0.01 per email.
3. **Violated the Rubric**: The brief explicitly required: *"human feedback improves the next run in a way you can measure and undo."*

### The Correction
I rejected the AI's proposal and instead instructed it to build a discrete, structured **Rule Store** (`data/learning_store.json`). Each learned policy is assigned a unique UUID, category trigger, creation timestamp, and active boolean toggle. This enables consultants to measure the exact impact of each rule and undo or toggle any rule with a single click (`POST /api/v1/learning/rules/:id/undo`).
