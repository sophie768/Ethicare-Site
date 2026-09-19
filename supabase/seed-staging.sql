-- ============================================================================
-- My Move — STAGING seed. Fictional candidates only. NEVER run on production.
-- Run after 0001_my_move.sql and after the first admin exists in staff_profiles.
-- Edit the admin email below. Invitations are then sent from the app to test
-- mailboxes you control (Publish & invite), which is what binds auth_user_id.
-- ============================================================================
do $$
declare
  v_admin uuid;
  v_amina uuid; v_daniel uuid; v_priya uuid;
  au jsonb; nz jsonb;
begin
  select id into v_admin from public.staff_profiles where email = 'sophie@ethicareresourcing.com';  -- << edit
  if v_admin is null then raise exception 'Create the admin staff_profiles row first'; end if;

  select tasks into au from public.templates where id = 'au-imaging';
  select tasks into nz from public.templates where id = 'nz-nursing';

  -- Amina Okafor — active-looking case (the WA radiation licence check, acceptance #7)
  insert into public.candidate_cases (assigned_staff_id, first_name, last_name, email, created_by)
  values (v_admin, 'Amina', 'Okafor', 'amina.okafor@example.com', v_admin) returning id into v_amina;
  insert into public.case_draft (case_id, draft) values (v_amina, jsonb_build_object(
    'role', jsonb_build_object('profession','Diagnostic Radiographer','jobTitle','Senior Radiographer','employer','Southwest Regional Imaging (fictional)','destination','Australia','region','Bunbury, WA','startDate',null,'relocationSupport','Relocation allowance confirmed; amount to be finalised in your offer letter.','workingPattern','Full time'),
    'welcome', 'Welcome to your My Move space, Amina. This is where we’ll keep your radiography move to Western Australia on track together — your registration and WA radiation licence, the visa, and the practical side of landing in Bunbury. A few details are still to be confirmed and we’ll add them as they come through.',
    'nextActions', jsonb_build_array(
      jsonb_build_object('id','n-amina-1','title','Submit your WA radiation use licence application','owner','you','due','2026-11-20'),
      jsonb_build_object('id','n-amina-2','title','Order your police & health checks','owner','you','due',null),
      jsonb_build_object('id','n-amina-3','title','We’ll confirm your visa subclass this week','owner','ethicare','due',null)),
    'tasks', (select jsonb_agg(case
        when t->>'id' = 'au-imaging/ahpra' then t || '{"status":"complete"}'
        when t->>'id' = 'au-imaging/wa-licence' then t || '{"status":"in_progress","due":"2026-11-20","link":"https://www.radiologicalcouncil.wa.gov.au/","linkLabel":"Radiological Council of WA"}'
        when t->>'id' = 'au-imaging/visa' then t || '{"status":"in_progress"}'
        else t end) from jsonb_array_elements(au) t),
    'guides', jsonb_build_array('reg-au','visa-au','money-au','drive-au','bunbury')));
  insert into public.case_arrangements (case_id, type, label, detail, state, editable_by, sort_order) values
    (v_amina, 'flight', 'One-way flight to Perth', 'Not booked yet — waiting on start date', 'planned', 'candidate', 0),
    (v_amina, 'accommodation', 'Temporary accommodation, first fortnight', 'Researching serviced apartments in Bunbury', 'planned', 'candidate', 1);

  -- Daniel Reyes — further along, NZ nursing
  insert into public.candidate_cases (assigned_staff_id, first_name, last_name, email, created_by)
  values (v_admin, 'Daniel', 'Reyes', 'daniel.reyes@example.com', v_admin) returning id into v_daniel;
  insert into public.case_draft (case_id, draft) values (v_daniel, jsonb_build_object(
    'role', jsonb_build_object('profession','Registered Nurse','jobTitle','Registered Nurse, Emergency Department','employer','Health New Zealand · Te Whatu Ora','destination','New Zealand','region','Wellington','startDate','2026-11-03','relocationSupport','Relocation support and CAP costs covered per your offer.','workingPattern','Full time, rotating shifts'),
    'welcome', 'Welcome, Daniel — you’re well on your way to Wellington. Registration and your visa are through, flights are booked, and the focus now is the practical side of arriving and settling in.',
    'nextActions', jsonb_build_array(
      jsonb_build_object('id','n-daniel-1','title','Decide what ships and what you sell','owner','you','due',null),
      jsonb_build_object('id','n-daniel-2','title','Apply for your IRD number after you arrive','owner','you','due',null)),
    'tasks', (select jsonb_agg(case
        when t->>'id' in ('nz-nursing/council','nz-nursing/visa','nz-nursing/flights') then t || '{"status":"complete"}'
        when t->>'id' = 'nz-nursing/cap' then t || '{"status":"waiting","waitingOn":"Nursing Council"}'
        when t->>'id' = 'nz-nursing/shipping' then t || '{"status":"in_progress"}'
        else t end) from jsonb_array_elements(nz) t),
    'guides', jsonb_build_array('reg-nz','money-nz','rent-nz','first-nz','welly')));
  insert into public.case_arrangements (case_id, type, label, detail, state, editable_by, sort_order) values
    (v_daniel, 'flight', 'One-way flight to Wellington', 'Booked — arriving 28 Oct', 'booked', 'candidate', 0),
    (v_daniel, 'accommodation', 'Temporary accommodation', 'Booked — 3 weeks, Te Aro', 'booked', 'candidate', 1),
    (v_daniel, 'car', 'Rental car for first fortnight', 'Awaiting confirmation from hire company', 'awaiting', 'candidate', 2);

  -- Priya Nair — a fresh draft, nothing confirmed
  insert into public.candidate_cases (assigned_staff_id, first_name, last_name, email, created_by)
  values (v_admin, 'Priya', 'Nair', 'priya.nair@example.com', v_admin) returning id into v_priya;
  insert into public.case_draft (case_id, draft) values (v_priya, jsonb_build_object(
    'role', jsonb_build_object('profession','Sonographer','jobTitle','Sonographer','employer','To be confirmed','destination','New Zealand','region','Auckland','startDate',null,'relocationSupport','To be confirmed','workingPattern','To be confirmed'),
    'welcome', 'Welcome to your My Move space, Priya. We’ll use this to prepare for your move to Auckland and keep the practical arrangements in one place. Some details are still to be confirmed and we’ll add them as they come through.',
    'nextActions', '[]'::jsonb,
    'tasks', (select tasks from public.templates where id = 'nz-imaging'),
    'guides', jsonb_build_array('reg-nz','visa-nz','money-nz')));
end $$;
