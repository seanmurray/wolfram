import { useEffect, useRef, useState } from 'react';

// Controlled numeric input that tolerates in-progress decimal typing.
//
// Why not <input type="number">: for a controlled input it makes decimals
// impossible to type. While the raw text sits at an intermediate state like
// "12." the spec says the value is not a valid floating-point number, so
// `e.target.value` returns "" — the onChange handler then reports null, the
// parent clears the field, and the decimal point can never be entered. (Same
// for a leading "." or a trailing "-".)
//
// So we render type="text" with inputMode="decimal" (still gets the numeric
// keypad with a decimal key on iOS) and keep the RAW STRING in local state.
// The parent only ever sees a parsed number (or null). We re-sync from the
// prop only when it changes to something that isn't what the user is
// currently typing, so an external reset lands but keystrokes aren't clobbered.
export function NumField({
  value,                 // number | null | undefined
  onChange,              // (number | null) => void
  decimal = true,        // false → integer-only keypad + no "." accepted
  className,
  placeholder = '—',
  'aria-label': ariaLabel,
  ...rest
}) {
  const [raw, setRaw] = useState(value == null ? '' : String(value));
  // Tracks what we last reported upward, so an echoed prop doesn't reset `raw`.
  const lastEmitted = useRef(value ?? null);

  useEffect(() => {
    const incoming = value ?? null;
    if (incoming !== lastEmitted.current) {
      // Changed by something other than this field (reset, load from storage).
      setRaw(incoming == null ? '' : String(incoming));
      lastEmitted.current = incoming;
    }
  }, [value]);

  const handle = (e) => {
    let next = e.target.value;

    // Keep only characters that can form a number. Allows a lone "." or a
    // trailing "." mid-typing; parsing below just yields null until it's real.
    next = decimal
      ? next.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1')
      : next.replace(/[^0-9]/g, '');

    setRaw(next);

    const parsed = next === '' ? null : Number(next);
    const emit = Number.isFinite(parsed) ? parsed : null;
    lastEmitted.current = emit;
    onChange(emit);
  };

  return (
    <input
      type="text"
      inputMode={decimal ? 'decimal' : 'numeric'}
      className={className}
      value={raw}
      onChange={handle}
      placeholder={placeholder}
      aria-label={ariaLabel}
      {...rest}
    />
  );
}
