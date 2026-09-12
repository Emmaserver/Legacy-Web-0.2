'use client';

import { useEffect, useState } from 'react';
import { apiFetch, apiFetchPaginated } from '@/lib/api';
import { Wallet, XCircle } from 'lucide-react';

interface Venda {
  id: string;
  estado: 'ATIVA' | 'CANCELADA';
  estadoPagamento: 'PAGO' | 'PENDENTE' | 'PARCIAL';
  valorTotal: string;
  valorPago: string;
  createdAt: string;
  client: { nome: string } | null;
  itens: { productId: string; quantidade: number }[];
}

function formatKz(valor: string | number) {
  return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(Number(valor));
}

function formatData(iso: string) {
  return new Date(iso).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' });
}

const CORES_ESTADO_PAGAMENTO: Record<string, string> = {
  PAGO: 'bg-emerald-100 text-emerald-700',
  PENDENTE: 'bg-red-100 text-red-700',
  PARCIAL: 'bg-amber-100 text-amber-700',
};

export default function HistoricoPage() {
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);

  const [vendaSelecionada, setVendaSelecionada] = useState<Venda | null>(null);
  const [valorPagamento, setValorPagamento] = useState('');
  const [processando, setProcessando] = useState(false);
  const [erroModal, setErroModal] = useState('');

  async function carregar() {
    try {
      setCarregando(true);
      const resultado = await apiFetchPaginated<Venda>('/sales');
      setVendas(resultado);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao carregar histórico.');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  function abrirModalPagamento(venda: Venda) {
    setVendaSelecionada(venda);
    setValorPagamento('');
    setErroModal('');
  }

  async function handleRegistarPagamento(e: React.FormEvent) {
    e.preventDefault();
    if (!vendaSelecionada) return;

    setErroModal('');
    setProcessando(true);

    try {
      await apiFetch(`/sales/${vendaSelecionada.id}/payments`, {
        method: 'POST',
        body: JSON.stringify({ valor: Number(valorPagamento) }),
      });
      setVendaSelecionada(null);
      carregar();
    } catch (err) {
      setErroModal(err instanceof Error ? err.message : 'Erro ao registar pagamento.');
    } finally {
      setProcessando(false);
    }
  }

  async function cancelarVenda(id: string) {
    if (!confirm('Cancelar esta venda? O stock será devolvido automaticamente.')) return;
    try {
      await apiFetch(`/sales/${id}/cancel`, { method: 'PATCH' });
      carregar();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao cancelar venda.');
    }
  }

  if (carregando) return <p className="text-gray-500">A carregar...</p>;
  if (erro) return <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">{erro}</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Histórico de Vendas</h1>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Data</th>
              <th className="text-left px-4 py-3">Cliente</th>
              <th className="text-right px-4 py-3">Itens</th>
              <th className="text-right px-4 py-3">Total</th>
              <th className="text-right px-4 py-3">Pago</th>
              <th className="text-left px-4 py-3">Pagamento</th>
              <th className="text-left px-4 py-3">Estado</th>
              <th className="text-right px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {vendas.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                  Nenhuma venda registada ainda.
                </td>
              </tr>
            )}
            {vendas.map((v) => (
              <tr key={v.id} className={v.estado === 'CANCELADA' ? 'opacity-50' : ''}>
                <td className="px-4 py-3 text-gray-500">{formatData(v.createdAt)}</td>
                <td className="px-4 py-3 font-medium text-slate-900">{v.client?.nome ?? 'Avulso'}</td>
                <td className="px-4 py-3 text-right">{v.itens.length}</td>
                <td className="px-4 py-3 text-right font-medium">{formatKz(v.valorTotal)}</td>
                <td className="px-4 py-3 text-right">{formatKz(v.valorPago)}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CORES_ESTADO_PAGAMENTO[v.estadoPagamento]}`}>
                    {v.estadoPagamento}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      v.estado === 'ATIVA' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {v.estado}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    {v.estado === 'ATIVA' && v.estadoPagamento !== 'PAGO' && (
                      <button
                        onClick={() => abrirModalPagamento(v)}
                        className="p-1.5 rounded hover:bg-emerald-50 text-emerald-600 cursor-pointer"
                        title="Registar Pagamento"
                      >
                        <Wallet className="w-4 h-4" />
                      </button>
                    )}
                    {v.estado === 'ATIVA' && (
                      <button
                        onClick={() => cancelarVenda(v.id)}
                        className="p-1.5 rounded hover:bg-red-50 text-red-500 cursor-pointer"
                        title="Cancelar Venda"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {vendaSelecionada && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Registar Pagamento</h2>
            <p className="text-sm text-gray-500">
              Falta pagar: {formatKz(Number(vendaSelecionada.valorTotal) - Number(vendaSelecionada.valorPago))}
            </p>

            {erroModal && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">{erroModal}</div>
            )}

            <form onSubmit={handleRegistarPagamento} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Valor Pago *</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={valorPagamento}
                  onChange={(e) => setValorPagamento(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setVendaSelecionada(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={processando}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50 cursor-pointer"
                >
                  {processando ? 'A guardar...' : 'Registar Pagamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
