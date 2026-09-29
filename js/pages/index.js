// Beranda (landing page): small interactions, no login needed.

/* ---------- Select & Change ---------- */
// Selector ID: ambil <span id="tahun"> di footer, lalu isi dengan tahun sekarang.
const year = document.querySelector('#tahun');
year.textContent = new Date().getFullYear();

/* ---------- Handle User Event ---------- */
const mobileMenu = document.querySelector('#mobile-menu');
const menuButton = mobileMenu.querySelector('summary');

// Event "toggle": menu HP dibuka/ditutup → ganti ikon ☰ / ✕.
mobileMenu.addEventListener('toggle', () => {
  menuButton.textContent = mobileMenu.open ? '✕' : '☰';
  menuButton.setAttribute('aria-label', mobileMenu.open ? 'Tutup menu navigasi' : 'Buka menu navigasi');
});

// Event "click": setelah link di menu HP diklik, atau klik di luar menu, tutup menunya.
document.addEventListener('click', (event) => {
  if (!mobileMenu.open) return;
  if (event.target.closest('#mobile-menu a') || !mobileMenu.contains(event.target)) mobileMenu.open = false;
});

// Event "scroll": tandai link menu atas sesuai bagian yang sedang dilihat.
const sections = document.querySelectorAll('main section[id]');
const navLinks = document.querySelectorAll('#desktop-nav a[href^="#"]');

function markActiveLink() {
  let current = sections[0].id;
  for (const section of sections) {
    if (section.getBoundingClientRect().top <= 120) current = section.id;
  }
  navLinks.forEach((link) => {
    const active = link.getAttribute('href') === `#${current}`;
    link.classList.toggle('text-primary', active);
    link.classList.toggle('text-[#688099]', !active);
    if (active) link.setAttribute('aria-current', 'true');
    else link.removeAttribute('aria-current');
  });
}

window.addEventListener('scroll', markActiveLink, { passive: true });
markActiveLink();
