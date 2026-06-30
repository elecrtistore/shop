import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminMode, setAdminMode] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password, adminMode ? adminCode : undefined);
      navigate('/shop');
    } catch (err: any) {
      const message =
        err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential'
          ? 'Invalid email or password.'
          : err.code === 'auth/invalid-email'
            ? 'Please enter a valid email address.'
            : err.message || 'Login failed. Please try again.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-14 sm:px-6">
      <div className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-white via-orange-50 to-slate-100 p-8 shadow-soft ring-1 ring-slate-200/70">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-semibold text-charcoal">Sign in</h1>
          <p className="mt-2 text-sm text-slate-600">Use your email and password to access the shop.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            {error && (
              <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
            )}

            <label className="block">
              <span className="text-sm font-medium text-slate-700">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-charcoal outline-none focus:border-primary"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-charcoal outline-none focus:border-primary"
              />
            </label>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="admin-toggle" checked={adminMode} onChange={(e) => setAdminMode(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-primary" />
              <label htmlFor="admin-toggle" className="text-sm text-slate-600">Sign in as admin</label>
            </div>

            {adminMode && (
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Admin code</span>
                <input
                  type="password"
                  value={adminCode}
                  onChange={(e) => setAdminCode(e.target.value)}
                  required
                  className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-charcoal outline-none focus:border-primary"
                />
              </label>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-[1.25rem] bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-50"
            >
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>

            <p className="text-center text-sm text-slate-600">
              Don't have an account?{' '}
              <Link to="/signup" className="font-semibold text-primary">Sign up</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
