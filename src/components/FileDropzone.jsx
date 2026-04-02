import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'

const MAX_SIZE = 20 * 1024 * 1024 // 20MB
const ACCEPT   = { 'application/pdf': ['.pdf'], 'image/jpeg': ['.jpg','.jpeg'], 'image/png': ['.png'] }

export function FileDropzone({ value = [], onChange, error }) {
  const [rejected, setRejected] = useState([])

  const onDrop = useCallback((accepted, rej) => {
    setRejected(rej.map(r => ({ name: r.file.name, reason: r.errors[0]?.message })))
    const next = [...value, ...accepted].slice(0, 4)
    onChange(next)
  }, [value, onChange])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: ACCEPT, maxSize: MAX_SIZE, maxFiles: 4 - value.length,
  })

  const remove = (i) => onChange(value.filter((_, idx) => idx !== i))

  return (
    <div>
      {/* Drop zone */}
      <div
        {...getRootProps()}
        style={{
          border: `1.5px dashed ${error ? 'var(--red)' : isDragActive ? 'var(--red)' : 'var(--border-2)'}`,
          borderRadius: 'var(--radius-lg)',
          background: isDragActive ? 'var(--red-light)' : error ? 'var(--red-light)' : '#fafafa',
          padding: '28px 20px',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all .15s',
        }}
      >
        <input {...getInputProps()} />
        <div style={{ marginBottom: 10 }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={isDragActive ? 'var(--red)' : 'var(--text-3)'} strokeWidth="1.5" strokeLinecap="round" style={{ margin: '0 auto' }}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
        </div>
        <p style={{ fontSize: 13, fontWeight: 500, color: isDragActive ? 'var(--red)' : 'var(--text-2)', marginBottom: 4 }}>
          {isDragActive ? 'Suelta aquí' : 'Arrastra archivos o haz clic para seleccionar'}
        </p>
        <p style={{ fontSize: 11, color: 'var(--text-3)' }}>PDF, JPG, PNG · Máximo 20MB por archivo · Hasta 4 archivos</p>
      </div>

      {error && (
        <div style={{ fontSize: 12, color: 'var(--red)', background: 'var(--red-light)', borderLeft: '2px solid var(--red)', padding: '5px 10px', borderRadius: '0 4px 4px 0', marginTop: 6 }}>
          {error}
        </div>
      )}

      {/* Archivos seleccionados */}
      {value.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
          {value.map((file, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--green-light)', border: '1px solid #bbf7d0', borderRadius: 'var(--radius)', fontSize: 13 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              <span style={{ flex: 1, color: '#15803d', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
              <span style={{ color: '#4ade80', fontSize: 11, fontFamily: 'var(--mono)', flexShrink: 0 }}>{(file.size / 1024).toFixed(0)} KB</span>
              <button onClick={() => remove(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#16a34a', padding: 2, display: 'flex', alignItems: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Archivos rechazados */}
      {rejected.length > 0 && (
        <div style={{ marginTop: 8 }}>
          {rejected.map((r, i) => (
            <div key={i} style={{ fontSize: 12, color: 'var(--red)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <b>{r.name}</b>: {r.reason}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
