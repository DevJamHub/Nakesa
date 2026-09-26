// Placeholder for the main application (dashboard comes later).
// Signed-out users are redirected to login; users without a name complete their profile first.
import { PAGES } from '../config.js';
import { onAuthChange, signOut } from '../auth.js';
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

  document.getElementById('loader').hidden = true;
  document.getElementById('content').hidden = false;

  if (profile?.full_name) showHome(profile);
  else showProfileSetup();

  function showHome(p) {
    document.getElementById('setup-card').hidden = true;
    document.getElementById('home-card').hidden = false;
    document.getElementById('home-title').textContent = `Welcome, ${p.full_name}`;
    document.getElementById('home-email').textContent = p.email ?? user.email;
    const provider = user.app_metadata?.provider ?? 'email';
    document.getElementById('home-provider').textContent = provider.charAt(0).toUpperCase() + provider.slice(1);
    document.title = 'NAKESA';

    const button = document.getElementById('sign-out');
    button.addEventListener('click', async () => {
      if (button.disabled) return;
      setLoading(button, true, 'Signing out…');
      try {
        await signOut();
        window.location.replace(PAGES.welcome);
      } catch (error) {
        showAlert(document.getElementById('home-alert'), friendlyError(error, 'signOut'));
        setLoading(button, false);
      }
    });
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
        showHome(await updateFullName(user.id, fullName.value));
      } catch (error) {
        showAlert(alertBox, friendlyError(error, 'update'));
        setLoading(submit, false);
      }
    });
  }
}
