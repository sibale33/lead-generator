/**
 * Voice Template 04: Curiosity Hook
 * Use case: Generate curiosity and intrigue
 */

export const template = {
  id: 'curiosity-hook',
  name: 'Curiosity Hook',
  script: `Hi [FIRST_NAME], this is [CALLER_NAME] from [COMPANY_NAME].

I have some interesting information about [CONTACT_COMPANY] that I think you'll want to hear.

We've been researching companies in the [INDUSTRY] space, and [CONTACT_COMPANY] caught our attention for some very specific reasons.

I'm an AI assistant, and this call will be quick. What I discovered could potentially save [CONTACT_COMPANY] significant time and money while opening up new opportunities.

I can't go into all the details in this brief call, but if you're curious about what we found and how it could benefit your business, press 1 and I'll have our team send you the full analysis along with a meeting link.

If you're not interested in learning what we discovered about opportunities in your market, press 2 to opt out.

I think you'll find this information quite valuable, [FIRST_NAME].`,
  placeholders: [
    'FIRST_NAME',
    'CALLER_NAME',
    'COMPANY_NAME',
    'CONTACT_COMPANY',
    'INDUSTRY'
  ],
  category: 'curiosity',
  tone: 'intriguing',
  duration: 'medium',
  approach: 'mystery-based'
};

export default template;