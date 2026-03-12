import React from 'react';
import './Button.css';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { 
      variant = 'primary', 
      size = 'md', 
      children, 
      loading = false, 
      icon,
      disabled,
      ...props 
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={`btn btn-${variant} btn-${size} ${loading ? 'btn-loading' : ''}`}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <span className="spinner" />}
        {icon && <span className="btn-icon">{icon}</span>}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
