import { AlertCircle } from 'lucide-react';

export default function Input({
  label,
  error,
  icon: Icon = null,
  type = 'text',
  id,
  className = '',
  ...props
}) {
  const inputId = id || props.name;

  return (
    <div className={`input-field-group ${className}`}>
      {label && (
        <label htmlFor={inputId} className={`input-label ${error ? 'label-error' : ''}`}>
          {label}
        </label>
      )}
      <div className="input-wrapper">
        {Icon && <Icon size={18} className={`input-icon ${error ? 'icon-error' : ''}`} />}
        <input
          id={inputId}
          type={type}
          className={`custom-input ${Icon ? 'has-icon' : ''} ${error ? 'input-error' : ''}`}
          {...props}
        />
      </div>
      {error && (
        <span className="input-error-msg" role="alert">
          <AlertCircle size={14} className="flex-shrink-0" />
          <span>{error}</span>
        </span>
      )}
    </div>
  );
}
