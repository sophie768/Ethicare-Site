/* Ethicare Resourcing — healthcare profession catalogue.

   ONE source of truth for: which healthcare professions exist, who registers
   them in each country, and how far Ethicare's own support for each has got.
   Read by Ethicare Move (site/move.js) and by the internal build
   plan so the two can never disagree.

   Regulators verified 20 August 2026 against:
     NZ — Ministry of Health, responsible authorities under the HPCA Act 2003
          (18 authorities; social work sits under its own Act).
     AU — the National Scheme: 16 registered professions, 15 National Boards
          under Ahpra. Professions outside the Scheme are marked so, because
          for a candidate that is the important fact, not a footnote.

   `support` is deliberately derived from things that exist on this site, not
   from ambition:
     'recruiting' — a live profession page for that country
     'soon'       — no page yet; the planner still works end to end
   Adding a profession page means moving one word here. Nothing else claims
   coverage anywhere on the site. */
window.ETHICARE_PROFESSIONS = (function () {

  /* r: regulator. reg:false means the profession is not on a statutory
     register in that country — said plainly, because it changes what a
     candidate has to do. */
  var P = [
    { key: 'imaging', label: 'Medical imaging / radiography', group: 'Medical imaging & radiation',
      nz: { reg: true, body: 'the Medical Radiation Technologists Board', href: 'https://www.mrtboard.org.nz/' },
      au: { reg: true, body: 'the Medical Radiation Practice Board of Australia', href: 'https://www.medicalradiationpracticeboard.gov.au/' },
      support: { nz: 'recruiting', au: 'recruiting' } },

    { key: 'sonography', label: 'Sonography', group: 'Medical imaging & radiation',
      nz: { reg: true, body: 'the Medical Radiation Technologists Board', href: 'https://www.mrtboard.org.nz/',
        note: 'A registered scope in New Zealand — so even Australian-qualified sonographers apply as overseas-trained.' },
      au: { reg: false, body: 'the Australian Sonographer Accreditation Registry', href: 'https://www.asar.com.au/',
        note: 'Not an Ahpra-regulated profession. Accreditation runs through ASAR, and many sonographers also hold medical radiation registration.' },
      support: { nz: 'recruiting', au: 'recruiting' } },

    { key: 'radtherapy', label: 'Radiation therapy', group: 'Medical imaging & radiation',
      nz: { reg: true, body: 'the Medical Radiation Technologists Board', href: 'https://www.mrtboard.org.nz/' },
      au: { reg: true, body: 'the Medical Radiation Practice Board of Australia', href: 'https://www.medicalradiationpracticeboard.gov.au/' },
      support: { nz: 'recruiting', au: 'recruiting' } },

    { key: 'nuclearmed', label: 'Nuclear medicine technology', group: 'Medical imaging & radiation',
      nz: { reg: true, body: 'the Medical Radiation Technologists Board', href: 'https://www.mrtboard.org.nz/' },
      au: { reg: true, body: 'the Medical Radiation Practice Board of Australia', href: 'https://www.medicalradiationpracticeboard.gov.au/' },
      support: { nz: 'recruiting', au: 'recruiting' } },

    { key: 'medicine', label: 'Medicine', group: 'Medicine & dentistry',
      nz: { reg: true, body: 'the Medical Council of New Zealand', href: 'https://www.mcnz.org.nz/' },
      au: { reg: true, body: 'the Medical Board of Australia', href: 'https://www.medicalboard.gov.au/' },
      support: { nz: 'recruiting', au: 'recruiting' } },

    { key: 'physicianassoc', label: 'Physician associate', group: 'Medicine & dentistry',
      nz: { reg: true, body: 'the Medical Council of New Zealand', href: 'https://www.mcnz.org.nz/',
        note: 'Physician associate services became a regulated scope under the Medical Council.' },
      au: { reg: false, body: 'no national regulator', href: 'https://www.ahpra.gov.au/',
        note: 'Not a registered profession in Australia. Employers set their own requirements.' },
      support: { nz: 'soon', au: 'soon' } },

    { key: 'dentistry', label: 'Dentistry & oral health', group: 'Medicine & dentistry',
      nz: { reg: true, body: 'the Dental Council', href: 'https://www.dcnz.org.nz/',
        note: 'Covers dentistry, dental hygiene, dental therapy, oral health therapy and dental technology.' },
      au: { reg: true, body: 'the Dental Board of Australia', href: 'https://www.dentalboard.gov.au/' },
      support: { nz: 'soon', au: 'soon' } },

    { key: 'nursing', label: 'Nursing', group: 'Nursing & midwifery',
      nz: { reg: true, body: 'the Nursing Council of New Zealand', href: 'https://www.nursingcouncil.org.nz/' },
      au: { reg: true, body: 'the Nursing and Midwifery Board of Australia', href: 'https://www.nursingmidwiferyboard.gov.au/' },
      support: { nz: 'soon', au: 'soon' } },

    { key: 'midwifery', label: 'Midwifery', group: 'Nursing & midwifery',
      nz: { reg: true, body: 'the Midwifery Council', href: 'https://www.midwiferycouncil.health.nz/' },
      au: { reg: true, body: 'the Nursing and Midwifery Board of Australia', href: 'https://www.nursingmidwiferyboard.gov.au/' },
      support: { nz: 'soon', au: 'soon' } },

    { key: 'physio', label: 'Physiotherapy', group: 'Allied health & therapies',
      nz: { reg: true, body: 'the Physiotherapy Board', href: 'https://www.physioboard.org.nz/' },
      au: { reg: true, body: 'the Physiotherapy Board of Australia', href: 'https://www.physiotherapyboard.gov.au/' },
      support: { nz: 'recruiting', au: 'soon' } },

    { key: 'ot', label: 'Occupational therapy', group: 'Allied health & therapies',
      nz: { reg: true, body: 'the Occupational Therapy Board', href: 'https://www.otboard.org.nz/' },
      au: { reg: true, body: 'the Occupational Therapy Board of Australia', href: 'https://www.occupationaltherapyboard.gov.au/' },
      support: { nz: 'recruiting', au: 'soon' } },

    { key: 'speech', label: 'Speech and language therapy', group: 'Allied health & therapies',
      nz: { reg: false, body: 'the New Zealand Speech-language Therapists Association', href: 'https://speechtherapy.org.nz/',
        note: 'Not a statutorily regulated profession. Association membership is what employers look for.' },
      au: { reg: false, body: 'Speech Pathology Australia', href: 'https://www.speechpathologyaustralia.org.au/',
        note: 'Not an Ahpra-regulated profession. Practising eligibility comes through the association.' },
      support: { nz: 'soon', au: 'soon' } },

    { key: 'dietetics', label: 'Dietetics', group: 'Allied health & therapies',
      nz: { reg: true, body: 'the Dietitians Board', href: 'https://www.dietitiansboard.org.nz/' },
      au: { reg: false, body: 'Dietitians Australia', href: 'https://dietitiansaustralia.org.au/',
        note: 'Not an Ahpra-regulated profession. Accredited Practising Dietitian credentialling runs through the association.' },
      support: { nz: 'soon', au: 'soon' } },

    { key: 'podiatry', label: 'Podiatry', group: 'Allied health & therapies',
      nz: { reg: true, body: 'the Podiatrists Board', href: 'https://podiatristsboard.org.nz/' },
      au: { reg: true, body: 'the Podiatry Board of Australia', href: 'https://www.podiatryboard.gov.au/' },
      support: { nz: 'soon', au: 'soon' } },

    { key: 'audiology', label: 'Audiology', group: 'Allied health & therapies',
      nz: { reg: false, body: 'the New Zealand Audiological Society', href: 'https://www.audiology.org.nz/',
        note: 'Not a statutorily regulated profession. Society membership is the practising credential.' },
      au: { reg: false, body: 'Audiology Australia', href: 'https://audiology.asn.au/',
        note: 'Not an Ahpra-regulated profession. Accredited Audiologist status runs through the association.' },
      support: { nz: 'soon', au: 'soon' } },

    { key: 'psychology', label: 'Psychology', group: 'Mental health & wellbeing',
      nz: { reg: true, body: 'the New Zealand Psychologists Board', href: 'https://www.psychologistsboard.org.nz/' },
      au: { reg: true, body: 'the Psychology Board of Australia', href: 'https://www.psychologyboard.gov.au/' },
      support: { nz: 'recruiting', au: 'soon' } },

    { key: 'psychotherapy', label: 'Psychotherapy', group: 'Mental health & wellbeing',
      nz: { reg: true, body: 'the Psychotherapists Board of Aotearoa New Zealand', href: 'https://www.pbanz.org.nz/' },
      au: { reg: false, body: 'no national regulator', href: 'https://www.ahpra.gov.au/',
        note: 'Not a registered profession in Australia. Practice is governed by association membership and employer requirements.' },
      support: { nz: 'soon', au: 'soon' } },

    { key: 'socialwork', label: 'Social work', group: 'Mental health & wellbeing',
      nz: { reg: true, body: 'the Social Workers Registration Board', href: 'https://swrb.govt.nz/',
        note: 'Regulated under its own Act rather than the HPCA Act, but registration is still mandatory.' },
      au: { reg: false, body: 'the Australian Association of Social Workers', href: 'https://www.aasw.asn.au/',
        note: 'Not a registered profession nationally. Most employers require AASW eligibility.' },
      support: { nz: 'soon', au: 'soon' } },

    { key: 'anaesthetic', label: 'Anaesthetic technology', group: 'Perioperative & laboratory',
      nz: { reg: true, body: 'the Medical Sciences Council of New Zealand', href: 'https://www.mscouncil.org.nz/',
        note: 'A registered profession in New Zealand, unlike Australia.' },
      au: { reg: false, body: 'no national regulator', href: 'https://www.ahpra.gov.au/',
        note: 'Not an Ahpra-regulated profession. Certification and employer requirements apply instead.' },
      support: { nz: 'recruiting', au: 'soon' } },

    { key: 'medlab', label: 'Medical laboratory science', group: 'Perioperative & laboratory',
      nz: { reg: true, body: 'the Medical Sciences Council of New Zealand', href: 'https://www.mscouncil.org.nz/' },
      au: { reg: false, body: 'the Australian Institute of Medical and Clinical Scientists', href: 'https://www.aimsaustralia.org.au/',
        note: 'Not an Ahpra-regulated profession. Employers generally look for AIMS or equivalent recognition.' },
      support: { nz: 'soon', au: 'soon' } },

    { key: 'pharmacy', label: 'Pharmacy', group: 'Pharmacy & primary care',
      nz: { reg: true, body: 'the Pharmacy Council of New Zealand', href: 'https://pharmacycouncil.org.nz/' },
      au: { reg: true, body: 'the Pharmacy Board of Australia', href: 'https://www.pharmacyboard.gov.au/' },
      support: { nz: 'soon', au: 'soon' } },

    { key: 'paramedicine', label: 'Paramedicine', group: 'Pharmacy & primary care',
      nz: { reg: true, body: 'the Paramedic Council', href: 'https://www.paramediccouncil.org.nz/' },
      au: { reg: true, body: 'the Paramedicine Board of Australia', href: 'https://www.paramedicineboard.gov.au/' },
      support: { nz: 'soon', au: 'soon' } },

    { key: 'optometry', label: 'Optometry & optical dispensing', group: 'Pharmacy & primary care',
      nz: { reg: true, body: 'the Optometrists and Dispensing Opticians Board', href: 'https://www.odob.health.nz/' },
      au: { reg: true, body: 'the Optometry Board of Australia', href: 'https://www.optometryboard.gov.au/' },
      support: { nz: 'soon', au: 'soon' } },

    { key: 'osteopathy', label: 'Osteopathy', group: 'Manual & complementary therapies',
      nz: { reg: true, body: 'the Osteopathic Council of New Zealand', href: 'https://www.osteopathiccouncil.org.nz/' },
      au: { reg: true, body: 'the Osteopathy Board of Australia', href: 'https://www.osteopathyboard.gov.au/' },
      support: { nz: 'soon', au: 'soon' } },

    { key: 'chiropractic', label: 'Chiropractic', group: 'Manual & complementary therapies',
      nz: { reg: true, body: 'the Chiropractic Board', href: 'https://www.chiropracticboard.org.nz/' },
      au: { reg: true, body: 'the Chiropractic Board of Australia', href: 'https://www.chiropracticboard.gov.au/' },
      support: { nz: 'soon', au: 'soon' } },

    { key: 'chinesemed', label: 'Chinese medicine', group: 'Manual & complementary therapies',
      nz: { reg: true, body: 'the Chinese Medicine Council of New Zealand', href: 'https://www.chinesemedicinecouncil.org.nz/' },
      au: { reg: true, body: 'the Chinese Medicine Board of Australia', href: 'https://www.chinesemedicineboard.gov.au/' },
      support: { nz: 'soon', au: 'soon' } },

    { key: 'atsihp', label: 'Aboriginal & Torres Strait Islander health practice', group: 'Australia only',
      nz: null,
      au: { reg: true, body: 'the Aboriginal and Torres Strait Islander Health Practice Board of Australia', href: 'https://www.atsihealthpracticeboard.gov.au/' },
      support: { nz: 'na', au: 'soon' } },

    { key: 'other', label: 'Another healthcare profession', group: 'Anything else',
      nz: { reg: null, body: 'the relevant responsible authority', href: 'https://www.health.govt.nz/regulation-legislation/health-practitioners/responsible-authorities' },
      au: { reg: null, body: 'Ahpra and the National Boards', href: 'https://www.ahpra.gov.au/' },
      support: { nz: 'soon', au: 'soon' } }
  ];

  /* Profession pages that exist, per country. The single place a page is
     claimed — `support: 'recruiting'` above and an entry here must agree, and
     the internal plan flags it when they don't. */
  var PAGE = {
    nz: { imaging: 'radiographer-new-zealand', sonography: 'sonographer-new-zealand', radtherapy: 'radiation-therapist-new-zealand',
      physio: 'physiotherapist-new-zealand', ot: 'occupational-therapist-new-zealand', psychology: 'psychologist-new-zealand',
      anaesthetic: 'anaesthetic-technician-new-zealand', medicine: 'gp-new-zealand' },
    au: { imaging: 'radiographer-australia', sonography: 'sonographer-australia', radtherapy: 'radiation-therapist-australia',
      nuclearmed: 'nuclear-medicine-australia', medicine: 'consultant-radiologist-australia' }
  };

  /* Extra profession pages beyond the one linked per key — a profession can
     have more than one page (medicine has GP and consultant radiologist). */
  var EXTRA_PAGES = {
    nz: { medicine: ['consultant-radiologist-new-zealand'] },
    au: {}
  };

  /* Published registration guide / checklist PDFs, by profession and country.
     Presence here is what lets the planner offer a document rather than a
     promise. */
  var DOCS = {
    nz: {
      imaging: ['ethicare-mrtb-registration-guide.pdf', 'ethicare-mrtb-registration-checklist.pdf'],
      sonography: ['ethicare-mrtb-registration-guide.pdf', 'ethicare-mrtb-registration-checklist.pdf'],
      radtherapy: ['ethicare-mrtb-registration-guide.pdf', 'ethicare-mrtb-registration-checklist.pdf'],
      anaesthetic: ['Anaesthetic_Technician_MSCNZ_Registration_Guide.pdf', 'Anaesthetic_Technician_MSCNZ_Registration_Checklist.pdf'],
      ot: ['Occupational_Therapy_OTBNZ_Registration_Guide.pdf', 'Occupational_Therapy_OTBNZ_Registration_Checklist.pdf'],
      physio: ['ethicare-pbnz-registration-guide.pdf', 'ethicare-pbnz-registration-checklist.pdf'],
      psychology: ['ethicare-psychologist-nzpb-registration-guide.pdf', 'ethicare-psychologist-nzpb-registration-checklist.pdf'],
      medicine: ['GP_MCNZ_Registration_Guide.pdf', 'GP_MCNZ_Registration_Checklist.pdf', 'Radiologist_MCNZ_Registration_Guide.pdf', 'Radiologist_MCNZ_Registration_Checklist.pdf']
    },
    au: {
      imaging: ['ethicare-radiographer-australia-registration-guide.pdf', 'ethicare-radiographer-australia-registration-checklist.pdf'],
      radtherapy: ['ethicare-radiation-therapist-australia-registration-guide.pdf', 'ethicare-radiation-therapist-australia-registration-checklist.pdf'],
      nuclearmed: ['ethicare-nuclear-medicine-australia-registration-guide.pdf', 'ethicare-nuclear-medicine-australia-registration-checklist.pdf'],
      sonography: ['ethicare-sonographer-australia-accreditation-guide.pdf']
    }
  };

  var DOCS_PATH = '/assets/downloads/';

  /* WHICH PROFESSIONS THE PATHWAY CHECKER ANSWERS BY NAME.
     `pathway-checker-data.js` is the source of truth for pathway coverage, and this
     catalogue is deliberately wider: it names the correct regulator for 26 professions,
     which is useful on its own. The two lists disagreeing silently was the problem —
     someone could pick Podiatry here, tap through to the checker and find no podiatry.
     A value is the checker's profession id; null means the checker has no entry yet, and
     the plan then leads with the regulator instead of promising a route it cannot give.
     Add a profession to the checker (with verified rules) and change null to its id. */
  var CHECKER = {
    imaging: 'radiographer', sonography: 'sonographer', radtherapy: 'radiation-therapist',
    nuclearmed: 'nuclear-medicine', medicine: 'doctor', nursing: 'registered-nurse',
    midwifery: 'midwife', physio: 'physiotherapist', ot: 'occupational-therapist',
    speech: 'speech-language-therapist', dietetics: 'dietitian', psychology: 'psychologist',
    socialwork: 'social-worker', anaesthetic: 'anaesthetic-technician', other: 'other',
    physicianassoc: null, dentistry: null, podiatry: null, audiology: null,
    psychotherapy: null, medlab: null, pharmacy: null, paramedicine: null,
    optometry: null, osteopathy: null, chiropractic: null, chinesemed: null, atsihp: null
  };

  function get(key) { for (var i = 0; i < P.length; i++) if (P[i].key === key) return P[i]; return null; }
  function list() { return P.slice(); }
  function options() { return P.map(function (p) { return { value: p.key, label: p.label }; }); }

  /* Everything the planner needs about one profession in one country. */
  function forCountry(key, dest) {
    var p = get(key);
    if (!p) return null;
    var r = p[dest];
    var status = (p.support && p.support[dest]) || 'soon';
    var page = (PAGE[dest] || {})[key];
    var extra = ((EXTRA_PAGES[dest] || {})[key] || []);
    var docs = ((DOCS[dest] || {})[key] || []).map(function (f) { return DOCS_PATH + f; });
    return {
      key: key, label: p.label, group: p.group,
      available: r !== null,
      regulated: r ? r.reg : null,
      body: r ? r.body : null,
      href: r ? r.href : null,
      note: r ? (r.note || '') : '',
      status: status,
      checkerId: Object.prototype.hasOwnProperty.call(CHECKER, key) ? CHECKER[key] : null,
      page: page ? '/jobs/' + page : null,
      extraPages: extra.map(function (s) { return '/jobs/' + s; }),
      docs: docs
    };
  }

  return {
    list: list, get: get, options: options, forCountry: forCountry,
    pages: PAGE, extraPages: EXTRA_PAGES, docs: DOCS, docsPath: DOCS_PATH,
    checker: CHECKER,
    checked: '20 August 2026'
  };
})();
