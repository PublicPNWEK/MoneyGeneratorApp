import React from 'react';
import { useAppContext } from '../context/AppContext';

export const ProductsPage: React.FC = () => {
  const { products, openCheckout, connectBank } = useAppContext();

  return (
    <div className="products-page">
      <div className="hero">
        <h2>Maximize Your Earnings</h2>
        <p>Choose the plan that works best for your gig economy needs</p>
        <div className="hero-buttons">
          <button className="btn-primary" onClick={openCheckout}>
            View Plans
          </button>
          <button className="btn-secondary" onClick={connectBank}>
            Connect Bank
          </button>
        </div>
      </div>

      <section className="products">
        <h2>Featured Products</h2>
        <div className="products-grid">
          {products.map((product) => (
            <div key={product.id} className="product-card">
              <span className="product-type">{product.type}</span>
              <h3>{product.name}</h3>
              <p className="product-description">{product.description}</p>
              <div className="product-footer">
                <span className="product-price">{product.price}</span>
                <button
                  className="btn-primary"
                  onClick={openCheckout}
                >
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
