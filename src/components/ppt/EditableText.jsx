import { useEffect, useRef } from 'react';

export default function EditableText({
  value = '',
  onChange,
  onBlur,
  className = '',
  placeholder = '',
  tag: Tag = 'div',
  style = {},
  singleLine = false,
  ...props
}) {
  const elementRef = useRef(null);

  // Sync value from props when it changes from outside (e.g. undo/redo or AI restyle)
  useEffect(() => {
    if (elementRef.current && elementRef.current.innerText !== value) {
      elementRef.current.innerText = value || '';
    }
  }, [value]);

  const handleInput = (e) => {
    const text = e.currentTarget.innerText || '';
    if (onChange) {
      onChange(text);
    }
  };

  const handleKeyDown = (e) => {
    if (singleLine && e.key === 'Enter') {
      e.preventDefault();
      elementRef.current?.blur();
    }
  };

  return (
    <Tag
      ref={elementRef}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      onInput={handleInput}
      onBlur={onBlur}
      onKeyDown={handleKeyDown}
      className={`outline-none transition cursor-text select-text ${className}`}
      style={style}
      data-placeholder={placeholder}
      {...props}
    />
  );
}
