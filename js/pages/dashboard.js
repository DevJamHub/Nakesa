// Main dashboard. Only signed-in users with a completed profile get here:
// no session → login.html, no name yet → app.html (profile setup).
import { PAGES } from '../config.js';
import { onAuthChange, signOut } from '../auth.js';
import { friendlyError } from '../errors.js';
import { fetchProfile } from '../profile.js';
import { requireSession, setLoading, showAlert } from '../ui.js';

const session = await requireSession();

if (session) {
  const user = session.user;
  let profile = null;
  try {
    profile = await fetchProfile(user.id);
  } catch (error) {
    friendlyError(error, 'profile'); // logs in development
  }

  if (!profile?.full_name) {
    window.location.replace(PAGES.app);
  } else {
    render(profile);
  }

  function render(p) {
    const provider = user.app_metadata?.provider ?? 'email';

    document.getElementById('user-name').textContent = p.full_name;
    document.getElementById('user-email').textContent = p.email ?? user.email;
    document.getElementById('user-provider').textContent = provider.charAt(0).toUpperCase() + provider.slice(1);
    document.getElementById('dash-title').textContent = `${greeting()}, ${p.full_name}`;
    document.getElementById('today').textContent = new Date().toLocaleDateString('id-ID', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
    showAvatar(p);

    // Leave the page if the user signs out in another tab.
    onAuthChange((event) => {
      if (event === 'SIGNED_OUT') window.location.replace(PAGES.login);
    });

    const button = document.getElementById('sign-out');
    button.addEventListener('click', async () => {
      if (button.disabled) return;
      setLoading(button, true, 'Keluar…');
      try {
        await signOut();
        window.location.replace(PAGES.welcome);
      } catch (error) {
        showAlert(document.getElementById('dash-alert'), friendlyError(error, 'signOut'));
        setLoading(button, false);
      }
    });

    document.getElementById('loader').hidden = true;
    document.getElementById('content').hidden = false;
  }

  /** Google photo if available, otherwise the first letter of the name. */
  function showAvatar(p) {
    const box = document.getElementById('user-avatar');
    box.textContent = p.full_name.charAt(0).toUpperCase();
    if (!p.avatar_url) return;

    const img = document.createElement('img');
    img.src = p.avatar_url;
    img.alt = '';
    img.referrerPolicy = 'no-referrer'; // Google photos may refuse requests that send a referrer
    img.onload = () => box.replaceChildren(img);
  }

  function greeting() {
    const hour = new Date().getHours();
    if (hour < 11) return 'Selamat pagi';
    if (hour < 15) return 'Selamat siang';
    if (hour < 19) return 'Selamat sore';
    return 'Selamat malam';
  }
}
