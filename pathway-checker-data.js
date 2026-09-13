/* ================================================================
   ETHICARE — Registration Pathway Checker: REGULATORY DATA LAYER
   ----------------------------------------------------------------
   This file is the single source of truth for every regulator,
   pathway, URL, jurisdiction list and result copy in the checker.
   Edit HERE — never in the page component.

   Rules of the house:
   · Every record carries `lastReviewed`. Update it whenever you
     re-verify a record against the regulator's own website.
   · Anything flagged `verify: true` was written from the product
     brief and MUST be confirmed against the official source before
     the page is published.
   · Language: "may", "appears", "the regulator will assess" —
     never "you are eligible", never definite exam outcomes.
   · Tier-1 sources only (regulators), Tier-2 (official assessment
     authorities). Never blogs, agencies or anecdotes.
   ================================================================ */
/* ================================================================
   REVIEW OWNERSHIP — read before editing
   ----------------------------------------------------------------
   A stale checker is worse than no checker: it spends the credibility
   it was built to earn. This file therefore has an owner and a cadence.

   Owner:    Ethicare content owner (Sophie, or whoever holds site content)
   Cadence:  QUARTERLY review of every record, PLUS immediately on any
             regulator announcement that touches a pathway we name.
             Recent precedent: the NZ Physiotherapy Express Pathway changed
             in July 2026; Ahpra minimum English test scores changed in
             April 2026. Both would have silently falsified a card.

   Each review, per record:
     1. Open the regulator's own page (the officialUrl) — not a summary
        of it, not a cached copy, not an agency article.
     2. Confirm the pathway still exists under that name, the country
        list is unchanged, and the URL still resolves to the pathway.
     3. Re-stamp lastReviewed with the month and what was verified.
     4. If anything cannot be confirmed, DO NOT leave it standing:
        soften the record to status 'moreinfo' and let it say so. An
        honest "more information needed" costs nothing; a wrong country
        list costs a candidate money and us our credibility.

   Pre-launch verification pass COMPLETED 18 August 2026. All records
   checked against the regulators' own pages; no `verify: true` flags
   remain. Four claimed country lists turned out not to exist and were
   REMOVED rather than left standing (NZ nursing, NZ imaging, AU
   occupational therapy, and the MCNZ list as a registration-based
   gate) — in each case the regulator assesses individually or keys off
   something other than country, and the record now says so.

   Corrections made in that pass, worth knowing about:
     · AU nursing Pathway 1 is 6 countries (Canada = BC and Ontario
       only) + 1,800 hours since 1 Jan 2017 — not the 2 we had.
     · MCNZ Comparable Health System keys off RECENT PRACTICE (33 of
       the last 48 months) in one of 29 countries — not registration,
       and the count rose from 24. Competent Authority is UK/Ireland
       primary degree + internship there.
     · AU sonography: ASMIRT assessment is MANDATORY and comes BEFORE
       ASAR (we had it as optional and second). NZ is the only country
       with pre-approved courses; the UK is not.
     · MRPBA approves NZMRTB-accredited and UK HCPC-approved programmes
       awarded 2010 onwards. Ireland was never on that list.
     · AU occupational therapy turns on WFOT approval of the programme.
   ================================================================ */
(function () {
  'use strict';

  var SITE = ''; // root-relative — canonical URLs on the live site
  var GUIDE_AU = SITE + '/guides/australia-registration';
  var GUIDE_NZ = SITE + '/guides/new-zealand-registration';
  var JOBS = SITE + '/jobs/';
  var CONTACT = SITE + '/contact';
  var LAST = 'August 2026'; // default review stamp

  /* ---------- result statuses (the only six allowed) ---------- */
  var STATUSES = {
    streamlined: { label: 'Streamlined pathway may apply',      pillCss: 'background:#E3ECE5;color:#2F5E49' },
    selfcheck:   { label: 'Official self-check available',      pillCss: 'background:#02615D;color:#FCFBF8' },
    individual:  { label: 'Individual qualification assessment',pillCss: 'background:rgba(2,97,93,.09);color:#02615D' },
    additional:  { label: 'Additional assessment may be required', pillCss: 'background:#F7F4EE;color:#A34438;border:1px solid #EBDFD3' },
    moreinfo:    { label: 'More information needed',            pillCss: 'background:#F3F7F4;color:#555555' },
    employer:    { label: 'Employer-specific requirements',     pillCss: 'background:#FAF7F3;color:#A34438;border:1px solid #EBDFD3' },
    /* seventh status, added Aug 2026 with the recruitment-scope change: the profession is
       regulated and the regulator is named, but Ethicare does not recruit it in that country.
       These cards deliberately carry NO pathway detail — regulator link only. */
    outside:     { label: 'Outside our current recruitment',    pillCss: 'background:#F3F7F4;color:#02615D;border:1px solid rgba(2,97,93,.28)' }
  };

  /* Copy for the "we don't recruit this" result. {country} is substituted at render. */
  var NOT_RECRUITED = {
    headline: 'We don\u2019t currently recruit this profession into {country}',
    paras: ['Ethicare is a specialist recruiter. This profession sits outside what we place into {country} at the moment, so we are not the right source for guidance on it \u2014 registration rules change often, and second-hand advice from a recruiter who does not work in your field is worse than none.',
      'The regulator below sets the rules and makes every registration decision. Go straight to them.'],
    regulatorsPage: SITE + '/resources/healthcare-regulators'
  };

  /* ---------- professions (Phase 1) ----------
     `supported` records where Ethicare ACTUALLY recruits, per country. False does not
     remove the profession from the picker — the candidate still gets a straight answer
     and the regulator — it removes the Ethicare pathway result and every recruitment CTA.
     Change these flags when the recruitment offering changes; nothing else needs editing. */
  var GROUPS = ['Medical imaging', 'Allied health', 'Theatre', 'Nursing', 'Medicine'];
  var PROFESSIONS = [
    { id: 'radiographer', supported: { nz: true, au: true },           label: 'Diagnostic Radiographer / MIT',   group: 'Medical imaging', record: 'imaging', jobs: { au: SITE + '/jobs/radiographer-australia', nz: SITE + '/jobs/radiographer-new-zealand' } },
    { id: 'radiation-therapist', supported: { nz: true, au: true },    label: 'Radiation Therapist',             group: 'Medical imaging', record: 'imaging', jobs: { au: SITE + '/jobs/radiation-therapist-australia', nz: SITE + '/jobs/radiation-therapist-new-zealand' } },
    { id: 'nuclear-medicine', supported: { nz: true, au: true },       label: 'Nuclear Medicine Technologist',   group: 'Medical imaging', record: 'imaging', jobs: { au: SITE + '/jobs/nuclear-medicine-australia', nz: JOBS } },
    { id: 'mri', supported: { nz: true, au: true },                    label: 'MRI Technologist',                group: 'Medical imaging', record: 'mri',     jobs: { au: JOBS, nz: JOBS } },
    { id: 'sonographer', supported: { nz: true, au: true },            label: 'Sonographer',                     group: 'Medical imaging', record: 'sonographer', jobs: { au: SITE + '/jobs/sonographer-australia', nz: SITE + '/jobs/sonographer-new-zealand' } },
    { id: 'physiotherapist', supported: { nz: true, au: false },        label: 'Physiotherapist',                 group: 'Allied health',  record: 'physiotherapist', jobs: { au: JOBS, nz: SITE + '/jobs/physiotherapist-new-zealand' } },
    { id: 'occupational-therapist', supported: { nz: true, au: false }, label: 'Occupational Therapist',          group: 'Allied health',  record: 'occupational-therapist', jobs: { au: JOBS, nz: SITE + '/jobs/occupational-therapist-new-zealand' } },
    { id: 'psychologist', supported: { nz: true, au: false },           label: 'Psychologist',                    group: 'Allied health',  record: 'psychologist', jobs: { au: JOBS, nz: SITE + '/jobs/psychologist-new-zealand' } },
    { id: 'speech-language-therapist', supported: { nz: false, au: false }, label: 'Speech & Language Therapist', group: 'Allied health',  record: 'speech-language-therapist', jobs: { au: JOBS, nz: JOBS } },
    { id: 'dietitian', supported: { nz: false, au: false },              label: 'Dietitian',                       group: 'Allied health',  record: 'dietitian', jobs: { au: JOBS, nz: JOBS } },
    { id: 'social-worker', supported: { nz: false, au: false },          label: 'Social Worker',                   group: 'Allied health',  record: 'social-worker', jobs: { au: JOBS, nz: JOBS } },
    { id: 'anaesthetic-technician', supported: { nz: true, au: false }, label: 'Anaesthetic Technician / ODP',    group: 'Theatre',        record: 'anaesthetic-technician', jobs: { au: JOBS, nz: SITE + '/jobs/anaesthetic-technician-new-zealand' } },
    { id: 'registered-nurse', supported: { nz: false, au: false },       label: 'Registered Nurse',                group: 'Nursing',        record: 'nursing', jobs: { au: JOBS, nz: JOBS } },
    { id: 'enrolled-nurse', supported: { nz: false, au: false },         label: 'Enrolled Nurse',                  group: 'Nursing',        record: 'nursing', jobs: { au: JOBS, nz: JOBS } },
    { id: 'midwife', supported: { nz: false, au: false },                label: 'Midwife',                         group: 'Nursing',        record: 'midwifery', jobs: { au: JOBS, nz: JOBS } },
    /* Medicine is split by ROLE, not by seniority, because the recruitment offering is
       role-specific: GPs into New Zealand, consultant radiologists into both. The two
       generic entries stay in the picker so a doctor in another field still gets a
       straight answer and the regulator — they are simply not roles we recruit.
       Aug 2026: anaesthesia, emergency medicine and psychiatry added as supported NZ
       roles alongside their new profession pages. The regulator record is the same
       ('doctor'); only the onward job link differs, which is the whole point of
       splitting by role. */
    { id: 'gp', supported: { nz: true, au: false },                      label: 'General Practitioner',            group: 'Medicine',       record: 'doctor', jobs: { au: JOBS, nz: SITE + '/jobs/gp-new-zealand' } },
    { id: 'radiologist', supported: { nz: true, au: true },              label: 'Consultant Radiologist',          group: 'Medicine',       record: 'doctor', specialist: true, jobs: { au: SITE + '/jobs/consultant-radiologist-australia', nz: SITE + '/jobs/consultant-radiologist-new-zealand' } },
    { id: 'anaesthetist', supported: { nz: true, au: false },            label: 'Consultant Anaesthetist',         group: 'Medicine',       record: 'doctor', specialist: true, jobs: { au: JOBS, nz: SITE + '/jobs/anaesthetist-new-zealand' } },
    { id: 'emergency-medicine', supported: { nz: true, au: false },      label: 'Emergency Medicine Specialist',   group: 'Medicine',       record: 'doctor', specialist: true, jobs: { au: JOBS, nz: SITE + '/jobs/emergency-medicine-new-zealand' } },
    { id: 'psychiatrist', supported: { nz: true, au: false },            label: 'Consultant Psychiatrist',         group: 'Medicine',       record: 'doctor', specialist: true, jobs: { au: JOBS, nz: SITE + '/jobs/psychiatrist-new-zealand' } },
    { id: 'doctor', supported: { nz: false, au: false },                 label: 'Doctor — another field',          group: 'Medicine',       record: 'doctor', jobs: { au: JOBS, nz: JOBS } },
    { id: 'specialist-doctor', supported: { nz: false, au: false },      label: 'Specialist or consultant — another speciality', group: 'Medicine', record: 'doctor', specialist: true, jobs: { au: JOBS, nz: JOBS } },
    { id: 'other', supported: { nz: false, au: false },                  label: 'Other healthcare profession',     group: '',               record: 'other', jobs: { au: JOBS, nz: JOBS } }
  ];

  /* ---------- jurisdiction lists that drive branching ---------- */
  var RULES = {
    /* Country conditions live at PATHWAY level: profession → destination → regulator →
       pathway → countries → the regulator's own term. There is deliberately NO global
       "comparable countries" list; a country's status under one profession's pathway says
       nothing about another's. Meeting a country condition is never eligibility on its own —
       the regulator's full criteria still apply. */
    nzPhysioExpress: {
      prof: 'physiotherapist', cc: 'nz', shortLabel: 'International Express Pathway',
      pathway: 'International Express Pathway',
      regulator: 'the Physiotherapy Board of New Zealand',
      basis: 'relevant qualifications and/or unrestricted registration',
      countries: ['United Kingdom', 'Ireland', 'Canada', 'South Africa'],
      url: 'https://physioboard.org.nz/international-express-pathway',
      lastReviewed: 'August 2026 (Express Pathway updated July 2026)'
    },
    /* The tier between Express and full General assessment, and the one nobody surfaces.
       The Board has pre-assessed specific QUALIFICATIONS — not countries — and identified
       the competencies it wants extra evidence for. You apply through the ordinary General
       Pathway and the Board identifies your degree and contacts you; there is no separate
       form to find. Verified 26 August 2026; the Board's page was updated 26 March 2026. */
    nzPhysioFastTrack: {
      prof: 'physiotherapist', cc: 'nz', shortLabel: 'International General: Fast Track',
      pathway: 'International General: Fast Track',
      regulator: 'the Physiotherapy Board of New Zealand',
      basis: 'a qualification the Board has already pre-assessed',
      countries: ['Fiji', 'Hong Kong'],
      detail: { Fiji: 'Fiji National University qualifications from 2013 onwards', 'Hong Kong': 'physiotherapy degrees granted in Hong Kong SAR since 2015' },
      url: 'https://physioboard.org.nz/i-want-to-be-registered/international-general-fast-track',
      lastReviewed: 'Verified 26 August 2026 against physioboard.org.nz'
    },
    /* Dietitians Board of New Zealand — verified 26 August 2026. Four named routes, and the
       thing that matters most is what they have in COMMON: every one ends in provisional
       registration with a 12-month supervised practice period, which requires an employer.
       Registration and the job are therefore NOT sequential here — you cannot finish
       registering without a post. Three core requirements gate all four routes. */
    nzDietitianRoutes: {
      prof: 'dietitian', cc: 'nz', shortLabel: 'Straight to Registration',
      /* matchOn 'recent': the Board separates its routes by where you have WORKED as a
         registered dietitian, not where you qualified. Read against the country panel too. */
      matchOn: 'recent',
      pathway: 'Straight to Registration pathway',
      basis: 'having worked as a registered dietitian in the United Kingdom or South Africa',
      countries: ['United Kingdom', 'South Africa'],
      alsoRoutes: [{ shortLabel: 'Straight to Examinations', countries: ['Ireland', 'Canada'] }],
      regulator: 'the Dietitians Board',
      straightToRegistration: ['United Kingdom', 'South Africa'],
      straightToExams: ['Ireland', 'Canada'],
      url: 'https://www.dietitiansboard.org.nz/Public/Public/Registration/Overseas-Trained.aspx',
      lastReviewed: 'Verified 26 August 2026 against dietitiansboard.org.nz'
    },
    auPhysioExpressFlyr: {
      prof: 'physiotherapist', cc: 'au', shortLabel: 'Express FLYR pathway',
      pathway: 'Express FLYR pathway',
      regulator: 'the Australian Physiotherapy Council',
      basis: 'a qualification gained in one of the countries on its current list',
      countries: ['United Kingdom', 'Ireland', 'Canada', 'Hong Kong', 'South Africa'],
      url: 'https://physiocouncil.com.au/international-physiotherapists/express-flyr-pathway',
      lastReviewed: 'August 2026 (Express FLYR country list verified 18 Aug 2026)'
    },
    auPhysioFlyr: {
      prof: 'physiotherapist', cc: 'au', shortLabel: 'FLYR pathway',
      pathway: 'FLYR pathway',
      regulator: 'the Australian Physiotherapy Council',
      basis: 'a qualification gained in one of the countries on its current list',
      countries: ['Netherlands', 'Singapore', 'Sweden', 'United States'],
      url: 'https://physiocouncil.com.au/international-physiotherapists/flyr-pathway',
      note: 'United States is limited to Texas, Massachusetts and California; Singapore applicants need a Bachelor-level qualification.',
      lastReviewed: 'August 2026 (FLYR country list verified 18 Aug 2026)'
    },
    /* MCNZ Comparable Health System — 29 countries, verified 26 August 2026 against
       mcnz.org.nz. The structural point: this pathway keys off where you have PRACTISED, not
       where you qualified. 33 of the last 48 months, at least 20 hours a week, in the same
       area of medicine and at a similar level to the New Zealand job. A doctor who trained in
       India and has spent four years in Singapore is on it; a doctor who trained in Italy and
       left a decade ago is not — the opposite of how every other list here works. Country
       names normalised to our own picker (Ireland, Netherlands, South Korea, United States,
       Croatia). It leads to PROVISIONAL general registration: 12 months supervised, and it
       needs a job offer at the same level and in the same area as your experience. */
    /* Verified 26 August 2026 against mcnz.org.nz — the Council names four vocational
       pathways and the qualification's ORIGIN decides which one, which is why a CCT and a
       South African, Canadian or US fellowship do not land in the same place. */
    nzVoc4: {
      prof: 'doctor', cc: 'nz', matchOn: 'qual', stage: 'smo',
      shortLabel: 'VOC4 fast-track — UK, Ireland or Australia',
      pathway: 'VOC4 Provisional Vocational (specialist) registration',
      regulator: 'the Medical Council of New Zealand',
      basis: 'an approved postgraduate medical qualification from the UK, Ireland or Australia, in an approved area of medicine',
      /* Australia is on the list for GENERAL PRACTICE ONLY (FRACGP). Reading the three
         countries as interchangeable across all nine areas is the error this note exists to
         stop — an Australian-fellowshipped anaesthetist is not a VOC4 applicant. */
      countryScope: 'The United Kingdom and Ireland appear across the list; Australia appears for general practice only (FRACGP).',
      countries: ['United Kingdom', 'Ireland', 'Australia'],
      url: 'https://www.mcnz.org.nz/registration/getting-registered/registration-pathways/pathways-to-registration-in-a-vocational-scope/voc4-provisional-vocational-registration/',
      qualListUrl: 'https://www.mcnz.org.nz/assets/Publications/Booklets/Approved-list-of-postgraduate-medical-qualifications-for-VOC4.pdf',
      qualListDate: '13 August 2026',
      processing: '20 working days from a complete application; psychiatry may take longer',
      prerequisites: [
        'An acceptable primary medical qualification',
        'An approved overseas postgraduate medical qualification — from the Council\u2019s named list',
        'An intention to practise in an approved area of medicine',
        'At least 24 months\u2019 clinical experience in that area in the past 5 years, at 0.5 FTE or more, INCLUDING 12 months within the last 18 months — all of it in a country the Council recognises as having a comparable health system',
        'A job offer in New Zealand at consultant or specialist level'
      ],
      /* Verified 27 August 2026 against the Council's VOC4 page (modified 25 August 2026).
         Three additions worth having:
          · The approved-qualification list was updated 13 August 2026 and now includes CHEMICAL
            PATHOLOGY, HAEMATOLOGY and MICROBIOLOGY. A pathologist told a year ago that VOC4 was
            closed to them may now be eligible — which is a reason to check the list by date, not
            from memory.
          · Additional information is required in THREE areas, not one: obstetrics & gynaecology,
            psychiatry, and anatomical pathology. O&G and psychiatry have published forms;
            anatomical pathology applicants are contacted directly, so there is nothing to
            download and no reason to think you have missed a step.
          · EPIC / MyIntealth verification must be UNDERWAY BEFORE you submit. The Council will
            not begin processing without evidence of that, so the 20-working-day clock does not
            start when you apply — it starts when verification is visibly moving.
         CESR / the GMC Portfolio Pathway is now RESOLVED — read at source in the list PDF itself
         (fetched 27 August 2026). Every United Kingdom entry on all nine areas is built the same
         way: the Fellowship or Membership AND (a CCT issued by the GMC or PMETB, OR a CCST issued
         by the Specialist Training Authority). There is no third limb. The Portfolio Pathway is
         not named anywhere in the document, so a doctor holding GMC specialist registration
         through it and no CCT/CCST does NOT satisfy the VOC4 approved-qualification test. That is
         a closed door on the fast track, not on registration: VOC3 assesses them as a completed
         specialist through the relevant Australasian college. Two further corrections the source
         forced (both were wrong here before): the CCT may be issued by the GENERAL MEDICAL
         COUNCIL as well as PMETB, and RADIOLOGY IS NOT ON THE LIST AT ALL — neither diagnostic
         and interventional radiology nor radiation oncology appears, so an FRCR holder with a
         CCT is a VOC3 applicant via RANZCR however complete their training is. */
      extraInfoNote: 'Obstetrics & gynaecology and psychiatry have published forms to complete. Anatomical pathology applicants are contacted directly by the Council, so there is nothing to download.',
      recentAdditions: ['chemical pathology', 'haematology', 'microbiology'],
      /* The nine areas, verbatim from the list PDF (A–I), read at source 27 August 2026. The
         list IS the eligibility test, so what is absent matters as much as what is present. */
      approvedAreas: [
        'Anaesthesia — UK, Ireland',
        'Dermatology — UK, Ireland',
        'Emergency medicine — UK only',
        'General practice — UK, Ireland, Australia',
        'Internal medicine — UK, Ireland',
        'Obstetrics and gynaecology — UK, Ireland',
        'Paediatrics (general) — UK, Ireland',
        'Pathology: anatomical, chemical, haematology, microbiology — UK only',
        'Psychiatry — UK, Ireland'
      ],
      notOnList: 'Radiology is not on the list — neither diagnostic and interventional radiology nor radiation oncology. Nor are surgery, ophthalmology, palliative medicine, public health medicine, rehabilitation medicine or urology. A completed specialist in any of those is a VOC3 applicant assessed by the relevant Australasian college, which is a different application with a different timeframe — not a worse outcome, but not the 20-working-day fast track either.',
      ukAwardRule: 'Every UK entry reads: the Fellowship or Membership AND either a Certificate of Completion of Training (CCT) issued by the General Medical Council or the Postgraduate Medical Education and Training Board, or a Certificate of Completion of Specialist Training (CCST) issued by the Specialist Training Authority of the Medical Royal Colleges. Ireland reads: the Membership or Fellowship AND a Certificate of Satisfactory Completion of Specialist Training (CSCST).',
      portfolioPathway: 'The GMC’s Portfolio Pathway (previously CESR) is not named anywhere on the list. Specialist registration obtained that way, without a CCT or CCST, does not meet the VOC4 approved-qualification test — so the fast track is not the application to make. VOC3 is, and it assesses you as the completed specialist you are.',
      voc3Carveouts: [
        'General medicine held together with another sub-specialty of internal medicine — assessed by the Royal Australasian College of Physicians through VOC3, not the fast track.',
        'Paediatric specialties other than general paediatrics, and dual-specialty paediatricians — also RACP through VOC3.'
      ],
      listUpdated: '13 August 2026',
      listUrl: 'https://www.mcnz.org.nz/assets/Publications/Booklets/Approved-list-of-postgraduate-medical-qualifications-for-VOC4.pdf',
      epicFirst: 'Primary source verification through EPIC / MyIntealth must be underway before you submit. The Council cannot start processing until it has evidence of that, so the 20-working-day target begins then — not on the day you apply.',
      registrationMeeting: 'Registration is completed at a meeting held IN New Zealand, within two weeks of your intended start date and only after you have arrived. Your practising certificate is issued about three days after it, and you cannot practise until both are done — so do not let an employer set a first clinical day in the week you land.',
      variations: 'Any change to your employment, position, supervisor or location needs a variation applied for at least 20 days ahead, and approved before you start the new arrangement.',
      lastReviewedDetail: 'Verified 27 August 2026 against mcnz.org.nz (page modified 25 August 2026) and against the approved-qualification list PDF itself, read at source the same day',
      extraInfoSpecialties: ['Obstetrics & gynaecology', 'Psychiatry', 'Pathology (anatomical)'],
      afterwards: 'Primary source verification through EPIC before you submit; three references on the RP6 form; a registration meeting in New Zealand within two weeks of your start date; supervised practice throughout provisional vocational registration; a COS5 application to move to the full vocational scope.',
      lastReviewed: 'Verified 27 August 2026 against mcnz.org.nz (page modified 25 August 2026) and the approved-qualification list dated 13 August 2026, read at source'
    },
    /* The country is necessary, never sufficient: VOC4 runs off the Council's list of APPROVED
       qualifications, named by awarding body and area of medicine. Treating "UK CCT" as
       automatic eligibility is the mistake to design against. */
    /* The Council's approved Australasian qualifications, verbatim, verified 26 August 2026.
       This list IS the definition: "if a postgraduate qualification isn't listed here, we
       consider it to be an overseas postgraduate qualification" — which is what sends an
       applicant to VOC3 or the VOC4 fast-track instead of VOC1/VOC2. So the fork is a
       FELLOWSHIP test, not a country test, and only the specialties we recruit are listed
       here; the full table stays on the Council's page where it is maintained. */
    nzApprovedAustralasian: {
      url: 'https://www.mcnz.org.nz/registration/getting-registered/registration-policy/approved-australasian-qualifications/',
      lastReviewed: 'Verified 26 August 2026 against mcnz.org.nz',
      byProfession: {
        gp: { area: 'general practice', quals: ['FRNZCGP — Fellowship of the Royal New Zealand College of General Practitioners'] },
        anaesthetist: { area: 'anaesthesia', quals: ['FANZCA — Fellowship of the Australian and New Zealand College of Anaesthetists'] },
        'emergency-medicine': { area: 'emergency medicine', quals: ['FACEM — Fellowship of the Australasian College for Emergency Medicine'] },
        psychiatrist: { area: 'psychiatry', quals: ['FRANZCP — Fellowship of the Royal Australian and New Zealand College of Psychiatrists'] },
        radiologist: { area: 'diagnostic and interventional radiology', quals: ['FRANZCR — Fellowship of the Royal Australian and New Zealand College of Radiologists'] }
      }
    },
    /* The Nursing Council's IQN self-assessment tool DOES name jurisdictions — an earlier
       review of this file recorded "no published country list", which was wrong. The list is
       not in the page body; it lives inside the tool's modal, which is why a surface read
       missed it. Verified 26 August 2026 by reading the tool itself.

       The structural point that must not be lost when this is rendered: the six jurisdictions
       are NOT an exemption list. The tool only reaches "may not have to sit the tests" when
       ALL THREE hold — education there, CURRENT registration there, and 1,800 hours of RN
       practice there in the last 10 years. Fail any one and it routes back to the competence
       assessment. So training in the UK on its own means nothing; a UK-trained nurse who has
       spent the last decade in the UAE goes to the exam route.

       Enrolled nurses never reach this question at all. */
    nzNursingSelfCheck: {
      prof: 'nursing', cc: 'nz',
      shortLabel: 'Competence assessment may not be required',
      pathway: 'Internationally Qualified Nurse — competence assessment may not be required',
      regulator: 'the Nursing Council of New Zealand',
      basis: 'education, current registration AND 1,800 hours of recent practice, all in the same recognised jurisdiction',
      countries: ['United States', 'United Kingdom', 'Ireland', 'Singapore', 'Canada'],
      canadaNote: 'Canada counts only for British Columbia and Ontario.',
      allThree: [
        'Your nursing education that led to registration was completed there',
        'You are CURRENTLY registered there',
        'You have worked at least 1,800 hours as a registered nurse there within the last 10 years'
      ],
      url: 'https://nursingcouncil.org.nz/Public/IQN/Home.aspx',
      lastReviewed: 'Verified 26 August 2026 by reading the Council\u2019s IQN self-assessment tool'
    },
    /* Every figure below read off the Council's own costs page, 26 August 2026. The two that
       candidates never budget for are the first two: they are payable BEFORE you may apply,
       and they are not in New Zealand dollars. */
    nzNursingCosts: {
      url: 'https://www.nursingcouncil.org.nz/IQN/H7.aspx',
      lastReviewed: 'Verified 26 August 2026 against nursingcouncil.org.nz',
      everyone: [
        { label: 'TruMerit document verification', amount: 'US$380', note: 'Payable before you can apply to the Council at all.' },
        { label: 'International criminal history check (Fit2Work)', amount: 'AU$155', note: 'Per country you have lived in.' },
        { label: 'Nursing Council application', amount: 'NZ$485', note: '' }
      ],
      competenceAssessment: [
        { label: 'Theory examination (Part A medication safety + Part B nursing knowledge)', amount: 'NZ$140', note: 'At a Pearson VUE centre, overseas or in New Zealand.' },
        { label: 'Orientation & preparation course', amount: 'NZ$500', note: 'In person in Christchurch.' },
        { label: 'Clinical examination — OSCE', amount: 'NZ$3,000', note: 'In person in Christchurch.' }
      ],
      resits: [
        { label: 'Re-sit Part A — medication safety', amount: 'NZ$32' },
        { label: 'Re-sit Part B — nursing knowledge', amount: 'NZ$108' },
        { label: 'Re-sit OSCE', amount: 'NZ$3,000' }
      ],
      alsoNote: 'Translation of documents into English, and travel and accommodation in Christchurch, are on top of all of this.'
    },
    /* NZPB, verified 26 August 2026 against psychologistsboard.org.nz (page modified 19 Aug
       2026). Five prescribed countries. The crucial framing: prescribed status buys a LOWER
       FEE, LESS DOCUMENTATION and a FASTER assessment — it is explicitly a cost-recovery
       classification, not an easier standard. Every overseas application is still assessed
       individually for equivalence, competence and fitness. Never render this as an exemption. */
    nzPsychPrescribed: {
      prof: 'psychologist', cc: 'nz',
      shortLabel: 'Prescribed country — lower fee, faster assessment',
      pathway: 'Overseas-trained — prescribed country',
      regulator: 'the New Zealand Psychologists Board',
      basis: 'psychology training completed in a country the Board treats as having similar training and regulation standards',
      countries: ['Canada', 'Ireland', 'South Africa', 'United Kingdom', 'United States'],
      buys: 'A lower application fee, no curriculum documents, and a faster assessment — not a lower standard and not an exemption.',
      url: 'https://psychologistsboard.org.nz/want-to-register/overseas-trained-how-to-register/',
      lastReviewed: 'Verified 26 August 2026 against psychologistsboard.org.nz'
    },
    /* The five criteria, verbatim in substance. The one candidates trip on is the LAST: you
       need registration in the country where you TRAINED and the country where you now LIVE.
       A South African-trained psychologist working unregistered in the UAE fails it. */
    nzPsychCriteria: [
      'A minimum six-year course of studies in psychology',
      'Graduation from an accredited training programme',
      '1,500 hours of supervised practice (an internship) AS PART OF the psychology qualification, closely supervised by a qualified psychologist',
      'An endpoint evaluation of the internship, or a passed licensing examination',
      'Registration as a psychologist in BOTH the country where you trained AND the country where you currently reside'
    ],
    /* Verified 26 August 2026 against the Board's fee schedule (page modified 22 Jul 2026).
       A vocational scope is a SECOND fee on top of registration, which is why a clinical
       psychologist's real cost is roughly triple the headline. Note the exclusion: the
       vocational-scope fee does not apply to the Neuropsychologist scope. */
    nzPsychFees: {
      url: 'https://psychologistsboard.org.nz/want-to-register/fees-and-levy/',
      lastReviewed: 'Verified 26 August 2026 against psychologistsboard.org.nz',
      ttmr: 'NZ$270',
      registration: { prescribed: 'NZ$720', nonPrescribed: 'NZ$1,080' },
      vocationalScope: { prescribed: 'NZ$540', nonPrescribed: 'NZ$900', note: 'Applies to a vocational scope such as Clinical, Counselling or Educational Psychologist. The prescribed rate also covers New Zealand-trained applicants. It does NOT apply to the Neuropsychologist scope.' },
      practisingCertificate: 'NZ$797',
      levy: 'NZ$92',
      worked: 'A clinical psychologist trained in a prescribed country pays roughly NZ$2,057 before practising — NZ$720 registration, NZ$540 vocational scope and NZ$797 for the first practising certificate. From a non-prescribed country the same three come to about NZ$2,777.',
      allNote: 'Application fees are not refundable, even if the application is declined.'
    },
    /* NMBA's IQRN registration standard — the two streamlined pathways, in force since
       April 2025. Verified 26 August 2026 against the NMBA media release and Ahpra's own
       fact sheet.

       The genuinely useful thing here, and the reason it is worth encoding rather than
       linking: PATHWAY 2 breaks the assumption that where you trained decides your route
       forever. A nurse who qualified in India or the Philippines, then passed the UK's CBT
       and worked in the NHS, may use the streamlined standard on the strength of the UK
       registration — not the Indian qualification. Most candidates assume the old
       NCLEX-plus-OSCE route automatically applies to them. Often it no longer does.

       Two exclusions that must travel WITH this, because they invert the usual expectation:
       nurses with SUBSTANTIALLY EQUIVALENT qualifications, and nurses holding a SOLE mental
       health nursing qualification, are NOT eligible under this standard and continue through
       the existing IQNM assessment process. "Streamlined" is not a synonym for "better route
       for everyone" — for some people it is simply the wrong door. */
    auIqrnStreamlined: {
      prof: 'nursing', cc: 'au',
      shortLabel: 'Streamlined IQRN standard',
      pathway: 'General registration for internationally qualified registered nurses',
      regulator: 'the Nursing and Midwifery Board of Australia',
      appliesTo: 'Registered nurses only — not enrolled nurses, and not nurse practitioners on their own account.',
      countries: ['United Kingdom', 'Ireland', 'United States', 'Canada', 'Singapore', 'Spain'],
      canadaNote: 'Canada counts only for British Columbia and Ontario.',
      pathway1: {
        label: 'Pathway 1 — you qualified in a comparable jurisdiction',
        criteria: ['A relevant nursing qualification completed in an NMBA-approved comparable jurisdiction', 'That qualification led to general registered-nurse registration there', 'At least 1,800 hours of registered-nurse practice in a comparable jurisdiction since 1 January 2017']
      },
      pathway2: {
        label: 'Pathway 2 — you qualified elsewhere, then registered in one',
        criteria: ['A nursing qualification completed OUTSIDE a comparable jurisdiction', 'You passed that jurisdiction\u2019s regulatory examination process for international nurses and gained GENERAL registered-nurse registration there', 'At least 1,800 hours of registered-nurse practice in a comparable jurisdiction since 1 January 2017'],
        ukCondition: 'The UK registers nurses in four fields — adult, children\u2019s, learning disabilities and mental health. For Pathway 2 you must have completed the CBT and hold registration in ADULT nursing. The other three fields do not meet it.'
      },
      notEligible: ['Nurses whose qualifications are assessed as substantially equivalent', 'Nurses holding a sole qualification in mental health nursing'],
      notEligibleRoute: 'Both continue through the NMBA\u2019s existing IQNM assessment process instead — which is not a worse outcome, just a different one.',
      timing: 'Ahpra puts the existing assessment route at typically 9\u201312 months, and an eligible streamlined application at 1\u20136 months depending on complexity.',
      orientation: 'Every internationally qualified nurse who registers must complete Part 2 of the orientation — online learning on the Australian healthcare context — within six months of registration.',
      url: 'https://www.nursingmidwiferyboard.gov.au/News/2025-01-27-media-release-IQRN.aspx',
      lastReviewed: 'Verified 26 August 2026 against the NMBA media release and Ahpra\u2019s IQRN fact sheet'
    },
    /* Australia's Expedited Specialist pathway — the closest analogue to New Zealand's VOC4,
       and the same trap: it runs off a named ACCEPTED QUALIFICATIONS LIST, assessed by the AMC
       and approved by the Board, not off a country and not off a specialty. Verified
       26 August 2026 against medicalboard.gov.au and Ahpra's January 2026 announcement.

       Status by specialty is deliberately three-valued, because "open", "being assessed" and
       "under consideration" are three different answers and collapsing them would be the
       single most misleading thing we could publish here. A dermatologist reading that
       dermatology is a "priority specialty" and concluding they can fast-track would be our
       fault, not theirs.

       DIAGNOSTIC RADIOLOGY IS NOT CONFIRMED. Ahpra said in January 2026 it was being assessed,
       and an April 2026 source still had it under assessment. It may since have been added.
       Do not upgrade it to 'open' without reading the Board's list — radiologists are one of
       the five specialties we recruit, so this is the row most likely to be wrong in our
       favour, which is exactly the direction we must not err in. */
    auExpeditedSpecialist: {
      prof: 'doctor', cc: 'au', stage: 'smo',
      shortLabel: 'Expedited Specialist pathway',
      pathway: 'Expedited Specialist pathway',
      regulator: 'the Medical Board of Australia',
      basis: 'a specialist qualification named on the Board\u2019s accepted qualifications list',
      whatItBuys: 'You apply directly to Ahpra for specialist registration, with no specialist-college comparability assessment.',
      byStatus: {
        open: { label: 'Open now', specialties: ['General practice', 'Anaesthesia', 'Obstetrics and gynaecology', 'Psychiatry', 'General medicine', 'General paediatrics'], note: 'General medicine and general paediatrics opened on 19 January 2026; general practice, anaesthetics, obstetrics and gynaecology and psychiatry were added across 2024 and early 2025.' },
        assessing: { label: 'Being assessed — not open', specialties: ['Diagnostic radiology'], note: 'Ahpra confirmed in January 2026 that diagnostic radiology qualifications were being assessed. Treat it as not yet available and check the Board\u2019s list before telling a radiologist otherwise.' },
        considering: { label: 'Under consideration — not open', specialties: ['Dermatology', 'Emergency medicine', 'General surgery', 'Otolaryngology'], note: 'Named as the next priorities. Being a priority specialty confers nothing — only a qualification actually added to the accepted list opens the pathway.' }
      },
      byProfession: {
        gp: { specialty: 'General practice', status: 'open' },
        anaesthetist: { specialty: 'Anaesthesia', status: 'open' },
        psychiatrist: { specialty: 'Psychiatry', status: 'open' },
        radiologist: { specialty: 'Diagnostic radiology', status: 'assessing' },
        'emergency-medicine': { specialty: 'Emergency medicine', status: 'considering' }
      },
      afterwards: 'Six months of supervised practice in Australia, with reports from the supervising health service and supervisors, plus Board-approved orientation and cultural safety requirements.',
      url: 'https://www.medicalboard.gov.au/Registration/International-Medical-Graduates/Expedited-specialist-pathway/Expedited-Specialist-pathway-accepted-qualification-list',
      lastReviewed: 'Verified 26 August 2026 against medicalboard.gov.au — diagnostic radiology status UNCONFIRMED, re-check before relying on it'
    },
    /* Where a specialist goes when the qualification is NOT on the accepted list. Not a
       lesser route — it is the normal one, and it is what most of our specialists will use. */
    auSpecialistRecognition: {
      prof: 'doctor', cc: 'au', stage: 'smo',
      shortLabel: 'Specialist recognition',
      pathway: 'Specialist pathway — specialist recognition',
      regulator: 'the relevant Australian specialist medical college',
      basis: 'an international specialist qualification that is not on the accepted qualifications list',
      prerequisites: [
        'A primary qualification in medicine and surgery from an institution recognised by BOTH the AMC and the World Directory of Medical Schools',
        'All training and examination requirements satisfied to practise in your specialty in your country of training'
      ],
      outcomes: ['Substantially comparable', 'Partially comparable', 'Not comparable'],
      outcomeNote: 'Substantially and partially comparable specialists are set requirements by the college to complete before specialist registration is granted.',
      url: 'https://www.medicalboard.gov.au/Registration/International-Medical-Graduates/Specialist-Pathway/Specialist-recognition.aspx',
      lastReviewed: 'Verified 26 August 2026 against medicalboard.gov.au'
    },
    /* Kept adjacent because it is the pathway most often mistaken for a way in. It is not. */
    auShortTermTraining: {
      prof: 'doctor', cc: 'au',
      shortLabel: 'Short term training in a medical specialty',
      pathway: 'Short term training in a medical specialty',
      regulator: 'the Medical Board of Australia',
      duration: 'Usually up to 24 months',
      warning: 'This pathway does NOT lead to specialist registration, or to ongoing registration in Australia. If you intend to stay, you need a different pathway — plan that before you come, not after.',
      url: 'https://www.medicalboard.gov.au/Registration/International-Medical-Graduates/Specialist-Pathway.aspx',
      lastReviewed: 'Verified 26 August 2026 against medicalboard.gov.au'
    },
    /* Australian OT — the process CHANGED on 27 October 2025 and most of the internet has
       not caught up. Verified 26 August 2026 against otcouncil.com.au.

       What changed: the OTC no longer does the Stage 1 desktop assessment for new applicants.
       Ahpra assesses the qualification itself. Applications lodged with the OTC BEFORE
       27 October 2025 are still run under the old Stage 1 / Stage 2 process.

       Why this matters more than most updates we carry: a therapist reading a 2024 guide will
       budget for Stage 1, then limited registration, then supervised practice, and conclude
       the move is slower and dearer than it now is. The single most useful thing we can tell
       them is that the first step they have read about no longer exists.

       NOT YET LIVE — DO NOT ADD: an additional EXPERIENCE-BASED streamlined registration
       standard for OTs (alongside dental, medical radiation and podiatry) went to consultation
       which closed February 2026 and, as at 26 August 2026, has not been implemented. It is not
       a route. Add it when the Board says so, not when a news article anticipates it. */
    auOtAssessment: {
      prof: 'occupational-therapist', cc: 'au',
      shortLabel: 'Ahpra qualification assessment',
      regulator: 'the Occupational Therapy Board of Australia, through Ahpra',
      changedOn: '27 October 2025',
      supersededProcess: 'the Occupational Therapy Council\u2019s Stage 1 desktop assessment',
      transitional: 'Applications lodged with the OTC before 27 October 2025 are still processed under the old Stage 1 and Stage 2 process, with the fees that went with it.',
      routes: [
        { label: 'Comparable Regulator', how: 'The Board publishes a list of comparable regulators. A qualification awarded in that jurisdiction and recognised for registration by that regulator, within a specified date range, is treated as substantially equivalent.' },
        { label: 'Recognised International Qualification', how: 'The Board publishes a list of named overseas qualifications it has already assessed as substantially equivalent. No individual portfolio assessment needed.' },
        { label: 'Individual Qualification Assessment', how: 'Everything else. Ahpra assesses the qualification on its own evidence — transcript, curriculum, placements, accreditation and WFOT approval at the time you completed it.' }
      ],
      outcomes: [
        { label: 'Substantially equivalent, or based on similar competencies', means: 'You can apply for general registration without completing supervised practice.' },
        { label: 'Relevant to occupational therapy, but not substantially equivalent', means: 'Ahpra refers you to the Occupational Therapy Council for an Assessment of Competence, which you complete while holding limited registration.' }
      ],
      competenceAssessment: {
        notAnExam: 'It is not an OSCE or a one-day examination.',
        needs: ['An Australian occupational therapy job', 'An Ahpra-approved workplace', 'An Ahpra-approved supervisor', 'Limited registration'],
        duration: 'Undertaken in the workplace while holding limited registration.'
      },
      migrationSeparate: 'The Occupational Therapy Council still runs skills assessments for MIGRATION. That is a different exercise from Ahpra\u2019s registration assessment, with its own application and fee — needing one does not mean you have done the other.',
      url: 'https://www.otcouncil.com.au/assessment/',
      boardUrl: 'https://www.occupationaltherapyboard.gov.au/Registration/Internationally-qualified-occupational-therapists.aspx',
      lastReviewed: 'Verified 26 August 2026 against otcouncil.com.au (27 October 2025 cutover, three routes, two outcomes, competence assessment model)'
    },
    /* MRTB scopes — verified 26 August 2026 against mrtboard.org.nz (TTMRA page, the Board's
       online examination policy, and the Gazette scope-of-practice notice).

       Two facts here are worth more to an imaging candidate than anything else on the page,
       and both are counter-intuitive:

       1. TTMRA covers Medical Imaging Technologist, Radiation Therapist and Nuclear Medicine
          Technologist — and NOT Sonographer or MRI Technologist. An Australian-registered
          radiographer who also does MRI has TWO different routes running at once: mutual
          recognition for the general scope, full internationally-qualified assessment for MRI.
          The Board states this twice, on the TTMRA page and in a footnote to the examination
          policy, which suggests they are tired of explaining it.

       2. CT does not need its own registration. It sits inside the MIT scope with appropriate
          training — as do mammography and angiography. Candidates routinely assume otherwise
          and go looking for a CT qualification requirement that does not exist.

       And one route that is genuinely hard to find: an experienced MRI radiographer with no
       formal MRI qualification is not shut out. The Board's prescribed qualifications include
       an approved undergraduate medical imaging or radiation therapy qualification, PLUS at
       least 2.5 years FTE MRI practice meeting its clinical experience requirements, PLUS a
       pass in the Board's MRI examination. */
    /* Australian medical radiation — the four doors. Verified 27 August 2026 against the MRPBA
       "Registration pathways for internationally qualified medical radiation practitioners" page
       (Board's own review stamp: 13 March 2026). Two things on that page are counter-intuitive
       and neither is obvious from a job advert:

       1. TTMRA is not "you qualified in New Zealand". It is NZ REGISTRATION PLUS A CURRENT
          PRACTISING CERTIFICATE. An NZ-qualified practitioner without a current APC cannot use
          mutual recognition at all — they apply for general registration and submit the NZ
          qualification like any other. Same degree, same person, completely different door,
          and the difference is a piece of paper that expires annually.

       2. The Comparable Regulator Pathway covers diagnostic radiography and radiation therapy
          ONLY. It is explicitly NOT available to nuclear medicine technologists. So a UK NM tech
          reading about the HCPC shortcut is reading about a door that is not theirs.

       And the ordering point that saves people money: the Board must assess the qualification
       PORTFOLIO BEFORE the registration application, not alongside it. */
    auMedRadRoutes: {
      cc: 'au',
      regulator: 'the Medical Radiation Practice Board of Australia',
      ttmra: { needs: ['Current registration with the Medical Radiation Technologists Board (NZ) as a medical imaging technologist, radiation therapist or nuclear medicine technologist', 'A current New Zealand practising certificate'], scopes: ['Medical Imaging Technologist', 'Radiation Therapist', 'Nuclear Medicine Technologist'] },
      comparableRegulators: [{ country: 'United Kingdom', body: 'HCPC' }, { country: 'Ireland', body: 'CORU' }],
      comparableDivisions: ['diagnostic radiography', 'radiation therapy'],
      comparableExcludes: 'nuclear medicine technology',
      recognisedTest: 'same institution, same year, same degree title',
      assessmentOutcomes: ['Substantially equivalent, or based on similar competencies, to an approved qualification', 'Relevant to the medical radiation practice profession', 'Not qualified for registration in Australia'],
      portfolioForm: 'Portfolio for the assessment of non-approved qualifications (PNAQ-91)',
      pathwaysUrl: 'https://www.medicalradiationpracticeboard.gov.au/Registration/Internationally-qualified-medical-radiation-practitioners/Registration-pathways-for-internationally-qualified-medical-radiation-practitioners',
      recognisedUrl: 'https://www.medicalradiationpracticeboard.gov.au/Registration/Internationally-qualified-medical-radiation-practitioners/Is-my-qualification-recognised',
      assessmentUrl: 'https://www.medicalradiationpracticeboard.gov.au/Registration/Internationally-qualified-medical-radiation-practitioners/Assessment-of-international-qualifications',
      examUrl: 'https://www.medicalradiationpracticeboard.gov.au/Registration/National-MRP-exam',
      lastReviewed: 'Verified 27 August 2026 against medicalradiationpracticeboard.gov.au (registration pathways page, Board review stamp 13 March 2026)'
    },
    nzMrtbScopes: {
      cc: 'nz',
      regulator: 'the Medical Radiation Technologists Board',
      ttmraScopes: ['Medical Imaging Technologist', 'Radiation Therapist', 'Nuclear Medicine Technologist'],
      ttmraExcluded: ['Sonographer', 'Magnetic Resonance Imaging Technologist'],
      withinMit: ['CT', 'mammography', 'angiography'],
      mriExperienceRoute: {
        needs: ['An undergraduate qualification in medical imaging or radiation therapy approved by the Board', 'At least 2.5 years FTE MRI practice meeting the Board\u2019s clinical experience requirements', 'A pass in a Board MRI examination']
      },
      apcTiming: 'You must wait until you are resident in New Zealand, or can provide evidence of your move, before applying for an annual practising certificate — and you cannot practise in a protected scope without both registration and a current APC.',
      processing: 'Up to 12 weeks where a full international qualification assessment is required, once the application is complete and the fee has been paid.',
      examIsNotAutomatic: true,
      examUrl: 'https://www.mrtboard.org.nz/pre-registration/online-examination',
      overseasUrl: 'https://www.mrtboard.org.nz/pre-registration/overseas-trained-how-to-register',
      ttmraUrl: 'https://www.mrtboard.org.nz/pre-registration/ttmra-2',
      scopeNoticeUrl: 'https://www.mrtboard.org.nz/resources-and-publications/notice-of-scope-of-practice-and-prescribed-qualifications-for-the-new-zealand-radiation-technologists-board',
      lastReviewed: 'Verified 27 August 2026 against mrtboard.org.nz (TTMRA scopes, online examination policy, internationally qualified processing time, Gazette scope notice)'
    },
    /* Nuclear medicine — the CT question. Verified 26 August 2026 against the Board's
       Competence Standards for Medical Imaging and Radiation Therapy Practitioners in Aotearoa
       New Zealand (19 July 2024), Domain 5 scope, page 34, which is explicit and worth quoting
       because it is the single thing a hybrid-imaging candidate most often gets wrong:

         Nuclear medicine practitioners operate gamma camera (SPECT/CT) and PET/CT imaging
         systems, with or without sealed sources and x-ray tubes for attenuation correction,
         anatomical fusion, transmission imaging, AS WELL AS diagnostic CT*.

         *For an NMT to operate a CT scanner for diagnostic CT scans they need to:
          1. Hold a practising certificate in the Medical Imaging Technologist scope; OR
          2. Demonstrate completion of a Board approved education programme in CT; OR
          3. Provide evidence of CT competency obtained elsewhere, deemed satisfactory and
             approved by the Board.

       So the line is not PET/CT versus no CT. It is what the CT is FOR. CT for attenuation
       correction, fusion and transmission sits inside the nuclear medicine scope. Independent
       DIAGNOSTIC CT needs one of those three things on top. A candidate who reads "I do PET/CT"
       as "I therefore need the MIT scope" over-scopes their own application; one who reads it
       as "CT is all covered" under-scopes it.

       The same document (Domain 3, page 24) confirms the MIT side: medical imaging practice
       "can extend beyond general imaging and fluoroscopy to encompass computed tomography (CT),
       mammography, and angiography" — which is the basis for the CT-inside-MIT note.

       CAVEAT ON THE SOURCE: the PDF the Board links carries a "Consultation" watermark over the
       19 July 2024 text. The substance matches the Board's published position and its scope
       notice, but do not quote it as final without re-checking the Board's current standards.

       NOT ENCODED, deliberately: an experience-plus-examination route into the NMT scope
       analogous to the 2.5-year MRI one. The Gazette notice sets out several prescribed
       qualification structures for NMT, but we have NOT verified a nuclear-medicine FTE
       threshold verbatim, and a wrong number here would send someone down a route that does not
       exist. Verify against the Gazette notice before printing any figure. */
    nzNuclearMedicineCt: {
      cc: 'nz',
      withinScope: ['attenuation correction', 'anatomical fusion', 'transmission imaging'],
      diagnosticCtRoutes: ['A practising certificate in the Medical Imaging Technologist scope', 'Completion of a Board-approved education programme in CT', 'Evidence of CT competency obtained elsewhere, deemed satisfactory and approved by the Board'],
      standardsUrl: 'https://www.mrtboard.org.nz/assets_mrtb/Uploads/20240722-MRTB-Competence-Standards-Website-Version.pdf',
      lastReviewed: 'Verified 26 August 2026 against the Board\u2019s competence standards (19 July 2024), Domain 5 scope'
    },
    /* What VOC3 actually measures an overseas psychiatrist against. Verified 26 August 2026
       against the Council's psychiatry scope page (modified 30 October 2024).

       This exists because "the college will assess your training against the FRANZCP standard"
       is not information — it tells a South African or Indian psychiatrist nothing about
       whether their training resembles it. The Council publishes the actual components, so we
       can show them and let the candidate compare their own CV. That converts an opaque verdict
       into something they can prepare for, which is the whole point of the checker.

       The Council's framing also matters: vocational registration in psychiatry needs EITHER
       the FRANZCP, OR an international postgraduate psychiatry qualification assessed against
       the FRANZCP standard. The second is a comparison, not a rejection — say so plainly. */
    nzPsychiatryStandard: {
      prof: 'psychiatrist', cc: 'nz',
      college: 'the Royal Australian and New Zealand College of Psychiatrists (RANZCP)',
      fellowship: 'FRANZCP',
      years: '7 years of training',
      components: [
        'At least 2 years of postgraduate general medical training',
        'A minimum of 3 years\u2019 basic training including general adult psychiatry, with mandatory 6-month FTE rotations in child &amp; adolescent psychiatry and consultation-liaison psychiatry',
        'A minimum of 2 years\u2019 advanced psychiatry training',
        'A formal education course in psychiatry',
        'Formative and summative workplace-based assessments, a psychotherapy case history, and a scholarly project and report',
        'Written and clinical examinations',
        'Participation in the RANZCP continuing professional development programme'
      ],
      url: 'https://www.mcnz.org.nz/registration/scopes-of-practice/vocational-and-provisional-vocational/types-of-vocational-scope/psychiatry/',
      lastReviewed: 'Verified 26 August 2026 against mcnz.org.nz (page modified 30 October 2024)'
    },
    /* NZSTA — verified 26 August 2026 against the association's MRA and Qualification Approval
       Framework pages. Two things here are worth more than the rest of the record combined.

       (1) The MRA is a TRAINING test, not a membership test. The association's own FAQ puts the
       question and answers it flatly: trained in a non-MRA country but gained membership of an
       MRA association through THEIR qualification approval process? "No" — because the MRA rests
       on equivalence of the training programmes in that country, and the approval processes are
       not equivalent to each other. So a South African-trained therapist who later joined the
       RCSLT is a QAP applicant, not an MRA one. Getting this wrong costs someone the $225 fee
       and six weeks, and it is exactly the shape of error a checker should catch.

       (2) Failing the dysphagia competency does not end the application — it moves it. You
       cannot apply under the MRA without it, but since 12 June 2023 you may apply under the QAP
       instead, and be granted Registered Membership carrying the condition "not dysphagia
       trained", which NZSTA says will restrict job opportunities in New Zealand. That is a real
       employment consequence stated plainly, so we state it plainly too. */
    nzNzsta: {
      prof: 'speech-language-therapist', cc: 'nz',
      body: 'NZSTA',
      selfRegulated: 'Speech-language therapy is self-regulated through NZSTA. There is no statutory register — but most New Zealand employers require NZSTA membership before they will employ you, so in practice it is the gate.',
      assoc: {
        asha: { name: 'ASHA', country: 'United States', holder: 'certificate holders' },
        sac: { name: 'SAC — Speech-Language & Audiology Canada', country: 'Canada', holder: 'certified members' },
        rcslt: { name: 'RCSLT', country: 'United Kingdom', holder: 'certified members' },
        spa: { name: 'Speech Pathology Australia', country: 'Australia', holder: 'certified members' },
        iaslt: { name: 'IASLT', country: 'Ireland', holder: 'full members' }
      },
      mra: {
        fee: 'NZ$225 processing fee plus a pro-rated membership for the current calendar year, non-refundable',
        url: 'https://speechtherapy.org.nz/membership/mutual-recognition-agreement',
        trainedRule: 'The MRA rests on the equivalence of training programmes in the signatory’s own country. Membership of an MRA association gained through that country’s own qualification approval process does not carry across — NZSTA says so directly.'
      },
      qap: {
        fee: 'NZ$900 processing fee plus a pro-rated membership for the current calendar year, non-refundable',
        processing: 'about six weeks from a complete application',
        url: 'https://speechtherapy.org.nz/membership/qualification-approval-framework',
        criteria: [
          'An acceptable speech-language therapy qualification that made you eligible to practise where you trained',
          'A minimum of one year of supervised clinical practice — no less than 36 weeks full-time, at least 30 hours a week of paid employment',
          'Certified evidence of 1,000 hours of practice within the past five years',
          'Demonstrated competency in communication disorders and dysphagia',
          'Evidence of a record of continuing professional development',
          'IELTS Academic 7.0 or above in all four modules, with no score below 7.0, if your qualification was completed in a language other than English or English is your second language',
          'A criminal conviction record for every country you have lived in for 12 months or more in the last ten years since turning 18'
        ],
        outcomes: ['Registered Membership', 'Registered Member — New Graduate', 'Registered Member — Return to Practice', 'More information sought', 'Referral to a senior academic where educational standards are in question', 'Declined']
      },
      dysphagiaCondition: 'not dysphagia trained',
      appealNote: 'The qualifications approval committee’s decision is final and cannot be appealed, and the fee is not refundable — which is the reason to get the route right before you pay rather than after.',
      lastReviewed: 'Verified 26 August 2026 against speechtherapy.org.nz (MRA and Qualification Approval Framework pages)'
    },
    /* Speech Pathology Australia — verified 26 August 2026 against the OSQCA Guide for
       Applicants V3 (April 2026). Read the primary guide rather than the summary page: the
       summary that circulates sits on an /Archive/Backups/ path and is wrong in two ways that
       matter.

       (1) THE 15-YEAR RECENCY RULE IS NOT IN THE GUIDE. Widely repeated, and we have therefore
       NOT encoded it. What Stage 1 actually asks for is evidence of employment as a speech
       pathologist in the country where you trained or where you have been working recently, with
       no stated year threshold. Inventing a threshold would tell someone with a ten-year gap they
       are ineligible when the Association has published no such bar.

       (2) OET IS ACCEPTED, not IELTS only — and the exemption is the part worth surfacing,
       because it saves a test fee: no English test at all if your entry-level qualification was
       conducted in English at a university in the UK, Canada, NZ, USA or Ireland. Note the
       exemption keys off the UNIVERSITY'S country, so an English-taught degree elsewhere does
       not qualify. SPA can still request evidence if anything raises a concern.

       Also verified: Canada is an MRA signatory but SPA is NOT currently accepting MRA
       applications from SAC members following changes to Canadian licensing — they go to OSQCA.
       That is the single most perishable fact here; re-check it before relying on it. */
    auSpa: {
      prof: 'speech-language-therapist', cc: 'au',
      body: 'Speech Pathology Australia',
      credential: 'Certified Practising Speech Pathologist (CPSP)',
      whyCredential: 'CPSP is what unlocks the funding schemes: registered NDIS providers must hold it, and it is required for Medicare, private health insurers, the Commonwealth Home Support Program, and to be employed under the Health Professionals and Support Services Award.',
      assoc: {
        asha: { name: 'ASHA', credential: 'Certificate of Clinical Competence (CCC-SLP)', country: 'United States' },
        sac: { name: 'SAC', credential: 'Certified Speech-Language Pathologist, S-LP(C)', country: 'Canada', suspended: true },
        iaslt: { name: 'IASLT', credential: 'Member (MIASLT)', country: 'Ireland' },
        nzsta: { name: 'NZSTA', credential: 'Full Member', country: 'New Zealand' },
        'nzsta-pre93': { name: 'NZSTA', credential: 'Full Member', country: 'New Zealand', excluded: 'graduated before 1993' },
        rcslt: { name: 'RCSLT', credential: 'Certified Member (Cert MRCSLT)', country: 'United Kingdom' }
      },
      canadaNote: 'Canada is an MRA signatory, but following recent changes to Canadian licensing requirements Speech Pathology Australia is not currently accepting MRA applications from SAC members. Canadian applicants apply through OSQCA instead.',
      stages: [
        { n: 1, focus: 'Identity documents, qualifications and English language competency', fee: 'A$150', outcome: 'within 3 weeks of payment' },
        { n: 2, focus: 'Learning tasks — evidence-based practice, ethics, and cultural learning on working alongside Aboriginal and Torres Strait Islander Peoples', fee: 'A$400', outcome: 'within 7 weeks of submission' },
        { n: 3, focus: 'A portfolio of 5 to 8 case studies', fee: 'A$1,050', outcome: 'within 7 weeks of submission' },
        { n: 4, focus: 'An online interview of about 45 minutes, by videoconference only', fee: 'A$400', outcome: 'within 3 weeks of interview' }
      ],
      totalFee: 'A$2,000',
      resubmitNote: 'Up to three submissions of each stage, with the fee payable each time — so the A$2,000 is the best case, not the ceiling.',
      portfolioNote: 'The portfolio must cover communication AND swallowing across the lifespan, with a suggested minimum of two swallowing cases and two communication cases. Cases may be real and de-identified, partly real, or entirely simulated.',
      noOsce: 'There is no clinical OSCE. The assessment is a written portfolio and an online interview.',
      english: { ielts: 'IELTS Academic overall 8, with no subtest below 7.5', oet: 'OET overall 1800, with no element below 400', validity: 'Results must be from within 2 years of your application, and online tests are not accepted.', exemption: 'You are exempt entirely if you hold an entry-level speech pathology qualification conducted in English from a university in the UK, Canada, New Zealand, the USA or Ireland.' },
      aqf: 'Your qualification must be specific to speech pathology, include supervised clinical experience, and be comparable to AQF 7 — an Australian bachelor’s degree.',
      validity: 'CPSP eligibility lasts two years from approval. Within that time you must commence practice in Australia; otherwise you need further evidence to keep it, or a new skills assessment.',
      appeal: 'Appeals are narrow — process failure, proven bias, or significant new information. You cannot appeal the standard itself or the outcome on its merits. The fee is 25% of the original, refundable only if upheld, and a decision can take three months.',
      url: 'https://www.speechpathologyaustralia.org.au/',
      guideUrl: 'https://www.speechpathologyaustralia.org.au/Common/Uploaded%20files/Smart%20Suite/Smart%20Library/19391023-50c3-4dc0-8a2c-b7e846fc7d2e/osqca-guide-for-applicants-apr-2026.pdf',
      lastReviewed: 'Verified 26 August 2026 against the OSQCA Guide for Applicants V3 (April 2026)'
    },
    /* Medical Sciences Council — anaesthetic technicians. Verified 26 August 2026 against the
       Council's internationally qualified AT page. The record previously carried "UK ODP criteria
       to verify"; this closes that.

       The UK route is quoted almost verbatim because the Council's own wording is unusually
       strong. A UK-issued anaesthetic technology qualification, two years FTE post-qualification
       relevant specialised experience, and registration in good standing means an applicant
       "will be eligible for registration but may need to complete a period of supervised
       practice". "Will be eligible" is rare from a regulator and we can pass it on — but the
       supervised-practice caveat travels with it, and must not be dropped to make the answer
       tidier. Note also: the six-month supervision figure that circulates is the NZ NEW GRADUATE
       rule, not an overseas one. For an overseas applicant supervision is outcome-dependent, so
       we say "may be required" and give no number.

       TWO CORRECTIONS to what is commonly repeated, both of which cause rework:
        · Criminal conviction checks are for every country lived in 12+ months SINCE AGE 16,
          not 18. Checks must come to the Council directly from the issuing authority, and
          non-NZ ones go through Fit2Work at the applicant's cost (the Council pays for the
          NZ Ministry of Justice one).
        · A letter of good standing must be NO MORE THAN SIX MONTHS OLD at the date of
          application — so ordering it too early wastes it.

       FEES NOT ENCODED. The Council's page links a fee schedule and a newer one is said to take
       effect in February 2026; we have not verified the figures at source, and the examination
       fee in particular is large enough that a wrong number would mislead badly. Verify against
       the Council's fee schedule before printing any amount. */
    nzMscAt: {
      prof: 'anaesthetic-technician', cc: 'nz',
      regulator: 'the Medical Sciences Council',
      uk: {
        countries: ['United Kingdom'],
        criteria: ['A United Kingdom-issued qualification in anaesthetic technology', 'Two years’ full-time equivalent post-qualification relevant specialised anaesthetic technology experience', 'Registration and good standing with the regulator'],
        outcome: 'will be eligible for registration but may need to complete a period of supervised practice'
      },
      otherCountries: 'Assessed case by case against a standard set of criteria approved by the Council.',
      examRoute: 'A relevant bachelor’s or postgraduate degree, appropriate relevant clinical experience, and successful completion of the Council’s anaesthetic technician examination.',
      english: { pathways: 'Four pathways. Pathway two is evidence that English was the SOLE language of instruction and assessment for your primary qualification. Pathway three is two referees who speak English as a first language and are senior health practitioners, contacted directly by the Council.', test: 'Otherwise IELTS Academic — 7.0 in listening, reading and speaking, and 6.5 in writing — or OET at grade B, taken as the medicine or pharmacy test.', excluded: 'The IELTS Online and OET@Home tests are not accepted.' },
      cultural: 'The Foundational Course in Healthcare and Te Tiriti o Waitangi through Mauriora, paid for by you, with the completion certificate uploaded as part of the application.',
      police: 'A criminal conviction check for every country you have lived in for more than 12 months since the age of 16. Non-NZ checks go through Fit2Work at your cost; the Council covers the New Zealand Ministry of Justice check. Reports must reach the Council directly from the issuing authority.',
      goodStanding: 'A letter of good standing from every authority you have been registered with, no more than six months old at the date of your application.',
      referees: 'One personal referee who has known you a year or more and is not related to you, and one professional referee — ideally a registered anaesthetic technician.',
      processing: 'Up to 12 weeks where a full qualification assessment is required, once the application is complete and the fee paid.',
      apc: 'You cannot legally work in the scope without registration AND an annual practising certificate, and you must wait until you are resident or can evidence your move before applying for the APC.',
      feesUrl: 'https://www.mscouncil.org.nz/resources-2/',
      url: 'https://www.mscouncil.org.nz/pre-registration/overseas-trained-how-to-register/overseas-trained-registration-anaesthetic-technician',
      lastReviewed: 'Verified 26 August 2026 against mscouncil.org.nz'
    },
    /* Psychology in Australia — verified 26 August 2026 against psychologyboard.gov.au
       (transitional program and provisional registration pages).

       THE THING TO GET RIGHT is that three different questions get conflated into one, and a
       candidate who confuses them wastes months:
         1. Can I legally practise?      → Ahpra / Psychology Board of Australia.
         2. Can I call myself a clinical psychologist?  → an AREA OF PRACTICE ENDORSEMENT on top
            of general registration — Australia has no separate specialist registration in
            psychology, so "clinical psychologist registration" does not exist as a category.
         3. Do I need a migration skills assessment?    → the APS, which is NOT the registration
            gateway and never has been. A positive APS assessment does not let you practise.

       The provisional-registration point is worth stating kindly. An experienced consultant
       psychologist reads "provisional" as being treated like a new graduate. It is not that — it
       is the registration category you hold WHILE completing the Board-specified transitional
       program, and you can keep practising under it while your general registration application
       is decided, provided supervision continues.

       NOT ENCODED: the Trans-Tasman route for NZ-registered psychologists. It plainly exists,
       but the brief's specific condition (current NZ practising certificate) was not verified at
       source today — logged in the map instead. */
    auPsyBA: {
      prof: 'psychologist', cc: 'au',
      regulator: 'the Psychology Board of Australia',
      sequence: ['Apply to Ahpra as an internationally qualified applicant', 'The Board assesses your qualifications and supervised practice', 'Provisional registration, where transitional requirements apply', 'Complete the transitional program', 'Pass the national psychology exam — at any time during or after the program', 'Apply for general registration'],
      transitional: {
        work: 'A psychological position in Australia for at least three continuous calendar months, at least 17.5 hours a week. Two or more concurrent positions may be approved.',
        plan: 'A supervision plan agreed between you, your supervisor and your workplace, approved by the Board before you start, demonstrating competency in ethical, legal and professional matters to the standard of an Australian entry-level general psychologist.',
        finish: 'Your supervisor completes an assessment of capabilities, which you submit with the general registration application.',
        meanwhile: 'You may keep practising as a provisional psychologist while your general registration application is decided, provided you continue to receive regular supervision.'
      },
      exam: 'Required for general registration where your qualifications are international, unless the Board exempts you. It can be sat at any point during or after the transitional program — so it need not be the last thing you do.',
      provisionalCaveat: 'Provisional registration has renewal time limits under section 64 of the National Law; going beyond them needs the Board’s permission to continue training.',
      endorsement: 'Australia does not have specialist registration in psychology. The structure is general registration PLUS an area of practice endorsement, which needs an approved or substantially equivalent postgraduate qualification and a registrar program or comparable supervised practice in that area.',
      aps: 'The Australian Psychological Society is the assessing authority for SKILLED MIGRATION, and is a separate organisation from the regulator. A positive APS assessment does not permit practice; Ahpra registration does.',
      apsCodes: { clinical: 'Clinical Psychologist — ANZSCO 272311', 'ed-dev': 'Educational Psychologist — ANZSCO 272312', org: 'Organisational Psychologist — ANZSCO 272313' },
      apsFallback: 'Psychologist nec — ANZSCO 272399',
      url: 'https://www.psychologyboard.gov.au/registration/overseas-applicants/transitional-program.aspx',
      lastReviewed: 'Verified 26 August 2026 against psychologyboard.gov.au (transitional program and provisional registration pages)'
    },
    /* Australian Physiotherapy Council fees — verified 26 August 2026 against the Council's own
       fees and processing times page. Worth encoding because the spread is the single largest of
       any profession we cover: A$1,650 on Express FLYR against A$7,814 on APEP. Getting the
       pathway right before someone pays is worth more here than anywhere else on the site.

       TWO THINGS THE SUMMARY VERSIONS MISS, both encoded:
        · RESIT FEES. A capability assessment resit is A$2,928 — more than the entire Express
          FLYR pathway costs. The advertised total is the first-time-pass price.
        · The Council publishes processing times for Express FLYR (3 weeks), the eligibility
          assessment (3 weeks) and the skills assessment (8–10 weeks) — and for NOTHING ELSE.
          The "6–8 months for APEP" figure in circulation is NOT on this page, so it is not
          encoded. Timeframes run from payment confirmation, not from submission. */
    auPhysioFees: {
      prof: 'physiotherapist', cc: 'au',
      expressFlyr: { total: 'A\u00241,650', parts: ['Eligibility assessment A\u00241,415', 'Cultural safety training A\u0024235'] },
      flyr: { total: 'A\u00243,422', parts: ['Eligibility assessment A\u00241,170', 'Cultural safety training A\u0024235', 'Written assessment A\u00242,017'] },
      apep: { total: 'A\u00247,814', parts: ['Eligibility assessment A\u00241,170', 'Cultural safety training A\u0024235', 'Written assessment A\u00242,017', 'Capability assessment A\u00242,928', 'Clinical workshop A\u00241,464'] },
      resits: 'Written assessment A\u00242,017, capability assessment A\u00242,928, clinical workshop A\u00241,464 \u2014 each payable again on a resit.',
      migration: { complete: 'A\u00241,674', additional: 'A\u00241,471', processing: '8\u201310 weeks' },
      internalReview: 'A\u0024585',
      processing: { expressFlyr: '3 weeks', eligibility: '3 weeks', note: 'Timeframes run from the date the Council confirms your payment, not from submission, and only these three are published.' },
      url: 'https://physiocouncil.com.au/international-physiotherapists/fees-and-processing-times',
      lastReviewed: 'Verified 26 August 2026 against physiocouncil.com.au'
    },
    /* MRTB fees — the Gazette notice effective 16 February 2026, verified 26 August 2026.
       Covers ALL FIVE imaging scopes we recruit, so one verification closes five gaps.

       The pairing that matters is TTMRA \u0024407 against internationally qualified \u0024922. It is the
       same person and the same Board; what differs is the door. And because TTMRA does NOT
       reach sonography or MRI, an Australian-registered radiographer who also scans pays the
       cheap fee for the general scope and the expensive one for the other — which is the
       clearest possible illustration of why that exclusion matters.

       Two costs people do not see coming: the APC renewal rises from \u0024510 to \u0024711 if it arrives
       after 7 April, and the cardiac sonography registration examination assessment is \u00243,008,
       separate from and dearer than the \u00242,704 online exam. Every fee is NON-REFUNDABLE. */
    nzMrtbFees: {
      cc: 'nz',
      registration: { nzGraduate: 'NZ\u0024407', ttmra: 'NZ\u0024407', international: 'NZ\u0024922', additionalScope: 'NZ\u0024221' },
      apc: { initial: 'NZ\u0024510', renewalOnTime: 'NZ\u0024510', renewalLate: 'NZ\u0024711', lateFrom: 'received after 7 April' },
      exams: { online: 'NZ\u00242,704', cardiacSonography: 'NZ\u00243,008' },
      documents: { goodStanding: 'NZ\u0024162', certificate: 'NZ\u002469', restoration: 'NZ\u002458' },
      levy: 'NZ\u002434.50',
      allNote: 'Every fee the Board charges is non-refundable, and all are GST inclusive.',
      url: 'https://www.mrtboard.org.nz/resources-and-publications/fees-payable-to-te-poari-ringa-hangarau-iraruke-new-zealand-medical-radiation-technologists-board-from-16-february-2026',
      lastReviewed: 'Verified 26 August 2026 against the MRTB fees Gazette notice effective 16 February 2026'
    },
    /* Dietetics in Australia — verified 26 August 2026 against dietitiansaustralia.org.au
       (process for overseas-educated dietitians). This closes the record's own
       "overseas assessment criteria to verify" stamp.

       TWO THINGS THE PAGE IS EXPLICIT ABOUT and most summaries get wrong:

       1. Dietetics is NOT a registered profession in Australia, so an overseas-qualified
          dietitian CAN legally practise without any credential. Never tell someone they
          cannot work without APD — it is untrue. What is true is that most employers want
          DSR and APD before hiring, and that APDs are the ONLY dietitians who can hold a
          Medicare or Department of Veterans' Affairs provider number. That is a commercial
          argument, not a legal one, and it should be made as one.

       2. THE THREE-YEAR CLOCK, which is the real trap. It starts when you receive your DSR
          ASSESSMENT result — not when you pass an exam. Both exams must be passed AND the
          APD Program joined within it. Miss it and you restart the whole DSR process,
          resitting exams you have already passed. And each exam may only be attempted three
          times ever; fail a third time and you cannot reapply for DSR at all. So the two
          interact viciously: a resit consumes both an attempt and months of the clock.

       THE CALENDAR IS THE PRACTICAL CONSEQUENCE. The MCQ runs twice a year (March and
       September); the oral runs twice a year (around April and October). But MCQ results take
       up to six weeks, so a March MCQ result may not arrive before the April oral closes —
       which in practice pairs a March MCQ with the OCTOBER oral. Anyone budgeting 'exams done
       in two months' is wrong by about six. Both exams are online, so no travel to Australia.

       NOT VERIFIED, NOT ENCODED: the mutual-recognition partner list (NZ, Ontario), the
       English-test exemption country list, and every fee. Verify before printing any of them. */
    auDietitianDsr: {
      prof: 'dietitian', cc: 'au',
      body: 'Dietitians Australia',
      notRegistered: 'Dietetics is not a registered profession in Australia, so you may legally practise without a credential. Most employers, however, want Dietetic Skills Recognition and Accredited Practising Dietitian status before hiring, and APDs are the only dietitians who can hold a Medicare or Department of Veterans\u2019 Affairs provider number or provider status with most private health insurers.',
      stages: ['A DSR assessment \u2014 your recognition as a dietitian, recency of practice, tertiary qualification and English', 'A multiple-choice exam \u2014 online, 150 minutes, 120 questions, no reference materials, remotely supervised', 'An oral exam \u2014 a 120-minute counselling interview on Zoom, three scenarios, assessing nutrition assessment, education and counselling, and interprofessional practice'],
      calendar: { mcq: 'March and September', oral: 'around April and October', mcqResults: 'up to 6 weeks', oralResults: 'up to 4 weeks', assessment: 'up to 6 weeks from the date they hold your application and every document' },
      clock: { years: 3, from: 'the date you receive your DSR assessment result', consequence: 'Miss it and you restart the entire DSR process, resitting exams you have already passed.', attempts: 'Each exam may be attempted three times only. Fail a third time and you cannot reapply for DSR.' },
      placement: 'Evidence of 100 days of supervised practical placement completed as part of your dietetic education.',
      recency: 'Evidence of your dietetic practice over the past three years \u2014 not required if you qualified within the past three years. Recency expires three years after the later of your last working date or graduation, and both exams must be passed before it does.',
      cultural: 'The Aboriginal and Torres Strait Islander Cultural Awareness materials and assessment must be completed BEFORE you submit your application, not afterwards.',
      docTrap: 'You have six months to submit every document. Miss that, or omit one, and the assessment fails with no refund.',
      apd: 'Passing all three stages gives you DSR, which makes you eligible to join Dietitians Australia and apply to the APD Program \u2014 and you must join within three years of getting DSR.',
      migration: 'A separate process from DSR, with its own application. You may be eligible once you hold an accredited Australian qualification, or an overseas qualification plus a pass at stage two. So the migration door opens after the MCQ \u2014 before the oral exam and before APD.',
      url: 'https://dietitiansaustralia.org.au/working-dietetics/skills-recognition-australia/process-overseas-educated-dietitians',
      lastReviewed: 'Verified 26 August 2026 against dietitiansaustralia.org.au'
    },
    nzApprovedQualsUrl: 'https://www.mcnz.org.nz/registration/getting-registered/registration-pathways/pathways-to-registration-in-a-vocational-scope/factors-that-may-affect-your-application-for-a-vocational-scope/',
    nzVoc3Url: 'https://www.mcnz.org.nz/registration/getting-registered/registration-pathways/pathways-to-registration-in-a-vocational-scope/voc3-provisional-vocational-specialist-registration/',
    nzVoc12Url: 'https://www.mcnz.org.nz/registration/getting-registered/registration-pathways/pathways-to-registration-in-a-vocational-scope/voc1-vocational-specialist-registration/',
    nzProvVocUrl: 'https://www.mcnz.org.nz/registration/getting-registered/registration-pathways/pathways-to-registration-in-a-vocational-scope/provisional-vocational-registration/',
    /* Only two competent authorities, and the test is the primary degree PLUS the internship
       — not where you are registered now, which is the usual misreading of this route.
       Verified 26 August 2026 against mcnz.org.nz. */
    /* MCNZ's list of approved qualifications for LOCUM TENENS SPECIALIST APPOINTMENTS,
       transcribed from the Council's PDF. Two warnings that belong with it, not buried:
       (1) this is a locum route, NOT the vocational registration list — do not conflate it
       with VOC1–VOC4; and (2) the document is dated FEBRUARY 2015, so it is presented as an
       indication of shape, always with its date, and always pointing at the current page.
       It is the clearest published evidence of what the user described: recognition can turn
       on the exact awarding body, and in South Africa on the exact university. */
    nzLocumTenens: {
      title: 'Approved qualifications for locum tenens specialist appointments',
      docDate: 'February 2015',
      url: 'https://www.mcnz.org.nz/registration/getting-registered/registration-policy/approved-qualifications-for-locum-tenens-specialist-appointments/',
      lastReviewed: 'Transcribed 26 August 2026 from the Council\u2019s February 2015 PDF — confirm against the current page before relying on it',
      note: 'Most entries carry a condition on the award date: a Fellowship obtained after 30 September 2005 must be accompanied by a CCT, one after 12 January 1996 by a CCST, and older awards by a Certificate of Accreditation. The certificate matters as much as the fellowship.',
      byProfession: {
        anaesthetist: { area: 'Anaesthesia', byCountry: {
          'Australia and New Zealand': ['Fellowship of the Australian and New Zealand College of Anaesthetists', 'Fellowship of the Faculty of Anaesthetists, Royal Australasian College of Surgeons'],
          'Canada': ['Fellowship of the Royal College of Physicians and Surgeons of Canada', 'Certificate in Anaesthetics of the Royal College of Physicians and Surgeons of Canada'],
          'Ireland': ['Fellowship of the College of Anaesthetists of Ireland', 'Fellowship of the Faculty of Anaesthetists, Royal College of Surgeons in Ireland'],
          'South Africa': ['Fellowship of the College of Anaesthetists (South Africa)', 'Master of Medicine (Anaes), University of Cape Town', 'Master of Medicine (Anaes), University of Pretoria', 'Master of Medicine (Anaes), University of Stellenbosch'],
          'United Kingdom': ['Fellowship of the Royal College of Anaesthetists'],
          'United States': ['Certificate of the American Board of Anesthesiology', 'Certificate of the American Osteopathic Board of Anesthesiology']
        } },
        radiologist: { area: 'Diagnostic and interventional radiology', byCountry: {
          'Australia and New Zealand': ['Fellowship of the Australian and New Zealand College of Radiologists'],
          'Canada': ['Fellowship in Diagnostic Radiology of the Royal College of Physicians and Surgeons of Canada', 'Specialist Certificate in Diagnostic Radiology of the Royal College of Physicians and Surgeons of Canada'],
          'South Africa': ['Fellowship of the Faculty of Radiology (Diagnostic) of the College of Medicine of South Africa', 'Fellowship of the College of Radiologists (Diagnostic) of South Africa', 'Fellowship of the College of Diagnostic Radiologists of South Africa'],
          'United Kingdom': ['Fellowship of the Royal College of Radiologists of London'],
          'United States': ['Certificate of the American Board of Radiology', 'Certificate of the American Osteopathic Board of Radiology']
        } },
        'emergency-medicine': { area: 'Emergency medicine', byCountry: {
          'Australia and New Zealand': ['Fellowship of the Australasian College for Emergency Medicine'],
          'United Kingdom': ['Fellowship of the College of Emergency Medicine'],
          'United States': ['Certificate of the American Board of Emergency Medicine', 'Certificate of the American Osteopathic Board of Emergency Medicine']
        } },
        gp: { area: 'General practice', byCountry: {
          'Australia': ['Fellowship of the Royal Australian College of General Practitioners'],
          'Canada': ['Fellowship of the College of Family Physicians of Canada', 'Certificate of the College of Family Physicians of Canada'],
          'Hong Kong': ['Fellowship of the Hong Kong College of General Practitioners'],
          'Ireland': ['Membership of the Irish College of General Practitioners'],
          'United Kingdom': ['Fellowship of the Royal College of General Practitioners', 'Membership of the Royal College of General Practitioners'],
          'United States': ['Certificate of the American Board of Family Practice', 'Certificate of the American Board of Family Medicine', 'Certificate of the American Osteopathic Board of Family Physicians']
        } },
        psychiatrist: { area: 'Psychiatry', byCountry: {
          'Australia and New Zealand': ['Fellowship or Membership of the Royal Australian and New Zealand College of Psychiatrists'],
          'Canada': ['Fellowship in Psychiatry from the Royal College of Physicians and Surgeons of Canada', 'Certificate in Psychiatry from the Royal College of Physicians and Surgeons of Canada'],
          'United Kingdom': ['Fellowship of the Royal College of Psychiatrists', 'Membership of the Royal College of Psychiatrists'],
          'United States': ['Certificate of the American Board of Psychiatry and Neurology', 'Certificate of the American Osteopathic Board of Neurology and Psychiatry']
        } }
      }
    },
    nzDoctorCompetentAuthority: {
      prof: 'doctor', cc: 'nz', matchOn: 'qual',
      shortLabel: 'Competent authority pathway — UK and Ireland',
      pathway: 'Competent authority pathway',
      regulator: 'the Medical Council of New Zealand',
      basis: 'a primary medical degree AND an internship completed in the UK or Ireland',
      countries: ['United Kingdom', 'Ireland'],
      url: 'https://www.mcnz.org.nz/registration/getting-registered/registration-pathways/general-scope/uk-and-irish-medical-graduates-competent-authority/',
      lastReviewed: 'Verified 26 August 2026 against mcnz.org.nz'
    },
    nzDoctorComparable: {
      prof: 'doctor', cc: 'nz', matchOn: 'recent',
      shortLabel: 'Comparable Health System pathway',
      pathway: 'Comparable Health System pathway',
      regulator: 'the Medical Council of New Zealand',
      basis: '33 of the last 48 months practising in a comparable health system',
      /* Verified 26 August 2026: this sits under the GENERAL scope, which the Council
         describes as resident doctors, RMOs and doctors in vocational training. A doctor who
         has COMPLETED specialist training — CCT, FRACP, CCST or equivalent — is normally a
         vocational applicant instead, and vocational registration is assessed by the relevant
         New Zealand college against its own standard, with no country list involved. Showing
         this list to a consultant without saying so would point them at the wrong scope. */
      scopeCaveat: 'This is a GENERAL scope route \u2014 the Council describes that scope as resident doctors, RMOs and doctors still in vocational training. If you have completed specialist training (CCT, FRACP, CCST or equivalent) you would normally apply for VOCATIONAL registration instead, which is assessed by the relevant New Zealand college against its own standard and does not use a country list at all.',
      countries: ['Australia', 'Austria', 'Belgium', 'Canada', 'Chile', 'Czech Republic', 'Denmark', 'Finland', 'France', 'Germany', 'Greece', 'Hong Kong', 'Iceland', 'Ireland', 'Israel', 'Italy', 'Japan', 'Luxembourg', 'Netherlands', 'Norway', 'Portugal', 'Croatia', 'South Korea', 'Singapore', 'Spain', 'Sweden', 'Switzerland', 'United Kingdom', 'United States'],
      url: 'https://www.mcnz.org.nz/registration/getting-registered/registration-pathways/general-scope/comparable-health-system/',
      lastReviewed: 'Verified 26 August 2026 against mcnz.org.nz'
    },
    auDoctorCompetentAuthority: {
      prof: 'doctor', cc: 'au', shortLabel: 'Competent Authority pathway',
      pathway: 'Competent Authority pathway',
      regulator: 'the Medical Board of Australia',
      basis: 'registration with one of its approved competent authorities',
      // Verified 18 Aug 2026 against the Medical Board's approved competent authorities table
      // (GMC/UK, MCC/Canada, ECFMG/USA, MCNZ/NZ, MCI/Ireland, NBOME/USA). Category A-G criteria still apply.
      countries: ['United Kingdom', 'Ireland', 'Canada', 'United States', 'New Zealand'],
      url: 'https://www.medicalboard.gov.au/Registration/International-Medical-Graduates/Competent-Authority-Pathway.aspx',
      lastReviewed: 'August 2026 (competent authorities verified 18 Aug 2026)'
    },
    nzOdpUkCountry: 'United Kingdom',
    nzOdpUk: {
      prof: 'anaesthetic-technician', cc: 'nz', shortLabel: 'UK-trained ODP route',
      pathway: 'defined route for UK-trained practitioners',
      regulator: 'the Medical Sciences Council of New Zealand',
      basis: 'a UK qualification, relevant post-qualification experience and registration in good standing',
      countries: ['United Kingdom'],
      lastReviewed: LAST
    },
    /* OTBNZ ABRIDGED PATHWAY — verified 26 August 2026 against otboard.org.nz.
       Four things were wrong here before that check, and each had shipped:
         · The Board calls it the ABRIDGED PATHWAY. "Express Pathway" is the PHYSIOTHERAPY
           Board's term for its own scheme — the two were being conflated.
         · It is not a WFOT country list. The gate is a qualification obtained in the UK,
           Ireland, Canada or South Africa AND current registration in one of those countries.
           A 54-country WFOT dropdown implied an eligibility that does not exist.
         · WFOT accreditation is a SECOND condition on top of the country test, not the test.
         · The Board's own page is internally inconsistent: the heading and intro name four
           countries including South Africa, while the Qualification section names only the UK,
           Ireland and Canada for the WFOT-accredited facility. We surface that rather than
           resolve it — quietly resolving a regulator's ambiguity is how someone ends up on
           the wrong application form. Pathway effective 18 August 2023. */
    nzOtAbridged: {
      prof: 'occupational-therapist', cc: 'nz', shortLabel: 'Abridged pathway',
      pathway: 'abridged pathway',
      regulator: 'the Occupational Therapy Board of New Zealand',
      countries: ['United Kingdom', 'Ireland', 'Canada', 'South Africa'],
      wfotNamed: ['United Kingdom', 'Ireland', 'Canada'],
      wfotUrl: 'https://www.wfot.org/programmes/education/wfot-approved-education-programmes',
      url: 'https://otboard.org.nz/site/rp/overseas?nav=sidebar',
      abridgedUrl: 'https://www.otboard.org.nz/site/rp/overseas-abridged',
      fee: 'NZD$1,265 including GST',
      apc: 'NZD$588 for up to 12 months, or NZD$190 for up to 3 months',
      processing: 'up to 6 weeks once everything, including the posted hard copies, has arrived',
      lastReviewed: 'Verified 26 August 2026 against otboard.org.nz'
    },
    ttmraTerm: 'Trans-Tasman Mutual Recognition',
    psychNzCautionLevels: ['certificate', 'diploma', 'advanced-diploma', 'bachelors', 'pg-cert'],
    ttmra: {
      why: 'Because you\u2019re currently registered in {country}, the Trans-Tasman Mutual Recognition arrangements may entitle you to registration in the equivalent scope on the other side of the Tasman. You still apply to the regulator, which confirms eligibility.',
      lastReviewed: LAST
    }
  };

  /* ----------------------------------------------------------------
     RECOGNITION OUTLOOK (likelihood) LAYER
     Drives the "Recognition outlook" meter on each result card.
     Tiers:  strong   — streamlined recognition more likely
             assessed — individual assessment, outcome varies
             exam     — exam / competence assessment commonly required
     `strong.basis`: 'training' matches the country of training;
     'registration' matches the country of current registration.
     EVERY country list below was verified against the regulator's own
     page on 18 Aug 2026; lastReviewed records what was checked.
     A record with NO country list is DELIBERATE, not unfinished — it
     means the regulator publishes no such list, and inventing one is
     the worst thing this file could do.
     Records with no entry (AU anaesthetic technician, "other") show
     no meter. {country} is replaced with the matched country.
     ---------------------------------------------------------------- */
  var OUTLOOK_TIERS = {
    strong:   { short: 'Streamlined',  label: 'A streamlined route looks more likely',     on: 'background:#2F5E49;color:#FCFBF8', off: 'background:#F3F7F4;color:#555555' },
    assessed: { short: 'Case-by-case', label: 'Expect an individual assessment',           on: 'background:#02615D;color:#FCFBF8', off: 'background:#F3F7F4;color:#555555' },
    exam:     { short: 'Exam likely',  label: 'Plan for an exam or competence assessment', on: 'background:#02615D;color:#FCFBF8', off: 'background:#F3F7F4;color:#555555' }
  };
  var OUTLOOKS = {
    'imaging.au': { base: 'assessed', ttmra: true, lastReviewed: 'August 2026 (MRPBA registration pathways verified 27 Aug 2026; Board page review stamp 13 Mar 2026)',
      strong: { basis: 'training', countries: ['United Kingdom', 'Ireland', 'New Zealand'], why: 'Your route may be shorter than a full assessment. The Board treats the HCPC in the United Kingdom and CORU in Ireland as comparable regulators for the diagnostic radiography and radiation therapy divisions, and New Zealand registrants holding a current practising certificate can use Trans-Tasman mutual recognition \u2014 so a {country} qualification may not need individual assessment at all. Check your own award, and the year it was accredited.' },
      whys: { assessed: 'Australia has four doors rather than one, and which one you are at is settled before you spend anything: Trans-Tasman mutual recognition for New Zealand registrants with a current practising certificate; the Comparable Regulator Pathway for HCPC- or CORU-accredited diagnostic radiography and radiation therapy qualifications; the Recognised International Qualification Pathway where the Board has already assessed the same institution, year and degree title; and otherwise a portfolio assessment, which must happen before you apply for registration. An examination is not automatic \u2014 it is used where the Board decides a more detailed assessment of capability is required.' } },
    /* NO country list: MRTB publishes no comparable-country list \u2014 it assesses each
       qualification against the scope applied for. Australian registrants use TTMRA. */
    'imaging.nz': { base: 'assessed', ttmra: true, lastReviewed: 'August 2026 (verified 18 Aug 2026 \u2014 no published country list; assessed per scope)',
      whys: { assessed: 'MRTB assesses each overseas qualification and your clinical experience against the scope you\u2019re applying for; where a qualification isn\u2019t equivalent, its online examination pathway can be offered.' } },
    'sonographer.au': { base: 'assessed', lastReviewed: 'August 2026 (ASMIRT pre-approved course list + ASAR Category 1B verified 18 Aug 2026)',
      strong: { basis: 'training', countries: ['New Zealand'], why: 'New Zealand diagnostic radiography / medical imaging technology and radiation therapy degrees are currently the only pre-approved overseas courses ASMIRT recognises, which means an accelerated assessment. No other country currently has pre-approved courses.' },
      whys: { assessed: 'The order matters: every sonographer qualified outside Australia must have their qualifications and experience assessed by ASMIRT first, and those issued a Certificate of Recognition in Ultrasound then apply to ASAR under Category 1B. ASMIRT also requires at least one year full-time-equivalent clinical experience in your country of origin, gained within the past five years, before you apply.' } },
    'sonographer.nz': { base: 'assessed', lastReviewed: 'August 2026 (verified 18 Aug 2026 \u2014 MRTB assesses the sonographer scope individually)',
      whys: { assessed: 'MRTB assesses each overseas qualification and your clinical experience against the sonographer scope of practice.' } },
    'physiotherapist.au': { base: 'exam', ttmra: true, lastReviewed: 'August 2026 (FLYR lists verified 18 Aug 2026)',
      strong: { basis: 'training', countries: RULES.auPhysioExpressFlyr.countries, why: 'The Council\u2019s Express FLYR route currently covers eligible physiotherapists who trained in {country} \u2014 eligibility assessment and cultural safety training, with no written assessment.' },
      also: { tier: 'assessed', basis: 'training', countries: RULES.auPhysioFlyr.countries, why: 'The Council\u2019s FLYR route currently covers {country} \u2014 faster than the standard pathway, but it still includes an online written assessment.' },
      whys: { exam: 'Physiotherapists outside the FLYR country lists complete the Australian Physiotherapy Entry Pathway, which includes written and clinical assessments.' } },
    'physiotherapist.nz': { base: 'assessed', ttmra: true, lastReviewed: RULES.nzPhysioExpress.lastReviewed,
      strong: { basis: 'training', countries: RULES.nzPhysioExpress.countries, why: 'The Board\u2019s International Express Pathway currently covers eligible physiotherapists with relevant qualifications and/or unrestricted registration from {country}.' },
      whys: { assessed: 'The International General Pathway is an individual assessment of your qualification and registration history \u2014 some qualifications fast-track within it.' } },
    /* NO country list: the criterion is the PROGRAMME, not the country \u2014 a qualification
       WFOT-approved at the time you graduated and comparable to an Australian bachelor's or
       graduate-entry master's degree. A therapist from a country with no "recognised" status
       can still qualify on that basis, which is why no list belongs here. */
    'occupational-therapist.au': { base: 'assessed', ttmra: true, lastReviewed: 'August 2026 (WFOT criterion + OTC competence-assessment model verified 18 Aug 2026)',
      whys: { assessed: 'What matters is your programme: it needs to have been WFOT-approved when you graduated and comparable to an Australian bachelor\u2019s or graduate-entry master\u2019s degree. Where Ahpra assesses a qualification as relevant but not substantially equivalent, it refers you to the Occupational Therapy Council for an assessment of competence, which you complete under limited registration while working \u2014 the Council changed this model in October 2025, so older accounts of a two-stage audit are out of date.' } },
    'occupational-therapist.nz': { base: 'assessed', ttmra: true, lastReviewed: 'August 2026 (OTBNZ overseas page verified 18 Aug 2026)',
      whys: { assessed: 'OTBNZ assessors assess overseas qualifications individually, and overseas-qualified registrants complete its recertification programme with fortnightly supervision.' } },
    'psychologist.au': { base: 'assessed', ttmra: true, lastReviewed: LAST,
      whys: { assessed: 'Overseas psychology training is individually assessed, and additional examination and supervised-practice requirements can apply depending on the route.' } },
    'psychologist.nz': { base: 'assessed', ttmra: true, lastReviewed: 'August 2026 (prescribed countries, five criteria and full fee schedule verified 26 Aug 2026)',
      strong: { basis: 'training', countries: RULES.nzPsychPrescribed.countries, why: 'The Board treats {country} as having psychology training and regulation standards similar to New Zealand\u2019s, so it is one of five \u201Cprescribed\u201D countries. That buys you a lower application fee (NZ$720 rather than NZ$1,080), no curriculum documents, and a faster assessment \u2014 it is a cost-recovery classification, not a lower bar. Your qualifications, competence and fitness are still assessed individually, and the six-year and 1,500-hour training criteria apply exactly as they do to everyone else.' },
      whys: { assessed: 'The Board individually assesses training length, internship and registration evidence \u2014 and from July 2026, eligible overseas-trained psychologists enter the Raka Māui Competence Programme.' } },
    'nursing.au': { base: 'exam', ttmra: true, lastReviewed: 'August 2026 (NMBA Pathway 1 country list verified 18 Aug 2026)',
      strong: { basis: 'training', countries: ['United Kingdom', 'Ireland', 'United States', 'Canada', 'Singapore', 'Spain'], why: 'The NMBA\u2019s registration standard for internationally qualified registered nurses currently lists {country} among its approved countries for Pathway 1 \u2014 which also requires full registration there and at least 1,800 hours of registered-nurse practice since 1 January 2017. For Canada this currently covers British Columbia and Ontario only. The Self-check confirms your stream.' },
      whys: { exam: 'Nurses whose qualifications are relevant but not substantially equivalent commonly complete the outcomes-based assessment \u2014 a multiple-choice exam plus an OSCE. The Self-check confirms your stream.' } },
    /* CORRECTED 26 Aug 2026. This previously read "no published country list" \u2014 wrong. The
       Council's self-assessment tool names six jurisdictions; they sit inside the tool's modal,
       not the page body. Keyed on TRAINING because that is the tool's first gate (Q2), but the
       why states the other two conditions, because country alone is never the answer here. */
    'nursing.nz': { base: 'exam', ttmra: true, lastReviewed: 'August 2026 (self-assessment tool logic + all fees verified 26 Aug 2026)',
      strong: { basis: 'training', countries: RULES.nzNursingSelfCheck.countries, why: 'Your nursing education in {country} is the first of three conditions the Council\u2019s self-assessment tool tests. It only indicates you may NOT need the competence assessment when all three hold: education there, CURRENT registration there, and at least 1,800 hours of registered-nurse practice there within the last 10 years. Miss any one and the tool routes you back to the theory exam and the OSCE. For Canada this covers British Columbia and Ontario only, and it does not apply to enrolled nurses at all.' },
      whys: { exam: 'Documents are verified through TruMerit first (US$380), then the Council decides whether you need a competence assessment \u2014 a theory examination at a Pearson VUE centre (NZ$140) plus a two-day orientation (NZ$500) and an OSCE in Christchurch (NZ$3,000). Its self-assessment tool is the one thing that tells you whether that applies to you.' } },
    'doctor.au': { base: 'exam', ttmra: true, lastReviewed: 'August 2026 (competent authorities verified 18 Aug 2026)',
      strong: { basis: 'registration', countries: RULES.auDoctorCompetentAuthority.countries, why: 'Doctors on the Competent Authority pathway do not sit the AMC exams \u2014 your registration in {country} may be relevant. You must meet one of the seven category (A\u2013G) criteria, then complete 12 months of supervised practice.' },
      whys: { exam: 'The Standard pathway \u2014 the default for most internationally qualified doctors \u2014 includes the AMC CAT MCQ examination and a clinical assessment.' } },
    'doctor.nz': { base: 'assessed', ttmra: true, lastReviewed: 'August 2026 (Competent Authority + Comparable Health System criteria verified 18 Aug 2026)',
      strong: { basis: 'training', countries: ['United Kingdom', 'Ireland'], stageOnly: ['sho', 'registrar'], why: 'MCNZ\u2019s Competent Authority pathway is for doctors whose primary medical degree AND internship were both completed in {theCountry}.' },
      whys: { assessed: 'MCNZ\u2019s Comparable Health System pathway turns on where you have practised recently, not where you trained: at least 33 of the last 48 months, 20+ hours a week, in one or more of the countries on its comparable-health-system list \u2014 currently 29, and it changes, so check the list rather than assuming. Doctors without another available pathway may need NZREX Clinical. Start with the Council\u2019s self-assessment tool.' } },
    'anaesthetic-technician.nz': { base: 'assessed', lastReviewed: LAST,
      whys: { assessed: 'Overseas qualifications are assessed case by case, and the Council\u2019s AT examination can form part of some routes. The defined UK route is the main streamlined arrangement.' } }
  };
  OUTLOOKS['mri.au'] = OUTLOOKS['imaging.au'];
  OUTLOOKS['mri.nz'] = OUTLOOKS['imaging.nz'];

  /* ---------- English-language evidence ----------
     RECOGNISED COUNTRIES. Both regulators run a route that lets you skip the test, and both
     tie it to a country list rather than to nationality. The list below is the set that recurs
     in BOTH standards — it is deliberately the intersection, not a union, so we never tell
     someone they are exempt on a technicality that only one regulator honours. The conditions
     attached to it differ (Ahpra's primary-language pathway asks about citizenship AND primary
     language; its education pathway asks for secondary AND tertiary study in English in one of
     these countries; NZ regulators each set their own), which is why the note says "likely"
     and links the regulator rather than announcing an exemption. Verify against the specific
     regulator before this list is ever used to make a decision. */
  var ENGLISH = {
    recognisedCountries: ['Australia', 'Canada', 'Ireland', 'New Zealand', 'South Africa', 'United Kingdom', 'United States'],
    au: {
      url: 'https://www.ahpra.gov.au/Registration/Registration-Standards/English-language-skills/Accepted-English-language-tests.aspx',
      lastReviewed: 'August 2026 (accepted tests + 23 April 2026 score change verified 18 Aug 2026)'
    },
    nz: { url: null, lastReviewed: LAST } // NZ requirements sit with each regulator — link the record's official URL
  };

  /* ---------- shared "what happens next" ---------- */
  function steps(first, last) {
    return [
      first || 'Check the official regulator pathway',
      'Gather your qualification and registration documents',
      'Review the current English-language requirements',
      "Start the regulator's process",
      last || 'Explore suitable opportunities with Ethicare'
    ];
  }
  function btns(regLabel, regUrl, guideUrl, jobsLabel) {
    return [
      { label: regLabel, kind: 'primary', external: true, hrefKey: regUrl },
      { label: 'Ethicare registration guide', kind: 'secondary', hrefKey: guideUrl },
      { label: jobsLabel || 'Current opportunities', kind: 'ghost', hrefKey: 'JOBS' }
    ];
  }

  /* ================================================================
     RESULT RECORDS — one per regulatory model, per country.
     `hrefKey: 'JOBS'` is replaced with the profession's jobs URL.
     ================================================================ */
  var RECORDS = {

    imaging: {
      au: {
        regulator: 'Medical Radiation Practice Board of Australia (Ahpra)',
        status: 'additional',
        profNote: { title: 'Three divisions, and you register in one', body: 'Medical radiation practice is registered in three divisions — diagnostic radiography, radiation therapy and nuclear medicine. You register in the one your training supports, and moving between them later is a new qualification rather than an endorsement. Be deliberate about which division your application names.', css: 'mint' },
        headline: 'Your qualification will need to be checked against the Australian registration pathway',
        paras: ['Internationally qualified medical radiation practitioners are assessed by the Medical Radiation Practice Board of Australia. Depending on the qualification, the Board may recognise it or require additional assessment — the Board\u2019s decision, not this checker, determines your route.', 'Three separate things get confused here, and separating them early saves money. <strong>Registration</strong> with the Board, administered through Ahpra, is what lets you practise. A <strong>skills assessment by ASMIRT</strong> is a different process used for certain skilled-visa routes — it is not registration, it does not guarantee registration, and not everyone needs one. A <strong>radiation-use licence</strong> is issued separately again by the state or territory you will work in. Which of the three apply depends on your visa route and where you land.'],
        officialUrl: 'https://www.medicalradiationpracticeboard.gov.au/Registration/Qualifications.aspx',
        steps: steps('See whether MRPBA recognises your qualification', 'Explore Australian imaging opportunities with Ethicare'),
        buttons: btns('Check my qualification with MRPBA', 'OFFICIAL', GUIDE_AU, 'Australian imaging opportunities'),
        lastReviewed: LAST
      },
      nz: {
        regulator: 'Medical Radiation Technologists Board (MRTB)',
        status: 'individual',
        profNote: { title: 'Your scope is the job', body: 'The MRTB registers you into a defined scope of practice, and the scope — not your job title or your employer — sets what you may do. If a role asks for work outside it, that is a registration question rather than something a manager can sign off.', css: 'mint' },
        headline: 'Individual MRTB assessment',
        paras: ['The New Zealand Medical Radiation Technologists Board assesses overseas qualifications alongside relevant clinical experience. Your qualification will need to be assessed by MRTB for the scope of practice you are applying for.',
          'If MRTB decides a qualification isn\u2019t equivalent to the New Zealand standard, it may in some circumstances offer its online examination pathway — but only after assessing your application.'],
        officialUrl: 'https://www.mrtboard.org.nz/pre-registration/overseas-trained-how-to-register',
        steps: steps('Check MRTB\u2019s requirements for your scope of practice', 'Explore New Zealand imaging opportunities with Ethicare'),
        buttons: btns('Check MRTB requirements', 'OFFICIAL', GUIDE_NZ, 'New Zealand imaging opportunities'),
        lastReviewed: LAST
      }
    },

    mri: {
      au: {
        regulator: 'Medical Radiation Practice Board of Australia (Ahpra)',
        status: 'additional',
        profNote: { title: 'MRI is experience, not a separate registration', body: 'In Australia MRI sits inside medical radiation practice rather than standing as its own credential. Your MRI experience is evidence supporting an application in the relevant division, not a registration in its own right.', css: 'mint' },
        headline: 'MRI in Australia sits within medical radiation practice registration',
        paras: ['In Australia, MRI is generally practised within registered medical radiation practice. Your qualification and MRI experience will need to be checked against the Medical Radiation Practice Board\u2019s pathway for internationally qualified practitioners.', 'Keep three things separate: <strong>registration</strong> with the Board through Ahpra is what lets you practise; a <strong>skills assessment by ASMIRT</strong> is a different process used for certain skilled-visa routes and is not registration; and a <strong>radiation-use licence</strong> comes separately from the state or territory you will work in.'],
        officialUrl: 'https://www.medicalradiationpracticeboard.gov.au/Registration/Qualifications.aspx',
        steps: steps('See whether MRPBA recognises your qualification', 'Explore Australian imaging opportunities with Ethicare'),
        buttons: btns('Check my qualification with MRPBA', 'OFFICIAL', GUIDE_AU, 'Australian imaging opportunities'),
        lastReviewed: LAST
      },
      nz: {
        regulator: 'Medical Radiation Technologists Board (MRTB)',
        status: 'individual',
        profNote: { title: 'MRI is its own scope here', body: 'New Zealand treats MRI as a distinct registered scope rather than as part of general radiography. That is a real difference from Australia: the scope you apply for has to match the work you intend to do.', css: 'mint' },
        headline: 'MRI registration requires MRTB assessment',
        paras: ['New Zealand treats MRI as a registered medical radiation scope of practice — not simply as generic radiography. Your qualifications and MRI experience will need to be considered against the requirements for the relevant New Zealand scope, and practitioners can also apply to add another scope where appropriate.'],
        officialUrl: 'https://www.mrtboard.org.nz/pre-registration/overseas-trained-how-to-register',
        steps: steps('Check MRTB\u2019s requirements for the MRI scope', 'Explore New Zealand imaging opportunities with Ethicare'),
        buttons: btns('Check MRTB requirements', 'OFFICIAL', GUIDE_NZ, 'New Zealand imaging opportunities'),
        lastReviewed: LAST
      }
    },

    sonographer: {
      au: {
        regulator: 'Australian Sonographer Accreditation Registry (ASAR)',
        assessor: 'ASMIRT assessment for overseas qualifications',
        status: 'individual',
        profNote: { title: 'Accreditation, not registration', body: 'Sonography is not an Ahpra-registered profession in Australia. ASAR accreditation is the credential, and Medicare rebate arrangements are built around it — which is why employers treat it as non-negotiable even though it is not a government register.', css: 'mint' },
        headline: 'Overseas sonography pathway',
        paras: ['Sonography has a different Australian pathway from diagnostic radiography. Your overseas qualification may require assessment before you can obtain accredited sonographer status in Australia.',
          'ASAR currently directs applicants requiring assessment of overseas qualifications to the appropriate assessment route; successful completion of the relevant ASMIRT assessment can then support an application to ASAR for accredited status.'],
        officialUrl: 'https://www.asar.com.au/sonographer-info/temporary-residents/',
        steps: steps('View ASAR\u2019s overseas qualification information', 'Explore Australian sonography opportunities with Ethicare'),
        buttons: btns('View ASAR overseas qualification information', 'OFFICIAL', GUIDE_AU, 'Australian sonography opportunities'),
        lastReviewed: LAST
      },
      nz: {
        regulator: 'Medical Radiation Technologists Board (MRTB)',
        status: 'individual',
        profNote: { title: 'Registered here, accredited there', body: 'New Zealand registers sonographers as a scope of practice under the MRTB. Australia does not register them at all. If you are weighing both countries, this is one of the places where the two systems are genuinely different rather than differently worded.', css: 'mint' },
        headline: 'Individual MRTB assessment for the sonographer scope',
        paras: ['In New Zealand, sonography is a registered scope of practice under the Medical Radiation Technologists Board. MRTB assesses overseas qualifications and relevant clinical experience against the scope you are applying for.'],
        officialUrl: 'https://www.mrtboard.org.nz/pre-registration/overseas-trained-how-to-register',
        steps: steps('Check MRTB\u2019s requirements for the sonographer scope', 'Explore New Zealand sonography opportunities with Ethicare'),
        buttons: btns('Check MRTB requirements', 'OFFICIAL', GUIDE_NZ, 'New Zealand sonography opportunities'),
        lastReviewed: LAST
      }
    },

    physiotherapist: {
      au: {
        regulator: 'Physiotherapy Board of Australia (Ahpra)',
        assessor: 'Australian Physiotherapy Council',
        status: 'individual',
        profNote: { title: 'Two bodies, two queues', body: 'Your qualification is assessed by the Australian Physiotherapy Council; registration is granted by the Board. Separate organisations, separate processes — so the assessment timeline and the registration timeline are not the same thing.', css: 'mint' },
        headline: 'Australian Physiotherapy Council assessment',
        paras: ['Internationally qualified physiotherapists complete an assessment pathway with the Australian Physiotherapy Council before applying for registration with Ahpra. The pathway depends partly on where you trained and your professional circumstances.',
          'The Council\u2019s initial eligibility assessment accepts diploma-level physiotherapy qualifications and above, provided the other professional requirements are met — qualification level alone doesn\u2019t decide your route.'],
        officialUrl: 'https://physiocouncil.com.au/international-physiotherapists/getting-started',
        flyrNote: { title: 'A faster route may apply', body: 'Because you trained in {country}, the Council\u2019s FLYR route may be worth exploring — it involves an eligibility assessment, cultural safety training and an online written assessment. Approved country lists change, so check the Council\u2019s own list.', css: 'mint' },
        expressFlyrNote: { title: 'The Express FLYR route may apply to you', body: 'Because you trained in {country}, the Council\u2019s Express FLYR route may be worth exploring — eligibility assessment and cultural safety training, with no written assessment. The Council confirms eligibility, and its country list changes.', css: 'mint' },
        steps: steps('Find your official pathway with the Australian Physiotherapy Council', 'Explore Australian physiotherapy opportunities with Ethicare'),
        buttons: btns('Find my official Australian pathway', 'OFFICIAL', GUIDE_AU, 'Australian physiotherapy opportunities'),
        lastReviewed: LAST
      },
      nz: {
        regulator: 'Physiotherapy Board of New Zealand',
        status: 'individual',
        profNote: { title: 'Five pathways, and you need the right one', body: 'The Board runs five separate registration routes into the General scope: <strong>New Zealand graduate</strong>, <strong>Australian TTMR</strong> (if you are registered in Australia), <strong>International Express</strong>, <strong>International General: Fast Track</strong> and <strong>International General</strong>. Which one you use depends on where you were educated, where you are registered now, and the scope you want. Every application is judged against the same Physiotherapy Practice Thresholds — the pathway changes the evidence you supply, not the standard you meet. The Board publishes its own pathway tool, and it is worth two minutes before you start.', css: 'mint', href: 'https://physioboard.org.nz/i-want-to-be-registered/registration-in-the-general-scope-of-practice/registration-pathway-tool', linkLabel: 'Board’s registration pathway tool' },
        scopeNote: { title: 'Start in the General scope — everyone does', group: 'route', body: 'There are three scopes: General, Advanced Practice Physiotherapist and Physiotherapy Specialist. You cannot enter on the advanced ones from overseas. Both require General registration first, at least one year practising in New Zealand, and their own entry criteria — so an advanced practitioner arriving from abroad still starts in the General scope and applies to move up later.', css: 'sand' },
        headline: 'International General Pathway',
        paras: ['You may need to use the Physiotherapy Board\u2019s International General Pathway. The Board assesses your qualification and registration history, and some qualifications have fast-track arrangements within the general route.'],
        officialUrl: 'https://physioboard.org.nz/international-express-pathway',
        steps: steps('Check the Physiotherapy Board\u2019s international pathways', 'Explore New Zealand physiotherapy opportunities with Ethicare'),
        buttons: btns('Check the Physiotherapy Board pathways', 'OFFICIAL', GUIDE_NZ, 'New Zealand physiotherapy opportunities'),
        lastReviewed: RULES.nzPhysioExpress.lastReviewed,
        express: {
          status: 'streamlined',
          headline: 'You may qualify for New Zealand\u2019s International Express Pathway',
          paras: ['The Physiotherapy Board of New Zealand currently provides an International Express Pathway for eligible physiotherapists with relevant qualifications and/or unrestricted registration from the UK, Ireland, Canada or South Africa.',
            'Once correct documents are received, current processing is stated as around 1–2 weeks — timeframes can change, and only the Board can confirm your eligibility.'],
          buttons: btns('Confirm eligibility with the Physiotherapy Board', 'OFFICIAL', GUIDE_NZ, 'New Zealand physiotherapy opportunities')
        }
      }
    },

    'occupational-therapist': {
      au: {
        regulator: 'Occupational Therapy Board of Australia (Ahpra)',
        status: 'individual',
        profNote: { title: 'Registration and skills assessment are different things', body: 'The Board decides whether you can practise. A skills assessment for migration is a separate exercise by a separate body, on its own timeline. People routinely assume one covers the other; it does not.', css: 'mint' },
        headline: 'Check your international OT pathway',
        paras: ['The Occupational Therapy Board of Australia has a dedicated qualification-recognition and assessment process for internationally qualified occupational therapists — including qualification assessment, next steps and, where needed, competence assessment. The Board, not your overseas title, determines the route.'],
        changedNote: { title: 'The first step you have probably read about no longer exists', group: 'route', body: 'On <strong>27 October 2025</strong> the process changed. The Occupational Therapy Council\u2019s <strong>Stage 1 desktop assessment</strong> is no longer the starting point \u2014 <strong>Ahpra assesses your qualification directly</strong>. Most guides online still describe the old Stage 1, limited registration and supervised practice sequence, which makes the move look slower and more expensive than it now is for many therapists. If you lodged an application with the OTC before that date, you stay on the old process.', css: 'mint' },
        routesNote: { title: 'Three ways your qualification can be assessed', group: 'route', body: 'The Board publishes a <strong>comparable regulator</strong> list \u2014 a qualification awarded and recognised for registration in one of those jurisdictions, within a set date range, is treated as substantially equivalent. It also publishes a list of <strong>recognised international qualifications</strong> it has already assessed. If neither covers you, Ahpra does an <strong>individual assessment</strong> on your transcript, curriculum, placements, accreditation and whether the programme was WFOT-approved when you completed it. Being outside the first two lists is ordinary, not a setback.', css: 'sand' },
        outcomeNote: { title: 'Two outcomes, and the difference is months', group: 'need', body: 'Assessed as <strong>substantially equivalent</strong>, or based on similar competencies, and you can apply for general registration <strong>without supervised practice</strong>. Assessed as <strong>relevant to occupational therapy</strong> but not substantially equivalent, and Ahpra refers you to the Occupational Therapy Council for an Assessment of Competence. Both lead to registration. Only one of them needs you to have a job before you can start.', css: 'mint' },
        competenceNote: { title: 'What the competence assessment actually is', group: 'need', body: 'It is worth being clear, because the word "assessment" makes people picture an exam. It is <strong>not an OSCE</strong> and not a one-day test. It happens <strong>in the workplace</strong>, while you hold <strong>limited registration</strong>, and it needs four things in place first: an Australian OT job, an Ahpra-approved workplace, an Ahpra-approved supervisor, and that limited registration. In practice that means the job comes before the registration, not after \u2014 which is the opposite of how most people plan the move.', css: 'sand' },
        migrationNote: { title: 'Registration and migration are two separate assessments', group: 'need', body: 'Ahpra assessing your qualification lets you <strong>practise</strong>. If you are applying for permanent skilled migration you may also need a separate <strong>skills assessment from the Occupational Therapy Council</strong> \u2014 which the Council still does, even though it no longer does the registration assessment. Two applications, two fees, two timelines. Doing one does not do the other, and finding that out late is expensive.', css: 'mint' },
        officialUrl: 'https://www.occupationaltherapyboard.gov.au/Registration/Internationally-qualified-occupational-therapists.aspx',
        steps: steps('Check your qualification with the Occupational Therapy Board', 'Explore Australian OT opportunities with Ethicare'),
        buttons: btns('Check my qualification with the OT Board', 'OFFICIAL', GUIDE_AU, 'Australian OT opportunities'),
        lastReviewed: LAST
      },
      nz: {
        regulator: 'Occupational Therapy Board of New Zealand',
        status: 'individual',
        profNote: { title: 'There is an abridged pathway, and it is narrow', body: 'The Board runs an <strong>abridged pathway</strong> for applicants who obtained their qualification in the <strong>UK, Ireland, Canada or South Africa</strong> and are currently registered in one of those countries. It recognises the similarities in regulation and asks for less evidence — certificate and transcript rather than a full syllabus — but it does not lower the standard, and the cultural-competence, referee, good-character and English requirements are identical. Everyone else takes the standard overseas pathway. If you are registered with Ahpra in Australia, neither applies: you come under Trans-Tasman mutual recognition instead.', css: 'sand' },
        headline: 'Overseas qualification assessment',
        paras: ['Internationally qualified occupational therapists are assessed individually by Board-appointed occupational therapists — there is no fixed checklist that guarantees an outcome, and the quality of your evidence genuinely shapes it. Two things run in parallel: the Board judges whether your qualification is equivalent, and you demonstrate competence yourself through a written desktop self-assessment completed in the applicant portal after you apply.',
          'Registration and the practising certificate are separate. Registration says you have met the standard; the practising certificate is what actually lets you work, it renews every year, and you must hold one at all times while practising — including in a role with a different job title. The title “occupational therapist” is protected in law, so an employer generally needs to see that you are registrable before your application progresses.'],
        officialUrl: 'https://www.otboard.org.nz/site/rp/overseas?nav=sidebar',
        steps: ['Confirm which pathway applies — abridged or standard',
          'Gather certified documents: two forms of ID, qualification certificate, academic transcript (plus a detailed syllabus on the standard pathway)',
          'Line up three referees, at least one an occupational therapist you have worked with for six months in the last two years',
          'Apply and pay, then complete the desktop competence self-assessment and the Ngā Paerewa Te Tiriti eLearning in the portal',
          'Post the hard copies — the application does not progress on uploads alone'],
        buttons: btns('OTBNZ overseas registration information', 'OFFICIAL', GUIDE_NZ, 'New Zealand OT opportunities'),
        lastReviewed: 'Verified 26 August 2026 against otboard.org.nz (abridged and standard pathways, fees, processing time)'
      }
    },

    psychologist: {
      au: {
        regulator: 'Psychology Board of Australia (Ahpra)',
        status: 'individual',
        profNote: { title: 'General registration, then endorsement', body: 'Australia structures this differently from New Zealand: you hold general registration as a psychologist, and areas of practice such as clinical psychology sit on top as an <strong>endorsement</strong>. Your overseas title does not carry across to an endorsement — that is assessed separately, and it is the step most people underestimate.', css: 'mint' },
        headline: 'Individual Psychology Board pathway',
        paras: ['Psychology is one of the few professions where the shape of your training matters as much as the qualification itself. Australian registration is built on an accredited sequence of study followed by a period of supervised practice, and an overseas degree is assessed against that sequence rather than against your job title.',
          'That is what most often adds time for overseas-qualified psychologists: the Board can require additional study, examination or supervised practice before general registration, and your overseas professional title does not by itself determine your registration or any area-of-practice endorsement. Worth understanding before you plan a move, not after.'],
        officialUrl: 'https://www.psychologyboard.gov.au/Registration/Overseas-Applicants.aspx',
        steps: steps('Review the Psychology Board\u2019s overseas applicant pathway', 'Explore Australian psychology opportunities with Ethicare'),
        buttons: btns('Psychology Board — overseas applicants', 'OFFICIAL', GUIDE_AU, 'Australian psychology opportunities'),
        lastReviewed: LAST
      },
      nz: {
        regulator: 'New Zealand Psychologists Board',
        status: 'individual',
        profNote: { title: 'Four scopes, and the scope decides the job', body: 'New Zealand does not register “psychologists” as one thing. The Board registers into distinct scopes — <strong>Psychologist</strong> (general), <strong>Clinical</strong>, <strong>Counselling</strong> and <strong>Educational</strong> — with an Intern Psychologist scope for those completing supervised training. The scope you are granted follows your training, not your preference, and most public sector roles are written around the clinical scope. Check which one your qualification and internship actually support before you apply for anything.', css: 'sand' },
        headline: 'Individual NZ Psychologists Board assessment',
        paras: ['Psychology has requirements that catch people out, and they are about the shape of your training rather than the paper. The Board looks at the length and content of your psychology study and at your <strong>supervised internship</strong> — it currently expects around a six-year course of accredited study including a substantial supervised internship. A degree that meets the academic side but not the internship is the single most common reason an application stalls.',
          'Every overseas application is assessed individually, so the honest answer for any one person comes from the Board rather than from us. Check the internship requirement against your own training before you commit to anything.',
          'From 1 July 2026, eligible overseas-trained psychologists whose registration applications are received by the Board enter the Raka Māui Competence Programme — worth factoring into your planning.'],
        officialUrl: 'https://psychologistsboard.org.nz/want-to-register/overseas-trained-how-to-register/',
        criteriaNote: { title: 'Five criteria, and the last one catches people out', group: 'need', body: 'The Board looks for a minimum <strong>six-year</strong> course of study in psychology; graduation from an <strong>accredited</strong> programme; <strong>1,500 hours</strong> of supervised practice as part of the qualification, not employment afterwards; an endpoint evaluation of that internship or a passed licensing examination; and registration as a psychologist in <strong>both the country where you trained and the country where you now live</strong>. That last one is the quiet one \u2014 if you trained in South Africa and now practise somewhere that does not register psychologists, it needs a conversation before you apply.', css: 'mint' },
        hoursNote: { title: '1,500 hours inside the qualification, not years on the job', group: 'need', body: 'This is the most common misunderstanding in psychology applications. The 1,500 supervised hours must have formed <strong>part of your psychology qualification</strong>, closely supervised by a qualified psychologist \u2014 a decade of subsequent practice does not fill a gap in the training programme. If your internship was shorter, say so early rather than hoping it passes unnoticed; the Board can register with conditions where it finds gaps.', css: 'sand' },
        scopeNote: { title: 'Scope is decided by your training, not your job title', group: 'route', body: 'New Zealand registers psychologists into a named scope, and the Clinical Psychologist scope needs a formal postgraduate clinical qualification behind it \u2014 not ten years of mental health work. Getting this right matters twice over: it decides what you may practise, and it decides what we can put you forward for. Tell us the exact title of your qualification rather than your job title.', css: 'mint' },
        feeNote: { title: 'A vocational scope is a second fee, not part of the first', group: 'need', body: 'The headline registration fee is <strong>NZ$720</strong> from a prescribed country or <strong>NZ$1,080</strong> from anywhere else. A vocational scope such as Clinical or Counselling Psychologist is charged separately \u2014 <strong>NZ$540</strong> or <strong>NZ$900</strong> \u2014 and your first 12-month practising certificate is another <strong>NZ$797</strong>. So a clinical psychologist from a prescribed country should budget around <strong>NZ$2,057</strong>, and about <strong>NZ$2,777</strong> from a non-prescribed one. None of it is refundable, even if the application is declined.', css: 'sand' },
        rakaMauiNote: { title: 'Raka M\u0101ui \u2014 a condition of registration, not a barrier to it', group: 'need', body: 'Overseas-trained psychologists whose applications are approved <strong>on or after 1 July 2026</strong> take part in the Raka M\u0101ui Competence Programme. You do not do it before applying and it does not gate your registration \u2014 it becomes a condition of that registration and must be completed within <strong>two years</strong>. It combines learning, supervision and reflective practice to support your move into practising in Aotearoa. Anyone registered before 1 July 2026 is exempt but may volunteer.', css: 'mint' },
        timingNote: { title: 'A job offer will not speed this up', group: 'need', body: 'The Board is explicit: applications are processed in chronological order by date received, and it <strong>will not expedite an application because you have been offered a job</strong>. Plan on that basis, and do not accept a start date that assumes a registration timeframe nobody has promised you. This is the single most useful thing to know before you agree dates with an employer.', css: 'sand' },
        outcomeNote: { title: 'Three possible outcomes, and the middle one is common', group: 'need', body: 'The Board proposes full registration, <strong>registration with conditions</strong> where it identifies gaps, or a declined application where core standards are not met. Conditions are not a failure \u2014 they are how a good application with one soft edge still gets you practising. You have 20 working days to accept a proposed decision or send further evidence on the unmet parts.', css: 'mint' },
        cautionNote: { title: 'Your training may need closer review', body: 'Based on the information you\u2019ve entered, we recommend checking the NZ Psychologists Board requirements carefully before planning your move — the Board currently looks for around a six-year course of accredited psychology study including a substantial supervised internship.', css: 'sand' },
        steps: steps('Check the Psychologists Board\u2019s overseas registration requirements', 'Explore New Zealand psychology opportunities with Ethicare'),
        buttons: btns('NZ Psychologists Board — overseas registration', 'OFFICIAL', GUIDE_NZ, 'New Zealand psychology opportunities'),
        lastReviewed: 'August 2026 (Raka Māui programme applies from 1 July 2026)'
      }
    },


    /* SELF-REGULATING PROFESSIONS. Speech-language therapy and dietetics in Australia, and
       speech-language therapy in New Zealand, have no statutory register — the professional
       body's credential is what employers ask for, which is a different thing from registration
       and needs saying plainly rather than being dressed up as one. Social work in New Zealand
       IS statutory; in Australia it is not. Added August 2026: regulator and route confirmed,
       deep links deliberately left at the body's own front door until the exact overseas
       pages are verified. */
    'speech-language-therapist': {
      au: {
        regulator: 'Speech Pathology Australia',
        status: 'individual',
        profNote: { title: 'No register to join', body: 'There is no government register for speech pathology in Australia, so “registration” is the wrong word for what you need. The professional credential is what employers ask for, and the association is both the assessor and the issuer.', css: 'mint' },
        headline: 'Professional credential, not statutory registration',
        paras: ['Speech pathology is not regulated by Ahpra. The profession is self-regulating through Speech Pathology Australia, whose Certified Practising Speech Pathologist credential is what most employers ask for — so the practical gate is membership and credentialing rather than a government register.',
          'Overseas-qualified applicants have their qualification assessed by the association against the Australian entry-level standard. That assessment is also the one used for skilled migration, so it is usually worth starting it early.'],
        officialUrl: 'https://www.speechpathologyaustralia.org.au/',
        steps: steps('Apply to Speech Pathology Australia for assessment of your qualification', 'Talk to us about Australian speech pathology opportunities'),
        buttons: btns('Speech Pathology Australia', 'OFFICIAL', GUIDE_AU, 'Australian opportunities'),
        lastReviewed: 'Verified 26 August 2026 against dietitiansaustralia.org.au (DSR three-stage process, timings and the three-year clock)'
      },
      nz: {
        regulator: 'New Zealand Speech-language Therapists\u2019 Association (NZSTA)',
        status: 'individual',
        profNote: { title: 'Not a registered profession here', body: 'Speech-language therapy sits outside New Zealand’s health practitioner registration legislation — no board, no scope, no annual practising certificate. That is genuinely different from the therapy professions around it, and it usually shortens the timeline rather than lengthening it.', css: 'mint' },
        headline: 'Professional membership, not statutory registration',
        paras: ['Speech-language therapy is not a registered profession under New Zealand\u2019s health practitioner legislation. There is no board and no annual practising certificate. What employers ask for instead is membership of the New Zealand Speech-language Therapists\u2019 Association and its certificate of clinical competence.',
          'That means your route runs through the association rather than a regulator, and it is assessed on your qualification and clinical experience. It is a genuine difference from the imaging and allied health professions, and it usually makes the timeline shorter rather than longer.'],
        officialUrl: 'https://speechtherapy.org.nz/',
        steps: steps('Apply to NZSTA for membership and assessment of your qualification', 'Talk to us about New Zealand opportunities'),
        buttons: btns('NZSTA', 'OFFICIAL', GUIDE_NZ, 'New Zealand opportunities'),
        lastReviewed: 'August 2026 (non-statutory status confirmed; membership criteria to verify)'
      }
    },

    dietitian: {
      au: {
        regulator: 'Dietitians Australia',
        status: 'individual',
        profNote: { title: 'The credential does the work', body: 'Dietetics is not Ahpra-registered. The Accredited Practising Dietitian credential is what employers, Medicare and private health arrangements are built around, so in practice it functions as the gate even though it is not a government register.', css: 'mint' },
        headline: 'Accredited Practising Dietitian credential',
        paras: ['Dietetics is not regulated by Ahpra. Dietitians Australia runs the Accredited Practising Dietitian credential, and that credential — not a government register — is what employers and Medicare arrangements are built around.',
          'Overseas-qualified dietitians have their qualification assessed against the Australian entry-level competencies. The same assessment is used for skilled migration, so starting it early tends to save time later.'],
        officialUrl: 'https://dietitiansaustralia.org.au/',
        steps: steps('Apply to Dietitians Australia for assessment of your qualification', 'Talk to us about Australian dietetics opportunities'),
        buttons: btns('Dietitians Australia', 'OFFICIAL', GUIDE_AU, 'Australian opportunities'),
        lastReviewed: 'Verified 26 August 2026 against dietitiansaustralia.org.au (DSR three-stage process, timings and the three-year clock)'
      },
      nz: {
        regulator: 'Dietitians Board (New Zealand)',
        status: 'individual',
        profNote: { title: 'Statutory here — and it ends in supervised practice', body: 'New Zealand registers dietitians by law; Australia does not. More importantly, <strong>all four New Zealand routes end the same way</strong>: provisional registration, then 12 months of supervised practice before full registration. Provisional registration needs an employer who supports it, so the job and the registration are not sequential here — they interlock. That single fact reorders the whole move.', css: 'mint' },
        headline: 'Statutory registration with the Dietitians Board',
        paras: ['Unlike Australia, dietetics in New Zealand is a registered profession. You register with the Dietitians Board, hold a scope of practice and renew an annual practising certificate — the same structure as the imaging and therapy professions here.',
          'Three core requirements gate every route: at least four years of undergraduate and/or postgraduate nutrition and dietetic training; the Board’s English language requirement; and at least 12 months practising as a dietitian, averaging 20 hours a week, within the last three years, in the country where you are registered or credentialled. Only once those are met does the question of which of the four pathways you take arise.'],
        officialUrl: 'https://www.dietitiansboard.org.nz/Public/Public/Registration/Overseas-Trained.aspx',
        steps: ['Check the three core requirements first — training length, English, and 12 months of recent practice',
          'Submit an eligibility application so the Board confirms which of the four routes you are on',
          'Complete what your route requires — recognition of qualifications, a multi-choice examination, an OSCE, or none of these',
          'Secure a role: provisional registration needs an employer who supports it',
          'Complete 12 months of supervised practice, then apply for full registration'],
        buttons: btns('Dietitians Board', 'OFFICIAL', GUIDE_NZ, 'New Zealand opportunities'),
        lastReviewed: 'Verified 26 August 2026 against dietitiansboard.org.nz'
      }
    },

    /* Rebuilt 26 August 2026 after these four records were lost in a bad edit. Sources: MCNZ
       and Ahpra/AMC published guidance, the Nursing Council and NMBA, and the Medical Sciences
       Council; figures and country lists deliberately live in RULES rather than in prose here,
       so a change is made in one place. */
    doctor: {
      au: {
        regulator: 'Medical Board of Australia (Ahpra)',
        assessor: 'Australian Medical Council',
        status: 'individual',
        profNote: { title: 'Two bodies, and the order matters', body: 'The Australian Medical Council assesses your qualification; the Medical Board grants registration. Which AMC route you take depends on whether you are a specialist and where you are registered — and picking the wrong one costs months rather than weeks.', css: 'mint' },
        headline: 'AMC assessment, then Medical Board registration',
        paras: ['Internationally qualified doctors are assessed by the Australian Medical Council before the Medical Board of Australia grants registration. The standard route is the AMC examination pathway; the shorter Competent Authority route recognises registration in certain countries.',
          'A doctor who has completed specialist training applies through the specialist pathway instead, where the relevant Australian specialist college assesses comparability rather than the AMC.'],
        officialUrl: 'https://www.amc.org.au/assessment/',
        caNote: { title: 'The Competent Authority route may apply', group: 'route', body: 'Because you are registered in {country}, the Competent Authority pathway may be open to you — it recognises certain overseas regulators and removes the AMC examinations. The Board confirms eligibility and its list changes, so check it rather than assume.', css: 'mint' },
        specialist: {
          headline: 'Specialist pathway — assessed by an Australian college',
          paras: ['With completed specialist training you go through the relevant Australian specialist medical college rather than the AMC examinations. The college compares your training and experience with the Australian programme and finds you substantially comparable, partially comparable, or not comparable.',
            'Partially comparable is the common outcome and is not a refusal: it usually means a period of supervised practice or top-up training before fellowship-equivalent recognition.'],
          noSpecQualNote: { title: 'Without the specialist qualification in hand', group: 'route', body: 'The specialist pathway is built around a completed, awarded specialist qualification. If yours is not yet awarded, the college route is not open yet — the usual step is general registration first, with the specialist application following once the award is issued.', css: 'sand' }
        },
        steps: steps('Confirm your AMC pathway — examination, Competent Authority or specialist', 'Explore Australian medical opportunities with Ethicare'),
        buttons: btns('Australian Medical Council', 'OFFICIAL', GUIDE_AU, 'Australian medical opportunities'),
        lastReviewed: LAST
      },
      nz: {
        regulator: 'Medical Council of New Zealand',
        status: 'individual',
        profNote: { title: 'Which scope, before which pathway', group: 'route', body: 'The Council registers doctors in three scopes: <strong>general</strong> (resident doctors, RMOs and doctors in vocational training), <strong>vocational</strong> (permanent specialist registration, which lets you work independently) and <strong>special purpose</strong> (temporary, for a defined reason). Deciding the scope comes first — the country-list routes belong to the general scope, and a completed specialist would normally be a vocational applicant instead.', css: 'mint' },
        headline: 'Registration with the Medical Council of New Zealand',
        paras: ['Which pathway applies depends on where you have practised recently, whether you hold completed specialist training, and the scope you are applying into. The general scope has several routes, including the comparable health system route and the NZREX examination; the vocational scope is assessed by the relevant New Zealand college.',
          'Most general-scope routes lead to PROVISIONAL general registration first — 12 months working under supervision — which requires a job offer at a level matching your experience. Registration and the job search therefore run together rather than in sequence.'],
        officialUrl: 'https://www.mcnz.org.nz/registration/getting-registered/registration-pathways/',
        specialist: {
          headline: 'Vocational scope — assessed by a New Zealand college',
          paras: ['Vocational registration is permanent specialist registration and allows you to work independently. The relevant New Zealand college assesses your training and experience against its own standard; no country list applies to it.'],
          noSpecQualNote: { title: 'Without the specialist qualification in hand', group: 'route', body: 'Vocational registration is built around a completed specialist qualification. Until yours is awarded the general scope is the realistic route, with a vocational application following later.', css: 'sand' }
        },
        steps: ['Decide the scope: general, vocational or special purpose',
          'Use the Council\u2019s own self-assessment tool to confirm your pathway',
          'Gather your primary medical qualification, certificates of good standing and evidence of recent practice',
          'Secure a job offer — provisional general registration needs one at a matching level',
          'Apply, attend the registration meeting, then work under supervision before full registration'],
        buttons: btns('MCNZ registration pathways', 'OFFICIAL', GUIDE_NZ, 'New Zealand medical opportunities'),
        lastReviewed: 'Verified 26 August 2026 against mcnz.org.nz'
      }
    },

    nursing: {
      au: {
        regulator: 'Nursing and Midwifery Board of Australia (Ahpra)',
        status: 'individual',
        profNote: { title: 'One board, three registers', group: 'route', body: 'Registered nurses, enrolled nurses and midwives are separate registrations with separate requirements. Midwifery is not a nursing endorsement in Australia — it is its own qualification and its own register.', css: 'mint' },
        headline: 'Outcomes-based assessment with the NMBA',
        paras: ['Internationally qualified nurses and midwives are assessed against the NMBA\u2019s registration standards. Where a qualification is not substantially equivalent, the usual route is the outcomes-based assessment: a multiple-choice examination followed by an objective structured clinical examination.',
          'Both parts are booked and sat separately, and the clinical examination is held in a limited number of locations — worth planning around early.'],
        officialUrl: 'https://www.nursingmidwiferyboard.gov.au/Registration-and-Endorsement/International.aspx',
        streamlinedNote: { title: 'Where you trained may no longer decide your route', group: 'route', body: 'Since April 2025 the NMBA has run a streamlined standard for internationally qualified <strong>registered nurses</strong>, and it has two doors. <strong>Pathway 1</strong> is for nurses who qualified in a comparable jurisdiction \u2014 the UK, Ireland, the United States, British Columbia, Ontario, Singapore or Spain. <strong>Pathway 2</strong> is the one people miss: if you qualified somewhere else, then passed that jurisdiction\u2019s examination process and gained <strong>general</strong> registration there, you may use the streamlined standard on the strength of that registration rather than your original qualification. Both need at least <strong>1,800 hours</strong> of registered-nurse practice in a comparable jurisdiction since 1 January 2017.', css: 'mint' },
        pathway2Note: { title: 'Qualified in India or the Philippines, then registered in the UK?', group: 'route', body: 'This is the case most often got wrong, including by nurses who have already been told they need NCLEX and an OSCE. If you trained outside a comparable jurisdiction, passed the UK\u2019s CBT and hold NMC registration, Pathway 2 may be open to you. One condition decides it: the UK registers nurses in four fields, and Pathway 2 requires registration in <strong>adult nursing</strong>. Children\u2019s, learning disabilities and mental health do not meet it, however long you have practised.', css: 'sand' },
        notStreamlinedNote: { title: 'Streamlined is not automatically the better door', group: 'need', body: 'Two groups are <strong>excluded</strong> from the streamlined standard and go through the existing IQNM assessment instead: nurses whose qualifications are assessed as <strong>substantially equivalent</strong>, and nurses holding a <strong>sole qualification in mental health nursing</strong>. Being excluded is not a setback \u2014 for a substantially equivalent qualification the existing route is the direct one. It does mean the timeline you may have read about does not apply to you.', css: 'sand' },
        timingNote: { title: 'What the two routes actually take', group: 'need', body: 'Ahpra puts the existing assessment process at typically <strong>9\u201312 months</strong>, longer if an examination has to be re-sat, and an eligible streamlined application at <strong>1\u20136 months</strong> depending on complexity and how complete your evidence is. That gap is the whole reason it is worth establishing which route you are on before you plan anything else \u2014 or agree a start date.', css: 'mint' },
        orientationNote: { title: 'One requirement that follows you past registration', group: 'need', body: 'Every internationally qualified nurse who registers in Australia completes Part 2 of the orientation \u2014 online learning on the Australian healthcare context \u2014 <strong>within six months of registering</strong>. It does not gate your registration or your start date, but it is a condition, so put it in the diary rather than discovering it later.', css: 'mint' },
        npNote: { title: 'Nurse practitioner status does not carry across on its own', group: 'route', body: 'The streamlined standard is for registered nurses. If you are a nurse practitioner, general registration as a registered nurse comes first, and the endorsement is assessed separately against Australian requirements \u2014 including advanced practice hours and an approved or substantially equivalent postgraduate qualification. Plan them as two steps, in that order.', css: 'sand' },
        enNote: { title: 'Enrolled nursing is a different register', group: 'route', body: 'Enrolled nurse registration has its own qualification requirement and is not a lesser version of registered nursing. If your qualification is a diploma-level nursing award, this is usually the register it maps to — confirm which one your application should name before you start.', css: 'sand' },
        steps: steps('Check the NMBA\u2019s international registration requirements', 'Explore Australian nursing opportunities with Ethicare'),
        buttons: btns('NMBA — international applicants', 'OFFICIAL', GUIDE_AU, 'Australian nursing opportunities'),
        lastReviewed: LAST
      },
      nz: {
        regulator: 'Nursing Council of New Zealand',
        status: 'individual',
        profNote: { title: 'Most nurses sit an exam and an OSCE — in Christchurch', body: 'The Council requires a competence assessment from <strong>some</strong> registered nurses and from <strong>all</strong> enrolled nurses. It has two parts: an online theory exam at a Pearson VUE centre, and a clinical part — a two-day orientation course plus an OSCE — which must be taken <strong>in person at the Nurse Maude Simulation &amp; Assessment Centre in Christchurch</strong>. That last detail is the one that reshapes plans: it means a trip to New Zealand, or arriving before you are registered.', css: 'mint' },
        headline: 'Registration with the Nursing Council of New Zealand',
        paras: ['Overseas-qualified nurses are assessed individually, and the Council’s own self-assessment tool sets out how it decides. Two requirements apply to everyone: you must be <strong>currently registered</strong> with an overseas regulatory authority, and you must evidence <strong>1,800 hours of post-registration nursing experience</strong> — roughly a year full-time. Without either, the tool tells you that you may not be able to register yet.',
          'Whether you also sit the competence assessment turns on a three-part test, and the third part is the one people miss. The Council recognises education, current registration and 1,800 hours of recent practice in the <strong>USA, UK, Ireland, Singapore, or the Canadian provinces of British Columbia and Ontario</strong> — but all three must be in that group, and the practice must fall within the last 10 years. A UK-trained nurse who has spent the last decade elsewhere sits the assessment like anyone else.',
          'The theory exam is in two parts — Part A medication safety, Part B nursing knowledge — with three attempts, and you re-sit only the part you failed. The OSCE is 10 stations for registered nurses and 8 for enrolled nurses, 12 minutes each, also three attempts.'],
        officialUrl: 'https://nursingcouncil.org.nz/IQN/IQN/Competence-assessment-process.aspx',
        selfCheckNote: { title: 'Use the Council\u2019s own self-assessment tool first', group: 'route', body: 'It is the Council\u2019s tool and it answers the only question that matters at this stage \u2014 whether you personally need the competence assessment. Everything else, including cost and how long the move takes, follows from that answer. The Council recognises six places: <strong>the USA, the UK, Ireland, Singapore, and the Canadian provinces of British Columbia and Ontario</strong>. It only indicates you may avoid the assessment when all three of these are true \u2014 you were <strong>educated</strong> there, you are <strong>currently registered</strong> there, and you have <strong>1,800 hours</strong> of registered-nurse practice there within the last 10 years. Miss one and you are on the exam route, so training in the UK on its own settles nothing. It is not a decision either: qualifications are assessed individually and the outcome is confirmed only at the end.', css: 'mint' },
        costNote: { title: 'What it costs, and what is payable before you can even apply', group: 'need', body: 'Two fees come before the Council will look at you, and neither is in New Zealand dollars: <strong>TruMerit</strong> document verification at <strong>US$380</strong>, and an international criminal history check through Fit2Work at <strong>AU$155 per country</strong> you have lived in. The Council\u2019s own application fee is <strong>NZ$485</strong>. If a competence assessment is required, add the theory exam at <strong>NZ$140</strong>, the orientation course at <strong>NZ$500</strong> and the OSCE at <strong>NZ$3,000</strong> \u2014 plus flights and accommodation in Christchurch. A failed OSCE re-sit is another NZ$3,000.', css: 'sand' },
        /* The Council itself tells IQNs to look for work BEFORE paying for registration. That
           belongs in front of a candidate, not buried \u2014 it is the difference between a checker
           that sells a process and one that tells someone the truth about their odds. */
        marketNote: { title: 'Check the job market before you spend anything', group: 'need', body: 'The Council is unusually direct about this: New Zealand has employed a large number of internationally qualified nurses in recent years, and it says demand is <strong>currently lower than previously</strong>, except in particular specialties or levels of experience \u2014 it names mental health and addiction. It encourages nurses to explore employment opportunities <em>before</em> applying for registration or coming to New Zealand. Being eligible to register and being likely to be hired are two different questions, and the second one is worth asking first.', css: 'mint' },
        registrationGateNote: { title: 'You must currently hold overseas registration', group: 'need', body: 'This is a hard gate rather than a preference. If your registration has lapsed, or you have never registered in the country where you qualified, the Council\u2019s own tool says you may not be able to register in New Zealand. Talk to us before spending anything on verification \u2014 lapsed registration is sometimes recoverable in the country that issued it, and that is usually the cheaper route.', css: 'sand' },
        hoursGateNote: { title: '1,800 hours, and where they were worked', group: 'need', body: '1,800 hours of post-registration practice \u2014 about a year full-time \u2014 is required of every internationally qualified nurse, and it is one of the documents TruMerit verifies. A second, separate hours test decides the competence assessment: 1,800 hours as a registered nurse <em>within the last 10 years</em>, worked in <strong>the USA, the UK, Ireland, Singapore, or the Canadian provinces of British Columbia or Ontario</strong>. Nurses often meet the first test and not the second \u2014 and it is the second that decides whether you sit the exam and the OSCE.', css: 'sand' },
        enNote: { title: 'Enrolled nurses always sit the assessment', group: 'route', body: 'The exemption question does not arise for enrolled nurses: the Council requires the competence assessment from all of them. Your OSCE is 8 stations rather than 10, and it is the same in-person assessment in Christchurch. Enrolled nursing is also its own scope with its own qualification requirement, not a lesser version of registered nursing — confirm which scope your qualification maps to before applying.', css: 'sand' },
        osceNote: { title: 'The clinical part means travelling to Christchurch', group: 'need', body: 'The two-day orientation course and the OSCE are both in person at the Nurse Maude Simulation &amp; Assessment Centre in Christchurch — there is no overseas venue for this part, unlike the theory exam. Budget the flights and the time, and decide deliberately whether you sit it on a trip or after you arrive.', css: 'sand' },
        steps: ['Check whether employers are recruiting in your specialty before you spend anything',
          'Use the Council\u2019s self-assessment tool to find out whether you need a competence assessment',
          'Verify and authenticate your documents through TruMerit, then apply through the Council',
          'Complete the two free Welcome to Aotearoa New Zealand courses and your criminal history check',
          'Sit the theory exam (Part A medication safety, Part B nursing knowledge) at a Pearson VUE centre',
          'Attend the two-day orientation course and the OSCE in Christchurch',
          'Complete the cultural safety requirements, then register and apply for your practising certificate'],
        buttons: btns('Nursing Council — competence assessment', 'OFFICIAL', GUIDE_NZ, 'New Zealand nursing opportunities'),
        lastReviewed: 'Verified 26 August 2026 against nursingcouncil.org.nz'
      }
    },

    /* Midwifery cannot share the nursing record: in New Zealand midwives are regulated by the
       MIDWIFERY COUNCIL, a different body from the Nursing Council. Australia keeps both on one
       board, but even there midwifery is a separate register with its own qualification
       requirement rather than a nursing endorsement. Marked unverified deliberately — it needs
       checking against both regulators' pages, and the audit lists it until someone does. */
    midwifery: {
      au: {
        regulator: 'Nursing and Midwifery Board of Australia (Ahpra)',
        status: 'individual',
        profNote: { title: 'A separate register, not a nursing endorsement', body: 'Australia regulates midwives through the same board as nurses but on a <strong>separate register</strong>, with its own qualification requirement. A nursing registration does not carry midwifery with it, and a midwifery qualification does not carry nursing.', css: 'mint' },
        headline: 'Midwifery registration with the NMBA',
        paras: ['Internationally qualified midwives are assessed against the Board\u2019s registration standards for midwifery specifically. Where a qualification is not substantially equivalent, an outcomes-based assessment or a bridging programme is the usual route.'],
        officialUrl: 'https://www.nursingmidwiferyboard.gov.au/Registration-and-Endorsement/International.aspx',
        steps: steps('Check the NMBA\u2019s midwifery requirements for international applicants', 'Talk to us about Australian midwifery opportunities'),
        buttons: btns('NMBA — international applicants', 'OFFICIAL', GUIDE_AU, 'Australian opportunities'),
        lastReviewed: 'August 2026 (separate register confirmed; overseas assessment criteria to verify)'
      },
      nz: {
        regulator: 'Midwifery Council of New Zealand',
        status: 'individual',
        profNote: { title: 'A different regulator from nursing', body: 'This is the one people get wrong. New Zealand midwives are registered by the <strong>Midwifery Council</strong>, not the Nursing Council — a separate body, a separate scope and a separate application. If you are dually qualified you deal with both, separately.', css: 'mint' },
        headline: 'Registration with the Midwifery Council of New Zealand',
        paras: ['The application runs in two parts. <strong>Part A</strong> is the comparability assessment: your transcripts, course descriptors and a comparability tool are measured against the New Zealand Bachelor of Midwifery, alongside a self-assessment against the Standards of Competence. That takes around four weeks, and its outcome decides everything that follows.',
          'If Part A is met you are invited to <strong>Part B</strong> — certificates of professional status, two character references, a medical certificate and police certificates — and the Registrar\u2019s review then takes roughly two to four weeks. If Part A is not met, you may be invited onto the Alternative Pathway instead.'],
        officialUrl: 'https://midwiferycouncil.health.nz/Web/I-want-to-become-a-midwife-in-New-Zealand/IQM-Process.aspx',
        altPathwayNote: { title: 'The Alternative Pathway means an exam and an OSCE in New Zealand', group: 'route', body: 'Where the Council wants more assurance after Part A, it may invite you onto the Alternative Pathway: a remotely invigilated <strong>MCQ through Aspeq</strong>, then an <strong>OSCE you must be physically present in New Zealand to sit</strong>. Places are limited and the Council says the wait can be <strong>6–12 months</strong> depending on numbers, and you are advised to stay in the country afterwards in case a re-sit is needed. That is a visa, a flight and a stretch of time — plan it as a relocation, not an exam.', css: 'sand' },
        englishNote: { title: 'IELTS or OET only — and no mixing sittings', group: 'need', body: 'The Council recognises two tests: <strong>IELTS</strong> and <strong>OET</strong>. All sittings must fall within the three years before registration, and it must be a complete result from one test — no combining scores across sittings.', css: 'sand' },
        conditionsNote: { title: 'You will start with conditions on your scope', group: 'need', body: 'Standard conditions are applied to your scope of practice on registration and stay until you have completed what the Council sets — typically education, supervision or both. Then a separate step: you cannot practise without a current <strong>Annual Practising Certificate</strong>, which needs the Cultural Competence for Midwives course, a professional development plan and formal evidence of New Zealand employment. It renews every year by 1 April.', css: 'mint' },
        paras2: [],
        steps: ['Create your MyMCANZ account and start the application — you have 6 months to complete it',
          'Gather Part A documents early: transcripts and course descriptors sent directly by your university, the comparability tool, and your self-assessment against the Standards of Competence',
          'Pay the Part A fee — the comparability assessment takes about four weeks and decides your route',
          'On Part B, arrange certificates of professional status, two character references, a medical certificate and police certificates through Fit2Work',
          'Registrar review takes about 2–4 weeks; then apply for your APC before you can practise'],
        buttons: btns('Midwifery Council — the IQM process', 'OFFICIAL', GUIDE_NZ, 'New Zealand opportunities'),
        lastReviewed: 'Verified 26 August 2026 against midwiferycouncil.health.nz'
      }
    },

    'anaesthetic-technician': {
      au: {
        regulator: 'No national registration for anaesthetic technicians',
        status: 'employer',
        profNote: { title: 'Not a registered profession in Australia', group: 'route', body: 'Anaesthetic technology is not regulated by Ahpra. Requirements are set by employers and vary by state, and the qualification employers look for is usually an Australian award or one assessed as equivalent. There is no register to join and no national credential to gain.', css: 'mint' },
        headline: 'Set by the employer, not by a regulator',
        paras: ['With no national register, each employer decides what it accepts. In practice a recognised anaesthetic technology qualification and demonstrable theatre experience are what open doors, and requirements differ between states.'],
        officialUrl: 'https://www.asa.org.au/',
        steps: steps('Check what employers in your target state require', 'Talk to us about Australian theatre roles'),
        buttons: btns('Australian Society of Anaesthetists', 'OFFICIAL', GUIDE_AU, 'Australian opportunities'),
        lastReviewed: 'August 2026 (non-regulated status confirmed; state and employer requirements vary)'
      },
      nz: {
        regulator: 'Medical Sciences Council of New Zealand (MSCNZ)',
        status: 'individual',
        profNote: { title: 'Registered here, unlike Australia', group: 'route', body: 'New Zealand registers anaesthetic technicians by law through the Medical Sciences Council, with a scope of practice and an annual practising certificate. Australia does not regulate the profession at all. If you are weighing the two countries, that is the single biggest structural difference — it changes the order of your steps, not just the paperwork.', css: 'mint' },
        headline: 'Registration with the Medical Sciences Council',
        paras: ['Overseas qualifications are assessed individually against the New Zealand scope. UK-trained operating department practitioners are the most common overseas applicants and the Council is familiar with the qualification, but experience and current good standing are assessed alongside it.',
          'Registration comes before practice here: you cannot start in the role and complete registration afterwards.'],
        officialUrl: 'https://www.mscouncil.org.nz/',
        recognised: {
          headline: 'A recognised route for UK-trained ODPs',
          paras: ['UK operating department practitioner training is a qualification the Council is used to assessing, and with relevant post-qualification experience and current good standing it is a well-worn route rather than an unusual one. The Council still assesses your application individually and can attach conditions.']
        },
        ukShortfallNote: { title: 'The UK route depends on experience and standing', group: 'route', body: 'The recognised UK route is built around post-qualification experience and a clean current registration. Where either is short, the Council assesses the application on its merits and may attach supervision or a period of supervised practice. That is a condition rather than a refusal, but it belongs in your plan.', css: 'sand' },
        steps: steps('Check the Medical Sciences Council\u2019s overseas requirements', 'Explore New Zealand theatre opportunities with Ethicare'),
        buttons: btns('Medical Sciences Council', 'OFFICIAL', GUIDE_NZ, 'New Zealand theatre opportunities'),
        lastReviewed: 'August 2026 (statutory registration confirmed; UK ODP criteria to verify)'
      }
    },

    other: {
      any: {
        regulator: 'The regulator for your profession',
        status: 'individual',
        headline: 'Start with the regulator for your profession',
        paras: ['We have not asked enough about your profession to point you at a specific pathway, and guessing would not help you. Registration rules differ substantially between professions, and the body that regulates yours is the only source that can tell you where you stand.',
          'Our directory lists the regulators for both countries in one place, so you can go straight to the right one.'],
        officialUrl: SITE + '/resources/healthcare-regulators',
        steps: steps('Find the regulator for your profession', 'Talk to us about what you are looking for'),
        buttons: btns('Healthcare regulators directory', 'OFFICIAL', GUIDE_NZ, 'Talk to us'),
        lastReviewed: LAST
      }
    },

    'social-worker': {
      au: {
        regulator: 'Australian Association of Social Workers (AASW)',
        status: 'individual',
        profNote: { title: 'No national register', body: 'Social work is not registered in Australia. Association membership stands in for it, and employers and funding bodies use eligibility for membership as the standard. The same assessment usually serves skilled migration, which is why it is worth starting first.', css: 'mint' },
        headline: 'Professional membership, not statutory registration',
        paras: ['Social work is not regulated by Ahpra, and there is no national register. The Australian Association of Social Workers sets the professional standard, and eligibility for membership is what most employers and funding bodies use in its place.',
          'Overseas-qualified social workers have their qualification assessed by the association against the Australian standard. That assessment also serves skilled migration, which is why it is usually the first thing to start.'],
        officialUrl: 'https://www.aasw.asn.au/',
        steps: steps('Apply to the AASW for assessment of your qualification', 'Talk to us about Australian social work opportunities'),
        buttons: btns('AASW', 'OFFICIAL', GUIDE_AU, 'Australian opportunities'),
        lastReviewed: 'Verified 26 August 2026 against dietitiansaustralia.org.au (DSR three-stage process, timings and the three-year clock)'
      },
      nz: {
        regulator: 'Social Workers Registration Board (SWRB)',
        status: 'individual',
        profNote: { title: 'Mandatory, and it gates the job', body: 'New Zealand protects both the title and the practice: registration is required to work as a social worker, full stop. You cannot start a role and complete registration afterwards, which makes this the first item in your sequence rather than a formality near the end.', css: 'sand' },
        headline: 'Registration is mandatory, not optional',
        paras: ['New Zealand is stricter than Australia here, and it is the difference that matters most: social work is a protected profession, and registration with the Social Workers Registration Board is mandatory for anyone practising as a social worker. You cannot take a role and sort the paperwork afterwards.',
          'Overseas qualifications are assessed individually against the New Zealand standard, and registration carries an annual practising certificate alongside it. Because registration gates the job rather than following it, this is the first step in the sequence and not the last.'],
        officialUrl: 'https://swrb.govt.nz/',
        steps: steps('Check the SWRB\u2019s requirements for overseas-qualified social workers', 'Talk to us about New Zealand opportunities'),
        buttons: btns('Social Workers Registration Board', 'OFFICIAL', GUIDE_NZ, 'New Zealand opportunities'),
        lastReviewed: 'August 2026 (mandatory registration confirmed; overseas assessment criteria to verify)'
      }
    }
  };

  /* ---------- profession-specific questions ----------
     Asked only when the answer changes the guidance, and tagged with a country where the
     question only matters for one destination. Rebuilt 26 August 2026 after an edit
     destroyed this block; the field names match what pathway-checker.js reads. */
  var PROF_QUESTIONS = {
    'occupational-therapist': {
      kicker: 'Because the Board runs an abridged pathway',
      questions: [
        { field: 'otWfot', cc: 'nz', type: 'select',
          q: 'Is your occupational therapy programme accredited by the World Federation of Occupational Therapists?',
          placeholder: 'Select\u2026',
          extras: [['yes', 'Yes \u2014 my programme is WFOT-accredited'], ['no', 'No'], ['unsure', 'I\u2019m not sure']],
          hint: 'Accreditation sits with the individual programme, not the country, and the Board requires it on the abridged pathway.' },
        { field: 'otReferee', cc: 'nz', q: 'Have you worked with another occupational therapist for more than six months in the last two years?',
          opts: [['yes', 'Yes'], ['no', 'No'], ['unsure', 'I\u2019m not sure']],
          hint: 'Both OTBNZ pathways need three referees, and at least one must be an occupational therapist who meets exactly that description.' }
      ]
    },
    psychologist: {
      kicker: 'Because the scope you register in decides the work',
      questions: [
        { field: 'psychIntern', q: 'Did your training include a supervised internship or placement year?',
          opts: [['yes', 'Yes'], ['partial', 'Partly — some supervised placement, but not a full year'], ['no', 'No'], ['unsure', 'I\u2019m not sure']],
          hint: 'Supervised practice is assessed alongside the academic qualification in both countries.' },
        { field: 'psychScope', cc: 'nz', q: 'Which New Zealand scope are you aiming for?',
          opts: [['clinical', 'Clinical'], ['counselling', 'Counselling'], ['educational', 'Educational'], ['general', 'General'], ['unsure', 'I\u2019m not sure']],
          hint: 'New Zealand registers psychologists in separate scopes, and they are not interchangeable.' },
        { field: 'psychAuArea', cc: 'au', q: 'Which area was your professional training in?',
          placeholder: 'Select\u2026',
          extras: [['clinical', 'Clinical psychology'], ['counselling', 'Counselling psychology'], ['neuro', 'Clinical neuropsychology'], ['ed-dev', 'Educational & developmental psychology'], ['forensic', 'Forensic psychology'], ['health', 'Health psychology'], ['org', 'Organisational psychology'], ['sport', 'Sport & exercise psychology'], ['community', 'Community psychology'], ['general', 'General psychology \u2014 no specialist area'], ['unsure', 'I\u2019m not sure']],
          hint: 'These are Australia\u2019s endorsement areas. Naming yours matters because in Australia it is an endorsement on top of general registration, not a separate registration.' },
        { field: 'psychEndorse', cc: 'au', q: 'Are you seeking an area of practice endorsement in Australia?',
          opts: [['yes', 'Yes'], ['no', 'No'], ['unsure', 'I\u2019m not sure']],
          hint: 'Australia grants general registration first; endorsement is a separate and slower step.' }
      ]
    },
    dietitian: {
      kicker: 'Because every route here ends in supervised practice',
      questions: [
        { field: 'dietRecent', cc: 'nz', q: 'Have you practised as a dietitian for at least 12 months, averaging 20 hours a week, in the last three years?',
          opts: [['yes', 'Yes'], ['no', 'No'], ['unsure', 'I\u2019m not sure']],
          hint: 'One of three core requirements the Board applies before any pathway opens.' },
        { field: 'dietSubspec', cc: 'nz', q: 'Do you have three or more years of subspecialised dietetic experience within the last five?',
          opts: [['yes', 'Yes'], ['no', 'No']],
          hint: 'Relevant if you qualified in Ireland or Canada \u2014 the Board runs a separate subspecialist route.' },
        { field: 'dietPlacement', cc: 'au', q: 'Did your programme include a supervised professional practice placement?',
          opts: [['yes', 'Yes'], ['no', 'No'], ['unsure', 'I\u2019m not sure']],
          hint: 'Dietitians Australia assesses supervised practice alongside the academic qualification.' }
      ]
    },
    'social-worker': {
      kicker: 'Because registration here gates the job',
      questions: [
        { field: 'swYears', q: 'How much post-qualifying social work practice do you have?',
          opts: [['lt2', 'Less than 2 years'], ['2-5', '2–5 years'], ['5plus', 'More than 5 years']],
          hint: 'Recent post-qualifying practice affects whether conditions such as supervision are attached to registration.' }
      ]
    },
    /* The Council publishes VOC4's criteria; until now we printed them and left the applicant to
       mark their own homework. These four turn that into an answer. All are gated to consultants:
       a registrar cannot use VOC4, so asking them is noise. */
    doctor: {
      kicker: 'Because the fast track turns on four specific things',
      questions: [
        { field: 'docIntent', cc: 'nz', q: 'Are you looking to move permanently, or come for a defined period?',
          opts: [['permanent', 'Permanently, or open-endedly'], ['temporary', 'A defined period of up to 12 months'], ['unsure', 'Still weighing it up']],
          hint: 'This changes which route we point you at first — the locum scope is a genuinely different application, and it is only the right answer for a genuinely temporary move.' },
        { field: 'docRecent24', cc: 'nz', when: { field: 'doctorStage', in: ['smo'] },
          q: 'Have you worked at least 24 months in your specialty in the past 5 years, at 0.5 FTE or more?',
          opts: [['yes', 'Yes'], ['no', 'No'], ['unsure', 'I\u2019d need to check my dates']],
          hint: 'One of the Council\u2019s VOC4 criteria. It is measured in your approved area of medicine, not in medicine generally.' },
        { field: 'docRecent12', cc: 'nz', when: { field: 'doctorStage', in: ['smo'] },
          q: 'Does that include 12 months within the last 18?',
          opts: [['yes', 'Yes'], ['no', 'No'], ['unsure', 'I\u2019d need to check my dates']],
          hint: 'The second half of the same criterion, and the one that catches people who took a career break \u2014 the total can be met while the recent window is not.' },
        { field: 'docOffer', cc: 'nz', when: { field: 'doctorStage', in: ['smo'] },
          q: 'Do you have a New Zealand job offer at consultant or specialist level?',
          opts: [['yes', 'Yes'], ['interviewing', 'I am interviewing'], ['no', 'Not yet'], ['exploring', 'Just exploring']],
          hint: 'VOC4 requires one. Not having it yet is normal and changes the order you do things in, not whether you can.' }
      ]
    },
    'anaesthetic-technician': {
      kicker: 'Because the qualification title matters less than what you actually do',
      questions: [
        { field: 'atQual', cc: 'nz', q: 'Which qualification did you train under?',
          placeholder: 'Select\u2026',
          extras: [['at-degree', 'Anaesthetic technology \u2014 degree'], ['at-diploma', 'Anaesthetic technology \u2014 diploma'], ['odp', 'Operating Department Practice (ODP)'], ['periop', 'Perioperative practice'], ['nursing', 'Nursing'], ['health-degree', 'Another health science degree'], ['other', 'Something else'], ['unsure', 'I\u2019m not sure']],
          hint: 'Asked because the Council has a named route for anaesthetic technology qualifications and a separate one for other relevant degrees \u2014 a title that does not say \u201canaesthetic technology\u201d is not a dead end.' },
        { field: 'atExp', cc: 'nz', q: 'How much post-qualification specialised anaesthetic experience do you have?',
          opts: [['lt1', 'Less than a year'], ['1-2', 'One to two years'], ['2plus', 'Two years or more, full-time equivalent'], ['5plus', 'Five years or more'], ['unsure', 'I\u2019d need to check']],
          hint: 'Two years FTE is the threshold in the Council\u2019s published UK route, so it is worth answering precisely rather than rounding up.' }
      ]
    },
    'speech-language-therapist': {
      kicker: 'Because the credential replaces registration',
      questions: [
        /* These four ARE the NZSTA decision. The question they replaced ("do you hold a
           certificate of clinical competence, or your association's equivalent?") was vague
           enough that no answer changed the result — which is the test a question has to pass. */
        { field: 'sltAssoc', cc: 'nz', q: 'Are you a certified member of one of these associations?',
          placeholder: 'Select\u2026',
          extras: [['asha', 'ASHA \u2014 American Speech-Language-Hearing Association'], ['sac', 'SAC \u2014 Speech-Language & Audiology Canada'], ['rcslt', 'RCSLT \u2014 Royal College of Speech and Language Therapists'], ['spa', 'Speech Pathology Australia'], ['iaslt', 'IASLT \u2014 Irish Association of Speech and Language Therapists'], ['none', 'None of these'], ['unsure', 'I\u2019m not sure']],
          hint: 'These five associations plus NZSTA are the signatories to the Mutual Recognition Agreement. Membership of one is what opens the faster route \u2014 if you hold none, the other route still applies.' },
        { field: 'sltSupervised', cc: 'nz', q: 'Have you completed a year of supervised clinical practice?',
          opts: [['yes', 'Yes'], ['no', 'Not yet'], ['newgrad', 'I am newly qualified'], ['unsure', 'I\u2019m not sure']],
          hint: 'NZSTA counts this as no less than 36 weeks of full-time clinical practice, at least 30 hours a week of paid employment.' },
        { field: 'sltHours', cc: 'nz', q: 'Have you completed 1,000 hours of speech-language therapy practice in the past five years?',
          opts: [['yes', 'Yes'], ['no', 'No'], ['unsure', 'I\u2019m not sure']],
          hint: 'Certified evidence of this is one of the criteria for Registered Membership. Falling short does not close the door \u2014 it changes which conditions come with it.' },
        { field: 'sltAssocAu', cc: 'au', q: 'Do you hold full membership or certification with one of these associations?',
          placeholder: 'Select\u2026',
          extras: [['asha', 'ASHA \u2014 Certificate of Clinical Competence (CCC-SLP)'], ['sac', 'SAC \u2014 Certified Speech-Language Pathologist, S-LP(C)'], ['iaslt', 'IASLT \u2014 Member (MIASLT)'], ['nzsta', 'NZSTA \u2014 Full Member, graduated 1993 or later'], ['nzsta-pre93', 'NZSTA \u2014 Full Member, graduated before 1993'], ['rcslt', 'RCSLT \u2014 Certified Member (Cert MRCSLT)'], ['none', 'None of these'], ['unsure', 'I\u2019m not sure']],
          hint: 'Speech Pathology Australia names the exact credential, not just the association \u2014 so ordinary membership and certified membership are different answers.' },
        { field: 'sltEnglishAu', cc: 'au', q: 'Was your entry-level qualification taught in English?',
          opts: [['mra-uni', 'Yes \u2014 at a university in the UK, Canada, New Zealand, the USA or Ireland'], ['other-english', 'Yes \u2014 but elsewhere'], ['no', 'No']],
          hint: 'This exact combination decides whether you sit an English test at all, so it is worth answering precisely.' },
        { field: 'sltDysphagia', cc: 'nz', q: 'Are you trained and competent to assess and manage dysphagia?',
          opts: [['yes', 'Yes \u2014 I practise in dysphagia independently'], ['supervised', 'Yes, but only with supervision'], ['no', 'No'], ['unsure', 'I\u2019m not sure']],
          hint: 'This one genuinely changes your route, not just your paperwork \u2014 which is why we ask it.' }
      ]
    }
  };

  /* ---------- form option lists ----------
     Rebuilt 26 August 2026 after an edit destroyed this block. COUNTRIES_TOP is the short
     list surfaced above the divider — the countries Ethicare actually recruits from, plus
     every country that appears on a regulator pathway list elsewhere in this file, so that
     nobody can be on a list they cannot select. COUNTRIES_ALL is the full picker below it. */
  var COUNTRIES_TOP = ['United Kingdom', 'Ireland', 'South Africa', 'India', 'Philippines', 'United Arab Emirates', 'Canada', 'Australia', 'New Zealand', 'United States', 'Nigeria', 'Kenya', 'Zimbabwe', 'Pakistan', 'Sri Lanka', 'Egypt', 'Iran', 'Malaysia', 'Singapore', 'Hong Kong', 'Netherlands', 'Germany'];
  var COUNTRIES_ALL = ['Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cambodia', 'Cameroon', 'Canada', 'Chad', 'Chile', 'China', 'Colombia', 'Congo', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 'Denmark', 'Dominican Republic', 'Ecuador', 'Egypt', 'El Salvador', 'Estonia', 'Eswatini', 'Ethiopia', 'Fiji', 'Finland', 'France', 'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guyana', 'Haiti', 'Honduras', 'Hong Kong', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Lithuania', 'Luxembourg', 'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Mauritius', 'Mexico', 'Moldova', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Macedonia', 'Norway', 'Oman', 'Pakistan', 'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar', 'Romania', 'Russia', 'Rwanda', 'Samoa', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa', 'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria', 'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Türkiye', 'Turkmenistan', 'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan', 'Vanuatu', 'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe'];

  var QUAL_LEVELS = [
    { id: 'diploma', label: 'Diploma' },
    { id: 'advanced-diploma', label: 'Advanced diploma' },
    { id: 'associate-degree', label: 'Associate degree' },
    { id: 'bachelors', label: 'Bachelor\u2019s degree' },
    { id: 'honours', label: 'Bachelor\u2019s degree with honours' },
    { id: 'postgrad-cert', label: 'Postgraduate certificate' },
    { id: 'postgrad-dip', label: 'Postgraduate diploma' },
    { id: 'masters', label: 'Master\u2019s degree' },
    /* Examples are what make a level legible, and the useful examples differ by profession — a
       DClinPsy means something to a psychologist and nothing to an anaesthetic technician. So
       the doctorate label adapts; the default names no discipline at all. */
    { id: 'doctorate', label: 'Doctorate', labelBy: { psychologist: 'Doctorate (DClinPsy, PsyD or PhD)', physiotherapist: 'Doctorate (DPT or PhD)' }, labelDefault: 'Doctorate (PhD or professional doctorate)' },
    /* Doctor-only. Medical specialties get their own named-award list (doctorQualLevels), so
       these must never appear in the generic one — offering “MBBS” or “specialist / vocational”
       to an anaesthetic technician or a sonographer reads as though the form has not registered
       which profession they picked. */
    { id: 'primary-medical', label: 'Primary medical qualification (MBBS, MBChB or equivalent)', onlyRecord: 'doctor' },
    { id: 'specialist', label: 'Specialist / vocational qualification', onlyRecord: 'doctor' },
    { id: 'other', label: 'Something else' }
  ];
  var QUAL_OTHER = 'other';
  var QUALIFICATIONS = [];
  var SPECIALIST_QUALS = [];
  var INSTITUTIONS = [];
  var QUAL_LEVEL_HINTS = [];

  var ENGLISH_OPTIONS = ['English is my first language', 'I trained and practised in English in a recognised country', 'IELTS', 'OET', 'PTE', 'TOEFL', 'Another test', 'I believe I meet an education / professional pathway', 'No', 'I\u2019m not sure'];
  var PRIORITIES = ['Highest salary', 'Lower cost of living', 'Employer relocation support', 'Family-friendly location', 'Schools', 'Career progression', 'Work-life balance', 'Major city', 'Regional lifestyle', 'Beaches / outdoors', 'Warmer climate', 'Permanent relocation', 'I\u2019m still exploring'];
  var PARTY = ['Just me', 'Partner', 'Partner and child/children', 'Child/children', 'Other'];
  var TIMEFRAMES = ['As soon as possible', 'Within 3 months', '3–6 months', '6–12 months', '12+ months', 'Just exploring'];

  window.ETHICARE_PATHWAYS = {
    meta: { lastReviewedDefault: LAST, site: SITE, guideAu: GUIDE_AU, guideNz: GUIDE_NZ, jobs: JOBS, contact: CONTACT, apply: SITE + '/apply' },
    statuses: STATUSES,
    groups: GROUPS,
    professions: PROFESSIONS,
    rules: RULES,
    english: ENGLISH,
    outlookTiers: OUTLOOK_TIERS,
    outlooks: OUTLOOKS,
    records: RECORDS,
    notRecruited: NOT_RECRUITED,
    countriesTop: COUNTRIES_TOP,
    countriesAll: COUNTRIES_ALL,
    qualLevels: QUAL_LEVELS,
    /* For a doctor, "level" is the wrong question. Diploma/bachelor/master's describes nothing a
       medical regulator acts on, and "specialist / vocational qualification" only repeats the
       career-stage answer. What decides the route is WHICH AWARD you hold: the Council sorts
       applicants by the qualification's origin, so the Australasian fellowship, a UK CCT and an
       overseas fellowship are three different pathways, not three labels for one.
       These options map 1:1 onto that fork — VOC1/VOC2, VOC4, VOC3. */
    doctorQualLevels: [
      { id: 'australasian', label: 'The Australasian fellowship for my specialty' },
      { id: 'cct', label: 'A UK CCT — Certificate of Completion of Training' },
      /* A college fellowship is an EXAMINATION, not specialist registration. FRCR, MRCP, FRCA and
         the rest sit inside training; the CCT is what completes it and puts you on the GMC
         specialist register. Without this option a UK radiologist holding FRCR mid-training had
         only two plausible answers, and both were wrong: “CCT” overstates what they hold, and
         “another overseas postgraduate specialist qualification” routes them to VOC3, an
         assessment for completed specialists that they would fail on the first criterion. The
         honest answer changes the destination — usually to a general-scope route. */
      { id: 'fellowship-no-cct', label: 'A college fellowship or membership exam (FRCR, MRCP, FRCA and similar) but no CCT yet' },
      { id: 'overseas-pg', label: 'Another overseas postgraduate specialist qualification' },
      { id: 'in-training', label: 'Still in training — no specialist award yet' },
      { id: 'primary-only', label: 'My primary medical degree only' }
    ],
    qualOther: QUAL_OTHER,
    qualifications: QUALIFICATIONS,
    specialistQuals: SPECIALIST_QUALS,
    institutions: INSTITUTIONS,
    qualLevelHints: QUAL_LEVEL_HINTS,
    profQuestions: PROF_QUESTIONS,
    englishOptions: ENGLISH_OPTIONS,
    priorities: PRIORITIES,
    party: PARTY,
    timeframes: TIMEFRAMES
  };
})();
