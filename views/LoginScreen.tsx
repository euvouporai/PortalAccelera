
import React, { useState, useEffect } from 'react';
import { User, Lock, Eye, EyeOff, AlertCircle, Loader2, Check } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useToast, Logo } from '../components/UI';

export default function LoginScreen() {
  const { dispatch, supabase } = useAppContext();
  const { addToast } = useToast();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const savedUser = localStorage.getItem('accelera_remember_user');
    const savedPass = localStorage.getItem('accelera_remember_pass');
    if (savedUser) {
      setUsername(savedUser);
      if (savedPass) setPassword(savedPass);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      let userData = null;

      // 1. Acesso Mestre Hardcoded (Segurança extra)
      if (username === 'admin' && password === 'admin') {
        userData = { 
          id: '00000000-0000-0000-0000-000000000000', 
          profileId: 'master-admin',
          name: 'Administrador', 
          role: 'Administrador',
          needsPasswordChange: false
        };
      } 
      else if (username === 'andre.silva@accelera.com.br' && password === 'Musica5581*22') {
        userData = { 
          id: '00000000-0000-0000-0000-000000000000', 
          profileId: 'andre-silva',
          name: 'André Silva', 
          role: 'Administrador',
          needsPasswordChange: false
        };
      }
      // 2. Acesso via Banco
      else {
        const { data, error: dbError } = await supabase
          .from('usuarios_acesso')
          .select('*')
          .eq('login', username)
          .eq('senha', password)
          .maybeSingle();

        if (dbError) throw new Error("Falha na conexão com o banco.");
        if (!data) throw new Error("Usuário ou senha incorretos.");

        userData = { 
          id: data.user_id || '00000000-0000-0000-0000-000000000000',
          profileId: data.id,
          name: data.nome, 
          role: data.role || 'Usuário',
          needsPasswordChange: !!data.primeiro_acesso
        };
      }

      if (rememberMe) {
        localStorage.setItem('accelera_remember_user', username);
        localStorage.setItem('accelera_remember_pass', password);
      } else {
        localStorage.removeItem('accelera_remember_user');
        localStorage.removeItem('accelera_remember_pass');
      }

      dispatch({ type: 'LOGIN', payload: userData });
      if (!userData.needsPasswordChange) {
        addToast(`Bem-vindo, ${userData.name}!`);
      }

    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0f172a] p-4 selection:bg-blue-500/30">
      <div className="w-full max-w-md relative z-10">
        <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/10">
          <div className="p-8 md:p-12 text-center">
            <Logo className="h-16 mb-8 mx-auto" />
            <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight uppercase mb-8">Acesso ao Portal</h1>

            <form onSubmit={handleLogin} className="space-y-5 text-left">
              {error && (
                <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-center text-red-700 text-sm animate-fade-in font-medium">
                  <AlertCircle className="h-4 w-4 mr-2 shrink-0" />
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Usuário</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input type="text" required value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl py-4 pl-12 pr-4 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input type={showPassword ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl py-4 pl-12 pr-12 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 p-1">
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <label className="flex items-center group cursor-pointer select-none">
                <input type="checkbox" checked={rememberMe} onChange={() => setRememberMe(!rememberMe)} className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <span className="ml-2.5 text-xs font-bold text-gray-500 uppercase">Lembrar acesso</span>
              </label>

              <button type="submit" disabled={isLoading} className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 uppercase tracking-widest text-sm">
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Entrar"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
