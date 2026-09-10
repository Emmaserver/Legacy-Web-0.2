'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { TrendingUp, Calendar, Clock, AlertTriangle } from 'lucide-react';

interface DashboardData {
  vendasHoje: { total: number; quantidade: number };
  vendasMes: { total: number; quantidade: number };
  valorPendente: number;
  produtosStockBaixo: { id: string; nome: string; quantidadeAtual: number }[];
}

function formatKz(valor: number) {
  return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(valor);
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregar() {
      try {
        const resultado = await apiFetch<DashboardData>('/dashboard');
        setData(resultado);
      } catch (err) {
        setErro(err instanceof Error ? err.message : 'Erro ao carregar o dashboard.');
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, []);

  if (carregando) return <p className="text-gray-500">A carregar...</p>;
  if (erro) return <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">{erro}</div>;
  if (!data) return null;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow p-5">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <TrendingUp className="w-4 h-4" /> Vendas Hoje
          </div>
          <p className="text-2xl font-bold text-slate-900">{formatKz(data.vendasHoje.total)}</p>
          <p className="text-xs text-gray-400">{data.vendasHoje.quantidade} venda(s)</p>
        </div>

        <div className="bg-white rounded-xl shadow p-5">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <Calendar className="w-4 h-4" /> Vendas do Mês
          </div>
          <p className="text-2xl font-bold text-slate-900">{formatKz(data.vendasMes.total)}</p>
          <p className="text-xs text-gray-400">{data.vendasMes.quantidade} venda(s)</p>
        </div>

        <div className="bg-white rounded-xl shadow p-5">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <Clock className="w-4 h-4" /> Valor Pendente
          </div>
          <p className="text-2xl font-bold text-amber-600">{formatKz(data.valorPendente)}</p>
        </div>

        <div className="bg-white rounded-xl shadow p-5">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <AlertTriangle className="w-4 h-4" /> Stock Baixo
          </div>
          <p className="text-2xl font-bold text-red-600">{data.produtosStockBaixo.length}</p>
          <p className="text-xs text-gray-400">produto(s)</p>
        </div>
      </div>

      {data.produtosStockBaixo.length > 0 && (
        <div className="bg-white rounded-xl shadow p-5">
          <h2 className="font-semibold text-slate-900 mb-3">Produtos com Stock Baixo</h2>
          <ul className="divide-y divide-gray-100">
            {data.produtosStockBaixo.map((p) => (
              <li key={p.id} className="py-2 flex justify-between text-sm">
                <span>{p.nome}</span>
                <span className="text-red-600 font-medium">{p.quantidadeAtual} un.</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}