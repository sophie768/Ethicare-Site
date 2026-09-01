/* Build Your CV — Ethicare Resourcing.
   Everything runs on the device: state lives in localStorage, the Word file is
   built in the browser (docx-export.js), and nothing is sent anywhere. */
(function () {
  var KEY = 'ethicare-cv-builder-v1';

  /* Only professions Ethicare actually recruits (scope change, Aug 2026).
     Nursing, midwifery, pharmacy and SLT were removed: offering a tailored CV
     for a profession we cannot place is the lead-capture problem in another
     form. Anyone outside this list is pointed at /resources/healthcare-regulators. */
  var PROFESSIONS = [
    { value: 'radiography', label: 'Medical imaging, radiography & nuclear medicine' },
    { value: 'sonography', label: 'Sonography' },
    { value: 'radiation', label: 'Radiation therapy' },
    { value: 'medicine', label: 'Medicine \u2014 radiology or general practice' },
    { value: 'anaesthetics', label: 'Anaesthetic technology / theatre' },
    { value: 'psychology', label: 'Psychology' },
    { value: 'physio', label: 'Physiotherapy' },
    { value: 'ot', label: 'Occupational therapy' }
  ];

  var GROUPS = {
    radiography: ['General radiography', 'CT', 'CT special procedures', 'Fluoroscopy', 'Mobile and theatre', 'MRI'],
    sonography: ['Obstetric', 'Gynaecological', 'Abdominal', 'Musculoskeletal', 'Vascular', 'Paediatric'],
    radiation: ['Planning', 'Treatment delivery', 'Site groups', 'Brachytherapy', 'Quality assurance'],
    nursing: ['Clinical skills', 'Patient groups', 'Emergency and deteriorating patients', 'Medicines management', 'Teaching and supervision'],
    midwifery: ['Antenatal', 'Labour and birth', 'Postnatal', 'Neonatal', 'Complex and high risk'],
    medicine: ['Clinical presentations', 'Procedures', 'Acute and on call', 'Outpatients', 'Teaching and supervision'],
    anaesthetics: ['Anaesthetic techniques', 'Regional', 'Airway management', 'Case mix', 'Critical care and pain'],
    psychology: ['Assessment', 'Therapeutic models', 'Client groups', 'Risk and safeguarding', 'Consultation and supervision'],
    physio: ['Musculoskeletal', 'Neurological', 'Respiratory', 'Rehabilitation settings', 'Assessment and outcome measures'],
    ot: ['Assessment', 'Interventions', 'Client groups', 'Equipment and adaptations', 'Discharge planning'],
    pharmacy: ['Clinical pharmacy', 'Specialty areas', 'Medicines governance', 'Dispensing and aseptic', 'Counselling and education'],
    slt: ['Assessment', 'Dysphagia', 'Communication', 'Client groups', 'Settings'],
    other: ['Assessment', 'Interventions', 'Patient groups', 'Settings', 'Teaching and supervision']
  };

  var EQUIP = {
    radiography: { title: 'Equipment used', lead: 'Manufacturer and model, not the category. Siemens Somatom Definition AS, not CT scanner. Name the information systems too — the RIS, the PACS, the reporting system.' },
    sonography: { title: 'Equipment and systems used', lead: 'Manufacturer and model, plus the reporting and image systems you have worked on.' },
    radiation: { title: 'Equipment and systems used', lead: 'Linacs, planning systems and record-and-verify by name and version where you know it.' },
    nursing: { title: 'Systems and equipment used', lead: 'Clinical systems and equipment by name — the electronic record, the observation and escalation system, the pumps and monitors you are signed off on.' },
    midwifery: { title: 'Systems and equipment used', lead: 'Clinical systems and equipment by name — the maternity record, the monitoring you use, the equipment you are signed off on.' },
    medicine: { title: 'Systems and procedures', lead: 'Clinical systems by name, and the procedures you are independently signed off to perform.' },
    anaesthetics: { title: 'Equipment and systems used', lead: 'Anaesthetic machines, airway and monitoring equipment, and the record systems.' },
    psychology: { title: 'Assessments and systems used', lead: 'Named assessment tools and outcome measures, plus the clinical record system.' },
    physio: { title: 'Equipment and systems used', lead: 'Equipment, outcome measures and clinical systems by name.' },
    ot: { title: 'Assessments and equipment used', lead: 'Named standardised assessments, equipment you prescribe, and clinical systems.' },
    pharmacy: { title: 'Systems used', lead: 'Dispensing, prescribing and clinical systems by name.' },
    slt: { title: 'Assessments and systems used', lead: 'Named assessments and the clinical systems you have worked on.' },
    other: { title: 'Equipment and systems used', lead: 'Name the equipment, assessments and clinical systems you have worked on. Manufacturer and model, not the category.' }
  };

  var FILLER = ['excellent communication skills', 'good communication skills', 'strong communication skills', 'team player', 'works well in a team', 'work well in a team', 'team-player', 'hard working', 'hardworking', 'strong work ethic', 'passionate about', 'dedicated professional', 'highly motivated', 'self-motivated', 'self motivated', 'attention to detail', 'go the extra mile', 'goes the extra mile', 'fast-paced environment', 'fast paced environment', 'works well under pressure', 'work well under pressure', 'flexible and adaptable', 'proven track record', 'results-driven', 'can-do attitude', 'thinks outside the box', 'think outside the box', 'excellent interpersonal skills'];
  var NEEDS_EVIDENCE = ['cultural competence', 'culturally competent', 'cultural safety', 'patient advocacy', 'patient advocate', 'holistic care', 'compassionate care'];

  var FIELDS = ['jobTitle', 'name', 'email', 'mobile', 'rights', 'location', 'regLine', 'sumWho', 'sumBring', 'sumOnly', 'sumWhy', 'board', 'regNumber', 'equipment'];

  function uid() { return Math.random().toString(36).slice(2, 9); }
  function blank() {
    return {
      jobTitle: '', name: '', email: '', mobile: '', rights: '', location: '', regLine: '',
      sumWho: '', sumBring: '', sumOnly: '', sumWhy: '', board: '', regNumber: '', equipment: '',
      expertise: [{ id: uid(), group: '', items: '' }],
      soft: [{ id: uid(), skill: '', story: '' }, { id: uid(), skill: '', story: '' }, { id: uid(), skill: '', story: '' }],
      roles: [{ id: uid(), kind: 'role', title: '', org: '', loc: '', dates: '', bullets: '' }],
      edu: [{ id: uid(), qual: '', inst: '', loc: '', dates: '' }],
      cpd: [{ id: uid(), title: '', provider: '', date: '' }, { id: uid(), title: '', provider: '', date: '' }],
      refs: [{ id: uid(), name: '', role: '', org: '', rel: '', email: '' }, { id: uid(), name: '', role: '', org: '', rel: '', email: '' }]
    };
  }

  var saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { saved = {}; }
  var S = {
    f: saved.f || blank(),
    dest: saved.dest || 'nz',
    profession: saved.profession || 'radiography',
    refsMode: saved.refsMode === 'request' ? 'request' : 'now',
    open: saved.open || 's1'
  };
  /* older drafts may predate a list */
  var B = blank();
  ['expertise', 'soft', 'roles', 'edu', 'cpd', 'refs'].forEach(function (k) { if (!Array.isArray(S.f[k])) S.f[k] = B[k]; });

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
  var filled = function (v) { return !!(v && String(v).trim()); };
  var lines = function (s) { return String(s || '').split('\n').map(function (x) { return x.trim(); }).filter(Boolean); };
  var words = function (s) { return String(s || '').trim() ? String(s).trim().split(/\s+/).length : 0; };

  /* drafts written before nationality came off the CV */
  if (!filled(S.f.rights) && filled(S.f.nationality)) S.f.rights = S.f.nationality;
  delete S.f.nationality;

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify({ f: S.f, dest: S.dest, profession: S.profession, refsMode: S.refsMode, open: S.open })); } catch (e) {}
  }
  function eqKey() { return EQUIP[S.profession] ? S.profession : 'other'; }
  function country() { return S.dest === 'nz' ? 'New Zealand' : 'Australia'; }
  function summaryText() { return [S.f.sumWho, S.f.sumBring, S.f.sumOnly, S.f.sumWhy].map(function (x) { return String(x || '').trim(); }).filter(Boolean).join(' '); }
  function sameness(t) {
    var s = ' ' + String(t || '').toLowerCase() + ' ';
    return {
      filler: FILLER.filter(function (p) { return s.indexOf(p) !== -1; }),
      evidence: NEEDS_EVIDENCE.filter(function (p) { return s.indexOf(p) !== -1; })
    };
  }

  /* ---------- the section audit: ready, thin or empty. Never a score. ---------- */
  function audit() {
    var f = S.f, out = [];
    function push(n, title, state, note) { out.push({ n: n, title: title, state: state, note: note }); }

    var head = ['jobTitle', 'name', 'email', 'mobile', 'location'];
    var names = { jobTitle: 'the job title', name: 'your name', email: 'an email', mobile: 'a mobile number', location: 'where you are now' };
    var missing = head.filter(function (k) { return !filled(f[k]); });
    if (missing.length === head.length) push('01', 'The header block', 'empty', 'Nothing yet. This is the first thing anyone reads.');
    else if (missing.length) push('01', 'The header block', 'thin', 'Still missing ' + missing.map(function (k) { return names[k]; }).join(', ') + '.');
    else if (!filled(f.regLine)) push('01', 'The header block', 'thin', 'No registration line. A reader looks for this on page one and reads its absence as not started.');
    else push('01', 'The header block', 'ready', 'Complete, and the registration line is where it belongs.');

    var w = words(summaryText());
    if (!w) push('02', 'Candidate summary', 'empty', 'Empty. This is the part most likely to be read in full.');
    else if (w > 200) push('02', 'Candidate summary', 'thin', w + ' words. The limit is two hundred, and the cut usually improves it.');
    else if (w < 80) push('02', 'Candidate summary', 'thin', 'Only ' + w + ' words. Aim for 80 to 130 — there is room to say what you bring.');
    else if (!filled(f.sumWhy)) push('02', 'Candidate summary', 'thin', 'No line on why this country. Everyone reading it is wondering.');
    else if (!filled(f.sumOnly)) push('02', 'Candidate summary', 'thin', 'Nothing here yet that could only be you, which is the sentence a reader remembers.');
    else if (sameness(summaryText()).filler.length) push('02', 'Candidate summary', 'thin', 'It reads like other CVs in places — the phrases are flagged in the section.');
    else push('02', 'Candidate summary', 'ready', w + ' words, and it says something only you could say.');

    var groups = f.expertise.filter(function (r) { return filled(r.group) && filled(r.items); });
    if (!groups.length) push('03', 'Clinical expertise', 'empty', 'Empty, and this is the section shortlisting actually happens in.');
    else if (groups.length < 3) push('03', 'Clinical expertise', 'thin', (groups.length === 1 ? 'One grouping' : 'Two groupings') + '. Most people have three or four.');
    else push('03', 'Clinical expertise', 'ready', groups.length + ' groupings, each with named procedures.');

    var skills = f.soft.filter(function (r) { return filled(r.skill); });
    var unevidenced = skills.filter(function (r) { return !filled(r.story); });
    if (!skills.length) push('04', 'Soft skills', 'empty', 'None chosen yet.');
    else if (skills.length > 4) push('04', 'Soft skills', 'thin', skills.length + ' skills. Past four it reads as a list rather than a choice.');
    else if (unevidenced.length) push('04', 'Soft skills', 'thin', unevidenced.length === 1 ? 'One skill has no example under it. That is the one you will be asked about.' : unevidenced.length + ' skills have no example under them.');
    else if (skills.some(function (r) { return sameness(r.skill).filler.length; })) push('04', 'Soft skills', 'thin', 'At least one is a phrase that turns up on nearly every CV. Your own words say more.');
    else push('04', 'Soft skills', 'ready', skills.length + ', each with something behind it.');

    var roles = f.roles.filter(function (r) { return filled(r.title) || filled(r.org); });
    var thin = roles.filter(function (r) { return r.kind !== 'gap' && !lines(r.bullets).length; });
    if (!roles.length) push('05', 'Employment history', 'empty', 'No roles yet.');
    else if (roles.some(function (r) { return !filled(r.dates); })) push('05', 'Employment history', 'thin', 'A role has no dates. Missing dates read as a gap being hidden.');
    else if (thin.length) push('05', 'Employment history', 'thin', thin.length === 1 ? 'One role has a title but nothing under it.' : thin.length + ' roles have titles but nothing under them.');
    else push('05', 'Employment history', 'ready', roles.length + ' entries, all dated, each with detail under it.');

    var edu = f.edu.filter(function (r) { return filled(r.qual); });
    if (!edu.length) push('06', 'Education and registration', 'empty', 'No qualifications listed.');
    else if (!filled(f.board)) push('06', 'Education and registration', 'thin', 'No registration board named.');
    else if (!filled(f.regNumber)) push('06', 'Education and registration', 'thin', 'Board named but no registration number. Give it in full.');
    else if (edu.some(function (r) { return !filled(r.inst) || !filled(r.dates); })) push('06', 'Education and registration', 'thin', 'A qualification is missing its institution or dates.');
    else push('06', 'Education and registration', 'ready', 'Qualifications and registration both complete.');

    var cpd = f.cpd.filter(function (r) { return filled(r.title); });
    var undated = cpd.filter(function (r) { return !filled(r.date); });
    if (!cpd.length) push('07', 'Professional development', 'empty', 'Empty, which a reader takes as nothing since you qualified.');
    else if (cpd.length < 3) push('07', 'Professional development', 'thin', cpd.length === 1 ? 'One entry. Recency matters more than length, but one is thin.' : 'Two entries.');
    else if (undated.length) push('07', 'Professional development', 'thin', undated.length + (undated.length === 1 ? ' entry has no date. Undated training is assumed old.' : ' entries have no dates. Undated training is assumed old.'));
    else push('07', 'Professional development', 'ready', cpd.length + ' entries, all dated.');

    var eq = lines(f.equipment);
    var eqt = EQUIP[eqKey()].title;
    if (!eq.length) push('08', eqt, 'empty', 'Empty. A department running what you have used notices this before anything else.');
    else if (eq.length < 3) push('08', eqt, 'thin', eq.length === 1 ? 'One line.' : 'Two lines. Add the information systems as well as the hardware.');
    else push('08', eqt, 'ready', eq.length + ' lines, named specifically.');

    var complete = f.refs.filter(function (r) { return filled(r.name) && filled(r.role) && filled(r.org) && filled(r.rel) && filled(r.email); });
    var started = f.refs.filter(function (r) { return filled(r.name); });
    if (S.refsMode === 'request') push('09', 'References', 'ready', 'Set to available on request, which is a normal choice at this stage.');
    else if (!started.length) push('09', 'References', 'empty', 'No referees yet.');
    else if (complete.length < 2) push('09', 'References', 'thin', complete.length === 1 ? 'One complete referee. Two, and one should be a line manager.' : 'Referees started but none has all five fields.');
    else push('09', 'References', 'ready', complete.length + ' referees with all five fields.');

    return out;
  }

  /* ---------- repeatable rows ---------- */
  function rowInput(list, id, key, ph, val, type) {
    return '<input type="' + (type || 'text') + '" data-list="' + list + '" data-id="' + id + '" data-key="' + key + '" placeholder="' + esc(ph) + '" value="' + esc(val) + '">';
  }
  function rowArea(list, id, key, rows, ph, val) {
    return '<textarea data-list="' + list + '" data-id="' + id + '" data-key="' + key + '" rows="' + rows + '" placeholder="' + esc(ph) + '">' + esc(val) + '</textarea>';
  }
  function removeBtn(list, id) { return '<button class="cv-mini" type="button" data-remove="' + list + '" data-id="' + id + '">Remove</button>'; }

  var RENDER = {
    expertise: function (r) {
      return '<div class="cv-row"><div class="cv-rowtop"><div class="cv-f" style="flex:1">' +
        rowInput('expertise', r.id, 'group', 'Grouping — CT, theatre, paediatrics', r.group) +
        '</div>' + removeBtn('expertise', r.id) + '</div><div class="cv-f">' +
        rowArea('expertise', r.id, 'items', 3, 'Name the procedures. A reader will not assume a skill you have not written down.', r.items) +
        '</div><p class="cv-hint">One line each, or run them together — your punctuation is kept as you type it.</p></div>';
    },
    soft: function (r) {
      var sm = sameness(r.skill);
      var flag = sm.filler.length ? 'Nearly every CV says this. What would you call it in your own words?'
        : (sm.evidence.length ? 'The most claimed and least evidenced thing a CV can say. Worth keeping only if the example under it is strong.' : '');
      var note = filled(r.story) ? 'Kept here for your interview prep. It does not print on the CV.'
        : (filled(r.skill) ? 'No example yet — this is the one a panel will ask about.' : 'Add the skill first.');
      return '<div class="cv-row"><div class="cv-rowtop"><div class="cv-f" style="flex:1">' +
        rowInput('soft', r.id, 'skill', 'The skill, in your words', r.skill) +
        '</div>' + removeBtn('soft', r.id) + '</div>' +
        (flag ? '<p class="cv-hint" style="color:#9E4A22">' + flag + '</p>' : '') +
        '<div class="cv-f" style="margin-top:12px"><label>Your example — stays on this device</label>' +
        rowArea('soft', r.id, 'story', 2, 'The situation you would describe if asked. If nothing comes to mind, take the skill off the page.', r.story) +
        '<p class="cv-hint"' + (filled(r.skill) && !filled(r.story) ? ' style="color:#9E4A22"' : '') + '>' + note + '</p></div></div>';
    },
    roles: function (r, i) {
      var gap = r.kind === 'gap';
      return '<div class="cv-row"><div class="cv-rowtop"><span class="cv-kind">' +
        (gap ? 'A gap, accounted for' : (i === 0 ? 'Most recent role' : 'Earlier role')) +
        '</span><div class="cv-rowbtns">' +
        (i > 0 ? '<button class="cv-mini" type="button" data-up="roles" data-id="' + r.id + '">Move up</button>' : '') +
        removeBtn('roles', r.id) + '</div></div><div class="cv-grid">' +
        '<div class="cv-f">' + rowInput('roles', r.id, 'title', gap ? 'Parental leave, study, caring, illness' : 'Job title', r.title) + '</div>' +
        '<div class="cv-f">' + rowInput('roles', r.id, 'org', 'Organisation', r.org) + '</div>' +
        '<div class="cv-f">' + rowInput('roles', r.id, 'loc', 'City, country', r.loc) + '</div>' +
        '<div class="cv-f">' + rowInput('roles', r.id, 'dates', 'April 2016 to present', r.dates) + '</div>' +
        '</div><div class="cv-f" style="margin-top:12px">' +
        rowArea('roles', r.id, 'bullets', 4, gap ? 'One line is enough. The truth invites better assumptions than silence.' : 'What was specific to this job, one line each. Put the scale in — twelve patients a day, one in three on call.', r.bullets) +
        '<p class="cv-hint">One line per point. They print as bullets.</p></div></div>';
    },
    edu: function (r, i) {
      return '<div class="cv-row"><div class="cv-grid">' +
        '<div class="cv-f">' + rowInput('edu', r.id, 'qual', i === 0 ? 'Your highest qualification, as awarded' : 'Qualification, as awarded', r.qual) + '</div>' +
        '<div class="cv-f">' + rowInput('edu', r.id, 'inst', 'Institution', r.inst) + '</div>' +
        '<div class="cv-f">' + rowInput('edu', r.id, 'loc', 'City, country', r.loc) + '</div>' +
        '<div class="cv-f" style="display:flex;gap:10px;align-items:flex-start">' + rowInput('edu', r.id, 'dates', '2004 to 2008', r.dates) + removeBtn('edu', r.id) + '</div>' +
        '</div></div>';
    },
    cpd: function (r, i) {
      return '<div class="cv-row"><div class="cv-grid">' +
        '<div class="cv-f">' + rowInput('cpd', r.id, 'title', i === 0 ? 'Clinical training first' : 'Course, conference or specialist training', r.title) + '</div>' +
        '<div class="cv-f">' + rowInput('cpd', r.id, 'provider', 'Provider', r.provider) + '</div>' +
        '<div class="cv-f" style="display:flex;gap:10px;align-items:flex-start">' + rowInput('cpd', r.id, 'date', '2024', r.date) + removeBtn('cpd', r.id) + '</div>' +
        '</div></div>';
    },
    refs: function (r, i) {
      return '<div class="cv-row"><div class="cv-rowtop"><span class="cv-kind">' +
        (i === 0 ? 'Referee one — ideally your line manager' : 'Referee ' + (i === 1 ? 'two' : i + 1)) +
        '</span>' + removeBtn('refs', r.id) + '</div><div class="cv-grid">' +
        '<div class="cv-f">' + rowInput('refs', r.id, 'name', 'Name', r.name) + '</div>' +
        '<div class="cv-f">' + rowInput('refs', r.id, 'role', 'Job title', r.role) + '</div>' +
        '<div class="cv-f">' + rowInput('refs', r.id, 'org', 'Organisation', r.org) + '</div>' +
        '<div class="cv-f">' + rowInput('refs', r.id, 'rel', 'Relationship to you', r.rel) + '</div>' +
        '<div class="cv-f">' + rowInput('refs', r.id, 'email', 'Email', r.email, 'email') + '</div>' +
        '</div></div>';
    }
  };

  function renderList(list) {
    var host = $('[data-list="' + list + '"]');
    if (!host) return;
    host.innerHTML = S.f[list].map(function (r, i) { return RENDER[list](r, i); }).join('');
  }
  function renderAllLists() { Object.keys(RENDER).forEach(renderList); }

  /* ---------- the A4 preview ---------- */
  function paint() {
    var f = S.f, p = function (k) { return $('[data-p="' + k + '"]'); };
    var contact = [f.email, f.mobile, f.location, f.rights].filter(Boolean).join('  ·  ');
    p('jobTitle').textContent = f.jobTitle || 'Job title you are applying for';
    p('name').textContent = f.name || 'Your name';
    p('contact').textContent = contact || 'Email · mobile · where you are now';
    p('regLine').textContent = f.regLine || '';

    var sum = summaryText();
    p('summary').innerHTML = sum ? '<p class="cv-p-t">' + esc(sum) + '</p>'
      : '<p class="cv-p-empty">Nothing here yet — this is the part most likely to be read in full.</p>';

    var ex = f.expertise.filter(function (r) { return filled(r.group) || filled(r.items); });
    p('expertise').innerHTML = ex.length ? ex.map(function (r) {
      return '<div class="cv-p-block"><p class="cv-p-sub">' + esc(r.group || 'Grouping') + '</p><p class="cv-p-t">' + esc(lines(r.items).join('  ')) + '</p></div>';
    }).join('') : '<p class="cv-p-empty">Empty. This is the section that gets scanned first.</p>';

    var skills = f.soft.filter(function (r) { return filled(r.skill); });
    p('softwrap').hidden = !skills.length;
    p('soft').innerHTML = skills.length ? '<p class="cv-p-t">' + esc(skills.map(function (r) { return r.skill; }).join('  ·  ')) + '</p>' : '';

    var roles = f.roles.filter(function (r) { return filled(r.title) || filled(r.org); });
    p('roles').innerHTML = roles.length ? roles.map(function (r) {
      return '<div class="cv-p-block"><p class="cv-p-sub">' + esc([r.title, r.org, r.loc, r.dates].filter(Boolean).join('  /  ')) + '</p>' +
        lines(r.bullets).map(function (b) { return '<p class="cv-p-b">—  ' + esc(b) + '</p>'; }).join('') + '</div>';
    }).join('') : '<p class="cv-p-empty">No roles yet.</p>';

    var edu = f.edu.filter(function (r) { return filled(r.qual); });
    var eduHtml = edu.map(function (r) { return '<p class="cv-p-t">' + esc([r.qual, r.inst, r.loc, r.dates].filter(Boolean).join('  /  ')) + '</p>'; }).join('');
    if (filled(f.board)) eduHtml += '<p class="cv-p-t" style="margin-top:8px">' + esc([f.board, f.regNumber].filter(Boolean).join('  —  registration number ')) + '</p>';
    p('edu').innerHTML = eduHtml || '<p class="cv-p-empty">No qualifications listed.</p>';

    var cpd = f.cpd.filter(function (r) { return filled(r.title); });
    p('cpd').innerHTML = cpd.length ? cpd.map(function (r) { return '<p class="cv-p-t">' + esc([r.title, r.provider, r.date].filter(Boolean).join(', ')) + '</p>'; }).join('')
      : '<p class="cv-p-empty">Empty — a reader reads this as nothing since qualifying.</p>';

    var eq = lines(f.equipment);
    p('equipwrap').hidden = !eq.length;
    p('equiphead').textContent = EQUIP[eqKey()].title;
    p('equipment').innerHTML = eq.map(function (t) { return '<p class="cv-p-t">' + esc(t) + '</p>'; }).join('');

    var refs = f.refs.filter(function (r) { return filled(r.name); });
    p('refs').innerHTML = S.refsMode === 'request' ? '<p class="cv-p-t">References available on request.</p>'
      : refs.length ? refs.map(function (r) {
        return '<div><p class="cv-p-sub">' + esc(r.name) + '</p><p class="cv-p-t" style="font-size:12.5px">' + esc([r.role, r.org, r.rel, r.email].filter(Boolean).join('  ·  ')) + '</p></div>';
      }).join('') : '<p class="cv-p-empty">No referees yet. Two, with all five fields each.</p>';

    /* the on-screen column is the printed column, so height divides into pages */
    var paper = $('[data-paper]');
    if (paper) {
      var pages = Math.max(1, Math.ceil((paper.scrollHeight - 114) / 1009));
      var w = ['one', 'two', 'three', 'four', 'five'][pages - 1] || pages;
      $('[data-pages]').textContent = 'About ' + w + ' A4 page' + (pages === 1 ? '' : 's') + ' as it stands.';
    }
  }

  function paintAudit() {
    var a = audit();
    a.forEach(function (x) {
      var pill = $('[data-pill="s' + Number(x.n) + '"]');
      if (pill) { pill.className = 'cv-pill ' + x.state; pill.textContent = x.state === 'ready' ? 'Ready' : x.state === 'thin' ? 'Thin' : 'Empty'; }
    });
    var ready = a.filter(function (x) { return x.state === 'ready'; }).length;
    $('[data-readylabel]').textContent = ready === 0 ? 'Your CV has 9 sections · about 20 minutes'
      : ready === 9 ? 'All 9 sections ready' : ready + ' of 9 complete';
    $('[data-readyfill]').style.width = Math.round((ready / 9) * 100) + '%';
    $('[data-gapslead]').textContent = ready === 9
      ? 'Nothing outstanding. Read it once more out loud, then send it.'
      : 'No score, because there is no meaningful one. What already reads well, and what a hiring manager in ' + country() + ' would look at twice.';
    var rank = { empty: 0, thin: 1 };
    var strong = a.filter(function (x) { return x.state === 'ready'; });
    var review = a.filter(function (x) { return x.state !== 'ready'; })
      .sort(function (x, y) { return rank[x.state] - rank[y.state]; });
    function grp(title, items, mark, cls) {
      if (!items.length) return '';
      return '<div class="cv-gapgrp"><p class="cv-gapgh">' + title + '</p>' + items.map(function (x) {
        return '<div class="cv-gap ' + cls + '"><span class="cv-mk" aria-hidden="true">' + mark + '</span>' +
          '<div><p class="cv-gap-t">' + esc(x.title) + '</p><p class="cv-gap-n">' + esc(x.note) + '</p></div></div>';
      }).join('') + '</div>';
    }
    $('[data-gaps]').innerHTML = grp('Strong', strong, '\u2713', 'ok') + grp('Worth reviewing', review, '\u25CB', 'watch');

    var obs = [], p = S.prof;
    var imaging = ['radiography', 'sonography', 'radiation', 'nuclear'].indexOf(p) >= 0;
    var skills = f.expertise.map(function (r) { return (r.group || '') + ' ' + (r.items || ''); }).join(' ').toLowerCase();
    var history = f.roles.map(function (r) { return (r.title || '') + ' ' + (r.bullets || ''); }).join(' ').toLowerCase();
    var both = skills + ' ' + history;
    function inS(re) { return re.test(skills); }
    function inH(re) { return re.test(history); }

    if (p === 'radiography') {
      if (inS(/\bct\b|computed tomog/) && !inH(/\bct\b|computed tomog/)) {
        obs.push('CT is in your skills but your employment history does not show how much of it you actually do. That is the first thing a client asks us, so it is worth answering on the page.');
      }
      if (!/emergency|trauma|theatre|mobile|on.call|out.of.hours/.test(both)) {
        obs.push('Nothing here says whether you cover emergency, theatre, mobile or out-of-hours work. Those four lines change which departments we can put you forward for.');
      }
    } else if (p === 'sonography') {
      if (!/report/.test(both)) {
        obs.push('It is not clear whether you report your own examinations. For a sonographer that is the single most consequential thing on the CV, so say it plainly \u2014 independently, or within a radiologist-led service.');
      }
      if (inS(/vascular|msk|paediatric/) && !inH(/vascular|msk|paediatric/)) {
        obs.push('You have listed a specialist scope that your role descriptions do not evidence. Name the examinations you perform independently rather than the area, or a reader will assume less than you can do.');
      }
    } else if (p === 'radiation') {
      if (inS(/vmat|imrt|igrt|sabr|sbrt|srs/) && !inH(/vmat|imrt|igrt|sabr|sbrt|srs/)) {
        obs.push('Your techniques are listed but your roles do not show how routinely you deliver them. An oncology service will want to know whether that is daily practice or occasional cover.');
      }
    } else if (p === 'nuclear') {
      if (inH(/pet/) && !inS(/pet/)) {
        obs.push('Your PET/CT experience is buried in an employment description. It is probably the most relevant thing you have \u2014 move it into your clinical skills where it will be seen.');
      }
    }

    if (!filled(f.regLine)) {
      obs.push('Registration is the first thing our clients look for, and yours is not on page one yet. Even \u201Capplication submitted\u201D reads better than nothing \u2014 it tells them where you are.');
    }
    if (!filled(f.equipment)) {
      obs.push(imaging
        ? 'You have not named the scanners or systems you have worked on. A department running the same kit as you notices that before anything else on the page.'
        : 'The systems and assessments you actually use are not listed. It is a quick way for a reader to place your experience in their own service.');
    }
    var recentRole = f.roles.filter(function (r) { return filled(r.title); })[0];
    if (recentRole && filled(recentRole.bullets) && !/\d/.test(String(recentRole.bullets))) {
      obs.push('Your most recent role has no numbers in it. We would want to know how much of your week is spent on what \u2014 lists, sessions, on-call frequency \u2014 before putting you forward for anything specialised.');
    }
    if (!filled(f.sumOnly)) {
      obs.push('Your summary does not yet say what is distinctive about your experience. When our clients read several CVs side by side, that is the line that separates two otherwise similar clinicians.');
    }

    var rec = $('[data-rec]');
    if (rec) {
      if (obs.length) {
        rec.hidden = false;
        rec.innerHTML = '<h3>What we would notice as a recruiter</h3>' +
          obs.slice(0, 3).map(function (t) { return '<p>' + t + '</p>'; }).join('') +
          '<p class="cv-recfoot">If you apply through us, we read every CV with the candidate before it goes to a client. You do not have to use us to use this \u2014 but that check is standard, not an extra.</p>';
      } else {
        rec.hidden = false;
        rec.innerHTML = '<h3>What we would notice as a recruiter</h3><p>Nothing is missing that we would ask you about before sending this out. We still read every CV with our candidates before it goes to a client \u2014 not because this needs fixing, but because it is worth one more pair of eyes.</p>';
      }
    }

    var w = words(summaryText());
    var wn = $('[data-words]');
    wn.className = 'cv-count' + (w > 200 ? ' over' : '');
    wn.textContent = w === 0 ? 'Nothing written yet. Aim for 80 to 130 words.'
      : w > 200 ? w + ' words — over the two hundred word ceiling by ' + (w - 200) + '.'
      : w < 80 ? w + ' words. Aim for 80 to 130.'
      : w <= 130 ? w + ' words, which is a good length.'
      : w + ' words. Still inside the ceiling, though 80 to 130 reads best.';

    var sm = sameness(summaryText()), fl = '';
    if (sm.filler.length) fl += '<div class="cv-flag warm"><p class="cv-flag-k">This appears on nearly every CV</p><p>' + esc(sm.filler.join('  ·  ')) + '</p><p class="sm">Not wrong — invisible, which is worse. Replace each one with the thing you actually did, and it becomes yours.</p></div>';
    if (sm.evidence.length) fl += '<div class="cv-flag sage"><p class="cv-flag-k">Claimed often, evidenced rarely</p><p>' + esc(sm.evidence.join('  ·  ')) + '</p><p class="sm">Keep it if you have the example, and expect to be asked for it in the first ten minutes.</p></div>';
    $('[data-flags]').innerHTML = fl;
  }

  function refresh() { paint(); paintAudit(); save(); }

  /* ---------- exports ---------- */
  function plainText() {
    var f = S.f, L = [];
    if (f.jobTitle) L.push(f.jobTitle.toUpperCase());
    if (f.name) L.push(f.name);
    var c = [f.email, f.mobile, f.location, f.rights].filter(Boolean).join(' · ');
    if (c) L.push(c);
    if (f.regLine) L.push(f.regLine);
    function add(h, body) { if (body && body.length) { L.push('', h.toUpperCase(), body.join('\n')); } }
    add('Candidate summary', summaryText() ? [summaryText()] : []);
    add('Clinical expertise', f.expertise.filter(function (r) { return filled(r.group); }).map(function (r) { return r.group + ': ' + lines(r.items).join(' '); }));
    add('Soft skills', [f.soft.filter(function (r) { return filled(r.skill); }).map(function (r) { return r.skill; }).join(' · ')].filter(Boolean));
    add('Employment history and experience', f.roles.filter(function (r) { return filled(r.title) || filled(r.org); }).map(function (r) {
      var line = [r.title, r.org, r.loc, r.dates].filter(Boolean).join(' / ');
      var b = lines(r.bullets).map(function (x) { return '  - ' + x; }).join('\n');
      return b ? line + '\n' + b : line;
    }));
    var edu = f.edu.filter(function (r) { return filled(r.qual); }).map(function (r) { return [r.qual, r.inst, r.loc, r.dates].filter(Boolean).join(' / '); });
    if (f.board) edu.push([f.board, f.regNumber].filter(Boolean).join(' — '));
    add('Education, certifications and registration', edu);
    add('Continued professional development', f.cpd.filter(function (r) { return filled(r.title); }).map(function (r) { return [r.title, r.provider, r.date].filter(Boolean).join(', '); }));
    add(EQUIP[eqKey()].title, lines(f.equipment));
    if (S.refsMode === 'request') add('References', ['References available on request.']);
    else add('References', f.refs.filter(function (r) { return filled(r.name); }).map(function (r) { return [r.name, r.role, r.org, r.rel, r.email].filter(Boolean).join(', '); }));
    return L.join('\n');
  }

  function docxBlocks() {
    var f = S.f, B = [];
    function add(t, text) { if (text && String(text).trim()) B.push({ t: t, text: text }); }
    add('eyebrow', f.jobTitle);
    add('name', f.name || 'Your name');
    add('contact', [f.email, f.mobile, f.location, f.rights].filter(Boolean).join('  ·  '));
    add('contact', f.regLine);
    if (summaryText()) { B.push({ t: 'h2', text: 'Candidate summary' }); add('p', summaryText()); }
    var groups = f.expertise.filter(function (r) { return filled(r.group) || filled(r.items); });
    if (groups.length) {
      B.push({ t: 'h2', text: 'Clinical expertise' });
      groups.forEach(function (r) { add('sub', r.group); var l = lines(r.items); if (l.length) add('p', l.join('\n')); });
    }
    var skills = f.soft.filter(function (r) { return filled(r.skill); });
    if (skills.length) { B.push({ t: 'h2', text: 'Soft skills' }); add('p', skills.map(function (r) { return r.skill; }).join('  ·  ')); }
    var roles = f.roles.filter(function (r) { return filled(r.title) || filled(r.org); });
    if (roles.length) {
      B.push({ t: 'h2', text: 'Employment history and experience' });
      roles.forEach(function (r) {
        add('sub', [r.title, r.org, r.loc, r.dates].filter(Boolean).join('  /  '));
        lines(r.bullets).forEach(function (b) { B.push({ t: 'bullet', text: b }); });
      });
    }
    var edu = f.edu.filter(function (r) { return filled(r.qual); });
    if (edu.length || filled(f.board)) {
      B.push({ t: 'h2', text: 'Education, certifications and registration' });
      edu.forEach(function (r) { add('p', [r.qual, r.inst, r.loc, r.dates].filter(Boolean).join('  /  ')); });
      if (filled(f.board)) add('p', [f.board, f.regNumber].filter(Boolean).join('  —  registration number '));
    }
    var cpd = f.cpd.filter(function (r) { return filled(r.title); });
    if (cpd.length) {
      B.push({ t: 'h2', text: 'Continued professional development' });
      cpd.forEach(function (r) { add('p', [r.title, r.provider, r.date].filter(Boolean).join(', ')); });
    }
    var eq = lines(f.equipment);
    if (eq.length) { B.push({ t: 'h2', text: EQUIP[eqKey()].title }); add('p', eq.join('\n')); }
    var refs = f.refs.filter(function (r) { return filled(r.name); });
    if (S.refsMode === 'request') { B.push({ t: 'h2', text: 'References' }); add('p', 'References available on request.'); }
    else if (refs.length) {
      B.push({ t: 'h2', text: 'References' });
      refs.forEach(function (r) { add('sub', r.name); add('p', [r.role, r.org, r.rel, r.email].filter(Boolean).join('  ·  ')); });
    }
    return B;
  }

  function flash(btn, text) {
    var was = btn.textContent;
    btn.textContent = text;
    setTimeout(function () { btn.textContent = was; }, 2400);
  }

  /* ---------- wiring ---------- */
  function applyPanels() {
    $$('[data-panel]').forEach(function (el) {
      var on = el.getAttribute('data-panel') === S.open;
      el.hidden = !on;
      var btn = $('[data-toggle="' + el.getAttribute('data-panel') + '"]');
      if (btn) btn.setAttribute('aria-expanded', on ? 'true' : 'false');
    });
  }
  /* set and toggle are separate on purpose: init must not flip the saved section */
  function setPanel(id) { S.open = id || ''; applyPanels(); save(); }
  function togglePanel(id) { S.open = S.open === id ? '' : id; applyPanels(); save(); }

  function groupChips() {
    var host = $('[data-groupchips]');
    if (!host) return;
    host.innerHTML = (GROUPS[S.profession] || GROUPS.other).map(function (g) {
      return '<button class="cv-chip" type="button" data-group="' + esc(g) + '">' + esc(g) + '</button>';
    }).join('');
  }
  function regCopy() {
    var hint = $('[data-boardhint]');
    if (hint) hint.textContent = S.dest === 'nz'
      ? 'Your home board first. New Zealand registration sits with your own regulator there — the Medical Radiation Technologists Board, Nursing Council, Medical Council, Physiotherapy Board or equivalent. The Registration Pathway Checker names yours.'
      : 'Your home board first. Australian registration sits with Ahpra and your national board. The Registration Pathway Checker names yours.';
  }
  function applyRefsMode() {
    var req = S.refsMode === 'request';
    $$('[data-refsmode]').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-refsmode') === S.refsMode ? 'true' : 'false'); });
    var wrap = $('[data-refswrap]');
    if (wrap) wrap.hidden = req;
    var note = $('[data-refsnote]');
    if (note) note.textContent = req
      ? 'Your CV will carry one line: references available on request. Most employers ask when they are ready to ask, and you can add referees here at any point.'
      : 'Two at least, and one should be your current or previous line manager — a character reference does not substitute. Both need to be willing to write a reference and take a phone call, so ask them before you put them here.';
  }
  function equipCopy() {
    var e = EQUIP[eqKey()];
    $$('[data-equiptitle]').forEach(function (el) { el.textContent = e.title; });
    var lead = $('[data-equiplead]');
    if (lead) lead.textContent = e.lead;
  }

  function init() {
    /* selects */
    var ps = $('#cvProf');
    ps.innerHTML = PROFESSIONS.map(function (p) { return '<option value="' + p.value + '">' + esc(p.label) + '</option>'; }).join('');
    ps.value = S.profession;
    $('#cvDest').value = S.dest;

    /* static fields */
    FIELDS.forEach(function (k) {
      var el = $('[data-field="cv' + k.charAt(0).toUpperCase() + k.slice(1) + '"]');
      if (el) el.value = S.f[k] || '';
    });
    /* destination-aware placeholder */
    var why = $('[data-field="cvSumWhy"]');
    if (why) why.placeholder = 'Why ' + country() + '? One honest sentence';

    groupChips();
    equipCopy();
    regCopy();
    applyRefsMode();
    renderAllLists();
    setPanel(S.open || 's1');
    refresh();

    /* typing: static fields */
    document.addEventListener('input', function (e) {
      var t = e.target;
      var fld = t.getAttribute && t.getAttribute('data-field');
      if (fld) {
        var k = fld.slice(2);
        k = k.charAt(0).toLowerCase() + k.slice(1);
        S.f[k] = t.value;
        refresh();
        return;
      }
      var list = t.getAttribute && t.getAttribute('data-list');
      if (list && t.getAttribute('data-id')) {
        var id = t.getAttribute('data-id'), key = t.getAttribute('data-key');
        S.f[list] = S.f[list].map(function (r) { if (r.id === id) { r[key] = t.value; } return r; });
        refresh();
      }
    });

    document.addEventListener('change', function (e) {
      if (e.target.id === 'cvDest') {
        S.dest = e.target.value;
        if (why) why.placeholder = 'Why ' + country() + '? One honest sentence';
        regCopy();
        refresh();
      }
      if (e.target.id === 'cvProf') {
        S.profession = e.target.value;
        groupChips(); equipCopy(); refresh();
      }
    });

    document.addEventListener('click', function (e) {
      var t = e.target.closest ? e.target.closest('[data-toggle],[data-add],[data-remove],[data-up],[data-group],[data-print],[data-copy],[data-docx],[data-refsmode]') : null;
      if (!t) return;

      if (t.hasAttribute('data-toggle')) { togglePanel(t.getAttribute('data-toggle')); return; }

      if (t.hasAttribute('data-refsmode')) { S.refsMode = t.getAttribute('data-refsmode'); applyRefsMode(); refresh(); return; }

      if (t.hasAttribute('data-group')) {
        S.f.expertise = S.f.expertise.concat([{ id: uid(), group: t.getAttribute('data-group'), items: '' }]);
        renderList('expertise'); refresh(); return;
      }

      if (t.hasAttribute('data-add')) {
        var which = t.getAttribute('data-add');
        if (which === 'gap') { S.f.roles = S.f.roles.concat([{ id: uid(), kind: 'gap', title: '', org: '', loc: '', dates: '', bullets: '' }]); renderList('roles'); }
        else if (which === 'roles') { S.f.roles = S.f.roles.concat([{ id: uid(), kind: 'role', title: '', org: '', loc: '', dates: '', bullets: '' }]); renderList('roles'); }
        else { S.f[which] = S.f[which].concat([Object.assign({ id: uid() }, blank()[which][0], { id: uid() })]); renderList(which); }
        refresh(); return;
      }

      if (t.hasAttribute('data-remove')) {
        var lst = t.getAttribute('data-remove'), rid = t.getAttribute('data-id');
        S.f[lst] = S.f[lst].filter(function (r) { return r.id !== rid; });
        if (!S.f[lst].length && lst !== 'soft') S.f[lst] = [Object.assign({}, blank()[lst][0], { id: uid() })];
        renderList(lst); refresh(); return;
      }

      if (t.hasAttribute('data-up')) {
        var ul = t.getAttribute('data-up'), uidv = t.getAttribute('data-id');
        var arr = S.f[ul].slice(), i = arr.findIndex(function (r) { return r.id === uidv; });
        if (i > 0) { var tmp = arr[i - 1]; arr[i - 1] = arr[i]; arr[i] = tmp; S.f[ul] = arr; renderList(ul); refresh(); }
        return;
      }

      if (t.hasAttribute('data-print')) { window.print(); return; }

      if (t.hasAttribute('data-copy')) {
        var text = plainText();
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(function () { flash(t, 'Copied'); }).catch(function () {});
        }
        return;
      }

      if (t.hasAttribute('data-docx')) {
        if (!window.EthicareDocx) { flash(t, 'Export did not load'); return; }
        var nm = String(S.f.name || 'CV').trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
        try {
          window.EthicareDocx.download(docxBlocks(), nm && nm !== 'CV' ? nm + '-CV' : 'CV');
          flash(t, 'Downloaded');
        } catch (err) { flash(t, 'Would not build — print instead'); }
      }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
