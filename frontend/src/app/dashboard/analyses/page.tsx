'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  FileText,
  Filter,
  Search,
  Trash2,
  Eye,
  Calendar,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import api from '@/lib/api';
import { Analysis, AnalysisStatus } from '@/types';
import { formatDate, getToxicityColor, getToxicityLabel } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function AnalysesListPage() {
  const router = useRouter();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<AnalysisStatus | 'all'>('all');

  useEffect(() => {
    loadAnalyses();
  }, []);

  const loadAnalyses = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAnalyses(0, 50);
      setAnalyses(data.analyses);
      setTotal(data.total);
    } catch (error) {
      toast.error('Ошибка загрузки анализов');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот анализ?')) return;

    try {
      await api.deleteAnalysis(id);
      toast.success('Анализ удален');
      loadAnalyses();
    } catch (error) {
      toast.error('Ошибка удаления');
    }
  };

  const filteredAnalyses = analyses.filter((analysis) => {
    const matchesStatus = statusFilter === 'all' || analysis.status === statusFilter;
    const matchesSearch = searchQuery === '' || analysis.id.toString().includes(searchQuery);
    return matchesStatus && matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Мои анализы</h1>
          <p className="text-dark-400">Всего: {total}</p>
        </div>
        <button
          onClick={() => router.push('/analyze')}
          className="btn-primary"
        >
          Создать анализ
        </button>
      </div>

      {/* Filters */}
      <div className="glass rounded-2xl p-6 border border-dark-800">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-dark-400" />
            <input
              type="text"
              placeholder="Поиск по ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-12"
            />
          </div>

          {/* Status filter */}
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-dark-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="input-field pl-12 appearance-none cursor-pointer"
            >
              <option value="all">Все статусы</option>
              <option value="completed">Завершенные</option>
              <option value="processing">В обработке</option>
              <option value="pending">В очереди</option>
              <option value="failed">Ошибка</option>
            </select>
          </div>
        </div>
      </div>

      {/* List */}
      {filteredAnalyses.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass rounded-2xl p-12 text-center border border-dark-800"
        >
          <FileText className="w-16 h-16 text-dark-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Анализов не найдено</h3>
          <p className="text-dark-400">
            {searchQuery || statusFilter !== 'all'
              ? 'Попробуйте изменить фильтры'
              : 'Создайте свой первый анализ'}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {filteredAnalyses.map((analysis, index) => (
            <motion.div
              key={analysis.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass rounded-xl border border-dark-800 p-6 card-hover"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <h3 className="text-xl font-semibold">Анализ #{analysis.id}</h3>
                    <span
                      className={`badge ${
                        analysis.status === 'completed'
                          ? 'badge-success'
                          : analysis.status === 'failed'
                          ? 'badge-danger'
                          : 'badge-info'
                      }`}
                    >
                      {analysis.status === 'completed' && 'Завершен'}
                      {analysis.status === 'failed' && 'Ошибка'}
                      {analysis.status === 'processing' && 'Обработка'}
                      {analysis.status === 'pending' && 'В очереди'}
                    </span>
                    <span className="badge badge-info">
                      {analysis.analysis_type}
                    </span>
                  </div>

                  <div className="flex items-center space-x-4 text-sm text-dark-400 mb-4">
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(analysis.created_at)}</span>
                    </span>
                    {analysis.processing_time && (
                      <span>{analysis.processing_time.toFixed(1)}s</span>
                    )}
                  </div>

                  {analysis.status === 'completed' && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-dark-500 mb-1">Токсичность</p>
                        <p className={`text-lg font-bold ${getToxicityColor(analysis.toxicity_index || 0)}`}>
                          {analysis.toxicity_index?.toFixed(0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-dark-500 mb-1">Манипуляции</p>
                        <p className={`text-lg font-bold ${analysis.manipulation_detected ? 'text-red-400' : 'text-green-400'}`}>
                          {analysis.manipulation_detected ? 'Да' : 'Нет'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-dark-500 mb-1">Флаги</p>
                        <p className="text-lg font-bold text-orange-400">
                          {analysis.red_flags?.length || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-dark-500 mb-1">Доминант</p>
                        <p className="text-lg font-bold text-purple-400">
                          {analysis.dominant_side || '-'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => router.push(`/analyze/${analysis.id}`)}
                    className="p-2 hover:bg-dark-800 rounded-lg transition-colors"
                    title="Просмотреть"
                  >
                    <Eye className="w-5 h-5 text-blue-400" />
                  </button>
                  <button
                    onClick={() => handleDelete(analysis.id)}
                    className="p-2 hover:bg-dark-800 rounded-lg transition-colors"
                    title="Удалить"
                  >
                    <Trash2 className="w-5 h-5 text-red-400" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}