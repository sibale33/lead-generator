/**
 * Voice Template 07: Urgency
 * Use case: Create sense of urgency and limited time
 */

export const template = {
  id: 'urgency',
  name: 'Urgency',
  script: `Hello [FIRST_NAME], this is [CALLER_NAME] from [COMPANY_NAME].

I'm calling with time-sensitive information that could significantly impact [CONTACT_COMPANY].

We're currently working with a limited number of [INDUSTRY] companies this quarter, and [CONTACT_COMPANY] fits our ideal client profile perfectly.

I'm an AI assistant making this brief call because this opportunity won't be available much longer. We're only accepting three more clients before the end of the month.

The companies we're working with are seeing immediate results, but we need to move quickly to secure your spot.

If you want to learn more about this limited opportunity and how it can benefit [CONTACT_COMPANY], press 1 now and I'll have our team prioritize your consultation.

If you're not interested in time-sensitive business opportunities, press 2 to opt out.

Don't let this opportunity pass by, [FIRST_NAME].`,
  placeholders: [
    'FIRST_NAME',
    'CALLER_NAME',
    'COMPANY_NAME',
    'CONTACT_COMPANY',
    'INDUSTRY'
  ],
  category: 'urgency',
  tone: 'urgent',
  duration: 'medium',
  approach: 'scarcity-based'
};

export default template;