/**
 * Voice Template 03: Social Proof
 * Use case: Leverage success stories and testimonials
 */

export const template = {
  id: 'social-proof',
  name: 'Social Proof',
  script: `Hello [FIRST_NAME], this is [CALLER_NAME] calling from [COMPANY_NAME].

I'm reaching out because we've recently helped several [INDUSTRY] companies similar to [CONTACT_COMPANY] achieve remarkable results.

For example, one of our clients increased their revenue by 40% within six months using our solutions.

I'm an AI assistant making this brief call to see if [CONTACT_COMPANY] might benefit from similar results.

Our proven track record with companies in your industry speaks for itself, and I'd love to share some specific case studies that might interest you.

If you'd like to hear more about how we've helped other [INDUSTRY] businesses succeed, press 1 and I'll arrange for our team to send you detailed case studies and schedule a brief consultation.

If you're not interested in learning about proven success strategies, press 2 to opt out of future calls.

Thank you for your time, [FIRST_NAME].`,
  placeholders: [
    'FIRST_NAME',
    'CALLER_NAME',
    'COMPANY_NAME',
    'CONTACT_COMPANY',
    'INDUSTRY'
  ],
  category: 'social-proof',
  tone: 'confident',
  duration: 'medium',
  approach: 'credibility-based'
};

export default template;