/* Let's Talk — Universe + Theater gameplay controller.
   Uses the existing LTStorage / LTSession architecture and local question bank. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const els = {
    body: document.body, intro: $('cinematic-intro'), skipIntro: $('skip-intro-btn'),
    introParticles: $('intro-particles'), canvas: $('stage-particles'),
    stage: $('game-stage'), idle: $('state-idle'), reveal: $('state-reveal'),
    activity: $('state-activity'), fate: $('state-fate'),
    topic: $('mode-topic'), topicIcon: $('mode-topic-icon'),
    progressLeft: $('progress-status-left'), progressRight: $('progress-status-right'),
    progressTrack: $('progress-track'), progressFill: $('progress-bar-fill'),
    start: $('start-turn-btn'), revealTitle: $('reveal-title'),
    revealDescription: $('reveal-description'), roulette: $('activity-roulette'),
    activityKicker: $('activity-kicker'), activityRound: $('activity-round'),
    content: $('activity-content'), actions: $('activity-actions'),
    feedback: $('game-feedback'), end: $('end-game-btn'), exit: $('exit-game-btn'),
    exitModal: $('exit-modal'), endModal: $('end-modal'),
    continue: $('continue-game-btn'), confirmExit: $('confirm-exit-btn'),
    keepPlaying: $('keep-playing-btn'), confirmEnd: $('confirm-end-btn'),
    fateSkip: $('fate-skip-btn'),
    rulesModal: $('rules-modal'),
    openRules: $('open-rules-btn'),
    closeRules: $('close-rules-btn'),
    rulesDone: $('rules-done-btn')
  };
  if (!els.stage || !window.LTSession) return;

  let session = null;
  let activityBank = null;
  let busy = false;
  let currentQuestion = null;
  let currentActivity = null;
  let currentModal = null;
  let previousFocus = null;
  let canvasFrame = 0;
  let particles = [];
  let introTimers = [];
  let introHideTimer = null;
  let introFinished = false;

  const topicMeta = window.LTSession.TOPICS;
  const wait = ms => new Promise(resolve => window.setTimeout(resolve, reducedMotion ? 0 : ms));
  const pick = list => list[Math.floor(Math.random() * list.length)];
  const shuffle = list => window.LTSession.shuffleArray(list);
  function pickUnused(items) {
    const used = new Set(session.usedActivityContentIds || []);
    const available = items.filter(item => !used.has(item.id));
    const selected = pick(available.length ? available : items);
    if (!session.usedActivityContentIds) session.usedActivityContentIds = [];
    if (selected?.id && !session.usedActivityContentIds.includes(selected.id)) {
      session.usedActivityContentIds.push(selected.id);
      session.updatedAt = new Date().toISOString();
      window.LTStorage.write(window.LTStorage.keys.activeSession, session);
    }
    return selected;
  }
  const escapeHTML = value => String(value).replace(/[&<>"']/g, ch => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  })[ch]);

  function feedback(message = '') { els.feedback.textContent = message; }
  function showState(state) {
    [els.idle, els.reveal, els.activity, els.fate].forEach(el => {
      el.hidden = el !== state;
    });
    els.stage.dataset.state = state.id;
  }
  function setBusy(value) {
    busy = value;
    const dynamicActions = [
      ...document.querySelectorAll(
        '#activity-complete-btn, #activity-skip-btn, #activity-shuffle-btn'
      )
    ];
    const modalActions = [
      els.continue, els.confirmExit, els.keepPlaying, els.confirmEnd,
      els.closeRules, els.rulesDone
    ];
    [
      els.start, els.end, els.exit, els.fateSkip,
      ...els.fate.querySelectorAll('[data-fate]'),
      ...dynamicActions,
      ...modalActions
    ].filter(Boolean).forEach(btn => {
      btn.disabled = value;
      btn.setAttribute('aria-disabled', String(value));
    });
  }
  function updateHeader() {
    const topic = topicMeta[session.topic];
    document.body.dataset.topic = session.topic;
    els.topicIcon.textContent = topic.icon;
    els.topic.querySelector('b').textContent = topic.label;
    updateProgress();
  }
  function updateProgress() {
    const total = session.totalQuestions;
    const completed = session.completedQuestionCount || 0;
    const skipped = session.skippedQuestionCount || 0;
    const processed = completed + skipped;
    const pct = total ? Math.round(completed / total * 100) : 0;
    els.progressLeft.textContent = total ? `${processed} / ${total} TURNS` : `${processed} TURNS`;
    els.progressRight.textContent = total ? `${pct}% COMPLETED` : 'UNLIMITED';
    els.progressFill.style.width = total ? `${pct}%` : '0%';
    els.progressTrack.setAttribute('aria-valuenow', String(pct));
    els.progressTrack.setAttribute('aria-valuetext', `${completed} completed, ${skipped} skipped`);
  }
  async function loadActivities() {
    if (activityBank) return activityBank;
    const response = await fetch('data/activities.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('The activity library could not be loaded.');
    activityBank = await response.json();
    return activityBank;
  }

/* ==========================================================
   CINEMATIC INTRO CONTROLLER — FIXED TIMELINE
   Homepage -> Gameplay
========================================================== */

function clearIntroTimers() {
  introTimers.forEach(timer => window.clearTimeout(timer));
  introTimers = [];

  if (introHideTimer !== null) {
    window.clearTimeout(introHideTimer);
    introHideTimer = null;
  }
}

function setIntroVisible(visible) {
  if (!els.intro) return;

  clearIntroTimers();
  introFinished = false;

  if (!visible) {
    finishIntro();
    return;
  }

  // Reset every animation state before replaying.
  els.intro.classList.remove(
    'is-active',
    'is-leaving',
    'is-bursting',
    'is-ready',
    'is-sweeping'
  );

  // Force the browser to recognize the reset.
  void els.intro.offsetWidth;

  els.intro.hidden = false;
  els.intro.setAttribute('aria-hidden', 'false');

  document.body.classList.add('is-intro-playing');

  // Start the cinematic.
  els.intro.classList.add('is-active');

  // Respect the user's accessibility preference.
  if (reducedMotion) {
    finishIntro();
    return;
  }

  introTimers.push(
    window.setTimeout(() => {
      if (introFinished) return;

      els.intro.classList.add('is-bursting');
    }, 3150)
  );

  /*
    PHASE 4 — 4.55s
    Show the conversation message.
    This starts only after the main slogan has disappeared.
  */
  introTimers.push(
    window.setTimeout(() => {
      if (introFinished) return;

      els.intro.classList.add('is-ready');
    }, 4550)
  );

  /*
    PHASE 5 — 6.35s
    Light sweep opens the gameplay universe.
  */
  introTimers.push(
    window.setTimeout(() => {
      if (introFinished) return;

      els.intro.classList.add('is-sweeping');
    }, 6350)
  );

  /*
    PHASE 6 — 7.35s
    Begin the final handoff to gameplay.
  */
  introTimers.push(
    window.setTimeout(() => {
      finishIntro();
    }, 7350)
  );
}

function finishIntro() {
  if (!els.intro || introFinished) return;

  introFinished = true;

  clearIntroTimers();

  els.intro.setAttribute('aria-hidden', 'true');

  // Start the final fade-out.
  els.intro.classList.add('is-leaving');

  if (reducedMotion) {
    els.intro.hidden = true;

    els.intro.classList.remove(
      'is-active',
      'is-leaving',
      'is-bursting',
      'is-ready',
      'is-sweeping'
    );

    document.body.classList.remove('is-intro-playing');
    return;
  }

  // Remove the intro only after its fade-out is complete.
  introHideTimer = window.setTimeout(() => {
    els.intro.hidden = true;

    els.intro.classList.remove(
      'is-active',
      'is-leaving',
      'is-bursting',
      'is-ready',
      'is-sweeping'
    );

    document.body.classList.remove('is-intro-playing');

    introHideTimer = null;
  }, 1000);
}

  function createBurst() {
    if (reducedMotion) return;
    const fragment = document.createDocumentFragment();
    for (let i=0;i<24;i++) {
      const dot=document.createElement('i');
      dot.className='universe-burst';
      dot.style.setProperty('--angle', `${Math.random()*360}deg`);
      dot.style.setProperty('--distance', `${55+Math.random()*150}px`);
      fragment.appendChild(dot);
    }
    els.stage.appendChild(fragment);
    setTimeout(() => els.stage.querySelectorAll('.universe-burst').forEach(n=>n.remove()), 900);
  }
  async function startTurn(forcedType = null) {
    if (busy) return;
    setBusy(true);
    feedback('');
    showState(els.reveal);
    createBurst();

    try {
      const types = ['question', 'fate', 'event', 'hotseat'];
      const labels = {
        question: 'Question Zone',
        fate: 'Pick Your Fate',
        event: 'Random Event',
        hotseat: 'Hot Seat'
      };
      const activity = forcedType || pick(types);
      const items = [...els.roulette.querySelectorAll('.roulette-item')];

      els.revealTitle.textContent = 'The Universe is choosing...';
      els.revealDescription.textContent = 'A little surprise is on its way.';
      items.forEach(item => item.classList.remove('is-selected', 'is-spinning'));

      if (!reducedMotion) {
        const duration = 2850;
        const started = performance.now();
        let tick = Math.floor(Math.random() * items.length);
        while (performance.now() - started < duration) {
          const elapsed = performance.now() - started;
          const progress = Math.min(1, elapsed / duration);
          const index = tick % items.length;
          items.forEach((item, i) => item.classList.toggle('is-spinning', i === index));
          tick += 1;
          const delay = 75 + Math.pow(progress, 2.2) * 300;
          await wait(delay);
        }
      } else {
        await wait(120);
      }

      items.forEach(item => {
        item.classList.remove('is-spinning');
        item.classList.toggle('is-selected', item.dataset.roulette === activity);
      });
      els.revealTitle.textContent = labels[activity];
      els.revealDescription.textContent = 'Your next activity has been revealed.';
      createBurst();
      await wait(reducedMotion ? 0 : 650);

      currentActivity = activity;
      if (activity === 'fate') showState(els.fate);
      else await renderActivity(activity);
    } catch (error) {
      console.error('Could not start activity:', error);
      showState(els.idle);
      feedback(error.message || 'The activity could not be loaded. Please try again.');
    } finally {
      setBusy(false);
    }
  }
  async function getCurrentQuestion() {
    currentQuestion = await window.LTSession.getQuestion(session);
    if (!currentQuestion) throw new Error('The current question is unavailable.');
    return currentQuestion;
  }
  function setActions({shuffleQuestion = false, extra = ''} = {}) {
    els.actions.innerHTML = `
      ${shuffleQuestion ? '<button class="btn btn-ghost" id="activity-shuffle-btn" type="button">⤨ <span>Next Question</span></button>' : ''}
      ${extra}
      <button class="btn btn-primary" id="activity-complete-btn" type="button">✓ <span>Complete</span></button>
      <button class="btn btn-ghost activity-skip" id="activity-skip-btn" type="button">Skip</button>`;
    $('activity-complete-btn').addEventListener('click', () => advanceTurn(true));
    $('activity-skip-btn').addEventListener('click', () => advanceTurn(false));
    if (shuffleQuestion) $('activity-shuffle-btn').addEventListener('click', shuffleQuestion);
  }
  async function renderActivity(type, content = null) {
    showState(els.activity);
    const round = session.currentQuestionIndex + 1;
    const total = session.totalQuestions ? ` / ${session.totalQuestions}` : '';
    els.activityRound.textContent = `TURN ${round}${total}`;
    let title = '', kicker = '', body = '', sub = '', opts = {};
    if (type === 'question' || type === 'truth' || type === 'surprise') {
      const q = await getCurrentQuestion();
      kicker = type === 'question' ? 'QUESTION ZONE' : type === 'truth' ? 'TRUTH REVEALED' : 'SURPRISE QUESTION';
      title = q.content;
      sub = type === 'question' ? 'Take your time. Everyone is listening.' : 'Share your answer with the group.';
      opts.shuffleQuestion = true;
    } else if (type === 'challenge') {
      const item = content || pickUnused(activityBank.challenges);
      kicker = 'CHALLENGE REVEALED'; title = item.content; sub = 'Give it a try. Keep it fun and comfortable.';
    } else if (type === 'hotseat') {
      kicker = 'HOT SEAT'; title = 'You are in the spotlight.'; 
      sub = 'Choose someone else in the group to take the Hot Seat. Everyone else takes turns asking questions. You do not need to type anything into the website.';
      body = '<div class="spotlight-person"><span>✦</span><small>THE HOT SEAT</small></div>';
    } else if (type === 'event') {
      const event = content || pickUnused(activityBank.events);
      kicker = event.title; title = event.content; sub = `WHO PARTICIPATES · ${event.participant}`;
      if (event.type === 'double') {
        const map = new Map(activityBank.challenges.map(c=>[c.id,c]));
        body = `<div class="double-challenges">${event.challengeIds.map((id,i)=>`<p><b>CHALLENGE ${i+1}</b>${escapeHTML(map.get(id)?.content || 'Complete a group challenge.')}</p>`).join('')}</div>`;
      }
    }
    els.activityKicker.textContent = kicker;
    els.content.innerHTML = `${body}<h2 class="activity-prompt">${escapeHTML(title)}</h2><p class="activity-subtext">${escapeHTML(sub)}</p>`;
    setActions(opts);
  }
  async function selectFate(choice) {
    if (busy) return;
    setBusy(true);
    createBurst();
    try {
      const bank = await loadActivities();
      let type = choice;
      if (choice === 'mystery') type = Math.random() < .5 ? 'truth' : 'challenge';
      currentActivity = type;
      await wait(420);
      await renderActivity(type, type === 'challenge' ? pickUnused(bank.challenges) : null);
    } catch (error) {
      console.error('Could not resolve selected fate:', error);
      showState(els.fate);
      feedback(error.message || 'This choice could not be loaded. Please choose again.');
    } finally {
      setBusy(false);
    }
  }
  async function shuffleQuestion() {
    if (busy) return;
    setBusy(true);
    try {
      const result = await window.LTSession.replaceCurrentWithShuffle(session);
      session = result.session;
      if (result.exhausted || !result.question) {
        feedback('No unused questions remain in this session.');
      } else {
        currentQuestion = result.question;
        await renderActivity(currentActivity);
      }
    } catch (error) { feedback(error.message); }
    finally { setBusy(false); }
  }
  async function advanceTurn(completed) {
    if (busy || !session) return;

    // Lock synchronously before any async work. This makes Complete/Skip
    // idempotent against double-clicks and rapid touch events.
    setBusy(true);

    // Work on a copy so a failed transition cannot leave the in-memory
    // session half-advanced.
    const previousSession = session;
    const workingSession = JSON.parse(JSON.stringify(session));

    try {
      const result = await window.LTSession.advance(workingSession, { completed });

      if (result.finished) {
        window.location.href = 'game-complete.html';
        return;
      }

      if (!result.session || !result.question) {
        throw new Error('The next turn is not ready yet. Please try again.');
      }

      session = result.session;
      currentQuestion = result.question;
      currentActivity = null;
      updateProgress();
      feedback(
        completed
          ? 'Activity completed. Pass the device to the next person.'
          : 'Activity skipped. Pass the device to the next person.'
      );

      // Small visual handoff between turns.
      els.stage.classList.remove('turn-handoff');
      void els.stage.offsetWidth;
      els.stage.classList.add('turn-handoff');
      showState(els.idle);
      els.start.focus();
    } catch (error) {
      // Restore the last known-good state in memory and browser storage.
      session = previousSession;
      try {
        window.LTStorage.write(
          window.LTStorage.keys.activeSession,
          previousSession
        );
      } catch (restoreError) {
        console.error('Session rollback failed:', restoreError);
      }
      console.error('Could not advance turn:', error);
      feedback(error.message || 'The turn could not be advanced. Please try again.');
    } finally {
      setBusy(false);
    }
  }
  function openModal(modal) {
    previousFocus = document.activeElement; currentModal = modal;
    modal.hidden = false;
    modal.querySelector('button')?.focus();
  }
  function closeModal() {
    if (!currentModal) return;
    currentModal.hidden = true; currentModal = null; previousFocus?.focus();
  }
  function confirmExit() {
    window.LTSession.finishExit();
    window.location.href = 'index.html';
  }
  function confirmEnd() {
    if (!session) return;
    window.LTSession.endEarly(session);
    window.location.href = 'game-complete.html';
  }
  function setupCanvas() {
    const canvas=els.canvas, ctx=canvas?.getContext('2d');
    if (!ctx || reducedMotion) return;
    const resize=()=>{
      const r=canvas.getBoundingClientRect(), dpr=Math.min(devicePixelRatio||1,1.5);
      canvas.width=Math.max(1,Math.floor(r.width*dpr)); canvas.height=Math.max(1,Math.floor(r.height*dpr));
      ctx.setTransform(dpr,0,0,dpr,0,0);
      particles=Array.from({length:matchMedia('(max-width:600px)').matches?12:28},()=>({x:Math.random()*r.width,y:Math.random()*r.height,s:.5+Math.random()*1.4,a:.15+Math.random()*.4,v:.08+Math.random()*.2}));
    };
    const draw=()=>{
      const r=canvas.getBoundingClientRect(); ctx.clearRect(0,0,r.width,r.height);
      particles.forEach(p=>{p.y-=p.v;if(p.y<0){p.y=r.height;p.x=Math.random()*r.width;}ctx.beginPath();ctx.arc(p.x,p.y,p.s,0,Math.PI*2);ctx.fillStyle=`rgba(193,160,255,${p.a})`;ctx.shadowBlur=8;ctx.shadowColor='#a77aff';ctx.fill();});
      canvasFrame=requestAnimationFrame(draw);
    };
    resize(); window.addEventListener('resize',resize);
    document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelAnimationFrame(canvasFrame);else canvasFrame=requestAnimationFrame(draw);});
    canvasFrame=requestAnimationFrame(draw);
  }
  async function initialize() {
    try {
      session = await window.LTSession.restoreActive();
      if (!session) { window.location.replace('index.html#game-setup'); return; }
      await loadActivities();
      updateHeader();
      await getCurrentQuestion();
      setupCanvas();
      const playIntro = sessionStorage.getItem('letsTalk.playIntro') === '1';
      sessionStorage.removeItem('letsTalk.playIntro');
      if (playIntro) setIntroVisible(true);
      else { els.intro.hidden = true; els.intro.setAttribute('aria-hidden','true'); }
      showState(els.idle);
    } catch (error) {
      console.error("Gameplay initialization failed:", error);
      feedback(error.message || 'Unable to start the game.');
      setBusy(true);
    }
  }

  els.start.addEventListener('click', () => startTurn());
  els.fate.querySelectorAll('[data-fate]').forEach(btn => btn.addEventListener('click',()=>selectFate(btn.dataset.fate)));
  els.fateSkip.addEventListener('click',()=>advanceTurn(false));
  els.exit.addEventListener('click',()=>openModal(els.exitModal));
  els.end.addEventListener('click',()=>openModal(els.endModal));
  els.continue.addEventListener('click',closeModal);
  els.keepPlaying.addEventListener('click',closeModal);
  els.confirmExit.addEventListener('click',confirmExit);
  els.confirmEnd.addEventListener('click',confirmEnd);
  els.skipIntro?.addEventListener('click',finishIntro);
  els.openRules?.addEventListener('click', () => els.rulesModal && openModal(els.rulesModal));
  els.closeRules?.addEventListener('click', closeModal);
  els.rulesDone?.addEventListener('click', closeModal);
  els.rulesModal?.addEventListener('click', event => {
    if (event.target === els.rulesModal) closeModal();
  });
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape' && currentModal) closeModal();
    if(event.key==='Tab' && currentModal){
      const items=[...currentModal.querySelectorAll('button:not(:disabled)')];
      if(items.length && event.shiftKey && document.activeElement===items[0]){event.preventDefault();items.at(-1).focus();}
      else if(items.length && !event.shiftKey && document.activeElement===items.at(-1)){event.preventDefault();items[0].focus();}
    }
  });
  initialize();
})();
