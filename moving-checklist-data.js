/* ================================================================
   ETHICARE RESOURCING — Your Moving Checklist (/moving-checklist)
   ----------------------------------------------------------------
   THE DATA LAYER. All copy, sections and links live here; the
   controller (moving-checklist.js) only renders and stores state.

   ARCHITECTURE NOTE — read before adding content.
   This tool is a ROADMAP, not a guide. Like the Six Steps, it owns no
   topic: it tells a candidate WHAT APPLIES TO THEM given who is moving,
   and links to the master guide that explains each topic once.

   Two rules follow, and both have been broken before:
   1. Never explain a national topic here. School fees, visas,
      healthcare, renting, pets, banking are each owned by exactly one
      guide. Write one sentence, then link. In particular:
      · /guides/australia-school-fees deliberately publishes NO fee
        figures ("a stale number is worse than no number when you're
        building a relocation budget"). Do not reintroduce per-state
        dollar figures here — that decision is editorial, not an
        oversight, and this page must not contradict it.
   2. This is NOT the New Zealand relocation checklist. That one
      (/guides/nz/relocation-checklist, chapter 13 of the NZ guide) is a
      TIMELINE — roughly forty errands across six months, before and
      after you fly. This one is a DECISION checklist, personalised by
      household shape, covering both countries. They answer different
      questions and cross-link. Keep it that way.
   ================================================================ */
(function () {
  'use strict';

  /* ---------- link map: every href resolves to a real page ---------- */
  function links(dest) {
    var au = dest === 'au' || dest === 'both';
    var nz = dest === 'nz' || dest === 'both';
    var nzOnly = nz && !au;
    return {
      destinations: '/destinations/',
      registration: '/pathway-checker',
      costs: '/guides/cost-of-relocating',
      jobs: '/jobs/',
      salary: nzOnly ? '/guides/new-zealand-salary' : '/guides/australia-salary',
      offer: '/guides/negotiating-your-offer',
      visas: nzOnly ? '/guides/new-zealand-visa' : '/guides/australia-visa',
      officialVisas: nzOnly ? 'https://www.immigration.govt.nz/' : 'https://immi.homeaffairs.gov.au/',
      housing: nzOnly ? '/guides/renting-in-new-zealand' : '/guides/moving-to-australia',
      healthcare: nzOnly ? '/guides/new-zealand-healthcare' : '/guides/australia-healthcare',
      education: nzOnly ? '/guides/new-zealand-education' : '/guides/australia-education',
      schoolFeesAU: '/guides/australia-school-fees',
      educationNZ: '/guides/new-zealand-education',
      family: nzOnly ? '/guides/new-zealand-family' : '/guides/australia-family',
      pets: nzOnly ? '/guides/nz/bringing-pets-and-belongings' : '/guides/australia-pets',
      arrival: nzOnly ? '/guides/new-zealand-relocation' : '/guides/australia-relocation',
      firstMonth: nzOnly ? '/guides/new-zealand-first-month' : '/guides/australia-relocation',
      banking: nzOnly ? '/guides/money-tax-and-banking' : '/guides/moving-to-australia',
      costOfLiving: nzOnly ? '/guides/living-in-new-zealand' : '/guides/living-in-australia',
      community: nzOnly ? '/guides/new-zealand-community' : '/guides/australia-community',
      nzTimeline: '/guides/new-zealand-checklist',
      contact: '/contact'
    };
  }

  /* ---------- the questions ---------- */
  var DESTINATIONS = [
    { id: 'au', tile: 'AU', cls: 'au', label: 'Australia', desc: 'We\u2019ll flag state-by-state differences where they matter.' },
    { id: 'nz', tile: 'NZ', cls: 'nz', label: 'New Zealand', desc: 'One national system \u2014 and a car matters more outside the main centres.' },
    { id: 'both', tile: 'AU\u00b7NZ', cls: 'both', label: 'Both, or still deciding', desc: 'You\u2019ll see both where the two countries differ.' }
  ];

  var HOUSEHOLDS = [
    { id: 'solo', label: 'Just me', desc: 'I\u2019m relocating on my own.' },
    { id: 'couple', label: 'Me and my partner', desc: 'We\u2019re moving together.' },
    { id: 'parentKids', label: 'Me and my children', desc: 'I\u2019m relocating with my children as the only accompanying parent.' },
    { id: 'familyKids', label: 'Me, my partner and children', desc: 'We\u2019re moving as a family.' },
    { id: 'first', label: 'I\u2019m moving first', desc: 'My partner or family will join me later.' }
  ];

  var AGES = [
    { id: 'under5', label: 'Under 5' },
    { id: 'primary', label: '5\u201311 (primary)' },
    { id: 'secondary', label: '12\u201317 (secondary)' }
  ];

  var WHO_LABEL = {
    solo: 'Moving on my own', couple: 'Moving with my partner',
    parentKids: 'Moving with my children', familyKids: 'Moving as a family',
    first: 'Moving first, family joining later'
  };
  var DEST_LABEL = { au: 'Australia', nz: 'New Zealand', both: 'Australia or New Zealand' };
  var AGE_LABEL = { under5: 'under 5', primary: 'primary age', secondary: 'secondary age' };

  /* ---------- the checklist ----------
     Each section: { id, title, eyebrow, intro?, items: [{ id, title, note?, meta?,
     ctaLabel?, ctaHref?, cta2Label?, cta2Href? }] }
     Sections appear only when they apply to the answers given. */
  function build(a) {
    var L = links(a.dest);
    var hasPartner = a.who === 'couple' || a.who === 'familyKids' || a.who === 'first';
    var kids = a.who === 'parentKids' || a.who === 'familyKids';
    var ages = a.ages || [];
    var schoolAge = kids && (ages.indexOf('primary') >= 0 || ages.indexOf('secondary') >= 0);
    var under5 = kids && ages.indexOf('under5') >= 0;
    var au = a.dest === 'au' || a.dest === 'both';
    var nz = a.dest === 'nz' || a.dest === 'both';
    var nzOnly = nz && !au;
    var soleAdult = a.who === 'parentKids';
    var iv = soleAdult ? 'I\u2019ve' : 'We\u2019ve';
    var my = soleAdult ? 'my' : 'our';
    var out = [];

    out.push({
      id: 'the-move', eyebrow: 'First', title: 'The move itself',
      intro: 'The shape of the decision, before any of the logistics.',
      items: [
        { id: 'm1', title: 'I\u2019ve thought about what I want from the move', note: 'Career, lifestyle, finances \u2014 and whether this is a few years or a longer-term change. The answer changes what matters below.' },
        { id: 'm2', title: 'I\u2019ve researched the place, not just the job', note: 'Housing, transport, climate, airport access, and what an ordinary Tuesday would actually look like.', ctaLabel: 'Explore destinations', ctaHref: L.destinations },
        { id: 'm3', title: 'I know where my professional registration stands', note: 'Registration is profession-specific and usually sets the timeline for everything else on this list.', ctaLabel: 'Check my registration pathway', ctaHref: L.registration },
        { id: 'm4', title: 'I understand the likely visa process', note: 'Read our summary alongside the official immigration source \u2014 the official one is the authority.', ctaLabel: 'Visa guide', ctaHref: L.visas, cta2Label: 'Official immigration site', cta2Href: L.officialVisas }
      ]
    });

    out.push({
      id: 'money', eyebrow: 'The numbers', title: 'Money',
      intro: 'Two separate questions: can you afford the move, and does the life afterwards work?',
      items: [
        { id: 'f1', title: 'I\u2019ve looked at take-home pay, not the advertised salary', note: 'Tax, superannuation or KiwiSaver, and student loan repayments all land differently than at home.', ctaLabel: 'Salary guide', ctaHref: L.salary },
        { id: 'f2', title: 'I\u2019ve researched realistic housing costs', note: 'Look at actual listings in the suburbs you\u2019d consider, not national averages.' },
        { id: 'f3', title: 'I\u2019ve worked out what the move itself costs', ctaLabel: 'What it costs to get there', ctaHref: L.costs },
        { id: 'f4', title: 'I know exactly what my employer is contributing', note: 'Packages vary a great deal. Check whether flights, visas, registration and temporary accommodation are included \u2014 and whether they are paid upfront or reimbursed later.', ctaLabel: 'Negotiating your offer', ctaHref: L.offer },
        { id: 'f5', title: 'I\u2019ve planned for the weeks before my first payslip', note: 'Rent and bond, food, transport and setting up a home, all before any money arrives.' }
      ]
    });

    out.push({
      id: 'housing', eyebrow: 'Somewhere to live', title: 'Housing',
      intro: 'Temporarily first, then properly \u2014 almost nobody does it in one step.',
      items: [
        { id: 'h1', title: 'I\u2019ve researched suburbs, not just cities', meta: 'Commute \u00b7 transport \u00b7 shops \u00b7 healthcare' + (kids ? ' \u00b7 schools and childcare' : '') },
        { id: 'h2', title: 'I know what I\u2019ll need to apply for a rental', note: 'Applications are competitive, and a new arrival has no local rental history or credit file.', ctaLabel: nzOnly ? 'Renting in New Zealand' : 'Renting and housing', ctaHref: L.housing },
        { id: 'h3', title: 'I\u2019ve budgeted for temporary accommodation', note: 'Don\u2019t assume a permanent rental will be secured before you land.' },
        { id: 'h4', title: 'I\u2019ve thought about whether I\u2019ll need a car', note: nzOnly ? 'Outside the main centres in New Zealand, a car is usually assumed rather than optional.' : 'Public transport varies enormously between cities and regions.' }
      ]
    });

    out.push({
      id: 'healthcare', eyebrow: 'Cover', title: 'Healthcare',
      items: [
        { id: 'c1', title: 'I\u2019ve checked what healthcare I can access', note: au && nz ? 'It depends on your visa in both countries \u2014 Medicare in Australia, publicly funded care in New Zealand.' : au ? 'Whether you can access Medicare depends on your visa and any reciprocal agreement with your country.' : 'Eligibility for publicly funded healthcare depends on your visa and how long it runs.', ctaLabel: 'Healthcare guide', ctaHref: L.healthcare },
        { id: 'c2', title: 'I\u2019ve checked whether private cover is relevant', note: au ? 'Some Australian visas require health cover as a condition.' : 'Some employers include cover; some visas require it.' },
        { id: 'c3', title: 'I\u2019ve organised medical records and prescriptions', note: 'Repeat prescriptions, immunisation records and a written summary of any ongoing care.' }
      ]
    });

    out.push({
      id: 'preparation', eyebrow: 'Logistics', title: 'Practical preparation',
      items: [
        { id: 'p1', title: 'My passport and documents are in order' },
        { id: 'p2', title: 'I\u2019ve decided what to take, ship, store or sell' },
        { id: 'p3', title: 'I\u2019ve planned flights and arrival' },
        { id: 'p4', title: 'I know where I\u2019m staying when I land' },
        { id: 'p5', title: 'I\u2019ve thought about banking, phone and transport on arrival', ctaLabel: nzOnly ? 'Money, tax and banking' : 'Preparing to move', ctaHref: L.banking }
      ]
    });

    if (a.who === 'solo') {
      out.push({
        id: 'on-your-own', eyebrow: 'Just you', title: 'Moving on your own',
        intro: 'Moving alone makes some of this simpler \u2014 and means every practical decision is yours. The part people underestimate is life outside work.',
        items: [
          { id: 's1', title: 'I\u2019ve decided whether to live alone or house-share at first' },
          { id: 's2', title: 'I\u2019ve researched what the place is like for someone on their own', meta: 'Social life \u00b7 hobbies \u00b7 transport \u00b7 weekends \u00b7 community', ctaLabel: 'Explore destinations', ctaHref: L.destinations },
          { id: 's3', title: 'I\u2019ve thought about how I\u2019ll meet people outside work', note: 'Sport, hobbies, community groups and professional networks are how most people build a life after relocating.', ctaLabel: 'Community and connection', ctaHref: L.community },
          { id: 's4', title: 'I\u2019ve thought about staying connected with people at home' },
          { id: 's5', title: 'I have a plan if I need practical help in my first few weeks' }
        ]
      });
    }

    if (hasPartner) {
      out.push({
        id: 'partner', eyebrow: 'Both of you', title: 'Your partner',
        intro: 'Two people are moving, but usually only one has a job to walk into. This section is the one most often skipped and most often regretted.',
        items: [
          { id: 'w1', title: 'We\u2019ve checked whether my partner will have work rights', ctaLabel: 'Official immigration site', ctaHref: L.officialVisas },
          { id: 'w2', title: 'We\u2019ve researched my partner\u2019s job prospects' },
          { id: 'w3', title: 'We\u2019ve checked whether their profession needs registration', note: 'If your partner is also a healthcare professional, start with the pathway checker \u2014 their timeline may be longer than yours.', ctaLabel: 'Registration pathway checker', ctaHref: L.registration },
          { id: 'w4', title: 'We\u2019ve budgeted for living on one income for a while', note: 'Even with full work rights, finding the right role takes time.', ctaLabel: 'Cost of living', ctaHref: L.costOfLiving },
          { id: 'w5', title: 'We\u2019ve thought about how we\u2019ll both build a life', note: 'The one starting a new job has colleagues and routine from day one. The accompanying partner can have a very different first few weeks.' }
        ]
      });
    }

    if (schoolAge) {
      out.push({
        id: 'children', eyebrow: 'Schooling', title: 'Moving with children',
        intro: 'Schooling shapes where you live, when you move, and what the move costs \u2014 usually in that order.',
        items: [
          { id: 'k1', title: iv + ' checked what schooling ' + my + ' children are entitled to', note: au && nz ? 'Different in each country, and in Australia different in each state \u2014 worth settling before you compare offers.' : au ? 'Government-school tuition for dependants of temporary visa holders varies by state and by visa. Several states charge nothing; a couple charge thousands per child.' : 'Children of many work-visa holders can be treated as domestic students for state-school tuition, depending on the visa.', ctaLabel: au ? 'Will I have to pay school fees?' : 'Schools and education', ctaHref: au ? L.schoolFeesAU : L.educationNZ, cta2Label: au && nz ? 'Schooling in New Zealand' : null, cta2Href: au && nz ? L.educationNZ : null },
          { id: 'k2', title: iv + ' researched schools before choosing where to live', note: 'Zones and catchments decide which suburbs are realistic, so this comes before the rental search.', ctaLabel: 'Education guide', ctaHref: L.education },
          { id: 'k3', title: iv + ' checked the school year and term dates', note: 'The school year runs from late January to December in both countries \u2014 a northern-hemisphere move mid-year lands mid-year here too.' },
          { id: 'k4', title: iv + ' considered whether the timing works for ' + my + ' children', note: 'Particularly for older children approaching public examinations.' },
          { id: 'k5', title: iv + ' gathered school records', note: 'Recent reports, assessments and any learning-support documentation.' }
        ]
      });
    }

    if (under5) {
      out.push({
        id: 'childcare', eyebrow: 'Under fives', title: 'Childcare and preschool',
        items: [
          { id: 'n1', title: iv + ' researched childcare availability', note: 'Waiting lists in popular areas can run to months, so this is an early task rather than an arrival task.' },
          { id: 'n2', title: iv + ' researched likely childcare costs', note: soleAdult ? 'As the only earner, childcare can move the whole household budget.' : 'Childcare costs can decide whether both parents working is worth it.', ctaLabel: 'Family life', ctaHref: L.family },
          { id: 'n3', title: iv + ' checked whether government childcare support applies', note: 'Eligibility depends on your visa \u2014 check the official source rather than assuming.', ctaLabel: 'Official immigration site', ctaHref: L.officialVisas },
          { id: 'n4', title: iv + ' checked childcare hours against ' + (soleAdult ? 'my shifts' : 'our shifts'), note: 'Standard childcare hours and clinical shift patterns are not natural partners.' }
        ]
      });
    }

    if (soleAdult) {
      out.push({
        id: 'managing', eyebrow: 'On your own with children', title: 'Managing it as the only adult',
        intro: 'Relocating with children as the only accompanying adult puts childcare, school hours, transport and a local support network at the centre of the plan \u2014 while you are also starting a new job.',
        items: [
          { id: 'o1', title: 'I\u2019ve checked school and childcare hours against my working hours', meta: 'Early starts \u00b7 late shifts \u00b7 weekends \u00b7 on-call' },
          { id: 'o2', title: 'I\u2019ve found before- and after-school care where I need it' },
          { id: 'o3', title: 'I\u2019ve thought about what happens if childcare falls through or a child is unwell' },
          { id: 'o4', title: 'I\u2019ve looked at the school-then-work commute, not just home-to-work' },
          { id: 'o5', title: 'I\u2019ve thought about building a local support network', note: 'Colleagues, neighbours, school communities and parent networks all count, and all take a little deliberate effort.' },
          { id: 'o6', title: 'I\u2019ve checked the household budget works on one income', ctaLabel: 'What it costs to get there', ctaHref: L.costs, cta2Label: 'Cost of living', cta2Href: L.costOfLiving }
        ]
      });
    }

    if (a.who === 'first') {
      out.push({
        id: 'moving-ahead', eyebrow: 'Going ahead', title: 'Moving before your family',
        intro: 'Starting work and getting established first can make the family\u2019s move much easier. It also means funding life in two places for a while \u2014 plan for that explicitly.',
        items: [
          { id: 'a1', title: 'We\u2019ve agreed roughly when everyone else joins' },
          { id: 'a2', title: 'We\u2019ve checked the family\u2019s visa arrangements', note: 'Dependants are usually tied to your visa, so the order of applications matters.', ctaLabel: 'Official immigration site', ctaHref: L.officialVisas },
          { id: 'a3', title: 'We\u2019ve budgeted for two households temporarily' },
          { id: 'a4', title: 'I\u2019ve decided whether to secure the family home now or later' },
          { id: 'a5', title: 'We\u2019ve worked out when to arrange schools or childcare' },
          { id: 'a6', title: 'We\u2019ve decided what travels with me and what follows' },
          { id: 'a7', title: 'The family\u2019s later flights are in our relocation budget', ctaLabel: 'What it costs to get there', ctaHref: L.costs }
        ]
      });
    }

    if (a.pet === true) {
      out.push({
        id: 'pets', eyebrow: 'Your pet', title: 'Bringing your pet',
        intro: 'Import rules are strict and the timeline is long \u2014 months, not weeks. This is the section to start first.',
        items: [
          { id: 'z1', title: 'I\u2019ve checked whether my pet can be imported at all', note: 'Some breeds and some countries of origin are restricted.' },
          { id: 'z2', title: 'I\u2019ve checked the veterinary and import timeline', note: 'Rabies titre testing and microchipping have to happen in a set order, with waiting periods between.', ctaLabel: nzOnly ? 'Bringing pets to New Zealand' : 'Bringing pets to Australia', ctaHref: L.pets },
          { id: 'z3', title: 'I\u2019ve obtained specialist relocation quotes' },
          { id: 'z4', title: 'I\u2019ve found pet-friendly temporary accommodation' },
          { id: 'z5', title: 'I\u2019ve checked how hard pet-friendly rentals are to find' }
        ]
      });
    }

    out.push({
      id: 'settling-in', eyebrow: 'Afterwards', title: 'Building a life once you land',
      intro: 'The move is the easy part to plan. This is the part that decides whether you stay.',
      items: [
        { id: 'e1', title: 'I\u2019ve thought about what life looks like outside work' },
        { id: 'e2', title: 'I\u2019ve found activities, hobbies or communities to join', ctaLabel: 'Community and connection', ctaHref: L.community },
        { id: 'e3', title: 'I know how I\u2019ll stay connected with people at home' },
        { id: 'e4', title: 'I know the practical things to do in my first weeks', ctaLabel: nzOnly ? 'Your first month' : 'Your first weeks', ctaHref: L.firstMonth }
      ]
    });

    return out;
  }

  /* ---------- what to do once the list is worked through ---------- */
  function nextSteps(dest) {
    var L = links(dest);
    return [
      { title: 'Check where your registration starts', label: 'Registration pathway checker', href: L.registration },
      { title: 'Understand what the move costs', label: 'The relocation cost guide', href: L.costs },
      { title: 'Decide where you\u2019d actually live', label: 'Explore destinations', href: L.destinations },
      { title: 'Ready to look at roles?', label: 'Current opportunities', href: L.jobs }
    ];
  }

  window.ETHICARE_CHECKLIST = {
    destinations: DESTINATIONS,
    households: HOUSEHOLDS,
    ages: AGES,
    whoLabel: WHO_LABEL,
    destLabel: DEST_LABEL,
    ageLabel: AGE_LABEL,
    links: links,
    build: build,
    nextSteps: nextSteps
  };
})();
