// Shared Tailwind CSS setup for every NAKESA page (Notion + Claude inspired theme).
// Load right after the Tailwind CDN script:
//   <script src="https://cdn.tailwindcss.com/3.4.17"></script>
//   <script src="../js/tailwind-setup.js"></script>
//
// 1. tailwind.config: colours (as CSS variables, so light/dark is just a variable swap), fonts, shadows.
// 2. A <style type="text/tailwindcss"> with the theme variables and the component classes that the
//    JavaScript templates reuse on every page (btn, badge, item, card, dialog…), built with @apply.
//    Page layout itself is written with utility classes directly in each HTML file.
(function () {
  var color = function (name) { return 'rgb(var(--' + name + ') / <alpha-value>)'; };
  var pair = function (name) { return { DEFAULT: color(name), soft: color(name + '-soft'), solid: color(name + '-solid') }; };

  tailwind.config = {
    darkMode: ['selector', '[data-theme="dark"]'],
    theme: {
      extend: {
        screens: { nav: '900px' }, // side menu becomes a fixed sidebar from here
        colors: {
          canvas: color('canvas'),
          sidebar: color('sidebar'),
          surface: color('surface'),
          raised: color('raised'),
          line: color('line'),
          'line-strong': color('line-strong'),
          ink: color('ink'),
          body: color('body'),
          muted: color('muted'),
          accent: color('accent'),
          'accent-ink': color('accent-ink'),
          green: pair('green'),
          red: pair('red'),
          yellow: pair('yellow'),
          blue: pair('blue'),
          purple: pair('purple'),
          teal: pair('teal'),
        },
        fontFamily: {
          sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
          serif: ['"Source Serif 4"', 'Georgia', 'ui-serif', 'serif'],
        },
        boxShadow: {
          soft: '0 1px 2px rgb(var(--shadow) / 0.04), 0 2px 10px rgb(var(--shadow) / 0.04)',
          pop: '0 2px 6px rgb(var(--shadow) / 0.06), 0 16px 40px rgb(var(--shadow) / 0.14)',
        },
      },
    },
  };

  var font = document.createElement('link');
  font.rel = 'stylesheet';
  font.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Source+Serif+4:opsz,wght@8..60,500;8..60,600;8..60,700&display=swap';
  document.head.append(font);

  var style = document.createElement('style');
  style.type = 'text/tailwindcss';
  style.textContent = String.raw`
/* ---------- Theme variables (R G B) ---------- */
:root {
  --canvas: 250 249 245;  --sidebar: 244 243 238; --surface: 255 255 255; --raised: 240 238 230;
  --line: 232 230 220;    --line-strong: 216 213 201;
  --ink: 20 20 19;        --body: 61 57 41;       --muted: 115 114 108;
  --accent: 201 100 66;   --accent-ink: 176 82 50; --shadow: 20 20 19;
  --green: 68 131 97;     --green-soft: 237 243 236; --green-solid: 63 125 90;
  --red: 196 69 64;       --red-soft: 253 235 236;   --red-solid: 196 69 64;
  --yellow: 164 112 26;   --yellow-soft: 251 243 219; --yellow-solid: 203 145 47;
  --blue: 51 126 169;     --blue-soft: 231 243 248;  --blue-solid: 51 126 169;
  --purple: 144 101 176;  --purple-soft: 246 243 249; --purple-solid: 144 101 176;
  --teal: 30 128 136;     --teal-soft: 228 244 244;  --teal-solid: 30 128 136;
  --side-width: 260px;
  color-scheme: light;
}
/* Screen only: printed pages always use the light colours (dark text on white paper). */
@media screen { :root[data-theme='dark'] {
  --canvas: 38 38 36;     --sidebar: 31 30 29;    --surface: 48 48 46;   --raised: 58 57 54;
  --line: 64 63 58;       --line-strong: 84 83 76;
  --ink: 250 249 245;     --body: 222 220 209;    --muted: 166 163 154;
  --accent: 201 100 66;   --accent-ink: 232 145 114; --shadow: 0 0 0;
  --green: 108 191 140;   --green-soft: 36 61 47;
  --red: 240 120 110;     --red-soft: 72 38 36;
  --yellow: 226 183 92;   --yellow-soft: 66 54 30;
  --blue: 110 174 220;    --blue-soft: 30 52 68;
  --purple: 180 145 220;  --purple-soft: 54 42 66;
  --teal: 96 196 196;     --teal-soft: 28 58 60;
  color-scheme: dark;
} }

@keyframes rise-in { from { opacity: 0; transform: translateY(10px); } }
@keyframes popup-in { from { opacity: 0; transform: translateY(14px) scale(0.97); } }
@keyframes popup-out { to { opacity: 0; transform: translateY(12px) scale(0.98); } }
@keyframes sheet-in { from { transform: translateY(100%); } }
@keyframes sheet-out { to { transform: translateY(100%); } }
@keyframes fade-in { from { opacity: 0; } }
@keyframes fade-out { to { opacity: 0; } }
@keyframes ripple { to { transform: scale(1); opacity: 0; } }
@keyframes pulse-ring { to { transform: scale(2.8); opacity: 0; } }
@keyframes bump { 50% { transform: scale(1.2); } }
@keyframes pop { from { transform: scale(0.4); opacity: 0; } }
@keyframes shake { 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
@keyframes toast-in { from { opacity: 0; transform: translate(-50%, 16px); } }
@keyframes theme-spin { from { transform: rotate(-180deg) scale(0.4); opacity: 0; } }
@keyframes float { 50% { transform: translateY(-8px) rotate(4deg); } }
@keyframes twinkle { to { opacity: 0.35; } }
@keyframes wave { 15%, 45% { transform: rotate(16deg); } 30%, 60% { transform: rotate(-8deg); } 75% { transform: rotate(0); } }
@keyframes nudge { 0% { box-shadow: 0 0 0 0 rgb(255 255 255 / 0.55); } 70%, 100% { box-shadow: 0 0 0 10px rgb(255 255 255 / 0); } }
@keyframes shimmer { to { background-position: -200% 0; } }

@layer base {
  html { -webkit-text-size-adjust: 100%; }
  body { @apply min-h-screen bg-canvas font-sans text-[16.5px] leading-relaxed text-body antialiased; }
  h1, h2 { @apply font-serif font-semibold tracking-tight text-ink; }
  h3 { @apply font-semibold text-ink; }
  h1 { @apply text-[2rem] leading-tight; }
  h2 { @apply text-[1.35rem] leading-snug; }
  a { @apply text-accent-ink; }
  [hidden] { display: none !important; }
  ::selection { background: rgb(var(--accent) / 0.22); }
  :focus-visible { @apply outline-none ring-2 ring-accent/60 ring-offset-2 ring-offset-canvas; }
  summary { @apply cursor-pointer; }
}

@layer components {
  /* ---------- Loading ---------- */
  .app-loader, .page-loader { @apply grid min-h-screen place-items-center p-4; }
  .spinner { @apply h-9 w-9 animate-spin rounded-full border-[3px] border-line border-t-accent; }

  /* ---------- Header ---------- */
  .app-header { @apply sticky top-0 z-20 border-b border-line bg-canvas/80 backdrop-blur-md; }
  .app-header-inner { @apply mx-auto flex max-w-[1120px] items-center gap-2 px-4 py-2 nav:px-10; }
  .icon-btn, .menu-btn {
    @apply relative grid h-10 w-10 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-lg border-0 bg-transparent text-lg text-muted transition hover:bg-ink/5 hover:text-ink active:scale-90;
  }
  .theme-icon { @apply inline-block transition-transform duration-300; }
  .theme-toggle:hover .theme-icon { transform: rotate(-20deg) scale(1.1); }
  .theme-toggle.is-spinning .theme-icon { animation: theme-spin 0.5s ease; }
  .theme-fab { @apply fixed right-3 top-3 z-30 border border-line bg-surface shadow-soft; }
  .app-brand { @apply flex min-w-0 flex-1 items-center gap-2.5 text-inherit no-underline; }
  .app-brand-icon { @apply grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-raised text-xl; }
  .app-brand-text { @apply grid min-w-0 leading-tight; }
  .app-brand-text strong { @apply truncate text-[15px] font-semibold text-ink; }
  .app-brand-text small { @apply truncate text-[13px] text-muted; }
  .open-pill { @apply inline-flex shrink-0 items-center gap-1.5 rounded-full bg-red-soft px-2.5 py-1 text-xs font-semibold text-red; }
  .open-pill.is-open { @apply bg-green-soft text-green; }
  .live-dot { @apply relative h-2 w-2 shrink-0 rounded-full bg-current; }
  .is-open .live-dot::after { content: ''; @apply absolute inset-0 rounded-full bg-current; animation: pulse-ring 1.8s ease-out infinite; }

  /* ---------- Side menu ---------- */
  /* Every menu item has its own colour (tone-*), shown on its icon tile and when it is the current page. */
  .app-nav {
    @apply fixed inset-y-0 left-0 z-40 flex w-[min(280px,84vw)] -translate-x-full flex-col overflow-y-auto overflow-x-hidden border-r border-line px-3 pb-3 pt-3;
    background: radial-gradient(130% 240px at 0% 0%, rgb(var(--accent) / 0.1), transparent 70%), rgb(var(--sidebar));
    transition: transform 0.28s cubic-bezier(0.2, 0.8, 0.2, 1), width 0.2s ease;
  }
  body.nav-open .app-nav { @apply translate-x-0 shadow-pop; }
  .nav-backdrop { @apply pointer-events-none fixed inset-0 z-[35] bg-black/40 opacity-0 transition-opacity duration-300; }
  body.nav-open .nav-backdrop { @apply pointer-events-auto opacity-100; }
  body.nav-open { @apply overflow-hidden; }
  .side-head { @apply mb-2 flex items-center justify-between gap-2 px-1 pb-2 pt-1; }
  .side-logo { @apply flex min-w-0 items-center gap-3 text-inherit no-underline; }
  .side-logo-mark {
    @apply grid h-10 w-10 shrink-0 place-items-center rounded-xl text-lg font-bold text-white transition-transform duration-300;
    background: linear-gradient(140deg, #e48a5f, rgb(var(--accent)) 55%, #a3442a);
    box-shadow: 0 8px 18px -8px rgb(var(--accent) / 0.9);
  }
  .side-logo:hover .side-logo-mark { transform: rotate(-8deg) scale(1.06); }
  .side-logo-text { @apply grid leading-tight; }
  .side-logo-text strong { @apply font-serif text-lg font-semibold tracking-wide text-ink; }
  .side-logo-text small { @apply text-xs text-muted; }
  .side-close { @apply grid h-9 w-9 cursor-pointer place-items-center rounded-lg border-0 bg-transparent text-lg text-muted hover:bg-ink/5; }
  .side-label { @apply px-3 pb-1.5 pt-4 text-[11px] font-bold uppercase tracking-[0.08em] text-muted; }
  .side-links { @apply grid gap-1; }
  .nav-link {
    @apply relative flex min-h-[46px] items-center gap-3 rounded-xl px-2 text-[15px] font-medium text-body no-underline transition-colors duration-200 hover:bg-ink/5 hover:text-ink;
  }
  .nav-icon { @apply grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[1.05rem] leading-none transition duration-300; background: rgb(var(--tone) / 0.14); }
  .nav-link:hover .nav-icon { transform: scale(1.08) rotate(-6deg); }
  .nav-link.is-active { @apply font-semibold text-ink; background: rgb(var(--tone) / 0.13); }
  .nav-link.is-active::before { content: ''; @apply absolute -left-3 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full; background: rgb(var(--tone)); }
  .nav-link.is-active .nav-icon { background: linear-gradient(140deg, rgb(var(--tone)), rgb(var(--tone) / 0.7)); box-shadow: 0 6px 14px -6px rgb(var(--tone) / 0.9); }
  .nav-label { @apply truncate; }
  .nav-badge { @apply ml-auto grid h-[22px] min-w-[22px] place-items-center rounded-full bg-accent px-1.5 text-xs font-semibold text-white shadow-sm; animation: pop 0.35s ease; }
  .side-foot { @apply mt-auto grid gap-3 pt-5; }
  .side-share {
    @apply relative isolate overflow-hidden rounded-2xl p-4 text-white;
    background: radial-gradient(circle at 100% 0%, rgb(255 255 255 / 0.2), transparent 45%), linear-gradient(140deg, #b8552f, #8a361d);
    box-shadow: 0 14px 26px -16px rgb(138 54 29 / 0.9);
  }
  .side-share::after { content: '🔗'; @apply pointer-events-none absolute -right-1 -top-1 -z-10 rotate-12 text-5xl opacity-25; }
  .side-share-title { @apply font-semibold; }
  .side-share-text { @apply mt-0.5 text-[13px] leading-snug text-white/80; }
  .side-share-actions { @apply mt-3 flex gap-2; }
  .side-share-btn {
    @apply inline-flex min-h-[36px] cursor-pointer items-center justify-center gap-1.5 rounded-lg border-0 bg-white/20 px-3 font-sans text-[13.5px] font-semibold text-white no-underline transition hover:bg-white/30 active:scale-95;
  }
  .side-share-btn.is-main { @apply flex-1 bg-white text-[#8a361d] hover:bg-white/90; }
  .side-profile { @apply flex items-center gap-2.5 rounded-xl border border-line bg-surface p-2 shadow-soft; }
  .side-avatar { @apply grid h-10 w-10 shrink-0 place-items-center rounded-xl text-xl; background: var(--profession-color); }
  .side-profile-text { @apply grid min-w-0 flex-1 leading-tight; }
  .side-profile-text strong { @apply truncate text-sm font-semibold text-ink; }
  .side-profile-text small { @apply truncate text-xs text-muted; }
  .side-signout { @apply grid h-10 w-10 shrink-0 cursor-pointer place-items-center rounded-lg border-0 bg-transparent text-lg transition hover:bg-red-soft active:scale-90; }

  .app-main { @apply mx-auto max-w-[1120px] px-4 pb-16 pt-6 nav:px-10 nav:pt-10; }
  .app-main:not([hidden]) > *, .public:not([hidden]) > *, .onboard:not([hidden]) > * { animation: rise-in 0.45s cubic-bezier(0.2, 0.8, 0.2, 1) both; }
  .app-main > :nth-child(2), .public > :nth-child(2), .onboard > :nth-child(2) { animation-delay: 0.05s; }
  .app-main > :nth-child(3), .public > :nth-child(3), .onboard > :nth-child(3) { animation-delay: 0.1s; }
  .app-main > :nth-child(4), .public > :nth-child(4) { animation-delay: 0.15s; }
  .app-main > :nth-child(n + 5) { animation-delay: 0.2s; }

  /* ---------- Cards, lists (Notion blocks) ---------- */
  .card { @apply rounded-xl border border-line bg-surface p-5 shadow-soft; }
  .stack { @apply grid gap-4; }
  .stack-sm { @apply grid gap-2; }
  .row { @apply flex flex-wrap items-center gap-2.5; }
  .row-between { @apply flex items-center justify-between gap-2.5; }
  .section { @apply mt-10; }
  .section > h2 { @apply mb-3; }
  .list { @apply grid gap-2; }
  .item { @apply relative grid gap-2 rounded-xl border border-line bg-surface px-4 py-3.5 transition; }
  .item:hover { @apply border-line-strong shadow-soft; }
  .item-main { @apply flex items-start justify-between gap-2.5; }
  .item-title { @apply break-words text-[1.02rem] font-semibold text-ink; }
  .item-sub { @apply break-words text-sm text-muted; }
  .item-actions { @apply flex flex-wrap gap-2; }
  .item-button { @apply block min-w-0 flex-1 cursor-pointer border-0 bg-transparent p-0 text-left font-sans text-inherit; }
  .item-clickable { @apply mb-2 w-full cursor-pointer overflow-hidden text-left font-sans text-inherit hover:-translate-y-0.5 active:scale-[0.99]; }
  .list > .item-clickable { @apply mb-0; }
  .group-label { @apply mb-2 mt-6 flex items-center gap-2.5 text-xs font-semibold uppercase tracking-wider text-muted; }
  .group-label::after { content: ''; @apply h-px flex-1 bg-line; }
  .empty-state { @apply grid justify-items-center gap-2.5 px-5 py-9 text-center; }
  .empty-icon { @apply grid h-16 w-16 place-items-center rounded-2xl bg-raised text-3xl; }

  /* ---------- Stats (Notion gallery cards) ---------- */
  .stats { @apply grid grid-cols-2 gap-3 md:grid-cols-4; }
  .stat { @apply relative flex flex-col gap-1 overflow-hidden rounded-xl border border-line bg-surface p-4 text-inherit no-underline shadow-soft; }
  a.stat, button.stat { @apply cursor-pointer text-left font-sans transition hover:-translate-y-0.5 hover:border-line-strong hover:shadow-pop; }
  .stat-icon { @apply mb-2 grid h-10 w-10 place-items-center rounded-lg bg-accent/10 text-xl; }
  .stat:nth-child(4n + 2) .stat-icon { @apply bg-green-soft; }
  .stat:nth-child(4n + 3) .stat-icon { @apply bg-blue-soft; }
  .stat:nth-child(4n + 4) .stat-icon { @apply bg-yellow-soft; }
  .stat-label { @apply text-sm text-muted; }
  .stat-value { @apply break-words font-serif text-[1.65rem] font-semibold leading-tight text-ink; font-variant-numeric: tabular-nums; }

  /* ---------- Tags (Notion select colours) ---------- */
  .badge { @apply inline-flex items-center whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-semibold; }
  .badge-green { @apply bg-green-soft text-green; }
  .badge-red { @apply bg-red-soft text-red; }
  .badge-orange { @apply bg-yellow-soft text-yellow; }
  .badge-blue { @apply bg-blue-soft text-blue; }
  .badge-gray { @apply bg-ink/[0.07] text-muted; }
  .badge-purple { @apply bg-purple-soft text-purple; }

  /* ---------- Buttons ---------- */
  .btn {
    @apply relative inline-flex min-h-[46px] cursor-pointer select-none items-center justify-center gap-2 overflow-hidden rounded-lg border border-transparent px-4 font-sans text-[15px] font-semibold no-underline transition active:scale-[0.98] disabled:cursor-wait disabled:opacity-60;
  }
  .btn-primary { @apply bg-accent text-white shadow-sm hover:brightness-110; }
  .btn-ghost, .btn-secondary, .btn-google { @apply border-line-strong bg-surface text-ink hover:bg-raised; }
  .btn-apple { @apply bg-ink text-canvas hover:opacity-90; }
  .btn-success { @apply bg-green-solid text-white hover:brightness-110; }
  .btn-danger { @apply bg-red-solid text-white hover:brightness-110; }
  .btn-danger-ghost { @apply border-line-strong bg-surface text-red hover:bg-red-soft; }
  .btn-wa { @apply bg-[#1f9d55] text-white hover:brightness-110; }
  .btn-small { @apply min-h-[36px] rounded-md px-3 text-sm; }
  .btn-block { @apply w-full; }
  .btn-big { @apply min-h-[54px] rounded-xl text-base; }
  .btn-icon { @apply inline-flex; }
  .btn-spinner { @apply hidden h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent; }
  .is-loading .btn-spinner { @apply inline-block; }
  .is-loading .btn-icon { @apply hidden; }
  .ripple { @apply pointer-events-none absolute rounded-full bg-current opacity-20; transform: scale(0); animation: ripple 0.55s ease-out forwards; }

  /* ---------- Open / closed switch ---------- */
  .switch { @apply flex cursor-pointer items-center justify-between gap-3.5; }
  .switch input { @apply pointer-events-none absolute opacity-0; }
  .switch-track { @apply relative h-7 w-12 shrink-0 rounded-full bg-line-strong transition-colors; }
  .switch-track::after { content: ''; @apply absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow; transition: transform 0.3s cubic-bezier(0.3, 1.5, 0.5, 1); }
  .switch input:checked + .switch-track { @apply bg-green-solid; }
  .switch input:checked + .switch-track::after { transform: translateX(20px); }
  .switch input:focus-visible + .switch-track { @apply ring-2 ring-accent/60 ring-offset-2 ring-offset-surface; }

  /* ---------- Forms ---------- */
  .field { @apply grid gap-1.5; }
  .field > label, .field-label { @apply text-sm font-semibold text-ink; }
  .field-hint { @apply text-[13px] text-muted; }
  .field-error { @apply text-[13px] font-medium text-red; }
  .field-control { @apply relative; }
  .input {
    @apply min-h-[46px] w-full rounded-lg border border-line-strong bg-surface px-3.5 py-2.5 font-sans text-base text-body transition placeholder:text-muted/70 hover:border-muted/50 focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/15;
  }
  textarea.input { @apply min-h-[88px] resize-y; }
  .input-money { @apply font-serif text-2xl font-semibold; }
  .has-toggle .input { @apply pr-20; }
  .field-toggle { @apply absolute right-1.5 top-1/2 -translate-y-1/2 cursor-pointer rounded-md border-0 bg-transparent px-2.5 py-1.5 font-sans text-sm font-semibold text-accent-ink hover:bg-ink/5; }
  .field-invalid .input { @apply border-red focus:ring-red/15; }
  .search { @apply relative; }
  .search .input { @apply pl-11; }
  .search::before { content: '🔍'; @apply pointer-events-none absolute left-3.5 top-1/2 z-[1] -translate-y-1/2 text-sm opacity-70; }
  .two-cols { @apply grid grid-cols-2 gap-3; }
  .choices { @apply flex flex-wrap gap-2; }
  .choice { @apply relative; }
  .choice input { @apply pointer-events-none absolute opacity-0; }
  .choice span { @apply inline-flex min-h-[40px] cursor-pointer items-center gap-1.5 rounded-full border border-line-strong bg-surface px-3.5 text-sm font-medium transition hover:bg-raised; }
  .choice input:checked + span { @apply border-accent bg-accent/10 text-accent-ink; }
  .choice input:focus-visible + span { @apply ring-2 ring-accent/60; }
  .segmented { @apply grid grid-cols-2 gap-2; }
  .segmented .choice span { @apply min-h-[50px] w-full justify-center rounded-lg text-base; }
  .segmented .choice-in input:checked + span { @apply border-green bg-green-soft text-green; }
  .segmented .choice-out input:checked + span { @apply border-red bg-red-soft text-red; }
  .form-error, .alert { @apply rounded-lg border-l-4 px-4 py-3 text-sm; }
  .form-error, .alert-error { @apply border-red bg-red-soft text-red; animation: shake 0.35s ease; }
  .alert-success { @apply border-green bg-green-soft text-green; }
  .alert-info { @apply border-blue bg-blue-soft text-blue; }
  .divider { @apply flex items-center gap-3 text-xs font-medium uppercase tracking-wider text-muted; }
  .divider::before, .divider::after { content: ''; @apply h-px flex-1 bg-line; }

  /* ---------- Dialogs / pop-ups ---------- */
  dialog { @apply max-h-[92vh] w-[min(560px,100%)] rounded-2xl border border-line bg-surface p-0 text-body shadow-pop; }
  dialog::backdrop { background: rgb(0 0 0 / 0.4); backdrop-filter: blur(2px); }
  dialog[open] { animation: popup-in 0.24s cubic-bezier(0.2, 0.9, 0.3, 1.1); }
  dialog[open]::backdrop { animation: fade-in 0.2s ease-out; }
  dialog.is-closing { animation: popup-out 0.18s ease-in forwards; }
  dialog.is-closing::backdrop { animation: fade-out 0.18s ease-in forwards; }
  dialog.popup-center { @apply w-[min(420px,calc(100%-32px))]; }
  .popup-body, .dialog-form { @apply grid gap-4 px-5 pt-5; padding-bottom: calc(20px + env(safe-area-inset-bottom)); }
  .popup-actions, .dialog-actions { @apply mt-1 grid gap-2.5; }
  .dialog-head { @apply flex items-center justify-between gap-2.5; }
  .dialog-close { @apply grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-lg border-0 bg-transparent text-lg text-muted transition hover:rotate-90 hover:bg-ink/5; }
  .confirm-body { @apply justify-items-center text-center; }
  .confirm-body .two-cols { @apply mt-1 w-full; }
  .confirm-icon { @apply grid h-16 w-16 place-items-center rounded-2xl bg-red-soft text-3xl; animation: pop 0.4s ease; }
  .profile-head { @apply flex items-center gap-3.5; }
  .avatar { @apply grid h-14 w-14 shrink-0 place-items-center rounded-full bg-accent font-serif text-xl font-semibold text-white; }
  .detail-list { @apply m-0 grid; }
  .detail-list div { @apply flex justify-between gap-3.5 border-t border-line py-2.5; }
  .detail-list dt { @apply text-sm text-muted; }
  .detail-list dd { @apply m-0 break-words text-right font-medium text-ink; }
  .detail-heading { @apply mb-2 text-base; }
  .note-box { @apply whitespace-pre-line break-words rounded-lg bg-raised px-3.5 py-3; }
  .mini-row { @apply flex items-center justify-between gap-2.5 border-t border-line py-2.5 first:border-t-0; }
  .preview-line { @apply min-h-[1.5em] font-semibold text-green; }

  /* ---------- Tabs (Notion view tabs) & filter chips ---------- */
  .tabs { @apply mb-4 flex gap-1 overflow-x-auto border-b border-line; }
  .tabs button { @apply -mb-px min-h-[44px] cursor-pointer whitespace-nowrap border-0 border-b-2 border-solid border-transparent bg-transparent px-3 font-sans text-[15px] font-semibold text-muted transition-colors hover:text-ink; }
  .tabs button[aria-selected='true'] { @apply border-ink text-ink; }
  .filter-chips { @apply mb-4 flex gap-2 overflow-x-auto pb-1; }
  .chip { @apply relative inline-flex min-h-[38px] shrink-0 cursor-pointer items-center gap-1.5 overflow-hidden whitespace-nowrap rounded-full border border-line-strong bg-surface px-3.5 font-sans text-sm font-medium text-body transition hover:bg-raised; }
  .chip[aria-pressed='true'] { @apply border-ink bg-ink text-canvas hover:bg-ink; }
  .chip-count { @apply rounded-full px-1.5 text-xs; background: rgb(var(--muted) / 0.18); }

  .bump { animation: bump 0.35s ease; }
  .dirty-note { @apply mt-3 rounded-lg bg-yellow-soft px-3.5 py-2.5 text-sm font-semibold text-yellow; }

  /* ---------- Toast ---------- */
  .toast { @apply fixed bottom-5 left-1/2 z-[100] w-max max-w-[calc(100%-32px)] -translate-x-1/2 rounded-xl px-4 py-3 text-[15px] font-semibold shadow-pop; animation: toast-in 0.3s ease-out; }
  .toast-success { @apply bg-ink text-canvas; }
  .toast-error { @apply bg-red-solid text-white; }

  .link-box { @apply block break-all rounded-lg border border-dashed border-line-strong bg-raised px-3.5 py-3 font-mono text-sm text-ink; }

  /* ---------- Onboarding ---------- */
  .onboard { @apply mx-auto max-w-[620px] px-4 pb-12 pt-16; }
  .steps { @apply mb-5 flex gap-1.5; }
  .steps span { @apply h-1.5 flex-1 rounded-full bg-line transition-colors duration-300; }
  .steps span.is-done { @apply bg-accent; }
  .tiles { @apply grid grid-cols-2 gap-2.5 sm:grid-cols-3; }
  .tile { @apply relative; }
  .tile input { @apply pointer-events-none absolute opacity-0; }
  .tile span { @apply grid min-h-[104px] cursor-pointer justify-items-center gap-1.5 rounded-xl border border-line-strong bg-surface px-2 py-4 text-center font-semibold text-ink transition hover:-translate-y-0.5 hover:shadow-soft; }
  .tile span b { @apply text-3xl font-normal leading-none; }
  .tile input:checked + span { @apply border-accent bg-accent/10 text-accent-ink; }
  .tile input:focus-visible + span { @apply ring-2 ring-accent/60; }

  /* ---------- Schedule editor ---------- */
  .day-row { @apply grid gap-2.5 border-t border-line py-3.5 first:border-t-0 first:pt-0; }
  .session { @apply grid grid-cols-[1fr_auto_1fr_auto] items-center gap-2; animation: rise-in 0.25s ease both; }
  .session .input { @apply min-h-[42px] px-2.5 py-2; }
  .session-remove { @apply grid h-9 w-9 cursor-pointer place-items-center rounded-lg border-0 bg-transparent text-red hover:bg-red-soft; }

  /* ---------- Public booking page ---------- */
  .public { @apply mx-auto grid max-w-[620px] gap-4 px-4 pb-12 pt-16; }
  .hours { @apply w-full border-collapse text-[15px]; }
  .hours td { @apply border-t border-line py-2 align-top; }
  .hours td:last-child { @apply text-right; }
  .hours tr.is-today td { @apply font-semibold text-accent-ink; }
  .success-icon { @apply text-5xl; animation: pop 0.45s ease; }

  /* ---------- Stock stepper ---------- */
  .stepper { @apply inline-flex items-center overflow-hidden rounded-lg border border-line-strong bg-surface; }
  .stepper button { @apply h-10 w-11 cursor-pointer border-0 bg-raised font-sans text-xl font-semibold text-ink transition-colors hover:bg-accent/10 hover:text-accent-ink disabled:cursor-default disabled:opacity-40; }
  .stepper strong { @apply inline-block min-w-[64px] text-center text-base text-ink; font-variant-numeric: tabular-nums; }

  /* ---------- Beranda (dashboard) ---------- */
  /* Hero: the sky follows the time of day (data-time is set by js/pages/dashboard.js).
     Every sky is dark enough for white text. --px / --py move the decoration with the mouse. */
  .dash-hero {
    --sky: 30 37 80; --sky-deep: 17 21 48; --glow: 90 110 224;
    @apply relative isolate overflow-hidden rounded-2xl px-5 pb-5 pt-4 text-white shadow-pop sm:px-8 sm:pb-7 sm:pt-6;
    background:
      radial-gradient(circle at 88% 6%, rgb(var(--glow) / 0.6), transparent 40%),
      radial-gradient(circle at 0% 100%, rgb(var(--glow) / 0.2), transparent 55%),
      linear-gradient(135deg, rgb(var(--sky)), rgb(var(--sky-deep)));
  }
  .dash-hero[data-time='pagi'] { --sky: 180 83 42; --sky-deep: 120 46 26; --glow: 246 178 90; }
  .dash-hero[data-time='siang'] { --sky: 31 99 145; --sky-deep: 18 58 98; --glow: 108 195 240; }
  .dash-hero[data-time='sore'] { --sky: 155 59 78; --sky-deep: 92 34 64; --glow: 243 154 82; }
  .dash-sky-emoji {
    @apply pointer-events-none absolute right-4 top-3 -z-10 select-none text-5xl leading-none sm:right-10 sm:top-6 sm:text-7xl;
    translate: calc(var(--px, 0) * -18px) calc(var(--py, 0) * -14px);
    filter: drop-shadow(0 8px 20px rgb(0 0 0 / 0.3));
    animation: float 6s ease-in-out infinite;
    transition: translate 0.3s ease-out;
  }
  .dash-stars {
    @apply pointer-events-none absolute inset-0 -z-10 hidden;
    background-image:
      radial-gradient(circle at 8% 18%, #fff 0 1px, transparent 1.6px), radial-gradient(circle at 22% 72%, #fff 0 1px, transparent 1.6px),
      radial-gradient(circle at 38% 12%, #fff 0 1.2px, transparent 1.8px), radial-gradient(circle at 55% 40%, #fff 0 0.8px, transparent 1.4px),
      radial-gradient(circle at 68% 82%, #fff 0 1px, transparent 1.6px), radial-gradient(circle at 74% 28%, #fff 0 0.8px, transparent 1.4px),
      radial-gradient(circle at 92% 60%, #fff 0 1.2px, transparent 1.8px), radial-gradient(circle at 46% 90%, #fff 0 0.8px, transparent 1.4px);
    translate: calc(var(--px, 0) * 8px) calc(var(--py, 0) * 6px);
    animation: twinkle 3s ease-in-out infinite alternate;
  }
  .dash-hero[data-time='malam'] .dash-stars { @apply block; }
  .dash-hero-top { @apply flex flex-wrap items-center gap-2 pr-14 sm:pr-28; }
  .dash-pill { @apply inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[13px] font-medium text-white backdrop-blur-sm; font-variant-numeric: tabular-nums; }
  .dash-title { @apply mt-4 font-serif text-[1.8rem] font-semibold leading-tight text-white sm:text-[2.5rem]; }
  .dash-hello { @apply block font-sans text-base font-medium text-white/80 sm:text-lg; }
  .dash-wave { @apply inline-block; transform-origin: 70% 75%; animation: wave 2.2s ease-in-out 0.6s 2; }
  .dash-summary { @apply mt-2 max-w-2xl text-[15px] leading-relaxed text-white/85 sm:text-base; }
  .dash-hero-grid { @apply mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]; }
  .dash-glass { @apply rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm; }
  .dash-switch { @apply min-h-[68px] px-4 py-3 transition-colors duration-300 hover:bg-white/15; }
  .dash-switch.is-open { background: rgb(52 199 120 / 0.24); border-color: rgb(140 240 180 / 0.5); }
  .dash-switch-title { @apply flex items-center gap-2 text-[1.05rem] font-bold text-white; }
  .dash-switch-hint { @apply mt-0.5 block text-[13.5px] leading-snug text-white/75; }
  .dash-switch .live-dot { color: #ffa197; }
  .dash-switch.is-open .live-dot { color: #7af0ae; }
  .dash-switch .switch-track { @apply bg-white/30; }
  .dash-switch input:focus-visible + .switch-track { --tw-ring-offset-color: rgb(var(--sky-deep)); }
  .dash-switch.is-nudge .switch-track { animation: nudge 1.8s ease-out infinite; }
  .dash-switch.bump { animation: bump 0.35s ease; }
  .dash-ring { @apply flex items-center gap-3 px-4 py-3; }
  .dash-ring-chart { @apply relative grid h-14 w-14 shrink-0 place-items-center; }
  .dash-ring-chart svg { @apply absolute inset-0 h-full w-full -rotate-90; }
  .dash-ring-chart circle { fill: none; stroke-width: 5; }
  .dash-ring-track { stroke: rgb(255 255 255 / 0.22); }
  .dash-ring-fill { stroke: #7af0ae; stroke-linecap: round; transition: stroke-dashoffset 1s cubic-bezier(0.2, 0.8, 0.2, 1); }
  .dash-ring-chart strong { @apply text-sm font-bold text-white; font-variant-numeric: tabular-nums; }
  .dash-chips { @apply mt-3 flex flex-wrap gap-2; }
  .dash-chip { @apply inline-flex min-h-[38px] items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3.5 font-sans text-[13.5px] font-semibold text-white no-underline backdrop-blur-sm transition; animation: pop 0.35s ease both; }
  a.dash-chip, button.dash-chip { @apply cursor-pointer hover:-translate-y-0.5 hover:bg-white/20 active:scale-95; }
  .dash-chip.is-alert { @apply border-transparent bg-white shadow-soft hover:bg-white; color: rgb(var(--sky-deep)); }
  .dash-chip-count { @apply grid h-5 min-w-[20px] place-items-center rounded-full bg-accent px-1.5 text-xs text-white; }

  .dash-section-head { @apply mb-3 flex items-end justify-between gap-3; }
  .dash-link { @apply shrink-0 rounded-lg px-2 py-1 text-sm font-semibold no-underline transition hover:bg-accent/10; }

  /* Summary tiles and quick actions: each one has its own colour (--tone). */
  .tone-accent { --tone: var(--accent); }
  .tone-green { --tone: var(--green); }
  .tone-blue { --tone: var(--blue); }
  .tone-yellow { --tone: var(--yellow); }
  .tone-red { --tone: var(--red); }
  .tone-purple { --tone: var(--purple); }
  .tone-teal { --tone: var(--teal); }
  .dash-stats { @apply grid grid-cols-2 gap-3 lg:grid-cols-4; }
  .dash-stat {
    @apply relative isolate flex min-h-[150px] cursor-pointer flex-col overflow-hidden rounded-2xl border border-line p-4 text-left font-sans text-inherit no-underline shadow-soft transition duration-200 hover:-translate-y-1 hover:shadow-pop sm:p-5;
    background: linear-gradient(155deg, rgb(var(--tone) / 0.16), rgb(var(--tone) / 0.03) 60%), rgb(var(--surface));
  }
  .dash-stat:hover { border-color: rgb(var(--tone) / 0.45); }
  .dash-stat-icon { @apply grid h-11 w-11 place-items-center rounded-xl text-[1.35rem] transition-transform duration-300; background: rgb(var(--tone) / 0.18); }
  .dash-stat:hover .dash-stat-icon { transform: scale(1.1) rotate(-8deg); }
  .dash-stat-arrow { @apply absolute right-4 top-4 text-lg font-semibold opacity-0 transition duration-200; color: rgb(var(--tone)); }
  .dash-stat:hover .dash-stat-arrow { @apply translate-x-1 opacity-100; }
  .dash-stat-mark { @apply pointer-events-none absolute -bottom-4 -right-3 -z-10 rotate-[-14deg] select-none text-[5rem] leading-none opacity-[0.08]; }
  .dash-stat-label { @apply mt-auto pt-3 text-sm font-medium text-muted; }
  .dash-stat-value { @apply break-words font-bold leading-tight tracking-tight text-ink; font-size: clamp(1.25rem, 5vw, 1.9rem); }
  .dash-stat-note { @apply mt-1 min-h-[1.2em] text-[12.5px] font-semibold leading-snug text-muted; }
  .dash-stat-note.is-up { @apply text-green; }
  .dash-stat-note.is-down { @apply text-red; }

  .dash-quick-grid { @apply grid grid-cols-2 gap-3 lg:grid-cols-4; }
  .dash-quick {
    @apply relative flex min-h-[88px] flex-col items-start gap-2.5 overflow-hidden rounded-2xl border border-line bg-surface p-3.5 text-inherit no-underline shadow-soft transition duration-200 hover:-translate-y-0.5 hover:shadow-pop active:scale-[0.98] sm:flex-row sm:items-center sm:gap-3.5;
  }
  .dash-quick:hover { border-color: rgb(var(--tone) / 0.5); }
  .dash-quick-icon {
    @apply grid h-12 w-12 shrink-0 place-items-center rounded-xl text-2xl font-bold text-white transition-transform duration-300;
    background: linear-gradient(140deg, rgb(var(--tone)), rgb(var(--tone) / 0.72));
    box-shadow: 0 8px 18px -8px rgb(var(--tone) / 0.9);
  }
  .dash-quick:hover .dash-quick-icon { transform: scale(1.08) rotate(-8deg); }
  .dash-quick strong { @apply block text-[15px] font-semibold leading-snug text-ink; }
  .dash-quick small { @apply block text-[13px] leading-snug text-muted; }

  .dash-panel { @apply rounded-2xl p-5 sm:p-6; }

  /* Today's patients as a timeline, with a "Sekarang" line at the current time. */
  .timeline { @apply relative m-0 grid list-none gap-3 p-0; }
  .timeline::before { content: ''; @apply absolute bottom-4 left-[57px] top-4 w-0.5 rounded-full bg-line; }
  .timeline:not(:has(.tl-item))::before { display: none; }
  .tl-item { --tone: var(--muted); @apply relative grid grid-cols-[44px_minmax(0,1fr)] items-start gap-6; }
  .tl-item[data-status='baru'] { --tone: var(--yellow); }
  .tl-item[data-status='dikonfirmasi'] { --tone: var(--green); }
  .tl-item[data-status='selesai'] { --tone: var(--blue); }
  .tl-enter { animation: rise-in 0.45s cubic-bezier(0.2, 0.8, 0.2, 1) both; animation-delay: calc(var(--i, 0) * 70ms); }
  .tl-flash .tl-card { animation: bump 0.4s ease; }
  .tl-item::before { content: ''; @apply absolute left-[52px] top-[18px] z-[1] h-3 w-3 rounded-full ring-4 ring-surface; background: rgb(var(--tone)); }
  .tl-time { @apply pt-3 text-right text-sm font-bold text-ink; font-variant-numeric: tabular-nums; }
  .tl-card {
    @apply flex flex-wrap items-center justify-between gap-x-3 gap-y-2.5 rounded-xl border border-line px-3.5 py-3 transition duration-200 hover:shadow-soft;
    border-left: 3px solid rgb(var(--tone));
    background: linear-gradient(90deg, rgb(var(--tone) / 0.08), transparent 70%), rgb(var(--surface));
  }
  .tl-item[data-status='selesai'] .tl-card { @apply opacity-70; }
  .tl-open { @apply min-w-[150px] flex-1 cursor-pointer border-0 bg-transparent p-0 text-left font-sans text-inherit; }
  .tl-name { @apply block break-words font-semibold text-ink; }
  .tl-open:hover .tl-name { @apply text-accent-ink; }
  .tl-sub { @apply block break-words text-sm text-muted; }
  .tl-side { @apply flex flex-wrap items-center gap-2; }
  .tl-now { @apply relative grid grid-cols-[44px_minmax(0,1fr)] items-center gap-6 text-xs font-bold uppercase tracking-wider text-accent-ink; }
  .tl-now::before { content: ''; @apply absolute left-[51px] top-1/2 z-[1] h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-accent ring-4 ring-surface; }
  .tl-now::after { content: ''; @apply absolute left-[51px] top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-accent; animation: pulse-ring 1.8s ease-out infinite; }
  .tl-now-line { @apply flex items-center gap-2; }
  .tl-now-line::after { content: ''; @apply h-0.5 flex-1 rounded-full bg-accent/40; }
  .skeleton { @apply rounded-xl; background: linear-gradient(90deg, rgb(var(--raised)) 0%, rgb(var(--line)) 50%, rgb(var(--raised)) 100%) 0 0 / 200% 100%; animation: shimmer 1.4s linear infinite; }

  /* Income of the last 7 days: one column per day, tap a column to read its numbers. */
  .week-readout { @apply min-h-[52px]; }
  .week-readout strong { @apply block text-[1.45rem] font-bold leading-tight text-ink; }
  .week-readout span { @apply text-sm text-muted; }
  .week-chart { @apply relative mt-3 h-48; }
  .week-lines { @apply pointer-events-none absolute inset-x-0 bottom-[1.625rem] top-5 flex flex-col justify-between; }
  .week-lines span { @apply relative block border-t border-line; }
  .week-lines span:last-child { @apply border-line-strong; }
  .week-lines span::before { content: attr(data-label); @apply absolute -top-2 left-0 bg-surface pr-1 text-[11px] leading-none text-muted; font-variant-numeric: tabular-nums; }
  .week-bars { @apply relative ml-10 grid h-full grid-cols-7; }
  .week-col { @apply flex h-full cursor-pointer flex-col rounded-lg border-0 bg-transparent p-0 font-sans transition-colors hover:bg-ink/[0.04]; }
  .week-plot { --h: 0; @apply relative mt-5 flex-1; }
  .week-bar {
    @apply absolute bottom-0 left-1/2 w-[min(24px,62%)] -translate-x-1/2 rounded-t-[4px];
    height: max(3px, calc(100% * var(--h)));
    background: rgb(var(--accent) / 0.3);
    transition: height 0.8s cubic-bezier(0.2, 0.8, 0.2, 1), background-color 0.2s ease;
  }
  .week-col:hover .week-bar { background: rgb(var(--accent) / 0.55); }
  .week-col.is-selected .week-bar { background: rgb(var(--accent)); }
  .week-cap {
    @apply invisible absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] font-bold text-ink opacity-0;
    bottom: calc(max(3px, 100% * var(--h)) + 4px);
    transition: bottom 0.8s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.2s ease;
  }
  .week-col.is-selected .week-cap { @apply visible opacity-100; }
  .week-day { @apply mt-1.5 h-5 text-center text-xs font-medium text-muted; }
  .week-col.is-today .week-day { @apply font-bold text-accent-ink; }
  .week-totals { @apply mt-4 grid gap-2 border-t border-line pt-4 sm:grid-cols-3; }
  .week-totals div { @apply flex items-baseline justify-between gap-3 sm:block; }
  .week-totals dt { @apply text-[13px] font-medium text-muted sm:text-xs; }
  .week-totals dd { @apply m-0 break-words text-[15px] font-bold text-ink; }

  /* Booking link */
  .share-card {
    @apply relative grid gap-5 overflow-hidden rounded-2xl border border-line p-5 shadow-soft sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center sm:gap-7 sm:p-6;
    background:
      radial-gradient(circle at 100% 0%, rgb(var(--green) / 0.16), transparent 42%),
      radial-gradient(circle at 0% 100%, rgb(var(--accent) / 0.1), transparent 45%),
      rgb(var(--surface));
  }
  /* QR code: always dark on white (also in dark mode) so every phone camera can read it. */
  .qr-box {
    @apply mx-auto grid h-44 w-44 cursor-zoom-in place-items-center rounded-2xl border border-line bg-white p-2 shadow-soft transition duration-200 hover:-translate-y-1 hover:shadow-pop sm:h-48 sm:w-48;
  }
  .qr-box svg, .qr-big svg { @apply block h-full w-full; }
  .qr-big { @apply mx-auto w-full max-w-[340px] rounded-2xl bg-white p-2; }
  .link-field { @apply flex items-center gap-2 rounded-xl border border-line-strong bg-raised py-1.5 pl-3.5 pr-1.5; }
  .link-field-text { @apply min-w-0 flex-1 truncate font-mono text-[13px] text-ink sm:text-sm; }
  .btn.is-copied { @apply border-green bg-green-soft text-green; }

  /* ---------- Buku kas (Keuangan): rows and columns like a paper cash book ---------- */
  .ledger { @apply overflow-hidden rounded-2xl border border-line bg-surface shadow-soft; }
  .ledger-head { @apply flex flex-wrap items-center justify-between gap-3 border-b-[3px] border-double border-line-strong px-4 py-4 sm:px-5; }
  .ledger-scroll { @apply overflow-x-auto; }
  .ledger-table { @apply w-full border-collapse text-[13.5px] sm:text-[15px]; font-variant-numeric: tabular-nums; }
  .ledger-table th {
    @apply whitespace-nowrap border-b-2 border-line-strong bg-raised px-2 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-muted sm:px-3 sm:text-xs;
  }
  .ledger-table td { @apply border-b border-line px-2 py-2.5 align-top sm:px-3; }
  .ledger-table th + th, .ledger-table td + td { border-left: 1px solid rgb(var(--line)); }
  .ledger-table .ledger-num { @apply w-[1%] whitespace-nowrap text-right; }
  .ledger-date { @apply w-[1%] whitespace-nowrap text-muted; }
  .ledger-no { @apply w-[1%] text-center text-muted; }
  .ledger-row { @apply cursor-pointer transition-colors hover:bg-accent/[0.06]; }
  .ledger-row.is-even-day { background: rgb(var(--raised) / 0.45); }
  .ledger-row.is-even-day:hover { @apply bg-accent/[0.06]; }
  .ledger-edit { @apply block w-full cursor-pointer border-0 bg-transparent p-0 text-left font-sans text-inherit; }
  .ledger-edit strong { @apply block break-words font-semibold text-ink; }
  .ledger-edit small { @apply block break-words text-[12.5px] text-muted sm:text-[13px]; }
  .ledger-saldo { @apply font-semibold text-ink; }
  .ledger-saldo.is-minus { @apply text-red; }
  .ledger-opening td { @apply bg-yellow-soft/50 text-body; }
  /* Phones: one "Jumlah" column (+ / −) instead of separate Masuk and Keluar, so Saldo still fits. */
  .ledger-wide { @apply hidden sm:table-cell; }
  .ledger-narrow { @apply sm:hidden; }
  .ledger-wide-row { @apply hidden sm:table-row; }
  .ledger-narrow-row { @apply sm:hidden; }
  .ledger-table tfoot { @apply border-t-2 border-line-strong; }
  .ledger-foot td { @apply border-b-0 bg-raised font-bold text-ink; }
  .ledger-final td { @apply text-[1.02rem]; }
  .ledger-final .ledger-num:last-child { border-bottom: 3px double rgb(var(--ink)); }

  /* ---------- Data tables (Database Obat, batches, stock history) ---------- */
  /* Phones: each row becomes a small card and every cell shows its column name (data-label). */
  .table-card { @apply overflow-hidden rounded-2xl border border-line bg-surface shadow-soft; }
  .data-table { @apply w-full border-collapse text-[14.5px]; }
  .data-table th {
    @apply whitespace-nowrap border-b border-line-strong bg-raised px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-muted;
  }
  .data-table td { @apply border-b border-line px-3 py-3 align-top; }
  .data-table tbody tr { @apply transition-colors hover:bg-accent/[0.04]; }
  .data-table tbody tr:last-child td { @apply border-b-0; }
  .data-table .num { @apply whitespace-nowrap text-right max-md:whitespace-normal max-md:text-left; font-variant-numeric: tabular-nums; }
  .data-table .cell-main { @apply md:min-w-[210px]; }
  .data-table tr.is-muted { @apply opacity-60; }
  .data-table thead { @apply max-md:hidden; }
  .data-table tbody tr { @apply max-md:grid max-md:gap-1.5 max-md:border-b max-md:border-line max-md:px-4 max-md:py-3.5; }
  .data-table tbody tr:last-child { @apply max-md:border-b-0; }
  .data-table td { @apply max-md:border-0 max-md:p-0 max-md:text-left; }
  .data-table td[data-label]::before { content: attr(data-label) ': '; @apply hidden text-[12.5px] font-semibold text-muted max-md:inline; }
  .data-table td.cell-actions { @apply max-md:pt-1.5; }
  .cell-title { @apply block break-words font-semibold text-ink no-underline hover:text-accent-ink; }
  .cell-sub { @apply block break-words text-[13px] text-muted; }
  .row-actions { @apply flex flex-wrap gap-1.5 md:justify-end; }

  /* Warning tiles above the medicine list; they double as filters. */
  .alert-tiles { @apply grid gap-3 sm:grid-cols-3; }
  .alert-tile {
    @apply flex cursor-pointer items-center gap-3 rounded-2xl border border-line p-3.5 text-left font-sans text-inherit shadow-soft transition hover:-translate-y-0.5 hover:shadow-pop;
    background: linear-gradient(150deg, rgb(var(--tone) / 0.14), rgb(var(--tone) / 0.03) 65%), rgb(var(--surface));
  }
  .alert-tile[aria-pressed='true'] { box-shadow: 0 0 0 2px rgb(var(--tone)); }
  .alert-tile-icon { @apply grid h-11 w-11 shrink-0 place-items-center rounded-xl text-xl; background: rgb(var(--tone) / 0.16); }
  .alert-tile strong { @apply block text-2xl font-bold leading-none text-ink; }
  .alert-tile small { @apply mt-1 block text-[13px] leading-snug text-muted; }

  .toolbar { @apply grid gap-2.5 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))]; }
  .toolbar .search { @apply sm:col-span-2 lg:col-span-1; }
  select.input { @apply cursor-pointer; }

  /* Wider pop-up for long forms, split into titled sections. */
  dialog.dialog-wide { @apply w-[min(760px,100%)]; }
  .form-section { @apply grid gap-3 border-t border-line pt-4; }
  .form-section-title { @apply text-xs font-bold uppercase tracking-wider text-muted; }
  .check-row { @apply flex cursor-pointer items-start gap-3 rounded-xl border border-line-strong p-3.5; }
  .check-row input { @apply mt-1 h-5 w-5 shrink-0 accent-[rgb(var(--green-solid))]; }

  /* Medicine picker in the prescription form. */
  .picker { @apply grid max-h-72 gap-1 overflow-y-auto rounded-xl border border-line bg-surface p-1.5 shadow-soft; }
  .picker-item {
    @apply flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg border-0 bg-transparent px-3 py-2.5 text-left font-sans text-inherit hover:bg-accent/[0.07] disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:bg-transparent;
  }
  .rx-item { @apply grid gap-3 rounded-xl border border-line bg-raised/40 p-3.5; }
  .rx-item-head { @apply flex items-start justify-between gap-3; }

  /* ---------- Nakesa Patient (the patient app) inside Nakesa Pro ---------- */
  /* Strip that links to the "Tampil di Nakesa Patient" switch. */
  .np-strip {
    @apply flex items-center gap-3.5 rounded-2xl border border-line p-4 text-inherit no-underline shadow-soft transition hover:-translate-y-0.5 hover:shadow-pop;
    background: linear-gradient(120deg, rgb(var(--yellow) / 0.16), rgb(var(--yellow) / 0.02) 60%), rgb(var(--surface));
  }
  .np-strip.is-on { background: linear-gradient(120deg, rgb(var(--teal) / 0.18), rgb(var(--teal) / 0.02) 60%), rgb(var(--surface)); }
  .np-strip-icon { @apply grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-surface text-xl shadow-soft; }
  .np-strip strong { @apply block font-semibold text-ink; }
  .np-strip small { @apply block text-[13px] leading-snug text-muted; }
  .np-strip-go { @apply shrink-0 text-sm font-semibold text-accent-ink; }

  /* Layanan & Harga */
  .svc-index { @apply grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-teal-soft text-sm font-bold text-teal; }
  .svc-item.is-hidden { @apply opacity-70; }
  .svc-item.is-hidden .item-title { @apply line-through decoration-muted/60; }
  .svc-pill { @apply rounded-full border border-line-strong bg-raised px-3 py-1 text-sm font-medium text-ink; }
  .svc-starter { background: radial-gradient(circle at 50% 0%, rgb(var(--teal) / 0.1), transparent 55%), rgb(var(--surface)); }

  /* Praktik page: the Nakesa Patient panel */
  .np-panel {
    @apply relative isolate scroll-mt-24 overflow-hidden rounded-2xl border border-line p-5 shadow-soft sm:p-7;
    background:
      radial-gradient(circle at 100% 0%, rgb(var(--teal) / 0.18), transparent 40%),
      radial-gradient(circle at 0% 100%, rgb(var(--accent) / 0.08), transparent 45%),
      rgb(var(--surface));
  }
  .np-eyebrow { @apply inline-flex items-center gap-1.5 rounded-full bg-teal-soft px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-teal; }
  .np-head { @apply flex flex-wrap items-start justify-between gap-4; }
  .np-listed { @apply min-w-[250px] rounded-2xl border border-line-strong bg-surface px-4 py-3 shadow-soft; }
  .np-grid { @apply mt-6 grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_320px]; }
  .np-ready { @apply grid gap-4 rounded-2xl border border-line bg-surface p-4 shadow-soft sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center sm:p-5; }
  .np-ring { @apply relative mx-auto grid h-[92px] w-[92px] place-items-center; }
  .np-ring svg { @apply absolute inset-0 h-full w-full -rotate-90; }
  .np-ring circle { fill: none; stroke-width: 8; }
  .np-ring .ring-track { stroke: rgb(var(--line)); }
  .np-ring .ring-fill { stroke: rgb(var(--teal)); stroke-linecap: round; transition: stroke-dashoffset 0.8s cubic-bezier(0.2, 0.8, 0.2, 1), stroke 0.3s; }
  .np-ring.is-full .ring-fill { stroke: rgb(var(--green)); }
  .np-ring strong { @apply font-serif text-[1.35rem] font-semibold text-ink; }
  .np-checks { @apply grid gap-1 sm:grid-cols-2; }
  .np-check { @apply flex min-h-[38px] w-full cursor-pointer items-center gap-2 rounded-lg border-0 bg-transparent px-2 text-left font-sans text-sm font-medium text-ink transition hover:bg-ink/5; }
  .np-check-mark { @apply grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 border-line-strong text-[11px] font-bold text-transparent transition; }
  .np-check.is-done { @apply font-normal text-muted; }
  .np-check.is-done .np-check-mark { @apply border-green-solid bg-green-solid text-white; animation: pop 0.3s ease; }
  .np-check-go { @apply ml-auto shrink-0 text-xs font-semibold text-accent-ink; }
  .np-check.is-done .np-check-go { @apply hidden; }
  .np-counter { @apply text-right text-xs text-muted; }
  .np-location { @apply flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-line-strong bg-raised/50 px-3.5 py-3 text-sm; }

  /* Phone mock-up in the patient app's own look (light + teal), also in dark mode. */
  .pp-phone {
    @apply relative mx-auto w-full max-w-[320px] rounded-[42px] p-3;
    background: linear-gradient(160deg, #2e2e2c, #111110);
    box-shadow: 0 30px 60px -28px rgb(0 0 0 / 0.6), inset 0 0 0 2px #3c3c3a;
  }
  .pp-notch { @apply absolute left-1/2 top-3 z-[2] h-6 w-28 -translate-x-1/2 rounded-b-2xl bg-[#111110]; }
  .pp-screen { @apply grid min-h-[540px] content-start gap-2.5 overflow-hidden rounded-[32px] bg-[#F4F7F6] px-3.5 pb-4 pt-10 font-sans text-[#10201D]; }
  .pp-status { @apply absolute left-9 right-9 top-[19px] z-[3] flex justify-between text-[11px] font-semibold text-[#10201D]; }
  .pp-search { @apply flex items-center gap-2 rounded-2xl border border-[#E0E8E6] bg-white px-3 py-2.5 text-[12.5px] text-[#8C9B98]; }
  .pp-card { @apply flex gap-2.5 rounded-2xl border border-[#E0E8E6] bg-white p-3; box-shadow: 0 4px 12px rgb(11 43 39 / 0.06); }
  .pp-avatar { @apply grid h-11 w-11 shrink-0 place-items-center rounded-full text-xl; background: color-mix(in srgb, var(--pc) 14%, white); }
  .pp-card-body { @apply grid min-w-0 gap-0.5; }
  .pp-card-body strong { @apply break-words text-[14.5px] font-bold leading-snug; }
  .pp-card-body em { @apply text-[12px] font-semibold not-italic; }
  .pp-card-body small { @apply break-words text-[11.5px] leading-snug text-[#5B6C69]; }
  .pp-card-body small.pp-missing { @apply text-[#B45309]; }
  .pp-badge { @apply mt-1 justify-self-start rounded-full bg-[#EEF2F1] px-2 py-0.5 text-[10.5px] font-semibold text-[#5B6C69]; }
  .pp-badge.is-open { @apply bg-[#E8F6EC] text-[#15803D]; }
  .pp-section { @apply mt-1 text-[13px] font-bold; }
  .pp-service { @apply flex items-center gap-2 rounded-xl border border-[#E0E8E6] bg-white px-3 py-2.5 font-sans text-[#10201D]; }
  .pp-service strong { @apply block break-words text-[12.5px] font-semibold; }
  .pp-service small { @apply block break-words text-[11px] leading-snug text-[#5B6C69]; }
  .pp-meta { @apply mt-0.5 flex flex-wrap gap-1 text-[11px] text-[#5B6C69]; }
  .pp-price { @apply font-semibold text-[#0F766E]; }
  .pp-price.is-ask { @apply font-medium text-[#5B6C69]; }
  .pp-radio { @apply ml-auto h-4 w-4 shrink-0 rounded-full border-2 border-[#C5D0CE]; }
  .pp-more, .pp-empty { @apply text-center text-[11.5px] text-[#5B6C69]; }
  .pp-cta { @apply mt-1 rounded-xl bg-[#0F766E] py-3 text-center text-[13px] font-bold text-white; }
  .pp-off {
    @apply absolute inset-3 grid content-center justify-items-center gap-1 rounded-[32px] px-6 text-center text-white;
    background: rgb(16 32 29 / 0.62);
    backdrop-filter: blur(3px) grayscale(0.6);
  }
  .pp-off span { @apply text-3xl; animation: pop 0.35s ease; }
  .pp-off small { @apply text-[12.5px] text-white/80; }
  .pp-mini { @apply grid gap-2 rounded-2xl bg-[#F4F7F6] p-3; }
  .pp-hidden-note { @apply text-center text-xs font-semibold text-[#B45309]; }

  /* ---------- Small text helpers still used by JS templates ---------- */
  .muted { @apply text-muted; }
  .small { @apply text-sm; }
}

/* Wide screens: fixed sidebar, can collapse to icons. */
@media (min-width: 900px) {
  body.app.has-nav { padding-left: var(--side-width); }
  body.nav-ready { transition: padding-left 0.2s ease; }
  body.app.has-nav .app-nav { transform: none; width: var(--side-width); box-shadow: none; }
  .nav-backdrop, .side-close { display: none; }
  body.nav-open { overflow: auto; }
  body.nav-collapsed { --side-width: 72px; }
  body.nav-collapsed .app-nav .nav-label, body.nav-collapsed .side-share { display: none; }
  body.nav-collapsed .side-label { height: 1px; margin: 10px 8px; padding: 0; font-size: 0; background: rgb(var(--line)); }
  body.nav-collapsed .nav-link { justify-content: center; padding: 0; }
  body.nav-collapsed .side-head { justify-content: center; }
  body.nav-collapsed .side-profile { flex-direction: column; padding: 6px 0; }
  body.nav-collapsed .nav-badge { position: absolute; top: 2px; right: 4px; height: 18px; min-width: 18px; font-size: 0.68rem; }
  .toast { bottom: 24px; }
  body.has-nav .toast { left: calc(50% + var(--side-width) / 2); }
}

/* Computers / laptops: denser sizes like Notion (phones keep the big, easy-to-tap sizes).
   Tailwind spacing is in rem, so the smaller root font also tightens paddings and gaps. */
@media (min-width: 900px) {
  html { font-size: 15px; }
  body { font-size: 15.5px; }
  .btn { min-height: 40px; font-size: 14.5px; }
  .btn-small { min-height: 34px; font-size: 13.5px; }
  .btn-big { min-height: 46px; font-size: 15px; }
  .input { min-height: 40px; padding-top: 8px; padding-bottom: 8px; font-size: 15px; }
  .nav-link { min-height: 42px; font-size: 14.5px; }
  .tabs button { min-height: 40px; font-size: 14.5px; }
  .chip { min-height: 34px; }
  .choice span { min-height: 36px; }
  .segmented .choice span { min-height: 44px; font-size: 15px; }
  .stepper button { height: 36px; width: 40px; }
  .item-title { font-size: 1rem; }
}

/* Wide laptop screens: a list row puts its buttons on the right instead of below. */
@media (min-width: 1024px) {
  .item:has(> .item-actions), .item:has(> .row-between) { grid-template-columns: minmax(0, 1fr) auto; align-items: center; column-gap: 24px; }
  .item > .item-actions { justify-content: flex-end; }
  .item > .row-between { justify-content: flex-end; gap: 12px; }
}

/* Phones: pop-ups become bottom sheets with a grab handle. */
@media (max-width: 600px) {
  dialog { margin: auto 0 0; max-width: 100%; border-radius: 20px 20px 0 0; border-bottom: 0; }
  dialog:not(.popup-center)::before { content: ''; display: block; width: 40px; height: 5px; margin: 10px auto -8px; border-radius: 99px; background: rgb(var(--line-strong)); }
  dialog.popup-center { margin: auto; border-radius: 20px; border-bottom: 1px solid rgb(var(--line)); }
  dialog[open]:not(.popup-center) { animation: sheet-in 0.3s cubic-bezier(0.2, 0.8, 0.2, 1); }
  dialog.is-closing:not(.popup-center) { animation: sheet-out 0.2s ease-in forwards; }
}

/* Smooth colour change while switching theme (class set briefly by theme.js). */
.theme-switching, .theme-switching *, .theme-switching *::before, .theme-switching *::after {
  transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease !important;
}

/* Printing (e.g. the cash book): only the page content, no menu, header or buttons. */
@media print {
  body.app.has-nav { padding-left: 0 !important; }
  .app-header, .app-nav, .nav-backdrop, .toast, dialog { display: none !important; }
  .app-main { max-width: none; padding: 0; }
  .app-main > * { animation: none !important; }
  .card, .stat, .ledger { box-shadow: none !important; }
  .ledger-scroll { overflow: visible; }
  .ledger-table tr { break-inside: avoid; }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after, ::backdrop { animation: none !important; transition: none !important; }
}
`;
  document.head.append(style);
})();
