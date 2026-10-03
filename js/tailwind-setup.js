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
          // Chart marks only (money in / out). Text keeps using green / red.
          'chart-in': color('chart-in'),
          'chart-out': color('chart-out'),
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
  /* Chart bars: a step of our green/red with enough chroma and lightness difference
     to stay distinguishable for colour-blind readers (checked for light and dark). */
  --chart-in: 52 131 91;  --chart-out: 211 59 57;
  --side-width: 260px;
  color-scheme: light;
}
:root[data-theme='dark'] {
  --canvas: 38 38 36;     --sidebar: 31 30 29;    --surface: 48 48 46;   --raised: 58 57 54;
  --line: 64 63 58;       --line-strong: 84 83 76;
  --ink: 250 249 245;     --body: 222 220 209;    --muted: 166 163 154;
  --accent: 201 100 66;   --accent-ink: 232 145 114; --shadow: 0 0 0;
  --green: 108 191 140;   --green-soft: 36 61 47;
  --red: 240 120 110;     --red-soft: 72 38 36;
  --yellow: 226 183 92;   --yellow-soft: 66 54 30;
  --blue: 110 174 220;    --blue-soft: 30 52 68;
  --purple: 180 145 220;  --purple-soft: 54 42 66;
  --chart-in: 71 154 105; --chart-out: 240 87 79;
  color-scheme: dark;
}

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

  /* ---------- Side menu (Notion-like sidebar) ---------- */
  .app-nav {
    @apply fixed inset-y-0 left-0 z-40 flex w-[min(280px,84vw)] -translate-x-full flex-col gap-1 overflow-y-auto border-r border-line bg-sidebar px-2.5 pb-3 pt-3;
    transition: transform 0.28s cubic-bezier(0.2, 0.8, 0.2, 1), width 0.2s ease;
  }
  body.nav-open .app-nav { @apply translate-x-0 shadow-pop; }
  .nav-backdrop { @apply pointer-events-none fixed inset-0 z-[35] bg-black/40 opacity-0 transition-opacity duration-300; }
  body.nav-open .nav-backdrop { @apply pointer-events-auto opacity-100; }
  body.nav-open { @apply overflow-hidden; }
  .side-head { @apply mb-1 flex items-center justify-between gap-2 px-2 pb-2; }
  .side-logo { @apply flex min-w-0 items-center gap-2.5 font-serif text-lg font-semibold text-ink; }
  .side-logo-mark { @apply grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent text-base text-white; }
  .side-close { @apply grid h-9 w-9 cursor-pointer place-items-center rounded-lg border-0 bg-transparent text-lg text-muted hover:bg-ink/5; }
  .side-label { @apply px-3 pb-1 pt-3 text-xs font-semibold text-muted; }
  .side-links { @apply grid gap-0.5; }
  .app-nav a, .side-signout {
    @apply relative flex min-h-[42px] items-center gap-3 rounded-lg px-3 text-[15px] font-medium text-body no-underline transition-colors hover:bg-ink/5 hover:text-ink;
  }
  .app-nav a.is-active { @apply bg-ink/[0.07] font-semibold text-ink; }
  .app-nav a.is-active .nav-icon { transform: scale(1.1); }
  .nav-icon { @apply w-6 shrink-0 text-center text-lg leading-none transition-transform; }
  .nav-label { @apply truncate; }
  .nav-badge { @apply ml-auto grid h-[22px] min-w-[22px] place-items-center rounded-full bg-accent px-1.5 text-xs font-semibold text-white; animation: pop 0.35s ease; }
  .side-foot { @apply mt-auto border-t border-line pt-2; }
  .side-signout { @apply w-full cursor-pointer border-0 bg-transparent font-sans text-red hover:bg-red-soft hover:text-red; }

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
  .quick-actions { @apply grid grid-cols-2 gap-2.5 md:grid-cols-4; }
  .quick-actions .btn { @apply min-h-[76px] flex-col gap-1 rounded-xl px-2 py-2.5 text-sm; }
  .quick-actions .btn span { @apply grid h-9 w-9 place-items-center rounded-lg bg-raised text-lg transition-transform; }
  .quick-actions .btn:hover span { transform: scale(1.12) rotate(-6deg); }
  .ripple { @apply pointer-events-none absolute rounded-full bg-current opacity-20; transform: scale(0); animation: ripple 0.55s ease-out forwards; }

  /* ---------- Open / closed (Notion callout) ---------- */
  .status-card { @apply grid gap-3.5 border-transparent shadow-none transition-colors; }
  .status-card.is-open { @apply bg-green-soft; }
  .status-card.is-closed { @apply bg-red-soft; }
  .status-title { @apply text-lg font-semibold; }
  .status-card.is-open .status-title { @apply text-green; }
  .status-card.is-closed .status-title { @apply text-red; }
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
  body.nav-collapsed .app-nav .nav-label, body.nav-collapsed .side-label { display: none; }
  body.nav-collapsed .app-nav a, body.nav-collapsed .side-signout { justify-content: center; padding: 0; }
  body.nav-collapsed .side-head { justify-content: center; }
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
  .app-nav a, .side-signout { min-height: 38px; font-size: 14.5px; }
  .tabs button { min-height: 40px; font-size: 14.5px; }
  .chip { min-height: 34px; }
  .choice span { min-height: 36px; }
  .segmented .choice span { min-height: 44px; font-size: 15px; }
  .quick-actions .btn { min-height: 68px; }
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

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after, ::backdrop { animation: none !important; transition: none !important; }
}
`;
  document.head.append(style);
})();
