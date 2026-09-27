// First-time setup after sign-up / first login: name → profession → practice.
// Finished accounts go straight to the dashboard.
import { PAGES } from '../config.js';
import { insertRow, updateRow } from '../db.js';
import { PROFESSIONS, professionOf } from '../professions.js';
import { updateProfile } from '../profile.js';
import { appError, isSetUp, loadAccount } from '../shell.js';
import { requireSession } from '../ui.js';

const session = await requireSession();

if (session) {
  const account = await loadAccount(session.user.id).catch(() => ({}));
  if (isSetUp(account)) {
    window.location.replace(PAGES.dashboard);
  } else {
    start(account);
  }
}

function start({ profile, practice }) {
  const form = document.getElementById('onboard-form');
  const steps = [...form.querySelectorAll('[data-step]')];
  const back = document.getElementById('back');
  const next = document.getElementById('next');
  const errorBox = document.getElementById('form-error');
  let step = 1;

  // Profession tiles
  document.getElementById('profession-tiles').innerHTML = Object.entries(PROFESSIONS).map(([key, p]) => `
    <label class="tile">
      <input type="radio" name="profession" value="${key}">
      <span><b aria-hidden="true">${p.icon}</b>${p.label}</span>
    </label>`).join('');

  // Prefill from what we already know (Google name, earlier attempt).
  form.full_name.value = profile?.full_name ?? '';
  if (profile?.profession) form.querySelector(`[value="${profile.profession}"]`).checked = true;
  form.practice_name.value = practice?.name ?? '';
  form.phone.value = practice?.phone ?? '';
  form.address.value = practice?.address ?? '';
  form.specialty.value = practice?.specialty ?? '';

  form.addEventListener('change', (event) => {
    if (event.target.name === 'profession') onProfessionChange();
  });
  onProfessionChange();

  function onProfessionChange() {
    const key = form.profession.value;
    const p = professionOf(key);
    document.documentElement.style.setProperty('--accent', key ? p.color : '');
    const field = document.getElementById('specialty-field');
    field.hidden = !(key && p.specialtyLabel);
    document.getElementById('specialty-label').textContent = p.specialtyLabel ?? '';
    form.specialty.placeholder = p.specialtyHint ?? '';
  }

  function show(n) {
    step = n;
    steps.forEach((s) => (s.hidden = Number(s.dataset.step) !== n));
    document.querySelectorAll('.steps span').forEach((bar, i) => bar.classList.toggle('is-done', i < n));
    back.hidden = n === 1;
    next.textContent = n === 3 ? 'Selesai, mulai pakai NAKESA' : 'Lanjut →';
    errorBox.hidden = true;
    steps[n - 1].querySelector('input:not([type=radio]), textarea')?.focus();
  }

  function fail(message) {
    errorBox.textContent = message;
    errorBox.hidden = false;
  }

  back.addEventListener('click', () => show(step - 1));

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const name = form.full_name.value.trim();

    if (step === 1) {
      if (!name) return fail('Nama lengkap wajib diisi.');
      return show(2);
    }
    if (step === 2) {
      if (!form.profession.value) return fail('Pilih salah satu profesi.');
      if (!form.practice_name.value) {
        form.practice_name.value = `Praktik ${professionOf(form.profession.value).label} ${name}`.slice(0, 120);
      }
      return show(3);
    }

    const practiceName = form.practice_name.value.trim();
    if (!practiceName) return fail('Nama praktik wajib diisi.');

    next.disabled = true;
    next.textContent = 'Menyimpan…';
    try {
      await updateProfile(session.user.id, { full_name: name, profession: form.profession.value });
      const practiceData = {
        name: practiceName,
        phone: form.phone.value.trim() || null,
        address: form.address.value.trim() || null,
        specialty: document.getElementById('specialty-field').hidden ? null : form.specialty.value.trim() || null,
      };
      if (practice) await updateRow('practices', practice.id, practiceData);
      else await insertRow('practices', practiceData);
      window.location.replace(PAGES.dashboard);
    } catch (error) {
      fail(appError(error));
      next.disabled = false;
      next.textContent = 'Selesai, mulai pakai NAKESA';
    }
  });

  document.getElementById('loader').hidden = true;
  document.getElementById('app-main').hidden = false;
  show(1);
}
