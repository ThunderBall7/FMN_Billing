import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { formatCurrency } from '../utils';

const PrivacyContext = createContext(null);

const STORAGE_KEY = 'fmnBilling_privacyMode';

const maskText = (value) => {
  const text = String(value ?? '');
  const length = Math.min(Math.max(text.length, 4), 16);
  return '•'.repeat(length);
};

export function PrivacyProvider({ children }) {
  const [privacyMode, setPrivacyMode] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? saved === 'hidden' : true;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, privacyMode ? 'hidden' : 'visible');
    document.documentElement.setAttribute('data-privacy', privacyMode ? 'hidden' : 'visible');
  }, [privacyMode]);

  const value = useMemo(() => ({
    privacyMode,
    setPrivacyMode,
    togglePrivacyMode: () => setPrivacyMode((current) => !current),
  }), [privacyMode]);

  return (
    <PrivacyContext.Provider value={value}>
      {children}
    </PrivacyContext.Provider>
  );
}

function usePrivacy() {
  return useContext(PrivacyContext) || {
    privacyMode: false,
    setPrivacyMode: () => {},
    togglePrivacyMode: () => {},
  };
}

export function PrivateValue({
  as: Component = 'span',
  children,
  className = '',
  value,
  title,
  ...props
}) {
  const { privacyMode } = usePrivacy();
  const Element = Component;
  const visibleValue = value ?? children ?? '';
  const classes = ['private-value', privacyMode ? 'private-value-hidden' : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <Element
      className={classes}
      title={privacyMode ? 'Hidden for privacy' : title}
      aria-label={privacyMode ? 'Hidden private value' : undefined}
      {...props}
    >
      {privacyMode ? maskText(visibleValue) : visibleValue}
    </Element>
  );
}

export function PrivateAmount({ amount, currency = 'INR', ...props }) {
  const formatted = formatCurrency(amount, currency);
  return <PrivateValue value={formatted} {...props} />;
}

export function PrivacyToggleButton() {
  const { privacyMode, togglePrivacyMode } = usePrivacy();

  return (
    <button
      className={`nav-btn privacy-toggle ${privacyMode ? '' : 'privacy-toggle-visible'}`}
      onClick={togglePrivacyMode}
      title={privacyMode ? 'Show amounts and numbers' : 'Hide amounts and numbers'}
      aria-pressed={!privacyMode}
    >
      {privacyMode ? <Eye size={18} /> : <EyeOff size={18} />}
      {privacyMode ? 'Show Nums' : 'Hide Nums'}
    </button>
  );
}
