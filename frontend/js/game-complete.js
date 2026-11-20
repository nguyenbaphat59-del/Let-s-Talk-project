
/* ==========================================================
   LET'S TALK — GAME COMPLETION
========================================================== */

(() => {
  'use strict';

  const result = window.LTSession.getLastResult();

  const topicMap = window.LTSession.TOPICS;

  const message = document.getElementById('completion-message');
  const playAgain = document.getElementById('play-again-btn');

  if (!result || !topicMap[result.topic]) {
    message.textContent =
      'Start a new conversation whenever you are ready.';

    playAgain.disabled = true;

    return;
  }

  message.textContent = result.endReason === 'ended-early'
    ? 'Every moment shared is a story worth remembering. Ready for another round?'
    : 'You made room for stories, laughter, and meaningful moments. Keep the conversations going!';

  /* ========================================================
     PLAY AGAIN
  ======================================================== */

  playAgain.addEventListener('click', async () => {
    if (playAgain.disabled) return;

    playAgain.disabled = true;

    const originalContent = playAgain.innerHTML;

    playAgain.innerHTML = '<span>↻</span> PREPARING…';

    // Clear stale intro state.
    sessionStorage.removeItem('letsTalk.playIntro');

    try {
      await window.LTSession.createSession(
        result.topic,
        result.questionCount
      );

      // Play Again is a new session, so replay the intro.
      sessionStorage.setItem(
        'letsTalk.playIntro',
        '1'
      );

      window.location.href = 'gameplay.html';

    } catch (error) {
      console.error('[Let’s Talk] Play Again error:', error);

      sessionStorage.removeItem('letsTalk.playIntro');

      playAgain.disabled = false;
      playAgain.innerHTML = originalContent;

      message.textContent =
        error.message ||
        'A new game could not be started.';
    }
  });

})();
