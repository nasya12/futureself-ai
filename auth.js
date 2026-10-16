/* FutureSelf AI · Giriş kapısı (Supabase Auth, e-posta + 6 haneli kod).
   Her sayfa config.js'ten sonra bu dosyayı yükler; oturum yoksa tam ekran giriş kartı açılır. */
(function () {
  'use strict';
  var C = window.APP_CONFIG || {};
  var SK = 'fs-session';
  var ph = function (v) { return !v || /PROJE-ID|KULLANICI|ANON_PUBLIC/.test(v); };
  var enabled = !ph(C.SUPABASE_URL) && !ph(C.SUPABASE_ANON_KEY);
  var session = null, gate = null, pill = null, pending = '', cdTimer = null;

  function load() { try { return JSON.parse(localStorage.getItem(SK) || 'null'); } catch (e) { return null; } }
  function save(s) { session = s; try { if (s) localStorage.setItem(SK, JSON.stringify(s)); else localStorage.removeItem(SK); } catch (e) {} }
  function toSession(j, email) {
    return { access_token: j.access_token, refresh_token: j.refresh_token,
      expires_at: Math.floor(Date.now() / 1000) + (j.expires_in || 3600),
      email: (j.user && j.user.email) || email || '', id: j.user && j.user.id };
  }
  async function call(path, body) {
    var r = await fetch(C.SUPABASE_URL + '/auth/v1/' + path, { method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: C.SUPABASE_ANON_KEY }, body: JSON.stringify(body) });
    var j = await r.json().catch(function () { return {}; });
    if (!r.ok) { var e = new Error(j.msg || j.error_description || j.message || ('HTTP ' + r.status)); e.status = r.status; throw e; }
    return j;
  }
  async function fresh() {
    if (!enabled) return { access_token: '', email: '' };
    if (!session) { showGate(); return null; }
    if (session.expires_at > Date.now() / 1000 + 60) return session;
    try { var j = await call('token?grant_type=refresh_token', { refresh_token: session.refresh_token }); save(toSession(j, session.email)); paint(); return session; }
    catch (e) { save(null); showGate(); return null; }
  }
  function logout() { save(null); paint(); showGate(); }

  function css() {
    var s = document.createElement('style');
    s.textContent =
      '#fsg{position:fixed;inset:0;z-index:99999;display:grid;place-items:center;padding:16px;overflow:auto;' +
      'background:radial-gradient(60% 50% at 20% 10%,rgba(255,79,163,.35),transparent 70%),radial-gradient(50% 45% at 85% 20%,rgba(200,107,255,.3),transparent 70%),var(--bg,#13040F);' +
      'color:var(--fg,#FFF0F7);font-family:var(--f-body,var(--fb,Manrope,"Segoe UI",system-ui,sans-serif))}' +
      '#fsg .c{width:100%;max-width:440px;border:1px solid var(--line,rgba(255,166,214,.3));border-radius:24px;padding:28px 26px;background:var(--glass2,var(--card2,rgba(40,10,30,.88)));' +
      'backdrop-filter:blur(18px);box-shadow:0 30px 80px -30px var(--acc,#FF4FA3)}' +
      '#fsg h2{margin:14px 0 6px;font:800 28px/1.1 var(--f-display,var(--fd,"Playfair Display",Georgia,serif));letter-spacing:-.02em}' +
      '#fsg h2 em{font-style:italic;background:linear-gradient(100deg,var(--acc,#FF4FA3),var(--acc2,#C86BFF));-webkit-background-clip:text;background-clip:text;color:transparent}' +
      '#fsg p{margin:0 0 6px;color:var(--muted,#D3AFC4);font-size:14px;line-height:1.55}' +
      '#fsg label{display:block;font-weight:700;font-size:13px;margin:16px 0 6px}' +
      '#fsg input{width:100%;font:inherit;font-size:16px;color:inherit;background:rgba(255,255,255,.07);border:1px solid var(--line,rgba(255,166,214,.3));border-radius:12px;padding:12px 14px}' +
      '#fsg input:focus{outline:2px solid var(--acc,#FF4FA3);outline-offset:1px}' +
      '#fsg .code{letter-spacing:.35em;text-align:center;font-size:24px;font-family:var(--f-mono,var(--fm,monospace))}' +
      '#fsg button{font:700 14px inherit;font-family:inherit;border:0;border-radius:999px;padding:12px 22px;cursor:pointer;color:var(--ink,#2B0619);background:linear-gradient(100deg,var(--acc,#FF4FA3),var(--acc2,#C86BFF))}' +
      '#fsg button:disabled{opacity:.55;cursor:progress}' +
      '#fsg button.g{background:transparent;color:inherit;border:1px solid var(--line,rgba(255,166,214,.3));padding:9px 14px;font-size:13px}' +
      '#fsg .row{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:16px}' +
      '#fsg .m{margin-top:12px;font-size:13.5px;min-height:20px}#fsg .m.bad{color:var(--warn,#FF8FA3)}' +
      '#fsg .cd{font:500 12px var(--f-mono,var(--fm,monospace));color:var(--muted,#D3AFC4)}' +
      '#fsg .logo{display:flex;align-items:center;gap:10px;font:800 18px var(--f-display,var(--fd,Georgia,serif))}' +
      '#fsg .logo svg{width:28px;height:28px}' +
      '#fsp{position:fixed;left:14px;bottom:14px;z-index:9000;display:flex;gap:8px;align-items:center;padding:6px 8px 6px 14px;border-radius:999px;' +
      'border:1px solid var(--line,rgba(255,166,214,.3));background:var(--glass2,rgba(40,10,30,.85));-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);' +
      'font:600 12px var(--f-body,var(--fb,system-ui,sans-serif));color:var(--fg,#FFF0F7);max-width:calc(100vw - 28px)}' +
      '#fsp span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:200px}' +
      '#fsp button{font:700 12px inherit;font-family:inherit;border:1px solid var(--line,rgba(255,166,214,.3));background:transparent;color:inherit;border-radius:999px;padding:5px 11px;cursor:pointer}';
    document.head.appendChild(s);
  }
  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }

  function paint() {
    if (!pill) { pill = el('div'); pill.id = 'fsp'; pill.appendChild(el('span')); var b = el('button', null, 'Çıkış'); b.type = 'button'; b.onclick = logout; pill.appendChild(b); document.body.appendChild(pill); }
    pill.hidden = !session;
    if (session) pill.firstChild.textContent = session.email;
  }

  function showGate() {
    if (gate) return;
    gate = el('div'); gate.id = 'fsg'; gate.setAttribute('role', 'dialog'); gate.setAttribute('aria-modal', 'true'); gate.setAttribute('aria-label', 'Giriş');
    var card = el('div', 'c'); gate.appendChild(card);
    var logo = el('div', 'logo');
    logo.innerHTML = '<svg viewBox="0 0 32 32" aria-hidden="true"><defs><linearGradient id="fsgg" x1="0" x2="1"><stop stop-color="#FF4FA3"/><stop offset="1" stop-color="#C86BFF"/></linearGradient></defs><path d="M16 3l10 8-10 18L6 11z" fill="url(#fsgg)"/></svg>';
    logo.appendChild(document.createTextNode('FutureSelf AI'));
    card.appendChild(logo);
    var h = el('h2'); h.appendChild(document.createTextNode('Hoş geldin, ')); h.appendChild(el('em', null, 'diva.')); card.appendChild(h);
    card.appendChild(el('p', null, 'Devam etmek için e-postanı doğrula. Sana 6 haneli bir kod göndeririz; şifre gerekmez, ilk girişte hesabın otomatik açılır.'));

    var f1 = el('form'); f1.noValidate = true;
    var l1 = el('label', null, 'E-posta'); l1.htmlFor = 'fsg-em';
    var em = el('input'); em.id = 'fsg-em'; em.type = 'email'; em.autocomplete = 'email'; em.placeholder = 'ornek@mail.com';
    var r1 = el('div', 'row'); var send = el('button', null, 'Kod gönder'); send.type = 'submit'; r1.appendChild(send);
    f1.appendChild(l1); f1.appendChild(em); f1.appendChild(r1);

    var f2 = el('form'); f2.noValidate = true; f2.hidden = true;
    var l2 = el('label', null, 'E-postana gelen 6 haneli kod'); l2.htmlFor = 'fsg-code';
    var code = el('input', 'code'); code.id = 'fsg-code'; code.inputMode = 'numeric'; code.autocomplete = 'one-time-code'; code.maxLength = 8; code.placeholder = '••••••';
    var r2 = el('div', 'row'); var ver = el('button', null, 'Doğrula ve gir'); ver.type = 'submit';
    var resend = el('button', 'g', 'Tekrar gönder'); resend.type = 'button';
    var back = el('button', 'g', 'E-postayı değiştir'); back.type = 'button';
    var cd = el('span', 'cd'); r2.appendChild(ver); r2.appendChild(resend); r2.appendChild(back); r2.appendChild(cd);
    f2.appendChild(l2); f2.appendChild(code); f2.appendChild(r2);

    var msg = el('div', 'm'); msg.setAttribute('role', 'status'); msg.setAttribute('aria-live', 'polite');
    card.appendChild(f1); card.appendChild(f2); card.appendChild(msg);
    card.appendChild(el('p', null, 'Kod gelmezse spam klasörüne bak.')).style.marginTop = '10px';
    document.body.appendChild(gate); document.body.style.overflow = 'hidden'; em.focus();

    function say(t, bad) { msg.className = 'm' + (bad ? ' bad' : ''); msg.textContent = t || ''; }
    function cool(sec) {
      clearInterval(cdTimer); resend.disabled = true; cd.textContent = sec + ' sn';
      cdTimer = setInterval(function () { sec--; if (sec <= 0) { clearInterval(cdTimer); resend.disabled = false; cd.textContent = ''; } else cd.textContent = sec + ' sn'; }, 1000);
    }
    async function sendCode(isResend) {
      var v = isResend ? pending : em.value.trim().toLowerCase();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) { say('Geçerli bir e-posta yaz.', true); return; }
      send.disabled = true; say('Kod gönderiliyor…');
      try {
        await call('otp', { email: v, create_user: true }); pending = v;
        f1.hidden = true; f2.hidden = false; code.focus(); cool(60);
        say(v + ' adresine kod gönderildi.');
      } catch (e) { say(e.status === 429 ? 'Çok sık denedin, bir dakika bekleyip tekrar dene.' : 'Kod gönderilemedi: ' + e.message, true); }
      finally { send.disabled = false; }
    }
    f1.addEventListener('submit', function (ev) { ev.preventDefault(); sendCode(false); });
    resend.onclick = function () { sendCode(true); };
    back.onclick = function () { f2.hidden = true; f1.hidden = false; say(''); em.focus(); };
    f2.addEventListener('submit', async function (ev) {
      ev.preventDefault(); var t = code.value.replace(/\s/g, '');
      if (t.length < 6) { say('Koddaki tüm haneleri yaz.', true); return; }
      ver.disabled = true; say('Doğrulanıyor…');
      try {
        var j = await call('verify', { type: 'email', email: pending, token: t });
        save(toSession(j, pending)); clearInterval(cdTimer);
        gate.remove(); gate = null; document.body.style.overflow = ''; paint();
        document.dispatchEvent(new CustomEvent('fs-login', { detail: session }));
      } catch (e) { say('Kod hatalı veya süresi dolmuş. Yeni kod isteyebilirsin.', true); }
      finally { ver.disabled = false; }
    });
  }

  window.FSAuth = { enabled: enabled, session: function () { return session; }, fresh: fresh, logout: logout };

  function boot() {
    if (!enabled) return;             // config.js doldurulmamışsa kapı açılmaz (geliştirme)
    css(); session = load();
    if (!session) { showGate(); return; }
    paint(); fresh();                 // süresi dolmuşsa yeniler, olmazsa kapıyı açar
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
