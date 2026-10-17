/* Profession skills library — Ethicare Resourcing. (7 Oct 2026)

   ONE list, read by both the CV builder (/build-your-cv) and the CV checker (/cv-checker).
   Add cardiac CT or FEES here and both tools know about it the same day.

   What it is for: a CV is shortlisted by someone scanning for the clinical evidence their
   service needs. This says, per profession, what that evidence usually looks like, so the
   checker can ask "does this CV tell a New Zealand or Australian employer what they need to
   shortlist this person?" rather than "is it well written?".

   The rule that runs through all of it: NOTHING HERE IS MANDATORY. A general radiographer is
   never told their CV is weak because it does not mention MRI. The checker only says:
   - an area is not stated at all  -> name the ones that apply to you, e.g. ...
   - an area is stated but thin    -> say more about your practice in it
   - equipment is generic          -> name it (Siemens SOMATOM Definition AS, not "CT scanner")

   Shape of a profession:
     label       shown in selects
     detect      words that suggest a CV belongs to this profession (used only when the
                 candidate has not told us)
     groups      the builder's clinical-expertise groupings (chips)
     hints       per grouping, the examples the builder shows as a placeholder
     equip       the builder's equipment section title and guidance
     primary     the dimension a reader scans for first (modalities, therapeutic approaches…):
                 { noun, areas: [{ name, terms, depth?: { terms, ask } }] }
     also        other dimensions a reader in this profession expects to see
                 [{ name, terms, ask }]
     kit         equipment named specifically: { brands, generic, systems, systemsName, example }

   Terms: a plain string matches as a whole word (case-insensitive). Short ALL-CAPS strings
   (CT, MRI, ACT, ED) match case-sensitively so "act" and "ct" inside words do not count.
   A RegExp is used as given. */
(function () {
  'use strict';

  var PROFESSIONS = [
    { value: 'radiography', label: 'Medical imaging — radiography, MRI & nuclear medicine' },
    { value: 'sonography', label: 'Sonography' },
    { value: 'radiation', label: 'Radiation therapy' },
    { value: 'physio', label: 'Physiotherapy' },
    { value: 'ot', label: 'Occupational therapy' },
    { value: 'psychology', label: 'Psychology' },
    { value: 'slt', label: 'Speech & language therapy' },
    { value: 'dietetics', label: 'Dietetics' },
    { value: 'socialwork', label: 'Social work' },
    { value: 'anaesthetics', label: 'Anaesthetic technology / ODP' },
    { value: 'nursing', label: 'Nursing — registered or enrolled' },
    { value: 'midwifery', label: 'Midwifery' },
    { value: 'gp', label: 'General practice' },
    { value: 'medicine', label: 'Hospital medicine — consultant, specialist or registrar' },
    { value: 'other', label: 'Another profession' }
  ];

  /* the shared candidate-context keys (candidate-context.js) -> ours */
  var FROM_CONTEXT = { imaging: 'radiography', nuclearmed: 'radiography', sonography: 'sonography', radtherapy: 'radiation', physio: 'physio', ot: 'ot', psychology: 'psychology', speech: 'slt', dietetics: 'dietetics', socialwork: 'socialwork', anaesthetic: 'anaesthetics', nursing: 'nursing', midwifery: 'midwifery', medicine: 'medicine' };
  var TO_CONTEXT = { radiography: 'imaging', sonography: 'sonography', radiation: 'radtherapy', physio: 'physio', ot: 'ot', psychology: 'psychology', slt: 'speech', dietetics: 'dietetics', socialwork: 'socialwork', anaesthetics: 'anaesthetic', nursing: 'nursing', midwifery: 'midwifery', medicine: 'medicine' };

  var IMAGING_BRANDS = ['Siemens', 'Philips', 'Canon', 'Toshiba', 'Fujifilm', 'Fuji', 'Carestream', 'Agfa', 'Hologic', 'Shimadzu', 'Samsung', 'Konica', 'Mindray', 'Esaote', 'Planmeca', 'Sirona', 'United Imaging', 'GE', 'GE Healthcare', 'SOMATOM', 'Aquilion', 'Ingenia', 'Achieva', 'MAGNETOM', 'Signa', 'Selenia', 'Senographe', 'Ysio', 'Luminos', 'Artis', 'Azurion', 'Allura', 'Symbia', 'Biograph'];
  var IMAGING_SYSTEMS = ['PACS', 'RIS', 'Sectra', 'Synapse', 'IntelliSpace', 'Vue', 'Kestral', 'Karisma', 'Comrad', 'Visage', 'Centricity', 'Soliton', 'CRIS', 'Epic', 'Cerner', 'EPR', 'EMR'];

  /* ACT the therapy, not ACT the territory ("Canberra, ACT 2600", "ACT Health") */
  var ACT_RE = (function () {
    try { return new RegExp('(?<!,\\s{0,2})(?<![A-Za-z0-9])ACT(?![A-Za-z0-9])(?!\\s*(?:\\d{4}|Health|Government|Gov))'); }
    catch (e) { return /acceptance and commitment/i; }
  })();

  var LIB = {

    /* ------------------------------------------------------------------ imaging */
    radiography: {
      detect: ['radiographer', 'radiography', 'medical imaging technologist', 'MIT', 'diagnostic imaging', 'x-ray', 'HCPC', 'MRTB', 'nuclear medicine technologist', 'mammographer', 'CT radiographer', 'MRI radiographer'],
      groups: ['General radiography', 'CT', 'CT special procedures', 'Fluoroscopy', 'Mobile and theatre', 'MRI'],
      hints: {
        'General radiography': 'ED and trauma, outpatients, orthopaedics, paediatrics, inpatients. Image evaluation and repeat rate.',
        'CT': 'Trauma, stroke, CT angiography, oncology, paediatric CT. Contrast and cannulation, injector, dose optimisation.',
        'CT special procedures': 'Cardiac CT, colonography, biopsies and drainages, advanced reconstructions.',
        'Fluoroscopy': 'Barium and contrast studies, theatre image intensifier, interventional lists.',
        'Mobile and theatre': 'Ward mobiles, ICU and neonatal, orthopaedic and urology theatre, image intensifier.',
        'MRI': 'Neuro, MSK, spine, body, cardiac, breast. MRI safety and implant screening, field strength.'
      },
      equip: { title: 'Equipment used', lead: 'Manufacturer and model, not the category. Siemens Somatom Definition AS, not CT scanner. Name the information systems too — the RIS, the PACS, the reporting system.' },
      primary: {
        noun: 'imaging modalities',
        title: 'which imaging modalities you work in',
        examples: 'general X-ray, CT, MRI, theatre, mobile, fluoroscopy or mammography',
        areas: [
          { name: 'General radiography', terms: ['general radiography', 'plain film', 'plain films', 'general x-ray', 'x-ray', 'DR', 'CR'] },
          { name: 'CT', terms: ['CT', 'computed tomography', 'CT scanning'],
            depth: { terms: ['trauma', 'stroke', 'angiography', 'CTA', 'cardiac', 'colonography', 'paediatric', 'oncology', 'contrast', 'cannulat', 'cannula', 'injector', 'dose', 'protocol', 'reconstruction', 'biopsy', 'biopsies', 'CTPA', 'perfusion'],
              ask: 'the examinations you perform, whether you give contrast or cannulate, the scanner you use and any specialist work such as trauma, stroke, cardiac or paediatric CT' } },
          { name: 'MRI', terms: ['MRI', 'magnetic resonance', 'MR'],
            depth: { terms: ['neuro', 'MSK', 'musculoskeletal', 'spine', 'abdomen', 'abdominal', 'pelvi', 'cardiac', 'breast', 'paediatric', 'contrast', 'cannulat', 'safety', 'implant', 'screening', '1.5T', '3T', 'tesla', 'sedation', 'general anaesthe', 'sequence', 'independent'],
              ask: 'the body areas you scan, MRI safety and implant screening, contrast and cannulation, field strength and scanner, and how independently you work' } },
          { name: 'Fluoroscopy', terms: ['fluoroscopy', 'fluoro', 'barium', 'contrast studies'] },
          { name: 'Theatre', terms: ['theatre', 'theatres', 'image intensifier', 'C-arm'] },
          { name: 'Mobile', terms: ['mobile radiography', 'mobile imaging', 'mobile x-ray', 'mobiles', 'ward mobiles', 'ward radiography', 'portable'] },
          { name: 'Emergency and trauma', terms: ['ED', 'emergency department', 'A&E', 'trauma', 'resus'] },
          { name: 'Paediatrics', terms: ['paediatric', 'paediatrics', 'pediatric', 'neonatal', 'NICU'] },
          { name: 'Mammography', terms: ['mammography', 'mammographer', 'mammogram', 'breast screening', 'breast imaging', 'tomosynthesis'],
            depth: { terms: ['screening', 'symptomatic', 'tomosynthesis', 'stereotactic', 'biopsy', 'localisation', 'localization', 'specimen', 'contrast-enhanced', 'QA', 'quality assurance', 'Hologic', 'Senographe'],
              ask: 'screening and symptomatic work, tomosynthesis, stereotactic and biopsy procedures, localisations, QA and the equipment you use' } },
          { name: 'Interventional and cath lab', terms: ['interventional', 'angiography suite', 'cath lab', 'catheter lab', 'cardiac catheter', 'IR'] },
          { name: 'DEXA', terms: ['DEXA', 'DXA', 'bone densitometry', 'bone density'] },
          { name: 'Dental', terms: ['dental', 'OPG', 'OPT', 'cephalometric', 'CBCT'] },
          { name: 'Nuclear medicine', terms: ['nuclear medicine', 'SPECT', 'PET', 'gamma camera', 'radiopharmaceutical', 'radiopharmaceuticals', 'theranostic', 'theranostics'],
            depth: { terms: ['SPECT', 'SPECT/CT', 'PET', 'PET/CT', 'gamma camera', 'radiopharmaceutical', 'dose calculation', 'cardiac', 'bone', 'renal', 'thyroid', 'oncology', 'neuro', 'theranostic', 'therapy', 'QC', 'quality control', 'cannulat'],
              ask: 'SPECT, SPECT/CT, PET/CT, the studies you perform, radiopharmaceutical preparation and administration, therapies or theranostics, and QC' } }
        ]
      },
      also: [
        { name: 'Contrast, cannulation or IV access', terms: ['contrast', 'cannulat', 'cannula', 'IV access', 'intravenous'], ask: 'whether you give contrast or cannulate, and whether you are signed off to' },
        { name: 'Radiation safety and dose', terms: ['radiation safety', 'radiation protection', 'dose', 'ALARA', 'ALARP', 'IR(ME)R', 'IRMER', 'justification'], ask: 'how you keep dose down in practice' },
        { name: 'Teaching or supervision', terms: ['supervis', 'mentor', 'preceptor', 'student', 'students', 'training', 'teaching'], ask: 'students or junior staff you supervise' }
      ],
      kit: { brands: IMAGING_BRANDS, generic: [/\b(?:CT|MRI|x-ray|DR|CR|fluoroscopy|mobile)\s+(?:scanner|scanners|machine|machines|unit|units|equipment|room|rooms)\b/i, 'scanners', 'modern equipment', 'state of the art', 'state-of-the-art'], systems: IMAGING_SYSTEMS, systemsName: 'the PACS, RIS or electronic record you use', example: 'Siemens SOMATOM Definition AS, not CT scanner' }
    },

    sonography: {
      detect: ['sonographer', 'sonography', 'ultrasound', 'ASAR', 'echocardiograph', 'obstetric ultrasound'],
      groups: ['Obstetric', 'Gynaecological', 'Abdominal', 'Musculoskeletal', 'Vascular', 'Paediatric'],
      hints: {
        'Obstetric': 'Early pregnancy, dating, nuchal translucency, morphology, growth, Doppler.',
        'Gynaecological': 'Transvaginal, pelvic, fertility, ovarian and endometrial assessment.',
        'Abdominal': 'Liver, renal, pancreas, bowel, small parts, thyroid.',
        'Musculoskeletal': 'Shoulder, hip, knee, ankle, hand and wrist, guided injections.',
        'Vascular': 'DVT, carotid, arterial and venous mapping, AAA.',
        'Paediatric': 'Hips, pyloric stenosis, intussusception, cranial, renal.'
      },
      equip: { title: 'Equipment and systems used', lead: 'Manufacturer and model, plus the reporting and image systems you have worked on.' },
      primary: {
        noun: 'areas of ultrasound',
        title: 'which areas of ultrasound you scan',
        examples: 'abdominal, pelvic, obstetric, gynaecological, small parts, MSK, vascular, paediatric or breast',
        areas: [
          { name: 'Abdominal', terms: ['abdominal', 'abdomen', 'liver', 'renal', 'hepatobiliary'] },
          { name: 'Pelvic and gynaecological', terms: ['pelvic', 'pelvis', 'gynaecolog', 'gynecolog', 'transvaginal', 'TV'] },
          { name: 'Obstetric', terms: ['obstetric', 'obstetrics', 'morphology', 'nuchal', 'dating scan', 'growth scan', 'fetal', 'foetal'],
            depth: { terms: ['early pregnancy', 'dating', 'nuchal', 'morphology', 'anatomy scan', 'growth', 'Doppler', 'twin', 'multiple', 'cervical length', 'third trimester', 'fetal echo', 'high risk'],
              ask: 'early pregnancy, nuchal, morphology and growth scans, Doppler, multiples and high-risk work' } },
          { name: 'Small parts', terms: ['small parts', 'thyroid', 'testicular', 'scrotal', 'neck'] },
          { name: 'Musculoskeletal', terms: ['MSK', 'musculoskeletal', 'shoulder', 'tendon'],
            depth: { terms: ['shoulder', 'hip', 'knee', 'ankle', 'wrist', 'hand', 'elbow', 'tendon', 'injection', 'guided', 'dynamic'],
              ask: 'the joints you scan, dynamic assessment and any guided injections' } },
          { name: 'Vascular', terms: ['vascular', 'DVT', 'carotid', 'venous', 'arterial', 'Doppler', 'AAA'],
            depth: { terms: ['DVT', 'carotid', 'venous', 'arterial', 'mapping', 'AAA', 'renal artery', 'graft', 'fistula', 'reflux', 'peripheral'],
              ask: 'carotid, DVT, arterial and venous work, mapping, grafts or fistulae' } },
          { name: 'Paediatric', terms: ['paediatric', 'paediatrics', 'pediatric', 'neonatal', 'infant hip', 'pyloric'] },
          { name: 'Breast', terms: ['breast'] },
          { name: 'Echocardiography', terms: ['echocardiograph', 'echo', 'TTE', 'cardiac ultrasound'] },
          { name: 'Ultrasound-guided procedures', terms: ['guided', 'biopsy', 'biopsies', 'FNA', 'aspiration', 'injection', 'injections'] }
        ]
      },
      also: [
        { name: 'Whether you report', terms: ['report', 'reports', 'reporting', 'worksheet', 'preliminary report'], ask: 'whether you write your own reports or worksheets, independently or within a radiologist-led service' },
        { name: 'Caseload and complexity', terms: [/\b\d+\s*(?:scans|patients|examinations|exams)\b/i, 'complex', 'high volume', 'caseload'], ask: 'scans a day or a week, and the complex cases you take' }
      ],
      kit: { brands: ['Philips', 'Canon', 'Toshiba', 'Samsung', 'Mindray', 'Esaote', 'Siemens', 'GE Healthcare', /\bGE\b/, 'Voluson', 'LOGIQ', 'Vivid', 'EPIQ', 'Affiniti', 'Aplio', 'ACUSON', 'HERA', 'SonoSite', 'Butterfly'], generic: [/\bultrasound\s+(?:machine|machines|scanner|scanners|equipment|unit|units)\b/i, 'modern equipment', 'state of the art', 'state-of-the-art'], systems: IMAGING_SYSTEMS.concat(['Viewpoint', 'Astraia', 'Sonultra']), systemsName: 'the reporting and image systems you use', example: 'GE Voluson E10 or Philips EPIQ 7, not ultrasound machine' }
    },

    radiation: {
      detect: ['radiation therapist', 'radiation therapy', 'radiotherapy', 'therapeutic radiographer', 'linac', 'linear accelerator', 'oncology'],
      groups: ['Planning', 'Treatment delivery', 'Site groups', 'Brachytherapy', 'Quality assurance'],
      hints: {
        'Planning': 'CT simulation, immobilisation, 3D conformal, IMRT, VMAT, SABR planning.',
        'Treatment delivery': 'Linac treatment, IGRT (CBCT, kV/MV imaging), SABR/SBRT, SRS, surface guidance.',
        'Site groups': 'Breast, prostate, head and neck, lung, CNS, palliative, paediatric.',
        'Brachytherapy': 'HDR, LDR, gynaecological, prostate seeds.',
        'Quality assurance': 'Daily machine QA, plan checks, incident learning.'
      },
      equip: { title: 'Equipment and systems used', lead: 'Linacs, planning systems and record-and-verify by name and version where you know it.' },
      primary: {
        noun: 'parts of the pathway',
        title: 'which parts of the radiation therapy pathway you work in',
        examples: 'CT simulation, planning, treatment delivery, IGRT, SABR, brachytherapy or patient review',
        areas: [
          { name: 'CT simulation', terms: ['CT simulation', 'CT sim', 'simulation', 'immobilisation', 'immobilization', 'mould room', 'mask'] },
          { name: 'Planning', terms: ['planning', 'treatment planning', 'dosimetry', 'contouring', 'planner'],
            depth: { terms: ['3D', 'conformal', 'IMRT', 'VMAT', 'SABR', 'SBRT', 'SRS', 'Eclipse', 'Monaco', 'Pinnacle', 'RayStation', 'Oncentra', 'contour', 'optimis', 'plan check'],
              ask: 'the techniques you plan (3D, IMRT, VMAT, SABR), the sites, and the planning system' } },
          { name: 'Treatment delivery', terms: ['treatment delivery', 'linac', 'linear accelerator', 'treatment unit', 'treating'],
            depth: { terms: ['IGRT', 'CBCT', 'cone beam', 'kV', 'MV', 'IMRT', 'VMAT', 'SABR', 'SBRT', 'SRS', 'surface guid', 'gating', 'breath hold', 'DIBH', 'Varian', 'Elekta', 'TrueBeam', 'Halcyon', 'Versa', 'Ethos'],
              ask: 'image guidance (CBCT, kV/MV), the techniques you deliver (IMRT, VMAT, SABR), motion management such as breath hold, and the linacs you treat on' } },
          { name: 'IGRT', terms: ['IGRT', 'image guided', 'image-guided', 'CBCT', 'cone beam'] },
          { name: 'Stereotactic', terms: ['SABR', 'SBRT', 'SRS', 'stereotactic'] },
          { name: 'Brachytherapy', terms: ['brachytherapy', 'HDR', 'LDR', 'seeds'] },
          { name: 'Patient review and education', terms: ['review clinic', 'on-treatment review', 'patient education', 'side effects', 'information session', 'pre-treatment'] }
        ]
      },
      also: [
        { name: 'Sites treated', terms: ['breast', 'prostate', 'head and neck', 'lung', 'CNS', 'brain', 'rectal', 'gynae', 'palliative', 'paediatric'], ask: 'the tumour sites you treat' },
        { name: 'Quality assurance', terms: ['QA', 'quality assurance', 'QC', 'incident', 'plan check'], ask: 'machine and plan QA, and incident learning' }
      ],
      kit: { brands: ['Varian', 'Elekta', 'Accuray', 'TrueBeam', 'Halcyon', 'Ethos', 'Clinac', 'Versa', 'Infinity', 'Synergy', 'Unity', 'TomoTherapy', 'Radixact', 'CyberKnife', 'Siemens', 'Philips'], generic: [/\b(?:linac|linear accelerator|treatment machine)s?\b(?![^.\n]{0,40}(?:Varian|Elekta|TrueBeam|Versa))/i], systems: ['Eclipse', 'Monaco', 'Pinnacle', 'RayStation', 'Oncentra', 'ARIA', 'MOSAIQ', 'Mosaiq', 'record and verify', 'record-and-verify'], systemsName: 'the planning and record-and-verify systems (Eclipse, Monaco, ARIA, MOSAIQ)', example: 'Varian TrueBeam with ARIA, not linear accelerators' }
    },

    /* ------------------------------------------------------------------ allied health */
    physio: {
      detect: ['physiotherapist', 'physiotherapy', 'physical therapist', 'PBNZ', 'physio'],
      groups: ['Musculoskeletal', 'Neurological', 'Respiratory', 'Rehabilitation settings', 'Assessment and outcome measures'],
      hints: {
        'Musculoskeletal': 'Outpatients, orthopaedics, post-operative rehab, manual therapy, exercise prescription.',
        'Neurological': 'Stroke, spinal cord injury, brain injury, Parkinson’s, gait re-education.',
        'Respiratory': 'ICU, on-call, airway clearance, suction, non-invasive ventilation.',
        'Rehabilitation settings': 'Acute medicine, older adults, community, inpatient rehab, paediatrics.',
        'Assessment and outcome measures': 'Berg, TUG, 6MWT, PSFS and the measures you use routinely.'
      },
      equip: { title: 'Equipment and systems used', lead: 'Equipment, outcome measures and clinical systems by name.' },
      primary: {
        noun: 'areas of practice',
        title: 'which areas of physiotherapy you work in',
        examples: 'MSK, neurological, respiratory, orthopaedic, ICU, acute medicine, community, older adults or paediatrics',
        areas: [
          { name: 'Musculoskeletal', terms: ['MSK', 'musculoskeletal', 'outpatient', 'outpatients', 'sports'],
            depth: { terms: ['manual therapy', 'exercise prescription', 'spinal', 'shoulder', 'knee', 'post-operative', 'injection', 'acupuncture', 'dry needling', 'hydrotherapy', 'triage', 'first contact', 'ESP'],
              ask: 'the caseload, manual therapy, exercise prescription, post-operative work and any extended roles such as first contact or injection' } },
          { name: 'Neurological', terms: ['neuro', 'neurological', 'stroke', 'brain injury', 'spinal cord'],
            depth: { terms: ['stroke', 'brain injury', 'spinal cord', 'Parkinson', 'MS', 'multiple sclerosis', 'gait', 'balance', 'spasticity', 'splinting', 'Bobath', 'FES', 'hyper-acute'],
              ask: 'the conditions you treat, gait and balance work, spasticity management and the setting (hyper-acute, rehab, community)' } },
          { name: 'Respiratory', terms: ['respiratory', 'cardiorespiratory', 'cardiopulmonary', 'on-call', 'on call'],
            depth: { terms: ['ICU', 'intensive care', 'HDU', 'on-call', 'on call', 'suction', 'airway clearance', 'NIV', 'tracheostomy', 'ventilat', 'IPPB', 'cough assist'],
              ask: 'ICU or HDU work, on-call, airway clearance, suction, tracheostomy and ventilated patients' } },
          { name: 'Orthopaedics', terms: ['orthopaedic', 'orthopaedics', 'orthopedic', 'fracture', 'joint replacement', 'arthroplasty'] },
          { name: 'Intensive care', terms: ['ICU', 'intensive care', 'critical care', 'HDU'] },
          { name: 'Acute medicine and surgery', terms: ['acute medicine', 'medical wards', 'surgical wards', 'general medicine', 'general surgery', 'acute'] },
          { name: 'Community', terms: ['community', 'domiciliary', 'home visits'] },
          { name: 'Older adults', terms: ['older adults', 'older people', 'elderly', 'gerontology', 'falls'] },
          { name: 'Paediatrics', terms: ['paediatric', 'paediatrics', 'pediatric', 'children'] },
          { name: 'Rehabilitation', terms: ['rehabilitation', 'rehab'] }
        ]
      },
      also: [
        { name: 'Outcome measures', terms: ['outcome measure', 'outcome measures', 'Berg', 'TUG', 'timed up and go', '6MWT', 'six minute walk', 'PSFS', 'Oswestry', 'DASH', 'KOOS', 'EQ-5D'], ask: 'the outcome measures you use by name' },
        { name: 'Discharge and equipment', terms: ['discharge', 'mobility aid', 'mobility aids', 'equipment prescription', 'walking aid'], ask: 'discharge planning and the equipment you prescribe' },
        { name: 'Working in the team', terms: ['MDT', 'multidisciplinary', 'interdisciplinary'], ask: 'how you work with the wider team' }
      ]
    },

    ot: {
      detect: ['occupational therapist', 'occupational therapy', 'OTBNZ', 'ADL', 'ADLs'],
      groups: ['Assessment', 'Interventions', 'Client groups', 'Equipment and adaptations', 'Discharge planning'],
      hints: {
        'Assessment': 'Functional, cognitive (MoCA, ACE-III), kitchen and personal care, home and environmental, sensory.',
        'Interventions': 'ADL retraining, upper limb, fatigue management, vocational rehabilitation, splinting.',
        'Client groups': 'Neurological, MSK, mental health, older adults, paediatrics.',
        'Equipment and adaptations': 'Wheelchairs and seating, pressure care, minor and major adaptations, housing.',
        'Discharge planning': 'Complex discharges, care packages, capacity and risk.'
      },
      equip: { title: 'Assessments and equipment used', lead: 'Named standardised assessments, equipment you prescribe, and clinical systems.' },
      primary: {
        noun: 'areas of practice',
        title: 'which areas and client groups you work with',
        examples: 'neurological, MSK, mental health, older adults, paediatrics, acute, community or vocational rehabilitation',
        areas: [
          { name: 'Neurological', terms: ['neuro', 'neurological', 'stroke', 'brain injury'] },
          { name: 'Musculoskeletal', terms: ['MSK', 'musculoskeletal', 'orthopaedic', 'hand therapy', 'upper limb'] },
          { name: 'Mental health', terms: ['mental health', 'psychiatric', 'forensic'] },
          { name: 'Older adults', terms: ['older adults', 'older people', 'elderly', 'dementia', 'falls'] },
          { name: 'Paediatrics', terms: ['paediatric', 'paediatrics', 'pediatric', 'children', 'sensory integration'] },
          { name: 'Acute', terms: ['acute', 'inpatient', 'ward', 'wards'] },
          { name: 'Community', terms: ['community', 'home visits', 'domiciliary'] },
          { name: 'Vocational rehabilitation', terms: ['vocational', 'return to work', 'work rehabilitation'] },
          { name: 'Wheelchairs and seating', terms: ['wheelchair', 'seating', 'postural management', 'pressure care'] },
          { name: 'Housing and adaptations', terms: ['housing', 'adaptation', 'adaptations', 'home modification', 'home modifications'] }
        ]
      },
      also: [
        { name: 'Functional and cognitive assessment', terms: ['functional assessment', 'ADL', 'ADLs', 'activities of daily living', 'kitchen assessment', 'cognitive assessment', 'MoCA', 'ACE-III', 'AMPS', 'COPM', 'MOHO'], ask: 'the assessments you use by name' },
        { name: 'Equipment you prescribe', terms: ['equipment', 'adaptations', 'aids'], ask: 'equipment and adaptations you prescribe' },
        { name: 'Discharge, capacity and risk', terms: ['discharge', 'capacity', 'risk assessment', 'goal setting'], ask: 'discharge planning, capacity and risk' }
      ]
    },

    psychology: {
      detect: ['psychologist', 'psychology', 'NZPB', 'psychological therapy', 'psychotherapy', 'formulation', 'CBT'],
      groups: ['Assessment', 'Therapeutic models', 'Client groups', 'Risk and safeguarding', 'Consultation and supervision'],
      hints: {
        'Assessment': 'Diagnostic and psychometric assessment: WAIS, WISC, MMPI, PCL-5, PHQ-9, GAD-7, CORE-OM, HoNOS.',
        'Therapeutic models': 'CBT, DBT, ACT, EMDR, schema therapy, motivational interviewing, systemic and family approaches.',
        'Client groups': 'Adults, CAMHS, older adults, intellectual disability, forensic, addictions, eating disorders.',
        'Risk and safeguarding': 'Suicide and self-harm risk assessment, safety planning, safeguarding.',
        'Consultation and supervision': 'MDT consultation, clinical supervision, training, service development, audit.'
      },
      equip: { title: 'Assessments and systems used', lead: 'Named assessment tools and outcome measures, plus the clinical record system.' },
      primary: {
        noun: 'therapeutic approaches',
        title: 'which therapeutic approaches you use',
        examples: 'CBT, DBT, ACT, EMDR, schema therapy, motivational interviewing or systemic and family approaches',
        areas: [
          { name: 'CBT', terms: ['CBT', 'cognitive behavioural', 'cognitive behavioral', 'cognitive-behavioural', 'TF-CBT'] },
          { name: 'DBT', terms: ['DBT', 'dialectical behaviour', 'dialectical behavior'] },
          { name: 'ACT', terms: [ACT_RE, 'acceptance and commitment'] },
          { name: 'EMDR', terms: ['EMDR', 'eye movement desensitisation', 'eye movement desensitization'] },
          { name: 'Schema therapy', terms: ['schema therapy', 'schema-focused'] },
          { name: 'Compassion-focused therapy', terms: ['CFT', 'compassion-focused', 'compassion focused'] },
          { name: 'Motivational interviewing', terms: ['motivational interviewing', 'MI'] },
          { name: 'Behavioural activation', terms: ['behavioural activation', 'behavioral activation'] },
          { name: 'Systemic and family approaches', terms: ['systemic', 'family therapy', 'family work', 'family-based'] },
          { name: 'Trauma-informed work', terms: ['trauma-informed', 'trauma informed', 'trauma-focused', 'trauma focused', 'CPT', 'prolonged exposure'] },
          { name: 'Mindfulness-based approaches', terms: ['mindfulness', 'MBCT'] },
          { name: 'Psychodynamic and interpersonal', terms: ['psychodynamic', 'IPT', 'interpersonal therapy', 'mentalization', 'mentalisation', 'MBT', 'CAT', 'cognitive analytic'] },
          { name: 'Neuropsychological rehabilitation', terms: ['neuropsychological', 'neuropsychology', 'cognitive rehabilitation'] }
        ]
      },
      also: [
        { name: 'Assessment and outcome measures', terms: ['BDI', 'BDI-II', 'BAI', 'Beck', 'PHQ-9', 'GAD-7', 'WAIS', 'WISC', 'WPPSI', 'MMPI', 'PAI', 'PCL-5', 'CORE-OM', 'CORE-10', 'HoNOS', 'DASS', 'K10', 'ADOS', 'psychometric', 'psychometrics', 'neuropsychological assessment', 'cognitive assessment'], ask: 'the assessment tools and outcome measures you use by name (for example WAIS, PHQ-9, GAD-7, PCL-5, CORE-OM)' },
        { name: 'Client groups', terms: ['adult', 'adults', 'CAMHS', 'child', 'children', 'adolescent', 'young people', 'older adults', 'intellectual disability', 'learning disability', 'forensic', 'addiction', 'addictions', 'substance', 'eating disorder', 'eating disorders', 'perinatal', 'neurodevelopmental'], ask: 'the client groups and settings you work with' },
        { name: 'Formulation, diagnosis and risk', terms: ['formulation', 'formulate', 'diagnosis', 'diagnostic', 'risk assessment', 'suicide', 'self-harm', 'safety plan', 'safety planning', 'safeguarding'], ask: 'formulation, diagnostic work and how you assess and manage risk' },
        { name: 'Consultation, supervision and service work', terms: ['supervision', 'supervise', 'supervisor', 'consultation', 'MDT', 'multidisciplinary', 'training', 'teaching', 'service development', 'audit', 'research'], ask: 'MDT consultation, supervision you give, training, audit or service development' }
      ]
    },

    slt: {
      detect: ['speech and language therapist', 'speech-language therapist', 'speech language therapist', 'speech pathologist', 'speech and language therapy', 'SLT', 'dysphagia', 'NZSTA'],
      groups: ['Assessment', 'Dysphagia', 'Communication', 'Client groups', 'Settings'],
      hints: {
        'Assessment': 'Bedside swallow, instrumental assessment, standardised language assessments by name.',
        'Dysphagia': 'Videofluoroscopy, FEES, tracheostomy, IDDSI, head and neck.',
        'Communication': 'Aphasia, dysarthria, apraxia, voice, AAC, stammering.',
        'Client groups': 'Adult neuro, stroke, head and neck, paediatric speech and language, learning disability.',
        'Settings': 'Acute, rehab, community, schools, outpatients.'
      },
      equip: { title: 'Assessments and systems used', lead: 'Named assessments and the clinical systems you have worked on.' },
      primary: {
        noun: 'areas of practice',
        title: 'which areas of speech and language therapy you work in',
        examples: 'dysphagia, aphasia, dysarthria, voice, AAC, paediatric speech and language, adult neuro or head and neck',
        areas: [
          { name: 'Dysphagia', terms: ['dysphagia', 'swallow', 'swallowing'],
            depth: { terms: ['bedside', 'clinical swallow', 'videofluoroscopy', 'videofluoroscopic', 'VFSS', 'FEES', 'fibreoptic', 'tracheostomy', 'IDDSI', 'head and neck', 'modified diet', 'mealtime'],
              ask: 'bedside and instrumental assessment (videofluoroscopy, FEES where trained), tracheostomy and the populations you see' } },
          { name: 'Aphasia', terms: ['aphasia', 'dysphasia'] },
          { name: 'Dysarthria and apraxia', terms: ['dysarthria', 'apraxia', 'dyspraxia', 'motor speech'] },
          { name: 'Voice', terms: ['voice', 'laryngectomy', 'dysphonia'] },
          { name: 'AAC', terms: ['AAC', 'augmentative', 'communication aid', 'communication aids'] },
          { name: 'Paediatric speech and language', terms: ['paediatric', 'paediatrics', 'children', 'speech sound', 'language delay', 'developmental language'] },
          { name: 'Adult neurology and stroke', terms: ['stroke', 'neuro', 'neurological', 'brain injury', 'progressive neurological'] },
          { name: 'Head and neck', terms: ['head and neck', 'laryngectomy', 'oncology'] },
          { name: 'Fluency', terms: ['stammering', 'stuttering', 'fluency'] }
        ]
      },
      also: [
        { name: 'Named assessments', terms: ['CELF', 'WAB', 'Western Aphasia', 'CAT', 'Comprehensive Aphasia', 'Boston', 'DEAP', 'PLS', 'standardised assessment', 'standardized assessment', 'MASA'], ask: 'the standardised assessments you use by name' },
        { name: 'Working in the team', terms: ['MDT', 'multidisciplinary', 'interdisciplinary'], ask: 'how you work with the wider team' }
      ]
    },

    dietetics: {
      detect: ['dietitian', 'dietician', 'dietetics', 'dietetic', 'nutrition support', 'enteral'],
      groups: ['Clinical dietetics and nutrition support', 'Patient groups and conditions', 'Enteral and parenteral nutrition', 'Community and food service', 'Education, audit and research'],
      hints: {
        'Clinical dietetics and nutrition support': 'Nutritional assessment, malnutrition screening (MUST), anthropometrics.',
        'Patient groups and conditions': 'Diabetes, renal, gastrointestinal, oncology, paediatrics, eating disorders, food allergy.',
        'Enteral and parenteral nutrition': 'Tube feeding regimens, PN, refeeding risk, ICU.',
        'Community and food service': 'Outpatient clinics, group education, menus and food service.',
        'Education, audit and research': 'Patient education, staff training, audit and research.'
      },
      equip: { title: 'Assessments and systems used', lead: 'Named assessment tools, nutrition support products and regimens, and the clinical record systems you have worked on.' },
      primary: {
        noun: 'clinical areas',
        title: 'which clinical areas you work in',
        examples: 'diabetes, renal, gastroenterology, oncology, critical care, paediatrics, weight management or eating disorders',
        areas: [
          { name: 'Diabetes', terms: ['diabetes', 'diabetic', 'carbohydrate counting', 'insulin'] },
          { name: 'Renal', terms: ['renal', 'kidney', 'dialysis', 'CKD'] },
          { name: 'Gastrointestinal', terms: ['gastrointestinal', 'gastroenterology', 'IBS', 'IBD', 'coeliac', 'low FODMAP', 'FODMAP'] },
          { name: 'Oncology', terms: ['oncology', 'cancer', 'haematology'] },
          { name: 'Critical care', terms: ['ICU', 'intensive care', 'critical care'] },
          { name: 'Paediatrics', terms: ['paediatric', 'paediatrics', 'pediatric', 'infant', 'children'] },
          { name: 'Weight management', terms: ['weight management', 'obesity', 'bariatric'] },
          { name: 'Eating disorders', terms: ['eating disorder', 'eating disorders', 'anorexia', 'bulimia'] },
          { name: 'Food allergy and intolerance', terms: ['allergy', 'allergies', 'intolerance'] },
          { name: 'Nutrition support', terms: ['nutrition support', 'enteral', 'parenteral', 'tube feeding', 'PN', 'PEG', 'NG'],
            depth: { terms: ['enteral', 'parenteral', 'PN', 'PEG', 'NG', 'NJ', 'regimen', 'refeeding', 'tube feed', 'home enteral', 'malnutrition'],
              ask: 'enteral and parenteral feeding, the regimens you set, refeeding risk and home enteral feeding' } }
        ]
      },
      also: [
        { name: 'Assessment and screening', terms: ['nutritional assessment', 'malnutrition screening', 'MUST', 'MST', 'SGA', 'PG-SGA', 'anthropometric', 'anthropometrics', 'NFPE'], ask: 'how you assess, and the screening tools you use by name' },
        { name: 'Patient education', terms: ['education', 'group session', 'groups', 'counselling', 'counseling'], ask: 'one-to-one and group education' }
      ]
    },

    socialwork: {
      detect: ['social worker', 'social work', 'SWRB', 'safeguarding', 'child protection', 'care proceedings'],
      groups: ['Assessment and care planning', 'Safeguarding and risk', 'Client groups and settings', 'Discharge and community', 'Statutory frameworks and supervision'],
      hints: {
        'Assessment and care planning': 'Psychosocial assessment, needs assessment, care planning and review.',
        'Safeguarding and risk': 'Child protection, adult protection, family violence, risk assessment.',
        'Client groups and settings': 'Children and families, mental health, older adults, hospital, disability.',
        'Discharge and community': 'Hospital discharge, housing, community resources, carers.',
        'Statutory frameworks and supervision': 'Name the legislation you worked under, court reports, supervision.'
      },
      equip: { title: 'Frameworks and systems used', lead: 'The assessment frameworks, statutory processes and case-management systems you have worked in, by name.' },
      primary: {
        noun: 'practice areas',
        title: 'which areas of social work you practise in',
        examples: 'children and families, child protection, adult safeguarding, mental health, hospital, older adults or disability',
        areas: [
          { name: 'Children and families', terms: ['children and families', 'child protection', 'children’s services', "children's services", 'care proceedings', 'looked after', 'foster', 'Oranga Tamariki'] },
          { name: 'Adult safeguarding', terms: ['adult protection', 'adult safeguarding', 'vulnerable adults', 'safeguarding adults'] },
          { name: 'Mental health', terms: ['mental health', 'AMHP', 'psychiatric'] },
          { name: 'Hospital', terms: ['hospital', 'acute', 'discharge', 'ward', 'wards'] },
          { name: 'Older adults', terms: ['older adults', 'older people', 'elderly', 'aged care', 'dementia'] },
          { name: 'Disability', terms: ['disability', 'learning disability', 'intellectual disability'] },
          { name: 'Family violence and abuse', terms: ['domestic abuse', 'domestic violence', 'family violence', 'intimate partner'] },
          { name: 'Substance use', terms: ['substance', 'addiction', 'addictions', 'alcohol and drug', 'AOD'] },
          { name: 'Youth justice', terms: ['youth justice', 'youth offending', 'justice'] }
        ]
      },
      also: [
        { name: 'Assessment and risk', terms: ['psychosocial assessment', 'assessment', 'risk assessment', 'care plan', 'care planning'], ask: 'the assessments you complete and how you assess risk' },
        { name: 'Statutory and court work', terms: ['statutory', 'court', 'legislation', /\b[A-Z][A-Za-z\u2019' ]{2,40} Act\b/, 'best interest', 'best-interest', 'capacity', 'report writing'], ask: 'the legislation you worked under (named, so a reader can map it), court and report writing' },
        { name: 'Caseload', terms: ['caseload', /\b\d+\s*(?:cases|families|clients)\b/i], ask: 'the size of your caseload' }
      ]
    },

    anaesthetics: {
      detect: ['anaesthetic technician', 'anaesthetic technologist', 'operating department practitioner', 'ODP', 'anaesthetic practitioner', 'MSCNZ', 'anaesthetic assistant'],
      groups: ['Anaesthetic techniques', 'Regional', 'Airway management', 'Case mix', 'Critical care and pain'],
      hints: {
        'Anaesthetic techniques': 'Machine checks, induction, maintenance and emergence, TIVA, rapid sequence induction.',
        'Regional': 'Spinal, epidural, nerve blocks, ultrasound-guided regional.',
        'Airway management': 'Difficult airway trolley, video laryngoscopy, fibreoptic intubation, front-of-neck access.',
        'Case mix': 'Obstetrics, paediatrics, cardiac, neuro, trauma, remote sites such as MRI.',
        'Critical care and pain': 'Arterial and central lines, transfers, resuscitation, PACU.'
      },
      equip: { title: 'Equipment and systems used', lead: 'Anaesthetic machines, airway and monitoring equipment, and the record systems.' },
      primary: {
        noun: 'parts of anaesthetic practice',
        title: 'which parts of anaesthetic practice you cover',
        examples: 'machine checks, airway management, induction and emergence, regional, obstetrics, paediatrics, trauma or recovery',
        areas: [
          { name: 'Machine and equipment checks', terms: ['machine check', 'machine checks', 'equipment checks', 'anaesthetic machine'] },
          { name: 'Airway management', terms: ['airway', 'intubation', 'difficult airway', 'laryngoscop', 'LMA', 'supraglottic', 'RSI', 'rapid sequence'],
            depth: { terms: ['difficult airway', 'video laryngoscop', 'fibreoptic', 'fiberoptic', 'awake', 'RSI', 'rapid sequence', 'front of neck', 'FONA', 'cricoid', 'bougie', 'McGrath', 'Glidescope', 'C-MAC', 'LMA', 'i-gel'],
              ask: 'difficult airway equipment, video laryngoscopy, fibreoptic intubation, RSI and the kit you are signed off on' } },
          { name: 'Induction, maintenance and emergence', terms: ['induction', 'maintenance', 'emergence', 'TIVA', 'general anaesthe'] },
          { name: 'Regional anaesthesia', terms: ['regional', 'spinal', 'epidural', 'nerve block', 'nerve blocks', 'neuraxial'] },
          { name: 'Obstetrics', terms: ['obstetric', 'obstetrics', 'caesarean', 'C-section', 'labour ward'] },
          { name: 'Paediatrics', terms: ['paediatric', 'paediatrics', 'pediatric', 'children'] },
          { name: 'Trauma and emergency', terms: ['trauma', 'emergency', 'major haemorrhage', 'massive transfusion', 'resuscitation'] },
          { name: 'Invasive monitoring and access', terms: ['arterial line', 'arterial lines', 'central line', 'central lines', 'CVC', 'IV access', 'cannulat'] },
          { name: 'Recovery and PACU', terms: ['recovery', 'PACU', 'post-anaesthesia', 'PACU'] },
          { name: 'Remote sites', terms: ['MRI', 'radiology', 'interventional', 'endoscopy', 'cath lab', 'remote site', 'remote sites'] },
          { name: 'Specialty lists', terms: ['cardiac', 'neurosurgery', 'neuro', 'vascular', 'orthopaedic', 'ENT', 'bariatric', 'thoracic'] }
        ]
      },
      also: [
        { name: 'Cell salvage, warming and other skills', terms: ['cell salvage', 'cell saver', 'warming', 'blood gas', 'ABG', 'point of care', 'TEG', 'ROTEM'], ask: 'extended skills such as cell salvage, blood gases or point-of-care testing' },
        { name: 'Teaching and on-call', terms: ['on-call', 'on call', 'out of hours', 'teaching', 'students', 'preceptor'], ask: 'on-call cover and teaching' }
      ],
      kit: { brands: ['Dräger', 'Drager', 'Draeger', 'GE', 'Datex', 'Aisys', 'Avance', 'Primus', 'Perseus', 'Fabius', 'Zeus', 'Mindray', 'Philips', 'Masimo', 'Glidescope', 'McGrath', 'C-MAC', 'Storz', 'Ambu'], generic: [/\banaesthetic machines?\b(?![^.\n]{0,40}(?:Dräger|Drager|GE|Datex|Mindray))/i], systems: ['Epic', 'Cerner', 'Medtech', 'electronic anaesthetic record', 'Innovian', 'Centricity'], systemsName: 'the anaesthetic record system you use', example: 'Dräger Perseus A500, not anaesthetic machines' }
    },

    /* ------------------------------------------------------------------ nursing & midwifery */
    nursing: {
      detect: ['registered nurse', 'staff nurse', 'enrolled nurse', 'nurse', 'nursing', 'NMC', 'NCNZ', 'charge nurse', 'clinical nurse'],
      groups: ['Clinical skills', 'Patient groups', 'Emergency and deteriorating patients', 'Medicines management', 'Teaching and supervision'],
      hints: {
        'Clinical skills': 'IV therapy, cannulation, venepuncture, catheterisation, wound care, observations.',
        'Patient groups': 'Name the specialty and patients: medical, surgical, ED, ICU, theatre, mental health, aged care, paediatrics.',
        'Emergency and deteriorating patients': 'Early warning scores, escalation, ALS/BLS, rapid response.',
        'Medicines management': 'IV medicines, controlled drugs, depot medication, infusions.',
        'Teaching and supervision': 'Preceptoring, student supervision, charge or shift coordination.'
      },
      equip: { title: 'Systems and equipment used', lead: 'Clinical systems and equipment by name — the electronic record, the observation and escalation system, the pumps and monitors you are signed off on.' },
      primary: {
        noun: 'specialties',
        title: 'your nursing specialty and the patients you care for',
        examples: 'medical, surgical, emergency, ICU, theatre, mental health, aged care, paediatrics or community',
        areas: [
          { name: 'Mental health', terms: ['mental health', 'psychiatric', 'acute inpatient unit', 'crisis team', 'CAMHS'],
            depth: { terms: ['mental state', 'MSE', 'risk assessment', 'suicide', 'self-harm', 'crisis', 'depot', 'de-escalation', 'restraint', 'seclusion', 'recovery', 'trauma-informed', 'psychosis', 'mood', 'personality', 'substance', 'physical health', 'Mental Health Act'],
              ask: 'mental state examination, risk assessment, depot medication, de-escalation, the conditions you work with and whether your setting is inpatient, community or crisis' } },
          { name: 'Medical', terms: ['medical ward', 'medical wards', 'general medicine', 'acute medical', 'AMU', 'respiratory', 'cardiology', 'gastroenterology', 'stroke'] },
          { name: 'Surgical', terms: ['surgical', 'surgery', 'post-operative', 'orthopaedic'] },
          { name: 'Emergency', terms: ['emergency department', 'ED', 'A&E', 'triage', 'resus'],
            depth: { terms: ['triage', 'resus', 'trauma', 'paediatric', 'sepsis', 'ALS', 'ACLS', 'TNCC', 'majors', 'minors', 'cannulat', 'ECG'],
              ask: 'triage, resus and trauma, the patients you take and the life support courses you hold' } },
          { name: 'Critical care', terms: ['ICU', 'intensive care', 'critical care', 'HDU', 'CCU'],
            depth: { terms: ['ventilat', 'inotrope', 'arterial line', 'CVC', 'central line', 'CRRT', 'haemofiltration', 'tracheostomy', '1:1', 'level 3', 'level 2', 'ECMO'],
              ask: 'ventilated patients, inotropes, lines, CRRT and the level of patients you care for' } },
          { name: 'Theatre and perioperative', terms: ['theatre', 'theatres', 'perioperative', 'scrub', 'recovery', 'PACU', 'anaesthetic nurse'] },
          { name: 'Paediatrics', terms: ['paediatric', 'paediatrics', 'pediatric', 'children', 'NICU', 'neonatal'] },
          { name: 'Older adults and aged care', terms: ['older adults', 'older people', 'aged care', 'elderly', 'dementia', 'gerontology'] },
          { name: 'Community and primary care', terms: ['community', 'district nurse', 'district nursing', 'practice nurse', 'primary care'] },
          { name: 'Oncology and haematology', terms: ['oncology', 'haematology', 'chemotherapy', 'SACT'] }
        ]
      },
      also: [
        { name: 'Clinical skills', terms: ['IV', 'intravenous', 'cannulat', 'venepuncture', 'phlebotomy', 'catheterisation', 'catheterization', 'wound care', 'wound management', 'NG'], ask: 'the clinical skills you are signed off in' },
        { name: 'Deterioration and escalation', terms: ['early warning', 'NEWS', 'EWS', 'escalation', 'deteriorat', 'rapid response', 'BLS', 'ALS', 'ILS'], ask: 'how you recognise and escalate a deteriorating patient' },
        { name: 'Medicines management', terms: ['medicines', 'medication', 'medications', 'controlled drugs', 'drug rounds', 'infusion', 'infusions'], ask: 'medicines management, including IV medicines' },
        { name: 'Leadership and supervision', terms: ['charge nurse', 'shift coordinat', 'nurse in charge', 'preceptor', 'mentor', 'supervis', 'students'], ask: 'shifts you coordinate and people you supervise' }
      ]
    },

    midwifery: {
      detect: ['midwife', 'midwifery', 'labour ward', 'antenatal', 'postnatal', 'intrapartum', 'LMC'],
      groups: ['Antenatal', 'Labour and birth', 'Postnatal', 'Neonatal', 'Complex and high risk'],
      hints: {
        'Antenatal': 'Booking, clinics, screening, fetal monitoring, day assessment.',
        'Labour and birth': 'Normal birth, CTG, induction, water birth, perineal repair, theatre.',
        'Postnatal': 'Ward and community postnatal care, infant feeding support.',
        'Neonatal': 'Newborn examination, neonatal resuscitation (NLS).',
        'Complex and high risk': 'Obstetric emergencies, high-risk pregnancy, safeguarding.'
      },
      equip: { title: 'Systems and equipment used', lead: 'Clinical systems and equipment by name — the maternity record, the monitoring you use, the equipment you are signed off on.' },
      primary: {
        noun: 'areas of midwifery',
        title: 'which parts of the maternity pathway you work in',
        examples: 'antenatal, intrapartum, postnatal, community, birth centre, high-risk or caseloading',
        areas: [
          { name: 'Antenatal', terms: ['antenatal', 'booking', 'antenatal clinic', 'day assessment'] },
          { name: 'Intrapartum', terms: ['intrapartum', 'labour', 'births', 'normal birth', 'birth suite', 'delivery suite', 'labour ward', 'birthing'],
            depth: { terms: ['CTG', 'fetal monitoring', 'induction', 'water birth', 'perineal', 'suturing', 'epidural', 'instrumental', 'caesarean', 'theatre', 'obstetric emergenc', 'PROMPT', 'shoulder dystocia', 'PPH', 'haemorrhage'],
              ask: 'CTG, induction, perineal repair, obstetric emergencies (and your PROMPT or equivalent training) and theatre work' } },
          { name: 'Postnatal', terms: ['postnatal', 'postpartum', 'infant feeding', 'breastfeeding'] },
          { name: 'Community and caseloading', terms: ['community', 'caseload', 'caseloading', 'continuity', 'home birth', 'LMC'] },
          { name: 'High-risk and complex', terms: ['high risk', 'high-risk', 'complex', 'fetal medicine', 'maternal medicine', 'diabetes'] },
          { name: 'Neonatal', terms: ['neonatal', 'newborn', 'NIPE', 'NLS', 'neonatal resuscitation'] },
          { name: 'Birth centre', terms: ['birth centre', 'midwife-led', 'midwifery-led', 'primary unit'] }
        ]
      },
      also: [
        { name: 'Emergencies and resuscitation', terms: ['PROMPT', 'obstetric emergenc', 'shoulder dystocia', 'PPH', 'NLS', 'neonatal resuscitation', 'eclampsia'], ask: 'obstetric emergency and neonatal resuscitation training' },
        { name: 'Safeguarding', terms: ['safeguarding', 'child protection', 'vulnerable', 'family violence'], ask: 'safeguarding work' }
      ]
    },

    /* ------------------------------------------------------------------ medicine */
    gp: {
      detect: ['general practitioner', 'general practice', 'GP', 'MRCGP', 'FRNZCGP', 'FRACGP', 'primary care'],
      groups: ['Clinical presentations', 'Long-term conditions', 'Procedures and minor surgery', 'Practice systems and teamwork', 'Teaching, supervision and audit'],
      hints: {
        'Clinical presentations': 'Acute and same-day work, women’s and men’s health, child health, mental health, older people.',
        'Long-term conditions': 'Diabetes, cardiovascular, respiratory, chronic kidney disease.',
        'Procedures and minor surgery': 'Joint injections, excisions, coil and implant fitting, skin procedures.',
        'Practice systems and teamwork': 'The clinical system by name, prescribing, referrals, triage.',
        'Teaching, supervision and audit': 'Trainee supervision, audit and QI with numbers.'
      },
      equip: { title: 'Systems and procedures', lead: 'Practice management and clinical systems by name, and the procedures you are independently signed off to perform.' },
      primary: {
        noun: 'clinical areas',
        title: 'the range of general practice you cover',
        examples: 'acute presentations, chronic disease, women’s health, child health, mental health, older people, sexual health or palliative care',
        areas: [
          { name: 'Acute presentations', terms: ['acute', 'same day', 'same-day', 'urgent care', 'minor injuries', 'triage'] },
          { name: 'Long-term conditions', terms: ['chronic disease', 'long-term condition', 'long-term conditions', 'diabetes', 'cardiovascular', 'COPD', 'asthma', 'hypertension', 'CKD'] },
          { name: 'Women’s health', terms: ['women’s health', "women's health", 'contraception', 'coil', 'IUD', 'implant', 'menopause', 'cervical screening', 'smear'] },
          { name: 'Child health', terms: ['child health', 'children', 'paediatric', 'immunisation', 'immunisations', 'vaccination', 'vaccinations'] },
          { name: 'Mental health', terms: ['mental health', 'depression', 'anxiety'] },
          { name: 'Older people', terms: ['older people', 'older adults', 'elderly', 'care home', 'aged care', 'frailty'] },
          { name: 'Sexual health', terms: ['sexual health', 'STI'] },
          { name: 'Palliative care', terms: ['palliative', 'end of life', 'end-of-life'] },
          { name: 'Dermatology', terms: ['dermatology', 'skin', 'dermoscopy'] },
          { name: 'Minor surgery and procedures', terms: ['minor surgery', 'minor ops', 'excision', 'excisions', 'joint injection', 'joint injections', 'cryotherapy', 'procedures'] }
        ]
      },
      also: [
        { name: 'Prescribing and referrals', terms: ['prescribing', 'referral', 'referrals'], ask: 'prescribing and referral work' },
        { name: 'Teaching, audit and QI', terms: ['audit', 'quality improvement', 'QI', 'teaching', 'trainer', 'supervis', 'registrar'], ask: 'audit or QI with numbers, and trainees you supervise' }
      ],
      kit: { brands: [], generic: [], systems: ['EMIS', 'SystmOne', 'Medtech', 'Indici', 'MyPractice', 'Best Practice', 'MedicalDirector', 'Zedmed', 'Genie', 'HealthLink', 'ERMS'], systemsName: 'the practice system you use (EMIS, SystmOne, Medtech, Indici, Best Practice, MedicalDirector)', example: '' }
    },

    medicine: {
      detect: ['consultant', 'registrar', 'specialist', 'MBBS', 'MBChB', 'MRCP', 'FRCR', 'FRCA', 'FRACP', 'MCNZ', 'senior medical officer', 'SMO', 'RMO', 'fellowship'],
      groups: ['Clinical presentations', 'Procedures', 'Acute and on call', 'Outpatients and clinics', 'Leadership, teaching and governance'],
      hints: {
        'Clinical presentations': 'Your specialty and subspecialty interests, and the case mix you manage.',
        'Procedures': 'Separate those you perform independently from those you assist with.',
        'Acute and on call': 'On-call frequency, what you cover, ICU or HDU work.',
        'Outpatients and clinics': 'Clinics a week, the type, new and follow-up.',
        'Leadership, teaching and governance': 'Supervision, teaching, audit and QI, M&M, research.'
      },
      equip: { title: 'Systems and procedures', lead: 'Clinical systems by name, and the procedures you are independently signed off to perform.' },
      primary: {
        noun: 'parts of your specialty practice',
        title: 'the scope of your specialty practice',
        examples: 'your subspecialty interests, acute and on-call work, inpatients, outpatient clinics, theatre or the procedures you perform independently',
        areas: [
          { name: 'Specialty and subspecialty', terms: ['subspecialty', 'sub-specialty', 'special interest', 'specialty', 'speciality'] },
          { name: 'Acute and on call', terms: ['on-call', 'on call', 'acute', 'medical take', 'acute take', 'emergency'] },
          { name: 'Inpatients', terms: ['inpatient', 'inpatients', 'ward round', 'ward rounds'] },
          { name: 'Outpatient clinics', terms: ['outpatient', 'outpatients', 'clinic', 'clinics'] },
          { name: 'Procedures', terms: ['procedure', 'procedures', 'independently', 'theatre', 'operating list', 'lists'],
            depth: { terms: ['independently', 'independent', 'supervised', 'assisted', 'logbook', /\b\d+\s*(?:procedures|cases|lists)\b/i],
              ask: 'which procedures you perform independently, which you assist with, and the numbers from your logbook' } },
          { name: 'ICU and HDU', terms: ['ICU', 'HDU', 'intensive care', 'critical care'] }
        ]
      },
      also: [
        { name: 'Level of responsibility', terms: ['consultant', 'registrar', 'specialist', 'SMO', 'attending', 'clinical lead', 'independent practice'], ask: 'the level you practise at and what you are accountable for' },
        { name: 'Teaching, audit and governance', terms: ['audit', 'quality improvement', 'QI', 'teaching', 'supervis', 'M&M', 'morbidity and mortality', 'governance', 'research', 'publication', 'publications'], ask: 'audit or QI with numbers, teaching, and governance roles' }
      ]
    },

    pharmacy: {
      detect: ['pharmacist', 'pharmacy', 'GPhC', 'dispensing'],
      groups: ['Clinical pharmacy', 'Specialty areas', 'Medicines governance', 'Dispensing and aseptic', 'Counselling and education'],
      hints: {
        'Clinical pharmacy': 'Medicines reconciliation, medication review, renal and hepatic dose adjustment.',
        'Specialty areas': 'Oncology, ICU, mental health, paediatrics, antimicrobials.',
        'Medicines governance': 'Formulary, controlled drugs, medicines safety, antimicrobial stewardship.',
        'Dispensing and aseptic': 'Dispensing, checking, aseptic and compounding.',
        'Counselling and education': 'Patient counselling, staff training, independent prescribing.'
      },
      equip: { title: 'Systems used', lead: 'Dispensing, prescribing and clinical systems by name.' },
      primary: {
        noun: 'areas of pharmacy practice',
        title: 'which areas of pharmacy you work in',
        examples: 'ward and clinical pharmacy, oncology, ICU, mental health, antimicrobial stewardship, community or aseptic services',
        areas: [
          { name: 'Clinical and ward pharmacy', terms: ['clinical pharmacy', 'ward pharmacy', 'medicines reconciliation', 'medication review'] },
          { name: 'Community pharmacy', terms: ['community pharmacy', 'retail pharmacy'] },
          { name: 'Oncology', terms: ['oncology', 'chemotherapy', 'SACT'] },
          { name: 'Critical care', terms: ['ICU', 'critical care', 'intensive care'] },
          { name: 'Mental health', terms: ['mental health', 'psychiatric'] },
          { name: 'Antimicrobial stewardship', terms: ['antimicrobial', 'stewardship'] },
          { name: 'Aseptic services', terms: ['aseptic', 'compounding', 'TPN'] }
        ]
      },
      also: [
        { name: 'Prescribing', terms: ['independent prescriber', 'prescribing', 'prescriber'], ask: 'whether you hold a prescribing qualification' }
      ]
    },

    other: {
      detect: [],
      groups: ['Assessment', 'Interventions', 'Patient groups', 'Settings', 'Teaching and supervision'],
      hints: {},
      equip: { title: 'Equipment and systems used', lead: 'Name the equipment, assessments and clinical systems you have worked on. Manufacturer and model, not the category.' }
    }
  };

  /* ---------------------------------------------------------------- matching */
  function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  var cache = {};
  var STEMS = ['cannulat', 'deteriorat', 'ventilat', 'supervis', 'optimis', 'gynaecolog', 'gynecolog', 'echocardiograph', 'neuro', 'pelvi', 'general anaesthe', 'surface guid', 'obstetric emergenc', 'shift coordinat', 'laryngoscop', 'video laryngoscop', 'tube feed', 'formulat', 'contour', 'tesla', 'optimis'];
  function toRe(term) {
    if (term instanceof RegExp) return term;
    if (cache[term]) return cache[term];
    /* short ALL-CAPS terms are acronyms: match case-sensitively so "act", "ct", "ed" in words do not count */
    var acronym = term.length <= 6 && /^[A-Z0-9][A-Z0-9&\/\-()+.:]*$/.test(term) && /[A-Z]/.test(term);
    /* a stem (cannulat, supervis, neuro) is open on the right; anything else may take a plural */
    var open = STEMS.indexOf(term) !== -1;
    var tail = open ? '' : (acronym ? '(?:s)?(?![A-Za-z0-9])' : (/[a-z]$/i.test(term) ? '(?:s|es)?(?![A-Za-z0-9])' : '(?![A-Za-z0-9])'));
    var src = '(?:^|[^A-Za-z0-9])' + escRe(term).replace(/ /g, '[\\s\\-]+') + tail;
    return (cache[term] = new RegExp(src, acronym ? '' : 'i'));
  }
  function hitsIn(text, terms) {
    var out = [];
    (terms || []).forEach(function (t) { if (toRe(t).test(text)) out.push(t instanceof RegExp ? 'match' : t); });
    return out;
  }
  function any(text, terms) { for (var i = 0; i < (terms || []).length; i++) if (toRe(terms[i]).test(text)) return true; return false; }

  /* Best guess at the profession from the CV text alone. Only used when the candidate has not
     told us; returns null unless one profession clearly leads. */
  function detect(text) {
    var best = null, score = 0, second = 0;
    Object.keys(LIB).forEach(function (k) {
      var s = hitsIn(text, LIB[k].detect).length;
      if (s > score) { second = score; score = s; best = k; } else if (s > second) second = s;
    });
    return score >= 2 && score > second ? best : null;
  }

  function get(key) { return LIB[key] || LIB.other; }
  function label(key) { for (var i = 0; i < PROFESSIONS.length; i++) if (PROFESSIONS[i].value === key) return PROFESSIONS[i].label; return ''; }

  var GROUPS = {}, EQUIP = {};
  Object.keys(LIB).forEach(function (k) { GROUPS[k] = LIB[k].groups; EQUIP[k] = LIB[k].equip; });

  window.EthicareCVSkills = {
    PROFESSIONS: PROFESSIONS,
    GROUPS: GROUPS,
    EQUIP: EQUIP,
    FROM_CONTEXT: FROM_CONTEXT,
    TO_CONTEXT: TO_CONTEXT,
    get: get,
    label: label,
    hint: function (prof, group) { var p = get(prof); return (p.hints && p.hints[group]) || ''; },
    detect: detect,
    hitsIn: hitsIn,
    any: any,
    toRe: toRe
  };
})();
