import React from 'react';
import { Link } from 'react-router-dom';

interface PrimaryButtonProps {
  children: React.ReactNode;
  to?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  icon?: React.ReactNode;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  children,
  to,
  onClick,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  type = 'button',
  icon
}) => {
  const sizeStyles = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-3.5 text-base'
  }[size];

  const variantStyles = {
    primary:
      'bg-[#E5093F] hover:bg-[#FF3D61] text-[#F5F5F7] shadow-lg shadow-[#E5093F]/25 hover:shadow-[#E5093F]/40 border border-transparent',
    secondary:
      'bg-[#171A23] hover:bg-[#1E222E] text-[#F5F5F7] border border-[#292D38] hover:border-[#A1A5B3]/40',
    outline:
      'bg-transparent hover:bg-[#E5093F]/10 text-[#FF3D61] border border-[#E5093F] hover:border-[#FF3D61]'
  }[variant];

  const baseStyles =
    'inline-flex items-center justify-center gap-2 rounded-full font-bold tracking-wide transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

  const combinedClasses = `${baseStyles} ${sizeStyles} ${variantStyles} ${className}`;

  if (to) {
    return (
      <Link to={to} className={combinedClasses}>
        {icon}
        <span>{children}</span>
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={combinedClasses}>
      {icon}
      <span>{children}</span>
    </button>
  );
};
