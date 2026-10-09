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
    move_planner: { t: 'Plan Ethicare', d: 'The whole move, sequenced — what to do and when', u: '/plan' },
    compare_countries: { t: 'Australia vs New Zealand', d: 'Pay, pace and lifestyle, side by side', u: '/guides/australia-vs-new-zealand' },
    cost_calculator: { t: 'What the move will cost', d: 'Build a realistic figure for your own move', u: '/cost-calculator' },
    before_you_accept: { t: 'Before you accept an offer', d: 'What to check in a contract before you sign', u: '/before-you-accept' },
    where_to_live: { t: 'Destination finder', d: 'Seven questions about the life you want, and three regions that fit, trade-offs included', u: '/destination-finder' },
    nz_destinations: { t: 'NZ destination guides', d: 'Costs, suburbs, hospitals, city by city', u: '/destinations/' },
    au_destinations: { t: 'AU destination guides', d: 'Eight states and territories, compared honestly', u: '/destinations/australia' },
    jobs: { t: 'Live roles', d: 'Current Ethicare vacancies in both countries', u: '/jobs/' },
    professions: { t: 'Find your profession', d: 'Registration, work and indicative pay for your role', u: '/jobs/professions' },
    nz_registration: { t: 'Registering in New Zealand', d: 'The full registration guide', u: '/guides/new-zealand-registration' },
    au_registration: { t: 'Registering in Australia', d: 'Ahpra, the national boards, and where skills assessment fits', u: '/guides/australia-registration' },
    au_mrpba: { t: 'Registering with Ahpra and the MRPBA', d: 'How registration works for UK-trained radiographers, radiation therapists and nuclear medicine, step by step', u: '/guides/australia-registration-mrpba' },
    au_ranzcr: { t: 'Registering as a radiologist in Australia', d: 'The RANZCR assessment, the Expedited Specialist pathway, supervised practice and Medicare', u: '/guides/australia-registration-radiologists' },
    au_asar: { t: 'Sonographer accreditation: ASMIRT and ASAR', d: 'The accreditation route for sonographers, and where the skills assessment fits', u: '/guides/australia-registration-asar' },
    take_home_pay: { t: 'Take-home pay calculator', d: 'What a salary pays into your bank after tax, levies and KiwiSaver or super', u: '/take-home-pay' },
    nz_renting: { t: 'Renting in New Zealand', d: 'Your application pack, viewings, bond, tenancy rights and the scams to watch for', u: '/guides/renting-in-new-zealand' },
    nz_driving: { t: 'Driving in New Zealand', d: 'Converting your licence, buying a used car, WOF and rego', u: '/guides/driving-and-licences' },
    nz_money: { t: 'Money, tax and banking in New Zealand', d: 'IRD numbers, your first payslip, KiwiSaver and sending money home', u: '/guides/money-tax-and-banking' },
    nz_visa: { t: 'New Zealand visas', d: 'Options for you and everyone moving with you', u: '/guides/new-zealand-visa' },
    au_visa: { t: 'Australian visas', d: 'Work and family routes, in plain English', u: '/guides/australia-visa' },
    nz_family: { t: 'Moving to NZ with your family', d: 'Schools, childcare, partners, the first months', u: '/guides/new-zealand-family' },
    au_family: { t: 'Moving to AU with your family', d: 'Schools, childcare, partners, the first months', u: '/guides/australia-family' },
    nz_healthcare: { t: 'How NZ healthcare works', d: 'The system you would be joining', u: '/guides/new-zealand-healthcare' },
    au_healthcare: { t: 'How AU healthcare works', d: 'Medicare, public and private, the PBS', u: '/guides/australia-healthcare' },
    nz_practice: { t: 'Practising in New Zealand', d: 'Culture, expectations, what feels different', u: '/guides/new-zealand-practice' },
    au_practice: { t: 'Practising in Australia', d: 'Culture, expectations, what feels different', u: '/guides/australia-practice' },
    nz_salary: { t: 'Pay in New Zealand', d: 'What the money looks like, explained', u: '/guides/new-zealand-salary' },
    au_salary: { t: 'Pay in Australia', d: 'What the money looks like, explained', u: '/guides/australia-salary' },
    pay_register: { t: 'NZ pay agreements', d: 'The collective agreements that set public pay', u: '/guides/new-zealand-pay-agreements' },
    nz_relocation: { t: 'Moving to New Zealand, step by step', d: 'The whole journey in six stages', u: '/guides/new-zealand-relocation' },
    au_relocation: { t: 'Moving to Australia, step by step', d: 'The whole journey in six stages', u: '/guides/australia-relocation' },
    interview_prep: { t: 'Interview preparation', d: 'What they ask, and how to prepare for it', u: '/interview-prep' },
    build_cv: { t: 'Build your CV', d: 'A CV in the format these employers expect', u: '/build-your-cv' },
    talk_to_team: { t: 'Talk to the Ethicare team', d: 'A real conversation, no pressure', u: '/contact' },
    official_mrpba: { t: 'Medical Radiation Practice Board (official)', d: 'The regulator\u2019s own registration pages, including the Comparable Regulator Pathway', u: 'https://www.medicalradiationpracticeboard.gov.au/Registration/Internationally-qualified-medical-radiation-practitioners/Registration-pathways-for-internationally-qualified-medical-radiation-practitioners' },
    official_ahpra: { t: 'Ahpra (official)', d: 'Registration for overseas-trained practitioners', u: 'https://www.ahpra.gov.au/Registration.aspx' },
    official_mrtb: { t: 'Medical Radiation Technologists Board (official)', d: 'New Zealand registration for imaging and radiation therapy', u: 'https://www.mrtboard.org.nz/' },
    official_mcnz: { t: 'Medical Council of New Zealand (official)', d: 'Registration pathways for doctors', u: 'https://www.mcnz.org.nz/registration/getting-registered/registration-pathways/' },
    official_inz: { t: 'Immigration New Zealand (official)', d: 'Visas, straight from the source', u: 'https://www.immigration.govt.nz/' },
    official_homeaffairs: { t: 'Home Affairs (official)', d: 'Australian visas, straight from the source', u: 'https://immi.homeaffairs.gov.au/' },
    au_interest: { t: 'Interested in working in Australia?', d: 'Medical imaging now, more professions in the coming weeks — register and we will be in touch nearer the time', u: '/jobs/coming-to-australia#notify' },
    apply: { t: 'Register your interest', d: 'Send your CV and preferences', u: '/apply' },
    resources_library: { t: 'Guides & resources', d: 'The full library', u: '/my-pack' },
    my_pack: { t: 'Create my pack', d: 'Tick the guides you want and get them in one email', u: '/my-pack' },
    employer_support: { t: 'For employers', d: 'Recruit, relocate, retain', u: '/employers' },
    nz_country: { t: 'Working in New Zealand', d: 'The country hub', u: '/new-zealand' },
    au_country: { t: 'Working in Australia', d: 'The country hub', u: '/australia' },
    /* Added 15 Sep 2026, from ASK-ETHICARE.md §3. Six of the fifteen question types in the
       brief — schools, pets, renting, the move itself, the first month, driving — had NO
       destination in this map, so the model could only route them to a near-miss (usually
       the family guide) or return nothing and fall through to the checker. Every path below
       was confirmed to exist before it was added; an id pointing at a 404 is worse than a
       near-miss. Where a country has no guide of its own the nearest true owner is used and
       the description says so, rather than inventing a symmetrical URL. */
    nz_education: { t: 'Schools in New Zealand', d: 'How enrolment, zoning and the school year work', u: '/guides/new-zealand-education' },
    au_education: { t: 'Schools in Australia', d: 'Enrolment, the state systems, and what they cost', u: '/guides/australia-education' },
    au_school_fees: { t: 'Will I pay school fees in Australia?', d: 'What your visa decides about state school fees', u: '/guides/australia-school-fees' },
    nz_pets: { t: 'Bringing pets to New Zealand', d: 'Import rules, lead times and what travels with you', u: '/guides/nz/bringing-pets-and-belongings' },
    au_pets: { t: 'Bringing pets to Australia', d: 'Import permits, quarantine and the real timeline', u: '/guides/australia-pets' },
    au_renting: { t: 'Renting in Australia', d: 'Applications, bond, and the rules in your state', u: '/guides/australia-renting' },
    nz_community: { t: 'Community & belonging in New Zealand', d: 'How people meet people here', u: '/guides/new-zealand-community' },
    au_community: { t: 'Community & belonging in Australia', d: 'How people meet people here', u: '/guides/australia-community' },
    au_driving: { t: 'Driving & licences in Australia', d: 'Converting your licence, and whether you need a car', u: '/guides/australia-driving' },
    moving_checklist: { t: 'Moving checklist', d: 'Everything to arrange before you fly, filtered to your household', u: '/moving-checklist' },
    nz_first_month: { t: 'Your first month in New Zealand', d: 'The paperwork in the order that actually works', u: '/guides/new-zealand-first-month' },
    au_first_month: { t: 'Living & thriving in Australia', d: 'The first weeks, and settling in beyond them', u: '/guides/living-in-australia' }
  }
};
