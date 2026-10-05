// Database Obat: every medicine with its stock, batches and nearest expiry, warning tiles,
// search and filters. One medicine in detail (batches, history, use) is medicine.html?id=….
import { PAGES } from '../config.js';
import { run, supabase, updateRow } from '../db.js';
import { escapeHtml, formatDate } from '../format.js';
import { loadCategories, loadSuppliers, openMedicineForm } from '../medicine-forms.js';
import { DRUG_CLASS, STOCK_STATUS, medicineDetail, medicineExpiry, needsAttention } from '../practice-utils.js';
import { canManage, isAdmin, practiceRole } from '../roles.js';
import { appError, closeDialog, confirmDialog, openPopup, refreshNavBadges, startPage, toast } from '../shell.js';

const { user, practice } = await startPage('medicines');
const role = await practiceRole(practice, user);
const $ = (id) => document.getElementById(id);
const list = $('list');
let medicines = []; // rows of the medicine_inventory view
let categories = [];
// A warning tile that is switched on: 'kedaluwarsa', 'akan_kedaluwarsa', 'stok', or 'check'
// (everything that needs a look — used by the link from Beranda).
let alertFilter = new URLSearchParams(location.search).get('filter') === 'check' ? 'check' : null;

$('add').hidden = !canManage(role);
$('settings').hidden = !isAdmin(role);
if (!canManage(role)) $('summary').textContent = 'Anda masuk sebagai staf: bisa melihat obat dan stok, tetapi tidak bisa mengubahnya.';

async function load() {
  try {
    [medicines, categories] = await Promise.all([
      run(supabase.from('medicine_inventory').select('*').order('generic_name')),
      categories.length ? categories : loadCategories(),
    ]);
  } catch (error) {
    toast(appError(error), 'error');
  }
  fillCategoryFilter();
  render();
}

function fillCategoryFilter() {
  const select = $('filter-category');
  if (select.options.length > 1) return;
  select.insertAdjacentHTML('beforeend',
    categories.map((c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join(''));
}

/* ---------- Filters ---------- */
['search', 'filter-category', 'filter-stock', 'filter-expiry', 'show-inactive'].forEach((id) => {
  $(id).addEventListener(id === 'search' ? 'input' : 'change', render);
});

$('alerts').addEventListener('click', (event) => {
  const tile = event.target.closest('[data-alert]');
  if (!tile) return;
  alertFilter = alertFilter === tile.dataset.alert ? null : tile.dataset.alert;
  render();
});

function matchesAlert(m) {
  if (alertFilter === 'kedaluwarsa') return m.expiry_status === 'kedaluwarsa';
  if (alertFilter === 'akan_kedaluwarsa') return m.expiry_status === 'akan_kedaluwarsa';
  if (alertFilter === 'stok') return m.stock_status !== 'aman';
  if (alertFilter === 'check') return needsAttention(m);
  return true;
}

function filtered() {
  const q = $('search').value.trim().toLowerCase();
  const category = $('filter-category').value;
  const stock = $('filter-stock').value;
  const expiry = $('filter-expiry').value;
  const showInactive = $('show-inactive').checked;
  return medicines.filter((m) => (showInactive || m.is_active)
    && (!q || m.generic_name.toLowerCase().includes(q) || (m.brand_name ?? '').toLowerCase().includes(q))
    && (!category || m.category_id === category)
    && (!stock || m.stock_status === stock)
    && (!expiry || m.expiry_status === expiry)
    && (!alertFilter || (m.is_active && matchesAlert(m))));
}

/* ---------- Render ---------- */
function render() {
  const active = medicines.filter((m) => m.is_active);
  $('count-expired').textContent = active.filter((m) => m.expiry_status === 'kedaluwarsa').length;
  $('count-soon').textContent = active.filter((m) => m.expiry_status === 'akan_kedaluwarsa').length;
  $('count-low').textContent = active.filter((m) => m.stock_status !== 'aman').length;
  $('soon-label').textContent = `obat akan kedaluwarsa (≤ ${practice.expiry_warning_days} hari)`;
  document.querySelectorAll('[data-alert]').forEach((tile) =>
    tile.setAttribute('aria-pressed', String(tile.dataset.alert === alertFilter)));

  if (!medicines.length) {
    $('result-count').textContent = '';
    list.innerHTML = emptyDatabase();
    return;
  }

  const shown = filtered();
  $('result-count').innerHTML = `${shown.length} dari ${medicines.length} obat${alertFilter
    ? ' · <button type="button" class="font-semibold text-accent-ink underline" id="clear-alert">Tampilkan semua</button>' : ''}`;
  if (!shown.length) {
    list.innerHTML = `<div class="empty-state"><p class="empty-icon" aria-hidden="true">🔍</p>
      <p class="muted">Tidak ada obat yang cocok dengan pencarian atau filter.</p></div>`;
    return;
  }
  list.innerHTML = `
    <table class="data-table">
      <thead>
        <tr>
          <th scope="col">Obat</th><th scope="col">Kategori</th><th scope="col" class="num">Stok</th>
          <th scope="col">Batch</th><th scope="col">Kedaluwarsa terdekat</th><th scope="col">Status</th>
          <th scope="col" class="num">Aksi</th>
        </tr>
      </thead>
      <tbody>${shown.map(row).join('')}</tbody>
    </table>`;
}

function row(m) {
  const link = `${PAGES.medicine}?id=${m.id}`;
  const stock = STOCK_STATUS[m.stock_status];
  const expiry = medicineExpiry(m.expiry_status);
  const drugClass = DRUG_CLASS[m.drug_class];
  const tags = [
    drugClass ? `<span class="badge badge-${drugClass.tone}">${drugClass.label}</span>` : '',
    m.use_in_service ? '' : '<span class="badge badge-orange" title="Admin belum mengizinkan obat ini dipakai di resep">Perlu ditinjau</span>',
  ].join('');
  const hasStock = m.batch_count > 0 || m.expired_stock > 0;
  const manage = canManage(role) ? `
    <button type="button" class="btn btn-ghost btn-small" data-edit="${m.id}">Edit</button>
    <button type="button" class="btn btn-ghost btn-small" data-toggle="${m.id}">${m.is_active ? 'Nonaktifkan' : 'Aktifkan'}</button>` : '';
  return `
    <tr class="${m.is_active ? '' : 'is-muted'}">
      <td class="cell-main">
        <a class="cell-title" href="${link}">${escapeHtml(m.generic_name)}</a>
        <span class="cell-sub">${escapeHtml(medicineDetail(m) || m.unit)}</span>
        ${tags ? `<span class="mt-1.5 flex flex-wrap gap-1">${tags}</span>` : ''}
      </td>
      <td data-label="Kategori">${escapeHtml(m.category_name ?? '—')}</td>
      <td class="num" data-label="Stok">
        <strong class="text-ink">${m.stock.toLocaleString('id-ID')}</strong> ${escapeHtml(m.unit)}
        <span class="badge badge-${stock.tone} ml-1">${stock.label}</span>
        ${m.expired_stock ? `<span class="cell-sub text-red">+${m.expired_stock} kedaluwarsa, perlu dikeluarkan</span>` : ''}
      </td>
      <td data-label="Batch">${m.batch_count ? `${m.batch_count} batch` : '<span class="text-muted">—</span>'}</td>
      <td data-label="Kedaluwarsa">
        ${hasStock
          ? `${m.nearest_expiry ? formatDate(m.nearest_expiry, { day: 'numeric', month: 'short', year: 'numeric' }) : 'Tanpa tanggal'}
             <span class="cell-sub">${expiry.icon} ${expiry.label}</span>`
          : '<span class="text-muted">Belum ada stok</span>'}
      </td>
      <td data-label="Status"><span class="badge badge-${m.is_active ? 'green' : 'gray'}">${m.is_active ? 'Aktif' : 'Nonaktif'}</span></td>
      <td class="cell-actions"><div class="row-actions">
        <a class="btn btn-ghost btn-small" href="${link}">Detail</a>${manage}
      </div></td>
    </tr>`;
}

function emptyDatabase() {
  if (!canManage(role)) {
    return '<div class="empty-state"><p class="empty-icon" aria-hidden="true">💊</p><p class="muted">Belum ada obat di database.</p></div>';
  }
  return `
    <div class="empty-state">
      <p class="empty-icon" aria-hidden="true">💊</p>
      <h2>Database obat masih kosong</h2>
      <p class="max-w-md text-muted">Tambahkan obat satu per satu, atau mulai dari contoh daftar obat yang umum di praktik kebidanan.</p>
      <div class="row justify-center">
        <button type="button" class="btn btn-primary" data-add>＋ Tambah Obat</button>
        <button type="button" class="btn btn-ghost" data-examples>📋 Isi contoh obat kebidanan</button>
      </div>
      <p class="max-w-md text-[13px] text-muted">Contoh berisi 22 obat dengan stok 0 dan belum diizinkan dipakai di resep.
        Indikasi, kontraindikasi, dan aturan pakai sengaja dikosongkan: isi dan validasi sesuai regulasi, SOP, dan kewenangan Anda.</p>
    </div>`;
}

/* ---------- Actions ---------- */
async function addMedicine() {
  const suppliers = await loadSuppliers().catch(() => []);
  const saved = await openMedicineForm({ categories, suppliers, role });
  if (!saved) return;
  toast(`${saved.generic_name} ditambahkan`);
  await load();
}

$('add').addEventListener('click', addMedicine);

list.addEventListener('click', async (event) => {
  if (event.target.closest('[data-add]')) return addMedicine();
  if (event.target.closest('#clear-alert')) {
    alertFilter = null;
    return render();
  }

  const examples = event.target.closest('[data-examples]');
  if (examples) {
    examples.disabled = true;
    try {
      const added = await run(supabase.rpc('add_example_medicines'));
      toast(`${added} contoh obat ditambahkan. Lengkapi dan tinjau satu per satu.`);
      await load();
    } catch (error) {
      examples.disabled = false;
      toast(appError(error), 'error');
    }
    return;
  }

  const edit = event.target.closest('[data-edit]');
  if (edit) {
    try {
      const [medicine, suppliers] = await Promise.all([
        run(supabase.from('medicines').select('*').eq('id', edit.dataset.edit).single()),
        loadSuppliers().catch(() => []),
      ]);
      const saved = await openMedicineForm({ medicine, categories, suppliers, role });
      if (saved) {
        toast('Perubahan disimpan');
        await load();
      }
    } catch (error) {
      toast(appError(error), 'error');
    }
    return;
  }

  const toggle = event.target.closest('[data-toggle]');
  if (toggle) {
    const m = medicines.find((x) => x.id === toggle.dataset.toggle);
    if (m.is_active) {
      const ok = await confirmDialog({
        icon: '⏸️', title: `Nonaktifkan ${m.generic_name}?`,
        message: 'Obat tidak bisa dipilih di resep baru. Stok dan riwayatnya tetap tersimpan, dan bisa diaktifkan lagi kapan saja.',
        confirmLabel: 'Ya, nonaktifkan',
      });
      if (!ok) return;
    }
    try {
      await updateRow('medicines', m.id, { is_active: !m.is_active });
      toast(m.is_active ? `${m.generic_name} dinonaktifkan` : `${m.generic_name} aktif lagi`);
      refreshNavBadges();
      await load();
    } catch (error) {
      toast(appError(error), 'error');
    }
  }
});

// Admin: how many days before expiry a medicine shows as "akan kedaluwarsa".
$('settings').addEventListener('click', () => {
  const popup = openPopup({
    title: 'Peringatan kedaluwarsa',
    body: `
      <p class="text-muted">Obat ditandai 🟡 <strong>akan kedaluwarsa</strong> jika tanggal kedaluwarsanya kurang dari:</p>
      <div class="flex items-center gap-2">
        <input class="input input-money max-w-[140px]" id="warning-days" type="number" min="1" max="365" step="1"
          inputmode="numeric" value="${practice.expiry_warning_days}">
        <span class="font-semibold text-muted">hari lagi</span>
      </div>
      <p class="field-hint">Sesuaikan dengan SOP fasilitas Anda. Contoh: 90 hari (3 bulan).</p>`,
    footer: '<button type="button" class="btn btn-primary" id="save-warning">Simpan</button>',
  });
  popup.querySelector('#save-warning').addEventListener('click', async () => {
    const days = Number(popup.querySelector('#warning-days').value);
    if (!Number.isInteger(days) || days < 1 || days > 365) {
      toast('Isi angka 1 sampai 365 hari.', 'error');
      return;
    }
    try {
      await updateRow('practices', practice.id, { expiry_warning_days: days });
      practice.expiry_warning_days = days;
      closeDialog(popup);
      toast('Pengaturan disimpan');
      await load();
    } catch (error) {
      toast(appError(error), 'error');
    }
  });
});

await load();
