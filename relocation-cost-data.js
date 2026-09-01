/* ================================================================
   ETHICARE RESOURCING — relocation cost data (/cost-calculator)
   One source of truth for official fees, tenancy rules and planning
   estimates. Update figures HERE only — never in cost-calculator.js.
   Every entry carries a source and a checked date.
   tag values: 'official'    a published government or regulator charge
               'calculated'  worked out from an official rule (e.g. a bond)
               'estimate'    an Ethicare planning estimate, meant to be replaced
               'yours'       we hold at zero until the candidate supplies it
   school482 mirrors moving-checklist-data.js — keep the two in step.
   ================================================================ */
window.ETHICARE_COSTS = {
  lastChecked: '19 August 2026',
  registrationChecked: 'Registration fees checked 19 August 2026. Medical radiation and nursing figures are taken line by line from the published board schedules; the rest are Ethicare planning estimates until the board publishes a comparable breakdown.',

  currency: {
    code: { au: 'AUD', nz: 'NZD' },
    symbol: '$',
    /* Indicative only — replace with a live rate feed before publishing. */
    rates: {
      asOf: '18 August 2026',
      AUD: { ZAR: 11.6, GBP: 0.49, EUR: 0.56, USD: 0.65 },
      NZD: { ZAR: 10.6, GBP: 0.45, EUR: 0.51, USD: 0.60 }
    }
  },

  visa: {
    au: {
      name: 'Skills in Demand (subclass 482)',
      primary: 4015, adult: 4015, child: 1005,
      effective: 'Charges from 1 July 2026.',
      note: 'Applies per person included in the application — $4,015 for you, $4,015 for a partner and $1,005 for each child under 18.',
      source: 'Department of Home Affairs — visa pricing estimator',
      href: 'https://immi.homeaffairs.gov.au/visas/visa-pricing-estimator'
    },
    nz: {
      name: 'Accredited Employer Work Visa',
      primary: 1540, adult: null, child: null,
      effective: 'NZ$480 application fee plus a NZ$1,060 immigration levy.',
      note: 'Your partner and children apply for their own visas. Look up the current charges on the Immigration New Zealand fee finder and enter them below — we do not estimate them for you.',
      source: 'Immigration New Zealand — Accredited Employer Work Visa',
      href: 'https://www.immigration.govt.nz/new-zealand-visas/visas/visa/accredited-employer-work-visa'
    }
  },

  /* Cash needed to secure a rental. Bond and advance rent are set by the
     tenancy authority in each place, so they are calculated, not estimated. */
  tenancy: {
    NSW: { bondWeeks: 4, advanceWeeks: 2, rule: 'Bond capped at 4 weeks\u2019 rent for every tenancy, with no higher cap for expensive properties.', source: 'NSW Fair Trading', href: 'https://www.nsw.gov.au/housing-and-construction/renting-a-place-to-live/rental-bonds' },
    VIC: { bondWeeks: 4.33, advanceWeeks: 4.33, rule: 'Bond capped at one month\u2019s rent where the weekly rent is $900 or less. One month\u2019s rent in advance is the maximum.', source: 'Consumer Affairs Victoria', href: 'https://www.consumer.vic.gov.au/housing/renting/rent-bond-bills-and-condition-reports/bond' },
    QLD: { bondWeeks: 4, advanceWeeks: 2, rule: 'Bond capped at 4 weeks\u2019 rent. Two weeks\u2019 rent in advance for a periodic agreement.', source: 'Residential Tenancies Authority', href: 'https://www.rta.qld.gov.au/starting-tenancy/rental-bonds' },
    WA: { bondWeeks: 4, advanceWeeks: 2, rule: 'Bond capped at 4 weeks\u2019 rent where the weekly rent is $1,200 or less. A pet bond of up to $350 can also apply.', source: 'Consumer Protection WA', href: 'https://www.wa.gov.au/organisation/department-of-energy-mines-industry-regulation-and-safety/security-bonds-renting-home' },
    SA: { bondWeeks: 4, advanceWeeks: 2, rule: 'Bond capped at 4 weeks\u2019 rent where the weekly rent is $800 or less, and 6 weeks above that. Two weeks\u2019 rent in advance is the maximum.', source: 'Consumer and Business Services SA', href: 'https://www.cbs.sa.gov.au/renting-letting/bonds' },
    TAS: { bondWeeks: 4, advanceWeeks: 2, rule: 'Bond capped at 4 weeks\u2019 rent, lodged with MyBond.', source: 'Consumer, Building and Occupational Services', href: 'https://www.cbos.tas.gov.au/topics/housing/renting/bonds' },
    ACT: { bondWeeks: 4, advanceWeeks: 2, rule: 'Bond capped at 4 weeks\u2019 rent and lodged with the ACT Revenue Office. Taking a bond is optional.', source: 'ACT Revenue Office', href: 'https://www.revenue.act.gov.au/rental-bonds' },
    NT: { bondWeeks: 4, advanceWeeks: 2, rule: 'Bond capped at 4 weeks\u2019 rent where the weekly rent is $1,200 or less.', source: 'NT Consumer Affairs', href: 'https://consumeraffairs.nt.gov.au/for-consumers/residential-tenancies' },
    AUNS: { bondWeeks: 4, advanceWeeks: 2, rule: 'Most states cap the bond at 4 weeks\u2019 rent with 2 weeks in advance. Confirm the rule once you know where you are moving.', source: 'State and territory tenancy authorities', href: 'https://www.dss.gov.au/housing-support-programs-services-homelessness-tenancy-services' },
    akl: { bondWeeks: 4, advanceWeeks: 2, rule: 'Bond capped at 4 weeks\u2019 rent and lodged with Tenancy Services. A landlord cannot ask for more than 2 weeks\u2019 rent in advance.', source: 'Tenancy Services — bond and rent in advance', href: 'https://www.tenancy.govt.nz/rent-bond-and-bills/bond/' }
  },
  /* Every New Zealand region shares one national rule — resolved in the controller. */
  tenancyNZ: { bondWeeks: 4, advanceWeeks: 2, rule: 'Bond capped at 4 weeks\u2019 rent and lodged with Tenancy Services. A landlord cannot ask for more than 2 weeks\u2019 rent in advance.', source: 'Tenancy Services — bond and rent in advance', href: 'https://www.tenancy.govt.nz/rent-bond-and-bills/bond/' },

  /* Government-school tuition for dependent children of a subclass 482 holder. */
  school482: {
    NSW: { verdict: 'Fee applies · regional exemption', prefill: 0, line: 'Tuition of $6,400 (primary and years 7\u201310) or $7,600 (years 11\u201312) a year per child, plus a $150 application fee. Eligible regional families are exempt.', href: 'https://www.deinternational.nsw.edu.au/trp' },
    VIC: { verdict: 'Generally tuition-free', prefill: 0, line: 'Dependants of 482 holders enrol as local students, so no tuition fee. School materials and services fees still apply.', href: 'https://www.study.vic.gov.au/en/international-student-program/support-and-payments/school-fees' },
    QLD: { verdict: 'Generally tuition-free', prefill: 0, line: 'Subclass 482 is listed as fee exempt, with no application to Education Queensland International required.', href: 'https://ppr.qed.qld.gov.au/pp/temporary-residents-admissions-policy' },
    WA: { verdict: '$4,000 a year per family', prefill: 4000, line: 'One $4,000 fee a year however many children you enrol, collected by TAFE International WA. Nothing while your eldest is in Kindergarten.', href: 'https://www.tafeinternational.wa.edu.au/wa-government-schools/children-who-are-dependants-visa-holders' },
    SA: { verdict: 'Income-tested fee', prefill: 0, line: 'Nothing if combined family income is $75,000 or less. Otherwise up to $6,700 (primary) or $7,900 (high school) per child, with sibling discounts and country-school exemptions.', href: 'https://www.education.sa.gov.au/parents-and-families/enrol-school-or-preschool/families-482-visas/student-fees-enrolment' },
    TAS: { verdict: 'Tuition-free · levies apply', prefill: 0, line: 'No tuition for 482 dependants. School levies of roughly $300\u2013$750 a year apply instead.', href: 'https://www.decyp.tas.gov.au/' },
    ACT: { verdict: 'Exemption may apply', prefill: 0, line: '482 families can apply for an exemption. Without one, published rates run $11,100 (primary) to $16,200 (years 11\u201312) per child.', href: 'https://www.act.gov.au/education-and-training/international-students-and-temporary-visa-holders/enrol-a-child-dependant-of-a-temporary-resident' },
    NT: { verdict: 'Generally tuition-free', prefill: 0, line: 'Dependants of 482 holders are given the same access as local students.', href: 'https://education.nt.gov.au/' },
    AUNS: { verdict: 'Depends on the state', prefill: 0, line: 'Queensland, Victoria, the NT and Tasmania are generally tuition-free for 482 dependants. WA charges $4,000 a year per family. NSW, SA and the ACT charge, with exemptions.', href: 'https://www.education.gov.au/' }
  },

  nzSchool: {
    line: 'Children of an Accredited Employer Work Visa holder are treated as domestic students in state schools, so there is no international tuition fee.',
    officialHref: 'https://parents.education.govt.nz/'
  },

  /* One-way indicative airfares per person, destination currency.
     Planning estimates — always beaten by a real quote. */
  flights: {
    za: { label: 'South Africa', au: { adult: 1050, child: 800 }, nz: { adult: 1350, child: 1000 } },
    uk: { label: 'United Kingdom', au: { adult: 950, child: 720 }, nz: { adult: 1150, child: 860 } },
    ie: { label: 'Ireland', au: { adult: 1000, child: 760 }, nz: { adult: 1200, child: 900 } },
    ae: { label: 'UAE', au: { adult: 800, child: 620 }, nz: { adult: 1050, child: 800 } },
    ph: { label: 'Philippines', au: { adult: 620, child: 480 }, nz: { adult: 900, child: 700 } },
    in: { label: 'India', au: { adult: 820, child: 640 }, nz: { adult: 1100, child: 840 } },
    other: { label: 'Somewhere else', au: { adult: 1000, child: 780 }, nz: { adult: 1250, child: 950 } }
  },

  /* Short-stay weekly cost while you look for a permanent home. */
  tempWeekly: {
    NSW: 1500, VIC: 1400, QLD: 1300, WA: 1250, SA: 1150, TAS: 1050, ACT: 1300, NT: 1250, AUNS: 1300,
    akl: 1400, wlg: 1300, chc: 1200, ham: 1050, tga: 1100, dud: 1000, nzr: 950, NZNS: 1200
  },

  /* Indicative weekly rent, used only to seed the bond calculation. */
  rentWeekly: {
    NSW: 780, VIC: 620, QLD: 700, WA: 700, SA: 620, TAS: 560, ACT: 700, NT: 620, AUNS: 680,
    akl: 660, wlg: 620, chc: 570, ham: 530, tga: 620, dud: 520, nzr: 500, NZNS: 600
  },

  homeSetup: { unfurnished: 3200, part: 1600, furnished: 600, perChild: 450 },
  transport: { public: 300, buy: 8000, hire: 1400, employer: 0, unsure: 1500 },
  shipping: { cases: 0, excess: 700, ship: 4800 },

  documents: { medicals: { au: 420, nz: 460 }, medicalsChild: { au: 200, nz: 220 }, police: 130, certification: 250, english: 350 },
  baggage: 180,
  domestic: 260,
  schoolSetup: 420,     /* per school-age child */
  childcareSetup: 500,  /* per preschool child */
  buffer: { adult: 1500, child: 500 },

  /* Registration and assessment, profession by profession. Each entry carries its
     own regulator, source link and breakdown, because the bodies and the amounts
     differ far more than a single estimate can carry.
       fee   = getting registered, assuming no examination
       exam  = examination or clinical assessment where one applies (null = we will not guess)
       tag   = 'official' where every component is published, 'estimate' where the figure is
               built from a pathway we cannot fully price in advance. */
  registration: {
    checked: '19 August 2026',
    au: {
      imaging: {
        fee: 1102, tag: 'official', exam: 787, examTag: 'official',
        body: 'the Medical Radiation Practice Board of Australia',
        href: 'https://www.medicalradiationpracticeboard.gov.au/Registration/Fees.aspx',
        breakdown: '$660 qualification portfolio assessment, $221 application and $221 first registration.',
        examNote: 'The national medical radiation practice examination is $787 a sitting, and is almost always required unless you are already registered in New Zealand.'
      },
      radtherapy: {
        fee: 1102, tag: 'official', exam: 787, examTag: 'official',
        body: 'the Medical Radiation Practice Board of Australia',
        href: 'https://www.medicalradiationpracticeboard.gov.au/Registration/Fees.aspx',
        breakdown: '$660 qualification portfolio assessment, $221 application and $221 first registration.',
        examNote: 'The national medical radiation practice examination is $787 a sitting, and is almost always required unless you are already registered in New Zealand.'
      },
      sonography: {
        fee: 1200, tag: 'estimate', exam: null,
        body: 'the Australian Sonographer Accreditation Registry',
        href: 'https://www.asar.com.au/',
        breakdown: 'Sonography is not an Ahpra-regulated profession in Australia \u2014 accreditation runs through ASAR, and many sonographers also hold medical radiation registration. Treat this as a placeholder until you know which applies to you.'
      },
      nursing: {
        fee: 921, tag: 'official', exam: 4350, examTag: 'estimate',
        body: 'the Nursing and Midwifery Board of Australia',
        href: 'https://www.nursingmidwiferyboard.gov.au/Registration-and-Endorsement/Fees.aspx',
        breakdown: '$410 IQNM assessment and orientation, $318 application and $193 first registration.',
        examNote: 'The OSCE is $4,000 as published by the Board, plus roughly $350 for the MCQ or NCLEX-RN beforehand. Nurses with 1,800 hours of practice since 2017 in a comparable jurisdiction are exempt from both.'
      },
      midwifery: {
        fee: 921, tag: 'official', exam: 4350, examTag: 'estimate',
        body: 'the Nursing and Midwifery Board of Australia',
        href: 'https://www.nursingmidwiferyboard.gov.au/Registration-and-Endorsement/Fees.aspx',
        breakdown: '$410 IQNM assessment and orientation, $318 application and $193 first registration.',
        examNote: 'The OSCE is $4,000 as published by the Board, plus roughly $350 for the MCQ beforehand.'
      },
      medicine: {
        fee: 2100, tag: 'estimate', exam: null,
        body: 'the Medical Board of Australia',
        href: 'https://www.medicalboard.gov.au/Registration/Fees.aspx',
        breakdown: 'General registration alone is $1,102 a year from 1 August 2026, on top of the application fee and an Australian Medical Council assessment. Competent Authority and Specialist pathways cost very differently, so confirm yours.',
        examUnknownNote: 'AMC examinations apply on the standard pathway and run to several thousand dollars. Competent Authority and Specialist pathway applicants usually avoid them.'
      },
      psychology: {
        fee: 1500, tag: 'estimate', exam: null,
        body: 'the Psychology Board of Australia',
        href: 'https://www.psychologyboard.gov.au/Registration/Fees.aspx',
        breakdown: 'Internationally qualified psychologists register provisionally first, then apply again for general registration, so you pay across two stages.'
      },
      anaesthetic: {
        fee: 600, tag: 'estimate', exam: null,
        body: 'no national regulator',
        href: 'https://www.ahpra.gov.au/Registration/Registration-Process/Fees.aspx',
        breakdown: 'Anaesthetic technology is not an Ahpra-regulated profession in Australia. Costs here are certification and membership rather than registration, and some employers set their own requirements.'
      },
      physio: {
        fee: 1250, tag: 'estimate', exam: null,
        body: 'the Physiotherapy Board of Australia',
        href: 'https://www.physiotherapyboard.gov.au/Registration/Fees.aspx',
        breakdown: 'Application and first registration, plus an Australian Physiotherapy Council assessment. The Council assessment is the larger part and depends on your pathway.'
      },
      ot: {
        fee: 1250, tag: 'estimate', exam: null,
        body: 'the Occupational Therapy Board of Australia',
        href: 'https://www.occupationaltherapyboard.gov.au/Registration/Fees.aspx',
        breakdown: 'Application and first registration, plus an Occupational Therapy Council qualification assessment.'
      },
      speech: {
        fee: 900, tag: 'estimate', exam: null,
        body: 'Speech Pathology Australia',
        href: 'https://www.speechpathologyaustralia.org.au/',
        breakdown: 'Speech pathology is not an Ahpra-regulated profession in Australia. Practising eligibility comes through Speech Pathology Australia rather than a government register.'
      },
      pharmacy: {
        fee: 1300, tag: 'estimate', exam: null,
        body: 'the Pharmacy Board of Australia',
        href: 'https://www.pharmacyboard.gov.au/Registration/Fees.aspx',
        breakdown: 'Application and first registration, plus an Australian Pharmacy Council skills assessment and, on most pathways, examinations.'
      },
      other: {
        fee: 1250, tag: 'estimate', exam: null,
        body: 'Ahpra and the National Boards',
        href: 'https://www.ahpra.gov.au/Registration/Registration-Process/Fees.aspx',
        breakdown: 'A general placeholder. Look up your own board \u2014 the fees vary widely.'
      }
    },
    nz: {
      imaging: {
        fee: 1250, tag: 'estimate', exam: null,
        body: 'the Medical Radiation Technologists Board',
        href: 'https://www.mrtboard.org.nz/pre-registration/overseas-trained-how-to-register',
        breakdown: 'Overseas registration application plus your first annual practising certificate. An online examination applies where the Board does not find your qualification equivalent.',
        examUnknownNote: 'The Board sets an examination fee per sitting, published in its fee schedule. It applies only if your qualification is assessed as not equivalent.'
      },
      radtherapy: {
        fee: 1250, tag: 'estimate', exam: null,
        body: 'the Medical Radiation Technologists Board',
        href: 'https://www.mrtboard.org.nz/pre-registration/overseas-trained-how-to-register',
        breakdown: 'Overseas registration application plus your first annual practising certificate.'
      },
      sonography: {
        fee: 1350, tag: 'estimate', exam: null,
        body: 'the Medical Radiation Technologists Board',
        href: 'https://www.mrtboard.org.nz/pre-registration/overseas-trained-how-to-register',
        breakdown: 'Sonography is a registered scope in New Zealand, unlike Australia. Even Australian-qualified sonographers apply as overseas-trained.'
      },
      nursing: {
        fee: 1320, tag: 'estimate', exam: null,
        body: 'the Nursing Council of New Zealand',
        href: 'https://www.nursingcouncil.org.nz/Public/Registration/Overseas_Nurses/NCNZ/registration-section/Overseas_Nurses.aspx',
        breakdown: 'NZ$485 registration application, which is official, plus credentials verification and your first practising certificate. You cannot apply to the Council until your documents have been verified.',
        examUnknownNote: 'Some internationally qualified nurses are directed to a competence assessment \u2014 a theory examination and an OSCE. The Council decides this individually.'
      },
      midwifery: {
        fee: 1400, tag: 'estimate', exam: null,
        body: 'the Midwifery Council of New Zealand',
        href: 'https://www.health.govt.nz/regulated-health-professions',
        breakdown: 'Registration application plus your first annual practising certificate. A competence programme may be required.'
      },
      medicine: {
        fee: 2600, tag: 'estimate', exam: null,
        body: 'the Medical Council of New Zealand',
        href: 'https://www.mcnz.org.nz/registration/getting-registered/',
        breakdown: 'Registration application plus your first annual practising certificate. Which scope you qualify for changes the cost considerably.'
      },
      psychology: {
        fee: 1700, tag: 'estimate', exam: null,
        body: 'the New Zealand Psychologists Board',
        href: 'https://www.health.govt.nz/regulated-health-professions',
        breakdown: 'Registration application and scope assessment, plus your first annual practising certificate.'
      },
      anaesthetic: {
        fee: 1200, tag: 'estimate', exam: null,
        body: 'the Medical Sciences Council of New Zealand',
        href: 'https://www.mscouncil.org.nz/',
        breakdown: 'Anaesthetic technology is a registered profession in New Zealand, unlike Australia. Registration runs through the Medical Sciences Council.'
      },
      physio: {
        fee: 1350, tag: 'estimate', exam: null,
        body: 'the Physiotherapy Board of New Zealand',
        href: 'https://www.physioboard.org.nz/',
        breakdown: 'Registration application plus your first annual practising certificate.'
      },
      ot: {
        fee: 1350, tag: 'estimate', exam: null,
        body: 'the Occupational Therapy Board of New Zealand',
        href: 'https://www.otboard.org.nz/',
        breakdown: 'Registration application plus your first annual practising certificate.'
      },
      speech: {
        fee: 900, tag: 'estimate', exam: null,
        body: 'the New Zealand Speech-language Therapists Association',
        href: 'https://www.health.govt.nz/regulated-health-professions',
        breakdown: 'Speech-language therapy is not a statutorily regulated profession in New Zealand. Membership of the Association is what employers look for.'
      },
      pharmacy: {
        fee: 1400, tag: 'estimate', exam: null,
        body: 'the Pharmacy Council of New Zealand',
        href: 'https://www.pharmacycouncil.org.nz/',
        breakdown: 'Registration application plus your first annual practising certificate. Most overseas pharmacists also complete a supervised practice period.'
      },
      other: {
        fee: 1350, tag: 'estimate', exam: null,
        body: 'the relevant responsible authority',
        href: 'https://www.health.govt.nz/regulated-health-professions',
        breakdown: 'A general placeholder. Find your responsible authority and check its published fees.'
      }
    },
    exam: {
      streamlined: 'the UK, Ireland, the USA, Canada (British Columbia and Ontario), Singapore and Spain',
      unknownNote: 'Some pathways require an examination, a clinical assessment or a supervised practice period, and the fee varies widely. We will not guess at it \u2014 put your own figure in once your regulator has confirmed your pathway.'
    },
    labels: { imaging: 'Medical imaging / radiography', sonography: 'Sonography', radtherapy: 'Radiation therapy', nursing: 'Nursing', midwifery: 'Midwifery', medicine: 'Medicine', psychology: 'Psychology', anaesthetic: 'Anaesthetic technology', physio: 'Physiotherapy', ot: 'Occupational therapy', speech: 'Speech and language therapy', pharmacy: 'Pharmacy', other: 'Another profession' },
    regulator: {
      au: { name: 'Ahpra and the National Boards', href: 'https://www.ahpra.gov.au/Registration/Registration-Process/Fees.aspx' },
      nz: { name: 'the relevant responsible authority', href: 'https://www.health.govt.nz/regulated-health-professions' }
    }
  },

  regions: {
    au: [
      { value: 'NSW', label: 'New South Wales' }, { value: 'VIC', label: 'Victoria' },
      { value: 'QLD', label: 'Queensland' }, { value: 'WA', label: 'Western Australia' },
      { value: 'SA', label: 'South Australia' }, { value: 'TAS', label: 'Tasmania' },
      { value: 'ACT', label: 'ACT' }, { value: 'NT', label: 'Northern Territory' },
      { value: 'AUNS', label: 'Not sure yet' }
    ],
    nz: [
      { value: 'akl', label: 'Auckland' }, { value: 'wlg', label: 'Wellington' },
      { value: 'chc', label: 'Christchurch' }, { value: 'ham', label: 'Hamilton / Waikato' },
      { value: 'tga', label: 'Tauranga / Bay of Plenty' }, { value: 'dud', label: 'Dunedin / Otago' },
      { value: 'nzr', label: 'A smaller centre' }, { value: 'NZNS', label: 'Not sure yet' }
    ]
  }
};
