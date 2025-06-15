/**
 * Template 03: Social Proof Approach
 * Use case: Leveraging success stories and testimonials
 */

export const template = {
  id: 'social-proof',
  name: 'Social Proof Approach',
  subject: 'How [SUCCESS_COMPANY] achieved [RESULT]',
  body: `Hi [FIRST_NAME],

Just helped [SUCCESS_COMPANY] achieve [SPECIFIC_RESULT] in [TIMEFRAME] — thought this might interest you given [COMPANY_NAME]'s focus on [RELEVANT_AREA].

The approach we used could work well for [INDUSTRY] companies like yours.

Quick 15-minute call to share the details?

Best regards,
[SENDER_NAME]
[SENDER_TITLE]
[CONTACT_LINK]`,
  placeholders: [
    'FIRST_NAME',
    'SUCCESS_COMPANY',
    'SPECIFIC_RESULT',
    'TIMEFRAME',
    'COMPANY_NAME',
    'RELEVANT_AREA',
    'INDUSTRY',
    'SENDER_NAME',
    'SENDER_TITLE',
    'CONTACT_LINK'
  ],
  category: 'social-proof',
  tone: 'confident'
};

export default template;