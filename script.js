'use strict';

// YOUR EMAIL: insert it here, for example "name@example.com".
const contactEmail = 'angelomicheleamoroso@gmail.com';
const emailLink = document.querySelector('#email-link');
if (emailLink && contactEmail.trim()) {
  emailLink.href = 'mailto:' + contactEmail.trim();
  emailLink.hidden = false;
}
const year = document.querySelector('#year');
if (year) year.textContent = new Date().getFullYear();

// Add a cover only if the corresponding image exists.
// This also works by opening index.html directly, without a server.
function loadImage(path, container, alt) {
  if (!path || !container) return;

  const image = new Image();
  image.decoding = 'async';

  const isHomepageCover =
    container.matches('#projects .project-cover');

  // In homepage il titolo è già presente nella scheda.
  image.alt = isHomepageCover ? '' : alt;

  image.onload = () => {
    if (isHomepageCover) {
      // Sostituisce solo l'immagine, conservando il testo.
      container.querySelectorAll(':scope > img').forEach(img => {
        img.remove();
      });

      container.prepend(image);
      container.classList.add('has-background');
    } else {
      // Mantiene il comportamento delle altre pagine.
      container.replaceChildren(image);
    }

    window.portfolioI18n?.refresh();
  };

  image.onerror = () => {
    // Se il file manca, rimane la copertina con il testo.
  };

  image.src = path;
}
document.querySelectorAll('.project').forEach((card) => {
  loadImage(card.dataset.cover, card.querySelector('.project-cover'), card.querySelector('h2').textContent + ' — project cover');
});
const portrait = document.querySelector('[data-portrait]');
if (portrait) loadImage(portrait.dataset.portrait, portrait, 'Angelo Michele Amoroso');

// Covers on category and project detail pages.
document.querySelectorAll('[data-image]').forEach((container) => {
  loadImage(container.dataset.image, container, container.dataset.alt || 'Project cover');
});

// Cursor: precise tracking, transparent eyes, inverted background.
const cursor = document.querySelector('.custom-cursor');
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
const hideCursor = () => document.documentElement.classList.remove('cursor-active');
document.addEventListener('pointermove', (event) => {
  if (!finePointer.matches || event.pointerType === 'touch') return hideCursor();
  cursor.style.transform = `translate3d(${event.clientX - 19}px, ${event.clientY - 19}px, 0)`;
  document.documentElement.classList.add('cursor-active');
}, { passive: true });
document.documentElement.addEventListener('pointerleave', hideCursor);
window.addEventListener('blur', hideCursor);
document.addEventListener('keydown', (event) => { if (event.key === 'Tab') hideCursor(); });
finePointer.addEventListener('change', hideCursor);


// Rotazione delle frasi nella homepage
(() => {
  const word = document.querySelector('#rotating-word');
  if (!word) return;

  const phraseSources = ['Ux & product design', 'visual storytelling', 'service thinking'];
  let phrases = phraseSources.map(text => window.portfolioI18n.translate(text));

  const readingTime = 2000; // Pausa di lettura mantenuta dal tuo file: 2 secondi
  const animationTime = 320;
  const reducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  );

  let index = 0;
  let timer;
  word.textContent = phrases[index];

  function rotate() {
    word.classList.add('is-changing');

    timer = window.setTimeout(() => {
      index = (index + 1) % phrases.length;
      word.textContent = phrases[index];
      word.classList.remove('is-changing');

      // Attende la comparsa e poi lascia due secondi per leggere.
      timer = window.setTimeout(
        rotate,
        animationTime + readingTime
      );
    }, animationTime);
  }

  function restart() {
    window.clearTimeout(timer);
    word.classList.remove('is-changing');

    // Rispetta chi ha disattivato le animazioni sul dispositivo.
    if (!reducedMotion.matches && !document.hidden) {
      timer = window.setTimeout(rotate, readingTime);
    }
  }

  document.addEventListener('portfolio:languagechange', () => {
    phrases = phraseSources.map(text => window.portfolioI18n.translate(text));
    word.textContent = phrases[index];
    restart();
  });
  reducedMotion.addEventListener('change', restart);
  document.addEventListener('visibilitychange', restart);
  restart();
})();

// Anteprime dei progetti: slide da destra verso sinistra.
(() => {
  const pointer = window.matchMedia(
    '(hover: hover) and (pointer: fine)'
  );
  const reducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  );

  document.querySelectorAll('.project-list .project-row')
    .forEach(row => {
      const cover = row.querySelector('.list-cover');
      if (!cover) return;

      let timer;
      let slider;
      let version = 0;

      function stop() {
        version++;
        window.clearTimeout(timer);
        slider?.remove();
        slider = null;
      }

      function loadPhoto(src) {
        return new Promise(resolve => {
          const img = new Image();
          img.alt = '';
          img.draggable = false;
          img.onload = () => resolve(img);
          img.onerror = () => resolve(null);
          img.src = src;
        });
      }

      async function start() {
        stop();

        if (!pointer.matches || reducedMotion.matches) return;

        const original = cover.querySelector(':scope > img');
        const extra = (cover.dataset.previewImages || '')
          .split(',')
          .map(path => path.trim())
          .filter(Boolean);

        if (!original || !original.complete || !extra.length) return;

        const currentVersion = version;

        // Normalizza i percorsi ed elimina eventuali duplicati.
        const sources = [...new Set(
          [original.currentSrc || original.src, ...extra]
            .map(path => new URL(path, document.baseURI).href)
        )];

        const loaded = await Promise.all(sources.map(loadPhoto));

        // Nel frattempo il mouse potrebbe essere uscito.
        if (currentVersion !== version) return;

        const photos = loaded.filter(Boolean);
        if (photos.length < 2) return;

        slider = document.createElement('div');
        slider.className = 'preview-slider';
        slider.setAttribute('aria-hidden', 'true');

        photos[0].style.transform = 'translateX(0)';
        slider.append(photos[0]);
        cover.append(slider);

        let index = 0;

        function advance() {
          if (currentVersion !== version || !slider) return;

          const outgoing = photos[index];
          index = (index + 1) % photos.length;
          const incoming = photos[index];

          // Posiziona la nuova foto a destra, senza animazione.
          incoming.style.transition = 'none';
          incoming.style.transform = 'translateX(100%)';
          slider.append(incoming);

          // Registra la posizione iniziale prima del movimento.
          void incoming.offsetWidth;

          incoming.style.transition = '';
          outgoing.style.transform = 'translateX(-100%)';
          incoming.style.transform = 'translateX(0)';

          timer = window.setTimeout(() => {
            if (currentVersion !== version) return;
            outgoing.remove();

            // Pausa prima della foto successiva.
            timer = window.setTimeout(advance, 1600);
          }, 550);
        }

        timer = window.setTimeout(advance, 500);
      }

      row.addEventListener('pointerenter', start);
      row.addEventListener('pointerleave', stop);
      pointer.addEventListener('change', stop);
      reducedMotion.addEventListener('change', stop);
      window.addEventListener('blur', stop);

      document.addEventListener('visibilitychange', () => {
        if (document.hidden) stop();
      });
    });
})();