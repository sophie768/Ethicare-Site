/* ETHICARE MOVE — the public journey, one page, eight stages.
   Rebuilt 29 Sep 2026 on the one journey (questions.json → journey.js).

   What this page is: the free, no-account planner for anyone considering New Zealand or
   Australia. What it is not: My Move, the private space for Ethicare candidates — that is
   reached from the link the team sends and lives elsewhere. The React planner that used to
   load at #doing is gone from here.

   How it works, and the rules it follows (Sophie, 28–29 Sep 2026):
     · the candidate's answers live in ONE place — candidate-context.js, the same store every
       tool reads (`ethicare_portal_v1`). The strip at the top shows them and changes them;
       this page never asks what has already been answered;
     · one stage open at a time — the one the candidate is at — the other seven collapsed to
       a title and a status. Any stage opens on a tap; none is hidden;
     · the remaining questions are asked inside the stage that needs them: whether a partner
       works in health at stage 3, the children's ages at stage 5. Never up front;
     · "already sorted" skips a stage without losing it;
     · 'both' is a real destination answer: the links come for both countries, labelled.

   Kept from the previous version, unchanged in purpose: the shareable plan link (no account,
   the link carries the answers), the plan as a document (print / Word), send-my-plan to the
   team, the saved-pages file (mymove.js), and the household logic — partner registration,
   schools before the lease, the single-parent step. */
(function () {
  var KEY = 'ethicare_portal_v1';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
  var ctx = window.EthicareContext;
  var J = function () { return window.ETHICARE_JOURNEY || []; };
  var PROF = function () { return window.ETHICARE_PROFESSIONS; };
  var DATA = function () { return window.ETHICARE_COSTS || window.EthicareCostData || {}; };
  var C = function (d) { return d === 'au' ? 'australia' : 'new-zealand'; };
  var CN = function (d) { return d === 'au' ? 'Australia' : 'New Zealand'; };

  /* Each tool, its page, and the localStorage key it writes — that key is how the page
     knows whether you have actually started it. */
  var TOOL = {
    pathway: { title: 'Check your registration pathway', href: '/pathway-checker', store: 'ethicare_pathway_checker_draft_v1',
      note: 'The first question worth answering \u2014 start it early and the rest of the move has room.' },
    earn: { title: 'See what you could earn', href: '/is-it-worth-it', store: null,
      note: 'The published scales, what varies on top, and what is left after tax and rent.' },
    /* For someone who already holds an offer. The salary is settled; what is not settled is
       what reaches the account after tax, superannuation or KiwiSaver, and rent. */
    takehome: { title: 'Work out your take-home pay', href: '/take-home-pay', store: null,
      note: 'What the offer actually leaves you each month, once tax and the rest come off.' },
    cost: { title: 'Work out what the move will cost', href: '/cost-calculator', store: 'ethicare_cost_calculator_v1',
      note: 'What the whole move costs, what your employer covers, and what you need in the bank before you fly.' },
    live: { title: 'Explore where you could live', href: '/where-would-we-live', store: null,
      note: 'Cities and regions, and the trade-offs between them — written for the whole household.' },
    cv: { title: 'Write your CV', href: '/build-your-cv', store: 'ethicare-cv-builder-v1',
      note: 'The nine sections a reader wants, with the document building underneath as you type.' },
    interview: { title: 'Get ready to apply', href: '/interview-prep', store: 'ethicare-interview-prep-v1',
      note: 'A readiness check, plus the questions panels ask and somewhere to work up your own examples.' },
    offer: { title: 'Review your offer', href: '/before-you-accept', store: 'ethicare_offer_check_v1',
      note: 'What you have been offered, and the questions still worth putting to the employer.' },
    checklist: { title: 'Organise the move itself', href: '/moving-checklist', store: 'ethicare_moving_checklist_v1',
      note: 'Everything to arrange before you go, filtered to your household.' },
    first30: { title: 'Your first thirty days', href: '/guides/new-zealand-first-month', store: null,
      note: 'The paperwork in the order it needs doing, the first days on the unit, and the ordinary things that make a place yours.' }
  };
  function tool(key, d) {
    var t = TOOL[key] || TOOL.pathway;
    if (key === 'first30' && d === 'au') return { title: 'Living and thriving in Australia', href: '/guides/living-in-australia', store: null, note: t.note };
    return t;
  }
  function started(store) { if (!store) return false; try { return !!localStorage.getItem(store); } catch (e) { return false; } }

  /* ---------------- state: the shared answers, plus this page's own ------------------
     dest / profession / household / stage are read through candidate-context.js. This page
     keeps three things of its own in the same store: hh.work (does the partner work in
     health), hh.bands (children's ages), first (a first name, optional), and done (stages
     marked as sorted). */
  var S = { first: '', origin: '', hh: { with: '', work: '', bands: [] }, done: {}, steps: {}, notes: {}, started: false, set: false };
  function load() {
    try { var raw = JSON.parse(localStorage.getItem(KEY) || '{}'); if (raw && typeof raw === 'object') S = raw; } catch (e) {}
    if (!S.hh || typeof S.hh !== 'object') S.hh = { with: '', work: '', bands: [] };
    if (!Array.isArray(S.hh.bands)) S.hh.bands = [];
    if (S.hh.with === 'kids') S.hh.with = 'children';
    if (!S.done || typeof S.done !== 'object') S.done = {};
    /* ticked steps and the reader's own notes, keyed by stage. Same store as everything else,
       so the plan link and the printed document carry them too (2 Oct 2026). */
    if (!S.steps || typeof S.steps !== 'object') S.steps = {};
    if (!S.notes || typeof S.notes !== 'object') S.notes = {};
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  var dest = function () { return ctx ? ctx.destMode() : ''; };
  var oneDest = function () { return ctx ? ctx.dest() : ''; };
  var hh = function () { return ctx ? ctx.household() : ''; };
  function hasPartner() { var v = hh(); return v === 'partner' || v === 'both'; }
  function hasKids() { var v = hh(); return v === 'children' || v === 'both'; }
  /* Set by a pack (every pack belongs to someone already placed) or by anyone who tells the
     site they hold an offer. It changes what the numbers stage is for. */
  function hasOffer() { return S.offer === true; }
  function band(v) { return S.hh.bands.indexOf(v) > -1; }
  function schoolAge() { return band('5to12') || band('13to17'); }
  var BANDS = [{ value: 'u5', label: 'Under 5' }, { value: '5to12', label: '5–12' }, { value: '13to17', label: '13–17' }, { value: '18up', label: '18 or over' }];
  var WORK = [{ value: 'health', label: 'Yes — they work in healthcare too' }, { value: 'other', label: 'Yes — in another field' }, { value: 'later', label: 'Not straight away' }, { value: 'unsure', label: 'Not sure yet' }];
  function hhPhrase() { return ctx ? ctx.householdPhrase() : ''; }
  function profLabel() { return ctx ? (ctx.professionLabel() || ctx.profession()) : ''; }
  function destLabel() { return ctx ? (ctx.destLabel() || 'New Zealand or Australia') : ''; }
  /* the place, for a sentence: destLabel() says "Comparing both countries", which is a
     status and reads as nonsense after "a move to". */
  function destName() { return ctx && ctx.destName ? (ctx.destName() || 'New Zealand or Australia') : destLabel(); }

  /* The visa note used to say "Your employer sponsors you, so this follows the offer" to
     everyone. True for the route most candidates take — an Accredited Employer Work Visa in
     New Zealand, a 482 in Australia — and wrong for a Green List profession applying Straight
     to Residence, which does not wait on an offer at all. Those are the professions Ethicare
     places most, so the page was telling its core audience the wrong order for their own move
     (Sophie, 1 Oct 2026). Named per country, because a New Zealand candidate has no use for
     the 482 and the reverse. Neither route is promised: which one applies is the regulator's
     and the employer's to say, and the pathway checker is where it is worked out. */
  function visaNote() {
    var d = dest();
    var common = d === 'nz'
      ? 'Most people we place come on an Accredited Employer Work Visa, sponsored by the employer, so it follows the offer.'
      : d === 'au'
        ? 'Most people we place come on a 482, sponsored by the employer, so it follows the offer.'
        : 'Most people we place come on an employer-sponsored visa \u2014 an Accredited Employer Work Visa in New Zealand, a 482 in Australia \u2014 so it follows the offer.';
    var other = (d === 'au')
      ? ''
      : ' Some professions on New Zealand\u2019s Green List can apply for residence without waiting for a job offer, which changes the order entirely \u2014 worth checking against your own occupation early.';
    return common + other + ' Either way: which visa, what it costs for everyone coming, and how long it realistically takes.';
  }

  /* ---- the registration guide for THEIR profession (2 Oct 2026) ----------------------------
     The page already knew the candidate's profession and did nothing with it: a doctor, a
     physiotherapist and a radiographer were all sent to the same generic country guide, while
     eight profession-specific guides sat unlinked. The regulator is the thing that differs most
     between professions, so this is the one link where "profession" earns its keep.

     Keyed by regulator rather than profession, because that is how registration actually works
     — one board covers several professions. Only pairs with a guide that exists are listed; a
     profession not here falls back to the country guide, which is correct rather than a gap. */
  var REG_GUIDE = {
    nz: {
      medicine:    'new-zealand-registration-mcnz',    /* Medical Council */
      imaging:     'new-zealand-registration-mrtb',    /* Medical Radiation Technologists Board */
      radtherapy:  'new-zealand-registration-mrtb',
      nuclearmed:  'new-zealand-registration-mrtb',
      sonography:  'new-zealand-registration-mrtb',
      anaesthetic: 'new-zealand-registration-mscnz',   /* Medical Sciences Council — ATs and UK ODPs */
      psychology:  'new-zealand-registration-nzpb',    /* Psychologists Board */
      ot:          'new-zealand-registration-otbnz',   /* Occupational Therapy Board */
      physio:      'new-zealand-registration-pbnz'     /* Physiotherapy Board */
    },
    au: {
      imaging:     'australia-registration-mrpba',     /* Medical Radiation Practice Board */
      radtherapy:  'australia-registration-mrpba',
      nuclearmed:  'australia-registration-mrpba',
      sonography:  'australia-registration-asar'       /* ASMIRT and ASAR accreditation */
    }
  };
  function regGuide(dd) {
    var k = ctx && ctx.profession ? ctx.profession() : '';
    var m = REG_GUIDE[dd] || {};
    return (k && m[k]) ? m[k] : null;
  }
  function regLabel() {
    var n = ctx && ctx.professionLabel ? ctx.professionLabel() : '';
    /* The catalogue labels carry an alternative after a slash ("Medical imaging / radiography")
       which reads badly inside a sentence; the first name is the one people use. */
    n = String(n || '').split('/')[0].trim();
    return n ? 'Registration for ' + n.charAt(0).toLowerCase() + n.slice(1) : 'Registration guide';
  }
  function me() { var p = PROF(), d = oneDest(), k = ctx && ctx.profession(); return (p && d && k) ? p.forCountry(k, d) : null; }
  function origins() { var f = DATA().flights || {}; return Object.keys(f).map(function (k) { return { value: k, label: f[k].label }; }); }
  function savedItems() { try { var o = JSON.parse(localStorage.getItem('ethicare_saved_v1') || '{}'); return (o && o.items) || []; } catch (e) { return []; } }

  /* ---------------- the eight stages, with this candidate's content ---------------- */
  function forCountries(fn) {
    /* fn(d, c) → links for one country. With 'both', run it for each and label the links. */
    var d = dest();
    if (d === 'nz' || d === 'au') return fn(d, C(d));
    if (d === 'both') {
      var a = fn('nz', 'new-zealand').map(function (l) { return { label: 'NZ · ' + l.label, href: l.href, external: l.external }; });
      var b = fn('au', 'australia').map(function (l) { return { label: 'AU · ' + l.label, href: l.href, external: l.external }; });
      return a.concat(b);
    }
    return null; // no destination yet: the caller supplies country-free links
  }
  function immi(d) {
    return d === 'au' ? { label: 'Department of Home Affairs', href: 'https://immi.homeaffairs.gov.au/', external: true }
                      : { label: 'Immigration New Zealand', href: 'https://www.immigration.govt.nz/', external: true };
  }

  /* ---- the short name a stage goes by on a phone ------------------------------------------
     The chips above the panel have to fit eight across three rows at 390px. The full name
     stays on the panel heading and in the desktop rail, so nothing is lost. */
  var SHORT = { imagine: 'Imagine it', choose: 'Choose a country', work: 'Can I work there?', numbers: 'The money',
    place: 'Where to live', role: 'Find a role', plan: 'Plan the move', settle: 'Settle in' };

  /* ---- what each stage is FOR, in a sentence or two (2 Oct 2026) ---------------------------
     Written to open the stage warmly and say what it helps you decide — not to describe the
     page, and not to imply anything is running late. */
  function intro(id) {
    var dl = destLabel();
    switch (id) {
      case 'imagine': return 'Start with the life, not the paperwork. What an ordinary week could look like, what your profession is like there, and whether the people coming with you want it too.';
      /* Someone who has chosen does not need selling the other country. This stage then has
         almost nothing in it for them, and saying so is better than inventing tasks
         (Sophie, 2 Oct 2026). */
      case 'choose': return dest() === 'nz' || dest() === 'au'
        ? 'You have chosen ' + dl + '. There is nothing you have to do here \u2014 unless you want to sense-check the decision before the rest of the move leans on it.'
        : 'Two countries, two regulators, two pay systems and a very different sense of scale. This is where you work out which one fits.';
      case 'work': return 'Find out whether you can register, by which route, and roughly how long it takes. Registration is usually the longest part, so it is worth starting here.';
      case 'numbers': return hasOffer()
        ? 'You know the salary. This is where you work out what it actually leaves you each month, and what the move itself will cost.'
        : 'What you could earn, what the move will cost, and whether the two add up for your household.';
      case 'place': return 'Explore places that could suit your work, your budget and the life you want to build.';
      case 'role': return 'See what is open in your profession, and get your CV and your answers ready for a health system that reads them differently.';
      case 'plan': return 'With an offer in hand, the move becomes real. The contract, the visa and everything that has to be arranged before you fly.';
      case 'settle': return 'The first weeks decide how a place feels. The paperwork, the first days at work, and the ordinary things that make somewhere home.';
    }
    return '';
  }

  /* ---- your next steps: three or four, phrased as decisions wherever they can be ------------
     Deliberately short, and deliberately few. A long list of empty boxes is just a way of
     telling someone they are behind. */
  function steps(id) {
    var d = dest(), single = (d === 'nz' || d === 'au'), dl = destLabel(), L = [];
    switch (id) {
      case 'imagine':
        L = ['Read what the work is really like' + (single ? ' in ' + dl : ' in each country'),
             'Talk it through with whoever is coming with you',
             'Be honest with yourself about what you would miss'];
        break;
      case 'choose':
        L = single
          ? ['Sense-check your choice against the other country, if you want to',
             'Read what day-to-day life in ' + dl + ' is actually like']
          : ['Read the two countries side by side', 'Compare how pay and conditions differ',
             'Settle on one, or decide to keep both open for now'];
        break;
      case 'work':
        L = ['Run your profession through the pathway checker',
             'Request a certificate of good standing from each regulator you have held registration with',
             'Check what is needed on English, character and health'];
        if (hasPartner() && S.hh.work === 'health') L.push('Start your partner’s pathway alongside your own');
        break;
      case 'numbers':
        L = hasOffer()
          ? ['Work out what the offer leaves you each month', 'Estimate what the move itself will cost', 'Find out what your employer covers, in writing']
          : ['Look up the published pay for your profession and step', 'Estimate what the move itself will cost', 'Decide what you want in the bank before you fly'];
        break;
      case 'place':
        L = ['Read the guides for the places you are considering', 'Compare rent and the commute to likely employers'];
        if (hasKids()) L.push('Look at schools or childcare before you settle on an area');
        L.push('Shortlist two or three places');
        break;
      case 'role':
        L = ['Look at what is open now in your profession', 'Rewrite your CV for the system you are applying to',
             'Work up your answers to the questions panels actually ask', 'Tell us what you are looking for'];
        break;
      case 'plan':
        L = ['Read the offer properly and ask about anything unclear', 'Start the visa application',
             'Arrange shipping and somewhere to stay when you land'];
        if (hasKids()) L.push('Apply for a school or childcare place');
        break;
      case 'settle':
        L = ['Sort your tax number, a bank account and a phone', 'Get through your first days on the unit',
             'Find the things that make a week feel like yours again'];
        break;
    }
    return L;
  }

  function stages() {
    var d = dest(), single = (d === 'nz' || d === 'au'), c = single ? C(d) : '';
    var out = [];
    J().forEach(function (j) {
      var st = { n: j.n, id: j.id, label: j.there, where: j.where, items: [], ask: null };
      switch (j.id) {
        case 'imagine':
          st.items.push({ title: 'Where to start reading', note: 'The country pages, and an honest account of why people move and what they miss once they have.',
            links: forCountries(function (dd) { return [{ label: 'Working in ' + CN(dd), href: '/' + C(dd) }, { label: 'Why people move, and what they miss', href: '/guides/why-people-move' }]; })
              || [{ label: 'Working in New Zealand', href: '/new-zealand' }, { label: 'Working in Australia', href: '/australia' }, { label: 'Why people move, and what they miss', href: '/guides/why-people-move' }] });
          st.items.push({ title: 'What the move was like', note: 'How the move actually went for people who have done it, including the parts that were harder than expected.', links: [{ label: 'Stories from people who moved', href: '/insights' }] });
          break;
        case 'choose':
          if (single) {
            st.items.push({ title: 'Living in ' + CN(d),
              note: 'What the country is actually like to live in, region by region \u2014 the part a job advert never covers.',
              links: [{ label: CN(d) + ' destination guides', href: d === 'au' ? '/destinations/australia' : '/destinations/' },
                      { label: 'Working in ' + CN(d), href: '/' + C(d) }] });
            st.items.push({ title: 'Still want to check the other one?',
              note: 'The comparison is one page and candid about both. Worth ten minutes if the decision is not quite settled.',
              links: [{ label: 'Compare the two countries', href: '/guides/australia-vs-new-zealand' },
                      { label: 'Pay compared', href: '/guides/australia-vs-new-zealand-salary' }] });
          } else {
            st.items.push({ title: 'Australia or New Zealand?',
              note: 'The comparison is one page and candid about both: pay, registration, climate, distance from home, and what each is actually like to live in.',
              links: [{ label: 'Compare the two countries', href: '/guides/australia-vs-new-zealand' }, { label: 'Pay compared', href: '/guides/australia-vs-new-zealand-salary' }].concat(
                forCountries(function (dd) { return [{ label: CN(dd) + ' destination guides', href: dd === 'au' ? '/destinations/australia' : '/destinations/' }]; }) || [{ label: 'All destination guides', href: '/destinations/' }]) });
          }
          break;
        case 'work':
          st.items.push({ title: 'Registration', tool: 'pathway',
            note: 'It is more than your qualification. Certificates of good standing from every regulator you have held registration with, English, character and health checks all sit here, and some of them take weeks of their own.',
            links: (forCountries(function (dd, cc) { var g = regGuide(dd); return [g ? { label: regLabel(), href: '/guides/' + g } : { label: 'Registration guide', href: '/guides/' + cc + '-registration' }]; }) || []).concat([{ label: 'Everything registration asks of you', href: '/can-i-work-there' }]) });
          if (hasPartner() || hasKids()) st.items.push({ title: 'The people coming with you',
            note: hasPartner()
              ? 'Your visa route decides what your partner can do when you arrive — whether they can work at all, for whom, and on what terms. Worth settling before you apply rather than after you have accepted.'
              : 'A move only works if it works for the children coming with you. What changes for them, and when, is worth reading before anything practical starts.',
            links: (forCountries(function (dd, cc) { return [{ label: 'Bringing your family', href: '/guides/' + cc + '-family' }].concat(hasPartner() ? [{ label: 'Can my partner work?', href: '/guides/' + cc + '-family#partner-work' }] : []); }) || [{ label: 'Bringing your family', href: '/guides/new-zealand-family' }]) });
          if (hasPartner() && S.hh.work === 'health') st.items.push({ title: 'Your partner’s registration',
            note: 'Two clinicians means two registrations, and theirs can take longer than yours. Run their pathway alongside your own from the start — a second timeline found late is the most common reason a family arrives months apart.',
            links: [{ label: 'Check their pathway', href: '/pathway-checker' }, { label: 'Build their CV', href: '/build-your-cv' }] });
          if (hasPartner() && !S.hh.work) st.ask = 'work';
          break;
        case 'numbers':
          /* Someone holding an offer already knows the salary, so asking "what could I earn?"
             tells them something they settled weeks ago (Sophie, 1 Oct 2026). What they do not
             know is what lands in the account — tax, superannuation or KiwiSaver, and rent turn
             a known gross into an unknown net, and that is the number a lease is signed
             against. The second item stays either way: an offer does not tell you what the
             move itself costs. */
          if (hasOffer()) {
            st.items.push({ title: 'What will the offer actually leave you?', tool: 'takehome',
              note: 'You know the salary. What is left after tax, superannuation and rent is a different number, and usually lower than people expect — worth knowing before you commit to a rent.',
              links: (forCountries(function (dd, cc) { return [{ label: 'How pay is set, and what sits on top', href: '/guides/' + cc + '-salary' }]; }) || []) });
          } else {
            st.items.push({ title: 'What could I earn?', tool: 'earn',
              note: 'In the public systems pay is set by collective agreement and published. What varies is your step, your hours and the allowances on top — and what is left after tax and rent.',
              links: (forCountries(function (dd, cc) { return [{ label: 'Salary and pay, explained', href: '/guides/' + cc + '-salary' }]; }) || []).concat([{ label: 'Take-home pay', href: '/take-home-pay' }]) });
          }
          st.items.push({ title: 'Can we afford it?', tool: 'cost',
            note: 'Registration, the visa for everyone coming, flights, shipping, temporary accommodation and the bond. What the whole move costs, what an employer usually covers, and what you need in the bank.',
            links: [{ label: 'The cost of relocating, explained', href: '/guides/cost-of-relocating' }] });
          break;
        case 'place':
          st.items.push({ title: 'Where could we live?', tool: 'live',
            note: 'Some places are much more sought after than others. That does not make them better. Commute, schools, partner work, climate, distance from an airport — and the roles are often where you were not looking.',
            links: forCountries(function (dd) { return [{ label: CN(dd) + ' destination guides', href: dd === 'au' ? '/destinations/australia' : '/destinations/' }]; }) || [{ label: 'All destination guides', href: '/destinations/' }] });
          if (hasKids()) {
            var small = band('u5'), school = schoolAge();
            var kTitle = school ? (small ? 'Schools and childcare' : 'Schools') : (small ? 'Childcare and early learning' : 'The children’s side of it');
            var kNote = school
              ? 'Where you live decides which school your children can attend, so settle the school question before you sign a lease.'
              : (small ? 'Places, waiting lists and cost vary street by street, and the good ones fill early. Worth starting before you fly rather than in your first week.'
                       : 'What changes for them, in what order, and what you can set up before you land.');
            if (band('18up')) kNote += ' At university age your visa route decides whether they pay domestic or international fees — a gap wide enough to change the maths of the whole move.';
            var kl = forCountries(function (dd, cc) {
              var L = [{ label: 'Schools and education', href: '/guides/' + cc + '-education' }];
              if (small) L.push({ label: 'Childcare, explained', href: '/guides/' + cc + '-family#childcare' });
              L.push(dd === 'au' ? { label: 'Child Care Subsidy (Services Australia)', href: 'https://www.servicesaustralia.gov.au/child-care-subsidy', external: true }
                                 : { label: 'Early learning (Ministry of Education)', href: 'https://parents.education.govt.nz/', external: true });
              return L;
            }) || [{ label: 'Schools in New Zealand', href: '/guides/new-zealand-education' }, { label: 'Schools in Australia', href: '/guides/australia-education' }];
            st.items.push({ title: kTitle, note: kNote, links: kl });
            if (!S.hh.bands.length) st.ask = 'bands';
          }
          break;
        case 'role':
          st.items.push({ title: 'Finding the right role', note: 'We recruit across most professions in New Zealand, subject to the vacancies open at the time, and we are expanding into Australia starting with medical imaging. Tell us what you do and where you are thinking of, and we will tell you plainly what we have.',
            links: [{ label: 'Current opportunities', href: '/jobs/' }].concat(forCountries(function (dd, cc) { return [{ label: 'How hiring works in ' + CN(dd), href: '/guides/' + cc + '-finding-a-role' }]; }) || []) });
          st.items.push({ title: 'CV & interviews', tool: 'interview',
            note: 'A clinical CV written for one health system rarely reads well in another. Set out your experience clearly for the one you are applying to, then test what you would say out loud.',
            links: [{ label: 'Build your CV', href: '/build-your-cv' }, { label: 'Check the CV you already have', href: '/cv-checker' }].concat(forCountries(function (dd, cc) { return [{ label: 'CVs and interviews guide', href: '/guides/' + cc + '-interview' }]; }) || []) });
          break;
        case 'plan':
          st.items.push({ title: 'The offer', tool: 'offer', note: 'What you have been offered, what an employer usually covers, and the questions still worth putting to them before you sign.',
            links: [{ label: 'Understanding an offer', href: '/guides/negotiating-your-offer' }] });
          st.items.push({ title: 'Visas', note: visaNote(),
            links: (forCountries(function (dd, cc) { return [{ label: 'Visa guide', href: '/guides/' + cc + '-visa' }, immi(dd)]; }) || [{ label: 'Visas: New Zealand', href: '/guides/new-zealand-visa' }, { label: 'Visas: Australia', href: '/guides/australia-visa' }]) });
          st.items.push({ title: 'Plan your move', tool: 'checklist', note: 'Shipping, storage, temporary accommodation, the lease, the school place and what has the longest lead time — in the order it needs doing.',
            links: forCountries(function (dd, cc) { return [{ label: 'Preparing for the move', href: '/guides/' + cc + '-relocation' }]; }) || [{ label: 'Bringing pets and belongings', href: '/guides/nz/bringing-pets-and-belongings' }] });
          if (hasKids() && !hasPartner()) st.items.push({ title: 'Moving as a single parent',
            note: 'Doing this on your own is a different move, not a smaller one. Two things are worth handling early: written consent from anyone else with parental responsibility, which visa applications and border officials can ask to see, and childcare that works around clinical shifts when there is no second adult at home.',
            links: forCountries(function (dd, cc) { return [{ label: 'Moving as a single parent', href: '/guides/' + cc + '-family#single-parent' }, immi(dd)]; }) || [{ label: 'Moving as a single parent', href: '/guides/new-zealand-family#single-parent' }] });
          break;
        case 'settle':
          st.items.push({ title: 'Landing well', tool: 'first30', note: 'What to do in the first week and in what order, and who to ask when something does not work the way it did at home.',
            links: forCountries(function (dd, cc) { return [{ label: 'Living and thriving in ' + CN(dd), href: '/guides/living-in-' + cc }, { label: 'Community and belonging', href: '/guides/' + cc + '-community' }]; }) || [{ label: 'Settling in', href: '/settling-in' }] });
          break;
      }
      out.push(st);
    });
    return out;
  }

  function currentId() { var s = ctx ? ctx.stage() : ''; return s || ''; }
  function stageByN(n) { var j = J(); for (var i = 0; i < j.length; i++) if (j[i].n === n) return j[i]; return null; }
  function nextOpen() {
    /* the stage worth doing next: the current one unless it is sorted, then the first unsorted after it */
    var cur = currentId(), j = J(), start = 1;
    for (var i = 0; i < j.length; i++) if (j[i].id === cur) start = j[i].n;
    for (var n = start; n <= 8; n++) { var s = stageByN(n); if (s && !S.done[s.id]) return s; }
    return null;
  }

  function selectedStageId() {
    var nx = nextOpen();
    return open || (nx ? nx.id : (currentId() || 'imagine'));
  }

  /* ---- the welcome, once the answers are in (2 Oct 2026) ----------------------------------
     Sophie: between answering and the plan there should be a moment that confirms what we
     heard and says what the next part covers, with their name on it. It shows once. The
     button is the only thing in its way, and pressing it is remembered. A pack supplies its
     own intro line, and its reader is already placed, so the welcome is skipped there. */
  function wantsWelcome() {
    if (document.body.hasAttribute('data-strip-intro')) return false;   /* inside a pack */
    if (S.started) return false;
    return !!(dest() && ctx && ctx.profession());
  }
  function welcomeHTML() {
    /* A greeting, not a screen. The four bands that used to be here said what the eight
       stages are, which is the rail's job now that it sits directly underneath. */
    var name = (S.first || '').trim();
    var prof = profLabel() ? profLabel().split('/')[0].trim().toLowerCase() : '';
    var line = 'You\u2019re thinking about a move to ' + esc(destName()) +
      (prof ? ', working in ' + esc(prof) : '') +
      (hhPhrase() ? ', ' + esc(hhPhrase()) : '') + '.';
    var hello = dest() === 'nz' ? 'Kia ora' : 'Hello';
    var h = '<section class="pt-welcome" tabindex="-1">' +
      '<h2>' + esc(hello) + (name ? ', ' + esc(name) : '') + '.</h2>' +
      '<p class="pt-wl">' + line + ' We\u2019re glad you\u2019re here. This plan will help you work out ' +
      'what\u2019s possible, what it takes, and what it would mean for the people coming with you.</p>';
    if (!name) h += '<div class="pt-name pt-wname"><label for="wName">What should we call you? <span>optional</span></label>' +
      '<input id="wName" type="text" maxlength="40" autocomplete="given-name" placeholder="First name" data-plan-first></div>';
    h += '<p class="pt-wedit"><button type="button" class="pt-quiet" data-editanswers>Change these answers</button>' +
      '<button type="button" class="pt-quiet" data-start style="margin-left:18px">Hide this</button></p>' +
      '</section>';
    return h;
  }

  /* ---------------- paint ---------------- */
  var open = null; // stage id the reader has opened by hand; null = the current stage
  function paint() {
    var host = $('[data-stages]'); if (!host) return;
    var d = dest(), hasD = !!d, cur = currentId(), nx = nextOpen();
    var known = hasD || (ctx && ctx.profession()) || cur;
    var list = stages();

    /* ---- the journey data did not arrive (3 Oct 2026) ----------------------------------
       journey.js supplies the eight stages. If it fails to load — a dropped request, a cold
       cache, a flaky connection — list is empty, the next line used to read .id off
       undefined, and the whole page below the hero vanished with an uncaught error. A
       reload fixed it, because by then the file was cached, which is exactly what a
       reviewer reported seeing. Now it says so and offers the reload, instead of failing
       silently and looking broken. */
    if (!list.length) {
      host.innerHTML = '<div class="pt-card" style="max-width:640px">' +
        '<p class="pt-k">This part did not load</p>' +
        '<p class="note">Your plan is safe — nothing has been lost. The page just did not finish loading. ' +
        'Reloading almost always fixes it.</p>' +
        '<div class="pt-signrow" style="margin-top:14px">' +
        '<button type="button" class="pt-btn" onclick="location.reload()">Reload the page</button>' +
        '<a class="pt-btn ghost" href="/contact">Tell us about it</a></div></div>';
      if (window.console && console.warn) console.warn('[move] journey data unavailable — journey.js may not have loaded');
      return;
    }

    var openId = open || (nx ? nx.id : (cur || 'imagine'));

    /* The welcome used to stand in front of the journey with a "Start my plan" button. Two
       steps between answering and the plan was one too many (Sophie, 3 Oct 2026), so the
       greeting now sits ABOVE the journey and nothing is in the way. */
    /* next step card */
    var nextEl = $('[data-next]');
    if (nextEl) {
      if (!known) { nextEl.hidden = true; }
      else {
        var ns = nx ? list.filter(function (s) { return s.id === nx.id; })[0] : null;
        var t0 = ns && ns.items.filter(function (it) { return it.tool; })[0];
        var tl = t0 ? tool(t0.tool, oneDest()) : null;
        nextEl.hidden = false;
        nextEl.innerHTML = ns
          ? '<span class="k">Your next step</span><h2>' + esc(ns.label) + '</h2><p>' + esc(tl ? tl.note : ns.items[0].note) + '</p>' +
            (tl ? '<a class="pt-btn" href="' + tl.href + '" data-ctx-link>' + esc(tl.title) + ' <i aria-hidden="true">&rarr;</i></a>' : '<button class="pt-btn" type="button" data-go="' + ns.id + '" data-scroll="1">Open this stage <i aria-hidden="true">&rarr;</i></button>')
          : '<span class="k">Every stage sorted</span><h2>Nothing left on the list.</h2><p>Come back to any stage below, or clear the ticks to start again.</p>';
      }
    }

    /* ---- the journey: every stage listed, one stage shown (2 Oct 2026) ---------------------
       Eight stacked boxes filled the screen before any content, worst on a phone. Now: a rail
       of all eight on the left at desk width, chips above the panel on a phone, and the
       selected stage in full beside or below them.

       The numbers are gone. "01 of 08" implied a fixed order the page then contradicts two
       lines later ("the order most people need, not a rule"), and it told someone arriving
       with an offer in hand that they had skipped six things. The sequence still reads — the
       rail runs top to bottom — and what replaced the number says more: a tick for done, a
       teal edge for where you are. #s1–#s8 still work, because people have been sent them. */
    var selIdx = 0;
    for (var k = 0; k < list.length; k++) if (list[k].id === openId) selIdx = k;
    var sel = list[selIdx] || list[0];
    var prevS = list[selIdx - 1] || null, nextS = list[selIdx + 1] || null;
    var TICK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7"/></svg>';
    /* Two different things were both called "Next": the stage we recommend doing next, and the
       stage that happens to come next in the rail (the pager). Someone viewing stage three saw
       "Next" against stage five and read it as a label on what they were looking at. The
       recommendation now says "Your next step"; the pager says "Next stage" (Sophie, 3 Oct 2026).
       The stage being viewed is marked by the highlight and aria-current, never by a word. */
    function stateOf(x) { return S.done[x.id] ? 'done' : (x.id === cur ? 'now' : (nx && x.id === nx.id ? 'next' : '')); }
    function stateWord(x) { var t = stateOf(x); return t === 'done' ? 'Done' : t === 'now' ? 'You are here' : t === 'next' ? 'Your next step' : ''; }

    var rail = '<nav class="pt-rail" aria-label="The stages of your move">' +
      '<p class="pt-rail-h">Your move, stage by stage</p><ol class="pt-rail-l">' +
      list.map(function (x) {
        var t = stateOf(x), on = x.id === sel.id;
        return '<li><button type="button" class="pt-rail-b' + (on ? ' on' : '') + (t ? ' is-' + t : '') + '" data-go="' + x.id + '"' + (on ? ' aria-current="step"' : '') + '>' +
          '<span class="pt-dot" aria-hidden="true">' + (t === 'done' ? TICK : '') + '</span>' +
          '<span class="pt-rail-t">' + esc(x.label) + '</span>' +
          (stateWord(x) ? '<span class="pt-rail-s">' + stateWord(x) + '</span>' : '') +
          '</button></li>';
      }).join('') + '</ol></nav>';

    var chips = '<div class="pt-jchips"><p class="pt-jchips-h" id="pt-chips-h">Choose your stage</p>' +
      '<div class="pt-jchipw" role="group" aria-labelledby="pt-chips-h">' +
      list.map(function (x) {
        var t = stateOf(x), on = x.id === sel.id;
        return '<button type="button" class="pt-jchip' + (on ? ' on' : '') + (t ? ' is-' + t : '') + '" data-go="' + x.id + '"' + (on ? ' aria-current="step"' : '') + '>' +
          (t === 'done' ? '<span class="pt-jchip-k" aria-hidden="true">' + TICK + '</span>' : '') + esc(SHORT[x.id] || x.label) + '</button>';
      }).join('') + '</div></div>';

    var isDone = !!S.done[sel.id], isCur = sel.id === cur, word = stateWord(sel);
    var p = '<section class="pt-panel" id="s' + sel.n + '" data-stage="' + sel.id + '" tabindex="-1">';
    p += '<header class="pt-panel-h"><h2>' + esc(sel.label) + '</h2>' +
      (word ? '<span class="pt-badge' + (isDone ? ' done' : isCur ? ' now' : '') + '">' + word + '</span>' : '') + '</header>';
    p += '<p class="pt-intro">' + esc(intro(sel.id)) + '</p>';
    if (!hasD && sel.n > 1) p += '<p class="pt-hint">Tell us where you are thinking of, above, and this stage shows only that country’s guides.</p>';

    var sl = steps(sel.id);
    if (sl.length) {
      /* Not "Your next steps": the recommended stage is now badged "Your next step", and the
         two sat four lines apart meaning different things. */
      p += '<h3 class="pt-h3">Things to do at this stage</h3><ul class="pt-nsl">' + sl.map(function (txt, i) {
        var key = sel.id + '#' + i, on = !!S.steps[key];
        return '<li><button type="button" class="pt-ns' + (on ? ' on' : '') + '" data-step="' + key + '" aria-pressed="' + (on ? 'true' : 'false') + '">' +
          '<span class="pt-tick-box" aria-hidden="true">' + TICK + '</span>' +
          '<span class="pt-ns-t">' + esc(txt) + '</span></button></li>';
      }).join('') + '</ul>';
    }
    if (sel.ask === 'work') p += '<div class="pt-ask"><p class="pt-lbl">Does your partner work?</p><div class="pt-pills">' + WORK.map(function (w) { return '<button type="button" class="pt-pill" data-work="' + w.value + '">' + esc(w.label) + '</button>'; }).join('') + '</div><p class="pt-hint">If they are a clinician too, their registration gets its own step here.</p></div>';
    if (sel.ask === 'bands') p += '<div class="pt-ask"><p class="pt-lbl">How old will your children be when you move?</p><div class="pt-pills">' + BANDS.map(function (b) { return '<button type="button" class="pt-pill' + (band(b.value) ? ' on' : '') + '" data-band="' + b.value + '" aria-pressed="' + (band(b.value) ? 'true' : 'false') + '">' + esc(b.label) + '</button>'; }).join('') + '</div><p class="pt-hint">Choose every band that applies. Ages decide whether childcare, school enrolment or university fees belong in your plan.</p></div>';

    p += '<h3 class="pt-h3">Useful tools and guides</h3>';
    sel.items.forEach(function (it) {
      var tl = it.tool ? tool(it.tool, oneDest()) : null;
      /* The "Started" badge used to sit on the item title, so a saved draft in the pathway
         checker put "Registration — Started" on the page. A candidate reads that as their
         registration being underway; what it actually means is that a tool in this browser
         has answers in it. Same fact, moved to the tool it is about (Sophie, 1 Oct 2026). */
      p += '<div class="pt-item"><h4>' + esc(it.title) + '</h4><p>' + esc(it.note) + '</p>';
      if (tl) {
        p += '<a class="pt-btn ghost" href="' + tl.href + '" data-ctx-link>' + esc(tl.title) + ' <i aria-hidden="true">&rarr;</i></a>';
        if (started(tl.store)) p += '<p class="pt-draft">You have a saved draft — it opens where you left off.</p>';
      }
      if (it.links && it.links.length) p += '<div class="pt-links">' + it.links.map(function (l) { return '<a href="' + esc(l.href) + '"' + (l.external ? ' target="_blank" rel="noopener"' : '') + '>' + esc(l.label) + (l.external ? ' ↗' : '') + '</a>'; }).join('') + '</div>';
      p += '</div>';
    });

    /* Notes live in the same store as everything else, so they travel with the plan link and
       print into the document — otherwise someone types a real question here and loses it the
       day they clear their browser. The line underneath says exactly that. */
    p += '<h3 class="pt-h3">Personal notes</h3>' +
      '<label class="sr-only" for="pt-note">Your notes for ' + esc(sel.label) + '</label>' +
      '<textarea class="pt-note" id="pt-note" rows="4" data-note="' + sel.id + '" placeholder="Questions to ask, what you have decided, anything you want to come back to."></textarea>' +
      '<p class="pt-fine" style="margin-top:8px">Only you see these. They print into your own copy of the plan.</p>';

    p += '<div class="pt-signrow" style="margin-top:20px">' +
      '<button type="button" class="pt-tick' + (isDone ? ' on' : '') + '" data-done="' + sel.id + '" aria-pressed="' + (isDone ? 'true' : 'false') + '">' +
      '<span class="pt-tick-box" aria-hidden="true">' + TICK + '</span>' +
      '<span class="pt-tick-l">' + (isDone ? 'Done' : 'Mark as done') + '</span></button>' +
      (!isCur ? '<button type="button" class="pt-quiet" data-here="' + sel.id + '">This is where I am</button>' : '') +
      '</div>';

    p += '<nav class="pt-pager" aria-label="Move between stages">' +
      (prevS ? '<button type="button" class="pt-pg" data-go="' + prevS.id + '"><span class="pt-pg-k">Previous stage</span><span class="pt-pg-t">' + esc(prevS.label) + '</span></button>' : '<span></span>') +
      (nextS ? '<button type="button" class="pt-pg is-next" data-go="' + nextS.id + '"><span class="pt-pg-k">Next stage</span><span class="pt-pg-t">' + esc(nextS.label) + '</span></button>' : '<span></span>') +
      '</nav></section>';

    host.innerHTML = (wantsWelcome() ? welcomeHTML() : '') + '<div class="pt-j">' + rail + '<div class="pt-jmain">' + chips + p + '</div></div>';
    var ta = host.querySelector('[data-note]'); if (ta) ta.value = S.notes[sel.id] || '';
    if (ctx && ctx.decorate) ctx.decorate(host);
    if (ctx && ctx.decorate && nextEl) ctx.decorate(nextEl);
    paintSend();
  }

  /* ---------------- send my plan (unchanged in purpose) ---------------- */
  function paintSend() {
    var cols = $('[data-send-cols]'), off = $('[data-send-off]');
    if (!cols || !off) return;
    var m = me();
    var canHelp = !!(m && m.available && m.status === 'recruiting');
    var known = !!(ctx && ctx.profession() && oneDest());
    var sec = $('#send'); if (sec) sec.hidden = !known;
    cols.hidden = !canHelp; off.hidden = canHelp;
    var h = $('[data-send-h]'), note = $('[data-send-note]');
    if (canHelp) {
      if (h) h.textContent = 'Rather we picked this up with you?';
      if (note) note.textContent = 'Send us what you have so far and we will read it before we speak. Nothing goes anywhere until you press send — and you can see exactly what it contains below.';
      return;
    }
    /* The heading and note above belong to the "we can help" card; this branch hides that card
       and shows its own, so they are left alone. What matters here is that no advertised
       vacancy is never reported as "we do not recruit your profession". */
    if (h) h.textContent = 'Rather we picked this up with you?';
    if (note) note.textContent = '';
    var line = $('[data-send-off-line]'); if (!line) return;
    var where = destName();
    line.textContent = 'We don\u2019t currently have any vacancies listed for your profession in ' + where +
      ', but we\u2019d still love to hear what you\u2019re looking for. Send us your CV or get in touch to ' +
      'discuss your plans and how we may be able to help.';
  }

  /* ---------------- the link (no account: the link carries the answers) ---------------- */
  /* What the "open it on another device" link carries. An explicit whitelist, and 'notes' is
     deliberately not on it: the link can be pasted anywhere, and what someone writes in the
     notes box is theirs and stays on their own device (Sophie, 2 Oct 2026). Ticked steps go,
     for the same reason ticked stages always have — they are progress, not private writing. */
  var LINK_FIELDS = ['first', 'dest', 'profession', 'origin', 'stage', 'journeyStage', 'hh', 'done', 'steps'];
  function b64u(s) { return btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function b64d(s) { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return decodeURIComponent(escape(atob(s))); }
  function planLink() {
    var o = {}; LINK_FIELDS.forEach(function (k) { if (S[k] !== undefined) o[k] = S[k]; });
    var saved = savedItems();
    if (saved.length) o.sv = saved.map(function (it) { return [it.u, it.t, it.k]; });
    return location.origin + '/move?p=' + b64u(JSON.stringify(o));
  }
  function importFromLink() {
    var m = /[?&]p=([^&]+)/.exec(location.search);
    if (!m) return;
    try {
      var o = JSON.parse(b64d(decodeURIComponent(m[1])));
      if (!S.set || window.confirm('Open this saved plan? It will replace the plan currently on this device.')) {
        LINK_FIELDS.forEach(function (k) { if (o[k] !== undefined) S[k] = o[k]; });
        S.set = true; save();
        if (o.sv && o.sv.length) {
          try {
            var cur = JSON.parse(localStorage.getItem('ethicare_saved_v1') || '{"v":1,"items":[]}');
            var have = {}; cur.items.forEach(function (it) { have[it.u] = true; });
            o.sv.forEach(function (row) { if (!have[row[0]]) cur.items.push({ u: row[0], t: row[1], k: row[2], ts: Date.now() }); });
            localStorage.setItem('ethicare_saved_v1', JSON.stringify(cur));
          } catch (e2) {}
        }
      }
    } catch (e) {}
    history.replaceState(null, '', '/move');
  }

  /* ---------------- the document (print / Word), fed by the eight stages ---------------- */
  function docHTML(forWord) {
    var list = stages(), au = oneDest() === 'au';
    var accInk = au ? '#A34438' : '#2F5E49', coverInk = au ? '#EFC3AA' : '#C6E084';
    var who = (S.first ? esc(S.first) + '’s' : 'Your') + ' plan for ' + esc(destName());
    var when = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    var cur = currentId(), nx = nextOpen();
    var originLabel = (origins().filter(function (x) { return x.value === S.origin; })[0] || {}).label || '';
    var facts = [['Profession', profLabel() || '—'], ['Moving to', destLabel()]];
    if (originLabel) facts.push(['Moving from', originLabel]);
    facts.push(['Household', hhPhrase() ? 'Moving ' + hhPhrase() : 'Moving on your own']);
    facts.push(['Where you are now', ctx && ctx.stageLabel() ? ctx.stageLabel() : 'Not yet said']);
    var groups = list.map(function (s) { return { stage: s.label, id: s.id, steps: s.items, ticks: steps(s.id).filter(function (t, i) { return S.steps[s.id + '#' + i]; }), note: (S.notes[s.id] || '').trim() }; });
    var next = nx ? { title: nx.there, note: intro(nx.id), href: '/move#s' + nx.n } : { title: 'Every stage sorted', note: 'Nothing left on the list. Come back to any stage whenever you want to.', href: '/move' };
    var saved = savedItems();
    var abs = function (h) { return /^https?:/.test(h) ? h : location.origin + h; };
    var foot = 'Ethicare Resourcing Ltd · Company No 14646354 · Office 1, One Coldbath Square, London EC1R 5HL · +44 20 4626 6580 · hello@ethicareresourcing.com';
    var standing = 'Built from the answers you gave on ' + when + '. We explain and sequence the steps — this is not immigration advice, and the decisions stay with the regulator and the immigration authority.';
    var stepHtml = function (st, isNow, word) {
      if (word) {
        var td = 'style="padding:14px 18px;border-bottom:1px solid #EBDFD3"';
        return '<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:2px"><tr><td width="6" style="background:' + (isNow ? '#02615D' : '#A6C84A') + '"></td><td ' + td + '>' +
          '<div style="font-weight:bold;color:#02615D">' + esc(st.title) + '</div><div style="margin:6px 0">' + esc(st.note) + '</div>' +
          (st.links && st.links.length ? '<div style="font-size:9.5pt">' + st.links.map(function (l) { return '<a href="' + abs(l.href) + '" style="color:' + accInk + ';font-weight:bold">' + esc(l.label) + '</a>'; }).join(' &nbsp;·&nbsp; ') + '</div>' : '') + '</td></tr></table>';
      }
      return '<div class="step' + (isNow ? ' now' : '') + '"><div class="bar"></div><div class="body"><div class="t">' + esc(st.title) + '</div><div>' + esc(st.note) + '</div>' +
        (st.links && st.links.length ? '<div class="lk">' + st.links.map(function (l) { return '<a href="' + abs(l.href) + '">' + esc(l.label) + '</a>'; }).join('') + '</div>' : '') + '</div></div>';
    };
    if (forWord) {
      /* ---- the plan as a Word document (2 Oct 2026) --------------------------------------
         Same rebuild as the page, inside Word's limits: no grid, no flexbox, so the contents
         list and the status chips are tables. The stage heading used to be 9pt uppercase —
         smaller than the card titles under it — which is why eight stages read as one run of
         boxes. page-break-inside:avoid is honoured by Word on tables. */
      var h2w = function (t) { return '<h2 style="font-family:Calibri,Arial,sans-serif;font-size:11pt;font-weight:bold;letter-spacing:.1em;text-transform:uppercase;color:#02615D;border-bottom:2px solid #A6C84A;padding-bottom:6px;margin:30px 0 14px">' + t + '</h2>'; };
      var chipW = function (id) {
        var t = S.done[id] ? 'Sorted' : (id === cur ? 'You are here' : (nx && id === nx.id ? 'Next' : ''));
        if (!t) return '';
        var bg = S.done[id] ? '#A6C84A' : (id === cur ? '#02615D' : '#E6F1ED');
        var fg = S.done[id] ? '#01312F' : (id === cur ? '#FFFFFF' : '#2F5E49');
        return '<span style="background:' + bg + ';color:' + fg + ';font-size:8pt;font-weight:bold;letter-spacing:.06em;text-transform:uppercase;padding:3px 9px">&nbsp;' + t + '&nbsp;</span>';
      };
      var out = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>" + who + "</title></head>" +
        '<body style="font-family:Calibri,Arial,sans-serif;color:#33403B;font-size:11pt;line-height:1.55;margin:0">' +
        '<table width="100%" cellpadding="0" cellspacing="0" style="background:#02615D"><tr><td style="padding:40px 40px 34px">' +
        '<div style="color:' + coverInk + ';font-size:9pt;letter-spacing:.14em;text-transform:uppercase;margin-bottom:10px">Ethicare Move &middot; Your plan</div>' +
        '<div style="width:46px;height:4px;background:#A6C84A;margin-bottom:16px;font-size:1pt">&nbsp;</div>' +
        '<h1 style="font-family:Georgia,serif;font-weight:bold;font-size:26pt;color:#fff;margin:0 0 10px;line-height:1.1">' + who + '</h1>' +
        '<div style="color:' + coverInk + ';font-size:11pt">Prepared ' + when + ' &middot; ethicareresourcing.com/move</div></td></tr></table>' +
        '<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:26px"><tr><td style="padding:0 40px 40px">';

      /* at a glance — two columns of label/value cards rather than five stacked rows */
      out += h2w('At a glance') + '<table width="100%" cellpadding="0" cellspacing="0">';
      for (var fi = 0; fi < facts.length; fi += 2) {
        out += '<tr>';
        for (var fj = fi; fj < Math.min(fi + 2, facts.length); fj++) {
          out += '<td width="50%" valign="top" style="padding:0 8px 10px 0">' +
            '<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E6DED3"><tr><td style="padding:12px 16px">' +
            '<div style="color:' + accInk + ';font-size:8.5pt;font-weight:bold;letter-spacing:.09em;text-transform:uppercase;margin-bottom:3px">' + esc(facts[fj][0]) + '</div>' +
            '<div style="color:#02615D;font-weight:bold;font-size:11.5pt">' + esc(facts[fj][1]) + '</div>' +
            '</td></tr></table></td>';
        }
        if (fi + 1 >= facts.length) out += '<td width="50%">&nbsp;</td>';
        out += '</tr>';
      }
      out += '</table>';

      /* contents, so the whole move is legible before any of the detail */
      out += h2w('Your stages') + '<table width="100%" cellpadding="0" cellspacing="0">';
      groups.forEach(function (g) {
        var bits = [];
        if (g.ticks.length) bits.push(g.ticks.length + (g.ticks.length === 1 ? ' step ticked' : ' steps ticked'));
        if (g.note) bits.push('your notes');
        out += '<tr><td style="padding:9px 0;border-bottom:1px solid #E6DED3;color:#02615D;font-weight:bold">' + esc(g.stage) + '</td>' +
          '<td align="right" style="padding:9px 0;border-bottom:1px solid #E6DED3;color:#6B7873;font-size:9.5pt">' + (bits.length ? esc(bits.join(' · ')) + '&nbsp;&nbsp;' : '') + chipW(g.id) + '</td></tr>';
      });
      out += '</table>';

      out += h2w('Your journey');
      groups.forEach(function (g) {
        out += '<table width="100%" cellpadding="0" cellspacing="0" style="page-break-inside:avoid;margin-top:22px"><tr><td>' +
          '<div style="margin:0 0 3px"><span style="font-family:Calibri,Arial,sans-serif;font-size:15pt;font-weight:bold;color:#02615D">' + esc(g.stage) + '</span>&nbsp;&nbsp;' + chipW(g.id) + '</div>' +
          '<div style="color:#5C6B65;font-size:10pt;margin:0 0 12px">' + esc(intro(g.id)) + '</div></td></tr></table>';
        g.steps.forEach(function (st) { out += stepHtml(st, g.id === cur, true); });
        if (g.ticks.length) {
          out += '<div style="margin:10px 0 2px;color:' + accInk + ';font-size:8.5pt;font-weight:bold;letter-spacing:.09em;text-transform:uppercase">Ticked off</div>';
          out += '<table width="100%" cellpadding="0" cellspacing="0">' + g.ticks.map(function (t) {
            return '<tr><td width="20" valign="top" style="padding:2px 0;color:#2F5E49;font-weight:bold">&#10003;</td><td style="padding:2px 0;font-size:10.5pt;color:#4A5853">' + esc(t) + '</td></tr>';
          }).join('') + '</table>';
        }
        if (g.note) out += '<table width="100%" cellpadding="0" cellspacing="0" style="margin:10px 0 2px;page-break-inside:avoid"><tr><td width="4" style="background:#C9DED3;font-size:1pt">&nbsp;</td><td style="background:#F2F6F3;padding:13px 18px">' +
          '<div style="color:' + accInk + ';font-size:8.5pt;font-weight:bold;letter-spacing:.09em;text-transform:uppercase;margin-bottom:4px">Your notes</div>' +
          '<div style="font-size:10.5pt;color:#3E4B47">' + esc(g.note) + '</div></td></tr></table>';
      });

      if (saved.length) { out += h2w('Pages you saved') + '<table width="100%" cellpadding="0" cellspacing="0">'; saved.forEach(function (it) { out += '<tr><td style="padding:12px 16px;border-bottom:1px solid #E6DED3"><a href="' + abs(it.u) + '" style="color:#02615D;font-weight:bold;text-decoration:none">' + esc(it.t) + '</a></td></tr>'; }); out += '</table>'; }

      out += h2w('What next?') + '<table width="100%" cellpadding="0" cellspacing="0" style="page-break-inside:avoid"><tr><td style="background:#02615D;padding:22px 26px">' +
        '<div style="color:' + coverInk + ';font-size:8.5pt;font-weight:bold;letter-spacing:.09em;text-transform:uppercase">Your next step</div>' +
        '<div style="font-weight:bold;color:#fff;font-size:14pt;margin:7px 0 5px">' + esc(next.title) + '</div>' +
        '<div style="color:#E6F1ED;font-size:10.5pt">' + esc(next.note) + '</div>' +
        '<div style="margin-top:10px;font-size:9.5pt"><a href="' + abs(next.href) + '" style="color:' + coverInk + ';font-weight:bold">' + location.origin + next.href + '</a></div></td></tr></table>';
      out += '<div style="margin-top:30px;padding-top:16px;border-top:1px solid #E6DED3;color:#6B7873;font-size:9.5pt">' + esc(standing) + '</div><div style="margin-top:8px;color:#6B7873;font-size:9.5pt">' + esc(foot) + '</div></td></tr></table></body></html>';
      return out;
    }

    /* ---- the plan as a page (2 Oct 2026) -------------------------------------------------
       It was one long column of identical cards with 10px stage headings, so eight distinct
       stages read as forty interchangeable boxes. Now: a contents list with where you are up
       to, proper stage headings with a status, and each stage's own opening line. */
    var statusOf = function (id) { return S.done[id] ? 'Sorted' : (id === cur ? 'You are here' : (nx && id === nx.id ? 'Next' : '')); };
    var pill = function (id) { var t = statusOf(id); if (!t) return '';
      var k = S.done[id] ? 'done' : (id === cur ? 'now' : 'next');
      return '<span class="pill ' + k + '">' + t + '</span>'; };

    var o2 = '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + who + '</title>' +
      '<style>*{box-sizing:border-box}' +
      'body{margin:0;background:#FCFBF8;color:#33403B;font-family:Manrope,system-ui,sans-serif;line-height:1.6;font-size:16px}' +
      '.wrap{max-width:820px;margin:0 auto;padding:clamp(30px,4vw,54px) clamp(20px,4vw,34px) 64px}' +
      'section{margin-bottom:clamp(34px,4.4vw,52px)}' +
      'h2{font-family:"Work Sans",sans-serif;color:#02615D;font-size:13px;font-weight:700;letter-spacing:.11em;text-transform:uppercase;margin:0 0 16px;padding-bottom:10px;border-bottom:2px solid #A6C84A}' +
      /* cover */
      '.cover{background:#02615D;color:#fff;padding:clamp(38px,6vw,70px) clamp(24px,5vw,58px) clamp(34px,5vw,58px)}' +
      '.cover .in{max-width:820px;margin:0 auto}' +
      '.cover .eb{color:' + coverInk + ';font-family:"Work Sans",sans-serif;font-size:11.5px;font-weight:700;letter-spacing:.15em;text-transform:uppercase}' +
      '.cover .rule{width:48px;height:4px;background:#A6C84A;border-radius:2px;margin:14px 0 20px}' +
      '.cover h1{font-family:Georgia,"Times New Roman",serif;font-weight:600;font-size:clamp(30px,4.6vw,46px);line-height:1.08;margin:0 0 14px;letter-spacing:-.01em}' +
      '.cover .meta{color:' + coverInk + ';font-size:14.5px;letter-spacing:.01em}' +
      /* at a glance, as a grid rather than five stacked rows */
      '.facts{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(230px,100%),1fr));gap:10px}' +
      '.facts div{background:#fff;border:1px solid #E6DED3;border-radius:11px;padding:15px 18px}' +
      '.facts dt{font-family:"Work Sans",sans-serif;font-size:10.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:' + accInk + ';margin:0 0 5px}' +
      '.facts dd{margin:0;color:#02615D;font-weight:600;font-size:15.5px;line-height:1.35}' +
      /* contents */
      '.toc{border-top:1px solid #E6DED3}' +
      '.toc div{display:flex;align-items:baseline;gap:14px;padding:11px 2px;border-bottom:1px solid #E6DED3}' +
      '.toc .n{flex:1 1 auto;font-family:"Work Sans",sans-serif;font-weight:600;color:#02615D;font-size:15.5px}' +
      '.toc .d{flex:none;color:#6B7873;font-size:13.5px}' +
      '.pill{flex:none;font-family:"Work Sans",sans-serif;font-size:10.5px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;border-radius:999px;padding:4px 11px;white-space:nowrap}' +
      '.pill.done{background:#A6C84A;color:#01312F}.pill.now{background:#02615D;color:#fff}.pill.next{background:#E6F1ED;color:#2F5E49}' +
      /* a stage */
      '.sgroup{margin-bottom:clamp(26px,3.2vw,38px);break-inside:avoid;page-break-inside:avoid}' +
      '.shead{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin:0 0 4px}' +
      '.shead h3{font-family:"Work Sans",sans-serif;font-size:21px;font-weight:600;color:#02615D;margin:0;line-height:1.2}' +
      '.sintro{color:#5C6B65;font-size:14.5px;line-height:1.55;margin:0 0 14px;max-width:62ch}' +
      '.step{background:#fff;border:1px solid #E6DED3;border-left:3px solid #A6C84A;border-radius:10px;padding:15px 18px;margin-bottom:9px;break-inside:avoid;page-break-inside:avoid}' +
      '.step.now{border-left-color:#02615D}' +
      '.step .t{font-family:"Work Sans",sans-serif;font-weight:600;color:#02615D;margin-bottom:5px;font-size:15.5px}' +
      '.step p{margin:0;font-size:14.5px;line-height:1.6;color:#4A5853}' +
      '.step .lk{margin-top:9px;display:flex;flex-wrap:wrap;gap:4px 16px;font-size:13.5px}' +
      '.step .lk a{color:' + accInk + ';font-weight:600;text-decoration:underline;text-underline-offset:3px}' +
      /* what the reader did */
      '.ticked{margin:12px 0 0;padding:0;list-style:none}' +
      '.ticked li{position:relative;padding:3px 0 3px 26px;font-size:14px;color:#4A5853}' +
      '.ticked li::before{content:"";position:absolute;left:4px;top:9px;width:11px;height:6px;border-left:2.5px solid #2F5E49;border-bottom:2.5px solid #2F5E49;transform:rotate(-45deg)}' +
      '.ticked .h{font-family:"Work Sans",sans-serif;font-size:10.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:' + accInk + ';padding:0;margin-bottom:2px}' +
      '.ticked .h::before{display:none}' +
      '.ownnote{margin:12px 0 0;background:#F2F6F3;border-left:3px solid #C9DED3;border-radius:0 10px 10px 0;padding:13px 18px;font-size:14.5px;line-height:1.6;white-space:pre-wrap;color:#3E4B47}' +
      '.ownnote .t{font-family:"Work Sans",sans-serif;font-size:10.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:' + accInk + ';margin-bottom:5px}' +
      /* saved pages, next step, footer */
      '.glist{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(230px,100%),1fr));gap:10px}' +
      '.glist a{display:block;background:#fff;border:1px solid #E6DED3;border-radius:10px;padding:13px 16px;color:#02615D;font-weight:600;text-decoration:none;font-size:14.5px}' +
      '.next{background:#02615D;color:#fff;border-radius:14px;padding:24px 28px}' +
      '.next .k{font-family:"Work Sans",sans-serif;font-size:10.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:' + coverInk + '}' +
      '.next .t{font-family:"Work Sans",sans-serif;font-weight:600;font-size:20px;margin:8px 0 6px}' +
      '.next p{margin:0;font-size:15px;line-height:1.6;color:rgba(255,255,255,.92)}' +
      '.next a{display:inline-block;margin-top:12px;color:' + coverInk + ';font-weight:600;text-decoration:underline;text-underline-offset:3px}' +
      '.foot{border-top:1px solid #E6DED3;padding-top:20px;color:#6B7873;font-size:13px;line-height:1.6}.foot p{margin:0 0 8px}' +
      '.printbar{max-width:820px;margin:16px auto 0;padding:0 clamp(20px,4vw,34px);text-align:right}' +
      '.printbar button{font-family:"Work Sans",sans-serif;font-weight:600;font-size:13.5px;color:#02615D;background:#fff;border:1.5px solid rgba(2,97,93,.35);border-radius:9px;padding:11px 18px;min-height:44px;cursor:pointer}' +
      '.printbar button:hover{border-color:#02615D}' +
      '@media print{@page{margin:14mm}.printbar{display:none}body{background:#fff;font-size:11pt}' +
      '.cover{padding:24mm 0 14mm}.step,.glist a{border-color:#ddd}.next{background:#F2F6F3;color:#33403B}' +
      '.next .k,.next a{color:#2F5E49}.next .t{color:#02615D}.next p{color:#4A5853}}' +
      '</style></head><body>' +
      '<div class="cover"><div class="in"><div class="eb">Ethicare Move &middot; Your plan</div><div class="rule"></div>' +
      '<h1>' + who + '</h1><div class="meta">Prepared ' + when + ' &middot; ethicareresourcing.com/move</div></div></div>' +
      '<div class="printbar"><button type="button" onclick="print()">Print or save as PDF</button></div>' +
      '<div class="wrap"><section><h2>At a glance</h2><dl class="facts">';
    facts.forEach(function (f) { o2 += '<div><dt>' + esc(f[0]) + '</dt><dd>' + esc(f[1]) + '</dd></div>'; });
    o2 += '</dl></section>';

    /* a contents list, so the whole move is legible before any of the detail */
    o2 += '<section><h2>Your stages</h2><div class="toc">';
    groups.forEach(function (g) {
      var bits = [];
      if (g.ticks.length) bits.push(g.ticks.length + (g.ticks.length === 1 ? ' step ticked' : ' steps ticked'));
      if (g.note) bits.push('your notes');
      o2 += '<div><span class="n">' + esc(g.stage) + '</span>' +
            (bits.length ? '<span class="d">' + bits.map(esc).join(' &middot; ') + '</span>' : '') +
            pill(g.id) + '</div>';
    });
    o2 += '</div></section>';

    o2 += '<section><h2>Your journey</h2>';
    groups.forEach(function (g) {
      o2 += '<div class="sgroup"><div class="shead"><h3>' + esc(g.stage) + '</h3>' + pill(g.id) + '</div>' +
            '<p class="sintro">' + esc(intro(g.id)) + '</p>';
      g.steps.forEach(function (st) { o2 += stepHtml(st, g.id === cur, false); });
      if (g.ticks.length) o2 += '<ul class="ticked"><li class="h">Ticked off</li>' + g.ticks.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>';
      if (g.note) o2 += '<div class="ownnote"><div class="t">Your notes</div>' + esc(g.note) + '</div>';
      o2 += '</div>';
    });
    o2 += '</section>';
    if (saved.length) { o2 += '<section><h2>Pages you saved</h2><div class="glist">'; saved.forEach(function (it) { o2 += '<a href="' + abs(it.u) + '">' + esc(it.t) + '</a>'; }); o2 += '</div></section>'; }
    o2 += '<section><h2>What next?</h2><div class="next"><div class="k">Your next step</div><div class="t">' + esc(next.title) + '</div><p>' + esc(next.note) + '</p>' +
      '<a href="' + abs(next.href) + '">Open this stage &rarr;</a></div></section>' +
      '<div class="foot"><p>' + esc(standing) + '</p><p>' + esc(foot) + '</p></div></div></body></html>';
    return o2;
  }

  /* ---------------- wiring ---------------- */
  function scrollToStage(id) {
    var el = $('[data-stage="' + id + '"]'); if (!el) return;
    var y = el.getBoundingClientRect().top + window.scrollY - 90;
    try { window.scrollTo({ top: y, behavior: 'smooth' }); } catch (e) { window.scrollTo(0, y); }
  }
  function route() {
    var h = location.hash, m = /^#s([1-8])$/.exec(h);
    if (m) { var s = stageByN(+m[1]); if (s) { open = s.id; paint(); scrollToStage(s.id); } return; }
    if (h === '#setup' || h === '#welcome' || h === '#doing') { var st = $('#ctx-strip .ecx-btn'); if (st && st.getAttribute('aria-expanded') !== 'true') st.click(); window.scrollTo(0, 0); }
  }
  /* What the next step depends on. Change the profession and this does not move, so the
     page does not jump for an answer that did not change what comes next. */
  function nextKey() {
    if (!ctx) return '';
    return (ctx.stage ? ctx.stage() : '') + '|' + (ctx.dest ? ctx.dest() : '');
  }

  /* Close the answers panel and move to the next step, so answering the question produces
     a visible result rather than a silent one further down the page. */
  function revealNextStep() {
    var card = $('[data-next]');
    if (!card || card.hidden) return;
    var btn = $('#ctx-strip .ecx-btn');
    if (btn && btn.getAttribute('aria-expanded') === 'true') btn.click();
    var reduced = document.documentElement.getAttribute('data-rp-motion') === 'off';
    try {
      card.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
    } catch (e) { card.scrollIntoView(); }
    /* a brief outline, so it is obvious which thing just answered you */
    card.classList.remove('is-new');
    void card.offsetWidth;                       /* restart the animation on a repeat */
    card.classList.add('is-new');
    setTimeout(function () { card.classList.remove('is-new'); }, 2200);
    /* say it for a screen reader too: scrolling tells a sighted person, nothing else does */
    var say = document.getElementById('pt-live');
    if (say) {
      var h = card.querySelector('h2');
      say.textContent = 'Your next step: ' + (h ? h.textContent : 'updated') + '.';
    }
  }

  /* ---- the walk-through video (2 Oct 2026) ------------------------------------------------
     Click to load: the still is ours, and nothing at all is fetched from YouTube or Vimeo —
     no request, no cookie — until someone presses play. The section stays hidden until a URL
     is set on it in move.html, so an empty player is never published. */
  function videoEmbed(src) {
    var m;
    if ((m = /(?:youtube\.com\/.*[?&]v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{6,})/.exec(src)))
      return 'https://www.youtube-nocookie.com/embed/' + m[1] + '?autoplay=1&rel=0&modestbranding=1';
    if ((m = /vimeo\.com\/(?:video\/)?(\d+)/.exec(src)))
      return 'https://player.vimeo.com/video/' + m[1] + '?autoplay=1&dnt=1';
    return null;
  }
  function mountVideo() {
    var sec = $('[data-video]'); if (!sec) return;
    var src = String(sec.getAttribute('data-video-src') || '').trim();
    if (!src) { sec.hidden = true; return; }
    var frame = $('[data-video-frame]', sec); if (!frame) return;
    var poster = sec.getAttribute('data-video-poster') || '';
    sec.hidden = false;
    frame.innerHTML = (poster ? '<img src="' + esc(poster) + '" alt="" width="1400" height="788" loading="lazy" decoding="async">' : '') +
      '<button type="button" class="pv-play" data-video-play aria-label="Play the Ethicare Move walk-through"><span aria-hidden="true">' +
      '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.2v13.6a1 1 0 0 0 1.53.85l10.7-6.8a1 1 0 0 0 0-1.7L9.53 4.35A1 1 0 0 0 8 5.2z"/></svg></span></button>';
    frame.addEventListener('click', function (e) {
      if (!(e.target.closest && e.target.closest('[data-video-play]'))) return;
      var em = videoEmbed(src);
      frame.innerHTML = em
        ? '<iframe src="' + esc(em) + '" title="Ethicare Move walk-through" allow="accelerometer; autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>'
        : '<video controls autoplay playsinline preload="metadata"' + (poster ? ' poster="' + esc(poster) + '"' : '') + ' src="' + esc(src) + '"></video>';
      if (window.track) window.track('move_video_play', {});
    });
  }

  function init() {
    load();
    mountVideo();
    importFromLink();
    load();
    if (ctx && ctx.mount) {
      /* My Move (pack/pack.js) reuses this file inside a candidate's private space, where the
         answers ARE saved with us — so the page it sits in can supply its own intro line. */
      var strip = ctx.mount('#ctx-strip', { intro: document.body.getAttribute('data-strip-intro') || 'Tell us a little about your move to make this plan your own.' });
      /* a first visit: open the answers so the page starts by asking, not by lecturing */
      if (!(ctx.has())) { var b = $('#ctx-strip .ecx-btn'); if (b) b.click(); }
      /* Answer a question and nothing visibly happens: the next-step card updates, but it
         is below the fold, so the person sits looking at a form waiting for it to respond.
         (Sophie, 1 Oct 2026.) So when an answer changes what the next step IS, close the
         answers back to their one-line summary and bring the card to them.
         Only on a real change — repainting on every keystroke would yank the page about —
         and never on the first paint, which is the person arriving, not answering. */
      /* Seeded from what we already hold, NOT from the first change: ctx.onChange only fires
         when someone answers, so a "skip the first one" guard swallows the very answer this
         exists for. Caught by testing a single selection on a fresh page. */
      var lastNext = nextKey();
      ctx.onChange(function () {
        load(); open = null; paint();
        var now = nextKey();
        if (now === lastNext) return;      /* profession changed, say: the next step is the same */
        lastNext = now;
        revealNextStep();
      });
    }
    paint();
    window.addEventListener('hashchange', route);
    route();

    document.addEventListener('click', function (e) {
      var t = e.target.closest ? e.target.closest('[data-start],[data-editanswers],[data-go],[data-step],[data-done],[data-here],[data-work],[data-band],[data-doc],[data-getlink],[data-linkcopy],[data-clear]') : null;
      if (!t) return;
      /* choosing a stage. From the rail or the chips the panel is already in view, so the page
         stays put; from the next-step card above it, or a prev/next button, it moves. */
      if (t.hasAttribute('data-go')) {
        var id = t.getAttribute('data-go');
        var jump = t.hasAttribute('data-scroll') || t.classList.contains('pt-pg');
        open = id; paint();
        var panel = $('.pt-panel');
        if (jump) scrollToStage(id);
        else if (panel) { try { panel.focus({ preventScroll: true }); } catch (e2) {} }
        if (window.track) window.track('move_stage_open', { stage: id });
        return;
      }
      /* a step tick. Updated in place rather than repainted: a full repaint would throw away
         whatever is half-typed in the notes box two sections down. */
      if (t.hasAttribute('data-start')) {
        load(); S.started = true; save(); paint();
        if (window.track) window.track('move_started', {});
        return;
      }
      if (t.hasAttribute('data-editanswers')) {
        var eb = $('#ctx-strip .ecx-btn');
        if (eb && eb.getAttribute('aria-expanded') !== 'true') eb.click();
        var strip = $('#ctx-strip'); if (strip) strip.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      if (t.hasAttribute('data-step')) {
        var sk = t.getAttribute('data-step');
        load(); if (S.steps[sk]) delete S.steps[sk]; else S.steps[sk] = true; save();
        var onNow = !!S.steps[sk];
        t.classList.toggle('on', onNow);
        t.setAttribute('aria-pressed', onNow ? 'true' : 'false');
        return;
      }
      if (t.hasAttribute('data-done')) { var d = t.getAttribute('data-done'); load(); if (S.done[d]) delete S.done[d]; else S.done[d] = true; save(); if (window.track) window.track('move_stage_done', { stage: d, done: !!S.done[d] }); open = d; paint(); return; }
      if (t.hasAttribute('data-here')) { if (ctx && ctx.write) ctx.write({ stage: t.getAttribute('data-here') }); open = null; return; }
      if (t.hasAttribute('data-work')) { load(); S.hh.work = t.getAttribute('data-work'); save(); paint(); return; }
      if (t.hasAttribute('data-band')) { load(); var v = t.getAttribute('data-band'), i = S.hh.bands.indexOf(v); if (i > -1) S.hh.bands.splice(i, 1); else S.hh.bands.push(v); save(); paint(); return; }
      if (t.hasAttribute('data-doc')) {
        var mode = t.getAttribute('data-doc');
        if (mode === 'view') { var w = window.open('', '_blank'); if (w) { w.document.open(); w.document.write(docHTML(false)); w.document.close(); } }
        else { var blob = new Blob([docHTML(true)], { type: 'application/msword' }); var url = URL.createObjectURL(blob); var a = document.createElement('a'); a.href = url; a.download = 'Ethicare-Move-Plan.doc'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 4000); }
        if (window.track) window.track('move_doc_generated', { mode: mode });
        return;
      }
      if (t.hasAttribute('data-getlink')) { load(); var link = planLink(); var box = $('[data-linkbox]'), outEl = $('[data-linkout]'); if (box && outEl) { outEl.value = link; box.hidden = false; outEl.select(); } return; }
      if (t.hasAttribute('data-linkcopy')) { var o = $('[data-linkout]'), done = $('[data-linkcopied]'); if (o) { o.select(); try { navigator.clipboard.writeText(o.value); if (done) done.textContent = 'Copied'; } catch (er) { try { document.execCommand('copy'); if (done) done.textContent = 'Copied'; } catch (e2) {} } } return; }
      if (t.hasAttribute('data-clear')) { if (!window.confirm('Clear your plan from this device? Your answers and the stages you have ticked off will go; saved pages stay.')) return; if (ctx && ctx.clear) ctx.clear(); else { try { localStorage.removeItem(KEY); } catch (e) {} } load(); open = null; paint(); window.scrollTo(0, 0); return; }
    });

    /* The one place the page asks for a name (2 Oct 2026). Nothing else on Move asked, so the
       document said "Your plan" to everybody and the send form never prefilled. Asked here,
       beside the document it actually appears on, and optional. */
    /* Delegated, because the welcome panel repaints and the "Keep this plan" box does not.
       Typing never repaints: it would take the caret with it. The greeting is updated in
       place instead. */
    $$('[data-plan-first]').forEach(function (el) { el.value = S.first || ''; });
    document.addEventListener('input', function (e) {
      var el = e.target;
      if (!el || !el.hasAttribute || !el.hasAttribute('data-plan-first')) return;
      load(); S.first = el.value.trim().slice(0, 40); save();
      $$('[data-plan-first]').forEach(function (o) { if (o !== el) o.value = S.first; });
      var h = $('.pt-welcome h2');
      if (h) h.textContent = (dest() === 'nz' ? 'Kia ora' : 'Hello') + (S.first ? ', ' + S.first : '') + '.';
    });

    /* Notes: saved as they are typed, never repainted. A repaint on input would move the
       caret and lose the selection, so this writes straight to the store and stops there. */
    document.addEventListener('input', function (e) {
      var ta = e.target;
      if (!ta || !ta.getAttribute || !ta.hasAttribute('data-note')) return;
      var id = ta.getAttribute('data-note');
      load(); S.notes[id] = ta.value; save();
    });
    /* the send-my-plan summary is written at submit time from the same store — see move.html */
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
