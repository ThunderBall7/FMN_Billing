import { useCallback, useEffect, useRef } from 'react';
import DOMPurify from 'dompurify';

export default function RichEditor({ value, onChange, placeholder }) {
  const ref = useRef(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (ref.current && !isInitialized.current) {
      ref.current.innerHTML = DOMPurify.sanitize(value || '');
      isInitialized.current = true;
    }
  }, []);

  useEffect(() => {
    if (ref.current && isInitialized.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = DOMPurify.sanitize(value || '');
    }
  }, [value]);

  const handleInput = useCallback(() => {
    if (ref.current) onChange(ref.current.innerHTML);
  }, [onChange]);

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      className="form-input rich-editor"
      onInput={handleInput}
      style={{ minHeight: '100px', whiteSpace: 'pre-wrap' }}
      data-placeholder={placeholder}
    />
  );
}
