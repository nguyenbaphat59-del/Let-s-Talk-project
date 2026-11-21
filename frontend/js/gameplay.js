/* LET'S TALK — Gameplay controller connected to the stateless Backend API */
(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const els = {
    intro: $('cinematic-intro'), skipIntro: $('skip-intro-btn'),
    canvas: $('stage-particles'), stage: $('game-stage'),
    idle: $('state-idle'), reveal: $('state-reveal'),
    activity: $('state-activity'), fate: $('state-fate'),
    topic: $('mode-topic'), topicIcon: $('mode-topic-icon'),
    progressLeft: $('progress-status-left'), progressRight: $('progress-status-right'),
    progressTrack: $('progress-track'), progressFill: $('progress-bar-fill'),
    start: $('start-turn-btn'),
    revealTitle: $('reveal-title'), revealDescription: $('reveal-description'),
    roulette: $('activity-roulette'), activityKicker: $('activity-kicker'),
    activityRound: $('activity-round'), content: $('activity-content'),
    actions: $('activity-actions'), feedback: $('game-feedback'),
    end: $('end-game-btn'), exit: $('exit-game-btn'),
    exitModal: $('exit-modal'), endModal: $('end-modal'),
    continue: $('continue-game-btn'), confirmExit: $('confirm-exit-btn'),
    keepPlaying: $('keep-playing-btn'), confirmEnd: $('confirm-end-btn'),
    fateSkip: $('fate-skip-btn'), rulesModal: $('rules-modal'),
    openRules: $('open-rules-btn'), closeRules: $('close-rules-btn'),
    rulesDone: $('rules-done-btn')
  };

  if (!els.stage || !window.LTSession || !window.LTAPI) return;

  let session = null;
  let busy = false;
  let currentModal = null;
  let previousFocus = null;
  let canvasFrame = 0;
  let particles = [];
  let introTimers = [];
  let introHideTimer = null;
  let introFinished = false;

  const topicMeta = window.LTSession.TOPICS;
  const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, reducedMotion ? 0 : ms));
  const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[ch]);

  function feedback(message = '') {
    if (els.feedback) els.feedback.textContent = message;
  }

  function showState(state) {
    [els.idle, els.reveal, els.activity, els.fate].forEach((element) => {
      if (element) element.hidden = element !== state;
    });
    if (els.stage) els.stage.dataset.state = state.id;
  }

  function setBusy(value) {
    busy = value;
    const dynamicActions = [...document.querySelectorAll(
      '#activity-complete-btn, #activity-skip-btn, #activity-shuffle-btn'
    )];
    const modalActions = [
      els.continue, els.confirmExit, els.keepPlaying, els.confirmEnd,
      els.closeRules, els.rulesDone
    ];
    [
      els.start, els.end, els.exit, els.fateSkip,
      ...els.fate.querySelectorAll('[data-fate]'),
      ...dynamicActions, ...modalActions
    ].filter(Boolean).forEach((button) => {
      const unavailableFateChoice = button.matches('[data-fate]') &&
        button.getAttribute('data-choice-available') === 'false';
      button.disabled = value || unavailableFateChoice;
      button.setAttribute('aria-disabled', String(button.disabled));
    });
  }

  function updateHeader() {
    const topic = topicMeta[session.topicCode];
    if (!topic) throw new Error('The saved game has an unsupported topic.');
    document.body.dataset.topic = session.topicCode;
    els.topicIcon.textContent = topic.icon;
    els.topic.querySelector('b').textContent = topic.label;
    updateProgress();
  }

  function updateProgress() {
    const target = session.progressionTarget;
    const completed = session.completedUnits;
    const skipped = session.skippedUnits;
    const processed = session.processedTurns;
    const percentage = target ? Math.min(100, Math.round(completed / target * 100)) : 0;

    els.progressLeft.textContent = target
      ? `COMPLETED ${completed} / ${target}`
      : `${completed} COMPLETED · ${skipped} SKIPPED`;
    els.progressRight.textContent = target
      ? `${skipped} SKIPPED · ${processed} PROCESSED`
      : 'UNLIMITED';
    els.progressFill.style.width = target ? `${percentage}%` : '0%';
    els.progressTrack.setAttribute('aria-valuenow', String(percentage));
    els.progressTrack.setAttribute('aria-valuetext',
      `${completed} completed, ${skipped} skipped, ${processed} processed`);
  }

  function clearIntroTimers() {
    introTimers.forEach((timer) => window.clearTimeout(timer));
    introTimers = [];
    if (introHideTimer !== null) {
      window.clearTimeout(introHideTimer);
      introHideTimer = null;
    }
  }

  function finishIntro() {
    if (!els.intro || introFinished) return;
    introFinished = true;
    clearIntroTimers();
    els.intro.setAttribute('aria-hidden', 'true');
    els.intro.classList.add('is-leaving');

    if (reducedMotion) {
      els.intro.hidden = true;
      els.intro.classList.remove('is-active', 'is-leaving', 'is-bursting', 'is-ready', 'is-sweeping');
      document.body.classList.remove('is-intro-playing');
      return;
    }

    introHideTimer = window.setTimeout(() => {
      els.intro.hidden = true;
      els.intro.classList.remove('is-active', 'is-leaving', 'is-bursting', 'is-ready', 'is-sweeping');
      document.body.classList.remove('is-intro-playing');
      introHideTimer = null;
    }, 1000);
  }

  function setIntroVisible(visible) {
    if (!els.intro) return;
    clearIntroTimers();
    introFinished = false;
    if (!visible) return finishIntro();

    els.intro.classList.remove('is-active', 'is-leaving', 'is-bursting', 'is-ready', 'is-sweeping');
    void els.intro.offsetWidth;
    els.intro.hidden = false;
    els.intro.setAttribute('aria-hidden', 'false');
    document.body.classList.add('is-intro-playing');
    els.intro.classList.add('is-active');

    if (reducedMotion) return finishIntro();
    introTimers.push(window.setTimeout(() => !introFinished && els.intro.classList.add('is-bursting'), 3150));
    introTimers.push(window.setTimeout(() => !introFinished && els.intro.classList.add('is-ready'), 4550));
    introTimers.push(window.setTimeout(() => !introFinished && els.intro.classList.add('is-sweeping'), 6350));
    introTimers.push(window.setTimeout(finishIntro, 7350));
  }

  function createBurst() {
    if (reducedMotion) return;
    const fragment = document.createDocumentFragment();
    for (let index = 0; index < 24; index += 1) {
      const dot = document.createElement('i');
      dot.className = 'universe-burst';
      dot.style.setProperty('--angle', `${Math.random() * 360}deg`);
      dot.style.setProperty('--distance', `${55 + Math.random() * 150}px`);
      fragment.appendChild(dot);
    }
    els.stage.appendChild(fragment);
    window.setTimeout(() => els.stage.querySelectorAll('.universe-burst').forEach((node) => node.remove()), 900);
  }

  async function revealSelection(family) {
    const rouletteKey = {
      question_zone: 'question_zone',
      pick_your_fate: 'pick_your_fate',
      random_event: 'random_event',
      hot_seat: 'hot_seat'
    }[family];
    const labels = {
      question_zone: 'Question Zone',
      pick_your_fate: 'Pick Your Fate',
      random_event: 'Random Event',
      hot_seat: 'Hot Seat'
    };
    const items = [...els.roulette.querySelectorAll('.roulette-item')];

    showState(els.reveal);
    createBurst();
    els.revealTitle.textContent = 'The Universe is choosing...';
    els.revealDescription.textContent = 'A little surprise is on its way.';
    items.forEach((item) => item.classList.remove('is-selected', 'is-spinning'));

    if (!reducedMotion && items.length) {
      const duration = 2400;
      const started = performance.now();
      let tick = 0;
      while (performance.now() - started < duration) {
        const progress = Math.min(1, (performance.now() - started) / duration);
        items.forEach((item, index) => item.classList.toggle('is-spinning', index === tick % items.length));
        tick += 1;
        await wait(70 + Math.pow(progress, 2.1) * 260);
      }
    } else {
      await wait(120);
    }

    items.forEach((item) => {
      item.classList.remove('is-spinning');
      item.classList.toggle('is-selected', item.dataset.roulette === rouletteKey);
    });
    els.revealTitle.textContent = labels[family] || 'Activity revealed';
    els.revealDescription.textContent = 'Your next activity has been revealed.';
    createBurst();
    await wait(450);
  }

  function setActions({ nextQuestion = false, skipLabel = 'Skip' } = {}) {
    els.actions.innerHTML = `
      ${nextQuestion ? '<button class="btn btn-ghost" id="activity-shuffle-btn" type="button">⤨ <span>Next Question</span></button>' : ''}
      <button class="btn btn-primary" id="activity-complete-btn" type="button">✓ <span>Complete</span></button>
      <button class="btn btn-ghost activity-skip" id="activity-skip-btn" type="button">${escapeHTML(skipLabel)}</button>`;
    $('activity-complete-btn').addEventListener('click', () => advanceTurn(true));
    $('activity-skip-btn').addEventListener('click', () => advanceTurn(false));
    if (nextQuestion) $('activity-shuffle-btn').addEventListener('click', nextQuestionZone);
  }

  function renderFateChoices() {
    const choices = session.currentActivity.choices || {};
    els.fate.querySelectorAll('[data-fate]').forEach((button) => {
      const choice = choices[button.dataset.fate];
      const unavailable = !choice?.enabled;
      button.dataset.choiceAvailable = String(!unavailable);
      button.disabled = unavailable;
      button.setAttribute('aria-disabled', String(unavailable));
      if (choice?.reason) button.title = choice.reason;
      else button.removeAttribute('title');
    });
    showState(els.fate);
  }

  function renderActivity(activity = session.currentActivity) {
    if (!activity || !activity.content) throw new Error('The selected activity could not be restored.');
    showState(els.activity);

    const target = session.progressionTarget;
    els.activityRound.textContent = target
      ? `COMPLETED ${session.completedUnits} / ${target}`
      : `TURN ${session.currentTurn}`;

    let kicker = '';
    let title = '';
    let subtitle = '';
    let body = '';
    let actions = {};

    if (activity.activityFamily === 'question_zone') {
      kicker = 'QUESTION ZONE';
      title = activity.content.text;
      subtitle = 'Take your time. Everyone is listening.';
      actions.nextQuestion = true;
    } else if (activity.activityFamily === 'pick_your_fate') {
      const type = activity.resolvedChoice;
      kicker = type === 'truth' ? 'TRUTH REVEALED' : 'CHALLENGE REVEALED';
      title = activity.content.text;
      subtitle = type === 'truth'
        ? 'Share your answer honestly with the group.'
        : 'Give it a try. Keep it fun and comfortable.';
    } else if (activity.activityFamily === 'random_event') {
      const eventLabels = {
        double_challenge: 'DOUBLE CHALLENGE',
        everyone_answers: 'EVERYONE ANSWERS',
        surprise_question: 'SURPRISE QUESTION',
        pick_a_player: 'PICK A PLAYER'
      };
      kicker = eventLabels[activity.eventCode] || 'RANDOM EVENT';
      const items = Array.isArray(activity.content) ? activity.content : [activity.content];
      if (activity.eventCode === 'double_challenge') {
        body = `<div class="double-challenges">${items.map((item, index) =>
          `<p><b>CHALLENGE ${index + 1}</b>${escapeHTML(item.text)}</p>`
        ).join('')}</div>`;
        title = 'Complete both challenges together.';
        subtitle = 'This counts as one activity.';
      } else {
        title = items[0].text;
        subtitle = activity.eventCode === 'pick_a_player'
          ? `The group decides who participates. ${activity.participantInstruction || ''}`
          : (activity.eventCode === 'everyone_answers'
            ? 'Everyone in the group takes a turn answering.'
            : 'Share your answer with the group.');
      }
    } else if (activity.activityFamily === 'hot_seat') {
      kicker = 'HOT SEAT';
      title = activity.content.text;
      subtitle = activity.participantInstruction || 'The group chooses who takes the Hot Seat. The participant may pass.';
      body = '<div class="spotlight-person"><span>✦</span><small>THE HOT SEAT</small></div>';
      actions.skipLabel = 'Pass';
    } else {
      throw new Error('The Backend returned an unsupported activity type.');
    }

    els.activityKicker.textContent = kicker;
    els.content.innerHTML = `${body}<h2 class="activity-prompt">${escapeHTML(title)}</h2><p class="activity-subtext">${escapeHTML(subtitle)}</p>`;
    setActions(actions);
  }

  async function startTurn() {
    if (busy || !session) return;
    setBusy(true);
    feedback('');
    try {
      session = await window.LTSession.startNextActivity();
      if (session.currentState === 'awaiting_fate') {
        await revealSelection('pick_your_fate');
        renderFateChoices();
      } else {
        await revealSelection(session.currentActivity.activityFamily);
        renderActivity();
      }
    } catch (error) {
      console.error("[Let's Talk] Could not start the next activity:", error);
      if (error.code === 'NO_ELIGIBLE_ACTIVITY') {
        try {
          window.LTSession.finishContentExhausted();
          window.location.href = 'game-complete.html';
          return;
        } catch (finishError) {
          feedback(finishError.message || 'The session could not be closed after content exhaustion.');
        }
      } else {
        feedback(error.message || 'The activity could not be loaded. Please try again.');
      }
    } finally {
      setBusy(false);
    }
  }

  async function selectFate(choice) {
    if (busy) return;
    setBusy(true);
    try {
      session = await window.LTSession.resolveFate(choice);
      createBurst();
      await wait(360);
      renderActivity();
    } catch (error) {
      feedback(error.message || 'This choice is no longer available. Please choose another option.');
      if (error.code === 'CONTENT_POOL_EXHAUSTED') {
        try {
          const refreshed = await window.LTAPI.getCatalog(session.topicCode);
          const pools = refreshed.pools || {};
          const currentChoices = session.currentActivity.choices || {};
          ['truth', 'challenge', 'mystery'].forEach((key) => {
            if (!currentChoices[key]) return;
            const enabled = key === 'truth'
              ? pools.truth?.available > session.usedContentIdsByPool.truth.length
              : key === 'challenge'
                ? pools.challenge?.available > session.usedContentIdsByPool.challenge.length
                : pools.truth?.available > session.usedContentIdsByPool.truth.length &&
                  pools.challenge?.available > session.usedContentIdsByPool.challenge.length;
            const fateButton = els.fate.querySelector(`[data-fate="${key}"]`);
            fateButton.dataset.choiceAvailable = String(Boolean(enabled));
            fateButton.disabled = !enabled;
            fateButton.setAttribute('aria-disabled', String(!enabled));
          });
        } catch { /* Keep the last valid choice state. */ }
      }
    } finally {
      setBusy(false);
    }
  }

  async function nextQuestionZone() {
    if (busy) return;
    setBusy(true);
    try {
      session = await window.LTSession.nextQuestionZone();
      renderActivity();
      feedback('A new unused Question Zone prompt is ready. Your turn progress has not changed.');
    } catch (error) {
      feedback(error.message || 'A new question could not be loaded.');
    } finally {
      setBusy(false);
    }
  }

  async function advanceTurn(completed) {
    if (busy || !session) return;
    setBusy(true);
    try {
      const result = window.LTSession.completeActivity(completed);
      if (result.finished) {
        window.location.href = 'game-complete.html';
        return;
      }
      session = result.session;
      updateProgress();
      feedback(completed
        ? 'Activity completed. Pass the device to the next person.'
        : 'Activity skipped. Pass the device to the next person.');
      els.stage.classList.remove('turn-handoff');
      void els.stage.offsetWidth;
      els.stage.classList.add('turn-handoff');
      showState(els.idle);
      els.start.disabled = false;
      els.start.focus();
    } catch (error) {
      console.error("[Let's Talk] Activity progress could not be saved:", error);
      feedback(error.message || 'Your progress could not be saved. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  function openModal(modal) {
    if (!modal) return;
    previousFocus = document.activeElement;
    currentModal = modal;
    modal.hidden = false;
    modal.querySelector('button')?.focus();
  }

  function closeModal() {
    if (!currentModal) return;
    currentModal.hidden = true;
    currentModal = null;
    previousFocus?.focus();
  }

  function confirmExit() {
    try {
      window.LTSession.finishExit();
      window.location.href = 'index.html';
    } catch (error) {
      feedback(error.message || 'The game could not be cleared safely.');
      closeModal();
    }
  }

  function confirmEnd() {
    if (!session) return;
    try {
      window.LTSession.endEarly();
      window.location.href = 'game-complete.html';
    } catch (error) {
      feedback(error.message || 'The game could not be ended safely.');
      closeModal();
    }
  }

  function setupCanvas() {
    const canvas = els.canvas;
    const context = canvas?.getContext('2d');
    if (!context || reducedMotion) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      particles = Array.from(
        { length: window.matchMedia('(max-width:600px)').matches ? 12 : 28 },
        () => ({
          x: Math.random() * rect.width,
          y: Math.random() * rect.height,
          size: 0.5 + Math.random() * 1.4,
          alpha: 0.15 + Math.random() * 0.4,
          velocity: 0.08 + Math.random() * 0.2
        })
      );
    };

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      context.clearRect(0, 0, rect.width, rect.height);
      particles.forEach((particle) => {
        particle.y -= particle.velocity;
        if (particle.y < 0) {
          particle.y = rect.height;
          particle.x = Math.random() * rect.width;
        }
        context.beginPath();
        context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        context.fillStyle = `rgba(193,160,255,${particle.alpha})`;
        context.shadowBlur = 8;
        context.shadowColor = '#a77aff';
        context.fill();
      });
      canvasFrame = window.requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) window.cancelAnimationFrame(canvasFrame);
      else canvasFrame = window.requestAnimationFrame(draw);
    });
    canvasFrame = window.requestAnimationFrame(draw);
  }

  async function initialize() {
    try {
      session = await window.LTSession.restoreActive();
      if (!session) {
        window.location.replace('index.html#game-setup');
        return;
      }
      updateHeader();
      setupCanvas();

      const playIntro = sessionStorage.getItem('letsTalk.playIntro') === '1';
      sessionStorage.removeItem('letsTalk.playIntro');
      if (playIntro) setIntroVisible(true);
      else {
        els.intro.hidden = true;
        els.intro.setAttribute('aria-hidden', 'true');
      }

      if (session.currentState === 'awaiting_fate') renderFateChoices();
      else if (session.currentState === 'activity_active') renderActivity();
      else showState(els.idle);
    } catch (error) {
      console.error("[Let's Talk] Gameplay initialization failed:", error);
      if (['LEGACY_SESSION', 'INVALID_SAVED_SESSION'].includes(error.code)) {
        sessionStorage.setItem(
          'letsTalk.recoveryNotice',
          `${error.message} Your previous saved data has not been changed.`
        );
        window.location.replace('index.html#game-setup');
        return;
      }
      feedback(error.message || 'Unable to restore this game. Return to Home and start a new session.');
      setBusy(false);
    }
  }

  els.start.addEventListener('click', startTurn);
  els.fate.querySelectorAll('[data-fate]').forEach((button) => {
    button.addEventListener('click', () => selectFate(button.dataset.fate));
  });
  els.fateSkip.addEventListener('click', () => {
    try {
      window.LTSession.completeFateSkip();
      session = window.LTSession.getActive();
      updateProgress();
      showState(els.idle);
      feedback('Pick Your Fate was skipped.');
    } catch (error) {
      feedback(error.message || 'The activity could not be skipped.');
    }
  });
  els.exit.addEventListener('click', () => openModal(els.exitModal));
  els.end.addEventListener('click', () => openModal(els.endModal));
  els.continue.addEventListener('click', closeModal);
  els.keepPlaying.addEventListener('click', closeModal);
  els.confirmExit.addEventListener('click', confirmExit);
  els.confirmEnd.addEventListener('click', confirmEnd);
  els.skipIntro?.addEventListener('click', finishIntro);
  els.openRules?.addEventListener('click', () => els.rulesModal && openModal(els.rulesModal));
  els.closeRules?.addEventListener('click', closeModal);
  els.rulesDone?.addEventListener('click', closeModal);
  els.rulesModal?.addEventListener('click', (event) => {
    if (event.target === els.rulesModal) closeModal();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && currentModal) closeModal();
    if (event.key === 'Tab' && currentModal) {
      const items = [...currentModal.querySelectorAll('button:not(:disabled)')];
      if (items.length && event.shiftKey && document.activeElement === items[0]) {
        event.preventDefault();
        items.at(-1).focus();
      } else if (items.length && !event.shiftKey && document.activeElement === items.at(-1)) {
        event.preventDefault();
        items[0].focus();
      }
    }
  });

  initialize();
})();
