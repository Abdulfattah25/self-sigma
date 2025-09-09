// Simple UTC+7 (WIB/WITA) date helpers. Expose via window.WITA
(function (global) {
  const OFFSET_MS = 7 * 60 * 60 * 1000; // UTC+7 (WIB - Waktu Indonesia Barat)

  function pad(n) {
    return n < 10 ? '0' + n : String(n);
  }

  // Return YYYY-MM-DD adjusted to WITA based on current moment
  function today() {
    const ms = Date.now() + OFFSET_MS;
    return new Date(ms).toISOString().slice(0, 10);
  }

  // Return YYYY-MM-DD for N days ago relative to WITA 'today'
  function isoDateNDaysAgo(n) {
    const base = Date.now() + OFFSET_MS;
    const target = base - n * 86400000;
    return new Date(target).toISOString().slice(0, 10);
  }

  // Advance an ISO date string by delta days (works on calendar days)
  function advanceIso(iso, delta) {
    const [y, m, d] = iso.split('-').map((v) => parseInt(v, 10));
    const dt = new Date(Date.UTC(y, m - 1, d));
    dt.setUTCDate(dt.getUTCDate() + delta);
    return dt.toISOString().slice(0, 10);
  }

  // Month start (YYYY-MM-01) and end (YYYY-MM-DD last day) strings
  function monthStartIso(year, monthIndex0) {
    const y = Number(year);
    const m = Number(monthIndex0) + 1;
    return `${y}-${pad(m)}-01`;
  }
  function monthEndIso(year, monthIndex0) {
    const y = Number(year);
    const m = Number(monthIndex0);
    const last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    return `${y}-${pad(m + 1)}-${pad(last)}`;
  }

  // Current year/month/day according to WITA
  function nowParts() {
    const iso = today();
    const [y, m, d] = iso.split('-').map((v) => parseInt(v, 10));
    return { year: y, month: m, day: d };
  }

  global.WITA = {
    today,
    isoDateNDaysAgo,
    advanceIso,
    monthStartIso,
    monthEndIso,
    nowParts,
  };
})(window);
