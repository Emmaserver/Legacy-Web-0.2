'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Trash2, ShoppingCart } from 'lucide-react';

interface Produto {
  id: string;
  nome: string;
  precoVenda: string;
  quantidadeAtual: number;
  estado: 'ATIVO' | 'INATIVO';
}

interface Cliente {
  id: string;
  nome: string;
  permiteFiado: boolean;
  estado: 'ATIVO' | 'INATIVO';
}

interface ItemCarrinho {
  productId: string;
  nome: string;
  quantidade: number;
  precoUnitario: number;
  stockDisponivel: number;
}

function formatKz(valor: number) {
  return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(valor);
}

export default function PosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const [produtoSelecionadoId, setProdutoSelecionadoId] = useState('');
  const [quantidadeAdicionar, setQuantidadeAdicionar] = useState('1');
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);

  const [clienteId, setClienteId] = useState('');
  const [valorPago, setValorPago] = useState('');
  const [processando, setProcessando] = useState(false);
  const [sucesso, setSucesso] = useState('');

  useEffect(() => {
    async function carregar() {
      try {
        const [prods, clis] = await Promise.all([
          apiFetch<Produto[]>('/products'),
          apiFetch<Cliente[]>('/clients'),
        ]);
        setProdutos(prods.filter((p) => p.estado === 'ATIVO'));
        setClientes(clis.filter((c) => c.estado === 'ATIVO'));
      } catch (err) {
        setErro(err instanceof Error ? err.message : 'Erro ao carregar dados.');
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, []);

  const clienteSelecionado = clientes.find((c) => c.id === clienteId) || null;
  const podeEscolherPagamentoParcial = clienteSelecionado?.permiteFiado ?? false;

  const total = carrinho.reduce((soma, item) => soma + item.quantidade * item.precoUnitario, 0);

  // Sem cliente, ou cliente sem fiado: pagamento é sempre o valor total
  useEffect(() => {
    if (!podeEscolherPagamentoParcial) {
      setValorPago(String(total));
    }
  }, [total, podeEscolherPagamentoParcial]);

function adicionarAoCarrinho() {
  const produto = produtos.find((p) => p.id === produtoSelecionadoId);
  if (!produto) return;

  const qtd = Number(quantidadeAdicionar);
  if (qtd < 1) return;

  const existente = carrinho.find((i) => i.productId === produto.id);
  const quantidadeJaNoCarrinho = existente?.quantidade ?? 0;

  if (quantidadeJaNoCarrinho + qtd > produto.quantidadeAtual) {
    setErro(
      `Stock insuficiente para "${produto.nome}". Disponível: ${produto.quantidadeAtual}, já no carrinho: ${quantidadeJaNoCarrinho}.`
    );
    return;
  }

  setErro('');
  setCarrinho((atual) => {
    if (existente) {
      return atual.map((i) =>
        i.productId === produto.id ? { ...i, quantidade: i.quantidade + qtd } : i
      );
    }
    return [
      ...atual,
      {
        productId: produto.id,
        nome: produto.nome,
        quantidade: qtd,
        precoUnitario: Number(produto.precoVenda),
        stockDisponivel: produto.quantidadeAtual,
      },
    ];
  });
  setQuantidadeAdicionar('1');
}

  function removerDoCarrinho(productId: string) {
    setCarrinho((atual) => atual.filter((i) => i.productId !== productId));
  }

  async function finalizarVenda() {
    if (carrinho.length === 0) return;
    setErro('');
    setSucesso('');
    setProcessando(true);

    try {
      await apiFetch('/sales', {
        method: 'POST',
        body: JSON.stringify({
          itens: carrinho.map((i) => ({ productId: i.productId, quantidade: i.quantidade })),
          clientId: clienteId || undefined,
          valorPago: Number(valorPago),
        }),
      });
      setSucesso('Venda registada com sucesso!');
      setCarrinho([]);
      setClienteId('');
      setValorPago('');
      // Atualiza stock local para refletir a venda
      const prods = await apiFetch<Produto[]>('/products');
      setProdutos(prods.filter((p) => p.estado === 'ATIVO'));
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao registar venda.');
    } finally {
      setProcessando(false);
    }
  }

  if (carregando) return <p className="text-gray-500">A carregar...</p>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Coluna esquerda: seleção de produtos */}
      <div className="lg:col-span-2 space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Nova Venda</h1>

        <div className="bg-white rounded-xl shadow p-5 space-y-4">
          <h2 className="font-semibold text-slate-900">Adicionar Produto</h2>
          <div className="flex gap-3">
            <select
              value={produtoSelecionadoId}
              onChange={(e) => setProdutoSelecionadoId(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Selecionar produto...</option>
              {produtos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome} — {formatKz(Number(p.precoVenda))} (stock: {p.quantidadeAtual})
                </option>
              ))}
            </select>
            <input
              type="number"
              min="1"
              value={quantidadeAdicionar}
              onChange={(e) => setQuantidadeAdicionar(e.target.value)}
              className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={adicionarAoCarrinho}
              disabled={!produtoSelecionadoId}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50 cursor-pointer"
            >
              Adicionar
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Produto</th>
                <th className="text-right px-4 py-3">Qtd</th>
                <th className="text-right px-4 py-3">Preço Unit.</th>
                <th className="text-right px-4 py-3">Subtotal</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {carrinho.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    Carrinho vazio.
                  </td>
                </tr>
              )}
              {carrinho.map((item) => (
                <tr key={item.productId}>
                  <td className="px-4 py-3 font-medium text-slate-900">{item.nome}</td>
                  <td className="px-4 py-3 text-right">
                    {item.quantidade}
                    {item.quantidade > item.stockDisponivel && (
                      <span className="text-red-500 text-xs block">acima do stock!</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">{formatKz(item.precoUnitario)}</td>
                  <td className="px-4 py-3 text-right font-medium">
                    {formatKz(item.quantidade * item.precoUnitario)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => removerDoCarrinho(item.productId)}
                      className="p-1.5 rounded hover:bg-red-50 text-red-500 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Coluna direita: resumo e finalização */}
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow p-5 space-y-4">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" /> Resumo
          </h2>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              Cliente (opcional)
            </label>
            <select
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Venda avulsa (sem cliente)</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome} {c.permiteFiado ? '(fiado)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-between text-lg font-bold text-slate-900 pt-2 border-t">
            <span>Total</span>
            <span>{formatKz(total)}</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              Valor Pago
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={valorPago}
              onChange={(e) => setValorPago(e.target.value)}
              disabled={!podeEscolherPagamentoParcial}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
            />
            {!podeEscolherPagamentoParcial && (
              <p className="text-xs text-gray-400 mt-1">
                {clienteId
                  ? 'Este cliente não tem fiado ativado — pagamento tem de ser total.'
                  : 'Vendas sem cliente têm de ser pagas na totalidade.'}
              </p>
            )}
          </div>

          {erro && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">{erro}</div>
          )}
          {sucesso && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm">
              {sucesso}
            </div>
          )}

          <button
            onClick={finalizarVenda}
            disabled={carrinho.length === 0 || processando}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-sm transition disabled:opacity-50 cursor-pointer"
          >
            {processando ? 'A finalizar...' : 'Finalizar Venda'}
          </button>
        </div>
      </div>
    </div>
  );
}