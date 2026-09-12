'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Trash2, ShoppingCart, Plus, Minus, Package } from 'lucide-react';

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
  precoVenda: string;
  quantidadeAtual: number;
  estado: 'ATIVO' | 'INATIVO';
  category?: { nome: string } | null;
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
  const [busca, setBusca] = useState('');

  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [clienteId, setClienteId] = useState('');
  const [valorPago, setValorPago] = useState('');
  const [processando, setProcessando] = useState(false);
  const [sucesso, setSucesso] = useState('');

  useEffect(() => {
    async function carregar() {
      try {
        const [prodsResultado, clisResultado] = await Promise.all([
        apiFetch<RespostaPaginada<Produto>>('/products'),
        apiFetch<RespostaPaginada<Cliente>>('/clients'),
        ]);
        setProdutos(prodsResultado.data.filter((p) => p.estado === 'ATIVO'));
        setClientes(clisResultado.data.filter((c) => c.estado === 'ATIVO'));
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

  useEffect(() => {
    if (!podeEscolherPagamentoParcial) {
      setValorPago(String(total));
    }
  }, [total, podeEscolherPagamentoParcial]);

  const produtosFiltrados = produtos.filter((p) =>
    p.nome.toLowerCase().includes(busca.toLowerCase())
  );

  function adicionarAoCarrinho(produto: Produto) {
    const existente = carrinho.find((i) => i.productId === produto.id);
    const quantidadeJaNoCarrinho = existente?.quantidade ?? 0;

    if (quantidadeJaNoCarrinho + 1 > produto.quantidadeAtual) {
      setErro(`Stock insuficiente para "${produto.nome}". Disponível: ${produto.quantidadeAtual}.`);
      return;
    }

    setErro('');
    setCarrinho((atual) => {
      if (existente) {
        return atual.map((i) =>
          i.productId === produto.id ? { ...i, quantidade: i.quantidade + 1 } : i
        );
      }
      return [
        ...atual,
        {
          productId: produto.id,
          nome: produto.nome,
          quantidade: 1,
          precoUnitario: Number(produto.precoVenda),
          stockDisponivel: produto.quantidadeAtual,
        },
      ];
    });
  }

  function alterarQuantidade(productId: string, delta: number) {
    setCarrinho((atual) => {
      return atual
        .map((item) => {
          if (item.productId !== productId) return item;
          const novaQtd = item.quantidade + delta;
          if (novaQtd > item.stockDisponivel) {
            setErro(`Stock insuficiente. Disponível: ${item.stockDisponivel}.`);
            return item;
          }
          setErro('');
          return { ...item, quantidade: novaQtd };
        })
        .filter((item) => item.quantidade > 0);
    });
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
      const prodsResultado = await apiFetch<RespostaPaginada<Produto>>('/products');
      setProdutos(prodsResultado.data.filter((p) => p.estado === 'ATIVO'));
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao registar venda.');
    } finally {
      setProcessando(false);
    }
  }

  if (carregando) return <p className="text-gray-500">A carregar...</p>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Coluna esquerda: grelha de produtos */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Nova Venda</h1>
        </div>

        <input
          type="text"
          placeholder="Pesquisar produto..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {produtosFiltrados.length === 0 && (
            <p className="col-span-full text-center text-gray-400 py-8">Nenhum produto encontrado.</p>
          )}
          {produtosFiltrados.map((p) => {
            const semStock = p.quantidadeAtual === 0;
            return (
              <button
                key={p.id}
                onClick={() => adicionarAoCarrinho(p)}
                disabled={semStock}
                className="bg-white rounded-xl shadow p-4 text-left hover:shadow-md hover:ring-2 hover:ring-indigo-200 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer space-y-2"
              >
                <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                  <Package className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900 text-sm leading-tight">{p.nome}</p>
                  {p.category?.nome && <p className="text-xs text-gray-400">{p.category.nome}</p>}
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-sm font-semibold text-indigo-600">{formatKz(Number(p.precoVenda))}</span>
                  <span className={`text-xs ${semStock ? 'text-red-500' : 'text-gray-400'}`}>
                    {semStock ? 'Sem stock' : `${p.quantidadeAtual} disp.`}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Coluna direita: carrinho e finalização */}
      <div className="space-y-6 lg:sticky lg:top-6 self-start">
        <div className="bg-white rounded-xl shadow p-5 space-y-4">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" /> Carrinho
          </h2>

          {carrinho.length === 0 && (
            <p className="text-sm text-gray-400 py-4 text-center">
              Clica num produto à esquerda para adicionar.
            </p>
          )}

          {carrinho.length > 0 && (
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {carrinho.map((item) => (
                <div key={item.productId} className="flex items-center gap-2 text-sm">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">{item.nome}</p>
                    <p className="text-xs text-gray-400">{formatKz(item.precoUnitario)} / un.</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => alterarQuantidade(item.productId, -1)}
                      className="w-6 h-6 flex items-center justify-center rounded bg-slate-100 hover:bg-slate-200 cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center">{item.quantidade}</span>
                    <button
                      onClick={() => alterarQuantidade(item.productId, 1)}
                      className="w-6 h-6 flex items-center justify-center rounded bg-slate-100 hover:bg-slate-200 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <button
                    onClick={() => removerDoCarrinho(item.productId)}
                    className="p-1 text-red-400 hover:text-red-600 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

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
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Valor Pago</label>
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