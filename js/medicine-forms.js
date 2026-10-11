// Pop-up forms shared by the medicine list (medicines.html) and one medicine (medicine.html):
// add / edit a medicine, and record stock coming in. The dialogs are built on first use.
import { insertRow, run, supabase, updateRow } from './db.js';
import { bindRupiahInput, escapeHtml, parseRupiah, todayISO } from './format.js';
import { DRUG_CLASS } from './practice-utils.js';
import { isAdmin } from './roles.js';
import { appError, closeDialog, fillForm, formValues, whileSaving } from './shell.js';

const FORMS = ['Tablet', 'Tablet salut', 'Kaplet', 'Kapsul', 'Sirup', 'Suspensi', 'Drops', 'Injeksi (ampul)',
  'Injeksi (vial)', 'Cairan infus', 'Salep', 'Krim', 'Supositoria', 'Ovula', 'Serbuk (sachet)', 'Implan', 'Alat'];
const UNITS = ['tablet', 'kapsul', 'strip', 'botol', 'box', 'sachet', 'ampul', 'vial', 'tube', 'pcs'];
const ROUTES = ['Oral', 'IM', 'IV', 'SC', 'Topikal', 'Mata', 'Vaginal', 'Rektal', 'Infiltrasi lokal'];

const options = (list) => list.map((v) => `<option value="${escapeHtml(v)}"></option>`).join('');

/** Categories (shared defaults + the practice's own), in display order. */
export const loadCategories = () =>
  run(supabase.from('medicine_categories').select('id, name, practice_id').order('sort_order').order('name'));

export const loadSuppliers = () =>
  run(supabase.from('suppliers').select('id, name').eq('is_active', true).order('name'));

/** Supplier id for a typed name: an existing supplier, or a new one. */
async function supplierId(name, suppliers) {
  const typed = name?.trim();
  if (!typed) return null;
  const known = suppliers.find((s) => s.name.toLowerCase() === typed.toLowerCase());
  if (known) return known.id;
  const created = await insertRow('suppliers', { name: typed });
  suppliers.push(created);
  return created.id;
}

/* ---------- Add / edit a medicine ---------- */
let medicineDialog;

function buildMedicineDialog() {
  medicineDialog = document.createElement('dialog');
  medicineDialog.className = 'dialog-wide';
  medicineDialog.setAttribute('aria-labelledby', 'med-title');
  medicineDialog.innerHTML = `
    <form class="dialog-form" id="med-form" novalidate>
      <div class="dialog-head">
        <h2 id="med-title">Tambah Obat</h2>
        <button type="button" class="dialog-close" data-close aria-label="Tutup">✕</button>
      </div>
      <div class="form-error" id="med-error" role="alert" hidden></div>

      <div class="grid gap-3 sm:grid-cols-2">
        <div class="field">
          <label for="med-generic">Nama generik *</label>
          <input class="input" id="med-generic" name="generic_name" maxlength="120" placeholder="Contoh: Paracetamol" required>
        </div>
        <div class="field">
          <label for="med-brand">Nama dagang</label>
          <input class="input" id="med-brand" name="brand_name" maxlength="120" placeholder="Kosongkan jika generik">
        </div>
        <div class="field">
          <label for="med-category">Kategori *</label>
          <select class="input" id="med-category" name="category_id" required></select>
        </div>
        <div class="field">
          <label for="med-class">Golongan obat</label>
          <select class="input" id="med-class" name="drug_class">
            <option value="">Belum diisi</option>
            ${Object.entries(DRUG_CLASS).map(([k, v]) => `<option value="${k}">${v.label}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label for="med-form-type">Bentuk sediaan</label>
          <input class="input" id="med-form-type" name="dosage_form" list="med-forms" maxlength="60" placeholder="Tablet, sirup, injeksi…">
        </div>
        <div class="field">
          <label for="med-strength">Kekuatan / dosis sediaan</label>
          <input class="input" id="med-strength" name="strength" maxlength="60" placeholder="Contoh: 500 mg, 10 IU/mL">
        </div>
        <div class="field">
          <label for="med-unit">Satuan *</label>
          <input class="input" id="med-unit" name="unit" list="med-units" maxlength="20" placeholder="tablet" required>
        </div>
        <div class="field">
          <label for="med-route">Rute pemberian</label>
          <input class="input" id="med-route" name="route" list="med-routes" maxlength="60" placeholder="Oral, IM, IV…">
        </div>
      </div>

      <div class="form-section">
        <p class="form-section-title">Informasi klinis</p>
        <p class="alert alert-info">Isi dari referensi resmi (brosur obat, formularium, SOP fasilitas). Informasi ini
          <strong>perlu divalidasi</strong> oleh tenaga kesehatan yang berwenang dan sesuai regulasi.</p>
        <div class="field"><label for="med-ind">Indikasi</label>
          <textarea class="input" id="med-ind" name="indications" maxlength="1000" rows="2"></textarea></div>
        <div class="field"><label for="med-contra">Kontraindikasi</label>
          <textarea class="input" id="med-contra" name="contraindications" maxlength="1000" rows="2"></textarea></div>
        <div class="field"><label for="med-usage">Aturan pakai</label>
          <textarea class="input" id="med-usage" name="usage_instructions" maxlength="1000" rows="2"></textarea></div>
      </div>

      <div class="form-section">
        <p class="form-section-title">Stok &amp; harga</p>
        <div class="grid gap-3 sm:grid-cols-3">
          <div class="field"><label for="med-min">Ingatkan jika sisa ≤</label>
            <input class="input" id="med-min" name="min_stock" type="number" inputmode="numeric" min="0" step="1"></div>
          <div class="field"><label for="med-buy">Harga beli (Rp)</label>
            <input class="input" id="med-buy" name="buy_price" inputmode="numeric" autocomplete="off" placeholder="0"></div>
          <div class="field"><label for="med-sell">Harga jual (Rp)</label>
            <input class="input" id="med-sell" name="sell_price" inputmode="numeric" autocomplete="off" placeholder="Jika dijual"></div>
        </div>
      </div>

      <div class="form-section" id="med-initial">
        <p class="form-section-title">Stok awal (boleh dikosongkan)</p>
        <div class="grid gap-3 sm:grid-cols-2">
          <div class="field"><label for="med-init-qty">Jumlah</label>
            <input class="input" id="med-init-qty" name="init_qty" type="number" inputmode="numeric" min="0" step="1"></div>
          <div class="field"><label for="med-init-exp">Tanggal kedaluwarsa</label>
            <input class="input" id="med-init-exp" name="init_expires" type="date"></div>
          <div class="field"><label for="med-init-batch">Nomor batch</label>
            <input class="input" id="med-init-batch" name="init_batch" maxlength="60"></div>
          <div class="field"><label for="med-init-supplier">Supplier</label>
            <input class="input" id="med-init-supplier" name="init_supplier" list="med-suppliers" maxlength="120"></div>
        </div>
      </div>

      <div class="form-section">
        <div class="field"><label for="med-notes">Catatan</label>
          <textarea class="input" id="med-notes" name="notes" maxlength="1000" rows="2"></textarea></div>
        <label class="check-row" id="med-approve-row">
          <input type="checkbox" id="med-approve">
          <span><strong class="text-ink">Boleh dipakai di resep / pelayanan</strong>
            <span class="block text-sm text-muted">Centang hanya jika pemberian obat ini sesuai kewenangan tenaga kesehatan
              di praktik Anda, SOP fasilitas, dan regulasi yang berlaku. Hanya admin yang bisa mengubahnya.</span></span>
        </label>
      </div>

      <div class="dialog-actions">
        <button type="submit" class="btn btn-primary btn-big" id="med-save">Simpan</button>
      </div>
      <datalist id="med-forms">${options(FORMS)}</datalist>
      <datalist id="med-units">${options(UNITS)}</datalist>
      <datalist id="med-routes">${options(ROUTES)}</datalist>
      <datalist id="med-suppliers"></datalist>
    </form>`;
  document.body.append(medicineDialog);
  const form = medicineDialog.querySelector('form');
  bindRupiahInput(form.buy_price);
  bindRupiahInput(form.sell_price);
}

/**
 * Open the medicine form. `medicine` is a row of public.medicines (null = new).
 * Resolves with the saved medicine, or null when the pop-up is closed without saving.
 */
export function openMedicineForm({ medicine = null, categories, suppliers = [], role }) {
  if (!medicineDialog) buildMedicineDialog();
  const form = medicineDialog.querySelector('form');
  const errorBox = medicineDialog.querySelector('#med-error');
  const admin = isAdmin(role);

  form.category_id.innerHTML = '<option value="">Pilih kategori</option>'
    + categories.map((c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');
  medicineDialog.querySelector('#med-suppliers').innerHTML = options(suppliers.map((s) => s.name));
  fillForm(form, medicine ?? { unit: 'tablet', min_stock: 5 });
  form.buy_price.value = medicine?.buy_price ? medicine.buy_price.toLocaleString('id-ID') : '';
  form.sell_price.value = medicine?.sell_price ? medicine.sell_price.toLocaleString('id-ID') : '';
  const approve = medicineDialog.querySelector('#med-approve');
  approve.checked = Boolean(medicine?.use_in_service);
  approve.disabled = !admin;
  medicineDialog.querySelector('#med-approve-row').hidden = !admin && !medicine?.use_in_service;
  medicineDialog.querySelector('#med-initial').hidden = Boolean(medicine);
  medicineDialog.querySelector('#med-title').textContent = medicine ? 'Edit Obat' : 'Tambah Obat';
  errorBox.hidden = true;

  return new Promise((resolve) => {
    let saved = null;
    const fail = (message) => {
      errorBox.textContent = message;
      errorBox.hidden = false;
      errorBox.scrollIntoView({ block: 'nearest' });
    };
    const onSubmit = async (event) => {
      event.preventDefault();
      const v = formValues(form);
      if (!v.generic_name) return fail('Isi nama generik obat.');
      if (!v.category_id) return fail('Pilih kategori obat.');
      if (!v.unit) return fail('Isi satuan, misalnya tablet atau botol.');
      const initQty = Number(v.init_qty) || 0;
      if (initQty > 0 && v.init_expires && v.init_expires < todayISO()) {
        return fail('Tanggal kedaluwarsa stok awal sudah lewat. Obat kedaluwarsa jangan dimasukkan ke stok.');
      }
      const row = {
        generic_name: v.generic_name,
        brand_name: v.brand_name,
        category_id: v.category_id,
        drug_class: v.drug_class,
        dosage_form: v.dosage_form,
        strength: v.strength,
        unit: v.unit,
        route: v.route,
        indications: v.indications,
        contraindications: v.contraindications,
        usage_instructions: v.usage_instructions,
        min_stock: Number(v.min_stock) || 0,
        buy_price: v.buy_price ? parseRupiah(v.buy_price) : null,
        sell_price: v.sell_price ? parseRupiah(v.sell_price) : null,
        notes: v.notes,
      };
      if (admin) row.use_in_service = approve.checked; // the database refuses this from non-admins anyway
      try {
        await whileSaving(medicineDialog.querySelector('#med-save'), async () => {
          saved = medicine ? await updateRow('medicines', medicine.id, row) : await insertRow('medicines', row);
          if (!medicine && initQty > 0) {
            await run(supabase.rpc('receive_stock', {
              p_medicine_id: saved.id,
              p_quantity: initQty,
              p_expires_on: v.init_expires,
              p_batch_number: v.init_batch,
              p_supplier_id: await supplierId(v.init_supplier, suppliers),
              p_buy_price: row.buy_price,
              p_note: 'Stok awal',
            }));
          }
        });
        closeDialog(medicineDialog);
      } catch (error) {
        fail(appError(error));
      }
    };
    form.addEventListener('submit', onSubmit);
    form.addEventListener('input', () => { errorBox.hidden = true; });
    medicineDialog.addEventListener('close', () => {
      form.removeEventListener('submit', onSubmit);
      resolve(saved);
    }, { once: true });
    medicineDialog.showModal();
    form.generic_name.focus();
  });
}

/* ---------- Stock in ---------- */
let stockDialog;

function buildStockDialog() {
  stockDialog = document.createElement('dialog');
  stockDialog.setAttribute('aria-labelledby', 'stock-title');
  stockDialog.innerHTML = `
    <form class="dialog-form" novalidate>
      <div class="dialog-head">
        <div>
          <h2 id="stock-title">📥 Stok Masuk</h2>
          <p class="text-sm text-muted" id="stock-medicine"></p>
        </div>
        <button type="button" class="dialog-close" data-close aria-label="Tutup">✕</button>
      </div>
      <div class="form-error" id="stock-error" role="alert" hidden></div>
      <div class="field">
        <label for="stock-qty">Jumlah masuk *</label>
        <div class="flex items-center gap-2">
          <input class="input input-money" id="stock-qty" name="quantity" type="number" inputmode="numeric" min="1" step="1" required>
          <span class="shrink-0 font-semibold text-muted" id="stock-unit"></span>
        </div>
      </div>
      <div class="grid gap-3 sm:grid-cols-2">
        <div class="field"><label for="stock-exp">Tanggal kedaluwarsa</label>
          <input class="input" id="stock-exp" name="expires_on" type="date"></div>
        <div class="field"><label for="stock-batch">Nomor batch</label>
          <input class="input" id="stock-batch" name="batch_number" maxlength="60" placeholder="Lihat di kemasan"></div>
        <div class="field"><label for="stock-supplier">Supplier</label>
          <input class="input" id="stock-supplier" name="supplier" list="stock-suppliers" maxlength="120"></div>
        <div class="field"><label for="stock-price">Harga beli per satuan (Rp)</label>
          <input class="input" id="stock-price" name="buy_price" inputmode="numeric" autocomplete="off"></div>
      </div>
      <div class="field"><label for="stock-note">Catatan</label>
        <input class="input" id="stock-note" name="note" maxlength="300" placeholder="Contoh: Faktur no. 123"></div>
      <p class="field-hint">Nomor batch dan tanggal kedaluwarsa yang sama akan digabung ke batch yang sudah ada.</p>
      <div class="dialog-actions">
        <button type="submit" class="btn btn-success btn-big" id="stock-save">Simpan stok masuk</button>
      </div>
      <datalist id="stock-suppliers"></datalist>
    </form>`;
  document.body.append(stockDialog);
  bindRupiahInput(stockDialog.querySelector('form').buy_price);
}

/** Record stock coming in for a medicine. Resolves true when saved. */
export function openStockIn({ medicine, suppliers = [] }) {
  if (!stockDialog) buildStockDialog();
  const form = stockDialog.querySelector('form');
  const errorBox = stockDialog.querySelector('#stock-error');
  form.reset();
  errorBox.hidden = true;
  stockDialog.querySelector('#stock-medicine').textContent = medicine.generic_name;
  stockDialog.querySelector('#stock-unit').textContent = medicine.unit;
  stockDialog.querySelector('#stock-suppliers').innerHTML = options(suppliers.map((s) => s.name));

  return new Promise((resolve) => {
    let saved = false;
    const fail = (message) => {
      errorBox.textContent = message;
      errorBox.hidden = false;
    };
    const onSubmit = async (event) => {
      event.preventDefault();
      const v = formValues(form);
      const quantity = Number(v.quantity);
      if (!Number.isInteger(quantity) || quantity <= 0) return fail('Isi jumlah yang masuk.');
      if (v.expires_on && v.expires_on < todayISO()) {
        return fail('Tanggal kedaluwarsa sudah lewat. Obat kedaluwarsa jangan dimasukkan ke stok.');
      }
      try {
        await whileSaving(stockDialog.querySelector('#stock-save'), async () => {
          await run(supabase.rpc('receive_stock', {
            p_medicine_id: medicine.id,
            p_quantity: quantity,
            p_expires_on: v.expires_on,
            p_batch_number: v.batch_number,
            p_supplier_id: await supplierId(v.supplier, suppliers),
            p_buy_price: v.buy_price ? parseRupiah(v.buy_price) : null,
            p_note: v.note,
          }));
        });
        saved = true;
        closeDialog(stockDialog);
      } catch (error) {
        fail(appError(error));
      }
    };
    form.addEventListener('submit', onSubmit);
    stockDialog.addEventListener('close', () => {
      form.removeEventListener('submit', onSubmit);
      resolve(saved);
    }, { once: true });
    stockDialog.showModal();
    form.quantity.focus();
  });
}
