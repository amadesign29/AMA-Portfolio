/* Language management. Works with local files and static hosting, without fetch. */
(() => {
  'use strict';
  const dictionary = window.PORTFOLIO_TRANSLATIONS;
  const storageKey = 'amoroso-portfolio-language';
  const valid = value => value === 'it' || value === 'en';
  let saved;
  try { saved = localStorage.getItem(storageKey); } catch (_) {}
  const queryLanguage = new URLSearchParams(location.search).get('lang');
  let language = valid(queryLanguage) ? queryLanguage : valid(saved) ? saved : 'en';
  const textSources = new WeakMap();
  const attributeSources = new WeakMap();
  const originalTitle = document.title;
  const aliases = new Map();
  Object.entries(dictionary).forEach(([source, values]) => {
    aliases.set(source, values);
    Object.values(values).forEach(value => { if (!aliases.has(value)) aliases.set(value, values); });
  });
  function translate(text) {
    return aliases.get(text)?.[language] ?? text;
  }
  function refresh() {
    document.documentElement.lang = language;
    document.title = translate(originalTitle);
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (node.parentElement.closest('script, style, svg, #rotating-word, .language-switch')) continue;
      if (!textSources.has(node)) textSources.set(node, node.nodeValue);
      const source = textSources.get(node);
      const trimmed = source.trim();
      if (trimmed) node.nodeValue = source.replace(trimmed, () => translate(trimmed));
    }
    document.querySelectorAll('[aria-label], [alt], [data-alt], meta[name="description"]').forEach(element => {
      if (!attributeSources.has(element)) {
        const sources = {};
        ['aria-label', 'alt', 'data-alt', 'content'].forEach(name => {
          if (element.hasAttribute(name)) sources[name] = element.getAttribute(name);
        });
        attributeSources.set(element, sources);
      }
      Object.entries(attributeSources.get(element)).forEach(([name, source]) => {
        element.setAttribute(name, translate(source));
      });
    });
    document.querySelectorAll('[data-language]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.language === language));
    });
    // The URL also carries the language, including when file:// storage is unavailable.
    document.querySelectorAll('a[href]').forEach(link => {
      const href = link.getAttribute('href');
      if (!href || href.startsWith('#')) return;
      const url = new URL(href, location.href);
      if (!['file:', 'http:', 'https:'].includes(url.protocol)) return;
      if (url.origin !== location.origin || !url.pathname.endsWith('.html')) return;
      url.searchParams.set('lang', language);
      link.setAttribute('href', url.href);
    });
  }
  function setLanguage(next) {
    if (!valid(next)) return;
    language = next;
    try { localStorage.setItem(storageKey, language); } catch (_) {}
    try {
      const url = new URL(location.href);
      url.searchParams.set('lang', language);
      history.replaceState(null, '', url.href);
    } catch (_) { /* Some browsers disallow updating a local file URL. */ }
    refresh();
    document.dispatchEvent(new CustomEvent('portfolio:languagechange', { detail: { language } }));
  }
  window.portfolioI18n = { translate, refresh, setLanguage, get language() { return language; } };
  document.querySelectorAll('[data-language]').forEach(button => {
    button.addEventListener('click', () => setLanguage(button.dataset.language));
  });
  setLanguage(language);
})();
