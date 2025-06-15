/**
 * Voice Template 05: Direct Approach
 * Use case: Straightforward, no-nonsense approach
 */

export const template = {
  id: 'direct-approach',
  name: 'Direct Approach',
  script: `Hello [FIRST_NAME], this is [CALLER_NAME] from [COMPANY_NAME].

I'll be direct with you. We help [INDUSTRY] companies like [CONTACT_COMPANY] increase their profits and reduce operational costs.

I'm an AI assistant making this brief call because our solutions typically deliver measurable results within 90 days.

If you're interested in learning how we can help [CONTACT_COMPANY] improve its bottom line, press 1 and I'll have our team send you specific information and a meeting link.

If you're not interested in improving your business efficiency and profitability, press 2 to be removed from our list.

That's it, [FIRST_NAME]. Simple and straightforward.`,
  placeholders: [
    'FIRST_NAME',
    'CALLER_NAME',
    'COMPANY_NAME',
    'CONTACT_COMPANY',
    'INDUSTRY'
  ],
  category: 'direct',
  tone: 'straightforward',
  duration: 'short',
  approach: 'no-nonsense'
};

export default template;