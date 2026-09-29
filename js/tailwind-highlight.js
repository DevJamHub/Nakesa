// Demo helper for class: open a page with ?tailwind (e.g. index.html?tailwind) to outline
// every element that is styled by Tailwind classes. Hover an element to see its Tailwind classes.
// Without ?tailwind this file does nothing.

if (new URLSearchParams(location.search).has('tailwind')) start();

function start() {
  const style = document.createElement('style');
  style.textContent = `
    [data-tw] { outline: 2px dashed #06b6d4 !important; outline-offset: -1px; }
    [data-tw]:hover:not(:has([data-tw]:hover)) { outline: 3px solid #0891b2 !important; background-color: rgba(6, 182, 212, 0.1) !important; }
    #tw-legend {
      position: fixed; left: 12px; bottom: 12px; z-index: 9999; max-width: calc(100% - 24px);
      display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-radius: 12px;
      font: 700 14px/1.3 system-ui, sans-serif; color: #fff; background: #0e7490; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
    }
    #tw-legend a { color: #fff; }
  `;
  document.head.append(style);

  const legend = document.createElement('div');
  legend.id = 'tw-legend';
  legend.setAttribute('role', 'status');
  document.body.append(legend);

  let timer;
  const refresh = () => {
    clearTimeout(timer);
    timer = setTimeout(mark, 150);
  };
  // Pages build parts of their HTML with JavaScript, so mark again whenever the page changes.
  new MutationObserver((changes) => {
    if (changes.some((c) => !legend.contains(c.target) && c.attributeName !== 'data-tw' && c.attributeName !== 'title')) refresh();
  }).observe(document.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] });
  refresh();

  function mark() {
    const classes = tailwindClasses();
    let count = 0;
    for (const element of document.body.querySelectorAll('[class]')) {
      if (legend.contains(element)) continue;
      const own = [...element.classList].filter((c) => classes.has(c));
      if (own.length) {
        count++;
        element.dataset.tw = '';
        element.title = `Tailwind: ${own.join(' ')}`;
      } else if ('tw' in element.dataset) {
        delete element.dataset.tw;
        element.removeAttribute('title');
      }
    }
    const off = new URL(location.href);
    off.searchParams.delete('tailwind');
    legend.innerHTML = `🎨 ${count} elemen memakai Tailwind · arahkan kursor untuk melihat class-nya · <a href="${off}">Matikan</a>`;
  }
}

/** Every class name that the Tailwind CDN generated CSS for on this page. */
function tailwindClasses() {
  const classes = new Set();
  const sheet = [...document.querySelectorAll('style')].find((s) => s.textContent.includes('--tw-'))?.sheet;
  const collect = (rules) => {
    for (const rule of rules) {
      for (const [, name] of (rule.selectorText ?? '').matchAll(/\.((?:\\.|[\w-])+)/g)) {
        classes.add(name.replace(/\\(.)/g, '$1')); // "md\:flex" → "md:flex"
      }
      if (rule.cssRules) collect(rule.cssRules); // rules inside @media
    }
  };
  if (sheet) collect(sheet.cssRules);
  return classes;
}
