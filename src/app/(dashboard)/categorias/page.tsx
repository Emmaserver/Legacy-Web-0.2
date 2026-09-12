'use client';

import { useEffect, useState } from 'react';
import { apiFetch, apiFetchPaginated } from '@/lib/api';
import { Plus, Ban } from 'lucide-react';

interface RespostaPaginada<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface Categoria {
  id: string;
  nome: string;
  estado: 'ATIVO' | 'INATIVO';
}

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);

  const [modalAberto, setModalAberto] = useState(false);
  const [nomeNovo, setNomeNovo] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [erroModal, setErroModal] = useState('');

  async function carregar() {
    try {
      setCarregando(true);
      const resultado = await apiFetch<RespostaPaginada<Categoria>>('/categories');
      setCategorias(resultado.data);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao carregar categorias.');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  function abrirModal() {
    setNomeNovo('');
    setErroModal('');
    setModalAberto(true);
  }

  async function handleCriar(e: React.FormEvent) {
    e.preventDefault();
    setErroModal('');
    setGuardando(true);

    try {
      await apiFetch('/categories', {
        method: 'POST',
        body: JSON.stringify({ nome: nomeNovo }),
      });
      setModalAberto(false);
      carregar();
    } catch (err) {
      setErroModal(err instanceof Error ? err.message : 'Erro ao criar categoria.');
    } finally {
      setGuardando(false);
    }
  }

  async function desativar(id: string) {
    if (!confirm('Desativar esta categoria?')) return;
    try {
      await apiFetch(`/categories/${id}/deactivate`, { method: 'PATCH' });
      carregar();
    } catch (err) {
      // A API recusa (409) se houver produtos associados a esta categoria
      alert(err instanceof Error ? err.message : 'Erro ao desativar.');
    }
  }

  if (carregando) return <p className="text-gray-500">A carregar...</p>;
  if (erro) return <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">{erro}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Categorias</h1>
        <button
          onClick={abrirModal}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition"
        >
          <Plus className="w-4 h-4" /> Nova Categoria
        </button>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Nome</th>
              <th className="text-left px-4 py-3">Estado</th>
              <th className="text-right px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {categorias.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-gray-400">
                  Nenhuma categoria cadastrada ainda.
                </td>
              </tr>
            )}
            {categorias.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{c.nome}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      c.estado === 'ATIVO' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {c.estado}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {c.estado === 'ATIVO' && (
                    <button
                      onClick={() => desativar(c.id)}
                      className="p-1.5 rounded hover:bg-red-50 text-red-500"
                      title="Desativar"
                    >
                      <Ban className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalAberto && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Nova Categoria</h2>

            {erroModal && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                {erroModal}
              </div>
            )}

            <form onSubmit={handleCriar} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Nome *</label>
                <input
                  type="text"
                  required
                  value={nomeNovo}
                  onChange={(e) => setNomeNovo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
                >
                  {guardando ? 'A guardar...' : 'Criar Categoria'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
