const STEPS = [
  { label: 'Tipo de solicitud', icon: '📋' },
  { label: 'Demandante',        icon: '👤' },
  { label: 'Demandado',         icon: '👤' },
  { label: 'Anexos',            icon: '📎' },
]

export function Stepper({ current, completed }) {
  return (
    <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '0 2rem' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex' }}>
        {STEPS.map((step, i) => {
          const isDone   = completed.includes(i)
          const isActive = current === i
          return (
            <div key={i} style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
              <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '14px 0',
                borderBottom: `2.5px solid ${isActive ? 'var(--red)' : isDone ? 'var(--green)' : 'transparent'}`,
                color: isActive ? 'var(--red)' : isDone ? 'var(--green)' : 'var(--text-3)',
                transition: 'all .2s',
              }}>
                <div style={{
                  width: 26, height: 26, borderRadius: '50%',
                  border: `1.5px solid ${isActive ? 'var(--red)' : isDone ? 'var(--green)' : 'var(--border-2)'}`,
                  background: isActive ? 'var(--red)' : isDone ? 'var(--green)' : 'transparent',
                  color: (isActive || isDone) ? '#fff' : 'var(--text-3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontFamily: 'var(--mono)', fontWeight: 500,
                  transition: 'all .2s', flexShrink: 0,
                }}>
                  {isDone ? (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  ) : i + 1}
                </div>
                <span style={{ fontSize: 12, fontWeight: isActive ? 600 : 500, whiteSpace: 'nowrap' }}>{step.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ width: 1, height: 18, background: 'var(--border)', margin: '0 4px', flexShrink: 0 }} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
