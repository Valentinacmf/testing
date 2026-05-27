(function () {
  const ENDPOINT_URL = 'https://script.google.com/macros/s/AKfycbx7LeUfVazJWeOd6iEdgHNRxhROpypW7kX0B1SPUQz1sdkkJqca8JV5ARUoXPEmRaqH/exec';

  // Skip obvious bots and link-preview crawlers entirely.
  const ua = navigator.userAgent || '';
  const BOT_RE = /bot|crawl|spider|scraper|headless|lighthouse|preview|facebookexternalhit|whatsapp|slackbot|telegram|discord|phantomjs|selenium|puppeteer|playwright|pingdom|gtmetrix|monitor/i;
  if (BOT_RE.test(ua)) return;

  const SESSION_KEY = 'pillar_test_session_id';
  const ENGAGED_KEY = 'pillar_test_engaged';
  const page = location.pathname.split('/').pop() || 'index.html';
  const loadTime = Date.now();

  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
    localStorage.setItem(SESSION_KEY, sessionId);
  }

  // Engagement gate: don't write anything to the sheet until the user proves
  // they're real by clicking. Buffer events client-side; flush on first click.
  // Once engaged, the flag persists in localStorage so later pages send normally.
  let engaged = localStorage.getItem(ENGAGED_KEY) === '1';
  const queue = [];

  function actuallySend(event, useBeacon) {
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

  function dispatch(event, useBeacon) {
    if (engaged) {
      actuallySend(event, useBeacon);
    } else {
      queue.push({ event, useBeacon });
    }
  }

  function markEngaged() {
    if (engaged) return;
    engaged = true;
    localStorage.setItem(ENGAGED_KEY, '1');
    queue.forEach(item => actuallySend(item.event, item.useBeacon));
    queue.length = 0;
  }

  function baseEvent(type) {
    return {
      type,
      sessionId,
      page,
      timestamp: new Date().toISOString(),
      userAgent: ua,
    };
  }

  dispatch(Object.assign(baseEvent('pageview'), {
    referrer: document.referrer || null,
    viewport: window.innerWidth + 'x' + window.innerHeight,
  }));

  document.addEventListener('click', function (e) {
    markEngaged();
    const target = e.target.closest('a, button, [class]') || e.target;
    const link = e.target.closest('a');
    dispatch(Object.assign(baseEvent('click'), {
      tag: target.tagName,
      classes: target.className || null,
      id: target.id || null,
      text: (target.innerText || target.textContent || '').trim().slice(0, 120),
      href: link ? link.getAttribute('href') : null,
    }));
  }, true);

  window.addEventListener('beforeunload', function () {
    dispatch(Object.assign(baseEvent('pageexit'), {
      timeOnPageMs: Date.now() - loadTime,
    }), true);
  });

  window.PillarTracking = {
    track: function (type, extra) {
      dispatch(Object.assign(baseEvent(type), extra || {}));
    },
  };
})();
