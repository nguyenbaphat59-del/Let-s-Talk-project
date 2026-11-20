/* Let's Talk — deterministic session and question-pool logic */

(() => {
  'use strict';

  const storage = window.LTStorage;


  // =========================================
  // TOPICS
  // =========================================

  const TOPICS = Object.freeze({

    friends: {
      label: 'Friends',
      icon: '♟'
    },

    family: {
      label: 'Family',
      icon: '⌂'
    }

  });


  const QUESTION_URL = 'data/questions.json';

  let questionBankPromise;


  // =========================================
  // UTILITIES
  // =========================================

  const clone = value =>
    JSON.parse(JSON.stringify(value));


  function shuffleArray(items) {

    const result = [...items];

    for (let i = result.length - 1; i > 0; i -= 1) {

      const j = Math.floor(
        Math.random() * (i + 1)
      );

      [result[i], result[j]] =
        [result[j], result[i]];

    }

    return result;
  }


  const makeId = () =>
    window.crypto?.randomUUID?.() ||
    `lt-${Date.now()}-${Math.random().toString(16).slice(2)}`;


  const now = () =>
    new Date().toISOString();


  // =========================================
  // QUESTION BANK
  // =========================================

  async function getQuestionBank() {

    if (!questionBankPromise) {

      questionBankPromise = fetch(
        QUESTION_URL,
        { cache: 'no-store' }

      ).then(response => {

        if (!response.ok) {

          throw new Error(
            `Question bank could not be loaded (${response.status}).`
          );

        }

        return response.json();

      }).then(bank => {

        for (const topic of Object.keys(TOPICS)) {

          if (
            !Array.isArray(bank[topic]) ||
            bank[topic].length === 0
          ) {

            throw new Error(
              `The ${topic} question bank is missing or empty.`
            );

          }

        }

        return bank;

      }).catch(error => {

        questionBankPromise = null;

        throw error;

      });

    }

    return questionBankPromise;
  }


  // =========================================
  // ACTIVE SESSION STORAGE
  // =========================================

  function getActive() {

    return storage.read(
      storage.keys.activeSession
    );

  }


  function saveActive(session) {

    session.updatedAt = now();

    if (
      !storage.write(
        storage.keys.activeSession,
        session
      )
    ) {

      throw new Error(
        'Your game session could not be saved in this browser.'
      );

    }

    return session;
  }


  // =========================================
  // CREATE SESSION
  // =========================================

  async function createSession(
    topic,
    questionCount
  ) {

    if (!TOPICS[topic]) {

      throw new Error(
        'Please select a valid topic.'
      );

    }


    const bank = await getQuestionBank();

    const allQuestions =
      shuffleArray(bank[topic]);


    const unlimited =
      questionCount === 'unlimited';

    const total = unlimited
      ? null
      : Number(questionCount);


    if (
      !unlimited &&
      (
        ![10, 20].includes(total) ||
        allQuestions.length < total
      )
    ) {

      throw new Error(
        'Please select 10, 20 or Unlimited questions.'
      );

    }


    let sequence;
    let shufflePool;


    if (unlimited) {

      sequence = [
        allQuestions[0].id
      ];

      shufflePool = allQuestions
        .slice(1)
        .map(question => question.id);

    } else {

      sequence = allQuestions
        .slice(0, total)
        .map(question => question.id);

      shufflePool = allQuestions
        .slice(total)
        .map(question => question.id);

    }


    const session = {

      schemaVersion: 1,

      sessionId: makeId(),

      topic,

      questionCount:
        unlimited ? 'unlimited' : total,

      totalQuestions: total,

      sequence,

      shufflePool,

      displayedQuestionIds: [
        sequence[0]
      ],

      currentQuestionIndex: 0,

      completedQuestionCount: 0,

      skippedQuestionCount: 0,

      usedActivityContentIds: [],

      status: 'active',

      createdAt: now(),

      updatedAt: now()

    };


    saveActive(session);

    return session;
  }


  // =========================================
  // GET CURRENT QUESTION
  // =========================================

  function getQuestion(session) {

    if (
      !session ||
      !TOPICS[session.topic]
    ) {

      return null;

    }


    const bankPromise = getQuestionBank();


    return bankPromise.then(bank => {

      const id =
        session.sequence[
          session.currentQuestionIndex
        ];

      return bank[session.topic].find(
        question => question.id === id
      ) || null;

    });

  }


  // =========================================
  // SHUFFLE CURRENT QUESTION
  // =========================================

  async function replaceCurrentWithShuffle(session) {

    if (
      !session ||
      session.status !== 'active'
    ) {

      throw new Error(
        'There is no active game session.'
      );

    }


    if (session.shufflePool.length === 0) {

      return {
        session,
        question: null,
        exhausted: true
      };

    }


    const bank = await getQuestionBank();


    const randomIndex = Math.floor(
      Math.random() * session.shufflePool.length
    );


    const [replacementId] =
      session.shufflePool.splice(
        randomIndex,
        1
      );


    // Replace current question
    session.sequence[
      session.currentQuestionIndex
    ] = replacementId;


    // Record displayed question
    if (
      !session.displayedQuestionIds.includes(
        replacementId
      )
    ) {

      session.displayedQuestionIds.push(
        replacementId
      );

    }


    saveActive(session);


    const question = bank[session.topic].find(
      item => item.id === replacementId
    ) || null;


    return {
      session,
      question,
      exhausted: false
    };

  }


  // =========================================
  // ADVANCE TO NEXT QUESTION
  // =========================================

  async function advance(session, options = {}) {

    if (
      !session ||
      session.status !== 'active'
    ) {

      throw new Error(
        'There is no active game session.'
      );

    }


    const currentId =
      session.sequence[
        session.currentQuestionIndex
      ];


    if (!currentId) {

      throw new Error(
        'The current question could not be found.'
      );

    }


    if (options.completed === false) {
      session.skippedQuestionCount = (session.skippedQuestionCount || 0) + 1;
    } else {
      session.completedQuestionCount += 1;
    }


    // UNLIMITED MODE
    if (
      session.questionCount === 'unlimited'
    ) {

      if (session.shufflePool.length === 0) {

        session.status = 'completed';

        const result = makeResult(
          session,
          'question-bank-exhausted'
        );

        storage.write(
          storage.keys.lastResult,
          result
        );

        storage.remove(
          storage.keys.activeSession
        );

        return {
          finished: true,
          session: null,
          result
        };

      }


      const nextId =
        session.shufflePool.shift();


      session.sequence.push(nextId);

      session.currentQuestionIndex += 1;


      if (
        !session.displayedQuestionIds.includes(
          nextId
        )
      ) {

        session.displayedQuestionIds.push(
          nextId
        );

      }


      saveActive(session);


      return {
        finished: false,
        session,
        question: await getQuestion(session)
      };

    }


    // FINITE MODE
    if (
      session.currentQuestionIndex >=
      session.totalQuestions - 1
    ) {

      session.status = 'completed';

      const result = makeResult(
        session,
        'finished'
      );

      storage.write(
        storage.keys.lastResult,
        result
      );

      storage.remove(
        storage.keys.activeSession
      );

      return {
        finished: true,
        session: null,
        result
      };

    }


    session.currentQuestionIndex += 1;


    const nextId =
      session.sequence[
        session.currentQuestionIndex
      ];


    if (
      !session.displayedQuestionIds.includes(
        nextId
      )
    ) {

      session.displayedQuestionIds.push(
        nextId
      );

    }


    saveActive(session);


    return {
      finished: false,
      session,
      question: await getQuestion(session)
    };

  }


  // =========================================
  // GAME RESULT
  // =========================================

  function makeResult(
    session,
    endReason = 'ended-early'
  ) {

    const total =
      session.questionCount === 'unlimited'
        ? null
        : session.totalQuestions;


    return {

      schemaVersion: 1,

      sessionId: session.sessionId,

      topic: session.topic,

      questionCount: session.questionCount,

      totalQuestions: total,

      completedQuestionCount:
        session.completedQuestionCount,

      skippedQuestionCount:
        session.skippedQuestionCount || 0,

      currentQuestionNumber:
        session.currentQuestionIndex + 1,

      displayedQuestionCount:
        session.displayedQuestionIds.length,

      endReason,

      completedAt: now()

    };

  }


  // =========================================
  // END GAME EARLY
  // =========================================

  function endEarly(session) {

    if (
      !session ||
      session.status !== 'active'
    ) {

      throw new Error(
        'There is no active game session.'
      );

    }


    session.status = 'completed';


    const result = makeResult(
      session,
      'ended-early'
    );


    storage.write(
      storage.keys.lastResult,
      result
    );


    storage.remove(
      storage.keys.activeSession
    );


    return result;
  }


  // =========================================
  // EXIT GAME
  // =========================================

  function finishExit() {

    storage.remove(
      storage.keys.activeSession
    );

  }


  // =========================================
  // LAST RESULT
  // =========================================

  function getLastResult() {

    return storage.read(
      storage.keys.lastResult
    );

  }


  // =========================================
  // GAME CONFIG
  // =========================================

  function saveConfig(config) {

    storage.write(
      storage.keys.config,
      config
    );

  }


  function getConfig() {

    return storage.read(
      storage.keys.config,
      {
        topic: 'friends',
        questionCount: 10
      }
    );

  }


  // =========================================
  // RESTORE ACTIVE SESSION
  // =========================================

  async function restoreActive() {

    const session = getActive();


    if (
      !session ||
      session.schemaVersion !== 1 ||
      session.status !== 'active'
    ) {

      return null;

    }


    if (
      !TOPICS[session.topic] ||
      !Array.isArray(session.sequence) ||
      !Array.isArray(session.shufflePool) ||
      !Array.isArray(session.displayedQuestionIds) ||
      !Number.isInteger(session.currentQuestionIndex) ||
      !Number.isInteger(session.completedQuestionCount)
    ) {

      storage.remove(
        storage.keys.activeSession
      );

      return null;

    }


    const bank = await getQuestionBank();


    const validIds = new Set(
      bank[session.topic].map(
        item => item.id
      )
    );


    const combinedIds = [
      ...session.sequence,
      ...session.shufflePool
    ];


    const uniqueCombinedIds =
      new Set(combinedIds);


    const validCount =
      session.questionCount === 'unlimited' ||
      [10, 20].includes(session.questionCount);


    if (
      !validCount ||
      !session.sequence.length ||
      session.currentQuestionIndex < 0 ||
      session.currentQuestionIndex >= session.sequence.length ||
      session.sequence.some(id => !validIds.has(id)) ||
      session.shufflePool.some(id => !validIds.has(id)) ||
      uniqueCombinedIds.size !== combinedIds.length ||
      session.displayedQuestionIds.some(id => !validIds.has(id))
    ) {

      storage.remove(
        storage.keys.activeSession
      );

      return null;

    }


    return session;
  }


  // =========================================
  // PUBLIC API
  // =========================================

  window.LTSession = Object.freeze({

    TOPICS,

    getQuestionBank,

    createSession,

    getQuestion,

    replaceCurrentWithShuffle,

    advance,

    endEarly,

    finishExit,

    getActive,

    getLastResult,

    saveConfig,

    getConfig,

    restoreActive,

    shuffleArray

  });

})();