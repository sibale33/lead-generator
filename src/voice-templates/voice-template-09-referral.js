/**
 * Voice Template 09: Referral Based
 * Use case: Leverage referrals and connections
 */

export const template = {
  id: 'referral-based',
  name: 'Referral Based',
  script: `Hello [FIRST_NAME], this is [CALLER_NAME] from [COMPANY_NAME].

I was referred to you by one of our clients who thought [CONTACT_COMPANY] would be a perfect fit for our services.

They mentioned that you're always looking for ways to improve your [INDUSTRY] operations, and that's exactly what we specialize in.

I'm an AI assistant making this brief call because our mutual connection was so enthusiastic about introducing us.

The companies that have referred us typically see significant improvements in their business performance within the first few months.

If you'd like to learn more about why our clients are so eager to refer us to companies like [CONTACT_COMPANY], press 1 and I'll have our team reach out with more details and a meeting link.

If you're not interested in exploring opportunities that come highly recommended, press 2 to opt out.

I appreciate the referral and hope we can help [CONTACT_COMPANY] achieve similar success, [FIRST_NAME].`,
  placeholders: [
    'FIRST_NAME',
    'CALLER_NAME',
    'COMPANY_NAME',
    'CONTACT_COMPANY',
    'INDUSTRY'
  ],
  category: 'referral',
  tone: 'warm',
  duration: 'medium',
  approach: 'trust-based'
};

export default template;