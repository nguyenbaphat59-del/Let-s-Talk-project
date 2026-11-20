
/* ==========================================================
   LET'S TALK — HOMEPAGE GAME SETUP
   Existing LTSession integration
========================================================== */

(() => {
  'use strict';

  const topicButtons = [
    ...document.querySelectorAll('[data-topic]')
  ];

  const countButtons = [
    ...document.querySelectorAll('[data-count]')
  ];

  const startButton =
    document.getElementById('start-game-btn');

  const feedback =
    document.getElementById('setup-feedback');

  if (!startButton) return;

  const saved = window.LTSession.getConfig();

  let selectedTopic = [
    'friends',
    'family'
  ].includes(saved.topic)
    ? saved.topic
    : 'friends';

  let selectedCount = [
    10,
    20,
    'unlimited'
  ].includes(saved.questionCount)
    ? saved.questionCount
    : 10;

  /* ========================================================
     RENDER SELECTION
  ======================================================== */

  function renderSelection() {
    topicButtons.forEach(button => {
      const selected =
        button.dataset.topic === selectedTopic;

      button.classList.toggle('selected', selected);

      button.setAttribute(
        'aria-pressed',
        String(selected)
      );
    });

    countButtons.forEach(button => {
      const value =
        button.dataset.count === 'unlimited'
          ? 'unlimited'
          : Number(button.dataset.count);

      const selected = value === selectedCount;

      button.classList.toggle('selected', selected);

      button.setAttribute(
        'aria-pressed',
        String(selected)
      );
    });

    const label = selectedCount === 'unlimited'
      ? 'Unlimited questions'
      : `${selectedCount} questions`;

    feedback.textContent =
      `Ready to play ${window.LTSession.TOPICS[selectedTopic].label} · ${label}.`;

    window.LTSession.saveConfig({
      topic: selectedTopic,
      questionCount: selectedCount
    });
  }

  /* ========================================================
     TOPIC SELECTION
  ======================================================== */

  topicButtons.forEach(button => {
    button.addEventListener('click', () => {
      if (startButton.disabled) return;

      const topic = button.dataset.topic;

      if (!['friends', 'family'].includes(topic)) {
        return;
      }

      selectedTopic = topic;
      renderSelection();
    });
  });

  /* ========================================================
     QUESTION COUNT SELECTION
  ======================================================== */

  countButtons.forEach(button => {
    button.addEventListener('click', () => {
      if (startButton.disabled) return;

      const value =
        button.dataset.count === 'unlimited'
          ? 'unlimited'
          : Number(button.dataset.count);

      if (![10, 20, 'unlimited'].includes(value)) {
        return;
      }

      selectedCount = value;
      renderSelection();
    });
  });

  /* ========================================================
     START GAME
  ======================================================== */

  startButton.addEventListener('click', async () => {
    if (startButton.disabled) return;

    startButton.disabled = true;

    const originalContent = startButton.innerHTML;

    // Clear any old intro state before starting.
    sessionStorage.removeItem('letsTalk.playIntro');

    feedback.textContent = 'Preparing your questions…';

    startButton.setAttribute('aria-busy', 'true');

    try {
      await window.LTSession.createSession(
        selectedTopic,
        selectedCount
      );

      // This flag is consumed by gameplay.js.
      sessionStorage.setItem(
        'letsTalk.playIntro',
        '1'
      );

      window.location.href = 'gameplay.html';

    } catch (error) {
      console.error('[Let’s Talk] Session initialization error:', error);

      sessionStorage.removeItem('letsTalk.playIntro');

      feedback.textContent =
        error.message ||
        'Something went wrong. Please try again.';

      startButton.disabled = false;
      startButton.innerHTML = originalContent;
      startButton.removeAttribute('aria-busy');
    }
  });

  /* ========================================================
     INITIAL STATE
  ======================================================== */

  renderSelection();

})();
