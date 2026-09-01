/* ================================================================
   ETHICARE RESOURCING — Interview & application prep (/interview-prep)
   ALL content lives HERE. Never in interview-prep.js.
   Every function takes dest = "nz" | "au".
   ================================================================ */
(function () {

function worked(dest) {
    const nz = dest === 'nz';
    const e = (setting, beats, why) => ({ setting: setting, beats: beats, why: why });
    return {
      q1: e('A theatre nurse from Durban. About ninety seconds, spoken.', [
        ['Where I am now', 'Eight years in cardiothoracic theatres, the last three as senior scrub nurse running the list on complex valve cases.'],
        ['Why this service', 'You are one of two units in the region doing paediatric cardiac work, and your annual report mentioned the new hybrid theatre. That is the work I want to keep doing rather than step away from as I get more senior.'],
        ['Why here', 'My sister settled in Hamilton four years ago and I have visited twice. I want my daughter to grow up with more space than she has now, and I want a job I can still do at fifty-five. Both of those are true, and I would rather say so than pretend it is only about the hospital.']
      ], 'Three moves in ninety seconds: what I do now, why this department, why this country. The personal reason is said plainly instead of hidden, and the detail about the hybrid theatre could only come from someone who actually read about them.'),

      q2: e('A ward nurse in Birmingham. One shift, details removed.', [
        ['Situation', 'A locum doctor had prescribed a dose of gentamicin that did not match the patient’s renal function. I queried it at handover and was told it was fine.'],
        ['What I did', 'I did not give it. I rang the pharmacist, then escalated to the registrar, and documented both conversations. I told the doctor directly that I had done so, rather than going round him.'],
        ['How it landed', 'The dose was changed. It was uncomfortable for a shift and he was short with me. I also filed it as a near miss, so the pattern got looked at rather than just that one chart.']
      ], 'One dose, one shift, one decision. It is clear what I personally did, it admits the awkwardness instead of smoothing it over, and it closes on the system rather than on being right.'),

      q3: e('A radiographer in Dubai, about a genuine error rather than a near miss.', [
        ['Situation', 'I imaged the wrong side. A wrist. The request said left, the patient offered me her right without correcting me, and I did not check the site against the form before exposing.'],
        ['What I did', 'Stopped, told the patient immediately, told the reporting radiologist and my lead, completed the incident form the same shift, and recorded the additional dose.'],
        ['What changed', 'I now say the side out loud to the patient and wait for them to say it back. Every time, including when it feels excessive. I also asked to take it to our department meeting, because I was not the first person there to do it.']
      ], 'A real error, disclosed without hedging, and the reflection is one specific habit I changed — not a promise to be more careful. Taking it to the department is what turns it from confession into practice.'),

      q4: e('A physiotherapist from Chennai, working in the UK.', [
        ['An example first', 'An older Somali woman on my caseload was not doing her rehabilitation, and I had assumed she was not motivated. When I booked a proper interpreter instead of using her son, it turned out she believed the exercises would damage the joint further and had not wanted to contradict me in front of him.'],
        ['What I changed', 'I stopped using family as interpreters unless the patient asks for it. And I now ask what someone believes is happening in their body before I explain what I think is happening.'],
        ['What I am still learning', nz
          ? 'I have read the material on Te Tiriti and Te Whare Tapa Whā and I understand the framework, but I have not practised in a system where it is built into how care is planned. I would want supervision on that early rather than assuming my UK experience transfers.'
          : 'I have not worked with Aboriginal and Torres Strait Islander patients and I am not going to pretend otherwise. I would want to know who the Aboriginal liaison team are in my first week, and to be told when I get something wrong.']
      ], 'It opens with one patient and a wrong assumption, not with a definition. The honesty at the end is stronger than a claim to expertise — and it names something concrete it wants from the employer.'),

      q5: e('A midwife in Cork.', [
        ['Situation', 'An obstetrician wanted to site a cannula and start syntocinon while I was still in the middle of the consent conversation. I did not think she had understood what was being proposed.'],
        ['What I did', 'I asked him to step outside with me rather than debating it at the bedside. I told him what worried me — that she was nodding rather than agreeing. He was frustrated, fairly, because the trace was not reassuring.'],
        ['Where it landed', 'We went back in together, he explained it in two sentences, and she asked three questions. Four minutes. I would still take it out of the room — not because I was right about the clinical picture, but because she needed to hear it from him.']
      ], 'The disagreement has real clinical substance, the other person is not made the villain, and the credit goes to how it was handled rather than to who turned out to be right.'),

      q6: e('An emergency nurse in Manila. One specific shift.', [
        ['Situation', 'A Saturday night, two staff short, and I was coordinating. At one point I had a query sepsis waiting on antibiotics, a mental health patient needing one-to-one, and an ambulance at the door.'],
        ['What I did', 'Antibiotics first, because the clock was running on those. I asked the ward to lend us a healthcare assistant for the one-to-one instead of trying to cover it myself, and told the paramedics plainly that it would be fifteen minutes before I could take handover.'],
        ['What I let go', 'The board did not get updated for two hours and the audit for that shift was incomplete. I told my manager on Monday rather than hoping she would not look.']
      ], 'One shift, named trade-offs, and something explicitly dropped. Saying what did not get done is exactly what makes the rest of it believable.'),

      q7: nz
        ? e('An occupational therapist from Cape Town. Four sentences, not a lecture.', [
            ['The structure', 'The twenty district health boards were amalgamated into Health New Zealand | Te Whatu Ora in 2022, so I would be joining one national organisation rather than a regional employer. A separate Māori Health Authority was set up alongside it and later disestablished, with that equity work brought back inside Te Whatu Ora.'],
            ['What it means for my work', 'National frameworks, but real regional variation in how services actually run. And ACC funds injury-related rehabilitation separately, which changes who pays for a large part of a caseload like mine.'],
            ['What I do not know', 'How referral thresholds work in practice between the two. That was one of the things I wanted to ask you.']
          ], 'Four sentences and it stops. It ends by naming a gap and turning it into a question, which is more convincing than an answer that sounds complete.')
        : e('An occupational therapist from Cape Town. Four sentences, not a lecture.', [
            ['The structure', 'Public hospitals are run by the state and territory health departments, so I would be employed by the state rather than by a national body, with Medicare funding care outside hospital and a substantial private sector alongside.'],
            ['What it means for my work', 'The public and private split matters for a caseload like mine — waiting lists move differently, and some patients I would see in the public system at home are seen privately here. NDIS funding sits behind a lot of community equipment.'],
            ['What I do not know', 'How activity-based funding affects the way a session gets counted. That was one of the things I wanted to ask you.']
          ], 'Four sentences and it stops. It ends by naming a gap and turning it into a question, which is more convincing than an answer that sounds complete.'),

      q8: e('A sonographer from Kerala, moving with a partner.', [
        ['What is honest', 'I have not done this before and I expect the first winter to be hard. My parents are in their seventies, and that is the part I have thought about most.'],
        ['What I have actually arranged', 'My partner has work lined up, we have visited once, and we have costed twelve months rather than three, so we are not making decisions out of panic in month four. There is a Malayali community in the city and I have already spoken to two people in it.'],
        ['Why I still want it', 'I have wanted to work somewhere sonographers report their own scans for a long time, and that is not available to me where I am. I know why I am doing this, which I think is the thing that gets people through the second month.']
      ], 'The hard part comes first, and that is what makes the preparation credible. Vague optimism is the answer panels actually worry about.'),

      q9: e('Any profession. Written on paper beforehand, three or four of them.', [
        ['About the work', 'What does the first six months look like for someone arriving from another system? Is there a supernumerary period, and who would I go to on a Tuesday afternoon when I do not know how something is done here?'],
        ['About the team', 'How long have the current team been in post? And what is the thing about working here that people complain about?'],
        ['About what happens next', 'When do you expect to decide, and who would be in touch? And would you be able to send the offer in writing before I need to respond to it?']
      ], 'Two about the work, one about the people, one that quietly gets the offer in writing. The question about what people complain about will tell you more than anything on their website.'),

      nursing_p1: e('A medical ward nurse in Lagos.', [
        ['Situation', 'An early warning score of 7 at 2am, respiratory rate climbing, and the on-call had not come after two calls in forty minutes.'],
        ['What I did', 'I rang again and used the words: I need you to come and see this patient now, and if you cannot, I am calling the outreach team. Then I called outreach anyway and started what I could within my scope — fluids up, bloods and cultures taken, sepsis clock documented — while I waited.']
      ], 'The escalation is specific down to the words used, and there is a parallel action rather than waiting for permission. Persistence, not politeness.'),

      nursing_p2: e('A surgical ward nurse in Warsaw. I was overruled.', [
        ['Situation', 'A man two days post-laparotomy was being pushed for discharge because the bed was needed. He was eating nothing, and his wife told me he lived alone up two flights of stairs. Nobody had recorded that.'],
        ['What I did, and where it went', 'I wrote it in the notes, said it on the ward round, and was overruled. So I asked the occupational therapist to see him that afternoon, and she stopped the discharge. He stayed two more days and went home with a package of care.']
      ], 'Being overruled is in the answer, and it is the strongest part — it shows what I did next, rather than that I always win the argument.'),

      nursing_p3: e('An oncology nurse in Athens.', [
        ['Situation', 'A daughter told me at the desk, in front of other families, that her mother had been left in a wet bed and that nobody was listening to her.'],
        ['What I did', 'Took her into the relatives’ room and let her finish before I explained anything. The immediate thing I could fix myself, and I did, that hour. What I could not do was answer for the previous shift, so I said so and arranged for the ward manager to ring her the next day. I documented what she told me and what I had said.']
      ], 'Listening before defending, a clear line between what I could fix and what I escalated, and the documentation mentioned without being made the point of the story.'),

      midwifery_p1: e('A midwife in Johannesburg.', [
        ['Situation', 'A woman at 41+3 declining induction and planning to continue at home. I thought she was underestimating the risk.'],
        ['What I did', 'I gave her the numbers as numbers — the actual stillbirth risk per thousand at 42 weeks — rather than telling her it was dangerous. Wrote down what I had said and that she had understood it. Offered daily monitoring instead of nothing, which she accepted. She laboured at 42+1 and I was her midwife.']
      ], 'Risk without coercion, documented, and the care continued unchanged. Nothing in it suggests I was owed her compliance.'),

      midwifery_p2: e('A midwife in Kuala Lumpur. A shoulder dystocia.', [
        ['Situation', 'Shoulder dystocia at 3am. I was the primary midwife.'],
        ['What I did', 'Called it out loud as shoulder dystocia rather than saying I needed help, got her flat into McRoberts, and gave the buzzer and the clock to the student so that someone was timing it. Baby out in three minutes with suprapubic pressure and an internal manoeuvre by the registrar. Cord gases were fine.'],
        ['Afterwards', 'I sat with her that afternoon and told her what had happened in the order it happened, because she had heard the room change and never understood why. And I went to the debrief.']
      ], 'It names my own role inside a team event, uses the actual language of the emergency, and includes the conversation afterwards — which is the part most people leave out.'),

      midwifery_p3: e('A midwife from Manchester, first year in Aotearoa.', [
        ['What I do', 'I ask at booking who she wants in the room and who she wants told, and I write the names down, because labour is too late to be working it out. If there is a request I do not understand, I ask her what it means rather than guessing or looking it up afterwards.'],
        ['The thing I had to learn', 'The whenua — that the placenta may be kept and returned to the family. I did not know that when I arrived. Now I ask every woman, and I know where the containers are kept on our unit.']
      ], 'A system for finding out rather than a claim to knowledge, and one concrete thing learned since arriving. Naming your own starting ignorance reads as safe, not weak.'),

      imaging_p1: e('A radiographer in Cairo.', [
        ['Situation', 'A CT abdomen requested on a 24-year-old woman with three weeks of vague pain, no examination findings written on the form, and no ultrasound done.'],
        ['What I did', 'Rang the referrer before the radiologist, because usually there is something that has not made it onto the form. There was not. So I asked whether ultrasound would answer the question. It did. I recorded the conversation on the request.']
      ], 'Justification treated as my own obligation, the referrer approached as a colleague rather than an obstacle, and an alternative offered instead of a flat refusal.'),

      imaging_p2: e('A radiographer in Bucharest.', [
        ['Situation', 'A chest film for a pre-employment check, and there was a rib lesion that did not look benign to me.'],
        ['What I did', 'Flagged it to the reporting radiologist before the patient left, rather than leaving a note on the worklist. I said nothing to the patient beyond that the doctor would look at it today — interpretation is not my scope, and half information at the door is cruel.']
      ], 'The scope line is unmistakable: I flagged, I did not diagnose. And it treats what to say to the patient as part of the clinical answer.'),

      imaging_p3: e('A radiographer in Amman.', [
        ['Situation', 'A man with dementia, in pain, an ankle series, and he would not keep the foot still or let me near it.'],
        ['What I did', 'Put the cassette down and stopped. Got his analgesia checked with the nurse, brought his daughter in from the corridor, and dropped from three projections to two, because a repeat would have cost more dose than the third view was worth. The second attempt worked.']
      ], 'Stopping is the answer, not persisting more gently. The dose reasoning shows a real trade-off rather than a claim to have got perfect images anyway.'),

      radtherapy_p1: e('A radiation therapist in Singapore.', [
        ['Situation', 'Week three of a head and neck course. A man crying on the couch, refusing the mask.'],
        ['What I did', 'We did not treat that day. Got him off the couch and out of the room first, then asked what had changed rather than reassuring him about mucositis. His wife had stopped driving him. Social work arranged transport, our nurse moved him to last on the list so he was not sitting in the waiting room, and he finished the course with one missed fraction.']
      ], 'The missed fraction is in the answer. Naming the real cause — transport, not the mask — is what makes it a story rather than a policy.'),

      radtherapy_p2: e('A radiation therapist in Toronto.', [
        ['Situation', 'The shift on the daily image was 8mm anteriorly, three days running, always the same direction.'],
        ['What I did', 'Stopped treating instead of correcting it again, because a systematic shift is not a set-up error. Escalated to the planner and the physicist. It was a bladder filling instruction that had never made it onto the patient’s card. Documented as a reportable event even though the delivered dose stayed within tolerance.']
      ], 'The reasoning behind stopping is the substance — a pattern, not a one-off. Reporting it despite no harm done is what a panel is listening for.'),

      radtherapy_p3: e('A radiation therapist in Melbourne.', [
        ['What I actually do', 'Name and site said out loud with the second therapist at the console, every patient — spoken, not read off the screen. And I do not carry the previous patient’s plan into the next set-up; I close it before I open the next one.'],
        ['When concentration goes', 'Around the eleventh patient on a Friday. I ask to swap console and couch with my partner rather than pushing through, and I say why.']
      ], 'Habits stated as habits, and an honest hour named. Saying when you get tired is more convincing than claiming steady vigilance for nine hours.'),

      sonography_p1: e('A sonographer in Nairobi.', [
        ['Situation', 'A dating scan at what she believed was ten weeks. No cardiac activity, and the measurements fitted about seven.'],
        ['What I did', 'Finished the scan properly first, including transvaginal, so nobody had to repeat it on her. Told her I could see something I was concerned about and that I wanted the doctor to speak with her now. I did not say the word, and I did not leave her alone in the room to work it out. Fetched the early pregnancy registrar in person rather than paging.']
      ], 'It separates what I say from what I document, and the care sits in small decisions — finishing the scan, not leaving her alone, going to get the doctor rather than sending a message.'),

      sonography_p2: e('A sonographer in Toronto.', [
        ['Situation', 'A renal study on a large patient with a lot of bowel gas. I got the right kidney. The left upper pole I never saw properly.'],
        ['What I did', 'Tried decubitus and a coronal approach, then wrote on the worksheet exactly what was and was not visualised and why, and suggested CT if the clinical concern stood. I asked a colleague to have five minutes with the probe before the patient dressed.']
      ], 'The limitation is written down rather than quietly hoped over, and a second pair of eyes is presented as normal practice rather than as failure.'),

      sonography_p3: e('A sonographer in Belfast, twelve years in.', [
        ['What I do', 'Bed height and chair set before every patient, not just the first one. Scanning arm supported. I do not do two vascular lists back to back if there is any way round it.'],
        ['Whether I have raised it', 'Yes. I asked for the sit-stand table in room two, and it took eleven months and a formal request through health and safety. I would do it again. I have had one episode of shoulder pain and I reported it rather than working through it.']
      ], 'The answer to “have you raised it” is yes, with what actually happened. Services here ask because they lose sonographers to injury, and “I just get on with it” is the wrong answer.'),

      medicine_p1: e('A medical registrar in Tehran.', [
        ['Situation', 'A consultant wanted to continue conservative management on a man whose lactate had doubled overnight. I thought he needed a surgical review that morning.'],
        ['What I did', 'Asked him to look at the trend with me on the screen rather than telling him my opinion — the numbers made the argument better than I could. He was not persuaded. So I said I was worried enough that I would like a surgical opinion for my own peace of mind, and asked whether he minded me making the call. He did not.'],
        ['Where it landed', 'He went to theatre that afternoon. My consultant and I talked about it afterwards and it did not damage the relationship, I think because I never made it a question of who was right.']
      ], 'A graded escalation that does not depend on winning, and the actual phrasing used at the moment of disagreement. That phrasing is what the panel is listening for.'),

      medicine_p2: e('A physician in Mumbai.', [
        ['Preparation', 'Read the notes and the imaging first so I was not looking things up in front of her. Found a room. Asked the nurse who had been with her all week to come in.'],
        ['What I did', 'Asked what she already understood, then said the word — spread, not shadows. Then stopped talking for what felt like a long time. She asked how long, and I told her I did not know, and that I would find who could tell her better.'],
        ['Afterwards', 'Wrote in the notes which words I had used, so the next person did not contradict me. And told my registrar I had found it hard, which I would not have done a few years ago.']
      ], 'Preparation, the actual words, silence used on purpose, and one line about looking after myself. Panels notice all four when they are missing.'),

      medicine_p3: e('A consultant in Colombo.', [
        ['The habits', 'Fifteen minutes at the end of the ward round, sitting down, one case. Not “come to me if you have questions”, because nobody does. And I let the house officer present to the family with me in the room instead of doing it for them.'],
        ['When the service is under pressure', 'Teaching is the first thing to go and I will not pretend otherwise. So I protect the fifteen minutes and give up the audit meeting instead. I tell them that is what I have done, so it does not look like I have lost interest.']
      ], 'Small, concrete, and honest about what gets sacrificed. “I always make time” is not believable to anyone who has run a busy ward.'),

      psychology_p1: e('A clinical psychologist in Lisbon.', [
        ['Situation', 'A young man disclosed a plan and a means, and asked me not to tell his GP because his mother would find out.'],
        ['What I did', 'Told him what I was going to do before I did it, and why, in the session — not afterwards by letter. Gave him the choice of being in the room while I rang. He chose to be. We agreed in advance what I would and would not say about his family.'],
        ['Afterwards', 'He came back the following week, which I did not take for granted. Most of that session went on what it had felt like to have me override him.']
      ], 'The limit of confidentiality is handled in the room and in advance, and the relationship afterwards is treated as clinical work rather than as a happy ending.'),

      psychology_p2: e('A psychologist trained in South Africa.', [
        ['Where my training assumes something', 'CBT as I was taught it assumes the individual is the unit of change, and that distress is something you discuss with a stranger. Neither is a given for many of the people I have worked with.'],
        ['What I change', 'I ask who else needs to be part of this before I start. I have run whole sessions with a sister present. And I stopped treating the standard measures as more than a rough tracker when the norms plainly did not fit the person.'],
        ['Supervision', 'I take my own discomfort to supervision specifically. The moments I have caught myself calling someone resistant are usually the moments I had missed something cultural.']
      ], 'It questions the training rather than the clients, and names a concrete change in practice. Using supervision on your own reactions is a strong signal to a panel.'),

      psychology_p3: e('A psychologist in Auckland, second year post-qualification.', [
        ['Situation', 'Eighteen sessions with a woman with chronic pain and nothing shifted. I kept going partly because I liked her and did not want to be the next person who gave up on her.'],
        ['What I did with it', 'Took it to supervision, and my supervisor asked whose need the eighteenth session was meeting. I had not asked her in months whether this was still useful. When I did, she said she would have stopped at about session eight.'],
        ['What I do differently', 'I review the formulation out loud with the client at six sessions, every time, with a genuine option to stop.']
      ], 'The failure is mine and specific, and the change is a rule I now follow. Nobody is asking for a story that resolves well.'),

      anaesthetic_p1: e('An anaesthetic technician in Cape Town.', [
        ['What I do beforehand', 'Read the list the evening before and look up anything I have not set up for. For a case I do not know, I ask the anaesthetist what they want available rather than guessing from the procedure name — positioning, airway plan, whether they want the difficult airway trolley in the room or outside it.'],
        ['What I confirm rather than assume', 'Which side. Blood availability. That the specific blade they like is actually in the room, in my hand, working.']
      ], 'It draws a line between preparation and assumption, and the last sentence is physical and checkable rather than a statement of good intent.'),

      anaesthetic_p2: e('An anaesthetic technician in Dublin.', [
        ['Situation', 'The ventilator alarmed and failed mid-case. Prone spinal patient.'],
        ['What I did', 'Said “ventilator failure, going to bag” out loud so the whole room knew, handed over the self-inflating bag, switched to the back-up cylinder, and brought the spare machine in from the corridor while the anaesthetist ventilated by hand. Under a minute.'],
        ['Afterwards', 'Machine tagged and quarantined, not wheeled back into the pool. Incident form the same day. It turned out to be a bellows seal, and two other machines were the same age, so all three were checked.']
      ], 'The words said out loud, the sequence, and the machine quarantined rather than returned. The systemic follow-up is what lifts it above a good story.'),

      anaesthetic_p3: e('An anaesthetic technician in Riyadh. I was the most junior person in the room.', [
        ['Situation', 'The surgeon started to drape before the anaesthetist had confirmed the block was working.'],
        ['What I did', 'I said: sorry, can we hold the drapes — has the block been checked? Out loud, to the room, not to him. He was irritated. The block had not taken on the medial side, and it was topped up before we started.']
      ], 'The exact words are in the answer, and they are short and neutral. It also admits the irritation, which is what makes it sound like something that really happened.'),

      physio_p1: e('A physiotherapist in Nicosia.', [
        ['Situation', 'A man six weeks after a knee replacement, doing none of his home exercises. I had given him more of them at the previous appointment, which had not helped.'],
        ['What I did', 'Asked what got in the way. He was the sole carer for his wife and could not get twenty uninterrupted minutes. So we cut it from six exercises to two, attached to something he already did — sit-to-stands while the kettle boiled. He did those.']
      ], 'Finding out why before pushing harder, and goals renegotiated downwards. It admits the first plan was mine and wrong for him.'),

      physio_p2: e('A physiotherapist in Accra.', [
        ['Situation', 'Three sessions treating what I had reasoned was a mechanical low back. The pain was not behaving — worse at night, unrelated to movement, and he had lost weight he could not account for.'],
        ['What I did', 'Stopped treating, and told him why. Rang the GP the same day rather than writing. It was a myeloma.']
      ], 'Short, and the change of mind is the whole answer. Recognising when to stop treating is what the question is actually asking about.'),

      physio_p3: e('A physiotherapist in Wellington, acute respiratory rotation.', [
        ['What I do', 'Triage by who deteriorates without me, not by who has waited longest. Post-op chests and the ones at risk of readmission first. A straightforward mobilising patient gets seen by the assistant with my instructions.'],
        ['What I escalate and document', 'I email my clinical lead the list of who I did not see and why, weekly. In writing. Partly to protect the patients, and partly so the gap is visible when the establishment gets reviewed.']
      ], 'A named triage principle rather than “I prioritise”, and unmet need documented deliberately. The second half is what a manager wants to hear.'),

      ot_p1: e('An occupational therapist in Delhi.', [
        ['Situation', 'An 82-year-old woman after a hip fracture wanted to go home. Her son wanted residential care and told me so in the corridor before I had seen her.'],
        ['What I did', 'Saw her on her own first. Her goal led — she had capacity. I did not pretend the disagreement was not there; I named it in the family meeting and asked the son what specifically he was frightened of. It was the stairs at night. We solved that particular thing.']
      ], 'Whose goals lead is answered plainly, and the family stays on board because their fear is taken seriously rather than overruled.'),

      ot_p2: e('An occupational therapist in Bristol.', [
        ['Situation', 'A man discharged home on a Friday afternoon before the equipment had been delivered and before I had done the access visit. Bed pressure.'],
        ['What I did', 'Said in the meeting that I could not support it, and gave my reason in one sentence. I was not the decision-maker. So I wrote in the notes exactly what I had said and recommended, rang his daughter myself to explain what was not yet in place, and arranged a next-day visit.'],
        ['What happened', 'He managed. That does not make the decision a safe one, and I still raised it afterwards as a governance issue.']
      ], '“He was fine” is not allowed to be the conclusion. Recording your recommendation when you are overruled is the professional move this question is looking for.'),

      ot_p3: e('An occupational therapist in Harare.', [
        ['How I prioritise', 'Risk of harm first — transfers and toileting before anything to do with comfort or leisure. Then whatever unlocks the most independence per dollar, which is usually a rail rather than a chair.'],
        ['Creative alternatives, honestly', 'We built raisers from treated timber to a measured height rather than wait eight months for a chair. I would tell you that at interview, because I do not want to give the impression everything was ideal.'],
        ['Advocating without overpromising', 'I never tell a family something is coming until it is ordered. I tell them what I have asked for, and what I have been told about the wait.']
      ], 'A stated hierarchy, an honest workaround, and a rule about what you promise families. That last one matters more than the improvisation.'),

      speech_p1: e('A speech and language therapist in Auckland.', [
        ['Situation', 'A man after a stroke, aspirating on thin fluids, who wanted his tea normal and said he would rather take the risk.'],
        ['What I did', 'Assessed capacity properly rather than assuming the stroke had taken it. It had not. Described what aspiration pneumonia would actually be like for him instead of calling it a risk. Documented an informed decision to eat and drink at risk, agreed it with the medical team and the family, then set up the safest version of what he wanted: upright, small sips, someone with him.']
      ], 'Capacity assessed, risk described in real terms, and the care continues on his terms. It shows the difference between a refusal and a decision.'),

      speech_p2: e('A speech and language therapist in Karachi.', [
        ['What I do', 'Train the family, because I see him twice a week and they see him all day. Specific things: wait ten seconds, do not finish his sentence, ask questions he can answer in one word when he is tired.'],
        ['Expectations and pacing', 'I do not tell them how much language will come back, because I do not know. I tell them what we will know by when. And I give one thing at a time — a folder of strategies on day one gets read by nobody.']
      ], 'Concrete instructions rather than “I educate the family”, and honest about prognosis. Pacing the information is the detail that shows experience.'),

      speech_p3: e('A speech and language therapist in Birmingham.', [
        ['What does not transfer', 'Standardised norms. A Sylheti-speaking four-year-old scoring low on an English test tells me about her exposure to English, not her language ability, and I will not conclude a disorder from it.'],
        ['How I work', 'A trained interpreter, not a family member, briefed beforehand on what I need — interpret exactly, including the errors, rather than tidying the child up. Language history first: what is spoken to her, by whom, since when.'],
        ['What I avoid concluding', 'Difference is not disorder. If I only have information in one language, I write in the report what my assessment can and cannot support.']
      ], 'It names the actual problem with the test, the interpreter is briefed rather than merely present, and the report carries the limitation. That last line is the standard the question is testing.'),

      pharmacy_p1: e('A hospital pharmacist in Valletta.', [
        ['Situation', 'Methotrexate written as daily rather than weekly on a discharge prescription, by a consultant.'],
        ['What I did', 'Did not dispense. Rang him directly and led with the question rather than the accusation — is this intended as weekly? He was certain for a moment, then saw it. I stayed on the phone until it was changed on the system, not just agreed verbally.'],
        ['If I am brushed off', 'That has happened to me on something smaller. I escalated to the on-call consultant, and I would do the same on anything I thought would cause harm. I filed the near miss either way, which is the part that stops it being about the individual.']
      ], 'The phrasing that lets a senior person correct themselves, the change confirmed rather than promised, and the near miss reported regardless of how it went.'),

      pharmacy_p2: e('A pharmacist in Bangalore.', [
        ['Situation', 'A woman refusing a statin because her sister had muscle pain on one.'],
        ['What I did', 'Asked what she had heard before correcting any of it. Gave her the actual numbers on muscle symptoms, and told her what we would do if she got them — stop, check, try a different one. Offered a lower starting dose, which is not what the guideline says, but it was what she would take. Wrote to the GP with what we had agreed.']
      ], 'The objection is understood before it is answered, and the compromise is named as a compromise. Referring back closes the loop rather than leaving it with me.'),

      pharmacy_p3: e('A pharmacist newly arrived from the UK.', [
        ['What I assume differs', 'Brand names, what is actually funded, which strengths exist, and the local guideline. I have already found that a drug I dispensed daily is not on the schedule here.'],
        ['How I check', 'I look it up every time for the first few months rather than trusting recall — the funding schedule, the local antimicrobial guideline, the hospital’s own protocol. And I say out loud to the team that I am new to the formulary, so people correct me early.']
      ], 'Naming the specific categories of difference is far more convincing than promising to be careful, and telling the team you are new is a safety behaviour, not a weakness.'),

      other_p1: e('A dietitian from Toronto, first application to a hospital here.', [
        ['What I looked up', 'Our scope statement, the competency standards, and two position descriptions from your service. The scope is wider here on prescribing feeds than where I trained, and narrower on some of the ordering I used to do.'],
        ['How the role sits in the team', 'From the job description, you sit inside allied health with a single referral point rather than being ward-attached, which means taking referrals I have not triaged myself. I would want to know how that filtering works in practice.']
      ], 'It names the actual documents read and one specific difference found. Ending on what you still do not know turns preparation into a conversation.'),

      other_p2: e('A clinical coder from Cape Town.', [
        ['What I expect to differ', 'The classification version and the local coding standards, how much clinician documentation I can rely on, and the funding consequences of what I code — which are not the same consequences as at home.'],
        ['How I plan to find out', 'By asking to be corrected for the first three months, and by reading the local standards before I arrive rather than after. They are public and I have started.']
      ], 'Specific categories rather than a promise to be adaptable, and evidence of having begun already.'),

      other_p3: e('A perfusionist in Chennai.', [
        ['Situation', 'Asked to cover an ECMO retrieval with a circuit configuration I had only ever seen set up, never set up myself.'],
        ['What I did', 'Said so, out loud, to the consultant before we left rather than after we arrived. Asked for the checklist and read it in the ambulance. Told her which parts I wanted her to watch me on.'],
        ['What I learned', 'That saying what you cannot do buys you supervision, and saying nothing buys you a mistake. I do the same now with anything I have only seen once.']
      ], 'The declaration comes before the task, not after the problem. That sequence is the whole answer.')
    };
}

function workedMore(dest) {
    const nz = dest === 'nz';
    const e = (setting, beats, why) => ({ setting: setting, beats: beats, why: why });
    return {
      q10: e('A theatre nurse in Lisbon, on a value the service calls courage.', [
        ['What it means in practice', 'On your website courage is described as speaking up when something is not right. Most days that is not dramatic — it is asking a question in front of six people when everyone else has already moved on.'],
        ['The example', 'A swab count was two out at the end of a case and the surgeon had started closing. I said the count was wrong and I needed us to stop. It was in the drapes. Four minutes.'],
        ['The honest bit', 'I have also not spoken up when I should have — once about a colleague’s handover, and it stayed with me. That is how I know what it costs.']
      ], 'It defines the value in ordinary terms before giving the example, which is what “in practice” is asking for. The admission at the end is what stops it sounding rehearsed, and values-based panels are listening for exactly that.'),

      star_s5: e('A charge nurse in Porto. A rostering change.', [
        ['Situation', 'Management moved us from eight-hour to twelve-hour shifts. I thought it was unsafe on a busy medical ward and I said so during consultation.'],
        ['What I did', 'Once it was decided I stopped arguing it in front of the team, because a charge nurse undermining a roster makes it worse for everyone. I asked for two things instead: a break policy someone actually enforced, and a review at six months with sickness data attached. I collected that data myself.'],
        ['How it ended', 'At six months two other wards went back. Ours did not, and the data did not support me.']
      ], 'It separates disagreeing before a decision from undermining after it, and the review is asked for with evidence attached. The ending — the data did not support me — is what makes the rest believable.'),

      star_s7: e('A district nurse in Cork.', [
        ['Situation', 'A man in his eighties refusing admission for cellulitis, living with his daughter, who was doing all his care.'],
        ['What I did', 'Asked him first whether he wanted her in the conversation, then had it with both of them rather than telling her afterwards in the hall. Asked her what she felt able to manage. She said the dressings but not the nights, and that changed the plan.'],
        ['How it ended', 'He stayed home with twice-daily visits and a night sitter twice a week. He was clear it was his decision, and she was clear about what she had agreed to — which is the part that stops it collapsing in week three.']
      ], 'Consent to involve the family is asked for first, and the daughter is asked what she can manage rather than told what will happen. That is the whole difference between involving and informing.'),

      nursing_p4: e('An agency nurse in Dubai.', [
        ['Situation', 'I gave the long-acting insulin instead of the short-acting one. I realised as I put the pen down.'],
        ['What I did', 'Told the patient, rang the doctor within two minutes, started the hypoglycaemia protocol and hourly blood sugars for the rest of the shift. Filed the form before I went home rather than the next day, and told my manager myself before she heard it from anyone else.']
      ], 'The order is the answer: patient first, disclosure second, paperwork third, and your manager hears it from you.'),
      nursing_p5: e('A ward nurse in Bucharest.', [
        ['What I delegate', 'Observations, personal care, feeding assistance, positioning — with the specific thing I need to know attached. Tell me if his sats drop below 92, not tell me if he looks unwell.'],
        ['What I do not', 'Anything needing an assessment, or a judgement about whether to escalate. And never the first set of observations after a change in condition, because I want to see that one myself.']
      ], 'The instruction carries its own check-back, and the line about the first set of observations is the kind of detail nobody invents.'),
      nursing_p6: e('A charge nurse in Manila.', [
        ['Situation', 'A new graduate crying in the sluice after a death she had been present for. Her first.'],
        ['What I did', 'Took her handset, sat with her for ten minutes, covered her patients while she went outside. Then asked her again the next day, and again a week later — the second and third conversations are the ones that matter. I told her what I still carry from my first.']
      ], 'The follow-up a week later is why this answer works. Anyone can be kind in the moment; the panel is listening for whether you came back.'),
      nursing_p7: e('A nurse in Cape Town.', [
        ['My structure', 'ISBAR, at the bedside where the patient can hear and correct me, using her own words about her pain rather than my summary of them.'],
        ['When the one I receive is poor', 'I ask the questions I need answered before that person leaves the ward, not afterwards by phone. I have twice had to say I am not taking this handover yet, and both times something important came out.']
      ], 'A named structure, and then what happens when the handover you get is inadequate. That second half is what most answers miss.'),
      nursing_p8: e('A ward nurse in Athens.', [
        ['Situation', 'A colleague signing for medications she had not seen given. Once could be a slip. It was three times in a fortnight and I had written down the dates.'],
        ['What I did', 'Spoke to her first, on her own, because if it was pressure of work I did not want to make it a disciplinary matter. It continued. So I took the dates to the charge nurse and said what I had seen and what I had already done. I did not discuss it with anyone else on the ward.']
      ], 'The pattern is documented before it is raised, the person is spoken to first, and the answer makes a point of not gossiping. Panels test that last part.'),
      nursing_p9: e('A nurse from Manchester, six weeks in.', [
        ['What was hardest', 'Not knowing what normal looked like. I could not tell whether a shift was busy or falling over, so I did not know when to ask for help — I read everything as fine until it was not.'],
        ['What I did about it', 'Asked one senior nurse to be the person I checked with, and told her I would rather ask ten stupid questions than one late one. I also asked her to tell me when I was over-escalating, and she did.']
      ], 'The difficulty is specific to arriving rather than generic, and the fix is a named person. Asking to be told when you are wrong is a strong close.'),
      nursing_p10: e('An emergency nurse in Wellington.', [
        ['What works', 'Not driving straight home after nights — twenty minutes with a coffee somewhere first. Booking the whole year’s leave in January, because otherwise it does not happen. And asking for the debrief rather than waiting for one.'],
        ['What does not', 'Telling myself I am fine. I did that for two years and came out of it a stone lighter and not sleeping. I would rather say that than give you a list of hobbies.']
      ], 'Two specific habits and one honest failure. It answers the question actually being asked, which is whether you will still be here in three years.'),

      midwifery_p4: e('A midwife in Bristol.', [
        ['Situation', 'A second-time mother whose first birth ended in a category one section she described as being done to her.'],
        ['What I did', 'Read the notes and her debrief before the appointment so she was not telling it from scratch again. Asked one question — what would you want to happen differently? It was being told what was happening while it happened. That went at the top of her plan in her own words, and I asked her to keep a copy in her bag.']
      ], 'The preparation happens before she arrives, and her words go into the plan rather than my summary of them. One question, not a history-taking.'),
      midwifery_p5: e('A midwife in Auckland.', [
        ['Situation', 'A woman declining all monitoring, vitamin K and screening, planning a home birth after a previous postpartum haemorrhage.'],
        ['What I did', 'Went through each one separately rather than treating it as a single decision — they carry different risks, and she accepted two once we did. Documented each. Said plainly which one worried me and why, once, not repeatedly, because nagging is how women stop telling you things.']
      ], 'Unbundling the refusals is the practical move, and the line about nagging shows why the relationship is itself a safety measure.'),
      midwifery_p6: e('A midwife in Durban.', [
        ['Situation', 'Second stage, the registrar wanting to move to theatre, and she had asked me beforehand to say she wanted twenty more minutes if it came to this.'],
        ['What I did', 'Said it out loud, once, as her request rather than my opinion — she has asked for twenty minutes and the trace supports it. We agreed fifteen. Then I stayed at her head telling her what people were doing as they did it.']
      ], 'It advocates by carrying her words rather than substituting an opinion, and the compromise is accepted rather than fought. The last line is the part panels remember.'),
      midwifery_p7: e('A midwife in Kuala Lumpur.', [
        ['In the room', 'Ask what she wants to know before telling her anything, and ask whether she wants to hold him — offered more than once, because the answer changes over hours. Photographs and hand prints taken whether or not she wants them now, because in six months she might.'],
        ['Afterwards', 'I finished the paperwork before I went home rather than leaving it to someone who was not there. I went to the debrief, and I took the next day as leave, which I would ask for again.']
      ], 'Offered more than once, and the mementoes taken for a future she cannot imagine yet. Asking for the next day off is not weakness here, it is judgement.'),
      midwifery_p8: e('A midwife from the UK, new to caseloading.', [
        ['What I have set up', 'A back-up midwife agreed in writing, with both women told her name. A cap on how many women I take a month rather than taking whoever asks. Two weeks off in every twelve, planned at the point I take the booking rather than later.'],
        ['The honest part', 'I have not worked a caseload before and I expect to get the number wrong at first. I would rather start under and add than burn out in month four.']
      ], 'Named back-up, a cap and planned leave — all things a panel can check. Admitting you will get the number wrong is more reassuring than confidence about a model you have never worked.'),
      midwifery_p9: e('A midwife from Cape Town.', [
        ['What I understand', nz
          ? 'Most women choose a lead maternity carer who follows them through pregnancy, labour and six weeks afterwards, and a good number birth in primary units rather than a hospital with an obstetrician on the floor.'
          : 'A mix of continuity models, publicly funded hospital care and private obstetric care, with midwifery group practice where it is available and shared care with GPs in a lot of regional areas.'],
        ['What that changes for me', 'I would be making decisions on my own more often, further from help, and transferring rather than walking down a corridor. That is what I would want supervision on, and it is also why I want the job.']
      ], 'It states the model correctly in two sentences, then says what is harder about it for someone from a hospital system. Naming what you would need support with is the strong move.'),
      midwifery_p10: e('A midwife in Cork.', [
        ['Situation', 'A partner complained in writing that I had ignored him throughout the labour. Reading it, I recognised it — I had been focused on her and the baby and had not spoken to him in two hours.'],
        ['What I did', 'Did not explain the clinical reasons, because he had not asked about them. Said what I had done and that I could see how it had felt. Asked to meet, and he came. I now say one thing to the partner at the start about what I will and will not be able to tell them while it is busy.']
      ], 'The complaint is accepted as accurate rather than answered with clinical justification, and it produced a permanent change of practice. That is the whole test.'),

      imaging_p4: e('A radiographer in Riyadh.', [
        ['Situation', 'A woman for an abdominal CT after a fall who told me at the door that she might be pregnant.'],
        ['What I did', 'Stopped there rather than proceeding on a maybe. Asked her again privately, away from her husband, in case the answer was different. It was not. Got the referrer and radiologist to agree ultrasound first, and recorded the dates, the conversation and who agreed the change.']
      ], 'The private ask is the detail that makes it real. Stopping on a maybe instead of reasoning around it is what the question is testing.'),
      imaging_p5: e('A radiographer in Bucharest.', [
        ['What I actually do', 'Collimate to the anatomy rather than to the cassette, check the exposure index on every image rather than at audit, and use paediatric protocols by weight rather than by age, because a heavy four-year-old is not a four-year-old.'],
        ['Repeats', 'I record my own. My repeat rate was 4% and almost all of it was the lateral elbow, so I changed how I position the arm rather than resolving to try harder.']
      ], 'Numbers, and one specific projection. Recording your own repeat rate is something very few candidates say and every panel notices.'),
      imaging_p6: e('A radiographer in Lagos.', [
        ['My role', 'Detector under the chest before the team crowds in, standing at the head end, and I say out loud that I am exposing rather than assuming everyone is protected.'],
        ['Sequencing', 'Chest and pelvis if that is what is asked for, then out of the way and back later. I have learned to ask the team leader for ten seconds rather than take them.']
      ], 'It shows awareness of a crowded room and one piece of etiquette — asking for the pause rather than taking it.'),
      imaging_p7: e('A radiographer in Amman, three years qualified.', [
        ['Situation', 'A radiologist sent a series of my hip images back as inadequate. I was embarrassed, because I thought they were fine.'],
        ['What I did', 'Asked her to show me on the screen rather than take it by email. She showed me what she needed to see and could not, and it took four minutes. I position that projection differently now.']
      ], 'Going to the person rather than being defensive by email, and the change is specific to one projection. Naming the embarrassment does no harm.'),
      imaging_p8: e('A radiographer from Manila.', [
        ['What I expect to differ', 'Fewer staff per room and more autonomy. From the job description I would be running a room alone on evenings, and I have always had a second radiographer.'],
        ['What I would do about it', 'Ask what the escalation route is on a night shift before my first one, and who I ring when equipment fails at 2am — rather than finding that out at 2am.']
      ], 'A structural difference taken straight from the job description, and a practical question that shows thinking past day one.'),
      imaging_p9: e('A radiographer in Cairo.', [
        ['What I do', 'Name, date of birth and a third identifier from the patient’s own mouth, not the wristband alone, matched against the request in front of me.'],
        ['When they cannot confirm', 'Checked with the escort and the notes, and I record who confirmed it. For a confused patient I explain each part again as we go, because consent at the door does not cover me twenty minutes later when I need to move a painful limb.']
      ], 'Consent treated as continuing rather than as a signature, and the detail of recording who confirmed identity.'),
      imaging_p10: e('A radiographer in Bucharest.', [
        ['What I have done', 'A CT rotation two days a fortnight to hold the competency, and the theatre list once a month, because image intensifier skills go quickly if you do not use them.'],
        ['The honest part', 'MRI I have not done in four years and I would not claim it. If the role needs it I would want a structured period of supervised practice rather than a place on the roster.']
      ], 'It names what has gone stale and refuses to claim it. Panels here are more reassured by that than by a list of everything you have ever touched.'),

      radtherapy_p4: e('A radiation therapist in Toronto.', [
        ['What I do', 'Tell them at the first fraction what will probably happen by week two, and what to tell us about rather than wait for review — that is the useful part. I do not read the consent form back to them; they have already had it.'],
        ['Where my scope ends', 'Anything about prognosis or whether it is working goes back to the oncologist, and I say that plainly rather than guessing to be kind.']
      ], 'Information paced to the week it will matter, and a clear refusal to answer prognosis. Both are what the question is about.'),
      radtherapy_p5: e('A radiation therapist in Melbourne.', [
        ['How I query a plan', 'I ring rather than email if it affects today’s treatment, and I say what I have seen and what I have not concluded — the shift is systematic, I have not treated, can you look.'],
        ['What I never do', 'Adjust a plan or a field at the console. I have been asked to and I said no. It is not my authority, and the record has to match the plan.']
      ], 'It draws the authority line explicitly and includes having refused. That refusal is the answer to a question about professional boundaries.'),
      radtherapy_p6: e('A radiation therapist in Singapore.', [
        ['What we do', 'The same two therapists every day for that child, rostered deliberately. Mask made with the play specialist over three visits rather than one. And he presses the intercom to start it, because it is the only bit of control available to him.'],
        ['The parents', 'One parent in the control room every fraction, and I tell them what they are about to see on the monitor before they see it.']
      ], 'Consistency treated as a clinical intervention, and one small transfer of control to the child. Neither is written in any protocol.'),
      radtherapy_p7: e('A radiation therapist in Toronto.', [
        ['Situation', 'A colleague treating without the second therapist at the console, on a busy Friday.'],
        ['What I did', 'Said it in the moment — I need to be here before you treat — rather than raising it afterwards, because afterwards means it already happened. She was annoyed. It happened once more, and I told our team leader, having told her I was going to.']
      ], 'In the moment, then escalated with the person told first. Naming the annoyance is what makes it credible.'),
      radtherapy_p8: e('A radiation therapist in Melbourne.', [
        ['Situation', 'Cone beam at week three on a lung patient, and the volume had changed shape enough that the plan no longer fitted it.'],
        ['What I did', 'Did not treat. Escalated to the registrar and the planning team the same morning. Told the patient we wanted to re-check the plan, which was true and not frightening. Replanned in two days, one fraction lost.']
      ], 'Not treating is the decision, and the sentence said to the patient is honest without being alarming. The lost fraction is stated rather than hidden.'),
      radtherapy_p9: e('A radiation therapist from Manchester.', [
        ['What I understand', 'Treatment is concentrated in a small number of regional centres, so many patients travel a long way and stay in accommodation for the whole course, and there are wait-time expectations running from decision to treat.'],
        ['What that changes', 'A missed fraction is not a small thing for someone living away from home to have it. Scheduling and the order of the list carry weight here that they did not where I trained.']
      ], 'It draws a practical consequence instead of listing facts. Consequences are what show you actually understood the system.'),
      radtherapy_p10: e('A radiation therapist in Singapore, eleven years in.', [
        ['What works', 'I go to the funerals I want to go to and not the ones I feel obliged to. And I keep a note of the people who finished treatment and went home well, because you remember the other ones without trying.'],
        ['What does not', 'Pretending it does not accumulate. I had six months of being short with everybody and I did not connect it to work until my partner did.']
      ], 'Two specific, unusual habits and one honest failure. It answers the question actually being asked, which is whether you will still be here in three years.'),

      sonography_p4: e('A sonographer in Nairobi.', [
        ['What I say', 'I tell them what I am doing, and who will explain it and when — usually today. If they press, I say I am not the person who interprets it, which is true, rather than telling them I cannot see anything.'],
        ['Why not more', 'A half-answer on the couch becomes the thing they remember for a week. And I have been wrong before about what mattered on an image.']
      ], 'It gives the actual form of words and the reason for the limit. The admission of having been wrong is what makes the caution sound professional rather than evasive.'),
      sonography_p5: e('A sonographer in Toronto.', [
        ['What I do', 'Tell the waiting room myself rather than leave reception to absorb it, and give them a real number. I shorten the conversation, not the scan.'],
        ['What I will not do', 'Leave out the parts of a protocol that make it a complete study. If the list cannot be done properly I say at the start of the session which ones need to move, rather than at the end when it is everybody’s problem.']
      ], 'The line is drawn at the scan itself, and the problem is moved forward in time rather than absorbed. Telling the waiting room yourself is a small thing panels notice.'),
      sonography_p6: e('A sonographer in Belfast.', [
        ['Situation', 'An abdominal scan on a man with advanced dementia who could not lie flat or hold still.'],
        ['What I did', 'Scanned him semi-upright in the chair he arrived in, with his son’s hand where I needed the pressure steady. Got the gallbladder, which was the question. Recorded that the aorta and pancreas were not assessed, and why.']
      ], 'The clinical question is answered and the gaps are written down. Adapting the position rather than the patient is the whole move.'),
      sonography_p7: e('A sonographer in Toronto.', [
        ['What I do', 'Store images of the negatives, not only the findings — an image of a normal appendix area is what proves I looked. Anything I am going to write down gets measured twice.'],
        ['The six-month test', 'I write the worksheet as though someone will read it without me in the room, because in a complaint that is exactly what happens.']
      ], 'Storing the negatives is the specific, checkable habit. The six-month test states a principle as a habit rather than as a value.'),
      sonography_p8: e('A sonographer in Belfast.', [
        ['What I do', 'The student drives and I talk, rather than the other way round — you cannot learn probe handling by watching. One patient in three on a routine list, chosen in advance so the patient is told when they book in.'],
        ['The cost', 'It adds about twenty minutes an hour and I say so, because pretending supervision is free is how it quietly stops happening.']
      ], 'One in three, chosen in advance, and the cost stated in minutes. Naming the cost is what makes the offer credible to a manager.'),
      sonography_p9: e('A sonographer from Kerala.', [
        ['What I expect', 'Sonographers here write a report or a detailed technical summary that the radiologist works from. That is more autonomy than I have had. And the workforce is short, so lists are long.'],
        ['What I would ask for', 'A period where my reports are checked before they go out, and to be told the local phrasing conventions — a report reads differently in every country.']
      ], 'It identifies the real scope difference and asks for exactly the right thing: checked reports early, rather than a general promise to be careful.'),
      sonography_p10: e('A sonographer in Toronto.', [
        ['Situation', 'A twenty-week scan where I could not see the left kidney, with an appearance I thought was more than that.'],
        ['What I did', 'Completed the whole examination properly, including the images someone else would need to review it. Told her I wanted a second opinion today, and got the fetal medicine sonographer into the room within ten minutes rather than making her wait a week. I did not name what I thought it was — I was not the person who could confirm it, and I turned out to be partly wrong.']
      ], 'It finishes the study, closes the waiting time to minutes, and stays inside scope. Saying you were partly wrong is the most persuasive line in it.'),

      medicine_p4: e('A medical registrar in Colombo.', [
        ['Situation', 'A night covering four wards: a GI bleed, a query stroke inside the thrombolysis window, and eight jobs on the list.'],
        ['What I did', 'Stroke first, because that window closes and the bleed was stable on two units. Rang the on-call to take the jobs list, and told the nurses which two things to interrupt me for and which could wait. Sat down at 5am and wrote the handover rather than giving it verbally.']
      ], 'A stated triage principle — the closing window — and explicit permission to the nurses about what to interrupt. Writing the handover rather than saying it is the detail.'),
      medicine_p5: e('A physician in Mumbai.', [
        ['Situation', 'A family asking for full escalation for a man with advanced pulmonary fibrosis. He was not asking; they were.'],
        ['What I did', 'Asked what they hoped the next admission would achieve. What they wanted was for him not to be frightened at the end, which is not intensive care, and is something I could actually promise. We agreed a ceiling and I wrote it where the night team would find it.']
      ], 'It finds the need behind the request and answers that instead. Documenting the ceiling where the night team will find it is the practical half.'),
      medicine_p6: e('A medical registrar in Tehran.', [
        ['What I do', 'Ask the nurse who has had him all shift what has changed before I read the observation chart, because the chart is behind her. And I tell them my plan, including what would make me want to be called.'],
        ['The habit that matters', 'If a nurse tells me she is worried and I cannot find a reason, I go and look. That has saved me three times and inconvenienced me maybe twenty.']
      ], 'The three-against-twenty line is the answer. It shows a rule followed even when it costs, rather than a stated respect for colleagues.'),
      medicine_p7: e('A consultant in Colombo.', [
        ['What I did', 'Audited door-to-antibiotic times in neutropenic sepsis. Median 140 minutes, and the reason was that the drug was not stocked on the ward. Got it stocked. Re-audit at six months: 46 minutes.'],
        ['The habit', 'One audit a year that I choose because it annoys me, rather than one that is assigned to me.']
      ], 'Numbers before and after, and a cause that turned out to be logistical rather than clinical. Choosing the audit yourself is the line that stands out.'),
      medicine_p8: e('A medical registrar in Dublin.', [
        ['Situation', 'A colleague I could smell alcohol on at a morning handover. Once.'],
        ['What I did', 'Did not let it go, and did not confront him in front of the team. Took him aside, said exactly what I had noticed, told him I could not let him see patients that morning and that I was going to tell the consultant. I did. Occupational health took it from there.'],
        ['The principle', 'I would rather be wrong and have damaged a friendship than right and have said nothing.']
      ], 'It acts the same day, tells the person before telling anyone else, and states the principle plainly. Panels are testing whether you would actually do it.'),
      medicine_p9: e('A physician from Mumbai.', [
        ['The honest reason', 'My service has doubled its admissions and halved its registrars, and for about two years I have been doing safe work rather than good work. I am not going to pretend that is not part of it.'],
        ['What I am going towards', 'A unit where a consultant can genuinely run a clinic and a teaching programme. Yours has both, and eight consultants rather than three.']
      ], 'The grievance is stated once, factually, and then the answer turns forward. Two sentences on what you want does more than five on what you are escaping.'),
      medicine_p10: e('A consultant in Colombo.', [
        ['What I would do', 'Take on the registrar teaching programme — I ran ours for four years and it survived me leaving. And I would want the sepsis audit to become something that runs without me rather than because of me.'],
        ['What I would not promise', 'A research output in year one while I am learning a new system. I would rather commit to one thing and do it.']
      ], 'One offer with evidence attached, and one thing explicitly declined. Refusing to over-promise reads as senior.'),

      psychology_p4: e('A clinical psychologist in Lisbon.', [
        ['What I do', 'Triage on risk at referral rather than in date order, with a phone contact within two weeks for anyone flagged — that call moves the priority in both directions. Group work and guided self-help for people who would otherwise wait nine months for individual therapy.'],
        ['What I escalate', 'A monthly figure to my lead of who is waiting and how long, in writing. Not as a complaint — so that it exists when the service is reviewed.']
      ], 'A named triage basis, something offered instead of nothing, and capacity escalated in writing rather than grumbled about.'),
      psychology_p5: e('A psychologist trained in South Africa.', [
        ['What I do', 'Brief the interpreter before the client comes in: first person, everything, including the pauses and the swearing, and tell me when something does not translate rather than substituting. The same interpreter across sessions wherever I can, because the alliance includes them.'],
        ['What changes', 'Sessions take longer, and I use fewer and simpler metaphors, because most of mine do not survive translation.']
      ], 'The briefing is specific, continuity is treated as clinical rather than administrative, and it admits the therapy itself has to change. That last point shows real experience.'),
      psychology_p6: e('A psychologist in Auckland.', [
        ['Situation', 'A client told me at length that her previous therapist had been dismissive of her.'],
        ['What I did', 'Took it seriously without adjudicating it, because I was not there. Asked what she wanted to happen, told her how to complain and offered to help her write it. She did not want to. What I did do was ask what she would need from me to be sure I did not do the same thing.']
      ], 'It neither dismisses nor takes sides, gives her the real route to complain, and turns the rest into the working alliance.'),
      psychology_p7: e('A clinical psychologist in Lisbon.', [
        ['What I take', 'The cases I do not want to discuss. And I say the thing I am embarrassed about first, because otherwise I spend forty minutes building up to it and run out of time.'],
        ['Structure', 'Fortnightly supervision, and a separate peer group monthly for the cultural material my supervisor is honest about not knowing.']
      ], 'Taking what you would rather avoid, and having sought a second forum for a specific gap. Neither is checkable, and both are immediately recognisable.'),
      psychology_p8: e('A psychologist in Auckland.', [
        ['My position', 'Primarily CBT with a behavioural bias, because it is what I am trained to do well and what I can supervise others in.'],
        ['Where it does not work', 'Chronic interpersonal difficulty and complex trauma, where I have watched protocol-driven work make people feel they were failing homework. I refer, or I work far more slowly and take it to supervision as trauma work rather than as non-compliance.']
      ], 'A committed position and a named limit with a clinical consequence attached. The line about failing homework does more than a paragraph of theory.'),
      psychology_p9: e('A psychologist in Cape Town.', [
        ['What I bring', 'Formulation. Not a diagnosis — a working account of why this is happening now, for this person, that the team can actually use in a ten-minute conversation.'],
        ['When I am overruled', 'It happens. I write the formulation in the notes anyway, in one paragraph, so it is there when the plan does not work — which is usually when someone comes back to it.']
      ], 'It says precisely what the discipline contributes, and handles disagreement by leaving a record rather than by winning the meeting.'),
      psychology_p10: e('A psychologist in Lisbon, nine years in.', [
        ['What works', 'I never schedule two trauma assessments in one day, even when it makes the week untidy. I write my notes before I go home rather than carrying them. And I have my own therapist, which I would say out loud in an interview.'],
        ['What does not', 'Believing that being trained in it makes me immune to it. I had a run of child protection work and did not sleep properly for two months before I noticed why.']
      ], 'A structural boundary in the diary rather than a wellbeing sentiment, and an admission that costs something to make.'),

      anaesthetic_p4: e('An anaesthetic technician in Dublin.', [
        ['What I do', 'Full machine check at the start of the day, and a shortened check between cases that still includes the circuit and the suction. I do not sign a check I did not do — I have been asked to.'],
        ['When it fails', 'The machine is not used, and I say the list is delayed by fifteen minutes rather than negotiating about it. Once it was soda lime and I had a spare canister. Once it was a leak I could not find, and we moved theatres.']
      ], 'Refusing to sign for an undone check is the answer. Two real outcomes — one fixed, one that moved a whole list — show where the judgement sits.'),
      anaesthetic_p5: e('An anaesthetic technician in Cape Town.', [
        ['What I do', 'Read the airway assessment before the patient arrives, and ask the anaesthetist for plans A, B and C out loud so all three are in my head and not only in theirs. Videolaryngoscope open and tested, bougie unwrapped, front-of-neck kit in the room rather than in the cupboard, and the surgeon told at the start that the airway is the concern.'],
        ['Why unwrapped', 'Because thirty seconds of packaging is thirty seconds.']
      ], 'Everything is physically prepared rather than merely available, and the surgeon is warned in advance. The line about packaging is the kind of detail panels remember.'),
      anaesthetic_p6: e('An anaesthetic technician in Riyadh.', [
        ['What I do', 'Introduce myself and say what I actually do, because nobody knows what a technician is. Then I stop talking about the operation and talk about anything else, and hold their hand if they want it. Most do, and almost nobody offers.'],
        ['With children', 'I let them hold the mask themselves, and I never say it smells nice, because it does not and they will remember that I lied to them.']
      ], 'Two small, humane specifics, and a refusal to tell a child a comfortable lie. It shows what the role really is at the bedside.'),
      anaesthetic_p7: e('An anaesthetic technician in Dublin.', [
        ['What I do', 'Draw up and label one drug at a time, never two open at once. Colour-coded label written before the syringe is filled, not after. Concentration on every label, even the standard ones.'],
        ['The rule', 'A syringe I cannot account for goes in the bin, however expensive and however busy we are. I have thrown away a full syringe of remifentanil for that reason.']
      ], 'Labelling before filling is the technical detail, and the discarded syringe is the proof the rule is real rather than stated.'),
      anaesthetic_p8: e('An anaesthetic technician in Riyadh.', [
        ['In the moment', 'I start it anyway, out loud, using the patient’s name — that is very hard to talk over. If the sign-in gets skipped I say the one line I need: can we confirm side and consent.'],
        ['The pattern', 'One surgeon skipped it consistently. I took dates to the theatre manager, and the anaesthetists backed it. It is now started by whoever scrubs first rather than waiting for him.']
      ], 'A tactic for the moment and a change to the system for the pattern. Getting allies rather than being the lone hero is the mature half.'),
      anaesthetic_p9: e('An anaesthetic technician from Cape Town.', [
        ['What I expect', 'The scope is defined more tightly here and the title is registered — so there are things I have done for years that would sit outside it, and things I would be accountable for in my own name rather than the anaesthetist’s.'],
        ['What I would do', 'Ask for the scope document and the department’s own list of what a technician does here in my first week, and check it against my habits rather than assume they carry over.']
      ], 'It understands that registration changes accountability rather than just paperwork, and asks for the specific document instead of promising to adapt.'),
      anaesthetic_p10: e('An anaesthetic technician in Dublin.', [
        ['What I say', 'Airway, what was given and when, what he is likely to need, and the one thing to watch — said to the recovery nurse with her looking at me, not over my shoulder as I walk away.'],
        ['What I check', 'Oxygen actually running rather than the cylinder being present, monitoring on, and that his glasses and hearing aid come back with him. A confused patient at 3pm is often a patient who cannot hear.']
      ], 'The handover requires eye contact and the check is physical. The detail about hearing aids is the sort of thing that makes a panel look up.'),

      physio_p4: e('A community physiotherapist in Nicosia.', [
        ['Before I go', 'Read the notes for a history of aggression or dogs, tell the office my route and my last visit, and I do not do a first visit alone if there is something in the notes I cannot explain.'],
        ['The one I left', 'A man was drunk and shouting at his wife. I said I would come back tomorrow, and I went. Reported it the same afternoon so the next person did not walk into it.']
      ], 'Your own safety treated as a clinical decision, and one occasion where the answer was to leave. Reporting it so the next person knows is the part that matters.'),
      physio_p5: e('A physiotherapist in Accra.', [
        ['Situation', 'A man eight weeks after a stroke who wanted to be driving by Christmas, which was six weeks away.'],
        ['What I did', 'Did not tell him it was impossible, because I did not know that, and did not agree either. Asked what driving was for. It was collecting his granddaughter from school. So the goal became getting to the school gate, which was achievable, and driving stayed on the list as a longer-term aim to reassess.']
      ], 'It finds the function behind the goal rather than correcting the goal. Nothing is promised and nothing is dismissed.'),
      physio_p6: e('A physiotherapist in Nicosia.', [
        ['What I do', 'Start below what I think they can manage, so the first week succeeds. Explain that hurt and harm are not the same thing — once, in one sentence, not a lecture on pain science, which lands as being told the pain is in your head.'],
        ['When it flares', 'Reduce rather than stop, and tell them in advance that a flare is likely, so it does not feel like failure when it arrives.']
      ], 'Warning them in advance is the clinical insight. The line about not lecturing on pain science shows someone who has watched it go wrong.'),
      physio_p7: e('A physiotherapist in Wellington.', [
        ['What I delegate', 'Progression inside a range I have written down — increase to three sets if he manages two comfortably — rather than a vague instruction to progress as able.'],
        ['What I keep', 'The reassessment, and any change of diagnosis. Every delegated patient gets reviewed by me at three sessions, in the diary, so it does not depend on whether I remember.']
      ], 'The delegated instruction carries its own boundaries, and the review is diarised rather than intended.'),
      physio_p8: e('A physiotherapist in Accra.', [
        ['Situation', 'Post-op knee patients were first seen at six weeks and arriving stiff. Nobody had questioned it, because the clinic was booked that way.'],
        ['What I did', 'Measured range of movement at first appointment for thirty patients and took the numbers to the surgeons, because they were the people who could change the pathway. First appointment moved to two weeks.'],
        ['Did it survive', 'Three years so far, because the booking template changed rather than someone having to remember.']
      ], 'Data collected to persuade a specific audience, and the change built into a template rather than a habit. That last line is what makes it a real improvement story.'),
      physio_p9: e('A physiotherapist from Manchester.', [
        ['What I understand', nz
          ? 'A great deal of musculoskeletal work is funded by ACC rather than the health service, which means direct access, private clinics delivering publicly funded treatment, and paperwork I have never done. In hospital, physiotherapists here work more autonomously than I am used to.'
          : 'Public hospital physiotherapy sits under the state, with Medicare, private practice and the NDIS covering much of the community work. Direct access is normal, and extended scope exists in emergency departments and some clinics.'],
        ['What I would ask', nz
          ? 'How the ACC claim and reporting process works day to day, because that is the part I cannot learn from a website.'
          : 'How NDIS-funded and hospital patients sit alongside each other in one caseload, because the funding changes what I can offer.']
      ], 'It names one funding system correctly and asks the practical question underneath it. Panels can tell the difference between reading a website and thinking about the work.'),
      physio_p10: e('A physiotherapist in Wellington.', [
        ['In the moment', 'Named it, plainly and without anger — I am not comfortable with that, and if it continues I will stop the session. Then I stopped the session, because it continued.'],
        ['Afterwards', 'Documented what was said in his words rather than my summary, told my team leader the same day, and asked for a chaperone for the next appointment. He was not discharged, and I did not treat him again.']
      ], 'It names the behaviour rather than absorbing it, and the employer is told the same day. Both are things a service is obliged to support you in.'),

      ot_p4: e('An occupational therapist in Bristol.', [
        ['What I look at', 'What she actually does in a day rather than what the form asks about. Where the kettle is. Whether the toilet she uses at night is the one upstairs. The dog.'],
        ['When it cannot be adapted', 'One flat could not take a level-access shower at any price. So we changed the task rather than the house — strip wash at the sink with a perching stool, and a shower once a week at her daughter’s. She stayed home two more years.']
      ], 'Changing the task rather than the building is the reasoning the question is after, and the detail about the dog is how the assessment actually happens.'),
      ot_p5: e('An occupational therapist in Delhi.', [
        ['What I contribute', 'Functional evidence, not the decision. I can say what she did when I asked her to make a hot drink, whether she recognised the risk, and what she said about it. That is a different thing from concluding she lacks capacity.'],
        ['Who decides', 'The team, and it is decision-specific. I have been asked to sign off capacity in general terms and I have said I could not.']
      ], 'It is precise about the limits of an OT contribution, and includes refusing a request that went past them. That refusal answers the real question.'),
      ot_p6: e('An occupational therapist in Harare.', [
        ['Situation', 'A man after a below-knee amputation who told me he did not want an occupational therapist and did not need equipment.'],
        ['What I did', 'Did not spend the visit persuading him. Asked what he wanted to be able to do that he could not. It was getting into his own bathroom. Did that one thing and left. Wrote down what I could help with later rather than saying it, because he was not listening yet.']
      ], 'One thing done rather than a full assessment refused, and the offer left in writing. Persuasion is not the answer to this question.'),
      ot_p7: e('An occupational therapist in Bristol.', [
        ['What I do', 'Get the actual job description and visit where I can — what a manager describes and what a job involves are rarely the same. Then a graded plan with dates, hours and named duties, not a note saying fit for light duties, which means nothing to anybody.'],
        ['When it will not work', 'I say so early, to both of them, rather than letting a failed return happen and knock his confidence back six months.']
      ], 'The plan is concrete enough to be enforced, and a doomed return is treated as something to prevent rather than attempt.'),
      ot_p8: e('An occupational therapist in Delhi.', [
        ['What I use', 'A functional measure at admission and at discharge, because otherwise I cannot show change and neither can the service. A cognitive screen where it will change the plan, rather than as routine.'],
        ['When I do not', 'When the tool was normed on a population nothing like the person in front of me, or when the test itself will exhaust her and I will learn less from it than from watching her make breakfast.']
      ], 'Measured at both ends for a stated reason, and a clear account of when a standardised tool is the wrong instrument.'),
      ot_p9: e('An occupational therapist from Cape Town.', [
        ['What I understand', nz
          ? 'Equipment and housing modifications run through specific funding routes — Enable or Accessable depending on the region, and ACC where an injury is involved rather than a condition. So the same wheelchair follows a different process depending on why she needs it.'
          : 'A lot of community equipment and support sits with the NDIS rather than the health service, and aged care is funded separately again. So the same wheelchair follows a different process depending on her age and why she needs it.'],
        ['What I would ask', 'How long each route actually takes, because that is what I would be telling families.']
      ], 'It gets the funding split right and draws the consequence — same equipment, different process. Asking about real waiting times is what someone who has done the job asks.'),
      ot_p10: e('An occupational therapist in Bristol.', [
        ['How I triage', 'Who cannot go home safely without me, ahead of who is technically ready to leave. Those are not the same list, and the second one is the list management sees.'],
        ['How I hold the line', 'Yes to the assessment, no to shortening it. If that means a patient stays a day longer, I write in the notes what I did and why. I have never been asked to justify it, and I have twice been glad it was written down.']
      ], 'It separates the two lists explicitly — the honest core of the question — and holds a line without turning into a complaint.'),

      speech_p4: e('A speech and language therapist in Auckland.', [
        ['When I ask for it', 'When the bedside picture and the clinical history disagree — silent aspiration I cannot see, or someone failing on a diet I thought was safe. Not to confirm what I already know.'],
        ['When I cannot get it', 'The wait was eleven weeks. So I documented my reasoning, set the diet at the safer end, reviewed weekly rather than monthly, and wrote plainly in the notes that the recommendation was made without instrumental assessment.']
      ], 'A clear indication rather than a routine request, and the limitation written into the notes when the test was not available.'),
      speech_p5: e('A speech and language therapist in Karachi.', [
        ['What I do', 'Watch the classroom before I write anything, because a programme needing one-to-one time does not survive a class of thirty. Train the teacher aide, who is the person who will actually do it. Three things, not twelve.'],
        ['What I leave behind', 'One page, on the wall, with photographs of the child’s own signs rather than generic symbols.']
      ], 'It designs for the person who will do the work rather than for the file, and three things instead of twelve is a real decision.'),
      speech_p6: e('A speech and language therapist in Birmingham.', [
        ['What I do', 'Trial more than one system, over weeks, in the places he actually uses language rather than in my room. The family trial it too, so the choice is partly theirs — a device the family will not carry is a device that lives in a cupboard.'],
        ['Abandonment', 'Most of the devices I have seen abandoned were abandoned because nobody trained the people around the person. So I plan the training before I plan the device.']
      ], 'Trialled in real settings, and abandonment named as a training failure rather than a client failure. That reframe is the answer.'),
      speech_p7: e('A speech and language therapist in Auckland.', [
        ['Situation', 'Parents wanting me to say their son was autistic, because funding would follow the words.'],
        ['What I did', 'Told them what I could and could not say, in plain words — I can describe his communication and say it is not typical, and I am not the person who diagnoses. Told them who is and how the referral works, then helped them write down what they had seen at home, because that is evidence the assessing team will want.']
      ], 'The scope limit is stated in plain words and the family leaves with something useful. Turning them towards the right door beats explaining why you are the wrong one.'),
      speech_p8: e('A speech and language therapist in Karachi.', [
        ['What I do', 'Make the materials — written keywords, yes and no cards, a picture of each option — and sit in on the conversation rather than handing the team a leaflet about supported communication. Twenty minutes, not five.'],
        ['What I insist on', 'That nobody concludes he lacks capacity from a fast conversation at his bedside. I have said that in a meeting, and I have written it in the notes.']
      ], 'The therapist is in the room rather than advising from outside it, and the challenge to a capacity conclusion is specific and documented.'),
      speech_p9: e('A speech and language therapist from Birmingham.', [
        ['What I understand', nz
          ? 'Paediatric services are split — the Ministry of Education funds a good deal of what health funds where I trained, so the route depends on the child’s age and setting rather than only on need. And I would be working in a bilingual context, including te reo Māori and Pacific languages.'
          : 'A split between health, the state education department and the NDIS depending on age and setting, so the route depends on more than clinical need. And a genuinely multilingual caseload.'],
        ['What I would want', 'To be told which of my assessments are inappropriate here before I use them, rather than after.']
      ], 'It gets the structural split right and turns it into a request that protects patients. Asking to be corrected before rather than after is a strong close.'),
      speech_p10: e('A speech and language therapist in Birmingham.', [
        ['What I do', 'Ask him about it rather than working around it, because everyone else is being relentlessly encouraging and it is exhausting. Say plainly that this is grief, not a failure of effort.'],
        ['When I refer', 'When the low mood is the thing stopping the therapy — and I say that to him before I refer, not afterwards. I have also had to say it to a family who wanted more sessions when what he needed was fewer.']
      ], 'It names the thing instead of managing around it, and the referral is discussed with the patient first. The last line is the harder half of the answer.'),

      pharmacy_p4: e('A hospital pharmacist in Valletta.', [
        ['What I do', 'Two sources at least — the patient and either the GP record or their pharmacy — because one is never right. Ask what she has actually been taking, not what she has been prescribed. And ask specifically about inhalers, eye drops, patches, injections and anything from a supermarket, because none of those come up when you ask about tablets.'],
        ['Discrepancies', 'Documented as a discrepancy with what I think happened, then resolved with the prescriber rather than corrected silently.']
      ], 'The question list is specific to what people forget to mention, and the discrepancy is documented rather than quietly fixed.'),
      pharmacy_p5: e('A pharmacist in Bangalore.', [
        ['What I do', 'Arrive with the alternative rather than the objection — day five of meropenem, cultures are back and sensitive to co-amoxiclav, can we step down. I bring the culture result, not the guideline.'],
        ['When they will not', 'Document the recommendation and the response in the notes, and take a pattern to the stewardship meeting rather than fighting each case at the bedside.']
      ], 'It arrives with the alternative and the evidence rather than with a rule, and a pattern goes to the right forum instead of being re-fought daily.'),
      pharmacy_p6: e('A pharmacist in Valletta, on starting warfarin.', [
        ['What I cover', 'What the number means, what to do about a missed dose, and the specific things that send people to hospital — a new antibiotic, ibuprofen bought in a supermarket, a change in how much they drink.'],
        ['How I check', 'I ask her to tell me what she would do if she missed a dose, rather than asking whether she has understood. Those two questions get different answers.']
      ], 'Teach-back rather than a yes or no check, and the risks named are the ones that actually cause admissions.'),
      pharmacy_p7: e('A hospital pharmacist in Bangalore.', [
        ['Situation', 'A national shortage of an anticonvulsant, and a woman stable on it for nine years.'],
        ['What I did', 'Checked whether another form of the same drug existed before considering a different drug, because switching brand or formulation in epilepsy is not neutral. Found a liquid, calculated the equivalent, agreed it with the neurologist, and rang her rather than letting her find out at the counter.']
      ], 'It exhausts the least disruptive option first, and treats the phone call as part of the clinical work.'),
      pharmacy_p8: e('A pharmacist in Valletta.', [
        ['What I do', 'Come with the list already checked, so what I raise is the two things that matter rather than eight. Renal dosing, interactions, and what can stop — deprescribing is the part nobody else has time to think about.'],
        ['Not in front of the patient', 'An error. I flag it and take it outside, because a patient watching a pharmacist correct a dose loses confidence in everybody, including me.']
      ], 'Two things prepared rather than eight raised, and a clear rule about where errors get discussed. Naming deprescribing as your contribution is what a panel wants to hear.'),
      pharmacy_p9: e('A pharmacist from the UK.', [
        ['What I understand', nz
          ? 'Pharmac decides what is funded nationally, and that list is tighter than what I am used to — so a drug being licensed and a drug being available are separate questions. There is a funded schedule I would need to know rather than look up occasionally.'
          : 'The PBS decides what is subsidised and under what authority — so a drug being licensed and a drug being affordable to the patient in front of me are separate questions. Authority prescriptions are a process I have never used.'],
        ['What I would ask', 'What the department does about the ones that are not funded, because that conversation with a patient is one I have not had to have.']
      ], 'It identifies the practical consequence of a funding system rather than reciting its name, and asks a question that shows it has thought about the patient’s side of it.'),
      pharmacy_p10: e('A pharmacist in Bangalore.', [
        ['What I do', 'Look it up in front of the person asking rather than saying I will come back to them. Half the time they need the answer now, and it also shows them where I got it.'],
        ['What I never guess', 'Doses in children, anything in pregnancy, and anything cytotoxic. Those go to the specialist service even when I think I know, and I have been glad of that twice.']
      ], 'Looking it up in front of someone is a confident move, not a weak one. Naming three categories you refuse to guess on is more reassuring than claiming broad knowledge.'),

      other_p4: e('A clinical physiologist in Cape Town.', [
        ['The sentence', 'I do the testing that turns a symptom into a number a doctor can act on — and I decide, in the room, whether that number can be trusted.'],
        ['The example', 'A man whose breathlessness was written up as heart failure. His lung function showed a restrictive pattern, and it changed the whole direction of the investigation.']
      ], 'One sentence that includes the judgement in the role rather than only the task, then one example with a consequence attached.'),
      other_p5: e('A prosthetist from Toronto.', [
        ['What I have checked', 'The regulator’s recertification requirements and the CPD hours, and I have the competency framework saved. My scope is defined differently here, and one part of it would need supervised practice.'],
        ['What I have not', 'How the annual practising certificate cycle interacts with my start date. I would want that sorted before I arrive rather than after.']
      ], 'The requirements have plainly already been read, and it raises the timing question early — which is exactly what the employer wants raised early.'),
      other_p6: e('A dietitian from Toronto.', [
        ['What I would ask for', 'A named person for the first month who is not my manager, for the small questions. Two weeks of shadowing rather than one, because a system takes longer to learn than a caseload does. And my first appraisal at six weeks rather than six months, so anything I am doing wrong gets said early.']
      ], 'Three specific, cheap requests with a reason each. Asking for an early appraisal is the one that makes an interviewer sit forward.'),

      q11: e('A nurse from the UK, first interview in Aotearoa.', [
        ['How much I actually knew', 'I read the Nursing Council’s cultural safety standard, the three Ps, and the equity section of the service’s own annual plan. That was one evening. I am not an expert in Te Tiriti and I would not claim to be.'],
        ['What it changes about my job', 'Partnership means the plan gets made with the patient and their whānau rather than presented to them. Active protection means that if Māori patients on my ward are having worse outcomes than everyone else, that is my problem and not only the service’s. And I would want to know who the Māori health team are and how I refer, in my first week rather than my sixth month.'],
        ['The example', 'I have always asked who someone wants in the room and what they want their family told, and I argued for a double appointment for a man who needed an interpreter and was being rushed. I had not called that Te Tiriti before. The reasoning is the same.']
      ], 'It says how much preparation this actually took — one evening — and refuses to overclaim. Then it turns two principles into something concrete about its own ward. The last beat is the move that works: you almost certainly do this already, you have simply never labelled it that way.'),

      /* MORE-W-END */
    };
}

function professions(dest) {
    return [
      { value: 'imaging', label: 'Medical imaging / radiography' }, { value: 'sonography', label: 'Sonography' },
      { value: 'radtherapy', label: 'Radiation therapy' }, { value: 'nursing', label: 'Nursing' },
      { value: 'midwifery', label: 'Midwifery' }, { value: 'medicine', label: 'Medicine' },
      { value: 'psychology', label: 'Psychology' }, { value: 'anaesthetic', label: 'Anaesthetic technology' },
      { value: 'physio', label: 'Physiotherapy' }, { value: 'ot', label: 'Occupational therapy' },
      { value: 'speech', label: 'Speech and language therapy' }, { value: 'pharmacy', label: 'Pharmacy' },
      { value: 'other', label: 'Another profession' },
      { value: 'all', label: 'Show every profession' }
    ];
}

function data(dest) {
    const nz = dest === 'nz';
    const GUIDE = nz ? '/guides/new-zealand-interview' : '/guides/australia-interview';
    const HEALTH = nz ? '/guides/new-zealand-healthcare' : '/guides/australia-healthcare';
    const country = nz ? 'New Zealand' : 'Australia';
    return [
      {
        id: 'cv', when: 'Before you apply', title: 'Your CV',
        intro: 'A clinical CV written for one health system rarely reads well in another. Most of the work is subtraction.',
        items: [
          { id: 'c1', title: 'Rewritten to ' + country + ' conventions rather than translated', note: 'Three to five pages is normal for a clinical CV here — there is no need to squeeze a career onto two. Referees are usually named rather than offered on request, and your clinical skills belong in a section of their own instead of buried inside job descriptions. Our guide sets out the structure and shows a before and after.', ctaLabel: 'CV and interview guide →', ctaHref: GUIDE },
          { id: 'c2', title: 'Photograph, date of birth, marital status and ID number removed', note: 'Standard practice in much of the world, and expected nowhere here. Leaving them in marks the CV as unadapted before anyone reads it.' },
          { id: 'c3', title: 'Clinical skills, equipment and systems named explicitly', note: 'Modalities, makes of equipment, patient groups, software. Shortlisting often works by scanning for these, and a reader will not assume a skill you have not written down.' },
          { id: 'c4', title: 'Registration status stated near the top, with dates', note: 'Where you are in the process, not just that you have started. This is the first thing a hiring manager looks for on an international application.', ctaLabel: 'Check my registration pathway →', ctaHref: '/pathway-checker' },
          { id: 'c5', title: 'Gaps in employment explained in a line each', note: 'Parental leave, study, caring, illness, a move. Unexplained gaps invite worse assumptions than the truth.' },
          { id: 'c6', title: 'If you used AI, you have made it yours again', note: 'Useful for tidying and structure, obvious when it has written the thing. You will be asked about anything on the page, so every line needs to be something you can talk about.' },
          { id: 'c7', title: 'Read by someone who knows this market', note: 'Ten minutes from someone who reads these CVs weekly is worth more than another evening of your own edits. Send it to us.' }
        ]
      },
      {
        id: 'apply', when: 'Before you apply', title: 'The rest of the application',
        intro: 'The parts that quietly decide whether an application progresses.',
        items: [
          { id: 'a1', title: 'Referees asked, briefed and reachable across time zones', note: 'Tell them the role, when to expect contact, and which of your work to mention. Give a mobile number and a note of the time difference — a referee who cannot be reached in a week stalls an offer.' },
          { id: 'a2', title: 'Referees include a recent clinical supervisor', note: 'A character reference does not substitute. If your most recent supervisor is awkward to ask, tell your recruiter early rather than hoping it is not noticed.' },
          { id: 'a3', title: 'Cover letter written for the service, not the country', note: 'Why this department, this patient group, this city. Enthusiasm for ' + country + ' in general reads as a mass application.' },
          { id: 'a4', title: 'Certified copies and evidence assembled', note: 'Qualifications, registration, references, immunisation records, English test results. You will need them repeatedly from here on.' },
          { id: 'a5', title: 'Portfolio or logbook ready if your profession expects one', note: 'Case logs, competency records, CPD evidence. Easier to gather now than under time pressure later.' }
        ]
      },
      {
        id: 'before', when: 'Before the interview', title: 'Preparing properly',
        intro: 'Almost all international interviews happen by video, which changes what preparation means.',
        items: [
          { id: 'b1', title: 'Researched the service, not just the city', note: 'Size, patient population, what they are known for, recent changes, how the department fits the wider organisation. Their website and annual report take twenty minutes.' },
          { id: 'b8', title: 'Understand the system you would be joining', note: nz
              ? 'Twenty district health boards became one national organisation, Health New Zealand | Te Whatu Ora, in 2022. ACC covers accident and injury care separately. Panels notice when someone has looked this up — it reads as having thought the move through rather than applied on impulse.'
              : 'Public hospitals sit under state and territory health departments, with Medicare and the private system alongside. Knowing roughly how your service is funded and governed reads as having thought the move through.',
            ctaLabel: 'How healthcare works here →', ctaHref: HEALTH },
          { id: 'b9', title: 'Know what the panel is really testing', note: nz
              ? 'Teams here are flatter than in many systems — first names throughout, and input expected from everyone regardless of seniority. Alongside that sits a genuine speak-up culture. Much of the questioning is quietly asking one thing: would this person raise a concern, even with someone senior?'
              : 'Behind most behavioural questions sits one concern: would this person speak up when something looked wrong, including to someone more senior? Teams are less hierarchical than in many systems and expect contribution from everyone.' },
          { id: 'b11', title: 'Read the organisation’s values and worked out what each one looks like on an ordinary shift', note: 'They are on the website and they are not decoration — most health services here interview against them, sometimes one question per value, marked separately. Reciting them back is not the point. Being able to say what one looks like at 3pm on a Tuesday, with an example, is. Pick two you have real stories for.' },
          { id: 'b2', title: 'Know who is interviewing you and what they do', note: 'A panel usually includes a clinical lead, a manager and sometimes a peer. Ask your recruiter for names and roles beforehand — it is a reasonable question.' },
          { id: 'b3', title: nz
              ? 'Prepared for questions on cultural safety and Te Tiriti o Waitangi'
              : 'Prepared for questions on cultural safety in Aboriginal and Torres Strait Islander health',
            note: nz
              ? 'This is what international candidates worry about most, and the expectation is widely misunderstood. You are not expected to be an expert in Te Tiriti or Māori health. You are expected to be open, respectful and willing to learn — and to talk through your own examples of culturally safe care. You almost certainly have them already; you have simply never labelled them that way.'
              : 'Increasingly asked, and not a formality. You are not expected to arrive an expert — you are expected to be open, and to draw on your own examples of adapting care to the person in front of you.',
            ctaLabel: 'How to talk about it →', ctaHref: GUIDE },
          { id: 'b4', title: 'Video set-up tested properly', note: 'Camera at eye level, light in front of you rather than behind, a plain background, headphones, and the platform opened once before the day.' },
          { id: 'b5', title: 'Time confirmed in both time zones, in writing', note: 'Get the confirmation to state both. Daylight saving shifts at different times in each hemisphere and this goes wrong more often than you would believe.' },
          { id: 'b6', title: 'Your examples prepared', note: 'The prompts below cover what panels ask most. Written down, not just thought about — the worksheet in our guide takes each one further.' },
          { id: 'b10', title: 'Comfortable saying why you want to live here, not only work here', note: 'Lifestyle and wellbeing are a perfectly good part of the answer, and saying so signals you have thought the move through rather than chased a salary. It is one of the few places where the personal reason is the stronger one.' },
          { id: 'b7', title: 'Your own questions ready', note: 'Being asked whether you have questions and saying no is a wasted opportunity — and this is the moment to start understanding the offer.', ctaLabel: 'Questions worth asking →', ctaHref: (nz ? '/guides/new-zealand-salary' : '/guides/australia-salary') }
        ]
      },
      {
        id: 'day', when: 'On the day', title: 'Getting through it well',
        intro: 'Small things, but they are what you will be glad of.',
        items: [
          { id: 'd1', title: 'Dressed as you would for a first day at that workplace' },
          { id: 'd2', title: 'Somewhere quiet, with a backup if the connection drops', note: 'Have a phone number for the panel and tell them at the start that you will ring if you disappear. It turns a disaster into a shrug.' },
          { id: 'd3', title: 'Your CV, the job description and your notes in front of you', note: 'One of the advantages of video. Use it, without reading from it.' },
          { id: 'd4', title: 'Asked about next steps and timeline before you finish', note: 'When they expect to decide, what follows, and who will be in touch. It saves a fortnight of wondering.' }
        ]
      },
      {
        id: 'after', when: 'Afterwards', title: 'While it is fresh',
        intro: 'Ten minutes now, whatever the outcome.',
        items: [
          { id: 'e1', title: 'Written down what you were asked', note: 'Panels across a health system ask similar things. This is the single most useful preparation for your next interview, and it is gone by tomorrow.' },
          { id: 'e2', title: 'Sent a short thank-you within a day', note: 'Three lines. Something specific from the conversation, and that you remain interested.' },
          { id: 'e3', title: 'Told your recruiter how it went', note: 'Including what felt uncomfortable. We can often clarify something with the employer before it becomes a reason not to offer.' }
        ]
      }
    ];
}

function starList(dest) {
    return [
      { id: 's1', tag: 'Patient safety', prompt: 'A time you raised a concern about safety or standards', ex: 'q2' },
      { id: 's2', tag: 'Conflict', prompt: 'A time you disagreed with a colleague and had to resolve it', ex: 'q5' },
      { id: 's3', tag: 'Mistakes', prompt: 'A time something went wrong and you were involved', ex: 'q3' },
      { id: 's4', tag: 'Pressure', prompt: 'A time you managed competing demands with too little time', ex: 'q6' },
      { id: 's5', tag: 'Change', prompt: 'A time you had to work with a change you did not agree with', ex: 'star_s5' },
      { id: 's6', tag: 'Cultural safety', prompt: 'A time you adapted care to someone whose culture, language or beliefs differed from yours', ex: 'q4' },
      { id: 's7', tag: 'Family', prompt: 'A time you involved a patient’s family in a decision rather than informing them of it', ex: 'star_s7' },
      { id: 's8', tag: 'Values', prompt: 'A time your practice showed one of the values this employer publishes', ex: 'q10' }
    ];
}

function questionBank(dest) {
    const nz = dest === 'nz';
    const core = [
      { id: 'q1', q: 'Tell us about yourself and why you want to work here.', a: 'Two minutes, not ten. Your clinical background, what draws you to this service specifically, and why this country. Naming lifestyle as part of the reason is fine and reads as considered.' },
      { id: 'q2', q: 'Tell us about a time you raised a concern about patient safety.', a: 'What you noticed, who you told and how quickly, what happened next. Say plainly if it was uncomfortable. Panels are testing whether you escalate, including upwards.' },
      { id: 'q3', q: 'Describe a time something went wrong in your practice.', a: 'A real error or near miss, what you did immediately, how you disclosed it, and what changed in your practice afterwards. Reflection is read as strength here, not weakness.' },
      { id: 'q4', q: 'How do you provide culturally safe care?', a: 'Your own examples from wherever you have practised — interpreters, religious or modesty needs, end-of-life practices, involving family. ' + (nz ? 'Then honesty about still learning Te Tiriti and Māori health models, and interest in doing so.' : 'Then honesty about what you have still to learn in this context.') },
      { id: 'q5', q: 'Tell us about a disagreement with a colleague.', a: 'The clinical substance of the disagreement, how you raised it, and where it landed. Avoid making the other person the villain — how you handled it matters more than who was right.' },
      { id: 'q6', q: 'How do you manage competing priorities under pressure?', a: 'One specific shift rather than a general philosophy. How you triaged, what you delegated or escalated, and what you let go of.' },
      { id: 'q7', q: 'What do you know about how healthcare works here?', a: nz ? 'Te Whatu Ora as a single national organisation since 2022, ACC covering injury separately, and the equity priority for Māori and Pacific communities. A few sentences is plenty.' : 'That public hospitals sit under state health departments, alongside Medicare and a substantial private sector. A few sentences is plenty.' },
      { id: 'q8', q: 'How will you cope with moving so far from home?', a: 'A fair question, not an intrusive one. What support you have, what you have researched, and any previous experience of relocating. Vague optimism is the weak answer.' },
      { id: 'q9', q: 'Do you have any questions for us?', a: 'Always yes. The team, the caseload, induction and supervision, what they are working on. This is also where you start understanding the offer.' },
      { id: 'q10', q: 'One of our values is X — can you give us an example of what that looks like in your practice?', a: 'Their published values, by name. Services here interview against them directly, sometimes a question per value, marked separately. Do not recite all five. Take the one you have a real story for, say what it looks like on an ordinary day, then give the example.' }
    ];
    if (nz) core.push({ id: 'q11', q: 'How does Te Tiriti o Waitangi apply to your practice?', a: 'Less than you fear, and more than a definition. An evening of reading covers it: the three Ps — partnership, participation and protection — which is still the framing most panels use, and the five from the Waitangi Tribunal’s health inquiry (tino rangatiratanga, equity, active protection, options and partnership). Then say what one of them changes about your own job, and give your own example of adapting care. Nobody expects a history lesson, fluency in te reo or expertise you could not have. What is being tested is whether you take it seriously and will keep learning — so say plainly where you are up to.' });
    const byProf = {
      nursing: [
        { id: 'p1', q: 'How do you handle a deteriorating patient when you cannot get a review?', a: 'Your escalation pathway, the tools you use to communicate urgency, and persistence when the first call does not work.' },
        { id: 'p2', q: 'Tell us about a time you advocated for a patient against the prevailing view.', a: 'What you saw that others had not, how you pressed it, and the outcome — including if you were overruled.' },
        { id: 'p3', q: 'How do you support a family who are unhappy with care?', a: 'Listening before defending, what you can address yourself, when to escalate, and how you document it.' }
      ],
      midwifery: [
        { id: 'p1', q: 'How do you support informed choice when you disagree with a woman’s decision?', a: 'How you present risk without coercion, how you document the conversation, and how you continue to care for her either way.' },
        { id: 'p2', q: 'Describe managing an obstetric emergency.', a: 'Your role in the team, the sequence, communication with the woman and her whānau during and afterwards.' },
        { id: 'p3', q: 'How do you work with whānau in the birthing room?', a: 'Practical accommodation of who the woman wants present, cultural practices around birth and placenta, and how you find out rather than assume.' }
      ],
      imaging: [
        { id: 'p1', q: 'How do you handle a request you believe is not clinically justified?', a: 'Justification as a professional obligation, how you raise it with the referrer, and when you decline.' },
        { id: 'p2', q: 'Tell us about a time you spotted something outside the clinical question.', a: 'What you saw, how you flagged it, and how you communicate findings within your scope.' },
        { id: 'p3', q: 'How do you manage a distressed or non-compliant patient during a procedure?', a: 'Explaining plainly, adapting technique, when to stop, and dose or repeat considerations.' }
      ],
      radtherapy: [
        { id: 'p1', q: 'How do you manage a patient distressed partway through a course of treatment?', a: 'Recognising it, who you involve, and how you keep treatment on track without pressuring them.' },
        { id: 'p2', q: 'Describe a time you identified a discrepancy in a plan or set-up.', a: 'What you noticed, how you escalated, and how it was resolved and recorded.' },
        { id: 'p3', q: 'How do you maintain accuracy on a long, repetitive list?', a: 'Your checks, how you avoid automaticity, and what you do when you lose concentration.' }
      ],
      sonography: [
        { id: 'p1', q: 'How do you handle finding something unexpected and serious mid-scan?', a: 'What you say and do not say to the patient, who you tell immediately, and how you document it.' },
        { id: 'p2', q: 'How do you manage a technically difficult study without compromising the report?', a: 'Recognising limitations, what you record about them, and when you ask for a second pair of eyes.' },
        { id: 'p3', q: 'How do you protect yourself from repetitive strain?', a: 'Ergonomics, list management, and whether you have raised it before — services take this seriously here.' }
      ],
      medicine: [
        { id: 'p1', q: 'How would you manage a disagreement with a senior colleague about a treatment plan?', a: 'How you raise it, what evidence you bring, and how you escalate if the patient remains at risk.' },
        { id: 'p2', q: 'Tell us about a time you had to break bad news.', a: 'Preparation, who was present, the language you used, and what you did afterwards for the family and yourself.' },
        { id: 'p3', q: 'How do you supervise and teach while carrying a clinical load?', a: 'Concrete habits rather than intentions, and how you make time when the service is under pressure.' }
      ],
      psychology: [
        { id: 'p1', q: 'How do you manage risk with a client who does not want you to act?', a: 'Where confidentiality ends, how you tell them, and how you preserve the relationship afterwards.' },
        { id: 'p2', q: 'How do you adapt your practice across cultures?', a: 'Where your training assumes a worldview, what you change, and how you use supervision on this.' },
        { id: 'p3', q: 'Tell us about work that did not go well.', a: 'Honest reflection, what you took to supervision, and what you now do differently.' }
      ],
      anaesthetic: [
        { id: 'p1', q: 'How do you prepare for a list with an unfamiliar surgeon or procedure?', a: 'Your checks, what you read beforehand, and what you confirm rather than assume.' },
        { id: 'p2', q: 'Describe an equipment failure during a case.', a: 'What you did in the moment, how you communicated it, and what you changed afterwards.' },
        { id: 'p3', q: 'How do you speak up in theatre?', a: 'A real instance. Theatre hierarchies are the classic test of whether someone will actually raise a concern.' }
      ],
      physio: [
        { id: 'p1', q: 'How do you handle a patient who will not engage with their programme?', a: 'Finding out why before pushing harder, renegotiating goals, and when you discharge.' },
        { id: 'p2', q: 'Tell us about a time you changed your clinical reasoning partway through.', a: 'What made you reconsider, who you discussed it with, and the outcome.' },
        { id: 'p3', q: 'How do you manage a caseload you cannot get through?', a: 'Prioritisation, what you escalate to your lead, and how you document unmet need.' }
      ],
      ot: [
        { id: 'p1', q: 'How do you work with a patient whose goals differ from their family’s?', a: 'Whose goals lead, how you hold the difference, and how you keep the family engaged.' },
        { id: 'p2', q: 'Describe a discharge you were uncomfortable with.', a: 'What worried you, how you raised it, and what you documented.' },
        { id: 'p3', q: 'How do you assess when resources for equipment are limited?', a: 'Prioritisation, creative alternatives, and advocating without overpromising.' }
      ],
      speech: [
        { id: 'p1', q: 'How do you manage a patient who refuses modified diet recommendations?', a: 'Capacity, informed risk, documentation, and continuing to support them either way.' },
        { id: 'p2', q: 'How do you work with families around communication difficulties?', a: 'Training them as partners, managing expectations about recovery, and pacing information.' },
        { id: 'p3', q: 'How do you adapt assessment for someone whose first language is not English?', a: 'What tools do not transfer, working with interpreters, and what you avoid concluding.' }
      ],
      pharmacy: [
        { id: 'p1', q: 'How do you handle a prescribing error by a senior clinician?', a: 'How you raise it, what you do if brushed off, and how you record it.' },
        { id: 'p2', q: 'Describe counselling a patient who does not want to take a medicine.', a: 'Understanding the objection, what you can offer, and when you refer back.' },
        { id: 'p3', q: 'How do you keep current with formulary differences after moving country?', a: 'Recognising that brands, protocols and availability differ, and how you check rather than assume.' }
      ],
      other: [
        { id: 'p1', q: 'What does good practice look like in your profession here?', a: 'Show you have looked into scope, standards and how your role sits in the team locally.' },
        { id: 'p2', q: 'How will you adapt to a different health system?', a: 'What you expect to differ, and how you plan to find out rather than assume.' },
        { id: 'p3', q: 'Tell us about a time you worked outside your comfort zone.', a: 'What you did not know, who you asked, and what you learned.' }
      ]
    };
    const more = byProfMore(dest);
    Object.keys(more).forEach(k => { byProf[k] = (byProf[k] || []).concat(more[k]); });
    return { core: core, byProf: byProf };
}

function byProfMore(dest) {
    const nz = dest === 'nz';
    return {
      nursing: [
        { id: 'p4', q: 'How do you manage a medication error you have made yourself?', a: 'Immediate patient safety, who you told and how fast, the incident form, and what changed. Panels want the error, not the near miss.' },
        { id: 'p5', q: 'How do you delegate to healthcare assistants?', a: 'What you delegate and what you never do, how the check-back is built into the instruction, and accountability staying with you.' },
        { id: 'p6', q: 'Tell us about a time you supported a colleague who was struggling.', a: 'What you noticed, what you did in the moment, and what you did days later. Staff wellbeing is asked about here more than in most systems.' },
        { id: 'p7', q: 'How do you hand over safely?', a: 'Your structure, where you do it, and what you do when a handover you receive is inadequate.' },
        { id: 'p8', q: 'How would you raise a concern about a colleague’s practice?', a: 'The difference between a one-off and a pattern, whether you speak to the person first, who you go to, and what you write down.' },
        { id: 'p9', q: 'What would you find hardest about nursing in a new system?', a: 'A real answer, not a humble brag. Something specific to arriving, and what you would do about it.' },
        { id: 'p10', q: 'How do you look after your own wellbeing on a run of hard shifts?', a: 'Concrete, and honest about what does not work. They ask because they are trying not to lose you in year one.' }
      ],
      midwifery: [
        { id: 'p4', q: 'How do you support a woman who has had a traumatic previous birth?', a: 'Reading the notes before she arrives, asking what she wants done differently, and putting it in the plan so she does not retell it to every midwife.' },
        { id: 'p5', q: 'How do you work with a woman who declines everything you recommend?', a: 'Taking the refusals one at a time, documenting each, and saying your concern once rather than repeatedly.' },
        { id: 'p6', q: 'How do you advocate for a woman during an escalating labour?', a: 'Carrying her words rather than your opinion, the language you use in the room, and keeping her informed while it happens.' },
        { id: 'p7', q: 'How do you care for a woman after a stillbirth?', a: 'What you offer rather than assume, what you offer more than once, the paperwork nobody warns you about, and how you look after yourself.' },
        { id: 'p8', q: nz ? 'How would you manage a caseload under the lead maternity carer model?' : 'How would you manage a continuity caseload alongside on-call?', a: 'On-call planning, what happens when two women labour at once, named back-up, and how you protect leave.' },
        { id: 'p9', q: 'What do you know about the model of maternity care here?', a: 'The model in two sentences, then what is harder about it for someone from a different system.' },
        { id: 'p10', q: 'How would you handle a complaint about your own care?', a: 'Not defending first, what you can and cannot say in a response, and what changed afterwards.' }
      ],
      imaging: [
        { id: 'p4', q: 'How do you manage a patient who may be pregnant?', a: 'Asking properly and privately, the justification conversation, the alternative, and what you record.' },
        { id: 'p5', q: 'How do you keep dose as low as reasonably practicable in practice?', a: 'Habits and numbers, not the principle. Collimation, exposure factors, paediatric protocols, and your own repeat rate.' },
        { id: 'p6', q: 'How do you work in a trauma call?', a: 'Where you stand, how you sequence with the team, and how you get diagnostic images in a moving room.' },
        { id: 'p7', q: 'How do you respond to feedback that your images are not diagnostic?', a: 'Whether you look at your own work critically, what you did with the feedback, and whether you went and asked.' },
        { id: 'p8', q: 'What would be different about working in a department here?', a: 'Something concrete about scope, staffing or workflow taken from the job description — not a compliment.' },
        { id: 'p9', q: 'How do you check identity and consent before an examination?', a: 'Three identifiers from the patient, what you do when they cannot confirm, and consent as something continuing.' },
        { id: 'p10', q: 'How do you keep your skills current across modalities?', a: 'What you have actually done this year, and what has gone stale that you would not claim.' }
      ],
      radtherapy: [
        { id: 'p4', q: 'How do you manage a patient’s expectations about side effects?', a: 'What you say at the start, how you pace it, and where your scope ends on prognosis.' },
        { id: 'p5', q: 'How do you work with the planning and physics team?', a: 'What you take to them and how, and what you would never change yourself at the console.' },
        { id: 'p6', q: 'How do you manage a child through a course of treatment?', a: 'Play preparation, anaesthetic decisions, the parents, and the consistency that makes it work.' },
        { id: 'p7', q: 'What would you do if a colleague took a shortcut?', a: 'Whether you say it in the moment, to whom, and what you do about a second time.' },
        { id: 'p8', q: 'What would you do if imaging showed the tumour had changed during treatment?', a: 'What you stop, who you escalate to and how fast, and what you say to the patient.' },
        { id: 'p9', q: 'What do you know about how radiation therapy is organised here?', a: 'Regional centres, patients travelling and staying, wait-time expectations — and one practical consequence of it.' },
        { id: 'p10', q: 'How do you look after yourself working in oncology?', a: 'Specific and honest. They ask because turnover in this work is real.' }
      ],
      sonography: [
        { id: 'p4', q: 'How do you answer a patient who asks what you can see?', a: 'The form of words you use, where your scope ends, and how you avoid both lying and reporting.' },
        { id: 'p5', q: 'How do you handle a list running badly behind?', a: 'What you shorten, what you protect, who you tell, and what you refuse to leave out.' },
        { id: 'p6', q: 'How do you scan a patient who cannot cooperate?', a: 'Adapting position and technique, who you bring in, and what you write about what you could not assess.' },
        { id: 'p7', q: 'How do you keep your worksheets and images defensible?', a: 'What you store, what you record about limitations, and the habit that protects you six months later.' },
        { id: 'p8', q: 'How would you supervise a student on a full list?', a: 'What you hand over, what you watch, and honesty about what supervision costs in list time.' },
        { id: 'p9', q: 'What would be different about sonography here?', a: 'Reporting scope, autonomy and workforce reality — from the job description, not guessed.' },
        { id: 'p10', q: 'How would you manage an unexpected fetal anomaly at a routine scan?', a: 'What you complete, who you get and how fast, what you say, and what you do not name.' }
      ],
      medicine: [
        { id: 'p4', q: 'How do you prioritise on a busy on-call?', a: 'One shift, the actual triage principle, what you delegated, and what you handed over undone.' },
        { id: 'p5', q: 'How do you respond to a family asking for treatment you do not think will help?', a: 'What they are really asking for, honesty about benefit, and what you offer and document instead.' },
        { id: 'p6', q: 'How do you work with nursing staff?', a: 'Specific behaviours rather than respect as a sentiment. Whether you treat their concern as data.' },
        { id: 'p7', q: 'How do you keep your practice current and audited?', a: 'One audit with numbers before and after, and what changed as a result.' },
        { id: 'p8', q: 'How would you handle a colleague you believed was impaired?', a: 'Patient safety the same day, whether you tell the person first, who you must tell, and the regulator’s expectation.' },
        { id: 'p9', q: 'Why are you leaving your current post?', a: 'A reason about what you are going towards. Grievance reads as risk even when it is justified.' },
        { id: 'p10', q: 'How would you contribute beyond your clinical work?', a: 'One or two things you would actually do, with evidence you have done something like it — and one thing you decline to promise.' }
      ],
      psychology: [
        { id: 'p4', q: 'How do you manage a waitlist you cannot clear?', a: 'What you triage on, what you offer instead of nothing, and how you escalate capacity in writing.' },
        { id: 'p5', q: 'How do you work with an interpreter in therapy?', a: 'The briefing, continuity, why not family — and what changes about the therapy itself.' },
        { id: 'p6', q: 'How do you handle a client who wants to complain about another clinician?', a: 'Taking it seriously without adjudicating, the route to complain, and not becoming advocate or defender.' },
        { id: 'p7', q: 'How do you use supervision?', a: 'What you actually take, including what you would rather not, and how often.' },
        { id: 'p8', q: 'What is your theoretical orientation, and where does it not work?', a: 'A clear position and a named limit. Integration with no reason behind it reads as vagueness.' },
        { id: 'p9', q: 'How would you work in a multidisciplinary team?', a: 'What your discipline contributes that others cannot, and what you do when your formulation is overruled.' },
        { id: 'p10', q: 'How do you look after yourself doing this work?', a: 'Structural, not sentimental. Vicarious trauma is a real interview topic here.' }
      ],
      anaesthetic: [
        { id: 'p4', q: 'How do you check a machine, and what happens if it fails the check?', a: 'The sequence, what you never skip, and what you say when a list is waiting.' },
        { id: 'p5', q: 'How do you prepare for a difficult airway?', a: 'What is physically open in the room, who you tell, and plans B and C out loud rather than assumed.' },
        { id: 'p6', q: 'How do you support a patient in the anaesthetic room?', a: 'What you do in three minutes, and how you adapt for someone frightened or for a child.' },
        { id: 'p7', q: 'How do you manage drug preparation and labelling?', a: 'One at a time, labels before filling, and what you do with a syringe you cannot account for.' },
        { id: 'p8', q: 'What do you do when a surgeon does not engage with the checklist?', a: 'What you say in the moment, who backs you up, and what you change when it is a pattern.' },
        { id: 'p9', q: 'What would be different about working in theatres here?', a: 'Registered scope and personal accountability — and the specific document you would ask for.' },
        { id: 'p10', q: 'How do you hand a patient over to recovery?', a: 'What you say and to whom, what you physically check, and what you never leave to the paperwork.' }
      ],
      physio: [
        { id: 'p4', q: 'How do you manage risk on a home visit?', a: 'What you check before you go, how you treat your own safety, and the visit you would walk away from.' },
        { id: 'p5', q: 'How do you set goals with someone whose expectations are unrealistic?', a: 'Finding the function behind the goal, what you refuse to promise, and where you are honest.' },
        { id: 'p6', q: 'How do you prescribe exercise for someone in significant pain?', a: 'Pacing, what you explain about pain and how briefly, and what you do when it flares.' },
        { id: 'p7', q: 'How do you work with an assistant or support worker?', a: 'How the delegated instruction is written, what you keep, and when you review.' },
        { id: 'p8', q: 'Tell us about a time you changed a service or a way of working.', a: 'What you noticed, who you had to convince and with what, and whether it survived you leaving.' },
        { id: 'p9', q: 'What do you know about how physiotherapy works here?', a: nz ? 'ACC alongside the health service, direct access, and extended scope — plus one practical question underneath it.' : 'Medicare, the NDIS and public hospitals, direct access, and extended scope — plus one practical question underneath it.' },
        { id: 'p10', q: 'How would you handle a patient behaving inappropriately towards you?', a: 'What you say in the moment, what you document, and telling your employer the same day.' }
      ],
      ot: [
        { id: 'p4', q: 'How do you carry out a home assessment?', a: 'What you look at that is not on the form, and what you do about a house that cannot be adapted.' },
        { id: 'p5', q: 'How do you contribute to a capacity assessment?', a: 'What functional evidence can and cannot say, and who actually decides.' },
        { id: 'p6', q: 'How do you work with someone who does not want your input?', a: 'Whether you persuade, what you do instead, and what you leave behind in writing.' },
        { id: 'p7', q: 'How do you support a return to work?', a: 'The graded plan with dates and duties, the employer conversation, and saying early when it will not work.' },
        { id: 'p8', q: 'How do you use standardised assessments?', a: 'Which ones and why, and the situations where the tool is the wrong instrument.' },
        { id: 'p9', q: 'What do you know about how occupational therapy works here?', a: nz ? 'Equipment and housing funding routes, and ACC versus health — then the consequence for a family.' : 'The NDIS, aged care and hospital funding routes — then the consequence for a family.' },
        { id: 'p10', q: 'How do you prioritise when every patient is a discharge blocker?', a: 'The difference between who cannot go home safely and who is technically ready, and how you hold that line.' }
      ],
      speech: [
        { id: 'p4', q: 'When do you ask for an instrumental swallow assessment?', a: 'The indication rather than routine, and what you do when you cannot get one.' },
        { id: 'p5', q: 'How do you work with a school or early childhood centre?', a: 'Who you actually train, how much you leave, and how you avoid a programme nobody does.' },
        { id: 'p6', q: 'How do you approach a communication aid decision?', a: 'Trialling in real settings, involving the family, and why devices get abandoned.' },
        { id: 'p7', q: 'How do you handle a family wanting a diagnosis you cannot give?', a: 'What your assessment can say, who does diagnose, and what they leave with.' },
        { id: 'p8', q: 'How do you help someone with aphasia take part in decisions about their care?', a: 'Supported communication in practice, and challenging a capacity conclusion reached at speed.' },
        { id: 'p9', q: 'What do you know about how speech and language therapy works here?', a: nz ? 'The education and health split for children, and a bilingual caseload including te reo Māori.' : 'The health, education and NDIS split by age and setting, and a genuinely multilingual caseload.' },
        { id: 'p10', q: 'How do you manage the emotional side of communication loss?', a: 'What you name rather than work around, and how you refer without going behind the patient.' }
      ],
      pharmacy: [
        { id: 'p4', q: 'How do you take a medicines history?', a: 'Two sources, the questions that find what people forget to mention, and what you do with a discrepancy.' },
        { id: 'p5', q: 'How do you have a stewardship conversation with a prescriber?', a: 'Arriving with the alternative rather than the rule, and where a pattern goes if they will not change it.' },
        { id: 'p6', q: 'How do you counsel a patient on a high-risk medicine?', a: 'The risks that actually cause admissions, and how you check understanding rather than asking about it.' },
        { id: 'p7', q: 'How do you handle a supply problem for something a patient needs?', a: 'The least disruptive option first, who agrees the change, and who tells the patient.' },
        { id: 'p8', q: 'How would you contribute on a ward round?', a: 'What you prepare, the two things you raise, and what you never raise in front of the patient.' },
        { id: 'p9', q: 'What do you know about how pharmacy works here?', a: nz ? 'Pharmac and the funded schedule, and the consequence when something is not funded.' : 'The PBS, authority prescribing, and the consequence when something is not subsidised.' },
        { id: 'p10', q: 'What do you do when you are not sure?', a: 'What you look up in front of people, and the categories you never guess on.' }
      ],
      other: [
        { id: 'p4', q: 'How would you explain what your profession contributes to someone outside it?', a: 'One sentence that includes the judgement in your role, then one example with a consequence.' },
        { id: 'p5', q: 'How will you keep your registration and competency requirements current here?', a: 'What your regulator actually requires, what you have already checked, and what you have not.' },
        { id: 'p6', q: 'What support would you need in your first three months?', a: 'Two or three specific, cheap things with a reason each — planning rather than neediness.' }
      ],
      /* MORE-Q-END */
    };
}


var onward = [
  { question: 'Can I register professionally?', label: 'Registration Pathway Checker', href: '/pathway-checker' },
  { question: 'How do I write the CV itself?', label: 'CVs & interviews guide', href: null, nz: '/guides/new-zealand-interview', au: '/guides/australia-interview' },
  { question: 'How much cash will I need?', label: 'Cost of Moving Calculator', href: '/cost-calculator' },
  { question: 'What do I need to organise?', label: 'Your Moving Checklist', href: '/moving-checklist' }
];

window.IPData = { worked: worked, workedMore: workedMore, professions: professions, data: data, starList: starList, questionBank: questionBank, byProfMore: byProfMore, onward: onward };
})();
