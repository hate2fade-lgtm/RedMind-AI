'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  LayoutDashboard,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  Plus,
  User,
  CreditCard,
  Bell,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, isAuthenticated, fetchUser } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    fetchUser();
  }, [isAuthenticated, router, fetchUser]);

  const handleLogout = async () => {
    await logout();
    toast.success('Вы вышли из системы');
    router.push('/');
  };

  const navigation = [
    { name: 'Дашборд', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Мои анализы', href: '/dashboard/analyses', icon: FileText },
    { name: 'Профиль', href: '/dashboard/profile', icon: User },
    { name: 'Подписка', href: '/dashboard/subscription', icon: CreditCard },
    { name: 'Настройки', href: '/dashboard/settings', icon: Settings },
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
      {/* Mobile sidebar backdrop */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-dark-900 border-r border-dark-800 z-50
          transform transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b border-dark-800">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gradient">RedMind AI</span>
            </Link>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden text-dark-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* User info */}
          <div className="p-6 border-b border-dark-800">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold">
                  {user.email?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user.username || user.email}
                </p>
                <p className="text-xs text-dark-400 truncate">{user.email}</p>
              </div>
            </div>
            {user.is_premium && (
              <div className="mt-3 px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-xs font-semibold text-center">
                Premium
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center space-x-3 px-4 py-3 rounded-lg transition-all
                    ${
                      isActive
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                        : 'text-dark-300 hover:bg-dark-800 hover:text-white'
                    }
                  `}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* New analysis button */}
          <div className="p-4 border-t border-dark-800">
            <button
              onClick={() => router.push('/analyze')}
              className="btn-primary w-full flex items-center justify-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Новый анализ</span>
            </button>
          </div>

          {/* Logout */}
          <div className="p-4 border-t border-dark-800">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-red-400 hover:bg-dark-800 rounded-lg transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span>Выйти</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-dark-900/80 backdrop-blur-lg border-b border-dark-800">
          <div className="flex items-center justify-between px-6 py-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden text-dark-400 hover:text-white"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex-1" />

            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="relative p-2 text-dark-400 hover:text-white transition-colors">
                <Bell className="w-6 h-6" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>

              {/* Stats */}
              <div className="hidden md:flex items-center space-x-4 px-4 py-2 bg-dark-800 rounded-lg">
                <div className="text-right">
                  <p className="text-xs text-dark-400">Осталось анализов</p>
                  <p className="text-sm font-semibold">
                    {user.is_premium ? '∞' : Math.max(0, 1 - user.free_analyses_used)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}