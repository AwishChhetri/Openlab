import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

export const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleGoogleLogin = () => {
        window.location.href = 'http://localhost:3000/api/auth/google';
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await axios.post('http://localhost:3000/api/auth/login',
                { email, password },
                { withCredentials: true }
            );
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/30 flex items-center justify-center p-6">
            <div className="w-full max-w-md bg-white rounded-[32px] border border-slate-100 p-12 shadow-xl shadow-slate-200/50">
                <h1 className="text-[40px] font-black text-center text-slate-900 mb-10 leading-tight">
                    Login
                </h1>

                <div className="space-y-6">
                    <button
                        onClick={handleGoogleLogin}
                        className="w-full flex items-center justify-center gap-3 py-4 bg-[#E9F7F0] border-none rounded-[14px] font-semibold text-slate-700 hover:bg-[#DCF2E7] transition-all"
                    >
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                        Login with Google
                    </button>

                    <div className="relative flex items-center justify-center">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-slate-100"></span>
                        </div>
                        <span className="relative bg-white px-4 text-xs font-medium text-slate-400">
                            or sign up through email
                        </span>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-[14px] text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4">
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
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-[#00A854] text-white rounded-[14px] font-bold text-lg hover:bg-[#009249] transition-all shadow-lg shadow-[#00A854]/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Logging in...' : 'Login'}
                        </button>
                    </form>

                    <div className="text-center text-sm text-slate-500">
                        Don&apos;t have an account?{' '}
                        <Link
                            to="/signup"
                            className="font-semibold text-[#00A854] hover:text-[#009249] transition-colors"
                        >
                            Sign up
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};
