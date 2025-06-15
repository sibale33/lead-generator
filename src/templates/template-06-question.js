/**
 * Template 06: Question-Based Approach
 * Use case: Engaging with thought-provoking questions
 */

export const template = {
  id: 'question',
  name: 'Question-Based Approach',
  subject: 'Quick question about [COMPANY_NAME]\'s [FOCUS_AREA]',
  body: `Hi [FIRST_NAME],

Quick question: How is [COMPANY_NAME] currently handling [SPECIFIC_CHALLENGE]?

Most [INDUSTRY] companies we work with struggle with [COMMON_ISSUE], but I'm curious if you've found a different approach.

If you're open to it, I'd love to share what's working for similar companies and get your take.

Worth a brief chat?

[SENDER_NAME]
[CONTACT_LINK]`,
  placeholders: [
    'FIRST_NAME',
    'COMPANY_NAME',
    'FOCUS_AREA',
    'SPECIFIC_CHALLENGE',
    'INDUSTRY',
    'COMMON_ISSUE',
    'SENDER_NAME',
    'CONTACT_LINK'
  ],
  category: 'engagement',
  tone: 'conversational'
};

export default template;