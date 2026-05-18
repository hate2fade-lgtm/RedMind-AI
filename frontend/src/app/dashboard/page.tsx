'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRight,
  BarChart3,
  FileText,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import { Analysis, UserStats } from '@/types';
import { formatRelativeTime, getToxicityColor, getToxicityLabel } from '@/lib/utils';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [recentAnalyses, setRecentAnalyses] = useState<Analysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [statsData, analysesData] = await Promise.all([
        api.getUserStats(),
        api.getAnalyses(0, 5),
      ]);
      setStats(statsData);
      setRecentAnalyses(analysesData.analyses);
    } catch (error) {
      toast.error('Ошибка загрузки данных');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Welcome section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-bold mb-2">
          Добро пожаловать, {user?.username || 'пользователь'}! 👋
        </h1>
        <p className="text-dark-400 text-lg">
          Вот обзор ваших анализов и статистики
        </p>
      </motion.div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-6 border border-dark-800 card-hover"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-900/30 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-purple-400" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <div className="text-3xl font-bold mb-1">{stats?.total_analyses || 0}</div>
          <div className="text-sm text-dark-400">Всего анализов</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-2xl p-6 border border-dark-800 card-hover"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-900/30 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-blue-400" />
            </div>
            {user?.is_premium ? (
              <CheckCircle className="w-5 h-5 text-green-400" />
            ) : (
              <Clock className="w-5 h-5 text-yellow-400" />
            )}
          </div>
          <div className="text-3xl font-bold mb-1">
            {user?.is_premium ? '∞' : stats?.free_analyses_remaining || 0}
          </div>
          <div className="text-sm text-dark-400">
            {user?.is_premium ? 'Premium активен' : 'Бесплатных анализов'}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-2xl p-6 border border-dark-800 card-hover"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-900/30 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-orange-400" />
            </div>
          </div>
          <div className="text-3xl font-bold mb-1">
            {stats?.avg_toxicity ? `${Math.round(stats.avg_toxicity)}%` : 'N/A'}
          </div>
          <div className="text-sm text-dark-400">Средняя токсичность</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass rounded-2xl p-6 border border-dark-800 card-hover"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-red-900/30 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
          </div>
          <div className="text-3xl font-bold mb-1">
            {stats?.most_common_red_flag ? '🚩' : '-'}
          </div>
          <div className="text-sm text-dark-400">Частый красный флаг</div>
          {stats?.most_common_red_flag && (
            <div className="text-xs text-dark-500 mt-1 truncate">
              {stats.most_common_red_flag}
            </div>
          )}
        </motion.div>
      </div>

      {/* Quick actions */}
      {!user?.is_premium && stats?.free_analyses_remaining === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6 border-2 border-purple-800 bg-gradient-to-r from-purple-900/20 to-pink-900/20"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold mb-2">Бесплатные анализы закончились</h3>
              <p className="text-dark-400">
                Оформите Premium для неограниченного доступа
              </p>
            </div>
            <button
              onClick={() => router.push('/dashboard/subscription')}
              className="btn-primary whitespace-nowrap"
            >
              Получить Premium
            </button>
          </div>
        </motion.div>
      )}

      {/* Recent analyses */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Analyses list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Последние анализы</h2>
            <Link
              href="/dashboard/analyses"
              className="text-purple-400 hover:text-purple-300 transition-colors flex items-center space-x-1"
            >
              <span>Все анализы</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {recentAnalyses.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass rounded-2xl p-12 text-center border border-dark-800"
            >
              <FileText className="w-16 h-16 text-dark-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Анализов пока нет</h3>
              <p className="text-dark-400 mb-6">
                Создайте свой первый анализ, чтобы начать
              </p>
              <button
                onClick={() => router.push('/analyze')}
                className="btn-primary"
              >
                Создать анализ
              </button>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {recentAnalyses.map((analysis, index) => (
                <motion.div
                  key={analysis.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => router.push(`/analyze/${analysis.id}`)}
                  className="glass rounded-xl p-6 border border-dark-800 cursor-pointer card-hover"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`badge ${
                          analysis.status === 'completed'
                            ? 'badge-success'
                            : analysis.status === 'failed'
                            ? 'badge-danger'
                            : analysis.status === 'processing'
                            ? 'badge-info'
                            : 'badge-warning'
                        }`}>
                          {analysis.status === 'completed' && 'Завершен'}
                          {analysis.status === 'failed' && 'Ошибка'}
                          {analysis.status === 'processing' && 'Обработка'}
                          {analysis.status === 'pending' && 'В очереди'}
                        </span>
                        <span className="text-xs text-dark-500">
                          {formatRelativeTime(analysis.created_at)}
                        </span>
                      </div>
                      <h3 className="font-semibold mb-1">
                        Анализ #{analysis.id}
                      </h3>
                    </div>

                    {analysis.status === 'completed' && analysis.toxicity_index !== null && (
                      <div className="text-right">
                        <div className={`text-3xl font-bold ${getToxicityColor(analysis.toxicity_index)}`}>
                          {Math.round(analysis.toxicity_index)}
                        </div>
                        <div className="text-xs text-dark-400">токсичность</div>
                      </div>
                    )}
                  </div>

                  {analysis.status === 'completed' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-dark-400">Манипуляции:</span>
                        <span className={analysis.manipulation_detected ? 'text-red-400' : 'text-green-400'}>
                          {analysis.manipulation_detected ? 'Обнаружены' : 'Не обнаружены'}
                        </span>
                      </div>
                      {analysis.red_flags && analysis.red_flags.length > 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-dark-400">Красные флаги:</span>
                          <span className="text-orange-400">{analysis.red_flags.length}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {analysis.status === 'processing' && (
                    <div className="flex items-center space-x-2 text-sm text-blue-400">
                      <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                      <span>Анализируем...</span>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Quick info */}
        <div className="space-y-6">
          {/* Tips */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass rounded-2xl p-6 border border-dark-800"
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <span>Советы</span>
            </h3>
            <ul className="space-y-3 text-sm text-dark-300">
              <li className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Для лучшего анализа загружайте переписку минимум 50 сообщений</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Анализ займет 20-30 секунд</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Вы можете анализировать любые диалоги: личные, рабочие, из соцсетей</span>
              </li>
            </ul>
          </motion.div>

          {/* Telegram bot CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="glass rounded-2xl p-6 border border-dark-800 bg-gradient-to-br from-blue-900/20 to-purple-900/20"
          >
            <h3 className="text-lg font-semibold mb-2">Telegram бот</h3>
            <p className="text-sm text-dark-400 mb-4">
              Анализируйте отношения прямо в Telegram
            </p>
            <a
              href="https://t.me/YOUR_BOT_USERNAME"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary w-full text-center block"
            >
              Открыть бота
            </a>
          </motion.div>
        </div>
      </div>
    </div>
  );
}