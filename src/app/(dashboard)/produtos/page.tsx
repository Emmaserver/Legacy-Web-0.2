'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { Plus, Pencil, Ban } from 'lucide-react';

interface Produto {
  id: string;
  nome: string;
  sku: string | null;
  unidade: string;
  precoVenda: string;
  quantidadeAtual: number;
  estado: 'ATIVO' | 'INATIVO';
  category?: { nome: string } | null;
}

function formatKz(valor: string | number) {
  return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(Number(valor));
}

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);

  async function carregar() {
    try {
      setCarregando(true);
      const resultado = await apiFetch<Produto[]>('/products');
      setProdutos(resultado);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao carregar produtos.');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  async function desativar(id: string) {
    if (!confirm('Desativar este produto?')) return;
    try {
      await apiFetch(`/products/${id}/deactivate`, { method: 'PATCH' });
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
        <h1 className="text-2xl font-bold text-slate-900">Produtos</h1>
        <Link
          href="/produtos/novo"
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition"
        >
          <Plus className="w-4 h-4" /> Novo Produto
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Nome</th>
              <th className="text-left px-4 py-3">SKU</th>
              <th className="text-left px-4 py-3">Categoria</th>
              <th className="text-left px-4 py-3">Unidade</th>
              <th className="text-right px-4 py-3">Preço Venda</th>
              <th className="text-right px-4 py-3">Stock</th>
              <th className="text-left px-4 py-3">Estado</th>
              <th className="text-right px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {produtos.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                  Nenhum produto cadastrado ainda.
                </td>
              </tr>
            )}
            {produtos.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{p.nome}</td>
                <td className="px-4 py-3 text-gray-500">{p.sku ?? '-'}</td>
                <td className="px-4 py-3 text-gray-500">{p.category?.nome ?? '-'}</td>
                <td className="px-4 py-3 text-gray-500">{p.unidade}</td>
                <td className="px-4 py-3 text-right">{formatKz(p.precoVenda)}</td>
                <td className="px-4 py-3 text-right">{p.quantidadeAtual}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      p.estado === 'ATIVO' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {p.estado}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/produtos/${p.id}/editar`}
                      className="p-1.5 rounded hover:bg-slate-100 text-gray-500"
                      title="Editar"
                    >
                      <Pencil className="w-4 h-4" />
                    </Link>
                    {p.estado === 'ATIVO' && (
                      <button
                        onClick={() => desativar(p.id)}
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
    </div>
  );
}