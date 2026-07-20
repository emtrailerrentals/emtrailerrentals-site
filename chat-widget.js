/* SOURCE file — rendered to /chat-widget.js by the price build (scripts/build_prices.py).
   Edit THIS file under templates/, never the root copy (the nightly sync overwrites it).
   This file injects three things site-wide:
     1. The mobile hamburger menu (header nav on small screens)
     2. The AI chat widget (talks to the chat API over HTTPS)
     3. Google Ads conversion tracking on booking-link clicks */
(function() {
  'use strict';

  const API_URL = 'https://chat.emtrailerrentals.rent/api/chat';
  const GREETING = 'Hi! Ask me anything about our trailers, rates, or availability.';

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
      '<a href="/utility-trailer-rental/">Utility Trailer — $40/day</a>' +
      '<a href="/enclosed-trailer-rental/">Enclosed Trailer — $95/day</a>' +
      '<a href="/dump-trailer-rental/">Dump Trailer — $80/day</a>' +
      '<a href="/car-hauler-rental/">Car Hauler — $80/day</a>' +
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

  // ── CHAT WIDGET CSS ──────────────────────────────────────────────
  const css = `
    #chat-toggle { position:fixed; bottom:24px; right:24px; width:60px; height:60px; border-radius:50%; background:var(--orange,#E8B923); color:var(--navy,#1a2f4a); border:none; cursor:pointer; box-shadow:0 4px 18px rgba(232,185,35,0.45); z-index:9998; display:flex; align-items:center; justify-content:center; transition:transform 0.2s; }
    #chat-toggle:hover { transform:scale(1.08); }
    #chat-toggle svg { width:28px; height:28px; }

    #chat-window { display:none; position:fixed; bottom:100px; right:24px; width:370px; height:520px; background:white; border-radius:16px; box-shadow:0 8px 40px rgba(0,0,0,0.18); flex-direction:column; overflow:hidden; z-index:9999; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; }
    #chat-window.open { display:flex; }

    #chat-header { background:linear-gradient(135deg,var(--navy,#1a2f4a),var(--navy-light,#1e3a5f)); color:white; padding:14px 16px; font-weight:800; font-size:15px; display:flex; align-items:center; justify-content:space-between; gap:10px; }
    #chat-close { background:none; border:none; color:rgba(255,255,255,0.75); font-size:22px; cursor:pointer; line-height:1; padding:0 2px; }
    #chat-close:hover { color:white; }

    #chat-messages { flex:1; padding:16px 14px; overflow-y:auto; background:#F5F5F7; display:flex; flex-direction:column; gap:10px; }
    #chat-messages::-webkit-scrollbar { width:4px; }
    #chat-messages::-webkit-scrollbar-track { background:#f1f5f9; }
    #chat-messages::-webkit-scrollbar-thumb { background:#cbd5e1; border-radius:2px; }

    .tc-msg { max-width:80%; padding:10px 14px; border-radius:12px; font-size:14px; line-height:1.45; white-space:pre-wrap; overflow-wrap:break-word; }
    .tc-msg.user { align-self:flex-end; background:var(--navy,#1a2f4a); color:white; border-bottom-right-radius:3px; }
    .tc-msg.bot { align-self:flex-start; background:white; color:#1e293b; border:1px solid #e2e8f0; border-bottom-left-radius:3px; }

    .tc-typing { display:flex; gap:4px; align-items:center; align-self:flex-start; background:white; border:1px solid #e2e8f0; border-radius:12px; border-bottom-left-radius:3px; padding:13px 14px; }
    .tc-typing span { width:7px; height:7px; background:#94a3b8; border-radius:50%; animation:tc-bounce 1.2s infinite; }
    .tc-typing span:nth-child(2) { animation-delay:0.2s; }
    .tc-typing span:nth-child(3) { animation-delay:0.4s; }
    @keyframes tc-bounce { 0%,80%,100%{transform:translateY(0);} 40%{transform:translateY(-6px);} }

    #chat-inputbar { padding:12px; border-top:1px solid #e2e8f0; display:flex; gap:8px; background:white; }
    #chat-input { flex:1; min-width:0; padding:11px 13px; border:1.5px solid #e2e8f0; border-radius:10px; font-size:16px; outline:none; font-family:inherit; color:#1e293b; }
    #chat-input:focus { border-color:var(--orange,#E8B923); }
    #send-btn { background:var(--orange,#E8B923); color:var(--navy,#1a2f4a); border:none; border-radius:10px; padding:0 18px; font-weight:800; font-size:14px; cursor:pointer; font-family:inherit; transition:background 0.15s; }
    #send-btn:hover { background:var(--orange-hover,#CBA017); }
    #send-btn:disabled { opacity:0.55; cursor:default; }

    @media(max-width:480px){ #chat-window { width:calc(100vw - 24px); right:12px; } }
    @media(max-width:640px){
      /* clear the .sticky-mobile Book Now bar */
      #chat-toggle { bottom:80px; }
      #chat-window { bottom:146px; height:min(520px, calc(100vh - 160px)); }
    }
  `;

  // ── CHAT WIDGET ──────────────────────────────────────────────────
  let chatWindow, messagesDiv, input, sendBtn;
  let history = [];
  let sending = false;
  let greeted = false;

  function addMessage(text, isUser) {
    const div = document.createElement('div');
    div.className = 'tc-msg ' + (isUser ? 'user' : 'bot');
    div.textContent = text;
    messagesDiv.appendChild(div);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    return div;
  }

  function showTyping() {
    const div = document.createElement('div');
    div.className = 'tc-typing';
    div.innerHTML = '<span></span><span></span><span></span>';
    messagesDiv.appendChild(div);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    return div;
  }

  async function sendMessage() {
    const message = input.value.trim();
    if (!message || sending) return;

    addMessage(message, true);
    history.push({ role: 'user', content: message });
    input.value = '';
    sending = true;
    sendBtn.disabled = true;
    const typing = showTyping();

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history })
      });
      const data = await res.json();
      if (!res.ok || typeof data.reply !== 'string') throw new Error('bad response');
      typing.remove();
      addMessage(data.reply, false);
      history.push({ role: 'assistant', content: data.reply });
    } catch (err) {
      typing.remove();
      addMessage('Sorry, I had trouble connecting. Please try again.', false);
    } finally {
      sending = false;
      sendBtn.disabled = false;
      input.focus();
    }
  }

  function toggleChat(forceClose) {
    let open;
    if (forceClose) {
      chatWindow.classList.remove('open');
      open = false;
    } else {
      open = chatWindow.classList.toggle('open');
    }
    if (open && !greeted) {
      greeted = true;
      addMessage(GREETING, false);
    }
    if (open) input.focus();
  }

  function init() {
    initMobileMenu();

    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    const wrap = document.createElement('div');
    wrap.id = 'trailer-chat-widget';
    wrap.innerHTML =
      '<button id="chat-toggle" aria-label="Open chat">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>' +
      '</button>' +
      '<div id="chat-window" role="dialog" aria-label="Chat with Eagle Mountain Trailer Rental">' +
        '<div id="chat-header">' +
          '<span>Eagle Mountain Trailer Rental</span>' +
          '<button id="chat-close" aria-label="Close chat">&times;</button>' +
        '</div>' +
        '<div id="chat-messages"></div>' +
        '<div id="chat-inputbar">' +
          '<input id="chat-input" type="text" placeholder="Ask about trailers..." autocomplete="off">' +
          '<button id="send-btn">Send</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(wrap);

    chatWindow = document.getElementById('chat-window');
    messagesDiv = document.getElementById('chat-messages');
    input = document.getElementById('chat-input');
    sendBtn = document.getElementById('send-btn');

    document.getElementById('chat-toggle').addEventListener('click', function() { toggleChat(); });
    document.getElementById('chat-close').addEventListener('click', function() { toggleChat(true); });
    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') sendMessage();
    });
  }

  // Init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ── SITE-WIDE BOOK-NOW CONVERSION TRACKING ───────────────────────
  // Any click on a link to the booking system fires the matching trailer
  // conversion. Links with their own inline onclick handlers (landing-page
  // calculator buttons) are skipped to avoid double-counting.
  const BOOK_CONV = [
    { match: 'utility-trailer',  send_to: 'AW-18032854621/W79jCOqx-bscEN2M3pZD', value: 40 },
    { match: 'dump-trailer',     send_to: 'AW-18032854621/Xd8WCP2--bscEN2M3pZD', value: 80 },
    { match: 'enclosed-trailer', send_to: 'AW-18032854621/5MEtCIC_-bscEN2M3pZD', value: 95 },
    { match: 'car-hauler',       send_to: 'AW-18032854621/HAOjCJmKscwcEN2M3pZD', value: 80 }
  ];
  document.addEventListener('click', function (e) {
    const a = e.target && e.target.closest ? e.target.closest('a[href*="emtrailerrentals.hqrent.com"]') : null;
    if (!a || a.getAttribute('onclick') || typeof gtag !== 'function') return;
    const href = a.getAttribute('href') || '';
    // Match trailer from the booking URL; fall back to the page we're on.
    const hay = href.indexOf('hqrent.com/') !== -1 && href.split('hqrent.com/')[1] ? href : location.pathname;
    for (const c of BOOK_CONV) {
      if (hay.indexOf(c.match) !== -1) {
        gtag('event', 'conversion', { 'send_to': c.send_to, 'value': c.value, 'currency': 'USD' });
        return;
      }
    }
  }, true);
})();
