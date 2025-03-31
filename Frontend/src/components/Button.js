import React from 'react';

const Button = ({ 
  children, 
  color = 'primary', 
  onClick, 
  className = '', 
  type = 'button',
  disabled = false,
  fullWidth = false,
  size = 'md',
  icon = null,
  iconPosition = 'right',
  outline = false
}) => {
  // Base classes
  const baseClasses = "relative font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  // Size classes
  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-6 py-2.5 text-sm",
    lg: "px-8 py-3 text-base"
  };
  
  // Color classes based on outline prop
  const colorClasses = outline ? {
    primary: "bg-transparent text-navy border border-navy hover:bg-navy-light hover:text-white focus:ring-navy",
    secondary: "bg-transparent text-gold-dark border border-gold hover:bg-gold-light focus:ring-gold",
    accent: "bg-transparent text-sage border border-sage hover:bg-sage-light hover:text-white focus:ring-sage",
    navy: "bg-transparent text-navy border border-navy hover:bg-navy-light hover:text-white focus:ring-navy",
    gold: "bg-transparent text-gold-dark border border-gold hover:bg-gold-light focus:ring-gold",
    sage: "bg-transparent text-sage border border-sage hover:bg-sage-light hover:text-white focus:ring-sage",
  } : {
    primary: "bg-navy text-white shadow-soft hover:bg-navy-light focus:ring-navy",
    secondary: "bg-offwhite text-navy border border-gold shadow-soft hover:bg-gold-light focus:ring-gold",
    accent: "bg-gold text-navy shadow-soft hover:bg-gold-dark focus:ring-gold",
    navy: "bg-navy text-white shadow-soft hover:bg-navy-light focus:ring-navy",
    gold: "bg-gold text-navy shadow-soft hover:bg-gold-dark focus:ring-gold",
    sage: "bg-sage text-white shadow-soft hover:bg-sage-light focus:ring-sage",
  };
  
  // Width classes
  const widthClass = fullWidth ? "w-full" : "";
  
  // Disabled classes
  const disabledClasses = disabled ? "opacity-50 cursor-not-allowed" : "";

  // Shape classes
  const shapeClass = "rounded-md";
  
  // Combine all classes
  const buttonClasses = `${baseClasses} ${sizeClasses[size]} ${colorClasses[color]} ${widthClass} ${disabledClasses} ${shapeClass} ${className}`;
  
  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled}
    >
      <div className="relative z-10 flex items-center justify-center">
        {icon && iconPosition === 'left' && (
          <span className="mr-2">{icon}</span>
        )}
        {children}
        {icon && iconPosition === 'right' && (
          <span className="ml-2">{icon}</span>
        )}
      </div>
    </button>
  );
};

export default Button; 