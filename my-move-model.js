/* My Move planner — data model + controlled vocabularies (prototype, 30 Aug 2026).
   The planner is built around five record types, NOT pages:
     TASKS      what still needs doing        {id,section,title,why,links{nz,au}|link,status,due,note}
     COSTS      what it costs / gets back     {id,section,category,label,estimate,actual,funding,date,receipt}
     ALLOWANCES what the employer will pay    {currency,amount,expires,rules,claimed}
     SAVED      shortlists of anything        {id,section,kind,label,url,note}
     DOCUMENTS  evidence, narrow by design    {id,name,kind,linkedTo}
   Every dashboard section is a filtered VIEW over those five. Adding "pets" or "storage" later is
   seed data, not a rebuild. Controlled vocabularies live here so V2 matching can actually query.  */
window.MM = (function () {
  var V = {
    destination: [
      { id: 'nz', label: 'New Zealand', cur: 'NZ$' },
      { id: 'au', label: 'Australia', cur: 'A$' },
      { id: 'both', label: 'Both / still deciding', cur: 'NZ$' }
    ],
    profession: ['Radiographer / medical imaging', 'Sonographer', 'Radiation therapist', 'Nuclear medicine technologist',
      'Registered nurse', 'Midwife', 'Anaesthetic technician', 'Theatre / perioperative', 'Physiotherapist',
      'Occupational therapist', 'Psychologist', 'Doctor — GP', 'Doctor — specialist', 'Doctor — RMO / registrar', 'Other'],
    stage: ['Just exploring', 'Researching seriously', 'Registration underway', 'Job hunting', 'Offer in hand', 'Move booked'],
    party: ['On my own', 'With a partner', 'With children', 'Partner and children'],
    period: ['Within 3 months', '3–6 months', '6–12 months', '12 months +', 'Not sure yet'],
    regStatus: ['Not started', 'Gathering documents', 'Application submitted', 'Assessment underway', 'Exam required', 'Registered'],
    years: ['0–2', '3–5', '6–10', '10+'],
    region: {
      nz: ['Auckland', 'Waikato', 'Bay of Plenty', 'Hawke’s Bay', 'Wellington', 'Nelson / Tasman', 'Christchurch', 'Dunedin', 'Southland', 'Flexible'],
      au: ['Sydney / NSW', 'Melbourne / VIC', 'Brisbane / QLD', 'Perth / WA', 'Adelaide / SA', 'Hobart / TAS', 'Canberra / ACT', 'Darwin / NT', 'Regional', 'Flexible']
    },
    funding: [
      { id: 'self', label: 'Self-funded' },
      { id: 'employer', label: 'Employer-funded' },
      { id: 'reimbursable', label: 'Reimbursable' },
      { id: 'reimbursed', label: 'Reimbursed' }
    ],
    category: ['Registration', 'Visa', 'Flights', 'Shipping & baggage', 'Temporary accommodation', 'Rental deposit & bond',
      'Insurance', 'Transport on arrival', 'Schools & childcare', 'Documents & verification', 'Other'],
    sections: [
      { id: 'money', label: 'Money', note: 'Allowance, spend and what you get back' },
      { id: 'admin', label: 'Admin', note: 'Registration, visa, tax number, licences' },
      { id: 'travel', label: 'Travel', note: 'Flights, shipping, arrival transport' },
      { id: 'home', label: 'Home', note: 'Temporary and permanent places to live' },
      { id: 'family', label: 'Family', note: 'Partner, children, schools, childcare' },
      { id: 'work', label: 'Work', note: 'Roles, offer, relocation package' }
    ]
  };

  /* Seed tasks. `why` is the one-line reason. Routing follows one topic, one source:
     `links` names the guide that OWNS the topic in EACH country, and the planner resolves
     it against the reader's destination. `link` (singular) is for country-agnostic tools.

     Both halves were wrong before 31 Aug 2026: every task pointed at a New Zealand guide,
     so an Australian's plan routed them to New Zealand rules on every step — and seven of
     those NZ slugs (-tax, -driving, -banking, -renting, -utilities, -schools, -pets) never
     existed, so they 404'd for New Zealanders too. Canonical URLs verified against
     _redirects; do not invent a slug here.

     `resources` are OFFICIAL or INDEPENDENT external links only — the body that actually
     owns the thing (IRD, ATO, MPI, AHPRA, Immigration NZ, Home Affairs) or a not-for-profit
     comparison tool (Powerswitch is Consumer NZ; Energy Made Easy is the Australian Energy
     Regulator's own service). No affiliate or commercial links here until an agreement is in
     place, and never one that displaces an official source — these are the links that make a
     later paid recommendation credible. Resolved per country, same as `links`.

     Known gap: Australia has no standalone utilities guide, so 'utilities' routes to the
     Australian relocation guide, whose arrival section covers connections. Repoint it if a
     dedicated guide is written. */
  var TASKS = [
    { id: 'reg-route', section: 'admin', tool: true, title: 'Confirm your registration route', why: 'Everything else is sequenced off this.', link: '/pathway-checker' },
    { id: 'reg-docs', section: 'admin', resources: { nz: [{ label: 'Get a document legalised (FCDO)', href: 'https://www.gov.uk/get-document-legalised' }], au: [{ label: 'Get a document legalised (FCDO)', href: 'https://www.gov.uk/get-document-legalised' }] }, title: 'Gather qualification and practice evidence', why: 'Document verification is usually the slow part.', links: { nz: '/guides/new-zealand-registration', au: '/guides/australia-registration' } },
    { id: 'reg-apply', section: 'admin', resources: { au: [{ label: 'AHPRA', href: 'https://www.ahpra.gov.au' }] }, title: 'Submit your registration application', why: 'The regulator decides; we keep the file moving.', links: { nz: '/guides/new-zealand-registration', au: '/guides/australia-registration' } },
    { id: 'visa', section: 'admin', resources: { nz: [{ label: 'Immigration New Zealand', href: 'https://www.immigration.govt.nz' }], au: [{ label: 'Department of Home Affairs', href: 'https://immi.homeaffairs.gov.au' }] }, title: 'Confirm which visa applies to you', why: 'Runs largely in parallel with registration.', links: { nz: '/guides/new-zealand-visa', au: '/guides/australia-visa' } },
    { id: 'police', section: 'admin', resources: { nz: [{ label: 'ACRO police certificate (UK)', href: 'https://www.acro.police.uk/police-certificates' }], au: [{ label: 'ACRO police certificate (UK)', href: 'https://www.acro.police.uk/police-certificates' }] }, title: 'Order police / criminal-history checks', why: 'Needed for registration and the visa, and slow to arrive.', links: { nz: '/guides/new-zealand-registration', au: '/guides/australia-registration' } },
    { id: 'tax', section: 'admin', resources: { nz: [{ label: 'Inland Revenue (IRD number)', href: 'https://www.ird.govt.nz' }], au: [{ label: 'Australian Taxation Office (TFN)', href: 'https://www.ato.gov.au' }] }, title: 'Apply for your tax number (IRD / TFN)', why: 'Without it you are taxed at the highest rate from day one.', links: { nz: '/guides/money-tax-and-banking', au: '/guides/australia-money' } },
    { id: 'licence', section: 'admin', resources: { nz: [{ label: 'NZ Transport Agency', href: 'https://www.nzta.govt.nz/driver-licences/new-residents-and-visitors/' }] }, title: 'Check your driving licence conversion', why: 'There is a deadline after you arrive.', links: { nz: '/guides/driving-and-licences', au: '/guides/australia-driving' } },
    { id: 'bank', section: 'money', title: 'Open a bank account', why: 'Some banks let you start before you fly; all of them run their own ID checks.', links: { nz: '/guides/money-tax-and-banking', au: '/guides/australia-money' } },
    { id: 'allowance', section: 'money', title: 'Get your relocation package in writing', why: 'Limits, expiry and what counts as claimable.', links: { nz: '/guides/new-zealand-relocation', au: '/guides/australia-relocation' } },
    { id: 'fx', section: 'money', title: 'Plan how you’ll move your money', why: 'The rate and the fee both matter on a sum this size.', links: { nz: '/guides/money-tax-and-banking', au: '/guides/australia-money' } },
    { id: 'budget', section: 'money', tool: true, title: 'Build your move budget', why: 'Know the number before you resign anything.', link: '/cost-calculator' },
    { id: 'flights', section: 'travel', title: 'Price and book flights', why: 'Baggage allowance is part of the shipping decision.', links: { nz: '/guides/new-zealand-relocation', au: '/guides/australia-relocation' } },
    { id: 'shipping', section: 'travel', title: 'Decide what ships and what you sell', why: 'Sea freight takes weeks; quotes vary widely.', links: { nz: '/guides/nz/bringing-pets-and-belongings', au: '/guides/australia-relocation' } },
    { id: 'pets', section: 'travel', resources: { nz: [{ label: 'Ministry for Primary Industries', href: 'https://www.mpi.govt.nz/bring-send-items-to-nz/animals-to-nz/' }], au: [{ label: 'Dept of Agriculture, Fisheries and Forestry', href: 'https://www.agriculture.gov.au/biosecurity-trade/cats-dogs' }] }, title: 'Start the pet import process if you have pets', why: 'The longest lead time of anything on this list.', links: { nz: '/guides/nz/bringing-pets-and-belongings', au: '/guides/australia-pets' } },
    { id: 'arrival-transport', section: 'travel', title: 'Sort transport for the first fortnight', why: 'Rental car, or public transport where it actually works.', links: { nz: '/guides/driving-and-licences', au: '/guides/australia-driving' } },
    { id: 'temp-home', section: 'home', title: 'Book temporary accommodation', why: 'Almost nobody signs a lease before landing.', links: { nz: '/guides/renting-in-new-zealand', au: '/guides/australia-renting' } },
    { id: 'rental', section: 'home', resources: { nz: [{ label: 'Tenancy Services', href: 'https://www.tenancy.govt.nz' }] }, title: 'Understand how renting works there', why: 'Bond, references and viewing culture differ.', links: { nz: '/guides/renting-in-new-zealand', au: '/guides/australia-renting' } },
    { id: 'utilities', section: 'home', resources: { nz: [{ label: 'Powerswitch (Consumer NZ, not-for-profit)', href: 'https://www.powerswitch.org.nz' }, { label: 'Broadband Compare', href: 'https://www.broadbandcompare.co.nz' }], au: [{ label: 'Energy Made Easy (Australian Energy Regulator)', href: 'https://www.energymadeeasy.gov.au' }, { label: 'Victorian Energy Compare', href: 'https://compare.energy.vic.gov.au' }] }, title: 'Set up utilities and internet', why: 'Connection dates are the bit people miss.', links: { nz: '/guides/new-zealand-checklist', au: '/guides/australia-relocation' } },
    { id: 'schools', section: 'family', resources: { nz: [{ label: 'Ministry of Education — find a school', href: 'https://www.education.govt.nz/school/find-a-school/' }], au: [{ label: 'My School', href: 'https://www.myschool.edu.au' }] }, title: 'Shortlist schools or childcare', why: 'Zoning ties school to suburb, so this shapes where you live.', links: { nz: '/guides/new-zealand-education', au: '/guides/australia-education' } },
    { id: 'partner-work', section: 'family', resources: { nz: [{ label: 'Immigration New Zealand — partner work rights', href: 'https://www.immigration.govt.nz' }], au: [{ label: 'Department of Home Affairs', href: 'https://immi.homeaffairs.gov.au' }] }, title: 'Check your partner’s work rights', why: 'Usually included, but confirm it against your visa.', links: { nz: '/guides/new-zealand-family', au: '/guides/australia-family' } },
    { id: 'healthcare', section: 'family', resources: { au: [{ label: 'Medicare enrolment (Services Australia)', href: 'https://www.servicesaustralia.gov.au/medicare' }] }, title: 'Register the family with healthcare', why: 'Enrolment is a task, not automatic.', links: { nz: '/guides/new-zealand-healthcare', au: '/guides/australia-healthcare' } },
    { id: 'roles', section: 'work', tool: true, title: 'Decide what you actually want from the job', why: 'Size of service changes the work more than the title does.', link: '/jobs/' },
    { id: 'cv', section: 'work', tool: true, title: 'Get your CV into the local format', why: 'Different conventions; ours is a two-minute check.', link: '/cv-checker' },
    { id: 'interview', section: 'work', resources: { nz: [{ label: 'OET — the healthcare English test', href: 'https://www.occupationalenglishtest.org' }], au: [{ label: 'OET — the healthcare English test', href: 'https://www.occupationalenglishtest.org' }] }, title: 'Prepare for the interview', why: 'Usually a panel, often remote.', links: { nz: '/guides/new-zealand-interview', au: '/guides/australia-interview' } },
    { id: 'offer', section: 'work', tool: true, title: 'Check the offer before you sign', why: 'Step, allowances and start date are all negotiable-ish.', link: '/before-you-accept' }
  ];

  /* Resolve a task's guide for the reader's destination. 'both' (still deciding) falls back
     to New Zealand, the more established side; a task with neither links nor link returns ''. */
  /* NO cross-country fallback, unlike taskLink(). Our own guides can fall back — a New
     Zealand guide read by someone still deciding is merely early. An official source cannot:
     sending an Australian to the NZ Transport Agency or NZ Tenancy Services is simply wrong,
     and it is the same defect class as the guide links fixed on 31 Aug. A country with no
     entry returns nothing, and the task's own guide (which IS country-resolved) carries it. */
  function taskResources(t, dest) {
    if (!t.resources) return [];
    return t.resources[dest] || [];
  }

  function taskLink(t, dest) {
    if (t.link) return t.link;
    if (!t.links) return '';
    return t.links[dest] || t.links.nz || '';
  }

  /* Consent wording is VERSIONED — record the exact text shown, not just a boolean and a date. */
  var CONSENT = {
    jobs: {
      version: 'jobs-v1-2026-08',
      label: 'Yes, I’d like to hear about suitable job opportunities',
      body: 'We work with healthcare employers across Australia and New Zealand. If a suitable opportunity comes up for your profession, location preferences and timeline, we can let you know. This is optional and never needed for your Move Plan.'
    },
    plan: { version: 'plan-v1-2026-08', label: 'Move Plan reminders', body: 'Occasional nudges about tasks with deadlines — visa, registration, licence conversion.' },
    reg: { version: 'reg-v1-2026-08', label: 'Registration updates', body: 'When a regulator changes its process or fees for your profession.' },
    news: { version: 'news-v1-2026-08', label: 'Useful relocation updates', body: 'New guides, cost data and destination material. Nothing weekly.' }
  };
  return { V: V, TASKS: TASKS, CONSENT: CONSENT, taskLink: taskLink, taskResources: taskResources };
})();
