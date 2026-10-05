// One medicine (medicine.html?id=…): its data, batches with stock, the full stock history
// and where it was used in prescriptions. Stock changes go through database functions.
import { PAGES } from '../config.js';
import { deleteRow, run, supabase, updateRow } from '../db.js';
import { escapeHtml, formatDate, rupiah, todayISO } from '../format.js';
import { loadCategories, loadSuppliers, openMedicineForm, openStockIn } from '../medicine-forms.js';
import {
  DRUG_CLASS, EXPIRY_STATUS, MOVEMENT_TYPE, STOCK_STATUS, batchExpiry, medicineDetail, medicineExpiry,
} from '../practice-utils.js';
import { canManage, isAdmin, practiceRole } from '../roles.js';
import {
  appError, closeDialog, confirmDialog, openPopup, refreshNavBadges, startPage, toast,
} from '../shell.js';

const { user, practice } = await startPage('medicines');
const role = await practiceRole(practice, user);
const id = new URLSearchParams(location.search).get('id');
const $ = (elementId) => document.getElementById(elementId);
const shortDate = (iso) => formatDate(iso, { day: 'numeric', month: 'short', year: 'numeric' });

let medicine = null; // row of public.medicines (+ category name)
let inventory = null; // row of the medicine_inventory view
let batches = [];
let usage = [];

async function load() {
  try {
    const since = new Date(Date.now() - 30 * 86_400_000).toISOString();
    let used;
    [medicine, inventory, batches, used] = await Promise.all([
      run(supabase.from('medicines').select('*, medicine_categories(name)').eq('id', id).maybeSingle()),
      run(supabase.from('medicine_inventory').select('*').eq('id', id).maybeSingle()),
      run(supabase.from('medicine_batches')
        .select('id, batch_number, expires_on, received_on, buy_price, suppliers(name), medicine_stock(quantity)')
        .eq('medicine_id', id).order('expires_on', { nullsFirst: false }).order('received_on')),
      run(supabase.from('stock_movements').select('quantity')
        .eq('medicine_id', id).in('movement_type', ['resep', 'keluar']).gte('created_at', since)),
    ]);
    if (!medicine) {
      document.querySelector('main').innerHTML = `<div class="card empty-state"><p class="empty-icon" aria-hidden="true">🔍</p>
        <p>Obat tidak ditemukan.</p><a class="btn btn-primary" href="${PAGES.medicines}">Kembali ke Database Obat</a></div>`;
      return;
    }
    renderHeader(used.reduce((sum, m) => sum - m.quantity, 0));
    renderInfo();
    renderBatches();
    await Promise.all([loadHistory(), loadUsage()]);
  } catch (error) {
    toast(appError(error), 'error');
  }
}

const quantityOf = (batch) => (Array.isArray(batch.medicine_stock)
  ? batch.medicine_stock[0]?.quantity : batch.medicine_stock?.quantity) ?? 0;

/* ---------- Header, numbers ---------- */
function renderHeader(usedLast30) {
  document.title = `${medicine.generic_name} — NAKESA`;
  $('name').textContent = medicine.generic_name;
  $('detail').textContent = [medicineDetail(medicine), medicine.medicine_categories?.name].filter(Boolean).join(' · ');
  const drugClass = DRUG_CLASS[medicine.drug_class];
  $('tags').innerHTML = [
    `<span class="badge badge-${medicine.is_active ? 'green' : 'gray'}">${medicine.is_active ? 'Aktif' : 'Nonaktif'}</span>`,
    drugClass ? `<span class="badge badge-${drugClass.tone}">${drugClass.label}</span>` : '',
    medicine.use_in_service
      ? '<span class="badge badge-blue">✓ Boleh dipakai di layanan</span>'
      : '<span class="badge badge-orange">Perlu ditinjau admin sebelum dipakai di resep</span>',
  ].join('');

  $('actions').hidden = !canManage(role);
  $('toggle').textContent = medicine.is_active ? '⏸️ Nonaktifkan' : '▶️ Aktifkan';
  // Only an unused medicine can be deleted (the database refuses the rest).
  $('delete').hidden = !isAdmin(role) || batches.length > 0;

  const stock = STOCK_STATUS[inventory.stock_status];
  $('stat-stock').textContent = `${inventory.stock.toLocaleString('id-ID')} ${medicine.unit}`;
  $('stat-stock-note').innerHTML = `<span class="badge badge-${stock.tone}">${stock.label}</span>
    <span class="text-muted">min. ${inventory.min_stock}</span>`;
  $('stat-batches').textContent = inventory.batch_count;
  $('stat-batches-note').textContent = inventory.expired_stock
    ? `+${inventory.expired_stock} ${medicine.unit} kedaluwarsa belum dikeluarkan` : '';
  const expiry = medicineExpiry(inventory.expiry_status);
  $('stat-expiry').textContent = inventory.nearest_expiry ? shortDate(inventory.nearest_expiry) : '—';
  $('stat-expiry-note').innerHTML = inventory.batch_count || inventory.expired_stock
    ? `<span class="badge badge-${expiry.tone}">${expiry.icon} ${expiry.label}</span>` : '<span class="text-muted">Belum ada stok</span>';
  $('stat-used').textContent = `${usedLast30.toLocaleString('id-ID')} ${medicine.unit}`;
}

function renderInfo() {
  const m = medicine;
  const rows = [
    ['ID obat', `<code class="text-xs">${m.id.slice(0, 8).toUpperCase()}</code>`],
    ['Nama generik', escapeHtml(m.generic_name)],
    ['Nama dagang', escapeHtml(m.brand_name ?? '—')],
    ['Kategori', escapeHtml(m.medicine_categories?.name ?? '—')],
    ['Golongan', DRUG_CLASS[m.drug_class]?.label ?? '<span class="text-muted">Belum diisi</span>'],
    ['Bentuk sediaan', escapeHtml(m.dosage_form ?? '—')],
    ['Kekuatan / dosis', escapeHtml(m.strength ?? '—')],
    ['Satuan', escapeHtml(m.unit)],
    ['Rute pemberian', escapeHtml(m.route ?? '—')],
    ['Stok minimum', `${m.min_stock} ${escapeHtml(m.unit)}`],
    ['Harga beli', m.buy_price != null ? rupiah(m.buy_price) : '—'],
    ['Harga jual', m.sell_price != null ? rupiah(m.sell_price) : '—'],
    ['Catatan', escapeHtml(m.notes ?? '—')],
  ];
  $('info').innerHTML = rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
  if (isAdmin(role)) {
    $('info').insertAdjacentHTML('beforeend', `
      <div><dt>Dipakai di layanan</dt><dd>
        <button type="button" class="btn btn-small ${m.use_in_service ? 'btn-ghost' : 'btn-success'}" id="approve">
          ${m.use_in_service ? 'Cabut izin' : '✓ Izinkan dipakai'}</button></dd></div>`);
  }

  const clinical = [
    ['Indikasi', m.indications],
    ['Kontraindikasi', m.contraindications],
    ['Aturan pakai', m.usage_instructions],
  ];
  $('clinical').innerHTML = clinical.map(([label, text]) => `
    <div>
      <p class="text-sm font-semibold text-ink">${label}</p>
      ${text ? `<p class="whitespace-pre-line">${escapeHtml(text)}</p>`
    : '<p class="text-sm text-muted">Belum diisi · perlu divalidasi berdasarkan regulasi/SOP/tenaga kesehatan.</p>'}
    </div>`).join('');
}

/* ---------- Batches ---------- */
function renderBatches() {
  const showEmpty = $('show-empty').checked;
  const shown = batches.filter((b) => showEmpty || quantityOf(b) > 0);
  if (!shown.length) {
    $('batches').innerHTML = `<div class="empty-state"><p class="empty-icon" aria-hidden="true">📦</p>
      <p class="muted">${batches.length ? 'Semua batch sudah habis.' : 'Belum ada stok. Tekan “Stok masuk” untuk mencatat obat yang datang.'}</p></div>`;
    return;
  }
  const manage = canManage(role);
  $('batches').innerHTML = `
    <table class="data-table">
      <thead><tr>
        <th scope="col">No. batch</th><th scope="col">Kedaluwarsa</th><th scope="col">Supplier</th>
        <th scope="col">Diterima</th><th scope="col" class="num">Stok</th>${manage ? '<th scope="col" class="num">Aksi</th>' : ''}
      </tr></thead>
      <tbody>${shown.map((b) => {
        const quantity = quantityOf(b);
        const status = EXPIRY_STATUS[batchExpiry(b.expires_on, practice.expiry_warning_days)];
        const expired = b.expires_on && b.expires_on < todayISO();
        return `
          <tr class="${quantity ? '' : 'is-muted'}">
            <td><span class="cell-title">${escapeHtml(b.batch_number ?? 'Tanpa nomor batch')}</span></td>
            <td data-label="Kedaluwarsa">${b.expires_on ? shortDate(b.expires_on) : 'Tanpa tanggal'}
              ${b.expires_on ? `<span class="cell-sub">${status.icon} ${status.label}</span>` : ''}</td>
            <td data-label="Supplier">${escapeHtml(b.suppliers?.name ?? '—')}</td>
            <td data-label="Diterima">${shortDate(b.received_on)}</td>
            <td class="num" data-label="Stok"><strong class="text-ink">${quantity.toLocaleString('id-ID')}</strong> ${escapeHtml(medicine.unit)}</td>
            ${manage ? `<td class="cell-actions"><div class="row-actions">
              ${quantity ? `<button type="button" class="btn ${expired ? 'btn-danger' : 'btn-ghost'} btn-small" data-out="${b.id}">
                ${expired ? '⌛ Keluarkan (kedaluwarsa)' : '📤 Keluarkan'}</button>` : ''}
              <button type="button" class="btn btn-ghost btn-small" data-correct="${b.id}">⚖️ Koreksi</button>
            </div></td>` : ''}
          </tr>`;
      }).join('')}</tbody>
    </table>`;
}

$('show-empty').addEventListener('change', renderBatches);

const batchName = (b) => `${b.batch_number ?? 'Tanpa nomor batch'}${b.expires_on ? ` · ED ${shortDate(b.expires_on)}` : ''}`;

// Stock out without a prescription: given out, damaged or expired.
function openStockOut(batch) {
  const available = quantityOf(batch);
  const expired = batch.expires_on && batch.expires_on < todayISO();
  const popup = openPopup({
    title: 'Keluarkan stok',
    body: `
      <p class="text-muted">${escapeHtml(medicine.generic_name)} · ${escapeHtml(batchName(batch))} · sisa ${available} ${escapeHtml(medicine.unit)}</p>
      <div class="choices" role="radiogroup" aria-label="Alasan">
        ${[['keluar', '📤 Dipakai / diberikan'], ['rusak', '💔 Rusak'], ['kedaluwarsa', '⌛ Kedaluwarsa']].map(([value, label]) => `
          <label class="choice"><input type="radio" name="out-type" value="${value}" ${(expired ? value === 'kedaluwarsa' : value === 'keluar') ? 'checked' : ''}>
          <span>${label}</span></label>`).join('')}
      </div>
      <div class="field"><label for="out-qty">Jumlah</label>
        <div class="flex items-center gap-2">
          <input class="input input-money" id="out-qty" type="number" min="1" max="${available}" step="1" inputmode="numeric" value="${expired ? available : ''}">
          <span class="shrink-0 font-semibold text-muted">${escapeHtml(medicine.unit)}</span>
        </div></div>
      <div class="field"><label for="out-note">Keterangan</label>
        <input class="input" id="out-note" maxlength="300" placeholder="Contoh: dipakai untuk tindakan, dimusnahkan"></div>
      <p class="field-hint">Untuk obat yang diberikan ke pasien, sebaiknya catat lewat menu Resep supaya riwayat pasien lengkap.</p>`,
    footer: '<button type="button" class="btn btn-primary" id="out-save">Simpan</button>',
  });
  popup.querySelector('#out-save').addEventListener('click', async (event) => {
    const quantity = Number(popup.querySelector('#out-qty').value);
    if (!Number.isInteger(quantity) || quantity <= 0) return toast('Isi jumlah yang dikeluarkan.', 'error');
    if (quantity > available) return toast(`Stok batch ini hanya ${available} ${medicine.unit}.`, 'error');
    event.target.disabled = true;
    try {
      await run(supabase.rpc('record_stock_out', {
        p_batch_id: batch.id,
        p_type: popup.querySelector('input[name="out-type"]:checked').value,
        p_quantity: quantity,
        p_note: popup.querySelector('#out-note').value,
      }));
      closeDialog(popup);
      toast('Stok keluar dicatat');
      refreshNavBadges();
      await load();
    } catch (error) {
      event.target.disabled = false;
      toast(appError(error), 'error');
    }
  });
}

// Stock count (stok opname): enter the real number; the difference is recorded as a correction.
function openCorrection(batch) {
  const current = quantityOf(batch);
  const popup = openPopup({
    title: 'Koreksi stok',
    body: `
      <p class="text-muted">${escapeHtml(medicine.generic_name)} · ${escapeHtml(batchName(batch))}</p>
      <p>Menurut catatan: <strong class="text-ink">${current} ${escapeHtml(medicine.unit)}</strong></p>
      <div class="field"><label for="count-qty">Jumlah sebenarnya (hasil hitung)</label>
        <input class="input input-money" id="count-qty" type="number" min="0" step="1" inputmode="numeric" value="${current}"></div>
      <div class="field"><label for="count-note">Alasan koreksi *</label>
        <input class="input" id="count-note" maxlength="300" placeholder="Contoh: hasil stok opname akhir bulan"></div>
      <p class="preview-line" id="count-preview"></p>`,
    footer: '<button type="button" class="btn btn-primary" id="count-save">Simpan koreksi</button>',
  });
  const qty = popup.querySelector('#count-qty');
  const preview = popup.querySelector('#count-preview');
  qty.addEventListener('input', () => {
    const diff = Number(qty.value) - current;
    preview.textContent = diff ? `Selisih: ${diff > 0 ? '+' : ''}${diff} ${medicine.unit}` : '';
  });
  popup.querySelector('#count-save').addEventListener('click', async (event) => {
    event.target.disabled = true;
    try {
      await run(supabase.rpc('correct_stock', {
        p_batch_id: batch.id,
        p_counted: Number(qty.value),
        p_note: popup.querySelector('#count-note').value,
      }));
      closeDialog(popup);
      toast('Koreksi stok dicatat');
      refreshNavBadges();
      await load();
    } catch (error) {
      event.target.disabled = false;
      toast(appError(error), 'error');
    }
  });
}

$('batches').addEventListener('click', (event) => {
  const out = event.target.closest('[data-out]');
  if (out) return openStockOut(batches.find((b) => b.id === out.dataset.out));
  const correct = event.target.closest('[data-correct]');
  if (correct) openCorrection(batches.find((b) => b.id === correct.dataset.correct));
});

/* ---------- Stock history ---------- */
async function loadHistory() {
  const moves = await run(supabase.from('stock_movements')
    .select('id, movement_type, quantity, stock_after, note, created_at, created_by, medicine_batches(batch_number)')
    .eq('medicine_id', id).order('created_at', { ascending: false }).limit(100));
  if (!moves.length) {
    $('history').innerHTML = '<div class="empty-state"><p class="empty-icon" aria-hidden="true">🧾</p><p class="muted">Belum ada transaksi stok.</p></div>';
    return;
  }
  $('history').innerHTML = `
    <table class="data-table">
      <thead><tr>
        <th scope="col">Waktu</th><th scope="col">Jenis</th><th scope="col">Batch</th>
        <th scope="col" class="num">Jumlah</th><th scope="col" class="num">Sisa batch</th><th scope="col">Keterangan</th>
      </tr></thead>
      <tbody>${moves.map((m) => {
        const type = MOVEMENT_TYPE[m.movement_type];
        const time = new Date(m.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        return `
          <tr>
            <td><span class="whitespace-nowrap">${time}</span>${m.created_by && m.created_by !== user.id ? '<span class="cell-sub">oleh anggota lain</span>' : ''}</td>
            <td data-label="Jenis"><span class="badge badge-${type.tone}">${type.icon} ${type.label}</span></td>
            <td data-label="Batch">${escapeHtml(m.medicine_batches?.batch_number ?? 'Tanpa nomor')}</td>
            <td class="num" data-label="Jumlah"><strong class="${m.quantity > 0 ? 'text-green' : 'text-red'}">${m.quantity > 0 ? '+' : '−'}${Math.abs(m.quantity)}</strong></td>
            <td class="num" data-label="Sisa batch">${m.stock_after}</td>
            <td data-label="Keterangan">${escapeHtml(m.note ?? '—')}</td>
          </tr>`;
      }).join('')}</tbody>
    </table>`;
}

/* ---------- Use in prescriptions ---------- */
async function loadUsage() {
  usage = await run(supabase.from('prescription_items')
    .select('id, dose, frequency, duration, quantity, route, created_at, prescriptions(patient_name, status, completed_at)')
    .eq('medicine_id', id).order('created_at', { ascending: false }).limit(50));
  if (!canManage(role)) {
    $('usage').innerHTML = '<div class="empty-state"><p class="muted">Resep hanya bisa dilihat oleh admin dan tenaga kesehatan.</p></div>';
    return;
  }
  if (!usage.length) {
    $('usage').innerHTML = '<div class="empty-state"><p class="empty-icon" aria-hidden="true">📝</p><p class="muted">Obat ini belum pernah dipakai di resep.</p></div>';
    return;
  }
  const STATUS = { draft: ['Draf', 'gray'], selesai: ['Selesai', 'green'], batal: ['Batal', 'red'] };
  $('usage').innerHTML = `
    <table class="data-table">
      <thead><tr>
        <th scope="col">Tanggal</th><th scope="col">Pasien</th><th scope="col">Aturan</th>
        <th scope="col" class="num">Jumlah</th><th scope="col">Status</th>
      </tr></thead>
      <tbody>${usage.map((u) => {
        const [label, tone] = STATUS[u.prescriptions?.status] ?? ['—', 'gray'];
        return `
          <tr>
            <td>${shortDate((u.prescriptions?.completed_at ?? u.created_at).slice(0, 10))}</td>
            <td data-label="Pasien"><span class="font-semibold text-ink">${escapeHtml(u.prescriptions?.patient_name ?? '—')}</span></td>
            <td data-label="Aturan">${escapeHtml([u.dose, u.frequency, u.duration].filter(Boolean).join(' · '))}${u.route ? `<span class="cell-sub">${escapeHtml(u.route)}</span>` : ''}</td>
            <td class="num" data-label="Jumlah">${u.quantity} ${escapeHtml(medicine.unit)}</td>
            <td data-label="Status"><span class="badge badge-${tone}">${label}</span></td>
          </tr>`;
      }).join('')}</tbody>
    </table>`;
}

/* ---------- Actions ---------- */
$('stock-in').addEventListener('click', async () => {
  const suppliers = await loadSuppliers().catch(() => []);
  if (await openStockIn({ medicine, suppliers })) {
    toast('Stok masuk dicatat');
    refreshNavBadges();
    await load();
  }
});

$('edit').addEventListener('click', async () => {
  const [categories, suppliers] = await Promise.all([loadCategories(), loadSuppliers().catch(() => [])]);
  const saved = await openMedicineForm({ medicine, categories, suppliers, role });
  if (saved) {
    toast('Perubahan disimpan');
    await load();
  }
});

$('toggle').addEventListener('click', async () => {
  if (medicine.is_active) {
    const ok = await confirmDialog({
      icon: '⏸️', title: `Nonaktifkan ${medicine.generic_name}?`,
      message: 'Obat tidak bisa dipilih di resep baru. Stok dan riwayatnya tetap tersimpan.',
      confirmLabel: 'Ya, nonaktifkan',
    });
    if (!ok) return;
  }
  try {
    await updateRow('medicines', medicine.id, { is_active: !medicine.is_active });
    toast(medicine.is_active ? 'Obat dinonaktifkan' : 'Obat aktif lagi');
    refreshNavBadges();
    await load();
  } catch (error) {
    toast(appError(error), 'error');
  }
});

$('delete').addEventListener('click', async () => {
  const ok = await confirmDialog({
    icon: '🗑️', title: `Hapus ${medicine.generic_name}?`,
    message: 'Obat ini belum punya stok atau riwayat, jadi bisa dihapus permanen.',
    confirmLabel: 'Ya, hapus',
  });
  if (!ok) return;
  try {
    await deleteRow('medicines', medicine.id);
    toast('Obat dihapus');
    window.location.href = PAGES.medicines;
  } catch (error) {
    toast(appError(error), 'error');
  }
});

// Admin approves (or withdraws) the medicine for prescriptions/services.
$('info').addEventListener('click', async (event) => {
  if (!event.target.closest('#approve')) return;
  const approving = !medicine.use_in_service;
  const ok = await confirmDialog({
    icon: approving ? '✅' : '⛔',
    title: approving ? `Izinkan ${medicine.generic_name} dipakai di layanan?` : `Cabut izin ${medicine.generic_name}?`,
    message: approving
      ? 'Pastikan pemberian obat ini sesuai kewenangan tenaga kesehatan di praktik Anda, SOP fasilitas, dan regulasi yang berlaku.'
      : 'Obat tidak bisa dipilih di resep baru sampai diizinkan lagi.',
    confirmLabel: approving ? 'Ya, izinkan' : 'Ya, cabut izin',
    tone: approving ? 'success' : 'danger',
  });
  if (!ok) return;
  try {
    await updateRow('medicines', medicine.id, { use_in_service: approving });
    toast(approving ? 'Obat diizinkan dipakai di layanan' : 'Izin dicabut');
    await load();
  } catch (error) {
    toast(appError(error), 'error');
  }
});

await load();
