import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, Mail, Lock, Shield, Eye, EyeOff } from 'lucide-react';

function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminMode, setAdminMode] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSubmitting(true);
    try {
      await login(email, password, adminMode ? adminCode : undefined);
      navigate('/shop');
    } catch (err: any) {
      const msg = err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential'
        ? 'Invalid email or password.' : err.code === 'auth/invalid-email' ? 'Invalid email address.' : err.message || 'Login failed.';
      setError(msg);
    } finally { setSubmitting(false); }
  };

  return (
    <div className="pt-24 min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <LogIn size={24} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-charcoal">Sign in</h1>
          <p className="mt-2 text-sm text-soft">Welcome back to ElectriShop.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <div className="rounded-xl bg-red-50 border border-red-200 px-5 py-3 text-sm text-red-600">{error}</div>}

          <div>
            <label className="text-sm font-medium text-charcoal">Email</label>
            <div className="relative mt-2">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-soft" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="w-full rounded-xl border border-border bg-white pl-10 pr-4 py-3 text-sm outline-none focus:border-primary transition" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-charcoal">Password</label>
            <div className="relative mt-2">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-soft" />
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required
                className="w-full rounded-xl border border-border bg-white pl-10 pr-10 py-3 text-sm outline-none focus:border-primary transition" />
              <button type="button" onClick={() => setShowPassword((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-soft hover:text-charcoal transition">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-soft cursor-pointer">
            <input type="checkbox" checked={adminMode} onChange={(e) => setAdminMode(e.target.checked)} className="rounded border-border text-primary" />
            Sign in as admin
          </label>

          {adminMode && (
            <div>
              <label className="text-sm font-medium text-charcoal">Admin code</label>
              <div className="relative mt-2">
                <Shield size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-soft" />
                <input type="password" value={adminCode} onChange={(e) => setAdminCode(e.target.value)} required
                  className="w-full rounded-xl border border-border bg-white pl-10 pr-4 py-3 text-sm outline-none focus:border-primary transition" />
              </div>
            </div>
          )}

          <button type="submit" disabled={submitting}
            className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-white hover:bg-primary-hover transition disabled:opacity-50">
            {submitting ? 'Signing in...' : 'Sign in'}
          </button>

          <p className="text-center text-sm text-soft">
            Don't have an account? <Link to="/signup" className="font-semibold text-primary hover:text-primary-hover">Sign up</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
