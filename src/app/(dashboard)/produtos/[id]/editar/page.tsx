'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Categoria {
  id: string;
  nome: string;
}

interface Produto {
  id: string;
  nome: string;
  sku: string | null;
  unidade: string;
  precoCusto: string;
  precoVenda: string;
  categoryId: string;
}

const UNIDADES = ['UNIDADE', 'KG', 'METRO', 'LITRO', 'CAIXA', 'SACO'];

export default function EditarProdutoPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [nome, setNome] = useState('');
  const [sku, setSku] = useState('');
  const [unidade, setUnidade] = useState('UNIDADE');
  const [precoCusto, setPrecoCusto] = useState('');
  const [precoVenda, setPrecoVenda] = useState('');
  const [categoryId, setCategoryId] = useState('');

  useEffect(() => {
    async function carregar() {
      try {
        const [produto, cats] = await Promise.all([
          apiFetch<Produto>(`/products/${id}`),
          apiFetch<Categoria[]>('/categories'),
        ]);
        setNome(produto.nome);
        setSku(produto.sku ?? '');
        setUnidade(produto.unidade);
        setPrecoCusto(produto.precoCusto);
        setPrecoVenda(produto.precoVenda);
        setCategoryId(produto.categoryId);
        setCategorias(cats);
      } catch (err) {
        setErro(err instanceof Error ? err.message : 'Erro ao carregar produto.');
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro('');

    if (Number(precoVenda) < Number(precoCusto)) {
      setErro('O preço de venda não pode ser menor que o preço de custo.');
      return;
    }

    setGuardando(true);

    try {
      await apiFetch(`/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
      nome: nome.trim(),
      sku: sku.trim() || undefined,
      unidade,
      precoCusto: Number(precoCusto),
      precoVenda: Number(precoVenda),
       }),
    });
      router.push('/produtos');
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao atualizar produto.');
      setGuardando(false);
    }
  }

  if (carregando) return <p className="text-gray-500">A carregar...</p>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/produtos" className="p-1.5 rounded hover:bg-slate-200 text-gray-500">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Editar Produto</h1>
      </div>

      {erro && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">{erro}</div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Nome *</label>
          <input
            type="text"
            required
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">SKU (opcional)</label>
          <input
            type="text"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Unidade *</label>
            <select
              value={unidade}
              onChange={(e) => setUnidade(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {UNIDADES.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>

          <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Categoria</label>
            <select
              disabled
              value={categoryId}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-slate-900 bg-gray-100 cursor-not-allowed"
            >
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">A categoria não pode ser alterada nesta versão.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Preço de Custo (Kz) *</label>
            <input
              type="number"
              min="0"
              step="0.01"
              required
              value={precoCusto}
              onChange={(e) => setPrecoCusto(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Preço de Venda (Kz) *</label>
            <input
              type="number"
              min="0"
              step="0.01"
              required
              value={precoVenda}
              onChange={(e) => setPrecoVenda(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Link
            href="/produtos"
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={guardando}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50 cursor-pointer"
          >
            {guardando ? 'A guardar...' : 'Guardar Alterações'}
          </button>
        </div>
      </form>
    </div>
  );
}