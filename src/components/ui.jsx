import { forwardRef, useState, useEffect } from 'react'
import clsx from 'clsx'

/* ─── INPUT ─────────────────────────────────────────── */
export const Input = forwardRef(({ label, error, hint, required, counter, maxLength, className, ...props }, ref) => {
  const [len, setLen] = useState(0)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {label && (
        <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-2)', letterSpacing: '.04em', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between' }}>
          <span>{label}{required && <span style={{ color: 'var(--red)', marginLeft: 2 }}>*</span>}</span>
          {counter && maxLength && <span style={{ fontFamily: 'var(--mono)', fontWeight: 400, color: 'var(--text-3)' }}>{len} / {maxLength}</span>}
        </label>
      )}
      <input
        ref={ref}
        maxLength={maxLength}
        className={clsx('mp-input', error && 'mp-input--error', className)}
        onInput={e => setLen(e.target.value.length)}
        {...props}
        style={{
          width: '100%',
          padding: '9px 12px',
          border: `1px solid ${error ? 'var(--red)' : 'var(--border)'}`,
          borderRadius: 'var(--radius)',
          fontSize: 14,
          color: 'var(--text)',
          background: error ? 'var(--red-light)' : 'var(--surface)',
          outline: 'none',
          transition: 'border-color .15s, box-shadow .15s',
          fontFamily: 'var(--font)',
          ...props.style,
        }}
        onFocus={e => { e.target.style.borderColor = error ? 'var(--red)' : 'var(--red)'; e.target.style.boxShadow = `0 0 0 3px ${error ? 'rgba(196,30,58,.1)' : 'rgba(196,30,58,.08)'}` }}
        onBlur={e => { e.target.style.borderColor = error ? 'var(--red)' : 'var(--border)'; e.target.style.boxShadow = 'none' }}
      />
      {hint && !error && <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{hint}</span>}
      {error && (
        <div style={{ fontSize: 12, color: 'var(--red)', background: 'var(--red-light)', borderLeft: '2px solid var(--red)', padding: '5px 10px', borderRadius: '0 var(--radius-sm) var(--radius-sm) 0' }}>
          {error}
        </div>
      )}
    </div>
  )
})
Input.displayName = 'Input'

/* ─── SELECT ────────────────────────────────────────── */
export const Select = forwardRef(({ label, error, required, children, hint, ...props }, ref) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    {label && (
      <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-2)', letterSpacing: '.04em', textTransform: 'uppercase' }}>
        {label}{required && <span style={{ color: 'var(--red)', marginLeft: 2 }}>*</span>}
      </label>
    )}
    <div style={{ position: 'relative' }}>
      <select
        ref={ref}
        {...props}
        style={{
          width: '100%',
          padding: '9px 36px 9px 12px',
          border: `1px solid ${error ? 'var(--red)' : 'var(--border)'}`,
          borderRadius: 'var(--radius)',
          fontSize: 14,
          color: props.value ? 'var(--text)' : 'var(--text-3)',
          background: error ? 'var(--red-light)' : 'var(--surface)',
          outline: 'none',
          appearance: 'none',
          fontFamily: 'var(--font)',
          cursor: 'pointer',
        }}
      >
        {children}
      </select>
      <svg style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-3)' }}
        width="12" height="8" viewBox="0 0 12 8" fill="none">
        <path d="M1 1l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
    {hint && !error && <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{hint}</span>}
    {error && (
      <div style={{ fontSize: 12, color: 'var(--red)', background: 'var(--red-light)', borderLeft: '2px solid var(--red)', padding: '5px 10px', borderRadius: '0 var(--radius-sm) var(--radius-sm) 0' }}>
        {error}
      </div>
    )}
  </div>
))
Select.displayName = 'Select'

/* ─── BUTTON ────────────────────────────────────────── */
export function Button({ children, variant = 'primary', loading, icon, style: s, ...props }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    gap: 8, padding: '10px 20px', borderRadius: 'var(--radius)',
    fontSize: 13, fontWeight: 600, letterSpacing: '.02em',
    border: 'none', cursor: props.disabled || loading ? 'not-allowed' : 'pointer',
    transition: 'all .15s', userSelect: 'none',
  }
  const variants = {
    primary:   { background: 'var(--red)',    color: '#fff', opacity: (props.disabled || loading) ? .6 : 1 },
    secondary: { background: 'var(--surface)', color: 'var(--text-2)', border: '1px solid var(--border)' },
    ghost:     { background: 'transparent',   color: 'var(--red)', border: '1px solid var(--red)' },
    danger:    { background: '#fee2e2',        color: '#b91c1c', border: '1px solid #fca5a5' },
    success:   { background: 'var(--green-light)', color: 'var(--green)', border: '1px solid #bbf7d0' },
  }
  return (
    <button {...props} style={{ ...base, ...variants[variant], ...s }}
      onMouseEnter={e => { if (!props.disabled && !loading) e.currentTarget.style.filter = 'brightness(.92)' }}
      onMouseLeave={e => { e.currentTarget.style.filter = '' }}
      onMouseDown={e => { if (!props.disabled && !loading) e.currentTarget.style.transform = 'scale(.98)' }}
      onMouseUp={e => { e.currentTarget.style.transform = '' }}
    >
      {loading ? <Spinner size={14} color="currentColor" /> : icon}
      {children}
    </button>
  )
}

/* ─── BADGE ─────────────────────────────────────────── */
export function Badge({ children, color = 'gray' }) {
  const colors = {
    gray:    { bg: '#f4f4f5', text: '#52525b' },
    red:     { bg: 'var(--red-light)', text: 'var(--red)' },
    green:   { bg: 'var(--green-light)', text: 'var(--green)' },
    amber:   { bg: 'var(--amber-light)', text: 'var(--amber)' },
    blue:    { bg: 'var(--blue-light)', text: 'var(--blue)' },
  }
  const c = colors[color] || colors.gray
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, letterSpacing: '.03em', background: c.bg, color: c.text }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
      {children}
    </span>
  )
}

/* ─── SPINNER ───────────────────────────────────────── */
export function Spinner({ size = 18, color = 'var(--red)' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ animation: 'spin .7s linear infinite' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2.5" strokeOpacity=".2"/>
      <path d="M12 2a10 10 0 0 1 10 10" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  )
}

/* ─── TOAST ─────────────────────────────────────────── */
let _showToast = null
export function setToastFn(fn) { _showToast = fn }
export function toast(msg, type = 'default') { _showToast?.(msg, type) }

export function ToastProvider() {
  const [toasts, setToasts] = useState([])
  useEffect(() => {
    setToastFn((msg, type) => {
      const id = Date.now()
      setToasts(t => [...t, { id, msg, type }])
      setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000)
    })
  }, [])
  const colors = { error: 'var(--red)', success: 'var(--green)', default: '#18181b' }
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 9999 }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background: colors[t.type] || colors.default,
          color: '#fff', padding: '12px 18px', borderRadius: 'var(--radius)',
          fontSize: 13, fontWeight: 500, maxWidth: 340,
          boxShadow: 'var(--shadow-lg)',
          animation: 'slideIn .25s ease',
        }}>
          <style>{`@keyframes slideIn { from { opacity:0; transform:translateY(8px) } }`}</style>
          {t.msg}
        </div>
      ))}
    </div>
  )
}

/* ─── CARD ──────────────────────────────────────────── */
export function Card({ children, style }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-sm)',
      ...style,
    }}>
      {children}
    </div>
  )
}

/* ─── RADIO GROUP ───────────────────────────────────── */
export function RadioGroup({ name, value, onChange, options }) {
  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      {options.map(opt => (
        <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '8px 14px', borderRadius: 'var(--radius)', border: `1px solid ${value === opt.value ? 'var(--red)' : 'var(--border)'}`, background: value === opt.value ? 'var(--red-light)' : 'var(--surface)', transition: 'all .15s', userSelect: 'none' }}>
          <input type="radio" name={name} value={opt.value} checked={value === opt.value} onChange={() => onChange(opt.value)} style={{ accentColor: 'var(--red)' }} />
          <span style={{ fontSize: 13, fontWeight: 500, color: value === opt.value ? 'var(--red)' : 'var(--text-2)' }}>{opt.label}</span>
        </label>
      ))}
    </div>
  )
}
