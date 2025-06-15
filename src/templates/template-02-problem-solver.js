/**
 * Template 02: Problem Solver Approach
 * Use case: When addressing specific pain points
 */

export const template = {
  id: 'problem-solver',
  name: 'Problem Solver Approach',
  subject: 'Solving [PAIN_POINT] at [COMPANY_NAME]',
  body: `Hi [FIRST_NAME],

Noticed [COMPANY_NAME] might be dealing with [PAIN_POINT] — we've helped [SIMILAR_COMPANY_COUNT]+ companies in [INDUSTRY] tackle this exact challenge.

Our approach typically reduces [METRIC] by [IMPROVEMENT_PERCENTAGE]% in the first [TIMEFRAME].

Worth a brief conversation to see if there's a fit?

[SENDER_NAME]
[SENDER_TITLE]
[CONTACT_LINK]`,
  placeholders: [
    'FIRST_NAME',
    'COMPANY_NAME',
    'PAIN_POINT',
    'SIMILAR_COMPANY_COUNT',
    'INDUSTRY',
    'METRIC',
    'IMPROVEMENT_PERCENTAGE',
    'TIMEFRAME',
    'SENDER_NAME',
    'SENDER_TITLE',
    'CONTACT_LINK'
  ],
  category: 'solution',
  tone: 'consultative'
};

export default template;