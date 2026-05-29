import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, Mail, Shield, ArrowRight, Loader2 } from 'lucide-react';

export function Login({ onLogin, showToast }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setEmail('admin@enterprise-pos.com');
    setPassword('admin123');
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      if (window.electronAPI) {
        const result = await window.electronAPI.login({ email, password, deviceId: 'demo' });
        if (result.success) { onLogin(result.user); return; }
        else { setError(result.message || 'Invalid credentials'); }
      } else {
        if (email === 'admin@enterprise-pos.com' && password === 'admin123') {
          const demoUser = { id: '1', email, firstName: 'System', lastName: 'Administrator', role: 'Super Admin', permissions: ['*'] };
          localStorage.setItem('user', JSON.stringify(demoUser));
          onLogin(demoUser);
        } else { setError('Invalid credentials'); }
      }
    } catch (err) { setError('Login failed.'); }
    finally { setIsLoading(false); }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-red-500 via-rose-600 to-purple-700 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/30 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center"><span className="text-3xl">🏪</span></div>
            <div><h1 className="text-3xl font-bold text-white">Enterprise POS</h1><p className="text-white/70">Business Management System</p></div>
          </div>
        </div>
        <div className="relative z-10 space-y-8">
          <h2 className="text-4xl font-bold text-white leading-tight">Next-Generation<br />Retail Management</h2>
          <p className="text-lg text-white/80 max-w-md">Complete solution for modern retail, restaurants, and wholesale businesses.</p>
          <div className="grid grid-cols-2 gap-4">
            {[{ icon: '⚡', label: 'Lightning Fast' }, { icon: '🔒', label: 'Secure Data' }, { icon: '📊', label: 'Analytics' }, { icon: '🌐', label: 'Multi-Branch' }].map((f, i) => (
              <div key={i} className="flex items-center gap-3 bg-white/10 backdrop-blur-xl rounded-xl px-4 py-3"><span className="text-2xl">{f.icon}</span><span className="text-white font-medium">{f.label}</span></div>
            ))}
          </div>
        </div>
        <div className="relative z-10 flex items-center gap-4 text-white/60 text-sm"><Shield className="w-4 h-4" /><span>Enterprise-grade security</span></div>
      </div>
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center"><span className="text-2xl">🏪</span></div>
            <div><h1 className="text-xl font-bold text-gray-900">Enterprise POS</h1><p className="text-xs text-gray-500">Business Management System</p></div>
          </div>
          <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-8">
            <div className="text-center mb-8"><h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2><p className="text-gray-500 mt-1">Sign in to continue</p></div>
            {error && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</motion.div>}
            <form onSubmit={handleLogin} className="space-y-5">
              <div><label className="label">Email Address</label><div className="relative"><Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input pl-12" placeholder="Enter your email" required /></div></div>
              <div><label className="label">Password</label><div className="relative"><Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="input pl-12 pr-12" placeholder="Enter your password" required /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">{showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button></div></div>
              <div className="flex items-center justify-between"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" className="checkbox" /><span className="text-sm text-gray-600">Remember me</span></label></div>
              <button type="submit" disabled={isLoading} className="btn-primary w-full py-3 text-base">{isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><span>Sign In</span><ArrowRight className="w-5 h-5" /></>}</button>
            </form>
            <div className="mt-6 p-4 bg-gray-50 rounded-xl"><p className="text-xs text-gray-500 text-center mb-2">Demo Credentials</p><div className="grid grid-cols-2 gap-2 text-xs"><div className="bg-white p-2 rounded-lg"><span className="text-gray-500">Email:</span><span className="ml-1 text-gray-900">admin@enterprise-pos.com</span></div><div className="bg-white p-2 rounded-lg"><span className="text-gray-500">Password:</span><span className="ml-1 text-gray-900">admin123</span></div></div></div>
          </div>
          <p className="text-center text-sm text-gray-500 mt-6">Enterprise POS ERP v1.0.0</p>
        </motion.div>
      </div>
    </div>
  );
}

export function Splash() {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-red-500 via-rose-600 to-purple-700 flex flex-col items-center justify-center">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
        <div className="w-24 h-24 bg-white/20 backdrop-blur-xl rounded-3xl flex items-center justify-center mb-6 mx-auto shadow-2xl"><span className="text-5xl">🏪</span></div>
        <h1 className="text-4xl font-bold text-white mb-2">Enterprise POS</h1>
        <p className="text-white/70 text-lg">Loading application...</p>
      </motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-8">
        <div className="w-48 h-1 bg-white/20 rounded-full overflow-hidden"><motion.div initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: 1.5, ease: 'easeInOut' }} className="h-full bg-white rounded-full" /></div>
      </motion.div>
    </div>
  );
}

export default Login;
