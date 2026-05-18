'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Brain,
  Upload,
  FileText,
  MessageSquare,
  Loader2,
  AlertCircle,
  Info,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Crown,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import { AnalysisType } from '@/types';
import { getErrorMessage } from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';

const analyzeSchema = z.object({
  input_text: z.string().min(50, 'Минимум 50 символов').max(50000, 'Максимум 50000 символов'),
  source_type: z.enum(['chat', 'profile', 'text']),
  analysis_type: z.nativeEnum(AnalysisType),
});

type AnalyzeFormData = z.infer<typeof analyzeSchema>;

export default function AnalyzePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [selectedType, setSelectedType] = useState<AnalysisType>(AnalysisType.FREE);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AnalyzeFormData>({
    resolver: zodResolver(analyzeSchema),
    defaultValues: {
      source_type: 'chat',
      analysis_type: AnalysisType.FREE,
    },
  });

  const inputText = watch('input_text', '');

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setCharCount(text.length);
    setValue('input_text', text);
  };

  const onSubmit = async (data: AnalyzeFormData) => {
    // Проверка лимитов
    if (!user?.is_premium && user?.free_analyses_used >= 1 && data.analysis_type === AnalysisType.FREE) {
      toast.error('Бесплатный лимит исчерпан. Оформите подписку или купите анализ.');
      router.push('/dashboard/subscription');
      return;
    }

    setIsLoading(true);
    try {
      const analysis = await api.createAnalysis(data);
      toast.success('Анализ создан! Обрабатываем...');

      // Перенаправляем на страницу результатов
      router.push(`/analyze/${analysis.id}`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const analysisTypes = [
    {
      type: AnalysisType.FREE,
      name: 'Базовый',
      price: 'Бесплатно',
      description: 'Основные метрики токсичности',
      features: [
        'Индекс токсичности 0-100',
        'Обнаружение манипуляций',
        'Красные флаги',
        'Базовые рекомендации',
      ],
      icon: FileText,
      available: user?.is_premium || (user?.free_analyses_used ?? 0) < 1,
    },
    {
      type: AnalysisType.EXTENDED,
      name: 'Расширенный',
      price: '599₽',
      description: 'Глубокий анализ отношений',
      features: [
        'Все из базового',
        'Стили привязанности',
        'Психологический портрет',
        'Детальные рекомендации',
        'PDF отчет',
      ],
      icon: Brain,
      available: true,
      badge: 'Популярный',
    },
    {
      type: AnalysisType.PRO,
      name: 'PRO',
      price: '999₽',
      description: 'Максимальная детализация',
      features: [
        'Все из расширенного',
        'Прогноз отношений',
        'Вероятность возврата',
        'Кто уйдет первым',
        'Скрытые паттерны',
      ],
      icon: Crown,
      available: true,
    },
  ];

  const sourceTypes = [
    {
      value: 'chat',
      label: 'Переписка',
      icon: MessageSquare,
      description: 'WhatsApp, Telegram, VK и др.',
    },
    {
      value: 'profile',
      label: 'Профиль',
      icon: FileText,
      description: 'Посты из соцсетей',
    },
    {
      value: 'text',
      label: 'Текст',
      icon: Upload,
      description: 'Любой текст',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 py-12 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <Link
            href="/dashboard"
            className="inline-flex items-center space-x-2 text-dark-400 hover:text-white transition-colors mb-6"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            <span>Вернуться в дашборд</span>
          </Link>

          <div className="inline-flex items-center space-x-2 bg-purple-900/20 border border-purple-800 rounded-full px-4 py-2 mb-6">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-purple-300">AI-анализ отношений</span>
          </div>

          <h1 className="text-5xl font-bold mb-4">
            Создать <span className="text-gradient-danger">анализ</span>
          </h1>
          <p className="text-xl text-dark-400 max-w-2xl mx-auto">
            Загрузите переписку или текст для глубокого анализа с помощью искусственного интеллекта
          </p>
        </motion.div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Source Type Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="text-2xl font-bold mb-4">Тип источника</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {sourceTypes.map((source) => (
                <label
                  key={source.value}
                  className={`
                    glass rounded-xl p-6 border-2 cursor-pointer transition-all card-hover
                    ${
                      watch('source_type') === source.value
                        ? 'border-purple-500 bg-purple-900/20'
                        : 'border-dark-800 hover:border-dark-700'
                    }
                  `}
                >
                  <input
                    type="radio"
                    value={source.value}
                    {...register('source_type')}
                    className="sr-only"
                  />
                  <source.icon className="w-8 h-8 text-purple-400 mb-3" />
                  <h3 className="font-semibold mb-1">{source.label}</h3>
                  <p className="text-sm text-dark-400">{source.description}</p>
                </label>
              ))}
            </div>
          </motion.div>

          {/* Text Input */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Текст для анализа</h2>
              <span className={`text-sm ${charCount < 50 ? 'text-red-400' : charCount > 45000 ? 'text-orange-400' : 'text-dark-400'}`}>
                {charCount.toLocaleString()} / 50,000
              </span>
            </div>

            <div className="glass rounded-2xl border border-dark-800 overflow-hidden">
              <textarea
                {...register('input_text')}
                onChange={handleTextChange}
                placeholder="Вставьте переписку или текст здесь...&#10;&#10;Пример:&#10;Он: Привет, как дела?&#10;Она: Нормально...&#10;Он: Что случилось?&#10;Она: Ничего, всё нормально&#10;&#10;Минимум 50 символов для анализа"
                className="w-full h-96 bg-transparent p-6 text-white placeholder-dark-500 resize-none focus:outline-none"
                disabled={isLoading}
              />

              {/* Helper text */}
              <div className="bg-dark-800/50 p-4 border-t border-dark-700">
                <div className="flex items-start space-x-2 text-sm text-dark-400">
                  <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="mb-2">
                      <strong>Совет:</strong> Для лучшего анализа включите минимум 20-30 сообщений от каждого участника
                    </p>
                    <p>Поддерживаемые форматы: обычный текст, экспорт из WhatsApp, Telegram</p>
                  </div>
                </div>
              </div>
            </div>

            {errors.input_text && (
              <div className="flex items-center space-x-2 mt-2 text-red-400">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{errors.input_text.message}</span>
              </div>
            )}
          </motion.div>

          {/* Analysis Type Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-2xl font-bold mb-4">Тип анализа</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {analysisTypes.map((plan) => (
                <label
                  key={plan.type}
                  className={`
                    glass rounded-2xl p-6 border-2 cursor-pointer transition-all relative
                    ${!plan.available ? 'opacity-50 cursor-not-allowed' : 'card-hover'}
                    ${
                      selectedType === plan.type
                        ? 'border-purple-500 bg-purple-900/20 glow-sm'
                        : 'border-dark-800 hover:border-dark-700'
                    }
                  `}
                >
                  <input
                    type="radio"
                    value={plan.type}
                    {...register('analysis_type')}
                    onChange={() => setSelectedType(plan.type)}
                    disabled={!plan.available || isLoading}
                    className="sr-only"
                  />

                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                        {plan.badge}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-4">
                    <plan.icon className="w-10 h-10 text-purple-400" />
                    {!plan.available && (
                      <span className="text-xs text-red-400 bg-red-900/30 px-2 py-1 rounded">
                        Недоступно
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                  <div className="text-2xl font-bold text-gradient mb-2">{plan.price}</div>
                  <p className="text-sm text-dark-400 mb-4">{plan.description}</p>

                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start space-x-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-dark-300">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {selectedType === plan.type && (
                    <div className="absolute inset-0 rounded-2xl border-2 border-purple-500 pointer-events-none" />
                  )}
                </label>
              ))}
            </div>

            {!user?.is_premium && user?.free_analyses_used >= 1 && (
              <div className="mt-6 glass rounded-xl p-4 border border-yellow-800 bg-yellow-900/20">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-yellow-400 mb-1">
                      Бесплатные анализы закончились
                    </p>
                    <p className="text-sm text-dark-300">
                      Выберите платный тип анализа или{' '}
                      <Link href="/dashboard/subscription" className="text-purple-400 hover:underline">
                        оформите Premium подписку
                      </Link>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          {/* Submit Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-center space-x-4"
          >
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="btn-secondary px-8 py-4"
              disabled={isLoading}
            >
              Отмена
            </button>

            <button
              type="submit"
              disabled={isLoading || charCount < 50}
              className="btn-primary px-8 py-4 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Создаем анализ...</span>
                </>
              ) : (
                <>
                  <Brain className="w-5 h-5" />
                  <span>Создать анализ</span>
                </>
              )}
            </button>
          </motion.div>

          {/* Info block */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="glass rounded-xl p-6 border border-dark-800"
          >
            <h3 className="font-semibold mb-3 flex items-center space-x-2">
              <Info className="w-5 h-5 text-blue-400" />
              <span>Что будет анализироваться?</span>
            </h3>
            <ul className="space-y-2 text-sm text-dark-300">
              <li className="flex items-start space-x-2">
                <span className="text-purple-400 mt-1">•</span>
                <span><strong>Токсичность:</strong> Уровень деструктивности коммуникации (0-100)</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-purple-400 mt-1">•</span>
                <span><strong>Манипуляции:</strong> Газлайтинг, эмоциональные качели, обесценивание</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-purple-400 mt-1">•</span>
                <span><strong>Баланс власти:</strong> Кто доминирует, кто зависим</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-purple-400 mt-1">•</span>
                <span><strong>Стили привязанности:</strong> Тревожная, избегающая, надежная</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-purple-400 mt-1">•</span>
                <span><strong>Красные флаги:</strong> Конкретные проблемные паттерны</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-purple-400 mt-1">•</span>
                <span><strong>Рекомендации:</strong> Как улучшить ситуацию</span>
              </li>
            </ul>
          </motion.div>
        </form>
      </div>
    </div>
  );
}