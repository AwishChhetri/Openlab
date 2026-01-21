import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

export const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const passwordMismatch = useMemo(() => {
    if (!password || !confirmPassword) return false;
    return password !== confirmPassword;
  }, [password, confirmPassword]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (passwordMismatch) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await api.post(
        '/api/auth/register',
        { name, email, password }
      );
      // Full reload so AuthProvider re-checks /me with the new session
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.response?.data?.error || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/30 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-[32px] border border-slate-100 p-12 shadow-xl shadow-slate-200/50">
        <h1 className="text-[40px] font-black text-center text-slate-900 mb-10 leading-tight">
          Sign up
        </h1>

        <div className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-[14px] text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <input
              type="text"
              placeholder="Full name"
              className="w-full px-5 py-4 bg-slate-50/50 border border-slate-100 rounded-[14px] focus:outline-none focus:ring-2 focus:ring-[#00A854]/20 focus:border-[#00A854] transition-all"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <input
              type="email"
              placeholder="Email ID"
              className="w-full px-5 py-4 bg-slate-50/50 border border-slate-100 rounded-[14px] focus:outline-none focus:ring-2 focus:ring-[#00A854]/20 focus:border-[#00A854] transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              className="w-full px-5 py-4 bg-slate-50/50 border border-slate-100 rounded-[14px] focus:outline-none focus:ring-2 focus:ring-[#00A854]/20 focus:border-[#00A854] transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Confirm password"
              className="w-full px-5 py-4 bg-slate-50/50 border border-slate-100 rounded-[14px] focus:outline-none focus:ring-2 focus:ring-[#00A854]/20 focus:border-[#00A854] transition-all"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            {passwordMismatch && (
              <div className="text-xs text-red-600 px-1">
                Passwords do not match
              </div>
            )}

            <button
              type="submit"
              disabled={loading || passwordMismatch}
              className="w-full py-4 bg-[#00A854] text-white rounded-[14px] font-bold text-lg hover:bg-[#009249] transition-all shadow-lg shadow-[#00A854]/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <div className="text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-semibold text-[#00A854] hover:text-[#009249] transition-colors"
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

