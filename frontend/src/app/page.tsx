'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Brain,
  Shield,
  TrendingUp,
  Users,
  Zap,
  Heart,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Star,
  MessageSquare,
  BarChart3,
  Lock,
  Sparkles
} from 'lucide-react';
import { useAuth } from '@/lib/auth';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-dark-950 via-dark-900 to-dark-950">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 glass border-b border-dark-800">
        <nav className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-2"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gradient">RedMind AI</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-4"
            >
              {isAuthenticated ? (
                <>
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="text-dark-300 hover:text-white transition-colors"
                  >
                    Дашборд
                  </button>
                  <button
                    onClick={() => router.push('/analyze')}
                    className="btn-primary"
                  >
                    Создать анализ
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => router.push('/auth/login')}
                    className="text-dark-300 hover:text-white transition-colors"
                  >
                    Войти
                  </button>
                  <button
                    onClick={() => router.push('/auth/register')}
                    className="btn-primary"
                  >
                    Начать бесплатно
                  </button>
                </>
              )}
            </motion.div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="inline-flex items-center space-x-2 bg-purple-900/20 border border-purple-800 rounded-full px-4 py-2 mb-6">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-purple-300">Powered by GigaChat AI</span>
            </div>

            <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
              Анализ отношений{' '}
              <span className="text-gradient-danger">нового уровня</span>
            </h1>

            <p className="text-xl text-dark-300 mb-8 max-w-3xl mx-auto">
              Используйте силу искусственного интеллекта для глубокого анализа токсичности,
              манипуляций и психологических паттернов в отношениях
            </p>

            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={() => router.push(isAuthenticated ? '/analyze' : '/auth/register')}
                className="btn-primary text-lg px-8 py-4 group"
              >
                Начать анализ
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform inline" />
              </button>
              <button
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="btn-secondary text-lg px-8 py-4"
              >
                Узнать больше
              </button>
            </div>

            <div className="mt-12 flex items-center justify-center space-x-8 text-sm text-dark-400">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>1 анализ бесплатно</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>Без кредитной карты</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>Результат за 30 сек</span>
              </div>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {[
              { icon: Users, label: 'Анализов проведено', value: '10,000+' },
              { icon: Star, label: 'Точность анализа', value: '95%' },
              { icon: Zap, label: 'Среднее время', value: '30 сек' },
            ].map((stat, index) => (
              <div
                key={index}
                className="glass rounded-2xl p-6 text-center card-hover"
              >
                <stat.icon className="w-12 h-12 mx-auto mb-4 text-purple-400" />
                <div className="text-4xl font-bold text-gradient mb-2">{stat.value}</div>
                <div className="text-dark-400">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-bold mb-4">
              Что мы <span className="text-gradient">анализируем</span>
            </h2>
            <p className="text-xl text-dark-400">
              Глубокий AI-анализ всех аспектов отношений
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: AlertTriangle,
                title: 'Индекс токсичности',
                description: 'Оценка уровня токсичности отношений по шкале 0-100',
                color: 'text-red-400',
                bgColor: 'bg-red-900/20',
                borderColor: 'border-red-800',
              },
              {
                icon: Shield,
                title: 'Манипуляции',
                description: 'Выявление газлайтинга, эмоциональных качелей и других манипуляций',
                color: 'text-orange-400',
                bgColor: 'bg-orange-900/20',
                borderColor: 'border-orange-800',
              },
              {
                icon: Heart,
                title: 'Стиль привязанности',
                description: 'Определение типа привязанности обоих партнеров',
                color: 'text-pink-400',
                bgColor: 'bg-pink-900/20',
                borderColor: 'border-pink-800',
              },
              {
                icon: TrendingUp,
                title: 'Баланс власти',
                description: 'Кто доминирует и кто эмоционально зависим',
                color: 'text-purple-400',
                bgColor: 'bg-purple-900/20',
                borderColor: 'border-purple-800',
              },
              {
                icon: Brain,
                title: 'Психологический портрет',
                description: 'Архетипы, сильные стороны и уязвимости',
                color: 'text-blue-400',
                bgColor: 'bg-blue-900/20',
                borderColor: 'border-blue-800',
              },
              {
                icon: MessageSquare,
                title: 'Красные флаги',
                description: 'Конкретные признаки проблем в коммуникации',
                color: 'text-yellow-400',
                bgColor: 'bg-yellow-900/20',
                borderColor: 'border-yellow-800',
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`glass rounded-2xl p-6 border ${feature.borderColor} ${feature.bgColor} card-hover`}
              >
                <feature.icon className={`w-12 h-12 ${feature.color} mb-4`} />
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-dark-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 bg-dark-900/50">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-bold mb-4">
              Как это <span className="text-gradient">работает</span>
            </h2>
            <p className="text-xl text-dark-400">
              Всего 3 простых шага до результата
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Загрузите переписку',
                description: 'Вставьте текст диалога, скриншоты или ссылку на профиль',
                icon: MessageSquare,
              },
              {
                step: '02',
                title: 'AI анализирует',
                description: 'GigaChat обрабатывает данные и выявляет паттерны',
                icon: Brain,
              },
              {
                step: '03',
                title: 'Получите отчет',
                description: 'Детальный анализ с графиками и рекомендациями',
                icon: BarChart3,
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="relative"
              >
                <div className="glass rounded-2xl p-8 card-hover">
                  <div className="text-6xl font-bold text-dark-800 mb-4">{item.step}</div>
                  <item.icon className="w-12 h-12 text-purple-400 mb-4" />
                  <h3 className="text-2xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-dark-400">{item.description}</p>
                </div>
                {index < 2 && (
                  <div className="hidden md:block absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2">
                    <ArrowRight className="w-8 h-8 text-dark-700" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-bold mb-4">
              Простые <span className="text-gradient">цены</span>
            </h2>
            <p className="text-xl text-dark-400">
              Выберите подходящий тариф
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'Базовый',
                price: 'Бесплатно',
                description: 'Попробуйте сервис',
                features: [
                  '1 бесплатный анализ',
                  'Основные метрики',
                  'Индекс токсичности',
                  'Красные флаги',
                ],
                cta: 'Начать',
                highlighted: false,
              },
              {
                name: 'Расширенный',
                price: '599₽',
                description: 'Для глубокого анализа',
                features: [
                  'Все из базового',
                  'Стили привязанности',
                  'Психологический портрет',
                  'Детальные рекомендации',
                  'PDF отчет',
                ],
                cta: 'Купить',
                highlighted: true,
              },
              {
                name: 'PRO',
                price: '999₽',
                description: 'Максимум информации',
                features: [
                  'Все из расширенного',
                  'Прогноз отношений',
                  'Вероятность возврата',
                  'Кто уйдет первым',
                  'Приоритетная поддержка',
                ],
                cta: 'Купить PRO',
                highlighted: false,
              },
            ].map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`glass rounded-2xl p-8 ${
                  plan.highlighted
                    ? 'border-2 border-purple-500 glow scale-105'
                    : 'border border-dark-700'
                } card-hover relative`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Популярный
                    </span>
                  </div>
                )}

                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="text-4xl font-bold text-gradient mb-2">{plan.price}</div>
                <p className="text-dark-400 mb-6">{plan.description}</p>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-dark-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => router.push(isAuthenticated ? '/analyze' : '/auth/register')}
                  className={plan.highlighted ? 'btn-primary w-full' : 'btn-secondary w-full'}
                >
                  {plan.cta}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass rounded-3xl p-12 text-center border-2 border-purple-800 glow"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Готовы узнать правду?
            </h2>
            <p className="text-xl text-dark-300 mb-8">
              Начните анализ прямо сейчас. Первый анализ
              </p>
            <button
              onClick={() => router.push(isAuthenticated ? '/analyze' : '/auth/register')}
              className="btn-primary text-lg px-12 py-4"
            >
              Начать анализ
            </button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-dark-800 py-12 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gradient">RedMind AI</span>
              </div>
              <p className="text-dark-400 text-sm">
                AI-сервис анализа отношений нового поколения
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Продукт</h4>
              <ul className="space-y-2 text-sm text-dark-400">
                <li><a href="#features" className="hover:text-white transition-colors">Возможности</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Цены</a></li>
                <li><a href="/api/docs" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Компания</h4>
              <ul className="space-y-2 text-sm text-dark-400">
                <li><a href="#" className="hover:text-white transition-colors">О нас</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Блог</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Контакты</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Поддержка</h4>
              <ul className="space-y-2 text-sm text-dark-400">
                <li><a href="#" className="hover:text-white transition-colors">Telegram бот</a></li>
                <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Политика</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-dark-800 pt-8 flex flex-col md:flex-row items-center justify-between text-sm text-dark-400">
            <div>© 2024 RedMind AI. Все права защищены.</div>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <Lock className="w-4 h-4" />
              <span>Безопасное соединение</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}