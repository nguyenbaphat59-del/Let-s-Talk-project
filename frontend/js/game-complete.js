/* LET'S TALK — Game Completion */
(() => {
  'use strict';

  const message = document.getElementById('completion-message');
  const playAgain = document.getElementById('play-again-btn');
  const backHome = document.getElementById('back-home-btn');
  if (!message || !playAgain || !backHome || !window.LTSession || !window.LTAPI) return;

  const result = window.LTSession.getLastResult();
  const validResult = result &&
    window.LTSession.TOPICS[result.topicCode] &&
    [10, 20, 'unlimited'].includes(result.sessionLength) &&
    ['target_reached', 'ended_early', 'content_exhausted'].includes(result.endReason);

  if (!validResult) {
    message.textContent = 'Start a new conversation whenever you are ready.';
    playAgain.disabled = true;
  } else {
    const messages = {
      target_reached: 'You made room for stories, laughter, and meaningful moments. Keep the conversations going!',
      ended_early: 'Every moment shared is a story worth remembering. Ready for another round?',
      content_exhausted: 'You explored every available activity in this session. The questions may end, but the memories stay.'
    };
    message.textContent = messages[result.endReason];
  }

  playAgain.addEventListener('click', async () => {
    if (playAgain.disabled || !validResult) return;
    playAgain.disabled = true;
    backHome.disabled = true;
    const originalContent = playAgain.innerHTML;
    playAgain.innerHTML = '<span>↻</span> PREPARING…';
    sessionStorage.removeItem('letsTalk.playIntro');

    try {
      const catalog = await window.LTAPI.getCatalog(result.topicCode);
      await window.LTSession.createSession(result.topicCode, result.sessionLength, catalog);
      sessionStorage.setItem('letsTalk.playIntro', '1');
      window.location.href = 'gameplay.html';
    } catch (error) {
      console.error("[Let's Talk] Play Again failed:", error);
      playAgain.disabled = false;
      backHome.disabled = false;
      playAgain.innerHTML = originalContent;
      message.textContent = error.message || 'A new game could not be started. Please try again.';
    }
  });

  backHome.addEventListener('click', (event) => {
    event.preventDefault();
    try {
      if (!window.LTSession.clearLastResult()) {
        throw new Error('The completion result could not be cleared from this browser.');
      }
      window.LTSession.finishExit();
      window.location.href = 'index.html#game-setup';
    } catch (error) {
      console.error("[Let's Talk] Could not clear the completed session:", error);
      message.textContent = error.message || 'The game data could not be cleared safely. Please try again.';
    }
  });
})();
