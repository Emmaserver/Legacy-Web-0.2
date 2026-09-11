'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { Boxes } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@legacy.com');
  const [password, setPassword] = useState('Admin@123');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    try {
      const data = await apiFetch<{ accessToken: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      localStorage.setItem('token', data.accessToken);
      router.push('/dashboard');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErro(err.message || 'Falha ao autenticar. Verifique as credenciais.');
      } else {
        setErro('Falha ao autenticar. Verifique as credenciais.');
      }
    } finally {
      setCarregando(false);
    }
  };

return (
  <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 flex items-center justify-center p-4">
    <div className="max-w-md w-full space-y-6">
      <div className="text-center space-y-3">
        <div className="w-14 h-14 mx-auto rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-900/50">
          <Boxes className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Gestão &amp; Vendas</h1>
          <p className="text-sm text-slate-400 mt-1">Plataforma Legacy</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-2xl p-8 space-y-6">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-slate-900">Iniciar Sessão</h2>
          <p className="text-sm text-gray-500 mt-1">Introduza os seus dados para aceder ao sistema</p>
        </div>

        {erro && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
            {erro}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Palavra-passe</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={carregando}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-sm transition shadow disabled:opacity-50 cursor-pointer"
          >
            {carregando ? 'A iniciar sessão...' : 'Entrar no Sistema'}
          </button>
        </form>
      </div>
    </div>
  </div>
);
}