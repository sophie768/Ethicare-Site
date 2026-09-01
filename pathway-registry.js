/* ================================================================
   ETHICARE — REGULATORY REGISTRY (provenance spine)
   ----------------------------------------------------------------
   The structured index over pathway-checker-data.js. One row per
   assertion the checker makes about a regulator, carrying the fields
   you cannot hold in prose: when it was verified, when it is next due,
   and what state the rule is in.

   WHY THIS EXISTS. Provenance used to live only in a sentence
   ("Verified 26 August 2026 against mcnz.org.nz"). A sentence cannot
   be sorted, counted or expired, so nothing could answer the only
   question that matters — WHICH RECORDS ARE NOW OUT OF DATE. Rules
   are moving underneath us: NZ pharmacy REQR/CAOP, Australia's
   proposed streamlined medical radiation pathways, Ahpra English
   scores (April 2026), fee schedules, exam routes. A beautiful
   checker serving an outdated pathway is more dangerous than no
   checker, so staleness is now computable and shown.

   LIFECYCLE — the state of the RULE, not of the candidate's result:
     active        in force, as published by the regulator
     announced     a change is confirmed with a known start date
     consultation  a change is proposed, not yet decided
     retired       superseded; must never render as current
     unconfirmed   the record's own stamp says it could NOT be
                   confirmed at source. Cautions the candidate and
                   counts as overdue regardless of date.
     unstamped     carries only the file's default stamp, so the row
                   does not evidence its own verification. The data
                   file documents a full pre-launch pass on 18 Aug
                   2026 covering these, so this is a records-management
                   gap rather than a doubted rule: it shows in the
                   audit as work to do and does NOT caution the
                   candidate. Re-stamp it and it becomes active.

   CADENCE. 90 days, per the review ownership block in the data
   file. nextReview = verified + cadence. Past that, the row is
   overdue and the checker says so on the result.

   FIELDS. id · kind (record | rule | outlook) · appliesTo (record
   keys this row bears on — how a rule reaches the results that
   depend on it) · profession ·
   country · regulator · pathway · source · sourceHost · sourceDate
   (the regulator's own publication date, where we hold it) ·
   verified · nextReview · lifecycle · verbatim (the human sentence,
   kept intact — it carries nuance the fields cannot).

   EDITING. Re-verify against the regulator's own page, then update
   BOTH: the prose stamp in pathway-checker-data.js and the dates
   here. Seeded 2026-08-27 from the prose stamps already in the
   data file; 2 row(s) carry no parseable date and 2 are unconfirmed.
   sourceDate is deliberately blank until someone reads the
   regulator's page and records its publication date — an invented
   one would be worse than none.

   ONE SEEDING RULE WORTH KNOWING. A prose stamp containing no form
   of the word "verified" does not evidence its own verification — it
   is the file's default stamp, which reads like provenance and is
   not. Those rows are seeded 'unstamped'. That is the same line the
   audit page has always held; the registry now holds it in data
   rather than in a string test.

   WHY UNSTAMPED DOES NOT WARN THE CANDIDATE. Warning on a third of
   results would spend the checker's credibility on a filing problem
   and teach people to ignore the notice that matters. The audit is
   where an unstamped row is loud; the result is where a genuinely
   doubted one is.
   ================================================================ */
(function () {
  var CADENCE_DAYS = 90;
  var ROWS = [
    {
      "id": "records.psychologist.nz",
      "kind": "record",
      "regulator": "New Zealand Psychologists Board",
      "pathway": "Individual NZ Psychologists Board assessment",
      "source": "https://psychologistsboard.org.nz/want-to-register/overseas-trained-how-to-register/",
      "sourceHost": "psychologistsboard.org.nz",
      "sourceDate": "",
      "verified": "2026-07-01",
      "nextReview": "2026-09-29",
      "lifecycle": "unstamped",
      "verbatim": "August 2026 (Raka Māui programme applies from 1 July 2026)",
      "profession": "psychologist",
      "professionLabel": "Psychologist",
      "country": "nz",
      "appliesTo": [
        "psychologist"
      ]
    },
    {
      "id": "outlooks.anaesthetic-technician.nz",
      "kind": "outlook",
      "regulator": "",
      "pathway": "",
      "source": "",
      "sourceHost": "",
      "sourceDate": "",
      "verified": "2026-08-01",
      "nextReview": "2026-10-30",
      "lifecycle": "unstamped",
      "verbatim": "August 2026",
      "profession": "anaesthetic-technician",
      "professionLabel": "Anaesthetic Technician / ODP",
      "country": "nz",
      "appliesTo": [
        "anaesthetic-technician"
      ]
    },
    {
      "id": "outlooks.physiotherapist.nz",
      "kind": "outlook",
      "regulator": "",
      "pathway": "",
      "source": "",
      "sourceHost": "",
      "sourceDate": "",
      "verified": "2026-08-01",
      "nextReview": "2026-10-30",
      "lifecycle": "unstamped",
      "verbatim": "August 2026 (Express Pathway updated July 2026)",
      "profession": "physiotherapist",
      "professionLabel": "Physiotherapist",
      "country": "nz",
      "appliesTo": [
        "physiotherapist"
      ]
    },
    {
      "id": "outlooks.psychologist.au",
      "kind": "outlook",
      "regulator": "",
      "pathway": "",
      "source": "",
      "sourceHost": "",
      "sourceDate": "",
      "verified": "2026-08-01",
      "nextReview": "2026-10-30",
      "lifecycle": "unstamped",
      "verbatim": "August 2026",
      "profession": "psychologist",
      "professionLabel": "Psychologist",
      "country": "au",
      "appliesTo": [
        "psychologist"
      ]
    },
    {
      "id": "records.anaesthetic-technician.au",
      "kind": "record",
      "regulator": "No national registration for anaesthetic technicians",
      "pathway": "Set by the employer, not by a regulator",
      "source": "https://www.asa.org.au/",
      "sourceHost": "asa.org.au",
      "sourceDate": "",
      "verified": "2026-08-01",
      "nextReview": "2026-10-30",
      "lifecycle": "unstamped",
      "verbatim": "August 2026 (non-regulated status confirmed; state and employer requirements vary)",
      "profession": "anaesthetic-technician",
      "professionLabel": "Anaesthetic Technician / ODP",
      "country": "au",
      "appliesTo": [
        "anaesthetic-technician"
      ]
    },
    {
      "id": "records.anaesthetic-technician.nz",
      "kind": "record",
      "regulator": "Medical Sciences Council of New Zealand (MSCNZ)",
      "pathway": "Registration with the Medical Sciences Council",
      "source": "https://www.mscouncil.org.nz/",
      "sourceHost": "mscouncil.org.nz",
      "sourceDate": "",
      "verified": "2026-08-01",
      "nextReview": "2026-10-30",
      "lifecycle": "active",
      "verbatim": "August 2026 (statutory registration confirmed; UK ODP criteria to verify)",
      "profession": "anaesthetic-technician",
      "professionLabel": "Anaesthetic Technician / ODP",
      "country": "nz",
      "appliesTo": [
        "anaesthetic-technician"
      ]
    },
    {
      "id": "records.doctor.au",
      "kind": "record",
      "regulator": "Medical Board of Australia (Ahpra)",
      "pathway": "AMC assessment, then Medical Board registration",
      "source": "https://www.amc.org.au/assessment/",
      "sourceHost": "amc.org.au",
      "sourceDate": "",
      "verified": "2026-08-01",
      "nextReview": "2026-10-30",
      "lifecycle": "unstamped",
      "verbatim": "August 2026",
      "profession": "doctor",
      "professionLabel": "General Practitioner",
      "country": "au",
      "appliesTo": [
        "doctor"
      ]
    },
    {
      "id": "records.imaging.au",
      "kind": "record",
      "regulator": "Medical Radiation Practice Board of Australia (Ahpra)",
      "pathway": "Your qualification will need to be checked against the Australian registration pathway",
      "source": "https://www.medicalradiationpracticeboard.gov.au/Registration/Qualifications.aspx",
      "sourceHost": "medicalradiationpracticeboard.gov.au",
      "sourceDate": "",
      "verified": "2026-08-01",
      "nextReview": "2026-10-30",
      "lifecycle": "unstamped",
      "verbatim": "August 2026",
      "profession": "imaging",
      "professionLabel": "Diagnostic Radiographer / MIT",
      "country": "au",
      "appliesTo": [
        "imaging"
      ]
    },
    {
      "id": "records.imaging.nz",
      "kind": "record",
      "regulator": "Medical Radiation Technologists Board (MRTB)",
      "pathway": "Individual MRTB assessment",
      "source": "https://www.mrtboard.org.nz/pre-registration/overseas-trained-how-to-register",
      "sourceHost": "mrtboard.org.nz",
      "sourceDate": "",
      "verified": "2026-08-01",
      "nextReview": "2026-10-30",
      "lifecycle": "unstamped",
      "verbatim": "August 2026",
      "profession": "imaging",
      "professionLabel": "Diagnostic Radiographer / MIT",
      "country": "nz",
      "appliesTo": [
        "imaging"
      ]
    },
    {
      "id": "records.midwifery.au",
      "kind": "record",
      "regulator": "Nursing and Midwifery Board of Australia (Ahpra)",
      "pathway": "Midwifery registration with the NMBA",
      "source": "https://www.nursingmidwiferyboard.gov.au/Registration-and-Endorsement/International.aspx",
      "sourceHost": "nursingmidwiferyboard.gov.au",
      "sourceDate": "",
      "verified": "2026-08-01",
      "nextReview": "2026-10-30",
      "lifecycle": "active",
      "verbatim": "August 2026 (separate register confirmed; overseas assessment criteria to verify)",
      "profession": "midwifery",
      "professionLabel": "Midwife",
      "country": "au",
      "appliesTo": [
        "midwifery"
      ]
    },
    {
      "id": "records.mri.au",
      "kind": "record",
      "regulator": "Medical Radiation Practice Board of Australia (Ahpra)",
      "pathway": "MRI in Australia sits within medical radiation practice registration",
      "source": "https://www.medicalradiationpracticeboard.gov.au/Registration/Qualifications.aspx",
      "sourceHost": "medicalradiationpracticeboard.gov.au",
      "sourceDate": "",
      "verified": "2026-08-01",
      "nextReview": "2026-10-30",
      "lifecycle": "unstamped",
      "verbatim": "August 2026",
      "profession": "mri",
      "professionLabel": "MRI Technologist",
      "country": "au",
      "appliesTo": [
        "mri"
      ]
    },
    {
      "id": "records.mri.nz",
      "kind": "record",
      "regulator": "Medical Radiation Technologists Board (MRTB)",
      "pathway": "MRI registration requires MRTB assessment",
      "source": "https://www.mrtboard.org.nz/pre-registration/overseas-trained-how-to-register",
      "sourceHost": "mrtboard.org.nz",
      "sourceDate": "",
      "verified": "2026-08-01",
      "nextReview": "2026-10-30",
      "lifecycle": "unstamped",
      "verbatim": "August 2026",
      "profession": "mri",
      "professionLabel": "MRI Technologist",
      "country": "nz",
      "appliesTo": [
        "mri"
      ]
    },
    {
      "id": "records.nursing.au",
      "kind": "record",
      "regulator": "Nursing and Midwifery Board of Australia (Ahpra)",
      "pathway": "Outcomes-based assessment with the NMBA",
      "source": "https://www.nursingmidwiferyboard.gov.au/Registration-and-Endorsement/International.aspx",
      "sourceHost": "nursingmidwiferyboard.gov.au",
      "sourceDate": "",
      "verified": "2026-08-01",
      "nextReview": "2026-10-30",
      "lifecycle": "unstamped",
      "verbatim": "August 2026",
      "profession": "nursing",
      "professionLabel": "Registered Nurse",
      "country": "au",
      "appliesTo": [
        "nursing"
      ]
    },
    {
      "id": "records.occupational-therapist.au",
      "kind": "record",
      "regulator": "Occupational Therapy Board of Australia (Ahpra)",
      "pathway": "Check your international OT pathway",
      "source": "https://www.occupationaltherapyboard.gov.au/Registration/Internationally-qualified-occupational-therapists.aspx",
      "sourceHost": "occupationaltherapyboard.gov.au",
      "sourceDate": "",
      "verified": "2026-08-01",
      "nextReview": "2026-10-30",
      "lifecycle": "unstamped",
      "verbatim": "August 2026",
      "profession": "occupational-therapist",
      "professionLabel": "Occupational Therapist",
      "country": "au",
      "appliesTo": [
        "occupational-therapist"
      ]
    },
    {
      "id": "records.physiotherapist.au",
      "kind": "record",
      "regulator": "Physiotherapy Board of Australia (Ahpra)",
      "pathway": "Australian Physiotherapy Council assessment",
      "source": "https://physiocouncil.com.au/international-physiotherapists/getting-started",
      "sourceHost": "physiocouncil.com.au",
      "sourceDate": "",
      "verified": "2026-08-01",
      "nextReview": "2026-10-30",
      "lifecycle": "unstamped",
      "verbatim": "August 2026",
      "profession": "physiotherapist",
      "professionLabel": "Physiotherapist",
      "country": "au",
      "appliesTo": [
        "physiotherapist"
      ]
    },
    {
      "id": "records.physiotherapist.nz",
      "kind": "record",
      "regulator": "Physiotherapy Board of New Zealand",
      "pathway": "International General Pathway",
      "source": "https://physioboard.org.nz/international-express-pathway",
      "sourceHost": "physioboard.org.nz",
      "sourceDate": "",
      "verified": "2026-08-01",
      "nextReview": "2026-10-30",
      "lifecycle": "unstamped",
      "verbatim": "August 2026 (Express Pathway updated July 2026)",
      "profession": "physiotherapist",
      "professionLabel": "Physiotherapist",
      "country": "nz",
      "appliesTo": [
        "physiotherapist"
      ]
    },
    {
      "id": "records.psychologist.au",
      "kind": "record",
      "regulator": "Psychology Board of Australia (Ahpra)",
      "pathway": "Individual Psychology Board pathway",
      "source": "https://www.psychologyboard.gov.au/Registration/Overseas-Applicants.aspx",
      "sourceHost": "psychologyboard.gov.au",
      "sourceDate": "",
      "verified": "2026-08-01",
      "nextReview": "2026-10-30",
      "lifecycle": "unstamped",
      "verbatim": "August 2026",
      "profession": "psychologist",
      "professionLabel": "Psychologist",
      "country": "au",
      "appliesTo": [
        "psychologist"
      ]
    },
    {
      "id": "records.social-worker.nz",
      "kind": "record",
      "regulator": "Social Workers Registration Board (SWRB)",
      "pathway": "Registration is mandatory, not optional",
      "source": "https://swrb.govt.nz/",
      "sourceHost": "swrb.govt.nz",
      "sourceDate": "",
      "verified": "2026-08-01",
      "nextReview": "2026-10-30",
      "lifecycle": "active",
      "verbatim": "August 2026 (mandatory registration confirmed; overseas assessment criteria to verify)",
      "profession": "social-worker",
      "professionLabel": "Social Worker",
      "country": "nz",
      "appliesTo": [
        "social-worker"
      ]
    },
    {
      "id": "records.sonographer.au",
      "kind": "record",
      "regulator": "Australian Sonographer Accreditation Registry (ASAR)",
      "pathway": "Overseas sonography pathway",
      "source": "https://www.asar.com.au/sonographer-info/temporary-residents/",
      "sourceHost": "asar.com.au",
      "sourceDate": "",
      "verified": "2026-08-01",
      "nextReview": "2026-10-30",
      "lifecycle": "unstamped",
      "verbatim": "August 2026",
      "profession": "sonographer",
      "professionLabel": "Sonographer",
      "country": "au",
      "appliesTo": [
        "sonographer"
      ]
    },
    {
      "id": "records.sonographer.nz",
      "kind": "record",
      "regulator": "Medical Radiation Technologists Board (MRTB)",
      "pathway": "Individual MRTB assessment for the sonographer scope",
      "source": "https://www.mrtboard.org.nz/pre-registration/overseas-trained-how-to-register",
      "sourceHost": "mrtboard.org.nz",
      "sourceDate": "",
      "verified": "2026-08-01",
      "nextReview": "2026-10-30",
      "lifecycle": "unstamped",
      "verbatim": "August 2026",
      "profession": "sonographer",
      "professionLabel": "Sonographer",
      "country": "nz",
      "appliesTo": [
        "sonographer"
      ]
    },
    {
      "id": "records.speech-language-therapist.nz",
      "kind": "record",
      "regulator": "New Zealand Speech-language Therapists’ Association (NZSTA)",
      "pathway": "Professional membership, not statutory registration",
      "source": "https://speechtherapy.org.nz/",
      "sourceHost": "speechtherapy.org.nz",
      "sourceDate": "",
      "verified": "2026-08-01",
      "nextReview": "2026-10-30",
      "lifecycle": "active",
      "verbatim": "August 2026 (non-statutory status confirmed; membership criteria to verify)",
      "profession": "speech-language-therapist",
      "professionLabel": "Speech & Language Therapist",
      "country": "nz",
      "appliesTo": [
        "speech-language-therapist"
      ]
    },
    {
      "id": "rules.nzOdpUk",
      "kind": "rule",
      "regulator": "the Medical Sciences Council of New Zealand",
      "pathway": "defined route for UK-trained practitioners",
      "source": "",
      "sourceHost": "",
      "sourceDate": "",
      "verified": "2026-08-01",
      "nextReview": "2026-10-30",
      "lifecycle": "unstamped",
      "verbatim": "August 2026",
      "profession": "",
      "professionLabel": "",
      "country": "nz",
      "appliesTo": [
        "anaesthetic-technician"
      ]
    },
    {
      "id": "rules.nzPhysioExpress",
      "kind": "rule",
      "regulator": "the Physiotherapy Board of New Zealand",
      "pathway": "International Express Pathway",
      "source": "https://physioboard.org.nz/international-express-pathway",
      "sourceHost": "physioboard.org.nz",
      "sourceDate": "",
      "verified": "2026-08-01",
      "nextReview": "2026-10-30",
      "lifecycle": "unstamped",
      "verbatim": "August 2026 (Express Pathway updated July 2026)",
      "profession": "",
      "professionLabel": "",
      "country": "nz",
      "appliesTo": [
        "physiotherapist"
      ]
    },
    {
      "id": "rules.ttmra",
      "kind": "rule",
      "regulator": "",
      "pathway": "",
      "source": "",
      "sourceHost": "",
      "sourceDate": "",
      "verified": "2026-08-01",
      "nextReview": "2026-10-30",
      "lifecycle": "unstamped",
      "verbatim": "August 2026",
      "profession": "",
      "professionLabel": "",
      "country": "",
      "appliesTo": [],
      "scope": "global"
    },
    {
      "id": "outlooks.doctor.au",
      "kind": "outlook",
      "regulator": "",
      "pathway": "",
      "source": "",
      "sourceHost": "",
      "sourceDate": "",
      "verified": "2026-08-18",
      "nextReview": "2026-11-16",
      "lifecycle": "active",
      "verbatim": "August 2026 (competent authorities verified 18 Aug 2026)",
      "profession": "doctor",
      "professionLabel": "General Practitioner",
      "country": "au",
      "appliesTo": [
        "doctor"
      ]
    },
    {
      "id": "outlooks.doctor.nz",
      "kind": "outlook",
      "regulator": "",
      "pathway": "",
      "source": "",
      "sourceHost": "",
      "sourceDate": "",
      "verified": "2026-08-18",
      "nextReview": "2026-11-16",
      "lifecycle": "active",
      "verbatim": "August 2026 (Competent Authority + Comparable Health System criteria verified 18 Aug 2026)",
      "profession": "doctor",
      "professionLabel": "General Practitioner",
      "country": "nz",
      "appliesTo": [
        "doctor"
      ]
    },
    {
      "id": "outlooks.imaging.au",
      "kind": "outlook",
      "regulator": "",
      "pathway": "",
      "source": "",
      "sourceHost": "",
      "sourceDate": "",
      "verified": "2026-08-18",
      "nextReview": "2026-11-16",
      "lifecycle": "active",
      "verbatim": "August 2026 (MRPBA approved-qualifications list verified 18 Aug 2026)",
      "profession": "imaging",
      "professionLabel": "Diagnostic Radiographer / MIT",
      "country": "au",
      "appliesTo": [
        "imaging"
      ]
    },
    {
      "id": "outlooks.imaging.nz",
      "kind": "outlook",
      "regulator": "",
      "pathway": "",
      "source": "",
      "sourceHost": "",
      "sourceDate": "",
      "verified": "2026-08-18",
      "nextReview": "2026-11-16",
      "lifecycle": "active",
      "verbatim": "August 2026 (verified 18 Aug 2026 — no published country list; assessed per scope)",
      "profession": "imaging",
      "professionLabel": "Diagnostic Radiographer / MIT",
      "country": "nz",
      "appliesTo": [
        "imaging"
      ]
    },
    {
      "id": "outlooks.mri.au",
      "kind": "outlook",
      "regulator": "",
      "pathway": "",
      "source": "",
      "sourceHost": "",
      "sourceDate": "",
      "verified": "2026-08-18",
      "nextReview": "2026-11-16",
      "lifecycle": "active",
      "verbatim": "August 2026 (MRPBA approved-qualifications list verified 18 Aug 2026)",
      "profession": "mri",
      "professionLabel": "MRI Technologist",
      "country": "au",
      "appliesTo": [
        "mri"
      ]
    },
    {
      "id": "outlooks.mri.nz",
      "kind": "outlook",
      "regulator": "",
      "pathway": "",
      "source": "",
      "sourceHost": "",
      "sourceDate": "",
      "verified": "2026-08-18",
      "nextReview": "2026-11-16",
      "lifecycle": "active",
      "verbatim": "August 2026 (verified 18 Aug 2026 — no published country list; assessed per scope)",
      "profession": "mri",
      "professionLabel": "MRI Technologist",
      "country": "nz",
      "appliesTo": [
        "mri"
      ]
    },
    {
      "id": "outlooks.nursing.au",
      "kind": "outlook",
      "regulator": "",
      "pathway": "",
      "source": "",
      "sourceHost": "",
      "sourceDate": "",
      "verified": "2026-08-18",
      "nextReview": "2026-11-16",
      "lifecycle": "active",
      "verbatim": "August 2026 (NMBA Pathway 1 country list verified 18 Aug 2026)",
      "profession": "nursing",
      "professionLabel": "Registered Nurse",
      "country": "au",
      "appliesTo": [
        "nursing"
      ]
    },
    {
      "id": "outlooks.occupational-therapist.au",
      "kind": "outlook",
      "regulator": "",
      "pathway": "",
      "source": "",
      "sourceHost": "",
      "sourceDate": "",
      "verified": "2026-08-18",
      "nextReview": "2026-11-16",
      "lifecycle": "active",
      "verbatim": "August 2026 (WFOT criterion + OTC competence-assessment model verified 18 Aug 2026)",
      "profession": "occupational-therapist",
      "professionLabel": "Occupational Therapist",
      "country": "au",
      "appliesTo": [
        "occupational-therapist"
      ]
    },
    {
      "id": "outlooks.occupational-therapist.nz",
      "kind": "outlook",
      "regulator": "",
      "pathway": "",
      "source": "",
      "sourceHost": "",
      "sourceDate": "",
      "verified": "2026-08-18",
      "nextReview": "2026-11-16",
      "lifecycle": "active",
      "verbatim": "August 2026 (OTBNZ overseas page verified 18 Aug 2026)",
      "profession": "occupational-therapist",
      "professionLabel": "Occupational Therapist",
      "country": "nz",
      "appliesTo": [
        "occupational-therapist"
      ]
    },
    {
      "id": "outlooks.physiotherapist.au",
      "kind": "outlook",
      "regulator": "",
      "pathway": "",
      "source": "",
      "sourceHost": "",
      "sourceDate": "",
      "verified": "2026-08-18",
      "nextReview": "2026-11-16",
      "lifecycle": "active",
      "verbatim": "August 2026 (FLYR lists verified 18 Aug 2026)",
      "profession": "physiotherapist",
      "professionLabel": "Physiotherapist",
      "country": "au",
      "appliesTo": [
        "physiotherapist"
      ]
    },
    {
      "id": "outlooks.sonographer.au",
      "kind": "outlook",
      "regulator": "",
      "pathway": "",
      "source": "",
      "sourceHost": "",
      "sourceDate": "",
      "verified": "2026-08-18",
      "nextReview": "2026-11-16",
      "lifecycle": "active",
      "verbatim": "August 2026 (ASMIRT pre-approved course list + ASAR Category 1B verified 18 Aug 2026)",
      "profession": "sonographer",
      "professionLabel": "Sonographer",
      "country": "au",
      "appliesTo": [
        "sonographer"
      ]
    },
    {
      "id": "outlooks.sonographer.nz",
      "kind": "outlook",
      "regulator": "",
      "pathway": "",
      "source": "",
      "sourceHost": "",
      "sourceDate": "",
      "verified": "2026-08-18",
      "nextReview": "2026-11-16",
      "lifecycle": "active",
      "verbatim": "August 2026 (verified 18 Aug 2026 — MRTB assesses the sonographer scope individually)",
      "profession": "sonographer",
      "professionLabel": "Sonographer",
      "country": "nz",
      "appliesTo": [
        "sonographer"
      ]
    },
    {
      "id": "rules.auDoctorCompetentAuthority",
      "kind": "rule",
      "regulator": "the Medical Board of Australia",
      "pathway": "Competent Authority pathway",
      "source": "https://www.medicalboard.gov.au/Registration/International-Medical-Graduates/Competent-Authority-Pathway.aspx",
      "sourceHost": "medicalboard.gov.au",
      "sourceDate": "",
      "verified": "2026-08-18",
      "nextReview": "2026-11-16",
      "lifecycle": "active",
      "verbatim": "August 2026 (competent authorities verified 18 Aug 2026)",
      "profession": "",
      "professionLabel": "",
      "country": "au",
      "appliesTo": [
        "doctor"
      ]
    },
    {
      "id": "rules.auPhysioExpressFlyr",
      "kind": "rule",
      "regulator": "the Australian Physiotherapy Council",
      "pathway": "Express FLYR pathway",
      "source": "https://physiocouncil.com.au/international-physiotherapists/express-flyr-pathway",
      "sourceHost": "physiocouncil.com.au",
      "sourceDate": "",
      "verified": "2026-08-18",
      "nextReview": "2026-11-16",
      "lifecycle": "active",
      "verbatim": "August 2026 (Express FLYR country list verified 18 Aug 2026)",
      "profession": "",
      "professionLabel": "",
      "country": "au",
      "appliesTo": [
        "physiotherapist"
      ]
    },
    {
      "id": "rules.auPhysioFlyr",
      "kind": "rule",
      "regulator": "the Australian Physiotherapy Council",
      "pathway": "FLYR pathway",
      "source": "https://physiocouncil.com.au/international-physiotherapists/flyr-pathway",
      "sourceHost": "physiocouncil.com.au",
      "sourceDate": "",
      "verified": "2026-08-18",
      "nextReview": "2026-11-16",
      "lifecycle": "active",
      "verbatim": "August 2026 (FLYR country list verified 18 Aug 2026)",
      "profession": "",
      "professionLabel": "",
      "country": "au",
      "appliesTo": [
        "physiotherapist"
      ]
    },
    {
      "id": "outlooks.nursing.nz",
      "kind": "outlook",
      "regulator": "",
      "pathway": "",
      "source": "",
      "sourceHost": "",
      "sourceDate": "",
      "verified": "2026-08-26",
      "nextReview": "2026-11-24",
      "lifecycle": "active",
      "verbatim": "August 2026 (self-assessment tool logic + all fees verified 26 Aug 2026)",
      "profession": "nursing",
      "professionLabel": "Registered Nurse",
      "country": "nz",
      "appliesTo": [
        "nursing"
      ]
    },
    {
      "id": "outlooks.psychologist.nz",
      "kind": "outlook",
      "regulator": "",
      "pathway": "",
      "source": "",
      "sourceHost": "",
      "sourceDate": "",
      "verified": "2026-08-26",
      "nextReview": "2026-11-24",
      "lifecycle": "active",
      "verbatim": "August 2026 (prescribed countries, five criteria and full fee schedule verified 26 Aug 2026)",
      "profession": "psychologist",
      "professionLabel": "Psychologist",
      "country": "nz",
      "appliesTo": [
        "psychologist"
      ]
    },
    {
      "id": "records.dietitian.au",
      "kind": "record",
      "regulator": "Dietitians Australia",
      "pathway": "Accredited Practising Dietitian credential",
      "source": "https://dietitiansaustralia.org.au/",
      "sourceHost": "dietitiansaustralia.org.au",
      "sourceDate": "",
      "verified": "2026-08-26",
      "nextReview": "2026-11-24",
      "lifecycle": "active",
      "verbatim": "Verified 26 August 2026 against dietitiansaustralia.org.au (DSR three-stage process, timings and the three-year clock)",
      "profession": "dietitian",
      "professionLabel": "Dietitian",
      "country": "au",
      "appliesTo": [
        "dietitian"
      ]
    },
    {
      "id": "records.dietitian.nz",
      "kind": "record",
      "regulator": "Dietitians Board (New Zealand)",
      "pathway": "Statutory registration with the Dietitians Board",
      "source": "https://www.dietitiansboard.org.nz/Public/Public/Registration/Overseas-Trained.aspx",
      "sourceHost": "dietitiansboard.org.nz",
      "sourceDate": "",
      "verified": "2026-08-26",
      "nextReview": "2026-11-24",
      "lifecycle": "active",
      "verbatim": "Verified 26 August 2026 against dietitiansboard.org.nz",
      "profession": "dietitian",
      "professionLabel": "Dietitian",
      "country": "nz",
      "appliesTo": [
        "dietitian"
      ]
    },
    {
      "id": "records.doctor.nz",
      "kind": "record",
      "regulator": "Medical Council of New Zealand",
      "pathway": "Registration with the Medical Council of New Zealand",
      "source": "https://www.mcnz.org.nz/registration/getting-registered/registration-pathways/",
      "sourceHost": "mcnz.org.nz",
      "sourceDate": "",
      "verified": "2026-08-26",
      "nextReview": "2026-11-24",
      "lifecycle": "active",
      "verbatim": "Verified 26 August 2026 against mcnz.org.nz",
      "profession": "doctor",
      "professionLabel": "General Practitioner",
      "country": "nz",
      "appliesTo": [
        "doctor"
      ]
    },
    {
      "id": "records.midwifery.nz",
      "kind": "record",
      "regulator": "Midwifery Council of New Zealand",
      "pathway": "Registration with the Midwifery Council of New Zealand",
      "source": "https://midwiferycouncil.health.nz/Web/I-want-to-become-a-midwife-in-New-Zealand/IQM-Process.aspx",
      "sourceHost": "midwiferycouncil.health.nz",
      "sourceDate": "",
      "verified": "2026-08-26",
      "nextReview": "2026-11-24",
      "lifecycle": "active",
      "verbatim": "Verified 26 August 2026 against midwiferycouncil.health.nz",
      "profession": "midwifery",
      "professionLabel": "Midwife",
      "country": "nz",
      "appliesTo": [
        "midwifery"
      ]
    },
    {
      "id": "records.nursing.nz",
      "kind": "record",
      "regulator": "Nursing Council of New Zealand",
      "pathway": "Registration with the Nursing Council of New Zealand",
      "source": "https://nursingcouncil.org.nz/IQN/IQN/Competence-assessment-process.aspx",
      "sourceHost": "nursingcouncil.org.nz",
      "sourceDate": "",
      "verified": "2026-08-26",
      "nextReview": "2026-11-24",
      "lifecycle": "active",
      "verbatim": "Verified 26 August 2026 against nursingcouncil.org.nz",
      "profession": "nursing",
      "professionLabel": "Registered Nurse",
      "country": "nz",
      "appliesTo": [
        "nursing"
      ]
    },
    {
      "id": "records.occupational-therapist.nz",
      "kind": "record",
      "regulator": "Occupational Therapy Board of New Zealand",
      "pathway": "Overseas qualification assessment",
      "source": "https://www.otboard.org.nz/site/rp/overseas?nav=sidebar",
      "sourceHost": "otboard.org.nz",
      "sourceDate": "",
      "verified": "2026-08-26",
      "nextReview": "2026-11-24",
      "lifecycle": "active",
      "verbatim": "Verified 26 August 2026 against otboard.org.nz (abridged and standard pathways, fees, processing time)",
      "profession": "occupational-therapist",
      "professionLabel": "Occupational Therapist",
      "country": "nz",
      "appliesTo": [
        "occupational-therapist"
      ]
    },
    {
      "id": "records.social-worker.au",
      "kind": "record",
      "regulator": "Australian Association of Social Workers (AASW)",
      "pathway": "Professional membership, not statutory registration",
      "source": "https://www.aasw.asn.au/",
      "sourceHost": "aasw.asn.au",
      "sourceDate": "",
      "verified": "2026-08-26",
      "nextReview": "2026-11-24",
      "lifecycle": "active",
      "verbatim": "Verified 26 August 2026 against dietitiansaustralia.org.au (DSR three-stage process, timings and the three-year clock)",
      "profession": "social-worker",
      "professionLabel": "Social Worker",
      "country": "au",
      "appliesTo": [
        "social-worker"
      ]
    },
    {
      "id": "records.speech-language-therapist.au",
      "kind": "record",
      "regulator": "Speech Pathology Australia",
      "pathway": "Professional credential, not statutory registration",
      "source": "https://www.speechpathologyaustralia.org.au/",
      "sourceHost": "speechpathologyaustralia.org.au",
      "sourceDate": "",
      "verified": "2026-08-26",
      "nextReview": "2026-11-24",
      "lifecycle": "active",
      "verbatim": "Verified 26 August 2026 against dietitiansaustralia.org.au (DSR three-stage process, timings and the three-year clock)",
      "profession": "speech-language-therapist",
      "professionLabel": "Speech & Language Therapist",
      "country": "au",
      "appliesTo": [
        "speech-language-therapist"
      ]
    },
    {
      "id": "rules.auDietitianDsr",
      "kind": "rule",
      "regulator": "",
      "pathway": "",
      "source": "https://dietitiansaustralia.org.au/working-dietetics/skills-recognition-australia/process-overseas-educated-dietitians",
      "sourceHost": "dietitiansaustralia.org.au",
      "sourceDate": "",
      "verified": "2026-08-26",
      "nextReview": "2026-11-24",
      "lifecycle": "active",
      "verbatim": "Verified 26 August 2026 against dietitiansaustralia.org.au",
      "profession": "",
      "professionLabel": "",
      "country": "au",
      "appliesTo": [
        "dietitian"
      ]
    },
    {
      "id": "rules.auExpeditedSpecialist",
      "kind": "rule",
      "regulator": "the Medical Board of Australia",
      "pathway": "Expedited Specialist pathway",
      "source": "https://www.medicalboard.gov.au/Registration/International-Medical-Graduates/Expedited-specialist-pathway/Expedited-Specialist-pathway-accepted-qualification-list",
      "sourceHost": "medicalboard.gov.au",
      "sourceDate": "",
      "verified": "2026-08-26",
      "nextReview": "2026-11-24",
      "lifecycle": "unconfirmed",
      "verbatim": "Verified 26 August 2026 against medicalboard.gov.au — diagnostic radiology status UNCONFIRMED, re-check before relying on it",
      "profession": "",
      "professionLabel": "",
      "country": "au",
      "appliesTo": [
        "doctor"
      ]
    },
    {
      "id": "rules.auIqrnStreamlined",
      "kind": "rule",
      "regulator": "the Nursing and Midwifery Board of Australia",
      "pathway": "General registration for internationally qualified registered nurses",
      "source": "https://www.nursingmidwiferyboard.gov.au/News/2025-01-27-media-release-IQRN.aspx",
      "sourceHost": "nursingmidwiferyboard.gov.au",
      "sourceDate": "",
      "verified": "2026-08-26",
      "nextReview": "2026-11-24",
      "lifecycle": "active",
      "verbatim": "Verified 26 August 2026 against the NMBA media release and Ahpra’s IQRN fact sheet",
      "profession": "",
      "professionLabel": "",
      "country": "au",
      "appliesTo": [
        "nursing"
      ]
    },
    {
      "id": "rules.auOtAssessment",
      "kind": "rule",
      "regulator": "the Occupational Therapy Board of Australia, through Ahpra",
      "pathway": "",
      "source": "https://www.otcouncil.com.au/assessment/",
      "sourceHost": "otcouncil.com.au",
      "sourceDate": "",
      "verified": "2026-08-26",
      "nextReview": "2026-11-24",
      "lifecycle": "active",
      "verbatim": "Verified 26 August 2026 against otcouncil.com.au (27 October 2025 cutover, three routes, two outcomes, competence assessment model)",
      "profession": "",
      "professionLabel": "",
      "country": "au",
      "appliesTo": [
        "occupational-therapist"
      ]
    },
    {
      "id": "rules.auPhysioFees",
      "kind": "rule",
      "regulator": "",
      "pathway": "",
      "source": "https://physiocouncil.com.au/international-physiotherapists/fees-and-processing-times",
      "sourceHost": "physiocouncil.com.au",
      "sourceDate": "",
      "verified": "2026-08-26",
      "nextReview": "2026-11-24",
      "lifecycle": "active",
      "verbatim": "Verified 26 August 2026 against physiocouncil.com.au",
      "profession": "",
      "professionLabel": "",
      "country": "au",
      "appliesTo": [
        "physiotherapist"
      ]
    },
    {
      "id": "rules.auPsyBA",
      "kind": "rule",
      "regulator": "the Psychology Board of Australia",
      "pathway": "",
      "source": "https://www.psychologyboard.gov.au/registration/overseas-applicants/transitional-program.aspx",
      "sourceHost": "psychologyboard.gov.au",
      "sourceDate": "",
      "verified": "2026-08-26",
      "nextReview": "2026-11-24",
      "lifecycle": "active",
      "verbatim": "Verified 26 August 2026 against psychologyboard.gov.au (transitional program and provisional registration pages)",
      "profession": "",
      "professionLabel": "",
      "country": "au",
      "appliesTo": [
        "psychologist"
      ]
    },
    {
      "id": "rules.auShortTermTraining",
      "kind": "rule",
      "regulator": "the Medical Board of Australia",
      "pathway": "Short term training in a medical specialty",
      "source": "https://www.medicalboard.gov.au/Registration/International-Medical-Graduates/Specialist-Pathway.aspx",
      "sourceHost": "medicalboard.gov.au",
      "sourceDate": "",
      "verified": "2026-08-26",
      "nextReview": "2026-11-24",
      "lifecycle": "active",
      "verbatim": "Verified 26 August 2026 against medicalboard.gov.au",
      "profession": "",
      "professionLabel": "",
      "country": "au",
      "appliesTo": [
        "doctor"
      ]
    },
    {
      "id": "rules.auSpa",
      "kind": "rule",
      "regulator": "",
      "pathway": "",
      "source": "https://www.speechpathologyaustralia.org.au/",
      "sourceHost": "speechpathologyaustralia.org.au",
      "sourceDate": "",
      "verified": "2026-08-26",
      "nextReview": "2026-11-24",
      "lifecycle": "active",
      "verbatim": "Verified 26 August 2026 against the OSQCA Guide for Applicants V3 (April 2026)",
      "profession": "",
      "professionLabel": "",
      "country": "au",
      "appliesTo": [
        "speech-language-therapist"
      ]
    },
    {
      "id": "rules.auSpecialistRecognition",
      "kind": "rule",
      "regulator": "the relevant Australian specialist medical college",
      "pathway": "Specialist pathway — specialist recognition",
      "source": "https://www.medicalboard.gov.au/Registration/International-Medical-Graduates/Specialist-Pathway/Specialist-recognition.aspx",
      "sourceHost": "medicalboard.gov.au",
      "sourceDate": "",
      "verified": "2026-08-26",
      "nextReview": "2026-11-24",
      "lifecycle": "active",
      "verbatim": "Verified 26 August 2026 against medicalboard.gov.au",
      "profession": "",
      "professionLabel": "",
      "country": "au",
      "appliesTo": [
        "doctor"
      ]
    },
    {
      "id": "rules.nzApprovedAustralasian",
      "kind": "rule",
      "regulator": "",
      "pathway": "",
      "source": "https://www.mcnz.org.nz/registration/getting-registered/registration-policy/approved-australasian-qualifications/",
      "sourceHost": "mcnz.org.nz",
      "sourceDate": "",
      "verified": "2026-08-26",
      "nextReview": "2026-11-24",
      "lifecycle": "active",
      "verbatim": "Verified 26 August 2026 against mcnz.org.nz",
      "profession": "",
      "professionLabel": "",
      "country": "nz",
      "appliesTo": [
        "doctor"
      ]
    },
    {
      "id": "rules.nzDietitianRoutes",
      "kind": "rule",
      "regulator": "the Dietitians Board",
      "pathway": "Straight to Registration pathway",
      "source": "https://www.dietitiansboard.org.nz/Public/Public/Registration/Overseas-Trained.aspx",
      "sourceHost": "dietitiansboard.org.nz",
      "sourceDate": "",
      "verified": "2026-08-26",
      "nextReview": "2026-11-24",
      "lifecycle": "active",
      "verbatim": "Verified 26 August 2026 against dietitiansboard.org.nz",
      "profession": "",
      "professionLabel": "",
      "country": "nz",
      "appliesTo": [
        "dietitian"
      ]
    },
    {
      "id": "rules.nzDoctorComparable",
      "kind": "rule",
      "regulator": "the Medical Council of New Zealand",
      "pathway": "Comparable Health System pathway",
      "source": "https://www.mcnz.org.nz/registration/getting-registered/registration-pathways/general-scope/comparable-health-system/",
      "sourceHost": "mcnz.org.nz",
      "sourceDate": "",
      "verified": "2026-08-26",
      "nextReview": "2026-11-24",
      "lifecycle": "active",
      "verbatim": "Verified 26 August 2026 against mcnz.org.nz",
      "profession": "",
      "professionLabel": "",
      "country": "nz",
      "appliesTo": [
        "doctor"
      ]
    },
    {
      "id": "rules.nzDoctorCompetentAuthority",
      "kind": "rule",
      "regulator": "the Medical Council of New Zealand",
      "pathway": "Competent authority pathway",
      "source": "https://www.mcnz.org.nz/registration/getting-registered/registration-pathways/general-scope/uk-and-irish-medical-graduates-competent-authority/",
      "sourceHost": "mcnz.org.nz",
      "sourceDate": "",
      "verified": "2026-08-26",
      "nextReview": "2026-11-24",
      "lifecycle": "active",
      "verbatim": "Verified 26 August 2026 against mcnz.org.nz",
      "profession": "",
      "professionLabel": "",
      "country": "nz",
      "appliesTo": [
        "doctor"
      ]
    },
    {
      "id": "rules.nzLocumTenens",
      "kind": "rule",
      "regulator": "",
      "pathway": "",
      "source": "https://www.mcnz.org.nz/registration/getting-registered/registration-policy/approved-qualifications-for-locum-tenens-specialist-appointments/",
      "sourceHost": "mcnz.org.nz",
      "sourceDate": "",
      "verified": "2026-08-26",
      "nextReview": "2026-11-24",
      "lifecycle": "unconfirmed",
      "verbatim": "Transcribed 26 August 2026 from the Council’s February 2015 PDF — confirm against the current page before relying on it",
      "profession": "",
      "professionLabel": "",
      "country": "nz",
      "appliesTo": [
        "doctor"
      ]
    },
    {
      "id": "rules.nzMrtbFees",
      "kind": "rule",
      "regulator": "",
      "pathway": "",
      "source": "https://www.mrtboard.org.nz/resources-and-publications/fees-payable-to-te-poari-ringa-hangarau-iraruke-new-zealand-medical-radiation-technologists-board-from-16-february-2026",
      "sourceHost": "mrtboard.org.nz",
      "sourceDate": "",
      "verified": "2026-08-26",
      "nextReview": "2026-11-24",
      "lifecycle": "active",
      "verbatim": "Verified 26 August 2026 against the MRTB fees Gazette notice effective 16 February 2026",
      "profession": "",
      "professionLabel": "",
      "country": "nz",
      "appliesTo": [
        "imaging",
        "mri",
        "sonographer"
      ]
    },
    {
      "id": "rules.auMedRadRoutes",
      "kind": "rule",
      "regulator": "the Medical Radiation Practice Board of Australia",
      "pathway": "TTMRA / Comparable Regulator / Recognised International Qualification / Qualification Assessment",
      "source": "https://www.medicalradiationpracticeboard.gov.au/Registration/Internationally-qualified-medical-radiation-practitioners/Registration-pathways-for-internationally-qualified-medical-radiation-practitioners",
      "sourceHost": "medicalradiationpracticeboard.gov.au",
      "sourceDate": "2026-03-13",
      "verified": "2026-08-27",
      "nextReview": "2026-11-25",
      "lifecycle": "active",
      "verbatim": "Verified 27 August 2026 against medicalradiationpracticeboard.gov.au \u2014 four routes read at source: TTMRA requires NZ registration AND a current practising certificate; Comparable Regulator (CORU, HCPC) covers diagnostic radiography and radiation therapy only and excludes nuclear medicine; Recognised International Qualification tests same institution, same year, same degree title; Qualification Assessment requires the portfolio to be assessed BEFORE the registration application, with three published outcomes. Board's own page review stamp 13 March 2026.",
      "profession": "",
      "professionLabel": "",
      "country": "au",
      "appliesTo": [
        "imaging",
        "mri"
      ]
    },
    {
      "id": "rules.nzMrtbScopes",
      "kind": "rule",
      "regulator": "the Medical Radiation Technologists Board",
      "pathway": "",
      "source": "https://www.mrtboard.org.nz/pre-registration/ttmra-2",
      "sourceHost": "mrtboard.org.nz",
      "sourceDate": "",
      "verified": "2026-08-27",
      "nextReview": "2026-11-25",
      "lifecycle": "active",
      "verbatim": "Verified 27 August 2026 against mrtboard.org.nz (TTMRA scopes, online examination policy \u2014 offered only where a qualification is assessed as not equivalent, internationally qualified processing time up to 12 weeks, Gazette scope notice)",
      "profession": "",
      "professionLabel": "",
      "country": "nz",
      "appliesTo": [
        "imaging",
        "mri"
      ]
    },
    {
      "id": "rules.nzMscAt",
      "kind": "rule",
      "regulator": "the Medical Sciences Council",
      "pathway": "",
      "source": "https://www.mscouncil.org.nz/pre-registration/overseas-trained-how-to-register/overseas-trained-registration-anaesthetic-technician",
      "sourceHost": "mscouncil.org.nz",
      "sourceDate": "",
      "verified": "2026-08-26",
      "nextReview": "2026-11-24",
      "lifecycle": "active",
      "verbatim": "Verified 26 August 2026 against mscouncil.org.nz",
      "profession": "",
      "professionLabel": "",
      "country": "nz",
      "appliesTo": [
        "anaesthetic-technician"
      ]
    },
    {
      "id": "rules.nzNuclearMedicineCt",
      "kind": "rule",
      "regulator": "",
      "pathway": "",
      "source": "https://www.mrtboard.org.nz/assets_mrtb/Uploads/20240722-MRTB-Competence-Standards-Website-Version.pdf",
      "sourceHost": "mrtboard.org.nz",
      "sourceDate": "",
      "verified": "2026-08-26",
      "nextReview": "2026-11-24",
      "lifecycle": "active",
      "verbatim": "Verified 26 August 2026 against the Board’s competence standards (19 July 2024), Domain 5 scope",
      "profession": "",
      "professionLabel": "",
      "country": "nz",
      "appliesTo": [
        "imaging"
      ]
    },
    {
      "id": "rules.nzNursingCosts",
      "kind": "rule",
      "regulator": "",
      "pathway": "",
      "source": "https://www.nursingcouncil.org.nz/IQN/H7.aspx",
      "sourceHost": "nursingcouncil.org.nz",
      "sourceDate": "",
      "verified": "2026-08-26",
      "nextReview": "2026-11-24",
      "lifecycle": "active",
      "verbatim": "Verified 26 August 2026 against nursingcouncil.org.nz",
      "profession": "",
      "professionLabel": "",
      "country": "nz",
      "appliesTo": [
        "nursing"
      ]
    },
    {
      "id": "rules.nzNursingSelfCheck",
      "kind": "rule",
      "regulator": "the Nursing Council of New Zealand",
      "pathway": "Internationally Qualified Nurse — competence assessment may not be required",
      "source": "https://nursingcouncil.org.nz/Public/IQN/Home.aspx",
      "sourceHost": "nursingcouncil.org.nz",
      "sourceDate": "",
      "verified": "2026-08-26",
      "nextReview": "2026-11-24",
      "lifecycle": "active",
      "verbatim": "Verified 26 August 2026 by reading the Council’s IQN self-assessment tool",
      "profession": "",
      "professionLabel": "",
      "country": "nz",
      "appliesTo": [
        "nursing"
      ]
    },
    {
      "id": "rules.nzNzsta",
      "kind": "rule",
      "regulator": "",
      "pathway": "",
      "source": "",
      "sourceHost": "",
      "sourceDate": "",
      "verified": "2026-08-26",
      "nextReview": "2026-11-24",
      "lifecycle": "active",
      "verbatim": "Verified 26 August 2026 against speechtherapy.org.nz (MRA and Qualification Approval Framework pages)",
      "profession": "",
      "professionLabel": "",
      "country": "nz",
      "appliesTo": [
        "speech-language-therapist"
      ]
    },
    {
      "id": "rules.nzOtAbridged",
      "kind": "rule",
      "regulator": "the Occupational Therapy Board of New Zealand",
      "pathway": "abridged pathway",
      "source": "https://otboard.org.nz/site/rp/overseas?nav=sidebar",
      "sourceHost": "otboard.org.nz",
      "sourceDate": "",
      "verified": "2026-08-26",
      "nextReview": "2026-11-24",
      "lifecycle": "active",
      "verbatim": "Verified 26 August 2026 against otboard.org.nz",
      "profession": "",
      "professionLabel": "",
      "country": "nz",
      "appliesTo": [
        "occupational-therapist"
      ]
    },
    {
      "id": "rules.nzPhysioFastTrack",
      "kind": "rule",
      "regulator": "the Physiotherapy Board of New Zealand",
      "pathway": "International General: Fast Track",
      "source": "https://physioboard.org.nz/i-want-to-be-registered/international-general-fast-track",
      "sourceHost": "physioboard.org.nz",
      "sourceDate": "",
      "verified": "2026-08-26",
      "nextReview": "2026-11-24",
      "lifecycle": "active",
      "verbatim": "Verified 26 August 2026 against physioboard.org.nz",
      "profession": "",
      "professionLabel": "",
      "country": "nz",
      "appliesTo": [
        "physiotherapist"
      ]
    },
    {
      "id": "rules.nzPsychFees",
      "kind": "rule",
      "regulator": "",
      "pathway": "",
      "source": "https://psychologistsboard.org.nz/want-to-register/fees-and-levy/",
      "sourceHost": "psychologistsboard.org.nz",
      "sourceDate": "",
      "verified": "2026-08-26",
      "nextReview": "2026-11-24",
      "lifecycle": "active",
      "verbatim": "Verified 26 August 2026 against psychologistsboard.org.nz",
      "profession": "",
      "professionLabel": "",
      "country": "nz",
      "appliesTo": [
        "psychologist"
      ]
    },
    {
      "id": "rules.nzPsychiatryStandard",
      "kind": "rule",
      "regulator": "",
      "pathway": "",
      "source": "https://www.mcnz.org.nz/registration/scopes-of-practice/vocational-and-provisional-vocational/types-of-vocational-scope/psychiatry/",
      "sourceHost": "mcnz.org.nz",
      "sourceDate": "",
      "verified": "2026-08-26",
      "nextReview": "2026-11-24",
      "lifecycle": "active",
      "verbatim": "Verified 26 August 2026 against mcnz.org.nz (page modified 30 October 2024)",
      "profession": "",
      "professionLabel": "",
      "country": "nz",
      "appliesTo": [
        "doctor"
      ]
    },
    {
      "id": "rules.nzPsychPrescribed",
      "kind": "rule",
      "regulator": "the New Zealand Psychologists Board",
      "pathway": "Overseas-trained — prescribed country",
      "source": "https://psychologistsboard.org.nz/want-to-register/overseas-trained-how-to-register/",
      "sourceHost": "psychologistsboard.org.nz",
      "sourceDate": "",
      "verified": "2026-08-26",
      "nextReview": "2026-11-24",
      "lifecycle": "active",
      "verbatim": "Verified 26 August 2026 against psychologistsboard.org.nz",
      "profession": "",
      "professionLabel": "",
      "country": "nz",
      "appliesTo": [
        "psychologist"
      ]
    },
    {
      "id": "rules.nzVoc4",
      "kind": "rule",
      "regulator": "the Medical Council of New Zealand",
      "pathway": "VOC4 Provisional Vocational (specialist) registration",
      "source": "https://www.mcnz.org.nz/registration/getting-registered/registration-pathways/pathways-to-registration-in-a-vocational-scope/voc4-provisional-vocational-registration/",
      "sourceHost": "mcnz.org.nz",
      "sourceDate": "",
      "verified": "2026-08-27",
      "nextReview": "2026-11-25",
      "lifecycle": "active",
      "verbatim": "Verified 27 August 2026 against mcnz.org.nz (page modified 25 August 2026) and the approved-qualification list dated 13 August 2026, read at source",
      "profession": "",
      "professionLabel": "",
      "country": "nz",
      "appliesTo": [
        "doctor"
      ]
    },
    {
      "id": "rules.nzPsychCriteria",
      "kind": "rule",
      "regulator": "",
      "pathway": "",
      "source": "",
      "sourceHost": "",
      "sourceDate": "",
      "verified": "",
      "nextReview": "",
      "lifecycle": "unstamped",
      "verbatim": "",
      "profession": "",
      "professionLabel": "",
      "country": "nz",
      "appliesTo": [
        "psychologist"
      ]
    },
    {
      "id": "rules.psychNzCautionLevels",
      "kind": "rule",
      "regulator": "",
      "pathway": "",
      "source": "",
      "sourceHost": "",
      "sourceDate": "",
      "verified": "",
      "nextReview": "",
      "lifecycle": "unstamped",
      "verbatim": "",
      "profession": "",
      "professionLabel": "",
      "country": "nz",
      "appliesTo": [
        "psychologist"
      ]
    }
  ];

  function daysBetween(a, b) { return Math.round((new Date(b + 'T00:00:00Z') - new Date(a + 'T00:00:00Z')) / 86400000); }
  function today() { return new Date().toISOString().slice(0, 10); }

  /* A row is overdue if its review date has passed, if it has no date at all, or if it was
     never confirmed at source. All three mean the same thing to a candidate: do not rely
     on this without checking. */
  function state(row, asOf) {
    var d = asOf || today();
    if (row.lifecycle === 'retired') return 'retired';
    if (row.lifecycle === 'unconfirmed' || !row.verified) return 'overdue';
    if (row.nextReview && row.nextReview < d) return 'overdue';
    if (row.lifecycle === 'unstamped') return 'unstamped';
    if (row.lifecycle === 'announced' || row.lifecycle === 'consultation') return 'changing';
    if (row.nextReview && daysBetween(d, row.nextReview) <= 30) return 'due';
    return 'ok';
  }

  window.ETHICARE_REGISTRY = {
    meta: { cadenceDays: CADENCE_DAYS, seeded: '2026-08-27', owner: 'Ethicare content owner' },
    rows: ROWS,
    state: state,
    today: today,
    byId: function (id) { for (var i = 0; i < ROWS.length; i++) if (ROWS[i].id === id) return ROWS[i]; return null; },
    /* Every row a result LEANS ON: its own record and outlook, plus every jurisdiction rule
       linked to that profession and country. The rules were the omission that mattered — an
       unconfirmed express-pathway or accepted-qualification list is exactly the kind of thing
       a candidate acts on, and it does not live in the profession's own record. */
    forResult: function (recordKey, cc) {
      return ROWS.filter(function (r) {
        if (r.id === 'records.' + recordKey + '.' + cc || r.id === 'outlooks.' + recordKey + '.' + cc) return true;
        if (r.kind !== 'rule') return false;
        if (r.scope === 'global') return true;
        if (r.country && r.country !== cc) return false;
        return (r.appliesTo || []).indexOf(recordKey) >= 0;
      });
    },
    /* The worst state among a result's own sources — what the candidate needs told. */
    worstFor: function (recordKey, cc) {
      /* unstamped sits BELOW due on purpose: it must never reach the candidate's result. */
      var order = { ok: 0, unstamped: 1, due: 2, changing: 3, overdue: 4, retired: 5 }, worst = 'ok', self = this;
      this.forResult(recordKey, cc).forEach(function (r) {
        var s = self.state(r); if (order[s] > order[worst]) worst = s;
      });
      return worst;
    },
    tally: function (asOf) {
      var t = { ok: 0, unstamped: 0, due: 0, changing: 0, overdue: 0, retired: 0 }, self = this;
      ROWS.forEach(function (r) { t[self.state(r, asOf)]++; });
      return t;
    }
  };
})();
