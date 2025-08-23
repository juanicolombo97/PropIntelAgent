import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: 'px-3 py-2 text-sm rounded-lg',
  md: 'px-4 py-3 rounded-xl',
  lg: 'px-5 py-4 text-lg rounded-xl',
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, size = 'md', className = '', ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-semibold text-slate-700">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full border rounded-xl transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            disabled:bg-slate-50 disabled:cursor-not-allowed
            placeholder:text-slate-400
            ${error ? 'border-red-300 focus:ring-red-500' : 'border-slate-300 focus:border-blue-500'}
            ${sizes[size]}
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="text-sm text-red-600 font-medium">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input'; 