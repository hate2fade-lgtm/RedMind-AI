'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  TrendingUp,
  DollarSign,
  Activity,
  Crown,
  Shield,
  Search,
  Edit2,
  Trash2,
} from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { formatDate } from '@/lib/utils';

interface AdminStats {
  total_users: number;
  total_analyses: number;
  premium_users: number;
  total_revenue: number;
  analyses_today: number;
  new_users_today: number;
}

interface User {
  id: number;
  email: string;
  username?: string;
  is_premium: boolean;
  is_active: boolean;
  role: string;
  total_analyses: number;
  created_at: string;
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsData, usersData] = await Promise.all([
        api.client.get('/admin/stats'),
        api.client.get('/admin/users'),
      ]);
      setStats(statsData.data);
      setUsers(usersData.data.users);
    } catch (error: any) {
      if (error.response?.status === 403) {
        toast.error('У вас нет прав администратора');
      } else {
        toast.error('Ошибка загрузки данных');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const grantPremium = async (userId: number, days: number) => {
    try {
      await api.client.post(`/admin/grant-premium/${userId}?days=${days}`);
      toast.success(`Premium выдан на ${days} дней`);
      loadData();
    } catch (error) {
      toast.error('Ошибка');
    }
  };

  const makeAdmin = async (userId: number) => {
    if (!confirm('Сделать этого пользователя админом?')) return;
    try {
      await api.client.post(`/admin/make-admin/${userId}`);
      toast.success('Пользователь назначен админом');
      loadData();
    } catch (error) {
      toast.error('Ошибка');
    }
  };

  const deleteUser = async (userId: number) => {
    if (!confirm('Удалить пользователя? Это необратимо!')) return;
    try {
      await api.client.delete(`/admin/users/${userId}`);
      toast.success('Пользователь удален');
      loadData();
    } catch (error) {
      toast.error('Ошибка');
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen"><div className="spinner" /></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold mb-2">Админ Панель</h1>
          <p className="text-dark-400">Управление пользователями и системой</p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-2xl p-6 border border-dark-800"
            >
              <div className="flex items-center justify-between mb-4">
                <Users className="w-8 h-8 text-blue-400" />
                <span className="text-sm text-dark-400">+{stats.new_users_today} сегодня</span>
              </div>
              <div className="text-3xl font-bold mb-1">{stats.total_users}</div>
              <div className="text-sm text-dark-400">Всего пользователей</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass rounded-2xl p-6 border border-dark-800"
            >
              <div className="flex items-center justify-between mb-4">
                <Activity className="w-8 h-8 text-purple-400" />
                <span className="text-sm text-dark-400">+{stats.analyses_today} сегодня</span>
              </div>
              <div className="text-3xl font-bold mb-1">{stats.total_analyses}</div>
              <div className="text-sm text-dark-400">Всего анализов</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass rounded-2xl p-6 border border-dark-800"
            >
              <div className="flex items-center justify-between mb-4">
                <Crown className="w-8 h-8 text-yellow-400" />
              </div>
              <div className="text-3xl font-bold mb-1">{stats.premium_users}</div>
              <div className="text-sm text-dark-400">Premium пользователей</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass rounded-2xl p-6 border border-dark-800"
            >
              <div className="flex items-center justify-between mb-4">
                <DollarSign className="w-8 h-8 text-green-400" />
              </div>
              <div className="text-3xl font-bold mb-1">{stats.total_revenue}₽</div>
              <div className="text-sm text-dark-400">Общая выручка</div>
            </motion.div>
          </div>
        )}

        {/* Users table */}
        <div className="glass rounded-2xl border border-dark-800 overflow-hidden">
          <div className="p-6 border-b border-dark-800">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Пользователи</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-dark-400" />
                <input
                  type="text"
                  placeholder="Поиск..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-field pl-10 w-64"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-400 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-400 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-400 uppercase">Статус</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-400 uppercase">Анализов</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-400 uppercase">Дата регистрации</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-400 uppercase">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-800">
                {users
                  .filter(u => !searchQuery || u.email.includes(searchQuery) || u.username?.includes(searchQuery))
                  .map((user) => (
                    <tr key={user.id} className="hover:bg-dark-800/30">
                      <td className="px-6 py-4 text-sm">{user.id}</td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium">{user.email}</div>
                          {user.username && <div className="text-xs text-dark-400">@{user.username}</div>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          {user.is_premium && <span className="badge badge-success">Premium</span>}
                          {user.role === 'admin' && <span className="badge badge-danger">Admin</span>}
                          {!user.is_active && <span className="badge badge-warning">Неактивен</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">{user.total_analyses}</td>
                      <td className="px-6 py-4 text-sm text-dark-400">{formatDate(user.created_at)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => grantPremium(user.id, 30)}
                            className="p-2 hover:bg-dark-700 rounded transition-colors"
                            title="Выдать Premium"
                          >
                            <Crown className="w-4 h-4 text-yellow-400" />
                          </button>
                          <button
                            onClick={() => makeAdmin(user.id)}
                            className="p-2 hover:bg-dark-700 rounded transition-colors"
                            title="Сделать админом"
                          >
                            <Shield className="w-4 h-4 text-purple-400" />
                          </button>
                          <button
                            onClick={() => deleteUser(user.id)}
                            className="p-2 hover:bg-dark-700 rounded transition-colors"
                            title="Удалить"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
