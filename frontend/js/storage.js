/* Let's Talk — safe localStorage helpers */

(() => {
  'use strict';

  const PREFIX = 'letsTalk.';

  const keys = Object.freeze({
    config: `${PREFIX}config`,
    activeSession: `${PREFIX}activeSession`,
    lastResult: `${PREFIX}lastResult`
  });


  function read(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);

      return raw === null
        ? fallback
        : JSON.parse(raw);

    } catch (error) {

      console.warn(
        `[Let's Talk] Could not read ${key}:`,
        error
      );

      return fallback;
    }
  }


  function write(key, value) {
    try {

      localStorage.setItem(
        key,
        JSON.stringify(value)
      );

      return true;

    } catch (error) {

      console.error(
        `[Let's Talk] Could not save ${key}:`,
        error
      );

      return false;
    }
  }


  function remove(key) {
    try {

      localStorage.removeItem(key);

      return true;

    } catch (error) {

      console.warn(
        `[Let's Talk] Could not remove ${key}:`,
        error
      );

      return false;
    }
  }


  window.LTStorage = Object.freeze({
    keys,
    read,
    write,
    remove
  });

})();