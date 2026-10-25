// Week 4 · fetch API: satu fungsi untuk semua permintaan ke server PHP (folder api/).
// Server menjawab JSON. Kalau gagal, jawabannya {"message": "…", "code": "…"} dan fungsi ini
// melempar Error dengan pesan itu, supaya halaman bisa menampilkannya ke pengguna.

const API_BASE = new URL('../api/', import.meta.url); // js/api.js → api/

/**
 * path: nama file di folder api/, misalnya 'patients.php'.
 * params: isi query string, misalnya { view: 'today', date: '2026-10-25' }.
 * body: data yang dikirim sebagai JSON (POST / PATCH / PUT).
 */
export async function api(path, { method = 'GET', params, body } = {}) {
  const url = new URL(path, API_BASE);
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== null) url.searchParams.set(key, value);
  }
  const response = await fetch(url, {
    method,
    headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    credentials: 'same-origin', // ikut mengirim cookie session login
  });
  // Server statis (misalnya Live Server VS Code) tidak menjalankan PHP: jawabannya bukan JSON.
  if (!response.headers.get('Content-Type')?.includes('application/json')) {
    const message = 'Server PHP belum berjalan. Buka NAKESA lewat "php -S localhost:8000 router.php", bukan Live Server.';
    throw Object.assign(new Error(message), { status: response.status, code: 'php_not_running', userMessage: message });
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw Object.assign(new Error(data?.message ?? `Server menjawab ${response.status}`), {
      status: response.status,
      code: data?.code,
      userMessage: data?.message,
    });
  }
  return data;
}
