'use client';

import { useEffect, useState } from 'react';
import { apiFetch, apiFetchPaginated } from '@/lib/api';
import { PackagePlus } from 'lucide-react';

interface RespostaPaginada<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface Produto {
  id: string;
  nome: string;
  unidade: string;
  quantidadeAtual: number;
}

export default function StockPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);

  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null);
  const [quantidade, setQuantidade] = useState('');
  const [motivo, setMotivo] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [erroModal, setErroModal] = useState('');

  async function carregar() {
    try {
      setCarregando(true);
      
      const resultado = await apiFetch<RespostaPaginada<Produto>>('/products');
      setProdutos(resultado.data);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao carregar produtos.');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  function abrirModal(produto: Produto) {
    setProdutoSelecionado(produto);
    setQuantidade('');
    setMotivo('');
    setErroModal('');
  }

  function fecharModal() {
    setProdutoSelecionado(null);
  }

  async function handleEntrada(e: React.FormEvent) {
    e.preventDefault();
    if (!produtoSelecionado) return;

    setErroModal('');
    setGuardando(true);

    try {
      await apiFetch('/stock/entry', {
        method: 'POST',
        body: JSON.stringify({
          productId: produtoSelecionado.id,
          quantidade: Number(quantidade),
          motivo: motivo || undefined,
        }),
      });
      fecharModal();
      carregar();
    } catch (err) {
      setErroModal(err instanceof Error ? err.message : 'Erro ao dar entrada.');
    } finally {
      setGuardando(false);
    }
  }

  if (carregando) return <p className="text-gray-500">A carregar...</p>;
  if (erro) return <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">{erro}</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Stock</h1>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Produto</th>
              <th className="text-left px-4 py-3">Unidade</th>
              <th className="text-right px-4 py-3">Quantidade Atual</th>
              <th className="text-right px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {produtos.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{p.nome}</td>
                <td className="px-4 py-3 text-gray-500">{p.unidade}</td>
                <td className="px-4 py-3 text-right">{p.quantidadeAtual}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => abrirModal(p)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition"
                  >
                    <PackagePlus className="w-3.5 h-3.5" /> Dar Entrada
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {produtoSelecionado && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-lg font-bold text-slate-900">
              Entrada de Stock — {produtoSelecionado.nome}
            </h2>

            {erroModal && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                {erroModal}
              </div>
            )}

            <form onSubmit={handleEntrada} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Quantidade *
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={quantidade}
                  onChange={(e) => setQuantidade(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Motivo (opcional)
                </label>
                <input
                  type="text"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Ex: Compra ao fornecedor"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
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
                  {guardando ? 'A guardar...' : 'Confirmar Entrada'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
