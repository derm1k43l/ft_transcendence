import { findUserByUsername, findUserByEmail, createUser } from '../data/UserService.js';
import { NotificationManager } from '../components/Notification.js';
import { UserProfile } from '../data/Types.js';
import { RegisterView } from './RegisterGoogle.js';
import { Router } from '../core/router.js';

export function GoogleSignIn(router: Router): void {
    const clientId = '406190102218-vpg8m13r4sgij2ffjmjvevqtq7d8smvc.apps.googleusercontent.com';
    const redirectUri = 'http://localhost:8080/auth/google/callback'; // Must match the redirect URI in Google Cloud Console
    const scope = 'openid email profile';
    const responseType = 'token'; // Or 'code' for server-side exchange
    const state = 'random_state_string'; // Optional: Use this to prevent CSRF attacks

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${encodeURIComponent(clientId)}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=${encodeURIComponent(responseType)}` +
        `&scope=${encodeURIComponent(scope)}` +
        `&state=${encodeURIComponent(state)}`;

    console.log('Opening Google login popup:', authUrl);

    // Open the Google login page in a new popup window
    const popup = window.open(
        authUrl,
        'google-login',
        'width=500,height=600,scrollbars=yes'
    );

    // Poll the popup window to check if it has redirected back to the redirect URI
    const interval = setInterval(() => {
        if (!popup || popup.closed) {
            clearInterval(interval);
            console.log('Popup closed by user.');
            return;
        }

        let profile: UserProfile | undefined;

        try {
            // Check if the popup has redirected to the redirect URI
            if (popup.location.href.startsWith(redirectUri)) {
                const hash = popup.location.hash.substring(1); // Get the URL fragment
                const params = new URLSearchParams(hash);

                const accessToken = params.get('access_token');
                if (accessToken) {
                    console.log('Access Token:', accessToken);
                    profile = fetchGoogleUserProfile(accessToken, router);
                } else {
                    console.error('No access token found in the URL.');
                }

                // Close the popup
                popup.close();
                clearInterval(interval);
            }
        } catch (error) {
            // Ignore cross-origin errors until the popup redirects to the same origin
        }
    }, 500);
}

function fetchGoogleUserProfile(accessToken: string, router: Router): UserProfile | undefined {
    fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    })
        .then((response) => response.json())
        .then((userInfo) => {
            console.log('User Info:', userInfo);
            NotificationManager.show({
                title: 'Welcome',
                message: userInfo,
                type: 'success',
                duration: 3000
            });
            if (findUserByEmail(userInfo.email)) {
                console.log('Google User already exists:', userInfo.email);
                return findUserByEmail(userInfo.email);
            }
            let loginFormContainer: HTMLElement | null;
            loginFormContainer = document.querySelector('.login-form-container');
            if (loginFormContainer) {
                // Create and render register view
                const registerView = new RegisterView(router, userInfo.email);

                // Hide login form elements first
                const loginFormElements = loginFormContainer.querySelectorAll(':not(.register-view)');
                loginFormElements.forEach(el => {
                    (el as HTMLElement).style.display = 'none';
                });

                // Render register view
                registerView.render(loginFormContainer);
            }
        })
        .catch((error) => {
            console.error('Error fetching user info:', error);
        });
    return undefined;
}
