'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Calendar, Shield, Crown, Edit2, Save, X } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState('');

  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
    }
  }, [user]);

  const handleSave = () => {
    // TODO: Implement update user profile
    toast.success('Профиль обновлен');
    setIsEditing(false);
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2">Профиль</h1>
        <p className="text-dark-400">Управление вашим аккаунтом</p>
      </div>

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl border border-dark-800 overflow-hidden"
      >
        {/* Avatar section */}
        <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 p-8 border-b border-dark-800">
          <div className="flex items-center space-x-6">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-3xl font-bold">
              {user.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-1">{user.username || user.email}</h2>
              <p className="text-dark-400">{user.email}</p>
              {user.is_premium && (
                <div className="mt-2 inline-flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 px-3 py-1 rounded-full text-sm font-semibold">
                  <Crown className="w-4 h-4" />
                  <span>Premium</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Info section */}
        <div className="p-8 space-y-6">
          {/* Username */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-dark-400">Имя пользователя</label>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-purple-400 hover:text-purple-300 transition-colors text-sm flex items-center space-x-1"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Изменить</span>
                </button>
              ) : (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleSave}
                    className="text-green-400 hover:text-green-300 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setUsername(user.username || '');
                    }}
                    className="text-red-400 hover:text-red-300 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            {isEditing ? (
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field"
              />
            ) : (
              <div className="flex items-center space-x-2 text-lg">
                <User className="w-5 h-5 text-dark-500" />
                <span>{user.username || 'Не указано'}</span>
              </div>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="text-sm font-medium text-dark-400 block mb-2">Email</label>
            <div className="flex items-center space-x-2 text-lg">
              <Mail className="w-5 h-5 text-dark-500" />
              <span>{user.email}</span>
            </div>
          </div>

          {/* Registration date */}
          <div>
            <label className="text-sm font-medium text-dark-400 block mb-2">Дата регистрации</label>
            <div className="flex items-center space-x-2 text-lg">
              <Calendar className="w-5 h-5 text-dark-500" />
              <span>{formatDate(user.created_at)}</span>
            </div>
          </div>

          {/* Stats */}
          <div className="pt-6 border-t border-dark-800">
            <h3 className="font-semibold mb-4">Статистика</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-dark-800/50 rounded-lg p-4">
                <div className="text-3xl font-bold text-purple-400 mb-1">{user.total_analyses}</div>
                <div className="text-sm text-dark-400">Всего анализов</div>
              </div>
              <div className="bg-dark-800/50 rounded-lg p-4">
                <div className="text-3xl font-bold text-blue-400 mb-1">{user.free_analyses_used}</div>
                <div className="text-sm text-dark-400">Использовано бесплатных</div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Danger zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass rounded-2xl border-2 border-red-800 bg-red-900/10 p-6"
      >
        <h3 className="text-xl font-semibold mb-2 text-red-400">Опасная зона</h3>
        <p className="text-dark-400 mb-4">
          Удаление аккаунта приведет к безвозвратной потере всех данных
        </p>
        <button className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors">
          Удалить аккаунт
        </button>
      </motion.div>
    </div>
  );
}