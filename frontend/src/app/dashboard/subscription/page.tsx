'use client';

import { motion } from 'framer-motion';
import {
  Crown,
  Check,
  Zap,
  TrendingUp,
  Shield,
  Sparkles,
  CreditCard,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function SubscriptionPage() {
  const { user } = useAuth();

  const handleSubscribe = (plan: string) => {
    toast.error('Оплата пока не подключена');
  };

  const plans = [
    {
      name: 'Free',
      price: '0₽',
      period: 'навсегда',
      features: [
        '1 бесплатный анализ',
        'Базовые метрики',
        'Индекс токсичности',
        'Красные флаги',
      ],
      icon: Shield,
      current: !user?.is_premium,
    },
    {
      name: 'Premium',
      price: '999₽',
      period: 'в месяц',
      features: [
        'Безлимитные анализы',
        'Все типы анализов',
        'PDF отчеты',
        'Прогнозы отношений',
        'Приоритетная поддержка',
        'История без ограничений',
      ],
      icon: Crown,
      highlighted: true,
      current: user?.is_premium,
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2">Подписка</h1>
        <p className="text-dark-400 text-lg">
          Выберите план, который подходит вам
        </p>
      </div>

      {/* Current plan */}
      {user?.is_premium && user.premium_until && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl border-2 border-purple-800 bg-gradient-to-r from-purple-900/20 to-pink-900/20 p-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Crown className="w-8 h-8 text-purple-400" />
              <div>
                <h3 className="text-xl font-semibold">Premium активен</h3>
                <p className="text-dark-400">
                  Действует до {formatDate(user.premium_until)}
                </p>
              </div>
            </div>
            <button className="btn-secondary">
              Управление подпиской
            </button>
          </div>
        </motion.div>
      )}

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {plans.map((plan, index) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`
              glass rounded-2xl p-8 relative
              ${plan.highlighted
                ? 'border-2 border-purple-500 glow scale-105'
                : 'border border-dark-800'
              }
            `}
          >
            {plan.highlighted && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Рекомендуем
                </span>
              </div>
            )}

            {plan.current && (
              <div className="absolute top-4 right-4">
                <span className="badge badge-success">Текущий</span>
              </div>
            )}

            <div className="mb-6">
              <plan.icon className={`w-12 h-12 mb-4 ${plan.highlighted ? 'text-purple-400' : 'text-dark-400'}`} />
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <div className="flex items-baseline space-x-2 mb-1">
                <span className="text-4xl font-bold text-gradient">{plan.price}</span>
                <span className="text-dark-400">/ {plan.period}</span>
              </div>
            </div>

            <ul className="space-y-3 mb-8">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-start space-x-2">
                  <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-dark-300">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSubscribe(plan.name)}
              disabled={plan.current}
              className={`
                w-full py-3 rounded-lg font-semibold transition-all
                ${plan.current
                  ? 'bg-dark-800 text-dark-500 cursor-not-allowed'
                  : plan.highlighted
                  ? 'btn-primary'
                  : 'btn-secondary'
                }
              `}
            >
              {plan.current ? 'Активен' : 'Выбрать план'}
            </button>
          </motion.div>
        ))}
      </div>

      {/* Payment methods */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass rounded-2xl border border-dark-800 p-6"
      >
        <h3 className="text-xl font-semibold mb-4 flex items-center space-x-2">
          <CreditCard className="w-6 h-6 text-purple-400" />
          <span>Способы оплаты</span>
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['Visa', 'Mastercard', 'МИР', 'ЮKassa'].map((method) => (
            <div
              key={method}
              className="bg-dark-800/50 rounded-lg p-4 text-center text-dark-400 border border-dark-700"
            >
              {method}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}