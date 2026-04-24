import { Link } from 'react-router-dom'
import { Button } from './ui'

const TIPO_LABELS = {
  ARBITRAJE: 'Solicitud de Arbitraje',
  JPRD:      'Solicitud de JPRD',
  OTRAS:     'Otras Solicitudes',
}

export function SuccessScreen({ expediente, tipoSolicitud, onNew }) {
  return (
    <div style={{ textAlign: 'center', padding: '3rem 2rem' }}>
      <div style={{
        width: 72, height: 72, borderRadius: '50%',
        background: 'var(--green-light)', border: '2px solid #bbf7d0',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 1.5rem',
      }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.5" strokeLinecap="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>

      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>¡Solicitud registrada!</h2>
      <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 16 }}>Su expediente ha sido ingresado al sistema correctamente.</p>

      {tipoSolicitud && (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', background: 'var(--red-light)', border: '1px solid var(--red-border)', borderRadius: 99, fontSize: 12, fontWeight: 600, color: 'var(--red)', marginBottom: 16 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          {TIPO_LABELS[tipoSolicitud] || tipoSolicitud}
        </div>
      )}

      <div style={{ display: 'inline-block', marginBottom: 8 }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>Número de expediente</p>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 28, fontWeight: 700, color: 'var(--red)', background: 'var(--red-light)', border: '1px solid var(--red-border)', padding: '10px 32px', borderRadius: 'var(--radius)', letterSpacing: '.08em' }}>
          {expediente}
        </div>
      </div>

      <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 28, marginTop: 8 }}>
        Guarde este número para dar seguimiento a su solicitud.
      </p>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link to="/dashboard" style={{ textDecoration: 'none' }}>
          <Button>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            Ver mis expedientes
          </Button>
        </Link>
        <Button variant="ghost" onClick={onNew}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nueva solicitud
        </Button>
      </div>
    </div>
  )
}
