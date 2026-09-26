// Opened from the password-reset email. supabase-js exchanges the link's code
// for a temporary recovery session, then the user chooses a new password.
import { PAGES } from '../config.js';
import { getSession, updatePassword } from '../auth.js';
import { friendlyError } from '../errors.js';
import { clearAlert, initPasswordToggles, setLoading, showAlert, validateFields } from '../ui.js';
import { validateConfirm, validatePassword } from '../validation.js';

const session = await getSession();

document.getElementById('loader').hidden = true;
document.getElementById('content').hidden = false;

if (!session) {
  document.getElementById('expired-card').hidden = false;
} else {
  document.getElementById('reset-card').hidden = false;
  initPasswordToggles();

  const form = document.getElementById('reset-form');
  const password = document.getElementById('password');
  const confirm = document.getElementById('confirm');
  const submit = document.getElementById('submit');
  const alertBox = document.getElementById('alert');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (submit.disabled) return;

    const valid = validateFields([
      [password, validatePassword(password.value)],
      [confirm, validateConfirm(password.value, confirm.value)],
    ]);
    if (!valid) return;

    clearAlert(alertBox);
    setLoading(submit, true, 'Saving…');
    try {
      await updatePassword(password.value);
      window.location.replace(PAGES.app);
    } catch (error) {
      showAlert(alertBox, friendlyError(error, 'update'));
      setLoading(submit, false);
    }
  });
}
