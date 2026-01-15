import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Prediction } from '../store/useWebSocketStore';

interface Brand {
  id: string;
  name: string;
  product_count: number;
}

interface CoverageStats {
  totalProducts: number;
  totalBrands: number;
  productionReadyBrands: number;
  developingBrands: number;
  emptyBrands: number;
  avgProductsPerBrand: number;
  topBrands: Array<{ name: string; count: number }>;
  coverageScore: number; // Percentage of brands with products
}

interface ProductCoverageStatsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProductCoverageStats: React.FC<ProductCoverageStatsProps> = ({ isOpen, onClose }) => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [products, setProducts] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [brandsRes, productsRes] = await Promise.all([
          fetch(`/api/brands?v=${Date.now()}`, { cache: 'no-store' }),
          fetch(`/api/products?v=${Date.now()}`, { cache: 'no-store' })
        ]);
        
        const brandsData = await brandsRes.json();
        const productsData = await productsRes.json();
        
        if (brandsData.brands) setBrands(brandsData.brands);
        if (productsData.products) setProducts(productsData.products);
      } catch (error) {
        console.error('Failed to fetch coverage data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isOpen]);

  const stats: CoverageStats = useMemo(() => {
    const totalProducts = products.length;
    const totalBrands = brands.length;
    const productionReadyBrands = brands.filter(b => b.product_count >= 5).length;
    const developingBrands = brands.filter(b => b.product_count > 0 && b.product_count < 5).length;
    const emptyBrands = brands.filter(b => b.product_count === 0).length;
    const avgProductsPerBrand = totalBrands > 0 ? Math.round(totalProducts / totalBrands) : 0;
    const brandsWithProducts = brands.filter(b => b.product_count > 0).length;
    const coverageScore = totalBrands > 0 ? Math.round((brandsWithProducts / totalBrands) * 100) : 0;
    
    const topBrands = [...brands]
      .sort((a, b) => b.product_count - a.product_count)
      .slice(0, 10)
      .map(b => ({ name: b.name, count: b.product_count }));

    return {
      totalProducts,
      totalBrands,
      productionReadyBrands,
      developingBrands,
      emptyBrands,
      avgProductsPerBrand,
      topBrands,
      coverageScore
    };
  }, [brands, products]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative bg-bg-card border border-border-strong rounded-2xl shadow-2xl max-w-5xl w-full max-h-[85vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="px-8 py-6 border-b border-border-subtle bg-gradient-to-r from-accent-primary/10 to-accent-secondary/10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-text-primary flex items-center gap-3">
                  <span className="text-4xl">📊</span>
                  Products Coverage Statistics
                </h2>
                <p className="text-sm text-text-muted mt-1">
                  Comprehensive analysis of catalog coverage across all brands
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-2xl text-text-muted hover:text-text-primary transition-colors"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-8">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="text-5xl mb-4 animate-pulse">📊</div>
                  <p className="text-text-muted">Loading coverage data...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Overview Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gradient-to-br from-status-success/20 to-status-success/5 border border-status-success/30 rounded-xl p-6"
                  >
                    <div className="text-3xl mb-2">📦</div>
                    <div className="text-4xl font-bold text-status-success mb-1">
                      {stats.totalProducts.toLocaleString()}
                    </div>
                    <div className="text-xs text-text-muted uppercase tracking-wider">Total Products</div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="bg-gradient-to-br from-accent-primary/20 to-accent-primary/5 border border-accent-primary/30 rounded-xl p-6"
                  >
                    <div className="text-3xl mb-2">🏢</div>
                    <div className="text-4xl font-bold text-accent-primary mb-1">
                      {stats.totalBrands}
                    </div>
                    <div className="text-xs text-text-muted uppercase tracking-wider">Total Brands</div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-br from-accent-secondary/20 to-accent-secondary/5 border border-accent-secondary/30 rounded-xl p-6"
                  >
                    <div className="text-3xl mb-2">📈</div>
                    <div className="text-4xl font-bold text-accent-secondary mb-1">
                      {stats.avgProductsPerBrand}
                    </div>
                    <div className="text-xs text-text-muted uppercase tracking-wider">Avg/Brand</div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="bg-gradient-to-br from-accent-primary/20 to-accent-secondary/20 border border-accent-primary/30 rounded-xl p-6"
                  >
                    <div className="text-3xl mb-2">🎯</div>
                    <div className="text-4xl font-bold text-accent-primary mb-1">
                      {stats.coverageScore}%
                    </div>
                    <div className="text-xs text-text-muted uppercase tracking-wider">Coverage Score</div>
                  </motion.div>
                </div>

                {/* Brand Distribution */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-bg-surface/50 border border-border-subtle rounded-xl p-6"
                >
                  <h3 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
                    <span>📊</span>
                    Brand Distribution by Product Count
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-5xl font-bold text-status-success mb-2">
                        {stats.productionReadyBrands}
                      </div>
                      <div className="text-sm font-semibold text-text-primary mb-1">Production Ready</div>
                      <div className="text-xs text-text-muted">≥ 5 products</div>
                      <div className="mt-3 bg-status-success/20 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-status-success h-full transition-all duration-500"
                          style={{ width: `${(stats.productionReadyBrands / stats.totalBrands) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-5xl font-bold text-accent-primary mb-2">
                        {stats.developingBrands}
                      </div>
                      <div className="text-sm font-semibold text-text-primary mb-1">In Development</div>
                      <div className="text-xs text-text-muted">1-4 products</div>
                      <div className="mt-3 bg-accent-primary/20 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-accent-primary h-full transition-all duration-500"
                          style={{ width: `${(stats.developingBrands / stats.totalBrands) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-5xl font-bold text-text-muted mb-2">
                        {stats.emptyBrands}
                      </div>
                      <div className="text-sm font-semibold text-text-primary mb-1">No Products</div>
                      <div className="text-xs text-text-muted">0 products</div>
                      <div className="mt-3 bg-text-muted/20 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-text-muted h-full transition-all duration-500"
                          style={{ width: `${(stats.emptyBrands / stats.totalBrands) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Top Brands */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="bg-bg-surface/50 border border-border-subtle rounded-xl p-6"
                >
                  <h3 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
                    <span>🏆</span>
                    Top 10 Brands by Product Count
                  </h3>
                  <div className="space-y-3">
                    {stats.topBrands.map((brand, idx) => {
                      const maxCount = stats.topBrands[0]?.count || 1;
                      const percentage = (brand.count / maxCount) * 100;
                      
                      return (
                        <motion.div
                          key={brand.name}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 + idx * 0.05 }}
                          className="flex items-center gap-3"
                        >
                          <div className="w-6 text-center font-mono text-sm font-bold text-accent-primary">
                            #{idx + 1}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-semibold text-text-primary">{brand.name}</span>
                              <span className="text-sm font-mono font-bold text-status-success">
                                {brand.count} products
                              </span>
                            </div>
                            <div className="bg-bg-card rounded-full h-2 overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${percentage}%` }}
                                transition={{ delay: 0.5 + idx * 0.05, duration: 0.5 }}
                                className="bg-gradient-to-r from-accent-primary to-accent-secondary h-full"
                              />
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>

                {/* Coverage Insights */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-gradient-to-br from-accent-primary/10 to-accent-secondary/10 border border-accent-primary/30 rounded-xl p-6"
                >
                  <h3 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
                    <span>💡</span>
                    Coverage Insights
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-3">
                      <span className="text-xl">✅</span>
                      <div>
                        <p className="font-semibold text-text-primary">
                          {stats.coverageScore}% Brand Coverage
                        </p>
                        <p className="text-text-muted">
                          {stats.productionReadyBrands + stats.developingBrands} out of {stats.totalBrands} brands have products in the catalog
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-xl">🎯</span>
                      <div>
                        <p className="font-semibold text-text-primary">
                          {stats.productionReadyBrands} Production-Ready Brands
                        </p>
                        <p className="text-text-muted">
                          {Math.round((stats.productionReadyBrands / stats.totalBrands) * 100)}% of brands are production-ready with 5+ products
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-xl">🚀</span>
                      <div>
                        <p className="font-semibold text-text-primary">
                          {stats.developingBrands} Brands in Development
                        </p>
                        <p className="text-text-muted">
                          These brands are being actively populated and will reach production soon
                        </p>
                      </div>
                    </div>
                    {stats.emptyBrands > 0 && (
                      <div className="flex items-start gap-3">
                        <span className="text-xl">⏳</span>
                        <div>
                          <p className="font-semibold text-text-primary">
                            {stats.emptyBrands} Brands Awaiting Products
                          </p>
                          <p className="text-text-muted">
                            These brands are registered but don't have products yet - pipeline opportunity
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-8 py-4 border-t border-border-subtle bg-bg-base/50 flex items-center justify-between">
            <div className="text-xs text-text-muted">
              Last updated: {new Date().toLocaleString()}
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-accent-primary text-text-primary rounded-lg font-semibold hover:bg-accent-primary/80 transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
