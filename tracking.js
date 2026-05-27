(function () {
  // PASTE YOUR APPS SCRIPT WEB APP URL HERE (see apps-script.gs for setup):
  const ENDPOINT_URL = 'https://script.google.com/macros/s/AKfycbx7LeUfVazJWeOd6iEdgHNRxhROpypW7kX0B1SPUQz1sdkkJqca8JV5ARUoXPEmRaqH/exec';

  const SESSION_KEY = 'pillar_test_session_id';
  const page = location.pathname.split('/').pop() || 'index.html';
  const loadTime = Date.now();

  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
    localStorage.setItem(SESSION_KEY, sessionId);
  }

  function send(event, useBeacon) {
    if (!ENDPOINT_URL || ENDPOINT_URL.startsWith('PASTE_')) {
      console.warn('[tracking] ENDPOINT_URL not configured');
      return;
    }
    const payload = JSON.stringify(event);
    if (useBeacon && navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'text/plain;charset=UTF-8' });
      navigator.sendBeacon(ENDPOINT_URL, blob);
    } else {
      fetch(ENDPOINT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }
  }

  function baseEvent(type) {
    return {
      type,
      sessionId,
      page,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    };
  }

  send(Object.assign(baseEvent('pageview'), {
    referrer: document.referrer || null,
    viewport: window.innerWidth + 'x' + window.innerHeight,
  }));

  document.addEventListener('click', function (e) {
    const target = e.target.closest('a, button, [class]') || e.target;
    const link = e.target.closest('a');
    send(Object.assign(baseEvent('click'), {
      tag: target.tagName,
      classes: target.className || null,
      id: target.id || null,
      text: (target.innerText || target.textContent || '').trim().slice(0, 120),
      href: link ? link.getAttribute('href') : null,
    }));
  }, true);

  window.addEventListener('beforeunload', function () {
    send(Object.assign(baseEvent('pageexit'), {
      timeOnPageMs: Date.now() - loadTime,
    }), true);
  });

  window.PillarTracking = {
    track: function (type, extra) {
      send(Object.assign(baseEvent(type), extra || {}));
    },
  };
})();
