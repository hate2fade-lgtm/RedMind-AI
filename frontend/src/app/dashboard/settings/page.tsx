'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Bell,
  Moon,
  Globe,
  Lock,
  Mail,
  Shield,
  Eye,
  EyeOff,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const handleSave = () => {
    toast.success('Настройки сохранены');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2">Настройки</h1>
        <p className="text-dark-400">Управление параметрами аккаунта</p>
      </div>

      {/* Notifications */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl border border-dark-800 p-6"
      >
        <h3 className="text-xl font-semibold mb-4 flex items-center space-x-2">
          <Bell className="w-6 h-6 text-purple-400" />
          <span>Уведомления</span>
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Email уведомления</p>
              <p className="text-sm text-dark-400">Получать уведомления о завершении анализа</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications}
                onChange={(e) => setNotifications(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-dark-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>
        </div>
      </motion.div>

      {/* Appearance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass rounded-2xl border border-dark-800 p-6"
      >
        <h3 className="text-xl font-semibold mb-4 flex items-center space-x-2">
          <Moon className="w-6 h-6 text-purple-400" />
          <span>Внешний вид</span>
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Темная тема</p>
              <p className="text-sm text-dark-400">Использовать темное оформление</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={darkMode}
                onChange={(e) => setDarkMode(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-dark-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>
        </div>
      </motion.div>

      {/* Security */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass rounded-2xl border border-dark-800 p-6"
      >
        <h3 className="text-xl font-semibold mb-4 flex items-center space-x-2">
          <Shield className="w-6 h-6 text-purple-400" />
          <span>Безопасность</span>
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Сменить пароль</label>
            <div className="space-y-3">
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-dark-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Текущий пароль"
                  className="input-field pl-12 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-dark-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <input
                type="password"
                placeholder="Новый пароль"
                className="input-field"
              />
              <input
                type="password"
                placeholder="Подтвердите новый пароль"
                className="input-field"
              />
            </div>
            <button className="btn-primary mt-4">
              Обновить пароль
            </button>
          </div>
        </div>
      </motion.div>

      {/* Save button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex justify-end space-x-4"
      >
        <button className="btn-secondary">Отмена</button>
        <button onClick={handleSave} className="btn-primary">
          Сохранить изменения
        </button>
      </motion.div>
    </div>
  );
}