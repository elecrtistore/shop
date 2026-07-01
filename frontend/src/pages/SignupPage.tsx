import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserPlus, Mail, Lock, User, Shield, ChevronDown, Eye, EyeOff } from 'lucide-react';

function SignupPage() {
  const { signupWithRole } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ displayName: '', email: '', password: '', role: 'Buyer' as 'Buyer' | 'Admin', adminCode: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSubmitting(true);
    try {
      await signupWithRole(form.email, form.password, form.role, form.role === 'Admin' ? form.adminCode : undefined, form.displayName);
      navigate('/shop');
    } catch (err: any) {
      setError(err.message || 'Signup failed.');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="pt-24 min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <UserPlus size={24} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-charcoal">Create account</h1>
          <p className="mt-2 text-sm text-soft">Join ElectriShop to start inquiring.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <div className="rounded-xl bg-red-50 border border-red-200 px-5 py-3 text-sm text-red-600">{error}</div>}

          <div>
            <label className="text-sm font-medium text-charcoal">Full Name</label>
            <div className="relative mt-2">
              <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-soft" />
              <input value={form.displayName} onChange={(e) => setForm((p) => ({ ...p, displayName: e.target.value }))} required
                className="w-full rounded-xl border border-border bg-white pl-10 pr-4 py-3 text-sm outline-none focus:border-primary transition" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-charcoal">Email</label>
            <div className="relative mt-2">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-soft" />
              <input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} required
                className="w-full rounded-xl border border-border bg-white pl-10 pr-4 py-3 text-sm outline-none focus:border-primary transition" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-charcoal">Password</label>
            <div className="relative mt-2">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-soft" />
              <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} required
                className="w-full rounded-xl border border-border bg-white pl-10 pr-10 py-3 text-sm outline-none focus:border-primary transition" />
              <button type="button" onClick={() => setShowPassword((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-soft hover:text-charcoal transition">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-charcoal">Role</label>
            <div className="relative mt-2">
              <select value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value as 'Buyer' | 'Admin' }))}
                className="w-full appearance-none cursor-pointer rounded-xl border border-border bg-white px-4 py-3 pr-10 text-sm outline-none transition focus:border-primary">
                <option value="Buyer">Buyer</option>
                <option value="Admin">Admin</option>
              </select>
              <ChevronDown size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-soft" />
            </div>
          </div>

          {form.role === 'Admin' && (
            <div>
              <label className="text-sm font-medium text-charcoal">Admin code</label>
              <div className="relative mt-2">
                <Shield size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-soft" />
                <input type="password" value={form.adminCode} onChange={(e) => setForm((p) => ({ ...p, adminCode: e.target.value }))} required
                  className="w-full rounded-xl border border-border bg-white pl-10 pr-4 py-3 text-sm outline-none focus:border-primary transition" />
              </div>
            </div>
          )}

          <button type="submit" disabled={submitting}
            className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-white hover:bg-primary-hover transition disabled:opacity-50">
            {submitting ? 'Creating account...' : 'Create account'}
          </button>

          <p className="text-center text-sm text-soft">
            Already have an account? <Link to="/login" className="font-semibold text-primary hover:text-primary-hover">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default SignupPage;
