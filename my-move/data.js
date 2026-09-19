/* My Move — static reference data: the guide catalogue, labels and phases.
   Guide URLs are real site paths (checked against _redirects / guides/), so
   "My guides" links resolve on the live site. Sets window.MMD. */
window.MMD = (function () {
  var guides = {
    'reg-au':    { title: 'Registering to practise in Australia', url: '/guides/australia-registration', topic: 'Registration', dest: 'Australia' },
    'reg-nz':    { title: 'Registering to practise in New Zealand', url: '/guides/new-zealand-registration', topic: 'Registration', dest: 'New Zealand' },
    'visa-au':   { title: 'Australian visas for health professionals', url: '/guides/australia-visa', topic: 'Visa', dest: 'Australia' },
    'visa-nz':   { title: 'New Zealand visas for health professionals', url: '/guides/new-zealand-visa', topic: 'Visa', dest: 'New Zealand' },
    'money-au':  { title: 'Money, tax & banking in Australia', url: '/guides/australia-money', topic: 'Money', dest: 'Australia' },
    'money-nz':  { title: 'Money, tax & banking in New Zealand', url: '/guides/money-tax-and-banking', topic: 'Money', dest: 'New Zealand' },
    'rent-au':   { title: 'Renting in Australia', url: '/guides/australia-renting', topic: 'Home', dest: 'Australia' },
    'rent-nz':   { title: 'Renting in New Zealand', url: '/guides/renting-in-new-zealand', topic: 'Home', dest: 'New Zealand' },
    'drive-au':  { title: 'Driving & licences in Australia', url: '/guides/australia-driving', topic: 'Everyday', dest: 'Australia' },
    'drive-nz':  { title: 'Driving & licences in New Zealand', url: '/guides/driving-and-licences', topic: 'Everyday', dest: 'New Zealand' },
    'pets-au':   { title: 'Bringing pets to Australia', url: '/guides/australia-pets', topic: 'Packing', dest: 'Australia' },
    'pack-nz':   { title: 'Bringing pets & belongings', url: '/guides/nz/bringing-pets-and-belongings', topic: 'Packing', dest: 'New Zealand' },
    'first-nz':  { title: 'Your first month in New Zealand', url: '/guides/new-zealand-first-month', topic: 'Settling in', dest: 'New Zealand' },
    'reloc-au':  { title: 'Relocating to Australia', url: '/guides/australia-relocation', topic: 'Settling in', dest: 'Australia' },
    'school-au': { title: 'Schools & education in Australia', url: '/guides/australia-education', topic: 'Family', dest: 'Australia' },
    'school-nz': { title: 'Schools & education in New Zealand', url: '/guides/new-zealand-education', topic: 'Family', dest: 'New Zealand' },
    'health-au': { title: 'How healthcare works in Australia', url: '/guides/australia-healthcare', topic: 'Everyday', dest: 'Australia' },
    'health-nz': { title: 'How the health system works in New Zealand', url: '/guides/new-zealand-healthcare', topic: 'Everyday', dest: 'New Zealand' },
    'bunbury':   { title: 'Living in Bunbury, WA', url: '/destinations/bunbury-australia', topic: 'Destination', dest: 'Australia' },
    'perth':     { title: 'Living in Perth', url: '/destinations/perth-australia', topic: 'Destination', dest: 'Australia' },
    'welly':     { title: 'Living in Wellington', url: '/destinations/wellington-new-zealand', topic: 'Destination', dest: 'New Zealand' },
    'auckland':  { title: 'Living in Auckland', url: '/destinations/auckland-new-zealand', topic: 'Destination', dest: 'New Zealand' },
    'chch':      { title: 'Living in Christchurch', url: '/destinations/christchurch-new-zealand', topic: 'Destination', dest: 'New Zealand' }
  };

  var STATUS = { not_started: 'Not started', in_progress: 'In progress', waiting: 'Waiting', complete: 'Complete', na: 'Not applicable' };
  var STATUS_CLASS = { not_started: 'todo', in_progress: 'doing', waiting: 'waiting', complete: 'done', na: 'na' };
  var OWNER = { you: 'You', ethicare: 'Ethicare', employer: 'Employer', regulator: 'Regulator' };
  var OWNER_CLASS = { you: '', ethicare: 'eth', employer: 'emp', regulator: 'reg' };
  var ARR_STATE = { planned: 'Planned', booked: 'Booked', awaiting: 'Awaiting confirmation' };
  var ARR_CLASS = { planned: 'todo', booked: 'done', awaiting: 'waiting' };
  var ARR_TYPES = { flight: 'Flight', accommodation: 'Accommodation', car: 'Car / transport', shipping: 'Shipping', other: 'Other' };
  var PHASES = [
    { id: 'registration', label: 'Registration & visa steps' },
    { id: 'travel', label: 'Preparing to travel' },
    { id: 'settle', label: 'Arrival & settling in' }
  ];

  var DEFAULT_WELCOME = 'Welcome to your My Move space. We’ll use this to prepare for your new role and keep track of the practical arrangements. You can see your next steps, find the guides selected for you and add updates as plans take shape. Some details may still be awaiting confirmation, and we’ll add them as they become available.';

  function emptyDraft() {
    return {
      role: { profession: '', jobTitle: '', employer: 'To be confirmed', destination: '', region: '', startDate: null, relocationSupport: 'To be confirmed', workingPattern: 'To be confirmed' },
      welcome: DEFAULT_WELCOME,
      nextActions: [], tasks: [], guides: []
    };
  }
  /* Old or partial drafts still render: every key gets a default. */
  function normaliseDraft(d) {
    var base = emptyDraft();
    d = d || {};
    return {
      role: Object.assign(base.role, d.role || {}),
      welcome: typeof d.welcome === 'string' ? d.welcome : base.welcome,
      nextActions: Array.isArray(d.nextActions) ? d.nextActions : [],
      tasks: Array.isArray(d.tasks) ? d.tasks : [],
      guides: Array.isArray(d.guides) ? d.guides : [],
      publishedAt: d.publishedAt || null
    };
  }

  var uid = function (p) { return (p || 'x') + '-' + Math.random().toString(36).slice(2, 10); };

  /* Draft privacy wording (from PRIVACY.md, corrected so the storage promise matches the
     providers actually used). Ethicare confirms the provider list before launch and mirrors
     this on /how-we-use-your-information. */
  var PRIVACY = 'When you accept an Ethicare-supported role we create a private space to help you prepare for the move. We hold your name and email, the details of your role and destination, the tasks and arrangements for your move, and the notes you and your Ethicare contact add here. We use this only to support your relocation. Our database and sign-in service are hosted in London (UK); our website host and email provider may process delivery records and logs outside the UK/EU — see our privacy policy for the providers we use. Your shared notes are visible to you and the Ethicare staff supporting your move. We keep your space while we are working with you and for a limited period afterwards, then delete it. You can ask to see, correct, export or delete your information at any time. This space is not for sensitive medical, financial or identity documents.';

  return { guides: guides, STATUS: STATUS, STATUS_CLASS: STATUS_CLASS, OWNER: OWNER, OWNER_CLASS: OWNER_CLASS, ARR_STATE: ARR_STATE, ARR_CLASS: ARR_CLASS, ARR_TYPES: ARR_TYPES, PHASES: PHASES, DEFAULT_WELCOME: DEFAULT_WELCOME, emptyDraft: emptyDraft, normaliseDraft: normaliseDraft, uid: uid, PRIVACY: PRIVACY };
})();
