import { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: () => void;
  className?: string;
  asChild?: boolean;
}

const variants = {
  primary: 'bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-md text-white font-semibold',
  secondary: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 hover:border-slate-400 font-medium',
  success: 'bg-gradient-to-r from-green-600 to-emerald-600 hover:shadow-md text-white font-semibold',
  danger: 'bg-gradient-to-r from-red-500 to-pink-500 hover:shadow-md text-white font-semibold',
  ghost: 'bg-transparent hover:bg-slate-100 text-slate-700 font-medium',
};

const sizes = {
  sm: 'px-3 py-2 text-sm rounded-lg',
  md: 'px-4 py-2.5 rounded-xl',
  lg: 'px-6 py-3 text-lg rounded-xl',
};

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  disabled = false,
  type = 'button',
  onClick,
  className = '',
  asChild = false
}: ButtonProps) {
  const buttonClasses = `
    inline-flex items-center justify-center gap-2
    transition-all duration-200 ease-in-out
    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
    active:transform active:scale-95
    ${variants[variant]}
    ${sizes[size]}
    ${className}
  `;

  if (asChild) {
    return (
      <span className={buttonClasses}>
        {children}
      </span>
    );
  }

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={buttonClasses}
    >
      {children}
    </button>
  );
} 