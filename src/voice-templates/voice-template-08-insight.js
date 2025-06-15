/**
 * Voice Template 08: Industry Insight
 * Use case: Share valuable industry insights and trends
 */

export const template = {
  id: 'industry-insight',
  name: 'Industry Insight',
  script: `Hi [FIRST_NAME], this is [CALLER_NAME] from [COMPANY_NAME].

I'm calling to share some important insights about trends in the [INDUSTRY] industry that could impact [CONTACT_COMPANY].

We've been analyzing market data and have identified some significant opportunities that most companies in your space are missing.

I'm an AI assistant, and this will be a quick call. The insights we've gathered could help [CONTACT_COMPANY] stay ahead of the competition and capitalize on emerging trends.

This information is particularly relevant for companies like yours that are positioned for growth.

If you'd like to receive our industry analysis and learn how these trends could benefit [CONTACT_COMPANY], press 1 and I'll have our team send you the full report along with a consultation link.

If you're not interested in industry insights and market intelligence, press 2 to opt out.

I think you'll find this information quite valuable for your strategic planning, [FIRST_NAME].`,
  placeholders: [
    'FIRST_NAME',
    'CALLER_NAME',
    'COMPANY_NAME',
    'CONTACT_COMPANY',
    'INDUSTRY'
  ],
  category: 'insight',
  tone: 'informative',
  duration: 'medium',
  approach: 'knowledge-based'
};

export default template;