'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Tags,
  ArrowLeftRight,
  Users,
  ShoppingCart,
  History,
  LogOut,
  Boxes,
  ShieldCheck,
} from 'lucide-react';

interface UsuarioLogado {
  id: string;
  nome: string;
  email: string;
  papel: 'ADMINISTRADOR' | 'GERENTE';
}

export default function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [usuario, setUsuario] = useState<UsuarioLogado | null>(null);

  useEffect(() => {
    const dados = localStorage.getItem('user');
    if (dados) {
      setUsuario(JSON.parse(dados));
    }
  }, []);

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Produtos', href: '/produtos', icon: Package },
    { name: 'Categorias', href: '/categorias', icon: Tags },
    { name: 'Stock', href: '/stock', icon: ArrowLeftRight },
    { name: 'Clientes', href: '/clientes', icon: Users },
    { name: 'POS', href: '/pos', icon: ShoppingCart },
    { name: 'Histórico', href: '/historico', icon: History },
    ...(usuario?.papel === 'ADMINISTRADOR'
      ? [{ name: 'Utilizadores', href: '/utilizadores', icon: ShieldCheck }]
      : []),
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  return (
    <header className="bg-slate-900 text-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow">
              <Boxes className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-indigo-400 leading-none">Gestão & Vendas</h1>
              <span className="text-xs text-gray-400">Plataforma Legacy</span>
            </div>
          </div>

          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-lg font-medium text-xs transition flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3 border-l border-slate-800 pl-4">
            <div className="text-right hidden sm:block">
              <span className="text-xs font-semibold block text-white">
                {usuario?.nome ?? 'Operador'}
              </span>
              <span className="text-[10px] text-emerald-400 font-medium">&bull; Ligado</span>
            </div>
            <button
              onClick={handleLogout}
              title="Terminar Sessão"
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-red-600 hover:text-white text-gray-300 flex items-center justify-center transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
