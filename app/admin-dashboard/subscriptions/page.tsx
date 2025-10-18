'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface SubscriptionTier {
  _id: string;
  name: string;
  price: number;
  period: string;
  description: string;
  features: string[];
  activeUsers: number;
  revenue: number;
  color: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

interface SubscriptionAnalytics {
  totalSubscribers: number;
  monthlyRevenue: number;
  averageRevenuePerUser: number;
  churnRate: number;
  growthRate: number;
  revenueGrowth: number;
}

interface RecentChange {
  _id: string;
  user: {
    name: string;
    email: string;
  };
  action: string;
  tier: string;
  timestamp: string;
  type: 'upgrade' | 'downgrade' | 'cancel' | 'trial';
}

export default function SubscriptionManagementPage() {
  const [editingTier, setEditingTier] = useState<string | null>(null);
  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
  const [analytics, setAnalytics] = useState<SubscriptionAnalytics | null>(null);
  const [recentChanges, setRecentChanges] = useState<RecentChange[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [tiersRes, analyticsRes, changesRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/subscriptions`),
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/subscriptions/analytics`),
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/subscriptions/recent-changes`)
      ]);

      if (tiersRes.ok) {
        const tiersData = await tiersRes.json();
        setTiers(tiersData.tiers || []);
      }

      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        setAnalytics(analyticsData);
      }

      if (changesRes.ok) {
        const changesData = await changesRes.json();
        setRecentChanges(changesData.changes || []);
      }
    } catch (error) {
      console.error('Error fetching subscription data:', error);
      setError('Failed to fetch subscription data');
    } finally {
      setLoading(false);
    }
  };

  const handlePriceEdit = (tierId: string, newPrice: number) => {
    setEditingPrice(prev => ({ ...prev, [tierId]: newPrice }));
  };

  const handlePriceSave = async (tierId: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/subscriptions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tierId,
          price: editingPrice[tierId] || tiers.find(t => t._id === tierId)?.price
        }),
      });

      if (response.ok) {
        setTiers(prev => prev.map(tier => 
          tier._id === tierId 
            ? { ...tier, price: editingPrice[tierId] || tier.price }
            : tier
        ));
        setEditingPrice(prev => ({ ...prev, [tierId]: undefined }));
        setEditingTier(null);
      }
    } catch (error) {
      console.error('Error updating price:', error);
    }
  };

  const handlePriceCancel = (tierId: string) => {
    setEditingPrice(prev => ({ ...prev, [tierId]: undefined }));
    setEditingTier(null);
  };

  const totalRevenue = tiers.reduce((sum, tier) => sum + (tier.revenue || 0), 0);
  const totalUsers = tiers.reduce((sum, tier) => sum + (tier.activeUsers || 0), 0);
  
  // Calculate average revenue per user with proper null checks
  const calculateAverageRevenuePerUser = () => {
    console.log('Debug - analytics:', analytics);
    console.log('Debug - totalRevenue:', totalRevenue);
    console.log('Debug - totalUsers:', totalUsers);
    console.log('Debug - tiers:', tiers);
    
    if (analytics?.averageRevenuePerUser !== undefined) {
      return analytics.averageRevenuePerUser;
    }
    if (totalUsers > 0 && totalRevenue > 0) {
      return Math.round(totalRevenue / totalUsers);
    }
    return 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading subscription data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <p className="text-gray-400 mb-4">{error}</p>
          <button 
            onClick={fetchData}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Subscription <span className="text-red-500">Management</span>
          </h1>
          <p className="text-gray-400 text-lg">
            Manage pricing tiers and subscription features
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-white">
            ${analytics?.monthlyRevenue?.toLocaleString() || totalRevenue.toLocaleString()}
          </p>
          <p className="text-gray-400">Monthly Revenue</p>
        </div>
      </motion.div>

      {/* Overview Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
      >
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700 hover:border-red-500/50 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
            <span className="text-green-400 text-sm font-medium">
              {analytics?.growthRate ? `+${analytics.growthRate}%` : '+12%'}
            </span>
          </div>
          <div>
            <h3 className="text-gray-400 text-sm font-medium mb-1">Total Subscribers</h3>
            <p className="text-3xl font-bold text-white">
              {analytics?.totalSubscribers || totalUsers}
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700 hover:border-red-500/50 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-2xl">💰</span>
            </div>
            <span className="text-green-400 text-sm font-medium">
              {analytics?.revenueGrowth ? `+${analytics.revenueGrowth}%` : '+8%'}
            </span>
          </div>
          <div>
            <h3 className="text-gray-400 text-sm font-medium mb-1">Monthly Revenue</h3>
            <p className="text-3xl font-bold text-white">
              ${analytics?.monthlyRevenue?.toLocaleString() || totalRevenue.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700 hover:border-red-500/50 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-2xl">📈</span>
            </div>
            <span className="text-green-400 text-sm font-medium">+15%</span>
          </div>
          <div>
            <h3 className="text-gray-400 text-sm font-medium mb-1">Avg. Revenue/User</h3>
            <p className="text-3xl font-bold text-white">
              ${calculateAverageRevenuePerUser()}
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700 hover:border-red-500/50 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🔄</span>
            </div>
            <span className="text-red-400 text-sm font-medium">-3%</span>
          </div>
          <div>
            <h3 className="text-gray-400 text-sm font-medium mb-1">Churn Rate</h3>
            <p className="text-3xl font-bold text-white">
              {analytics?.churnRate || 3.2}%
            </p>
          </div>
        </div>
      </motion.div>

      {/* Subscription Tiers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {tiers.map((tier, index) => (
          <motion.div
            key={tier._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            whileHover={{ y: -5, scale: 1.02 }}
            className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700 hover:border-red-500/50 transition-all duration-300 shadow-lg hover:shadow-red-500/20 group"
          >
            {/* Tier Header */}
            <div className="text-center mb-6">
              <div className={`w-16 h-16 bg-gradient-to-br ${tier.color} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">{tier.name}</h3>
              <p className="text-gray-400 text-sm mb-4">{tier.description}</p>
              
              {/* Price */}
              <div className="mb-4">
                {editingTier === tier._id ? (
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-white text-2xl">$</span>
                    <input
                      type="number"
                      value={editingPrice[tier._id] || tier.price}
                      onChange={(e) => handlePriceEdit(tier._id, parseInt(e.target.value))}
                      className="w-20 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-2xl font-bold text-center focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                    <span className="text-gray-400 text-lg">/{tier.period}</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-white text-4xl font-bold">${tier.price}</span>
                    <span className="text-gray-400 text-lg">/{tier.period}</span>
                    <button
                      onClick={() => setEditingTier(tier._id)}
                      className="ml-2 text-gray-400 hover:text-white transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </div>
                )}
                
                {editingTier === tier._id && (
                  <div className="flex space-x-2 mt-2 justify-center">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handlePriceSave(tier._id)}
                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm transition-colors"
                    >
                      Save
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handlePriceCancel(tier._id)}
                      className="bg-gray-600 hover:bg-gray-500 text-white px-3 py-1 rounded text-sm transition-colors"
                    >
                      Cancel
                    </motion.button>
                  </div>
                )}
              </div>
            </div>

            {/* Features */}
            <div className="mb-6">
              <h4 className="text-white font-medium mb-3">Features</h4>
              <ul className="space-y-2">
                {tier.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-300 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Stats */}
            <div className="border-t border-gray-700 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{tier.activeUsers}</div>
                  <div className="text-gray-400 text-xs">Active Users</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">${tier.revenue.toLocaleString()}</div>
                  <div className="text-gray-400 text-xs">Monthly Revenue</div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 space-y-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-3 rounded-xl transition-all duration-300"
              >
                Edit Tier
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 rounded-xl transition-all duration-300"
              >
                View Analytics
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Revenue Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700"
      >
        <h3 className="text-xl font-bold text-white mb-6">Revenue Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map((tier, index) => (
            <div key={tier._id} className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-300 font-medium">{tier.name}</span>
                <span className="text-white font-bold">${tier.revenue.toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(tier.revenue / totalRevenue) * 100}%` }}
                  transition={{ duration: 1, delay: index * 0.2 }}
                  className={`h-full bg-gradient-to-r ${tier.color} rounded-full`}
                />
              </div>
              <div className="text-right">
                <span className="text-gray-400 text-sm">
                  {((tier.revenue / totalRevenue) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Recent Changes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700"
      >
        <h3 className="text-xl font-bold text-white mb-6">Recent Subscription Changes</h3>
        <div className="space-y-4">
          {recentChanges.length > 0 ? recentChanges.map((change, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex items-center justify-between p-4 bg-gray-700/30 rounded-xl hover:bg-gray-700/50 transition-all duration-300"
            >
              <div className="flex items-center space-x-4">
                <div className={`w-3 h-3 rounded-full ${
                  change.type === 'upgrade' ? 'bg-green-500' :
                  change.type === 'downgrade' ? 'bg-yellow-500' :
                  change.type === 'cancel' ? 'bg-red-500' : 'bg-blue-500'
                }`}></div>
                <div>
                  <p className="text-white font-medium">{change.user.name}</p>
                  <p className="text-gray-400 text-sm">{change.action}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-gray-300 text-sm">{change.tier}</span>
                <p className="text-gray-400 text-xs">{new Date(change.timestamp).toLocaleString()}</p>
              </div>
            </motion.div>
          )) : (
            <div className="text-center py-8">
              <p className="text-gray-400">No recent subscription changes</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
