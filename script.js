const LETTER_TEXT = `From the moment you came into my life,
everything felt a little softer, warmer, and brighter.

Even though at times we argue, it doesnt reach to a point where we fight full on 
and that goes to show that we are capable of wanting to understand each other.
Thats what I love about this relationship we have.

Watching you grow and seeing the person you continue to become
is one of my greatest joys. I can't wait to see all the beautiful things
this next year holds for you.

This little letter is just a reminder:
you are deeply loved, endlessly appreciated,
and forever in my heart.

Happy birthday to my favorite person.`;

const TYPE_SPEED_MS = 45;
const PUNCTUATION_PAUSE_MS = 210;
const LINE_BREAK_PAUSE_MS = 140;
const AUTO_SCROLL_ENABLED = true;
const AUTO_SCROLL_SMOOTH = false;

const scene = document.getElementById("scene");
const openBtn = document.getElementById("openBtn");
const replayBtn = document.getElementById("replayBtn");
const typedEl = document.getElementById("typed");
const signatureEl = document.getElementById("signature");
const letterEl = document.querySelector(".letter");

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let typingTimer = null;
let hasOpened = false;

const audioState = {
  ctx: null,
  enabled: false
};

function ensureAudio() {
  if (audioState.ctx) {
    return;
  }

  try {
    const AudioContextRef = window.AudioContext || window.webkitAudioContext;
    audioState.ctx = new AudioContextRef();
    audioState.enabled = true;
  } catch {
    audioState.enabled = false;
  }
}

function playOpenSound() {
  if (!audioState.enabled || !audioState.ctx) {
    return;
  }

  const ctx = audioState.ctx;
  const now = ctx.currentTime;
  const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.12, ctx.sampleRate);
  const channel = noiseBuffer.getChannelData(0);

  for (let i = 0; i < channel.length; i += 1) {
    channel[i] = (Math.random() * 2 - 1) * 0.35;
  }

  const noiseSource = ctx.createBufferSource();
  noiseSource.buffer = noiseBuffer;
  const band = ctx.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.setValueAtTime(900, now);
  band.Q.value = 0.7;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.13);

  noiseSource.connect(band).connect(gain).connect(ctx.destination);
  noiseSource.start(now);
  noiseSource.stop(now + 0.13);
}

function playTypeTick() {
  if (!audioState.enabled || !audioState.ctx) {
    return;
  }

  const ctx = audioState.ctx;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "triangle";
  osc.frequency.setValueAtTime(1400 + Math.random() * 240, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.018, now + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

  osc.connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.045);
}

function clearTyping() {
  if (typingTimer) {
    window.clearTimeout(typingTimer);
    typingTimer = null;
  }
}

function setCaret(content) {
  typedEl.innerHTML = `${content}<span class="caret" aria-hidden="true"></span>`;
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function scrollLetterToBottom(forceAuto = false) {
  if (!AUTO_SCROLL_ENABLED || !letterEl) {
    return;
  }

  if (letterEl.scrollHeight <= letterEl.clientHeight) {
    return;
  }

  const shouldSmooth = !forceAuto && AUTO_SCROLL_SMOOTH;
  if (shouldSmooth && typeof letterEl.scrollTo === "function") {
    try {
      letterEl.scrollTo({
        top: letterEl.scrollHeight,
        behavior: "smooth"
      });
      return;
    } catch {
    }
  }

  letterEl.scrollTop = letterEl.scrollHeight;
}

function scrollLetterToTop() {
  if (!letterEl) {
    return;
  }

  if (typeof letterEl.scrollTo === "function") {
    try {
      letterEl.scrollTo({
        top: 0,
        behavior: "auto"
      });
      return;
    } catch {
    }
  }

  letterEl.scrollTop = 0;
}

function typeLetterText(text, done) {
  clearTyping();
  signatureEl.style.opacity = "0";
  signatureEl.style.transform = "translateY(6px)";
  scene.classList.remove("done");

  if (prefersReducedMotion) {
    typedEl.textContent = text;
    scrollLetterToTop();
    done();
    return;
  }

  let index = 0;
  let rendered = "";

  function tick() {
    if (index >= text.length) {
      typedEl.textContent = rendered;
      scrollLetterToTop();
      done();
      return;
    }

    const char = text[index];
    rendered += char;
    const safe = escapeHtml(rendered).replace(/\n/g, "<br>");
    setCaret(safe);
    scrollLetterToBottom();

    if (char !== " " && char !== "\n") {
      playTypeTick();
    }

    let delay = TYPE_SPEED_MS;
    if (/[,.!?;:]/.test(char)) {
      delay += PUNCTUATION_PAUSE_MS;
    } else if (char === "\n") {
      delay += LINE_BREAK_PAUSE_MS;
    }

    index += 1;
    typingTimer = window.setTimeout(tick, delay);
  }

  tick();
}

function startSequence() {
  if (hasOpened) {
    return;
  }

  hasOpened = true;
  ensureAudio();
  if (audioState.ctx && audioState.ctx.state === "suspended") {
    audioState.ctx.resume();
  }

  scene.classList.add("open");
  playOpenSound();
  scrollLetterToTop();

  const typingDelay = prefersReducedMotion ? 120 : 760;
  window.setTimeout(() => {
    typeLetterText(LETTER_TEXT, () => {
      scene.classList.add("done");
    });
  }, typingDelay);

  openBtn.setAttribute("aria-label", "Love letter opened");
}

function resetAndReplay() {
  clearTyping();
  typedEl.textContent = "";
  scene.classList.remove("done", "open");
  scrollLetterToTop();

  window.setTimeout(() => {
    hasOpened = false;
    startSequence();
  }, 220);
}

openBtn.addEventListener("click", startSequence);
replayBtn.addEventListener("click", resetAndReplay);

openBtn.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    startSequence();
  }
});
