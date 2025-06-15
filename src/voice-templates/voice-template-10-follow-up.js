/**
 * Voice Template 10: Follow-up
 * Use case: Follow-up on previous interactions or inquiries
 */

export const template = {
  id: 'follow-up',
  name: 'Follow-up',
  script: `Hi [FIRST_NAME], this is [CALLER_NAME] from [COMPANY_NAME].

I'm following up because [CONTACT_COMPANY] was identified as a company that could benefit significantly from our services.

We've had some great conversations with other [INDUSTRY] companies recently, and I wanted to make sure we didn't miss the opportunity to connect with you.

I'm an AI assistant, and this will be a brief call. Many companies in your industry have expressed interest in learning more about how we can help them grow and optimize their operations.

I don't want [CONTACT_COMPANY] to miss out on the opportunities that your competitors might already be exploring.

If you'd like to learn more about what we can do for [CONTACT_COMPANY] and why other businesses in your space are interested, press 1 and I'll have our team reach out with more information and a convenient meeting time.

If you're not interested in exploring new business opportunities, press 2 and we'll respect your decision.

Thanks for your time, [FIRST_NAME]. I hope we can help [CONTACT_COMPANY] achieve its goals.`,
  placeholders: [
    'FIRST_NAME',
    'CALLER_NAME',
    'COMPANY_NAME',
    'CONTACT_COMPANY',
    'INDUSTRY'
  ],
  category: 'follow-up',
  tone: 'respectful',
  duration: 'medium',
  approach: 'persistence-based'
};

export default template;