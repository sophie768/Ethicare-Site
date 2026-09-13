/* ================================================================
   ETHICARE RESOURCING — Before you accept the job (/before-you-accept)
   The checklist content lives HERE only — never in before-you-accept.js.
   {{retirement}} resolves to superannuation (Australia) or KiwiSaver (NZ).
   q = the question this becomes if the point is left unconfirmed.
   p = priority in the questions panel: 1 surfaces first, 3 last.
   No employer is named and no pay figure is stated anywhere in this file —
   pay amounts belong in the salary guides, against a verified agreement.
   ================================================================ */
window.ETHICARE_OFFER_CHECK = {
  lastReviewed: '19 August 2026',
  questionCount: 5,

  groups: [
    {
      id: 'offer', title: 'The offer',
      intro: 'What you will actually be paid, as opposed to the headline figure.',
      items: [
        { id: 'o1', p: 2, title: 'I know my base salary and my contracted hours',
          note: 'Full time means different things in different services. Check the hours the salary assumes.',
          q: 'What are the contracted hours this salary is based on?' },
        { id: 'o2', p: 1, title: 'I know which salary step or grade I am being placed on',
          note: 'Overseas experience is not always recognised in full, and the step you start on follows you for years.',
          q: 'Which salary step am I being placed on, and how much of my overseas experience has been recognised?' },
        { id: 'o3', p: 2, title: 'I know which agreement or award sets the pay for this role',
          note: 'Pay for most public healthcare roles is set by a collective agreement or award rather than negotiated freely. Knowing which one applies tells you what is actually open to discussion.',
          q: 'Which collective agreement or award sets the pay for this role?' },
        { id: 'o4', p: 1, title: 'I know whether {{retirement}} is on top of my salary or inside it',
          q: 'Is {{retirement}} additional to the salary you have quoted, or included in it?' },
        { id: 'o5', p: 2, title: 'I know what overtime, on-call, penalty rates and allowances add',
          note: 'For some roles this is a small top-up. For others it is a meaningful share of take-home pay.',
          q: 'What do overtime, on-call and penalty rates typically add to base pay in this role?' },
        { id: 'o6', p: 3, title: 'I know my annual leave and public holiday entitlement',
          q: 'What is the annual leave entitlement, and how does leave work in my first year?' }
      ]
    },
    {
      id: 'job', title: 'The job',
      intro: 'What you will be doing, where, and alongside whom.',
      items: [
        { id: 'j1', p: 2, title: 'I understand what the role involves day to day',
          note: 'Ask about caseload, equipment and the mix of work — job titles travel poorly between health systems.',
          q: 'What does a typical week in this role look like, and what is the caseload?' },
        { id: 'j2', p: 1, title: 'I know the roster pattern and how often I will be on call',
          q: 'How often will I be on call, and what is the roster pattern?' },
        { id: 'j3', p: 3, title: 'I know what supervision, CPD and progression look like here',
          note: 'Particularly worth asking if you are moving health systems for the first time.',
          q: 'What supervision and CPD support is there in the first year, and what does progression look like?' }
      ]
    },
    {
      id: 'reg', title: 'Registration and visa',
      intro: 'The two things that decide whether this job can happen at all.',
      items: [
        { id: 'r1', p: 2, title: 'I understand my registration pathway',
          note: 'Our pathway checker explains the route itself. This point is about whether you and your employer agree on which one applies.',
          q: 'Which registration pathway are you expecting me to use, and how long has that taken for others you have recruited?',
          ctaLabel: 'Check my registration pathway', ctaHref: '/pathway-checker' },
        { id: 'r2', p: 1, title: 'I know who pays my registration and examination costs',
          note: 'Examination and clinical assessment fees can be the largest single item in getting registered.',
          q: 'Are my registration and examination fees covered, and are they paid directly or reimbursed?' },
        { id: 'r3', p: 1, title: 'Sponsorship is confirmed, not assumed',
          q: 'Is your organisation an approved sponsor, and has the nomination for this role been approved?' }
      ]
    },
    {
      id: 'relo', title: 'The relocation package',
      intro: 'Where the most expensive misunderstandings happen.',
      items: [
        { id: 'p1', p: 2, title: 'I know the total relocation support on offer',
          q: 'What is the total relocation support, and is it a fixed sum or a set of covered items?' },
        { id: 'p2', p: 2, title: 'I know exactly which costs it covers',
          note: 'Flights, visa charges, shipping and temporary accommodation are the four that matter most.',
          q: 'Which costs does the relocation support cover — flights, visa, shipping, temporary accommodation?',
          ctaLabel: 'Work out what my move costs', ctaHref: '/cost-calculator' },
        { id: 'p3', p: 1, title: 'I know whether it is paid upfront or reimbursed afterwards',
          note: 'If it is reimbursed, the money leaves your account first. That changes what you need to have saved.',
          q: 'Is the relocation allowance paid upfront or reimbursed after I have paid?' },
        { id: 'p4', p: 1, title: 'I know whether there is a repayment clause',
          note: 'Many packages must be repaid in full or in part if you leave within a set period.',
          q: 'Is there a repayment clause on the relocation allowance, and what triggers it?' }
      ]
    },
    {
      id: 'move', title: 'Does the move work?',
      intro: 'The offer can be sound and still be the wrong move.',
      items: [
        { id: 'm1', p: 2, title: 'I know which site I will actually be based at',
          note: 'Services often span several sites, and the advertised city is not always where the work is.',
          q: 'Which site or sites will I be based at, and is that likely to change?' },
        { id: 'm2', p: 3, title: 'We have talked through what this means for the people coming with me',
          ctaLabel: 'Plan the practical move', ctaHref: '/moving-checklist' },
        { id: 'm3', p: 2, title: 'The start date is realistic given registration and the visa',
          q: 'How much flexibility is there on the start date if registration or the visa takes longer than expected?' }
      ]
    },
    {
      id: 'contract', title: 'The contract',
      intro: 'The last check, and the one people skip.',
      items: [
        { id: 'c1', p: 2, title: 'I know whether this is permanent or fixed term, and my notice and probation periods',
          q: 'Is this permanent or fixed term, and what are the probation and notice periods?' },
        { id: 'c2', p: 3, title: 'I have read the contract in full before signing',
          note: 'Including the parts about repayment, notice and what happens if registration is delayed.' }
      ]
    }
  ]
};
