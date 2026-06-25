'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { LogIn } from 'lucide-react';

export default function LoginPage() {
  const { login, rememberEmail } = useAuth();
  const [email, setEmail] = useState(rememberEmail);
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(!!rememberEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { user, mustChangePassword } = await login(email, password, remember);
      toast.success('Login successful');
      if (mustChangePassword) {
        router.push('/change-password');
      } else if (user.role === 'super_admin') {
        router.push('/admin/dashboard');
      } else if (user.role === 'department') {
        router.push('/department/dashboard');
      } else if (user.role === 'customer') {
        router.push('/customer/dashboard');
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Login failed';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-navy-950 bg-grid-glow px-4 py-8 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-navy-950/30 via-transparent to-navy-950/60 pointer-events-none" />
      <div className="relative w-full max-w-md">
        <div className="bg-navy-900/80 backdrop-blur-xl rounded-2xl shadow-2xl shadow-navy-950/50 border border-navy-700/40 p-6 sm:p-8">
          <div className="text-center mb-8">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/30">
              <LogIn className="w-6 h-6 sm:w-8 sm:h-8 text-navy-950" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">CA Consultancy Portal</h1>
            <p className="text-sm text-navy-300 mt-1">Sign in to your account</p>
          </div>

          {error && (
            <div className="mb-4 p-3.5 bg-red-950/50 border border-red-800/50 text-red-300 text-sm rounded-xl flex items-start gap-2">
              <span className="font-semibold shrink-0 bg-red-900/60 rounded px-1.5 py-0.5 text-xs text-red-200">Error</span>
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-navy-200 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-navy-800/50 border border-navy-600 rounded-xl focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 outline-none text-sm text-white placeholder-navy-400 transition-all"
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-200 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-navy-800/50 border border-navy-600 rounded-xl focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 outline-none text-sm text-white placeholder-navy-400 transition-all"
                placeholder="••••••••"
                required
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                id="remember"
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="w-4 h-4 rounded border-navy-600 bg-navy-800/50 text-amber-500 focus:ring-amber-500/50"
              />
              <label htmlFor="remember" className="text-sm text-navy-300 cursor-pointer select-none">Remember me</label>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-400 text-navy-950 rounded-xl font-semibold hover:from-amber-400 hover:to-amber-300 disabled:opacity-50 transition-all shadow-lg shadow-amber-500/25 active:scale-[0.98]"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
