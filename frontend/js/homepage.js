/* LET'S TALK — Homepage setup backed by the production catalog API */
(() => {
  'use strict';

  const topicButtons = [...document.querySelectorAll('[data-topic]')];
  const countButtons = [...document.querySelectorAll('[data-count]')];
  const startButton = document.getElementById('start-game-btn');
  const feedback = document.getElementById('setup-feedback');
  if (!startButton || !feedback || !window.LTSession || !window.LTAPI) return;

  const saved = window.LTSession.getConfig();
  let selectedTopic = ['friends', 'family'].includes(saved.topicCode) ? saved.topicCode : 'friends';
  let selectedCount = [10, 20, 'unlimited'].includes(saved.sessionLength) ? saved.sessionLength : 10;
  let selectedCatalog = null;
  let catalogRequest = 0;
  let busy = false;
  let recoveryNotice = sessionStorage.getItem('letsTalk.recoveryNotice');
  if (recoveryNotice) sessionStorage.removeItem('letsTalk.recoveryNotice');

  function renderSelection() {
    topicButtons.forEach((button) => {
      const selected = button.dataset.topic === selectedTopic;
      button.classList.toggle('selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });

    countButtons.forEach((button) => {
      const value = button.dataset.count === 'unlimited' ? 'unlimited' : Number(button.dataset.count);
      const selected = value === selectedCount;
      button.classList.toggle('selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });

    const label = selectedCount === 'unlimited' ? 'Unlimited' : `${selectedCount} activities`;
    feedback.textContent = `Checking ${window.LTSession.TOPICS[selectedTopic].label} · ${label}…`;
    const savedSuccessfully = window.LTSession.saveConfig({
      topicCode: selectedTopic,
      sessionLength: selectedCount
    });
    if (!savedSuccessfully) {
      feedback.textContent = 'Your setup could not be saved in this browser.';
    }
    return savedSuccessfully;
  }

  async function loadCatalog() {
    const requestId = ++catalogRequest;
    selectedCatalog = null;
    startButton.disabled = true;
    startButton.setAttribute('aria-busy', 'true');
    const configSaved = renderSelection();

    try {
      const catalog = await window.LTAPI.getCatalog(selectedTopic);
      if (requestId !== catalogRequest) return;
      const available = Object.values(catalog.pools || {}).reduce(
        (total, pool) => total + (Number(pool?.available) || 0), 0
      );
      if (available < 1) {
        feedback.textContent = 'This topic currently has no active activities. Please choose another topic.';
        return;
      }
      selectedCatalog = catalog;
      if (!configSaved) {
        feedback.textContent = 'Your setup could not be saved in this browser. Check browser storage before starting.';
        return;
      }
      feedback.textContent = recoveryNotice || `Ready to play ${catalog.topic.name} · ${selectedCount === 'unlimited' ? 'Unlimited' : `${selectedCount} activities`}.`;
      recoveryNotice = null;
      startButton.disabled = busy;
    } catch (error) {
      if (requestId !== catalogRequest) return;
      feedback.textContent = error.message || 'The game catalog could not be loaded. Please try again.';
    } finally {
      if (requestId === catalogRequest) startButton.removeAttribute('aria-busy');
    }
  }

  topicButtons.forEach((button) => {
    button.addEventListener('click', () => {
      if (busy) return;
      const topic = button.dataset.topic;
      if (!['friends', 'family'].includes(topic)) return;
      selectedTopic = topic;
      loadCatalog();
    });
  });

  countButtons.forEach((button) => {
    button.addEventListener('click', () => {
      if (busy) return;
      const value = button.dataset.count === 'unlimited' ? 'unlimited' : Number(button.dataset.count);
      if (![10, 20, 'unlimited'].includes(value)) return;
      selectedCount = value;
      const configSaved = renderSelection();
      if (!configSaved) {
        selectedCatalog = null;
        startButton.disabled = true;
        return;
      }
      if (selectedCatalog) {
        feedback.textContent = `Ready to play ${window.LTSession.TOPICS[selectedTopic].label} · ${value === 'unlimited' ? 'Unlimited' : `${value} activities`}.`;
        startButton.disabled = busy;
      }
    });
  });

  startButton.addEventListener('click', async () => {
    if (busy || !selectedCatalog) return;
    busy = true;
    startButton.disabled = true;
    const originalContent = startButton.innerHTML;
    startButton.innerHTML = '<span>Preparing…</span>';
    startButton.setAttribute('aria-busy', 'true');
    sessionStorage.removeItem('letsTalk.playIntro');

    try {
      await window.LTSession.createSession(selectedTopic, selectedCount, selectedCatalog);
      sessionStorage.setItem('letsTalk.playIntro', '1');
      window.location.href = 'gameplay.html';
    } catch (error) {
      console.error("[Let's Talk] Could not create a new session:", error);
      feedback.textContent = error.message || 'A new game could not be started. Please try again.';
      startButton.innerHTML = originalContent;
      busy = false;
      startButton.disabled = !selectedCatalog;
      startButton.removeAttribute('aria-busy');
    }
  });

  renderSelection();
  loadCatalog();
})();
