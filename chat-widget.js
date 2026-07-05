(function() {
  'use strict';

  const TRAILERS = {
    dump:     { name: 'Dump Trailer', price: 80,  url: 'https://emtrailerrentals.hqrent.com/dump-trailer/fd6c01d8-f15f-4c',     desc: '14ft · 9,800 lb · Hydraulic dump' },
    enclosed: { name: 'Enclosed Trailer', price: 95, url: 'https://emtrailerrentals.hqrent.com/enclosed-trailer/881c61b9-4056-46', desc: '24ft · 6,130 lb · Lockable & weather-proof' },
    utility:  { name: 'Utility Trailer', price: 41,  url: 'https://emtrailerrentals.hqrent.com/utility-trailer/04e9dc31-3923-48', desc: '7×14ft · 1,945 lb · Open deck' }
  };

  const FLOW = {
    start: {
      msg: "Hi! 👋 I can get you a price in about 60 seconds. What do you need the trailer for?",
      options: [
        { label: '🌿 Landscaping / yard work', next: 'rec_dump_utility' },
        { label: '📦 Moving / hauling stuff',  next: 'rec_enclosed' },
        { label: '🏗️ Construction / debris',   next: 'rec_dump' },
        { label: '🚜 Farm or ranch work',       next: 'rec_utility' },
        { label: '❓ Something else',            next: 'pick_trailer' }
      ]
    },
    rec_dump_utility: {
      msg: "For landscaping, two trailers work great:",
      options: [
        { label: '🚛 Dump Trailer — $80/day (hydraulic, easiest unloading)', trailer: 'dump', next: 'days' },
        { label: '🔧 Utility Trailer — $41/day (open deck, lighter loads)',  trailer: 'utility', next: 'days' }
      ]
    },
    rec_enclosed: {
      msg: "Our 24ft Enclosed Trailer is perfect — weather-proof, lockable, and fits a full household.",
      options: [
        { label: '✅ Enclosed Trailer — $95/day', trailer: 'enclosed', next: 'days' }
      ]
    },
    rec_dump: {
      msg: "Our Dump Trailer is built for it — 9,800 lb capacity with a hydraulic dump. Makes cleanup fast.",
      options: [
        { label: '✅ Dump Trailer — $80/day', trailer: 'dump', next: 'days' }
      ]
    },
    rec_utility: {
      msg: "Our Utility Trailer is a great fit — open deck, easy to load, handles farm and ranch hauling well.",
      options: [
        { label: '✅ Utility Trailer — $41/day', trailer: 'utility', next: 'days' }
      ]
    },
    pick_trailer: {
      msg: "No problem — here are all three trailers. Which one fits your needs?",
      options: [
        { label: '🚛 Dump Trailer — $80/day',     trailer: 'dump',     next: 'days' },
        { label: '📦 Enclosed Trailer — $95/day', trailer: 'enclosed', next: 'days' },
        { label: '🔧 Utility Trailer — $41/day',  trailer: 'utility',  next: 'days' }
      ]
    },
    days: {
      msg: "How many days do you need it?",
      options: [
        { label: '1 day',    days: 1, next: 'quote' },
        { label: '2–3 days', days: 2, next: 'quote' },
        { label: '4–6 days', days: 5, next: 'quote' },
        { label: '1 week+',  days: 7, next: 'quote' }
      ]
    }
  };

  let state = { trailer: null, days: null, booked: false };

  // ── CSS ──────────────────────────────────────────────────────────
  const css = `
    #em-chat-bubble { position:fixed; bottom:24px; right:24px; z-index:9998; cursor:pointer; }
    #em-chat-btn { width:58px; height:58px; border-radius:50%; background:#f97316; box-shadow:0 4px 18px rgba(249,115,22,0.45); display:flex; align-items:center; justify-content:center; border:none; cursor:pointer; transition:transform 0.2s; }
    #em-chat-btn:hover { transform:scale(1.08); }
    #em-chat-btn svg { width:26px; height:26px; color:white; }
    #em-chat-notif { position:absolute; top:-6px; right:-4px; background:#ef4444; color:white; font-size:11px; font-weight:800; width:20px; height:20px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-family:sans-serif; }
    #em-chat-teaser { position:absolute; bottom:68px; right:0; background:white; border-radius:12px 12px 0 12px; padding:10px 14px; white-space:nowrap; font-size:13px; font-weight:600; color:#1e293b; box-shadow:0 4px 16px rgba(0,0,0,0.12); font-family:sans-serif; }
    #em-chat-teaser::after { content:''; position:absolute; bottom:-8px; right:12px; border:8px solid transparent; border-top-color:white; border-bottom:none; }

    #em-chat-window { position:fixed; bottom:90px; right:24px; width:340px; max-height:520px; background:white; border-radius:16px; box-shadow:0 8px 40px rgba(0,0,0,0.18); display:none; flex-direction:column; z-index:9999; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; overflow:hidden; }
    #em-chat-window.open { display:flex; }
    @media(max-width:400px){ #em-chat-window { width:calc(100vw - 20px); right:10px; bottom:80px; } }

    .em-chat-header { background:linear-gradient(135deg,#1e3a5f,#1e4d8c); padding:14px 16px; display:flex; align-items:center; gap:10px; }
    .em-chat-header img { height:36px; width:auto; border-radius:5px; background:#c8d8e0; }
    .em-chat-header-text { flex:1; }
    .em-chat-header-name { color:white; font-size:14px; font-weight:800; }
    .em-chat-header-sub { color:#93c5fd; font-size:11px; }
    .em-chat-close { background:none; border:none; color:rgba(255,255,255,0.7); font-size:20px; cursor:pointer; line-height:1; padding:0 2px; }

    .em-chat-body { flex:1; overflow-y:auto; padding:16px 12px; display:flex; flex-direction:column; gap:10px; }
    .em-chat-body::-webkit-scrollbar { width:4px; }
    .em-chat-body::-webkit-scrollbar-track { background:#f1f5f9; }
    .em-chat-body::-webkit-scrollbar-thumb { background:#cbd5e1; border-radius:2px; }

    .em-msg { display:flex; gap:8px; align-items:flex-end; }
    .em-msg.bot { flex-direction:row; }
    .em-msg.user { flex-direction:row-reverse; }
    .em-avatar { width:28px; height:28px; border-radius:50%; background:#1e3a5f; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .em-avatar svg { width:14px; height:14px; color:white; }
    .em-bubble { max-width:240px; padding:9px 12px; border-radius:12px; font-size:13px; line-height:1.5; }
    .em-msg.bot .em-bubble { background:#f1f5f9; color:#1e293b; border-bottom-left-radius:3px; }
    .em-msg.user .em-bubble { background:#f97316; color:white; border-bottom-right-radius:3px; }

    .em-options { display:flex; flex-direction:column; gap:6px; padding-left:36px; }
    .em-opt-btn { background:white; border:1.5px solid #e2e8f0; border-radius:8px; padding:8px 12px; font-size:13px; font-weight:600; color:#1e3a5f; cursor:pointer; text-align:left; transition:all 0.15s; }
    .em-opt-btn:hover { background:#f0f9ff; border-color:#0369a1; color:#0369a1; }

    .em-quote-card { background:linear-gradient(135deg,#fff7ed,#fff); border:2px solid #f97316; border-radius:12px; padding:14px; margin-left:36px; }
    .em-quote-trailer { font-size:13px; font-weight:800; color:#1e3a5f; margin-bottom:4px; }
    .em-quote-desc { font-size:11px; color:#64748b; margin-bottom:10px; }
    .em-quote-total { font-size:26px; font-weight:900; color:#f97316; }
    .em-quote-detail { font-size:11px; color:#94a3b8; margin-bottom:12px; }
    .em-quote-book { display:flex; align-items:center; justify-content:center; gap:6px; background:#f97316; color:white; font-weight:800; font-size:14px; padding:11px; border-radius:8px; text-decoration:none; border:none; cursor:pointer; width:100%; margin-bottom:7px; }
    .em-quote-book:hover { background:#ea6c0a; }
    .em-quote-save { display:flex; align-items:center; justify-content:center; gap:6px; background:white; color:#0369a1; font-weight:700; font-size:13px; padding:9px; border-radius:8px; border:1.5px solid #bae6fd; cursor:pointer; width:100%; }
    .em-quote-save:hover { background:#f0f9ff; }

    .em-capture { padding:0 0 4px 36px; display:flex; flex-direction:column; gap:7px; }
    .em-capture input { width:100%; padding:9px 11px; border:1.5px solid #e2e8f0; border-radius:8px; font-size:13px; font-family:inherit; }
    .em-capture input:focus { outline:none; border-color:#f97316; }
    .em-capture-send { background:#0369a1; color:white; border:none; border-radius:8px; padding:10px; font-weight:700; font-size:13px; cursor:pointer; font-family:inherit; }
    .em-capture-send:hover { background:#0254850; }

    .em-typing { display:flex; gap:4px; align-items:center; padding:10px 12px; }
    .em-typing span { width:7px; height:7px; background:#94a3b8; border-radius:50%; animation:em-bounce 1.2s infinite; }
    .em-typing span:nth-child(2) { animation-delay:0.2s; }
    .em-typing span:nth-child(3) { animation-delay:0.4s; }
    @keyframes em-bounce { 0%,80%,100%{transform:translateY(0);} 40%{transform:translateY(-6px);} }
  `;

  // ── MOBILE MENU ──────────────────────────────────────────────────
  function initMobileMenu() {
    const header = document.querySelector('.site-header');
    if (!header || document.querySelector('.menu-btn')) return;

    const btn = document.createElement('button');
    btn.className = 'menu-btn';
    btn.setAttribute('aria-label', 'Open menu');
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>';

    const menu = document.createElement('nav');
    menu.className = 'mobile-menu';
    menu.innerHTML =
      '<a href="/">Home</a>' +
      '<a href="/utility-trailer-rental/">Utility Trailer — $41/day</a>' +
      '<a href="/enclosed-trailer-rental/">Enclosed Trailer — $95/day</a>' +
      '<a href="/dump-trailer-rental/">Dump Trailer — $80/day</a>' +
      '<a href="/get-a-quote/">Get a Quote</a>' +
      '<a href="tel:+13852690712">Call (385) 269-0712</a>' +
      '<a class="mm-cta" href="https://emtrailerrentals.hqrent.com/" target="_blank" rel="noopener">Book Now — Open 24/7</a>';

    btn.addEventListener('click', function() {
      const open = menu.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    const cta = header.querySelector('.header-cta');
    header.insertBefore(btn, cta || null);
    document.body.appendChild(menu);
  }

  // ── INJECT HTML ──────────────────────────────────────────────────
  function init() {
    initMobileMenu();
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    document.body.insertAdjacentHTML('beforeend', `
      <div id="em-chat-bubble">
        <div id="em-chat-teaser">Get an instant quote 💬</div>
        <button id="em-chat-btn" onclick="EMChat.toggle()" aria-label="Chat with us">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
        </button>
        <div id="em-chat-notif">1</div>
      </div>

      <div id="em-chat-window">
        <div class="em-chat-header">
          <img src="/images/logo.jpeg" alt="Eagle Mountain Trailer Rental">
          <div class="em-chat-header-text">
            <div class="em-chat-header-name">Eagle Mountain Trailers</div>
            <div class="em-chat-header-sub">🟢 Open 24/7 · Instant quotes</div>
          </div>
          <button class="em-chat-close" onclick="EMChat.toggle()">×</button>
        </div>
        <div class="em-chat-body" id="em-chat-body"></div>
      </div>
    `);

    // Auto-open teaser after 12 seconds
    setTimeout(() => {
      const t = document.getElementById('em-chat-teaser');
      if (t) t.style.display = 'block';
    }, 12000);

    // Hide teaser initially
    const t = document.getElementById('em-chat-teaser');
    if (t) t.style.display = 'none';

    // Start conversation
    setTimeout(() => addStep('start'), 800);
  }

  // ── CHAT ENGINE ──────────────────────────────────────────────────
  function addBotMsg(text, delay) {
    return new Promise(resolve => {
      const body = document.getElementById('em-chat-body');
      // Typing indicator
      const typing = document.createElement('div');
      typing.className = 'em-msg bot';
      typing.innerHTML = `<div class="em-avatar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg></div><div class="em-bubble"><div class="em-typing"><span></span><span></span><span></span></div></div>`;
      body.appendChild(typing);
      body.scrollTop = body.scrollHeight;

      setTimeout(() => {
        typing.querySelector('.em-bubble').textContent = text;
        body.scrollTop = body.scrollHeight;
        resolve();
      }, delay || 800);
    });
  }

  function addUserMsg(text) {
    const body = document.getElementById('em-chat-body');
    const msg = document.createElement('div');
    msg.className = 'em-msg user';
    msg.innerHTML = `<div class="em-bubble">${text}</div>`;
    body.appendChild(msg);
    body.scrollTop = body.scrollHeight;
  }

  function addOptions(options) {
    const body = document.getElementById('em-chat-body');
    const wrap = document.createElement('div');
    wrap.className = 'em-options';
    wrap.id = 'em-opts';
    options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'em-opt-btn';
      btn.textContent = opt.label;
      btn.onclick = () => handleOption(opt, wrap);
      wrap.appendChild(btn);
    });
    body.appendChild(wrap);
    body.scrollTop = body.scrollHeight;
  }

  function handleOption(opt, wrap) {
    // Remove options
    wrap.remove();
    // Show user selection
    addUserMsg(opt.label);
    // Store state
    if (opt.trailer) state.trailer = opt.trailer;
    if (opt.days)    state.days    = opt.days;
    // Next step
    setTimeout(() => addStep(opt.next), 400);
  }

  async function addStep(stepId) {
    if (stepId === 'quote') {
      showQuote();
      return;
    }
    const step = FLOW[stepId];
    if (!step) return;
    await addBotMsg(step.msg);
    setTimeout(() => addOptions(step.options), 200);
  }

  function showQuote() {
    const t = TRAILERS[state.trailer];
    const days = state.days;
    let disc = 0, note = '';
    if (days >= 7)      { disc = 0.10; note = ' (10% weekly discount)'; }
    else if (days >= 3) { disc = 0.05; note = ' (5% multi-day discount)'; }
    const total = Math.round(t.price * days * (1 - disc));
    const dayLabel = days === 1 ? '1 day' : days === 2 ? '2–3 days' : days === 5 ? '4–6 days' : '1 week';

    const body = document.getElementById('em-chat-body');
    const msg = document.createElement('div');
    msg.className = 'em-msg bot';
    msg.innerHTML = `<div class="em-avatar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg></div>`;
    body.appendChild(msg);

    setTimeout(() => {
      const card = document.createElement('div');
      card.className = 'em-quote-card';
      card.innerHTML = `
        <div class="em-quote-trailer">${t.name}</div>
        <div class="em-quote-desc">${t.desc}</div>
        <div class="em-quote-total">$${total}</div>
        <div class="em-quote-detail">$${t.price}/day × ${dayLabel}${note}</div>
        <a href="${t.url}" target="_blank" class="em-quote-book" onclick="EMChat.onBook()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
          Book Now — Check Availability
        </a>
        <button class="em-quote-save" onclick="EMChat.showCapture(${total}, '${t.name}', '${t.url}')">
          📩 Save my quote — not ready yet
        </button>`;
      body.appendChild(card);
      body.scrollTop = body.scrollHeight;
    }, 700);
  }

  function showCapture(total, trailerName, url) {
    const body = document.getElementById('em-chat-body');
    // Remove save button's parent card save btn
    document.querySelectorAll('.em-quote-save').forEach(b => b.remove());

    const wrap = document.createElement('div');
    wrap.className = 'em-capture';
    wrap.innerHTML = `
      <input id="em-cap-name" type="text" placeholder="Your name">
      <input id="em-cap-contact" type="text" placeholder="Phone or email">
      <button class="em-capture-send" onclick="EMChat.sendCapture('${total}','${trailerName}','${url}')">Save My Quote</button>
      <p style="font-size:11px;color:#94a3b8;text-align:center;">We'll reach out to confirm — no spam.</p>`;
    body.appendChild(wrap);
    body.scrollTop = body.scrollHeight;
  }

  function sendCapture(total, trailerName, url) {
    const name = document.getElementById('em-cap-name').value.trim();
    const contact = document.getElementById('em-cap-contact').value.trim();
    if (!name || !contact) { alert('Please enter your name and contact info.'); return; }

    // Send the lead to your inbox via Web3Forms (no visitor email client needed)
    fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        access_key: 'ec3833d1-cd7f-4514-ac8f-42644dda2305',
        subject: 'New Chat Lead: ' + trailerName + ' — ' + name,
        from_name: 'EM Trailer Rentals Chatbot',
        name: name,
        contact: contact,
        trailer: trailerName,
        quote: '$' + total,
        booking_link: url
      })
    }).catch(function(){ /* fail silently — visitor still sees confirmation */ });

    document.querySelector('.em-capture').remove();
    addBotMsg("✓ Quote saved! Ed will follow up shortly. You can also book online any time:", 400);
    setTimeout(() => {
      const bd = document.getElementById('em-chat-body');
      const a = document.createElement('a');
      a.href = url; a.target = '_blank'; a.className = 'em-quote-book';
      a.style.cssText = 'display:flex;align-items:center;justify-content:center;gap:6px;margin:0 0 0 36px;text-decoration:none;';
      a.innerHTML = '📅 Book Online — Open 24/7';
      bd.appendChild(a);
      bd.scrollTop = bd.scrollHeight;
    }, 1200);
  }

  function onBook() {
    state.booked = true;
    // Fire Google Ads conversion if available — use per-trailer conversion ID
    if (typeof gtag === 'function') {
      const convIds = {
        utility:  { send_to: 'AW-18032854621/W79jCOqx-bscEN2M3pZD', value: 40 },
        dump:     { send_to: 'AW-18032854621/Xd8WCP2--bscEN2M3pZD',  value: 80 },
        enclosed: { send_to: 'AW-18032854621/5MEtCIC_-bscEN2M3pZD',  value: 95 }
      };
      const conv = convIds[state.trailer];
      if (conv) gtag('event', 'conversion', { 'send_to': conv.send_to, 'value': conv.value, 'currency': 'USD' });
    }
  }

  function toggle() {
    const win = document.getElementById('em-chat-window');
    const notif = document.getElementById('em-chat-notif');
    const teaser = document.getElementById('em-chat-teaser');
    win.classList.toggle('open');
    if (notif) notif.style.display = 'none';
    if (teaser) teaser.style.display = 'none';
  }

  // ── PUBLIC API ───────────────────────────────────────────────────
  window.EMChat = { toggle, onBook, showCapture, sendCapture };

  // Init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
