import { applyProviderConfig, initOAuthButtons, redirectIfSignedIn } from '../ui.js';

redirectIfSignedIn();
applyProviderConfig();
initOAuthButtons(document.getElementById('alert'));
