// main.js
const cards = document.querySelectorAll('.card');

// Amplifica cerca de los bordes para un "snap" tipo Perplexity
function edgeAmplify(t) {
  const a = Math.abs(t);
  return Math.sign(t) * (0.55 * a + 0.45 * a * a * a); // suave al centro, fuerte en esquinas
}

function getCSSNumber(varName, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(varName);
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
}

// Helpers para ocultar/mostrar iluminación sin tocar el CSS global
function hideLight(card) {
  // Apaga brillo y borde solo en este card
  card.style.setProperty('--edge-alpha', '0');
  card.style.setProperty('--glow-alpha', '0');
  card.style.setProperty('--glow-opacity', '0');
  // Resetea la sombra dinámica
  card.style.setProperty('--sx', '0px');
  card.style.setProperty('--sy', '0px');
  // (Opcional) centra coords; la luz está apagada, así que no se verá
  card.style.setProperty('--mx', '50%');
  card.style.setProperty('--my', '50%');
}

function showLight(card) {
  // Quita los overrides inline para volver a los valores del tema activo
  card.style.removeProperty('--edge-alpha');
  card.style.removeProperty('--glow-alpha');
  card.style.removeProperty('--glow-opacity');
}

cards.forEach(card => {
  let targetRX = 0, targetRY = 0, targetScale = 1, targetTX = 0, targetTY = 0;
  let curRX = 0, curRY = 0, curScale = 1, curTX = 0, curTY = 0;
  let hovering = false;
  let rafId = null;

  // Al iniciar, deja la iluminación apagada
  hideLight(card);

  function onMove(e) {
    const rect = card.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // coords en %
    const px = (x / rect.width) * 100;
    const py = (y / rect.height) * 100;

    // pasar al CSS (glow / borde)
    card.style.setProperty('--mx', `${px}%`);
    card.style.setProperty('--my', `${py}%`);

    // normalizados -1..1 (centro=0)
    const nx = (px - 50) / 50;
    const ny = (py - 50) / 50;

    // boost de esquinas
    const ax = edgeAmplify(nx);
    const ay = edgeAmplify(ny);

    // variables desde CSS
    const maxTilt = getCSSNumber('--tilt', 24);
    const translateMax = getCSSNumber('--translate-max', 14);
    const popScale = getCSSNumber('--pop-scale', 1.035);

    // "pop-out": donde está el cursor, se ACERCA
    targetRY = -ax * maxTilt;   // giro horizontal
    targetRX =  ay * maxTilt;   // giro vertical
    targetScale = popScale;

    // traslación magnética hacia el cursor
    targetTX = ax * translateMax;
    targetTY = ay * translateMax;

    // sombra dinámica: mueve en sentido opuesto a la traslación
    const shadowX = (-ax * (translateMax + 6)).toFixed(2) + 'px';
    const shadowY = (-ay * (translateMax + 10)).toFixed(2) + 'px';
    card.style.setProperty('--sx', shadowX);
    card.style.setProperty('--sy', shadowY);
  }

  function onEnter() {
    hovering = true;
    // en el momento que entra el mouse, enciende la luz (fade controlado por CSS existente)
    showLight(card);
    card.classList.add('is-hovering');
    loop();
  }

  function onLeave() {
    hovering = false;
    card.classList.remove('is-hovering');

    // Apaga la iluminación y resetea objetivos
    hideLight(card);
    targetRX = 0; targetRY = 0; targetScale = 1;
    targetTX = 0; targetTY = 0;
  }

  function loop() {
    // easing suave; más rápido cuando está en hover
    const ease = hovering ? 0.12 : 0.10;

    curRX += (targetRX - curRX) * ease;
    curRY += (targetRY - curRY) * ease;
    curScale += (targetScale - curScale) * ease;
    curTX += (targetTX - curTX) * ease;
    curTY += (targetTY - curTY) * ease;

    card.style.transform =
      `translate3d(${curTX.toFixed(2)}px, ${curTY.toFixed(2)}px, 0) ` +
      `rotateX(${curRX.toFixed(3)}deg) rotateY(${curRY.toFixed(3)}deg) ` +
      `scale(${curScale.toFixed(3)})`;

    const moving =
      Math.abs(targetRX - curRX) > 0.01 ||
      Math.abs(targetRY - curRY) > 0.01 ||
      Math.abs(targetTX - curTX) > 0.05 ||
      Math.abs(targetTY - curTY) > 0.05 ||
      Math.abs(targetScale - curScale) > 0.001;

    if (hovering || moving) {
      rafId = requestAnimationFrame(loop);
    } else if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  // Eventos por tarjeta
  card.addEventListener('mousemove', onMove);
  card.addEventListener('touchmove', onMove, { passive: true });
  card.addEventListener('mouseenter', onEnter);
  card.addEventListener('touchstart', onEnter, { passive: true });
  card.addEventListener('mouseleave', onLeave);
  card.addEventListener('touchend', onLeave);
});

// Cambiar temas: violet, blue, green, red, cyan, orange, yellow, pink, lavender...
// document.documentElement.setAttribute('data-theme', 'cyan');
