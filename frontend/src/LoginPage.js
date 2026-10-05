import React, { useState } from 'react';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail
} from './firebase';

// Generate or retrieve a persistent sw-prefixed ID for this user
const getOrCreateSwId = (uid) => {
  const storageKey = `swId_${uid || 'anon'}`;
  const existing = localStorage.getItem(storageKey);
  if (existing) return existing;
  const newId = 'sw' + Math.floor(10000 + Math.random() * 90000);
  localStorage.setItem(storageKey, newId);
  return newId;
};

export default function LoginPage({ onLogin, showToast }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password.trim()) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    setLoading(true);
    try {
      if (auth) {
        if (isSignUp) {
          const userCred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
          const user = {
            uid: userCred.user.uid,
            email: userCred.user.email,
            name: name.trim() || userCred.user.email.split('@')[0],
            swId: getOrCreateSwId(userCred.user.uid),
            provider: 'email'
          };
          showToast(`Account created! Welcome, ${user.name}`, 'success');
          onLogin(user);
        } else {
          const userCred = await signInWithEmailAndPassword(auth, cleanEmail, password);
          const user = {
            uid: userCred.user.uid,
            email: userCred.user.email,
            name: userCred.user.displayName || userCred.user.email.split('@')[0],
            swId: getOrCreateSwId(userCred.user.uid),
            provider: 'email'
          };
          showToast(`Welcome back, ${user.name}!`, 'success');
          onLogin(user);
        }
      } else {
        // Fallback demo login
        const user = {
          email: cleanEmail,
          name: name.trim() || cleanEmail.split('@')[0],
          swId: getOrCreateSwId(cleanEmail),
          provider: 'email'
        };
        showToast(`Welcome back, ${user.name}!`, 'success');
        onLogin(user);
      }
    } catch (err) {
      console.error('Auth error:', err);
      showToast(err.message ? err.message.replace('Firebase: ', '') : 'Authentication failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      showToast('Please enter your email address first', 'warn');
      return;
    }
    try {
      if (auth) {
        await sendPasswordResetEmail(auth, cleanEmail);
        showToast(`Password reset email sent to ${cleanEmail}`, 'success');
      } else {
        showToast(`Password reset link sent to ${cleanEmail}`, 'success');
      }
    } catch (err) {
      showToast(err.message ? err.message.replace('Firebase: ', '') : 'Could not send reset email', 'error');
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      if (auth && googleProvider) {
        const result = await signInWithPopup(auth, googleProvider);
        const user = {
          uid: result.user.uid,
          email: result.user.email,
          name: result.user.displayName || 'Google User',
          swId: getOrCreateSwId(result.user.uid),
          provider: 'google'
        };
        showToast(`Signed in as ${user.name}!`, 'success');
        onLogin(user);
      } else {
        const user = { email: 'google.user@example.com', name: 'Google User', swId: getOrCreateSwId('google-demo'), provider: 'google' };
        showToast('Signed in with Google!', 'success');
        onLogin(user);
      }
    } catch (err) {
      console.error('Google Auth Error:', err);
      showToast(err.message ? err.message.replace('Firebase: ', '') : 'Google sign in failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAppleLogin = () => {
    const user = { email: 'apple.user@example.com', name: 'Apple User', swId: getOrCreateSwId('apple-demo'), provider: 'apple' };
    showToast('Signed in with Apple!', 'success');
    onLogin(user);
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        {/* Logo & Brand */}
        <div className="login-brand">
          <div className="login-logo-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </div>
          <span className="login-brand-name">Story Weaver</span>
        </div>

        {/* Heading */}
        <div className="login-header">
          <h2>{isSignUp ? 'Create your account' : 'Sign in to your account'}</h2>
          <p>{isSignUp ? 'Join our community of collaborative storytellers.' : 'Welcome back! Please enter your details.'}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="login-form">
          {isSignUp && (
            <div className="form-group">
              <label htmlFor="login-name">Full Name</label>
              <input
                id="login-name"
                type="text"
                placeholder="Alex Mercer"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <div className="label-row">
              <label htmlFor="login-password">Password</label>
              {!isSignUp && (
                <button
                  type="button"
                  className="forgot-link"
                  onClick={handleForgotPassword}
                >
                  Forgot?
                </button>
              )}
            </div>
            <div className="password-input-wrap">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <button type="submit" className="login-submit-btn">
            {isSignUp ? 'Create Account' : 'Sign in'}
          </button>
        </form>

        {/* Divider */}
        <div className="login-divider">
          <span>OR</span>
        </div>

        {/* Social Buttons */}
        <div className="social-buttons">
          <button type="button" className="social-btn" onClick={handleGoogleLogin}>
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.28v3.15C3.25 21.3 7.31 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.28C.46 8.2.01 10.05.01 12c0 1.95.45 3.8 1.27 5.42l4-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.28 6.58l4 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
            </svg>
            <span>Continue with Google</span>
          </button>

          <button type="button" className="social-btn" onClick={handleAppleLogin}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.85c.66-.8 1.11-1.92.99-3.04-.96.04-2.13.64-2.81 1.44-.61.71-1.14 1.86-1 2.96 1.08.08 2.17-.55 2.82-1.36z"/>
            </svg>
            <span>Continue with Apple</span>
          </button>
        </div>

        {/* Footer toggle */}
        <div className="login-footer">
          {isSignUp ? (
            <p>Already have an account? <button type="button" onClick={() => setIsSignUp(false)}>Sign in</button></p>
          ) : (
            <p>Don't have an account? <button type="button" onClick={() => setIsSignUp(true)}>Sign up</button></p>
          )}
        </div>
      </div>
    </div>
  );
}
