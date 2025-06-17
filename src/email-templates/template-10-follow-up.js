/**
 * Template 10: Follow-up/Re-engagement
 * Use case: Following up on previous outreach
 */

export const template = {
  id: 'follow-up',
  name: 'Follow-up/Re-engagement',
  subject: 'Following up: [ORIGINAL_TOPIC]',
  body: `Hi [FIRST_NAME],

Following up on my message about [ORIGINAL_TOPIC] for [COMPANY_NAME].

I know you're busy, so I'll keep this brief: we just helped [RECENT_SUCCESS_COMPANY] achieve [RECENT_RESULT], and the approach could work well for your team too.

If timing isn't right now, no worries — but if you'd like to explore this, I'm happy to share a quick overview.

Just reply with "interested" or "not now" and I'll respect your preference.

Thanks,
[SENDER_NAME]
[CONTACT_LINK]`,
  placeholders: [
    'FIRST_NAME',
    'ORIGINAL_TOPIC',
    'COMPANY_NAME',
    'RECENT_SUCCESS_COMPANY',
    'RECENT_RESULT',
    'SENDER_NAME',
    'CONTACT_LINK'
  ],
  category: 'follow-up',
  tone: 'respectful'
};

export default template;