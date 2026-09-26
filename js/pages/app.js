// Profile setup: asks for a name when the account has none (e.g. Apple sign-in),
// then continues to the dashboard. Signed-out users are redirected to login.
import { PAGES } from '../config.js';
import { onAuthChange } from '../auth.js';
import { friendlyError } from '../errors.js';
import { fetchProfile, updateFullName } from '../profile.js';
import { clearAlert, requireSession, setLoading, showAlert, validateFields } from '../ui.js';
import { validateFullName } from '../validation.js';

const session = await requireSession();

if (session) {
  const user = session.user;
  let profile = null;
  try {
    profile = await fetchProfile(user.id);
  } catch (error) {
    friendlyError(error, 'profile'); // logs in development
  }

  // Leave the page if the user signs out in another tab.
  onAuthChange((event) => {
    if (event === 'SIGNED_OUT') window.location.replace(PAGES.login);
  });

  if (profile?.full_name) {
    window.location.replace(PAGES.dashboard); // profile already complete
  } else {
    document.getElementById('loader').hidden = true;
    document.getElementById('content').hidden = false;
    showProfileSetup();
  }

  function showProfileSetup() {
    document.getElementById('setup-card').hidden = false;
    document.getElementById('setup-email').value = user.email ?? '';

    const form = document.getElementById('setup-form');
    const fullName = document.getElementById('full-name');
    const submit = document.getElementById('setup-submit');
    const alertBox = document.getElementById('setup-alert');
    fullName.focus();

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (submit.disabled) return;
      if (!validateFields([[fullName, validateFullName(fullName.value)]])) return;

      clearAlert(alertBox);
      setLoading(submit, true, 'Saving…');
      try {
        await updateFullName(user.id, fullName.value);
        window.location.replace(PAGES.dashboard);
      } catch (error) {
        showAlert(alertBox, friendlyError(error, 'update'));
        setLoading(submit, false);
      }
    });
  }
}
