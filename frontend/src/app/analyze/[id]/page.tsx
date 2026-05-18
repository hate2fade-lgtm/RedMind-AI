'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Brain,
  AlertTriangle,
  Heart,
  TrendingUp,
  Shield,
  Download,
  Share2,
  ArrowLeft,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Users,
  MessageSquare,
  Info,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';
import api from '@/lib/api';
import { Analysis, AnalysisStatus } from '@/types';
import { getErrorMessage } from '@/lib/api';
import {
  formatDate,
  getToxicityColor,
  getToxicityLabel,
  getAttachmentStyleLabel,
  getAttachmentStyleColor,
  formatPercentage,
  copyToClipboard,
} from '@/lib/utils';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function AnalysisResultPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    redFlags: true,
    personality: true,
    recommendations: true,
  });

  useEffect(() => {
    loadAnalysis();
    const interval = setInterval(() => {
      if (analysis?.status === AnalysisStatus.PENDING || analysis?.status === AnalysisStatus.PROCESSING) {
        loadAnalysis();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [id, analysis?.status]);

  const loadAnalysis = async () => {
    try {
      const data = await api.getAnalysis(parseInt(id));
      setAnalysis(data);
    } catch (error) {
      toast.error(getErrorMessage(error));
      router.push('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleShare = async () => {
    const url = window.location.href;
    const success = await copyToClipboard(url);
    if (success) {
      toast.success('Ссылка скопирована!');
    } else {
      toast.error('Не удалось скопировать');
    }
  };

  const handleDownload = () => {
    if (analysis?.report_url) {
      window.open(analysis.report_url, '_blank');
    } else {
      toast.error('PDF отчет недоступен для этого типа анализа');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mb-4" />
          <p className="text-dark-400">Загрузка анализа...</p>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Анализ не найден</h2>
          <Link href="/dashboard" className="text-purple-400 hover:underline">
            Вернуться в дашборд
          </Link>
        </div>
      </div>
    );
  }

  // Processing/Pending state
  if (analysis.status === AnalysisStatus.PROCESSING || analysis.status === AnalysisStatus.PENDING) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full glass rounded-3xl p-12 text-center border border-dark-800"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Brain className="w-10 h-10 text-white" />
          </div>

          <h2 className="text-3xl font-bold mb-4">Анализируем...</h2>
          <p className="text-dark-400 mb-8">
            {analysis.status === AnalysisStatus.PENDING
              ? 'Анализ в очереди на обработку'
              : 'GigaChat анализирует данные'}
          </p>

          <div className="space-y-3 mb-8">
            <div className="flex items-center justify-between text-sm">
              <span className="text-dark-400">Обработка текста</span>
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-dark-400">AI анализ</span>
              {analysis.status === AnalysisStatus.PROCESSING ? (
                <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
              ) : (
                <Clock className="w-5 h-5 text-dark-600" />
              )}
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-dark-400">Генерация отчета</span>
              <Clock className="w-5 h-5 text-dark-600" />
            </div>
          </div>

          <p className="text-xs text-dark-500">
            Обычно это занимает 20-30 секунд. Вы можете закрыть страницу — результат сохранится в дашборде.
          </p>
        </motion.div>
      </div>
    );
  }

  // Failed state
  if (analysis.status === AnalysisStatus.FAILED) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full glass rounded-3xl p-12 text-center border border-red-800 bg-red-900/10"
        >
          <XCircle className="w-20 h-20 text-red-400 mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-4">Ошибка анализа</h2>
          <p className="text-dark-400 mb-8">
            {analysis.error_message || 'Произошла ошибка при обработке'}
          </p>
          <div className="space-y-3">
            <button onClick={() => router.push('/analyze')} className="btn-primary w-full">
              Попробовать снова
            </button>
            <button onClick={() => router.push('/dashboard')} className="btn-secondary w-full">
              Вернуться в дашборд
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Completed state - show results
  const toxicity = analysis.toxicity_index || 0;
  const gaslighting = (analysis.gaslighting_score || 0) * 100;
  const depA = (analysis.emotional_dependency_a || 0) * 100;
  const depB = (analysis.emotional_dependency_b || 0) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 py-12 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link
            href="/dashboard"
            className="inline-flex items-center space-x-2 text-dark-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Вернуться в дашборд</span>
          </Link>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Результаты анализа</h1>
              <p className="text-dark-400">
                Создан {formatDate(analysis.created_at)} • ID: {analysis.id}
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleShare}
                className="btn-secondary flex items-center space-x-2"
              >
                <Share2 className="w-4 h-4" />
                <span>Поделиться</span>
              </button>
              {analysis.report_url && (
                <button
                  onClick={handleDownload}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>PDF отчет</span>
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Main metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Toxicity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-2xl p-6 border border-dark-800"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Индекс токсичности</h3>
              <AlertTriangle className={`w-6 h-6 ${getToxicityColor(toxicity)}`} />
            </div>
            <div className={`text-5xl font-bold mb-2 ${getToxicityColor(toxicity)}`}>
              {Math.round(toxicity)}
            </div>
            <div className="text-sm text-dark-400 mb-4">{getToxicityLabel(toxicity)}</div>

            {/* Progress bar */}
            <div className="w-full bg-dark-800 rounded-full h-2 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${toxicity}%` }}
                transition={{ duration: 1, delay: 0.5 }}
                className={`h-full rounded-full ${
                  toxicity < 30
                    ? 'bg-green-500'
                    : toxicity < 60
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
              />
            </div>
          </motion.div>

          {/* Manipulation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-2xl p-6 border border-dark-800"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Манипуляции</h3>
              <Shield className={`w-6 h-6 ${analysis.manipulation_detected ? 'text-red-400' : 'text-green-400'}`} />
            </div>
            <div className={`text-5xl font-bold mb-2 ${analysis.manipulation_detected ? 'text-red-400' : 'text-green-400'}`}>
              {analysis.manipulation_detected ? 'Да' : 'Нет'}
            </div>
            <div className="text-sm text-dark-400 mb-4">
              {analysis.manipulation_detected ? 'Обнаружены паттерны манипуляций' : 'Манипуляции не выявлены'}
            </div>

            {/* Gaslighting meter */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-dark-500">
                <span>Газлайтинг</span>
                <span>{Math.round(gaslighting)}%</span>
              </div>
              <div className="w-full bg-dark-800 rounded-full h-1.5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${gaslighting}%` }}
                  transition={{ duration: 1, delay: 0.7 }}
                  className="h-full bg-orange-500 rounded-full"
                />
              </div>
            </div>
          </motion.div>

          {/* Dominant side */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass rounded-2xl p-6 border border-dark-800"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Баланс власти</h3>
              <Users className="w-6 h-6 text-purple-400" />
            </div>
            <div className="text-5xl font-bold mb-2 text-purple-400">
              {analysis.dominant_side === 'Equal' ? '⚖️' : analysis.dominant_side}
            </div>
            <div className="text-sm text-dark-400 mb-4">
              {analysis.dominant_side === 'Equal' ? 'Равные позиции' : `Сторона ${analysis.dominant_side} доминирует`}
            </div>

            {/* Dependency bars */}
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs text-dark-500 mb-1">
                  <span>Зависимость A</span>
                  <span>{Math.round(depA)}%</span>
                </div>
                <div className="w-full bg-dark-800 rounded-full h-1.5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${depA}%` }}
                    transition={{ duration: 1, delay: 0.9 }}
                    className="h-full bg-blue-500 rounded-full"
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs text-dark-500 mb-1">
                  <span>Зависимость B</span>
                  <span>{Math.round(depB)}%</span>
                </div>
                <div className="w-full bg-dark-800 rounded-full h-1.5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${depB}%` }}
                    transition={{ duration: 1, delay: 1 }}
                    className="h-full bg-pink-500 rounded-full"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Attachment styles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
        >
          <div className="glass rounded-2xl p-6 border border-dark-800">
            <div className="flex items-center space-x-3 mb-4">
              <User className="w-6 h-6 text-blue-400" />
              <h3 className="text-xl font-semibold">Сторона A</h3>
            </div>
            <div className={`text-2xl font-bold mb-2 ${getAttachmentStyleColor(analysis.attachment_style_a || '')}`}>
              {getAttachmentStyleLabel(analysis.attachment_style_a || 'unknown')}
            </div>
            <p className="text-sm text-dark-400">
              Стиль привязанности первого участника
            </p>
          </div>

          <div className="glass rounded-2xl p-6 border border-dark-800">
            <div className="flex items-center space-x-3 mb-4">
              <User className="w-6 h-6 text-pink-400" />
              <h3 className="text-xl font-semibold">Сторона B</h3>
            </div>
            <div className={`text-2xl font-bold mb-2 ${getAttachmentStyleColor(analysis.attachment_style_b || '')}`}>
              {getAttachmentStyleLabel(analysis.attachment_style_b || 'unknown')}
            </div>
            <p className="text-sm text-dark-400">
              Стиль привязанности второго участника
            </p>
          </div>
        </motion.div>

        {/* Red flags */}
        {analysis.red_flags && analysis.red_flags.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass rounded-2xl border border-dark-800 mb-8 overflow-hidden"
          >
            <button
              onClick={() => toggleSection('redFlags')}
              className="w-full flex items-center justify-between p-6 hover:bg-dark-800/50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-6 h-6 text-red-400" />
                <h3 className="text-xl font-semibold">Красные флаги ({analysis.red_flags.length})</h3>
              </div>
              {expandedSections.redFlags ? (
                <ChevronUp className="w-5 h-5 text-dark-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-dark-400" />
              )}
            </button>

            {expandedSections.redFlags && (
              <div className="px-6 pb-6 space-y-3">
                {analysis.red_flags.map((flag, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start space-x-3 bg-red-900/10 border border-red-800/30 rounded-lg p-4"
                  >
                    <span className="text-red-400 text-xl">🚩</span>
                    <p className="text-dark-200 flex-1">{flag}</p>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Personality analysis */}
        {analysis.personality_analysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="glass rounded-2xl border border-dark-800 mb-8 overflow-hidden"
          >
            <button
              onClick={() => toggleSection('personality')}
              className="w-full flex items-center justify-between p-6 hover:bg-dark-800/50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Brain className="w-6 h-6 text-purple-400" />
                <h3 className="text-xl font-semibold">Психологический анализ</h3>
              </div>
              {expandedSections.personality ? (
                <ChevronUp className="w-5 h-5 text-dark-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-dark-400" />
              )}
            </button>

            {expandedSections.personality && (
              <div className="px-6 pb-6 space-y-6">
                {/* Archetype */}
                <div>
                  <h4 className="font-semibold mb-2 flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span>Архетип</span>
                  </h4>
                  <p className="text-dark-300 bg-dark-800/50 rounded-lg p-4">
                    {analysis.personality_analysis.archetype}
                  </p>
                </div>

                {/* Strengths */}
                {analysis.personality_analysis.strengths && (
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span>Сильные стороны</span>
                    </h4>
                    <ul className="space-y-2">
                      {analysis.personality_analysis.strengths.map((strength, index) => (
                        <li key={index} className="flex items-start space-x-2 text-dark-300">
                          <span className="text-green-400">✓</span>
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Weaknesses */}
                {analysis.personality_analysis.weaknesses && (
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center space-x-2">
                      <XCircle className="w-4 h-4 text-red-400" />
                      <span>Слабые стороны</span>
                    </h4>
                    <ul className="space-y-2">
                      {analysis.personality_analysis.weaknesses.map((weakness, index) => (
                        <li key={index} className="flex items-start space-x-2 text-dark-300">
                          <span className="text-red-400">✗</span>
                          <span>{weakness}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Communication style */}
                <div>
                  <h4 className="font-semibold mb-2 flex items-center space-x-2">
                    <MessageSquare className="w-4 h-4 text-blue-400" />
                    <span>Стиль коммуникации</span>
                  </h4>
                  <p className="text-dark-300 bg-dark-800/50 rounded-lg p-4">
                    {analysis.personality_analysis.communication_style}
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Recommendations */}
        {analysis.recommendations && analysis.recommendations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="glass rounded-2xl border border-dark-800 overflow-hidden"
          >
            <button
              onClick={() => toggleSection('recommendations')}
              className="w-full flex items-center justify-between p-6 hover:bg-dark-800/50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Heart className="w-6 h-6 text-pink-400" />
                <h3 className="text-xl font-semibold">Рекомендации ({analysis.recommendations.length})</h3>
              </div>
              {expandedSections.recommendations ? (
                <ChevronUp className="w-5 h-5 text-dark-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-dark-400" />
              )}
            </button>

            {expandedSections.recommendations && (
              <div className="px-6 pb-6 space-y-3">
                {analysis.recommendations.map((rec, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start space-x-3 bg-purple-900/10 border border-purple-800/30 rounded-lg p-4"
                  >
                    <span className="text-purple-400 text-xl flex-shrink-0">{index + 1}.</span>
                    <p className="text-dark-200 flex-1">{rec}</p>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Processing time */}
        {analysis.processing_time && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-8 text-center text-sm text-dark-500"
          >
            Анализ завершен за {analysis.processing_time.toFixed(2)} секунд
          </motion.div>
        )}
      </div>
    </div>
  );
}