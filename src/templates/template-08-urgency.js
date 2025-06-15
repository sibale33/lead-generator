/**
 * Template 08: Urgency/Scarcity Approach
 * Use case: Creating time-sensitive opportunities
 */

export const template = {
  id: 'urgency',
  name: 'Urgency/Scarcity Approach',
  subject: 'Limited spots: [OPPORTUNITY] for [INDUSTRY] companies',
  body: `Hi [FIRST_NAME],

We're opening [LIMITED_SPOTS] spots for our [PROGRAM_NAME] specifically designed for [INDUSTRY] companies like [COMPANY_NAME].

The program helps companies [MAIN_BENEFIT] in [TIMEFRAME], and we're only accepting applications until [DEADLINE].

Given [COMPANY_NAME]'s focus on [RELEVANT_AREA], I think you'd be a great fit.

Interested in learning more? We can chat for 10 minutes today or tomorrow.

[SENDER_NAME]
[SENDER_TITLE]
[CONTACT_LINK]`,
  placeholders: [
    'FIRST_NAME',
    'LIMITED_SPOTS',
    'PROGRAM_NAME',
    'INDUSTRY',
    'COMPANY_NAME',
    'MAIN_BENEFIT',
    'TIMEFRAME',
    'DEADLINE',
    'RELEVANT_AREA',
    'SENDER_NAME',
    'SENDER_TITLE',
    'CONTACT_LINK'
  ],
  category: 'urgency',
  tone: 'urgent'
};

export default template;