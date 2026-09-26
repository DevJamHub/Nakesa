import { PAGES } from '../config.js';
import { signUpWithEmail } from '../auth.js';
import { friendlyError } from '../errors.js';
import {
  applyProviderConfig, clearAlert, initOAuthButtons, initPasswordToggles,
  redirectIfSignedIn, setLoading, showAlert, validateFields,
} from '../ui.js';
import { validateConfirm, validateEmail, validateFullName, validatePassword } from '../validation.js';

redirectIfSignedIn();
applyProviderConfig();
initPasswordToggles();

const form = document.getElementById('signup-form');
const fullName = document.getElementById('full-name');
const email = document.getElementById('email');
const password = document.getElementById('password');
const confirm = document.getElementById('confirm');
const submit = document.getElementById('submit');
const alertBox = document.getElementById('alert');

initOAuthButtons(alertBox, [submit]);

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (submit.disabled) return;

  const valid = validateFields([
    [fullName, validateFullName(fullName.value)],
    [email, validateEmail(email.value)],
    [password, validatePassword(password.value)],
    [confirm, validateConfirm(password.value, confirm.value)],
  ]);
  if (!valid) return;

  clearAlert(alertBox);
  setLoading(submit, true, 'Creating account…');
  try {
    const result = await signUpWithEmail(fullName.value, email.value, password.value);
    if (result === 'signed_in') {
      window.location.replace(PAGES.dashboard);
      return;
    }
    // Email confirmation required.
    document.getElementById('confirm-email').textContent = email.value.trim();
    document.getElementById('signup-card').hidden = true;
    document.getElementById('confirm-card').hidden = false;
  } catch (error) {
    showAlert(alertBox, friendlyError(error, 'signUp'));
    setLoading(submit, false);
  }
});
