// Light / dark theme. Loaded as a normal <script> in <head> (not a module) so the
// theme is set before the page is drawn — no white flash when dark mode is on.
// Choice is remembered on this device; without a choice it follows the phone/laptop setting.
// Any button with [data-theme-toggle] switches the theme.
(function () {
  var KEY = 'nakesa-theme';
  var root = document.documentElement;
  var systemDark = window.matchMedia('(prefers-color-scheme: dark)');

  function saved() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }

  function apply(theme) {
    root.dataset.theme = theme;
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = theme === 'dark' ? '#262624' : '#faf9f5';
    var buttons = document.querySelectorAll('[data-theme-toggle]');
    for (var i = 0; i < buttons.length; i++) {
      var dark = theme === 'dark';
      buttons[i].setAttribute('aria-pressed', String(dark));
      buttons[i].setAttribute('aria-label', dark ? 'Ganti ke mode terang' : 'Ganti ke mode gelap');
      buttons[i].title = dark ? 'Mode terang' : 'Mode gelap';
      buttons[i].innerHTML = '<span class="theme-icon" aria-hidden="true">' + (dark ? '☀️' : '🌙') + '</span>';
    }
  }

  apply(saved() || (systemDark.matches ? 'dark' : 'light'));

  systemDark.addEventListener('change', function (event) {
    if (!saved()) apply(event.matches ? 'dark' : 'light');
  });

  document.addEventListener('click', function (event) {
    var button = event.target.closest('[data-theme-toggle]');
    if (!button) return;
    var next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem(KEY, next); } catch (e) { /* private mode: still switch for this page */ }
    root.classList.add('theme-switching'); // smooth colour change (see tailwind-setup.js / index.css)
    apply(next);
    button.classList.remove('is-spinning');
    void button.offsetWidth;
    button.classList.add('is-spinning');
    setTimeout(function () { root.classList.remove('theme-switching'); }, 400);
  });

  // Buttons added later (e.g. the header built by shell.js) get their icon from here.
  window.nakesaTheme = { refresh: function () { apply(root.dataset.theme); } };
  document.addEventListener('DOMContentLoaded', window.nakesaTheme.refresh);
})();
