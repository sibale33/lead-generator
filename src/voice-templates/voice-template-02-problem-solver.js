/**
 * Voice Template 02: Problem Solver
 * Use case: Focus on solving specific business problems
 */

export const template = {
  id: 'problem-solver',
  name: 'Problem Solver',
  script: `Hi [FIRST_NAME], this is [CALLER_NAME] from [COMPANY_NAME].

I'm calling because I noticed [CONTACT_COMPANY] might be facing some of the same challenges we've helped other [INDUSTRY] companies overcome.

Specifically, issues around operational efficiency and cost management that are affecting growth.

I'm an AI assistant, and this call will be brief. We've developed solutions that have helped similar companies reduce costs by up to 30% while improving productivity.

If you'd like to learn more about how we can help [CONTACT_COMPANY] solve these challenges, press 1 and I'll send you a link to schedule a quick conversation with our team.

If you're not interested in hearing about solutions for your business, press 2 to be removed from our calling list.

Otherwise, we may reach out again at a more convenient time.

Thanks for listening, [FIRST_NAME].`,
  placeholders: [
    'FIRST_NAME',
    'CALLER_NAME',
    'COMPANY_NAME',
    'CONTACT_COMPANY',
    'INDUSTRY'
  ],
  category: 'solution',
  tone: 'consultative',
  duration: 'medium',
  approach: 'problem-focused'
};

export default template;