/* ============================================================
   ETHICARE RESOURCING — LIVE VACANCIES
   Single source for the job board (jobs/index.html).
   ADD A JOB: add a block below AND create jobs/vacancy/{slug}.html.
   ALWAYS set country: "New Zealand" or "Australia" — the profession pages filter
   their "Current opportunities" on profession AND country. Omit it and the role
   falls back to a location-text match, which is how Australian vacancies once
   ended up listed on New Zealand profession pages.
   REMOVE: delete the block and its detail page.
   Never name the employer/hospital (public sector only); pay confirmed
   against the relevant agreement (APEX / ASMS / collective). ATS later.

   ------------------------------------------------------------
   HOMEPAGE BAND — pin / closes  (both optional)
   ------------------------------------------------------------
   The homepage shows six roles, chosen in this order: pinned → closing soon →
   the two newest → a date-based rotation through the rest, cycling every three
   days so a long list gets seen. Nothing needs setting for that to work.

     pin: true          Hold this role in the band until the flag is removed.
                        For a hard-to-fill role or a new region opening. Use
                        sparingly — more than four pins kills the rotation.
                        Remove it when the reason has passed; unlike the
                        rotation, a pin does not expire on its own.

     closes: "2026-10-14"   Application close date, ISO. Inside 21 days the card
                        shows a "Closing in N days" flag and is promoted into the
                        band automatically. Prefer this over a pin for anything
                        time-bound: it can never go stale.

   Do NOT use pin for paid prominence. If an employer ever pays for placement
   that has to be disclosed on the page, and that is a Phase 3 decision.

   ------------------------------------------------------------
   CANDIDATE FACETS — sponsorship / relocation / family
   ------------------------------------------------------------
   The three things candidates ask before they read the summary. All three
   are the EMPLOYER'S commitment, not ours, so they follow the same rule as
   pay: we do not assert them on an employer's behalf. Each is a tri-state,
   and OMITTING the field is a valid, honest answer.

     sponsorship: "yes" | "no" | undefined
     relocation:  "yes" | "no" | undefined
     family:      "yes" | "no" | undefined

     "yes"     confirmed with the employer, in writing. Renders as a
               positive chip. Do not set this from an assumption.
     "no"      confirmed NOT available. Renders as a negative chip, which
               is a kindness: it saves a candidate an application and a
               month of hope.
     undefined not yet confirmed. The card says we will confirm it, which
               is what we actually do. NEVER guess to fill a gap — a wrong
               "yes" here costs a candidate a move.

   Set them as each is confirmed. Every role currently sits undefined
   because none has been confirmed in writing yet.
   ============================================================ */
window.ETHICARE_JOBS = [
  {
    slug: "msk-radiologist-bunbury",
    title: "Musculoskeletal Radiologist",
    profession: "Consultant Radiologist",
    professionGuide: "/jobs/consultant-radiologist-australia",
    sector: "Private sector",
    region: "Western Australia",
    location: "Bunbury, Western Australia",
    country: "Australia",
    types: ["Permanent","Full-time"],
    posted: "2026-07-29",
    pay: "Competitive package, discussed with you",
    lifestyle: "A South West coastal city two hours south of Perth: beaches, good schools and settled neighbourhoods, with national parks, wineries and Margaret River on the doorstep.",
    summary: "Lead the MSK imaging work of an established private provider across MRI, CT, ultrasound and image-guided procedures, with scope to build the role around your subspecialty.",
    detail: "/jobs/vacancy/msk-radiologist-bunbury"
  },
  {
    slug: "gp-wellington",
    title: "General Practitioner",
    profession: "General Practitioner",
    professionGuide: "/jobs/gp-new-zealand",
    sector: "Primary care",
    region: "Wellington",
    location: "Wellington, New Zealand",
    country: "New Zealand",
    types: ["Permanent","8 sessions per week"],
    posted: "2026-07-29",
    pay: "Competitive — confirmed with you before you decide",
    lifestyle: "A compact capital wrapped around harbour, coastline and hills \u2014 beaches, walking trails and real neighbourhoods all within easy reach of the city.",
    summary: "An eight-session week in a supportive, multidisciplinary primary care team in the Wellington region. Attractive for GPs leaving long weeks and heavy out-of-hours behind.",
    detail: "/jobs/vacancy/gp-wellington"
  },
  {
    slug: "gp-auckland",
    title: "General Practitioner",
    profession: "General Practitioner",
    professionGuide: "/jobs/gp-new-zealand",
    sector: "Primary care",
    region: "Auckland",
    location: "Auckland, New Zealand",
    country: "New Zealand",
    types: ["Permanent","Full-time","Part-time"],
    posted: "2026-07-29",
    pay: "Competitive salary, discussed with you",
    lifestyle: "A major international city with beaches, regional parks and islands on the doorstep \u2014 plus a wide choice of neighbourhoods, schools and established international communities for families.",
    summary: "Join a supportive, multidisciplinary primary care team providing comprehensive care to diverse communities across Auckland. Open to New Zealand-based and internationally trained doctors.",
    detail: "/jobs/vacancy/gp-auckland"
  },
  {
    slug: "occupational-therapist-gisborne",
    title: "Occupational Therapist",
    profession: "Occupational Therapist",
    professionGuide: "/jobs/occupational-therapist-new-zealand",
    sector: "Private sector",
    region: "Gisborne",
    location: "Gisborne, New Zealand",
    country: "New Zealand",
    types: ["Permanent","Full-time"],
    posted: "2026-07-15",
    pay: "Competitive — set by the APEX collective agreement",
    lifestyle: "Sunny East Coast living: empty beaches minutes from work, the world's first sunrise from the East Cape, an affordable, friendly community and year-round surf.",
    summary: "Join a private rehabilitation clinic's allied health team as an Occupational Therapist across neuro, social, vocational and pain rehabilitation, with real scope to specialise and lead.",
    detail: "/jobs/vacancy/occupational-therapist-gisborne"
  },
  {
    slug: "occupational-therapist-palmerston-north",
    title: "Occupational Therapist",
    profession: "Occupational Therapist",
    professionGuide: "/jobs/occupational-therapist-new-zealand",
    sector: "Private sector",
    region: "Manawatū-Whanganui",
    location: "Palmerston North, New Zealand",
    country: "New Zealand",
    types: ["Permanent","Full-time"],
    posted: "2026-07-15",
    pay: "Competitive — set by the APEX collective agreement",
    lifestyle: "An easy university city in the lower North Island: short commutes, parks and river trails, a good cafe scene, and mountains, coast and the capital all within reach.",
    summary: "Join a busy private rehabilitation clinic as an Occupational Therapist across social, vocational and pain rehabilitation, with room to grow and lead.",
    detail: "/jobs/vacancy/occupational-therapist-palmerston-north"
  },
  {
    slug: "hand-therapist-palmerston-north",
    title: "Hand Therapist",
    profession: "Hand Therapist",
    professionGuide: "/jobs/physiotherapist-new-zealand",
    sector: "Private sector",
    region: "Manawatū-Whanganui",
    location: "Palmerston North, New Zealand",
    country: "New Zealand",
    types: ["Permanent","Full-time"],
    posted: "2026-07-15",
    pay: "Competitive — set by the APEX collective agreement",
    lifestyle: "An easy university city in the lower North Island: short commutes, parks and river trails, a good cafe scene, and mountains, coast and the capital all within reach.",
    summary: "A Registered Hand Therapist role with a private rehabilitation provider, delivering upper-limb rehabilitation and mentoring associates towards their own registration.",
    detail: "/jobs/vacancy/hand-therapist-palmerston-north"
  },
  {
    slug: "nuclear-medicine-technologist-auckland",
    title: "Nuclear Medicine Technologist",
    profession: "Nuclear Medicine Technologist",
    professionGuide: "",
    sector: "Public sector",
    region: "Auckland",
    location: "Auckland, New Zealand",
    country: "New Zealand",
    types: ["Permanent","Full-time"],
    posted: "2026-07-15",
    pay: "Competitive — set by the relevant collective agreement",
    lifestyle: "New Zealand's biggest, most diverse city: harbours and islands, black-sand surf beaches, and the widest range of specialist roles in the country.",
    summary: "Join a leading public radiology team as a Nuclear Medicine Technologist, performing a wide range of procedures and contributing to a national radionuclide therapy service.",
    detail: "/jobs/vacancy/nuclear-medicine-technologist-auckland"
  },
  {
    slug: "radiographer-frankston",
    title: "Radiographer",
    profession: "Radiographer",
    professionGuide: "/jobs/radiographer-australia",
    sector: "Private sector",
    region: "Victoria",
    location: "Frankston, Victoria, Australia",
    country: "Australia",
    types: ["Permanent","Full-time","Part-time"],
    posted: "2026-07-15",
    pay: "Competitive salary + benefits, discussed with you",
    lifestyle: "Bayside Melbourne living: beaches along Port Phillip Bay, the Mornington Peninsula's wineries and hot springs nearby, and the city an easy train ride away.",
    summary: "Perform CT and general X-ray imaging with a large private radiology network at its Frankston clinic, with variety, rotation to nearby sites and strong professional development.",
    detail: "/jobs/vacancy/radiographer-frankston"
  },
  {
    slug: "sonographer-sunshine",
    title: "Sonographer",
    profession: "Sonographer",
    professionGuide: "/jobs/sonographer-australia",
    sector: "Private sector",
    region: "Victoria",
    location: "Sunshine, Melbourne, Victoria, Australia",
    country: "Australia",
    types: ["Permanent","Full-time","Part-time"],
    posted: "2026-07-15",
    pay: "Competitive salary + benefits, discussed with you",
    lifestyle: "Melbourne's multicultural west, minutes from the CBD by train, in one of the world's most liveable cities.",
    summary: "Scan a broad ultrasound caseload (MSK, obstetric, vascular, general and interventional) with a large private radiology network in Melbourne's west.",
    detail: "/jobs/vacancy/sonographer-sunshine"
  },
  {
    slug: "nuclear-medicine-technologist-bunbury",
    title: "Nuclear Medicine Technologist",
    profession: "Nuclear Medicine Technologist",
    professionGuide: "/jobs/nuclear-medicine-australia",
    sector: "Private sector",
    region: "Western Australia",
    location: "Bunbury, Western Australia, Australia",
    country: "Australia",
    types: ["Permanent","Full-time"],
    posted: "2026-07-15",
    pay: "Competitive salary + benefits, discussed with you",
    lifestyle: "Coastal South-West WA, two hours south of Perth: beaches, cafes, forests and wineries, with affordable housing and a welcoming community.",
    summary: "Perform general nuclear medicine and PET-CT imaging with a leading WA private provider in Bunbury, the only PET service in the South-West, across two modern sites.",
    detail: "/jobs/vacancy/nuclear-medicine-technologist-bunbury"
  },
  {
    slug: "radiographer-mandurah",
    title: "Radiographer",
    profession: "Radiographer",
    professionGuide: "/jobs/radiographer-australia",
    sector: "Private sector",
    region: "Western Australia",
    location: "Mandurah, Western Australia, Australia",
    country: "Australia",
    types: ["Permanent","Full-time","Part-time"],
    posted: "2026-07-15",
    pay: "Competitive salary + benefits, discussed with you",
    lifestyle: "A relaxed waterside city on the Peel coast, under an hour south of Perth: canals, estuary, beaches and an easy outdoor lifestyle.",
    summary: "Perform a wide range of general radiography with a leading WA private imaging provider in coastal Mandurah, with modern technology and strong development support.",
    detail: "/jobs/vacancy/radiographer-mandurah"
  },
  {
    slug: "occupational-therapist-hawkes-bay",
    title: "Occupational Therapist",
    profession: "Occupational Therapist",
    professionGuide: "/jobs/occupational-therapist-new-zealand",
    sector: "Public sector",
    region: "Hawke's Bay",
    location: "Hastings, Hawke's Bay, New Zealand",
    country: "New Zealand",
    types: ["Permanent","Full-time"],
    posted: "2026-07-15",
    pay: "Competitive — set by the APEX collective agreement",
    lifestyle: "Sunny Hawke's Bay: east-coast wine country, the Art Deco streets of Napier and Hastings, beaches and an easy outdoor lifestyle, one of New Zealand's most enjoyable regions for work-life balance.",
    summary: "Join a supportive inpatient Allied Health team as an experienced Occupational Therapist, focused on acute medical care and frailty, complex discharge planning, and mentoring rotational OTs.",
    detail: "/jobs/vacancy/occupational-therapist-hawkes-bay"
  },
  {
    slug: "mammographer-bundaberg",
    title: "Mammographer",
    profession: "Mammographer",
    professionGuide: "/jobs/radiographer-australia",
    sector: "Private sector",
    region: "Queensland",
    location: "Bundaberg, Queensland, Australia",
    country: "Australia",
    types: ["Permanent","Full-time"],
    posted: "2026-07-15",
    pay: "Competitive salary + benefits, discussed with you",
    lifestyle: "A relaxed Queensland coastal city: warm climate, beautiful beaches, the Southern Great Barrier Reef and national parks nearby, with affordable housing and a welcoming community.",
    summary: "Perform high-quality screening and diagnostic mammography within an experienced multidisciplinary imaging team at a values-led private provider, with modern technology and genuine support for your development.",
    detail: "/jobs/vacancy/mammographer-bundaberg"
  },
  {
    slug: "sonographer-tasmania",
    title: "Sonographer",
    profession: "Sonographer",
    professionGuide: "/jobs/sonographer-australia",
    sector: "Private sector",
    region: "Tasmania",
    location: "Hobart or Launceston, Tasmania, Australia",
    country: "Australia",
    types: ["Permanent","Full-time"],
    posted: "2026-07-15",
    pay: "Competitive salary + full benefits, discussed with you",
    lifestyle: "One of Australia's most scenic states: spectacular coastlines and wilderness national parks, a celebrated food, wine and arts scene, shorter commutes and a strong sense of community.",
    summary: "Perform a broad range of general ultrasound examinations with a well-established private imaging provider, with roles in both Hobart and Launceston, modern equipment and an outstanding work-life balance.",
    detail: "/jobs/vacancy/sonographer-tasmania"
  },
  {
    slug: "diagnostic-radiographer-bunbury",
    title: "Diagnostic Radiographer",
    profession: "Radiographer",
    professionGuide: "/jobs/radiographer-australia",
    sector: "Private sector",
    region: "Western Australia",
    location: "Bunbury, Western Australia, Australia",
    country: "Australia",
    types: ["Permanent","Full-time"],
    posted: "2026-07-15",
    pay: "Excellent salary package, discussed with you",
    lifestyle: "A desirable coastal city two hours south of Perth: beaches and cafe culture, excellent schools, affordable housing and easy access to WA's coastline, forests and wineries.",
    summary: "Perform a broad range of general radiography examinations with a leading private imaging provider in coastal Bunbury, using modern equipment in a supportive, development-focused team.",
    detail: "/jobs/vacancy/diagnostic-radiographer-bunbury"
  },
  {
    slug: "psychologist-adult-rehab-auckland",
    title: "Psychologist · Adult Rehabilitation & Older People",
    profession: "Psychologist",
    professionGuide: "/jobs/psychologist-new-zealand",
    sector: "Public sector",
    region: "Auckland",
    location: "Auckland, New Zealand",
    country: "New Zealand",
    types: ["Permanent","Full-time","Part-time"],
    posted: "2026-07-14",
    pay: "Competitive — set by the APEX Psychologists MECA",
    lifestyle: "New Zealand's biggest and most diverse city: harbours and islands on the doorstep, black-sand surf beaches to the west, and the widest range of specialist roles in the country.",
    summary: "Provide psychological assessment and rehabilitation for adult and older-adult inpatients, and community stroke patients, within a specialist rehabilitation service and a supportive interdisciplinary team.",
    detail: "/jobs/vacancy/psychologist-adult-rehab-auckland"
  },
  {
    slug: "clinical-psychologist-camhs-kapiti",
    title: "Clinical Psychologist · Child & Adolescent Mental Health",
    profession: "Psychologist",
    professionGuide: "/jobs/psychologist-new-zealand",
    sector: "Public sector",
    region: "Wellington",
    location: "Kāpiti Coast, New Zealand",
    country: "New Zealand",
    types: ["Permanent","Full-time"],
    posted: "2026-07-14",
    pay: "Competitive — set by the relevant collective agreement",
    lifestyle: "Sunny Kāpiti on the Wellington coast: beaches and Kapiti Island at your door, an easy train into the capital, and a relaxed community feel for families.",
    summary: "Provide mental health assessment, intervention and education to infants, children, youth and their whānau, as part of a small, supportive multidisciplinary team using the Choice and Partnership Approach (CAPA).",
    detail: "/jobs/vacancy/clinical-psychologist-camhs-kapiti"
  },
  {
    slug: "clinical-psychologist-porirua",
    title: "Clinical Psychologist · Community Mental Health",
    profession: "Psychologist",
    professionGuide: "/jobs/psychologist-new-zealand",
    sector: "Public sector",
    region: "Wellington",
    location: "Porirua, New Zealand",
    country: "New Zealand",
    types: ["Permanent","Full-time","Part-time"],
    posted: "2026-07-14",
    pay: "Competitive — set by the relevant collective agreement",
    lifestyle: "Porirua on Wellington's edge: harbour and coast, a proud Māori and Pasifika community, and the capital a short train ride away.",
    summary: "Join a supportive, multidisciplinary community mental health team providing a range of psychological interventions, with genuine autonomy and ongoing training and development.",
    detail: "/jobs/vacancy/clinical-psychologist-porirua"
  },
  {
    slug: "anaesthetic-technician-gisborne",
    title: "Anaesthetic Technician",
    profession: "Anaesthetic Technician",
    professionGuide: "/jobs/anaesthetic-technician-new-zealand",
    sector: "Public sector",
    region: "Gisborne",
    location: "Gisborne, New Zealand",
    country: "New Zealand",
    types: ["Permanent","Full-time"],
    posted: "2026-06-20",
    pay: "Competitive — set by the APEX collective agreement",
    lifestyle: "Live where others come on holiday: the first place on earth to see the sun, surf beaches, Chardonnay country and an unhurried East Coast pace.",
    summary: "Join a small, committed anaesthetic technician team in a regional hospital: acute and elective lists, ED trauma calls, and cover across ICU and Radiology.",
    detail: "/jobs/vacancy/anaesthetic-technician-gisborne"
  },
  {
    slug: "consultant-radiologist-dunedin",
    title: "Consultant Radiologist",
    profession: "Consultant Radiologist",
    professionGuide: "/jobs/consultant-radiologist-new-zealand",
    sector: "Public sector",
    region: "Otago",
    location: "Dunedin, New Zealand",
    country: "New Zealand",
    types: ["Permanent","Full-time"],
    posted: "2026-06-25",
    pay: "Competitive — set by the ASMS MECA scale",
    lifestyle: "A walkable, affordable university city with Scottish bones. A wildlife coastline of albatross, penguins and sea lions, with the Catlins and Central Otago at the door.",
    summary: "A generalist role in a public tertiary hospital’s MDT, with a strong emphasis on emergency and inpatient imaging, modern RIS/PACS and the full range of modalities.",
    detail: "/jobs/vacancy/consultant-radiologist-dunedin"
  },
  {
    slug: "interventional-radiologist-dunedin",
    title: "Consultant Radiologist · Interventional",
    profession: "Consultant Radiologist",
    professionGuide: "/jobs/consultant-radiologist-new-zealand",
    sector: "Public sector",
    region: "Otago",
    location: "Dunedin, New Zealand",
    country: "New Zealand",
    types: ["Permanent","Full-time"],
    posted: "2026-06-25",
    pay: "Competitive — set by the ASMS MECA scale",
    lifestyle: "A walkable, affordable university city with Scottish bones. A wildlife coastline of albatross, penguins and sea lions, with the Catlins and Central Otago at the door.",
    summary: "Join a close team of ten as an interventional radiologist: a wide range of vascular and non-vascular techniques, with a strong MDT culture and the support of a smaller hospital.",
    detail: "/jobs/vacancy/interventional-radiologist-dunedin"
  },
  {
    slug: "paediatric-radiologist-dunedin",
    title: "Consultant Paediatric Radiologist",
    profession: "Consultant Radiologist",
    professionGuide: "/jobs/consultant-radiologist-new-zealand",
    sector: "Public sector",
    region: "Otago",
    location: "Dunedin, New Zealand",
    country: "New Zealand",
    types: ["Permanent","Full-time"],
    posted: "2026-06-25",
    pay: "Competitive — set by the ASMS MECA scale",
    lifestyle: "A walkable, affordable university city with Scottish bones. A wildlife coastline of albatross, penguins and sea lions, with the Catlins and Central Otago at the door.",
    summary: "Expert paediatric imaging across X-ray, ultrasound, CT, MRI and nuclear medicine for neonates to adolescents, within a fully integrated public-hospital team.",
    detail: "/jobs/vacancy/paediatric-radiologist-dunedin"
  },
  {
    slug: "consultant-radiologist-southland",
    title: "Consultant Radiologist · Southland",
    profession: "Consultant Radiologist",
    professionGuide: "/jobs/consultant-radiologist-new-zealand",
    sector: "Public sector",
    region: "Southland",
    location: "Invercargill, New Zealand",
    country: "New Zealand",
    types: ["Permanent","Full-time"],
    posted: "2026-06-24",
    pay: "Competitive — set by the ASMS MECA scale",
    lifestyle: "The deep south: big skies and wide-open space, Bluff oysters in season, and the gateway to Fiordland and Stewart Island on your weekends.",
    summary: "A general radiologist for a close-knit team in the deep south, with the full range of modalities and the collegial feel of a smaller hospital.",
    detail: "/jobs/vacancy/consultant-radiologist-southland"
  },
  {
    slug: "consultant-radiologist-queenstown",
    title: "Consultant Radiologist · Queenstown",
    profession: "Consultant Radiologist",
    professionGuide: "/jobs/consultant-radiologist-new-zealand",
    sector: "Public sector",
    region: "Otago",
    location: "Queenstown, New Zealand",
    country: "New Zealand",
    types: ["Permanent","Full-time"],
    posted: "2026-06-25",
    pay: "Competitive — set by the ASMS MECA scale",
    lifestyle: "The ski fields of Coronet Peak and The Remarkables, Lake Wakatipu and Central Otago wine on the doorstep. Some of the most stunning scenery in New Zealand, all year round.",
    summary: "Be the on-site radiologist at a growing district hospital in a spectacular setting, well supported by regional teams, with regular work at a nearby centre.",
    detail: "/jobs/vacancy/consultant-radiologist-queenstown"
  },
  {
    slug: "radiologist-whanganui",
    title: "Consultant Radiologist",
    profession: "Consultant Radiologist",
    professionGuide: "/jobs/consultant-radiologist-new-zealand",
    sector: "Public sector",
    region: "Manawatū-Whanganui",
    location: "Whanganui, New Zealand",
    country: "New Zealand",
    types: ["Permanent","Full-time"],
    posted: "2026-06-26",
    pay: "Competitive — set by the ASMS MECA scale",
    lifestyle: "A heritage river city with a thriving arts scene and character villas you can actually afford, with the Whanganui River and Mt Ruapehu both within easy reach.",
    summary: "A general radiologist for a modern regional hospital, with a varied caseload and a genuine 70/30 clinical to non-clinical balance.",
    detail: "/jobs/vacancy/radiologist-whanganui"
  },
  {
    slug: "radiation-therapist-palmerston-north",
    title: "Radiation Therapist",
    profession: "Radiation Therapist",
    professionGuide: "/jobs/radiation-therapist-new-zealand",
    sector: "Public sector",
    region: "Manawatū-Whanganui",
    location: "Palmerston North, New Zealand",
    country: "New Zealand",
    types: ["Permanent","Full-time"],
    posted: "2026-06-26",
    pay: "Competitive — set by the APEX collective agreement",
    lifestyle: "A green, easygoing city in the heart of the lower North Island: central to mountains, coast and the capital, with a young, friendly feel.",
    summary: "Join a growing regional cancer treatment service running one of New Zealand’s newest linac fleets, with outreach work and real scope to develop.",
    detail: "/jobs/vacancy/radiation-therapist-palmerston-north"
  },
  {
    slug: "breast-radiologist-waikato",
    title: "Consultant Radiologist · Breast Imaging",
    profession: "Consultant Radiologist",
    professionGuide: "/jobs/consultant-radiologist-new-zealand",
    sector: "Public sector",
    region: "Waikato",
    location: "Hamilton, New Zealand",
    country: "New Zealand",
    types: ["Permanent","Full-time"],
    posted: "2026-06-24",
    pay: "Competitive — set by the ASMS MECA scale",
    lifestyle: "City amenities on the Waikato River with world-famous gardens, and an easy drive to Raglan's surf and the Coromandel when the weekend comes.",
    summary: "An experienced breast radiologist for a tertiary teaching hospital: screening assessment clinics, weekly MDMs, and a broad mix of general and acute imaging.",
    detail: "/jobs/vacancy/breast-radiologist-waikato"
  }
];
