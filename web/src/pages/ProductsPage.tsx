import React, { useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import './ProductsPage.css';

// Added mock data for products if context doesn't provide it
const DEFAULT_PRODUCTS = [
  {
    id: 'starter',
    name: 'Starter Plan',
    description: 'Perfect for getting started with gig economy tracking.',
    price: '$0/mo',
    type: 'Free',
    features: ['Basic Income Tracking', 'Expense Logging', 'Community Access']
  },
  {
    id: 'pro',
    name: 'Pro Plan',
    description: 'Advanced analytics and automated tax estimates.',
    price: '$9.99/mo',
    type: 'Popular',
    features: ['Everything in Free', 'Tax Estimates', 'Unlimited Reports', 'Priority Support']
  },
  {
    id: 'business',
    name: 'Business Plan',
    description: 'For power users managing multiple income streams.',
    price: '$29.99/mo',
    type: 'Business',
    features: ['Everything in Pro', 'Team Access', 'Custom Invoicing', 'Dedicated Account Manager']
  }
];

export const ProductsPage: React.FC = () => {
  const { products: contextProducts, openCheckout, connectBank } = useAppContext();
  const [products, setProducts] = useState(contextProducts);

  useEffect(() => {
    if (!contextProducts || contextProducts.length === 0) {
      setProducts(DEFAULT_PRODUCTS as any);
    } else {
      setProducts(contextProducts);
    }
  }, [contextProducts]);

  return (
    <div className="products-page">
      <div className="products-banner">
        <h2>Maximize Your Earnings</h2>
        <p>Choose the plan that works best for your gig economy needs</p>
        <div className="products-actions">
          <button className="button primary" onClick={openCheckout}>
            View Plans
          </button>
          <button className="button secondary" onClick={connectBank}>
            Connect Bank
          </button>
        </div>
      </div>

      <div className="featured-section">
        <h3 className="featured-title">Featured Products</h3>
        <div className="products-grid">
          {products.map((product: any) => (
            <div key={product.id} className="product-card">
              <div className="product-badge-wrapper">
                <span className={`badge ${product.type === 'Popular' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}`}>
                  {product.type}
                </span>
              </div>
              <h3 className="product-title">{product.name}</h3>
              <p className="product-description">{product.description}</p>
              
              {product.features && (
                <ul className="product-features">
                  {product.features.map((feature: string, idx: number) => (
                    <li key={idx}>✓ {feature}</li>
                  ))}
                </ul>
              )}

              <div className="product-footer">
                <span className="product-price">{product.price}</span>
                <button className="button primary" onClick={openCheckout}>
                  Select
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
