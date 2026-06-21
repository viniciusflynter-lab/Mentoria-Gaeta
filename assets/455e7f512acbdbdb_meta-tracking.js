/**
 * Helpers Meta Pixel + CAPI — carregar após fbq (TrackingHead).
 * Uso futuro em CTAs: AsimovMeta.track('InitiateCheckout', { custom_data: { ... } });
 */
(function (global) {
  var CAPI_ENDPOINT = '/api/meta-capi';

  function getCookie(name) {
    var m = global.document.cookie.match(
      new RegExp('(?:^|; )' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=([^;]*)')
    );
    return m ? decodeURIComponent(m[1]) : null;
  }

  function randStr() {
    return Math.random().toString(36).slice(2, 11);
  }

  function externalId() {
    try {
      var id = global.localStorage.getItem('aa_uid');
      if (!id) {
        id = 'u_' + Date.now() + '_' + randStr() + randStr();
        global.localStorage.setItem('aa_uid', id);
      }
      return id;
    } catch (e) {
      return null;
    }
  }

  function capiPayload(eventName, eventId, customData) {
    return {
      event_name: eventName,
      event_id: eventId,
      event_time: Math.floor(Date.now() / 1000),
      event_source_url: global.location.href,
      user_agent: global.navigator.userAgent,
      fbp: getCookie('_fbp') || undefined,
      fbc: getCookie('_fbc') || undefined,
      external_id: externalId() || undefined,
      custom_data: customData || undefined,
    };
  }

  /**
   * @param {string} eventName — ex. PageView, Lead, InitiateCheckout
   * @param {object} [opts]
   * @param {object} [opts.fbqParams] — 3º arg do fbq('track', ...)
   * @param {object} [opts.custom_data] — CAPI custom_data
   * @param {string} [opts.eventId] — dedup; gera se omitido
   */
  function track(eventName, opts) {
    opts = opts || {};
    var eventId = opts.eventId || 'evt_' + Date.now() + '_' + randStr();
    var fbqParams = opts.fbqParams || {};

    if (typeof global.fbq === 'function') {
      global.fbq('track', eventName, fbqParams, { eventID: eventId });
    }

    if (!CAPI_ENDPOINT) return eventId;

    global.fetch(CAPI_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify(capiPayload(eventName, eventId, opts.custom_data)),
    }).catch(function (e) {
      console.warn('[CAPI] fail', e);
    });

    return eventId;
  }

  global.AsimovMeta = {
    track: track,
    getCookie: getCookie,
    externalId: externalId,
  };
})(typeof window !== 'undefined' ? window : globalThis);
