/* Ask Ethicare V1 — resource map only.

   THE SYSTEM PROMPT IS NOT IN THIS FILE, AND MUST NOT COME BACK.
   It lives in netlify/functions/ask-ethicare.js and never reaches the browser.

   It used to be here, and the browser sent it to the function on every request — so the
   function obeyed whatever prompt it was given. Anyone could POST their own and use the
   endpoint as a free LLM billed to Ethicare, with every guardrail (no salary figures against
   live roles, no employer named but Health New Zealand, no advice-giving) simply omitted.
   The client now sends messages and nothing else.

   What stays here is only what the BROWSER needs: the id → title/description/URL map used to
   render the action cards. The function keeps its own list of valid ids. If the two ever drift,
   an id the browser does not recognise is dropped when the cards render — degradation, not
   breakage — but they should be changed together. */
window.ASK_ETHICARE_KB = {
  resources: {
    pathway_checker: { t: 'Registration pathway checker', d: 'Your likely route to registration, in two minutes', u: '/pathway-checker' },
    move_planner: { t: 'Ethicare Move', d: 'The whole move, sequenced — what to do and when', u: '/move' },
    compare_countries: { t: 'Australia vs New Zealand', d: 'Pay, pace and lifestyle, side by side', u: '/guides/australia-vs-new-zealand' },
    cost_calculator: { t: 'What the move will cost', d: 'Build a realistic figure for your own move', u: '/cost-calculator' },
    before_you_accept: { t: 'Before you accept an offer', d: 'What to check in a contract before you sign', u: '/before-you-accept' },
    nz_destinations: { t: 'NZ destination guides', d: 'Costs, suburbs, hospitals, city by city', u: '/destinations/' },
    au_destinations: { t: 'AU destination guides', d: 'Eight states and territories, compared honestly', u: '/destinations/australia' },
    jobs: { t: 'Live roles', d: 'Current Ethicare vacancies in both countries', u: '/jobs/' },
    professions: { t: 'Find your profession', d: 'Registration, work and indicative pay for your role', u: '/jobs/professions' },
    nz_registration: { t: 'Registering in New Zealand', d: 'The full registration guide', u: '/guides/new-zealand-registration' },
    au_registration: { t: 'Registering in Australia', d: 'Ahpra, the national boards, and where skills assessment fits', u: '/guides/australia-registration' },
    nz_visa: { t: 'New Zealand visas', d: 'Options for you and everyone moving with you', u: '/guides/new-zealand-visa' },
    au_visa: { t: 'Australian visas', d: 'Work and family routes, in plain English', u: '/guides/australia-visa' },
    nz_family: { t: 'Moving to NZ with your family', d: 'Schools, childcare, partners, the first months', u: '/guides/new-zealand-family' },
    au_family: { t: 'Moving to AU with your family', d: 'Schools, childcare, partners, the first months', u: '/guides/australia-family' },
    nz_healthcare: { t: 'How NZ healthcare works', d: 'The system you would be joining', u: '/guides/new-zealand-healthcare' },
    au_healthcare: { t: 'How AU healthcare works', d: 'Medicare, public and private, the PBS', u: '/guides/australia-healthcare' },
    nz_practice: { t: 'Practising in New Zealand', d: 'Culture, expectations, what feels different', u: '/guides/new-zealand-practice' },
    au_practice: { t: 'Practising in Australia', d: 'Culture, expectations, what feels different', u: '/guides/australia-practice' },
    nz_salary: { t: 'Pay in New Zealand', d: 'What the money actually looks like, explained', u: '/guides/new-zealand-salary' },
    au_salary: { t: 'Pay in Australia', d: 'What the money actually looks like, explained', u: '/guides/australia-salary' },
    pay_register: { t: 'NZ pay agreements', d: 'The collective agreements that set public pay', u: '/guides/new-zealand-pay-agreements' },
    nz_relocation: { t: 'Moving to New Zealand, step by step', d: 'The whole journey in six stages', u: '/guides/new-zealand-relocation' },
    au_relocation: { t: 'Moving to Australia, step by step', d: 'The whole journey in six stages', u: '/guides/australia-relocation' },
    interview_prep: { t: 'Interview preparation', d: 'What they ask, and how to prepare for it', u: '/interview-prep' },
    build_cv: { t: 'Build your CV', d: 'A CV in the format these employers expect', u: '/build-your-cv' },
    talk_to_team: { t: 'Talk to the Ethicare team', d: 'A real conversation, no pressure', u: '/contact' },
    apply: { t: 'Register your interest', d: 'Send your CV and preferences', u: '/apply' },
    resources_library: { t: 'Guides & resources', d: 'The full library', u: '/resources' },
    employer_support: { t: 'For employers', d: 'Recruit, relocate, retain', u: '/employers' },
    nz_country: { t: 'Working in New Zealand', d: 'The country hub', u: '/new-zealand' },
    au_country: { t: 'Working in Australia', d: 'The country hub', u: '/australia' }
  }
};
