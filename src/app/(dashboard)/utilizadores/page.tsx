'use client';

import { useEffect, useState } from 'react';
import { apiFetch, apiFetchPaginated } from '@/lib/api';
import { Plus, Ban, ShieldCheck } from 'lucide-react';

interface Usuario {
  id: string;
  nome: string;
  email: string;
  papel: 'ADMINISTRADOR' | 'GERENTE';
  estado: 'ATIVO' | 'INATIVO';
  createdAt: string;
}

export default function UtilizadoresPage() {
  const [utilizadores, setUtilizadores] = useState<Usuario[]>([]);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);

  const [modalAberto, setModalAberto] = useState(false);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [papel, setPapel] = useState<'ADMINISTRADOR' | 'GERENTE'>('GERENTE');
  const [guardando, setGuardando] = useState(false);
  const [erroModal, setErroModal] = useState('');

  async function carregar() {
    try {
      setCarregando(true);
      const resultado = await apiFetchPaginated<Usuario>('/users');
      setUtilizadores(resultado);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao carregar utilizadores.');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  function abrirModal() {
    setNome('');
    setEmail('');
    setPassword('');
    setPapel('GERENTE');
    setErroModal('');
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
  }

  async function handleCriar(e: React.FormEvent) {
    e.preventDefault();
    setErroModal('');
    setGuardando(true);

    try {
      await apiFetch('/users', {
        method: 'POST',
        body: JSON.stringify({ nome, email, password, papel }),
      });
      fecharModal();
      carregar();
    } catch (err) {
      setErroModal(err instanceof Error ? err.message : 'Erro ao criar utilizador.');
    } finally {
      setGuardando(false);
    }
  }

  async function desativar(id: string) {
    if (!confirm('Desativar este utilizador?')) return;
    try {
      await apiFetch(`/users/${id}/deactivate`, { method: 'PATCH' });
      carregar();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao desativar.');
    }
  }

  if (carregando) return <p className="text-gray-500">A carregar...</p>;
  if (erro) return <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">{erro}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Utilizadores</h1>
        <button
          onClick={abrirModal}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition"
        >
          <Plus className="w-4 h-4" /> Novo Utilizador
        </button>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Nome</th>
              <th className="text-left px-4 py-3">Email</th>
              <th className="text-left px-4 py-3">Papel</th>
              <th className="text-left px-4 py-3">Estado</th>
              <th className="text-right px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {utilizadores.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  Nenhum utilizador cadastrado ainda.
                </td>
              </tr>
            )}
            {utilizadores.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{u.nome}</td>
                <td className="px-4 py-3 text-gray-500">{u.email}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium inline-flex items-center gap-1 ${
                      u.papel === 'ADMINISTRADOR'
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {u.papel === 'ADMINISTRADOR' && <ShieldCheck className="w-3 h-3" />}
                    {u.papel}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      u.estado === 'ATIVO' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {u.estado}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    {u.estado === 'ATIVO' && (
                      <button
                        onClick={() => desativar(u.id)}
                        className="p-1.5 rounded hover:bg-red-50 text-red-500"
                        title="Desativar"
                      >
                        <Ban className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalAberto && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Novo Utilizador</h2>

            {erroModal && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                {erroModal}
              </div>
            )}

            <form onSubmit={handleCriar} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Nome *
                </label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Password * (mínimo 8 caracteres)
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Papel *
                </label>
                <select
                  value={papel}
                  onChange={(e) => setPapel(e.target.value as 'ADMINISTRADOR' | 'GERENTE')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="GERENTE">Gerente</option>
                  <option value="ADMINISTRADOR">Administrador</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={fecharModal}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
                >
                  {guardando ? 'A guardar...' : 'Criar Utilizador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
