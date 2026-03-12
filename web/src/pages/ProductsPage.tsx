import React from 'react';
import { useAppContext } from '../context/AppContext';

export const ProductsPage: React.FC = () => {
  const { products, openCheckout, connectBank } = useAppContext();

  return (
    <div className="products-page">
      <div className="card elevated" style={{ textAlign: 'center', padding: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
        <h2 style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>Maximize Your Earnings</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>Choose the plan that works best for your gig economy needs</p>
        <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="button primary" onClick={openCheckout}>
            View Plans
          </button>
          <button className="button secondary" onClick={connectBank}>
            Connect Bank
          </button>
        </div>
      </div>

      <section style={{ marginBottom: 'var(--space-6)' }}>
        <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>Featured Products</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--space-4)' }}>
          {products.map((product) => (
            <div key={product.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ marginBottom: 'var(--space-3)' }}>
                <span className="badge bg-emerald-100 text-emerald-700">{product.type}</span>
              </div>
              <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>{product.name}</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-4)', flex: 1 }}>{product.description}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: 'var(--space-3)' }}>
                <span style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-emerald-600)' }}>{product.price}</span>
                <button className="button primary" onClick={openCheckout}>
                  Select
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
