import { sendPasswordReset } from '../auth.js';
import { friendlyError } from '../errors.js';
import { clearAlert, redirectIfSignedIn, setLoading, showAlert, validateFields } from '../ui.js';
import { validateEmail } from '../validation.js';

redirectIfSignedIn();

const form = document.getElementById('forgot-form');
const email = document.getElementById('email');
const submit = document.getElementById('submit');
const alertBox = document.getElementById('alert');

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (submit.disabled) return;
  if (!validateFields([[email, validateEmail(email.value)]])) return;

  clearAlert(alertBox);
  setLoading(submit, true, 'Sending link…');
  try {
    await sendPasswordReset(email.value);
    document.getElementById('sent-email').textContent = email.value.trim();
    form.hidden = true;
    document.getElementById('sent-panel').hidden = false;
  } catch (error) {
    showAlert(alertBox, friendlyError(error, 'reset'));
    setLoading(submit, false);
  }
});
