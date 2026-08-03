import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/context/AuthContext';
import { Wallet, Loader2, Eye, EyeOff, Sparkles, Shield } from 'lucide-react';
import { loginSchema } from '@/validations/authSchema';
import { inputClassFor } from '@/components/ui/form';

export default function Login() {
  const { login } = useAuth();
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
  });

  const handleFormSubmit = handleSubmit(async (values) => {
    setError('');
    try {
      await login(values.email, values.password);
    } catch (err) {
      setError(err?.response?.data?.message || 'Invalid credentials');
    }
  });

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-950">
      {/* Left — Brand Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, white 1px, transparent 1px),
                            radial-gradient(circle at 75% 75%, white 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }} />
        <div className="absolute top-20 -left-20 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col justify-center px-16">
          <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center mb-8 border border-white/10">
            <Wallet className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Enterprise<br />Expense Management
          </h1>
          <p className="text-lg text-white/70 leading-relaxed max-w-md">
            Streamline your organization's expense tracking, approvals, and reporting all in one place.
          </p>
          <div className="flex items-center gap-6 mt-10">
            <div className="flex items-center gap-2 text-white/60 text-sm">
              <Shield className="h-4 w-4" />
              <span>Enterprise Grade</span>
            </div>
            <div className="flex items-center gap-2 text-white/60 text-sm">
              <Sparkles className="h-4 w-4" />
              <span>AI Powered</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right — Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-sm animate-fade-in">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex w-14 h-14 rounded-2xl gradient-brand items-center justify-center mb-4 shadow-lg shadow-indigo-500/20">
              <Wallet className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">ExpensePro</h1>
            <p className="text-sm text-gray-400 mt-1">Sign in to your account</p>
          </div>

          <form noValidate onSubmit={handleFormSubmit} className="space-y-5">
            <div className="text-center lg:text-left">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Welcome back</h2>
              <p className="text-sm text-gray-400 mt-1">Enter your credentials to continue</p>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800/30 flex items-start gap-2.5 animate-scale-in">
                <div className="w-5 h-5 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-red-500 text-[10px] font-bold">!</span>
                </div>
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email address</label>
              <input
                type="email"
                {...register('email')}
                placeholder="name@company.com"
                className={inputClassFor(!!errors.email)}
              />
              {errors.email && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                <button type="button" className="text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  {...register('password')}
                  placeholder="Enter your password"
                  className={`${inputClassFor(!!errors.password)} pr-11`}
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 gradient-brand hover:opacity-90 disabled:opacity-60 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2.5"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100 dark:border-gray-800" /></div>
              <div className="relative flex justify-center"><span className="px-3 text-xs text-gray-400 bg-white dark:bg-gray-900">Demo Credentials</span></div>
            </div>

            <div className="space-y-2">
              {[
                { role: 'Super Admin', email: 'superadmin@kingsgroup.com' },
                { role: 'CFO', email: 'cfo@kingsgroup.com' },
              ].map(({ role, email: e }) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => { setValue('email', e); setValue('password', 'Admin@123'); }}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left group"
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{role[0]}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{role}</p>
                    <p className="text-xs text-gray-400">{e}</p>
                  </div>
                </button>
              ))}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
