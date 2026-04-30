import { useState } from 'react';
import { FileText } from 'lucide-react';
import { signInWithEmailPassword } from '../services/firebaseAuth';
import { LoadingSpinner } from './LoadingSpinner';

export default function LoginView() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await signInWithEmailPassword(email.trim(), password);
    } catch (err) {
      setError(err?.message || 'Sign-in failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-overlay">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="auth-brand">
          <div className="auth-logo"><FileText size={20} /></div>
          <div>
            <h2>Foster Media Network - Billing</h2>
            <p>Sign in to your account</p>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input
            type="email"
            className="form-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Password</label>
          <input
            type="password"
            className="form-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>
        {error && <p className="auth-error">{error}</p>}
        <button className="btn btn-primary auth-submit" disabled={busy} type="submit">
          {busy ? <><LoadingSpinner size="sm" /> Signing in...</> : 'Sign In'}
        </button>
      </form>
    </div>
  );
}
