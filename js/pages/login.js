import { PAGES } from '../config.js';
import { signInWithEmail } from '../auth.js';
import { friendlyError } from '../errors.js';
import {
  applyProviderConfig, clearAlert, initOAuthButtons, initPasswordToggles,
  redirectIfSignedIn, setLoading, showAlert, validateFields,
} from '../ui.js';
import { validateEmail } from '../validation.js';

redirectIfSignedIn();
applyProviderConfig();
initPasswordToggles();

const form = document.getElementById('login-form');
const email = document.getElementById('email');
const password = document.getElementById('password');
const submit = document.getElementById('submit');
const alertBox = document.getElementById('alert');

initOAuthButtons(alertBox, [submit]);

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (submit.disabled) return; // prevent double submission

  const valid = validateFields([
    [email, validateEmail(email.value)],
    [password, password.value ? '' : 'Password is required.'],
  ]);
  if (!valid) return;

  clearAlert(alertBox);
  setLoading(submit, true, 'Signing in…');
  try {
    await signInWithEmail(email.value, password.value);
    window.location.replace(PAGES.app);
  } catch (error) {
    showAlert(alertBox, friendlyError(error, 'signIn'));
    setLoading(submit, false);
  }
});
