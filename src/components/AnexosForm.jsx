import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { anexosSchema } from '../lib/schemas'
import { Input, Button } from './ui'
import { FileDropzone } from './FileDropzone'

export function AnexosForm({ defaultValues, onSubmit, onBack, loading }) {
  const { handleSubmit, control, register, formState: { errors } } = useForm({
    resolver: zodResolver(anexosSchema),
    defaultValues: defaultValues || { archivos: [], url1: '', url2: '', url3: '', url4: '' },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      {/* Dropzone */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 10 }}>
          Documentos adjuntos <span style={{ color: 'var(--red)' }}>*</span>
        </p>
        <Controller
          name="archivos"
          control={control}
          render={({ field }) => (
            <FileDropzone value={field.value} onChange={field.onChange} error={errors.archivos?.message} />
          )}
        />
      </div>

      {/* Separador */}
      <div style={{ height: 1, background: 'var(--border)', margin: '24px 0' }} />

      {/* URLs */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: 'var(--text-2)', background: '#f8fafc', border: '1px solid var(--border)', borderLeft: '3px solid var(--red)', padding: '10px 14px', borderRadius: '0 var(--radius) var(--radius) 0', marginBottom: 16 }}>
          También puede enviarnos un enlace de archivo en la nube (Google Drive, Dropbox, OneDrive, iCloud)
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[1,2,3,4].map(n => (
            <Input
              key={n}
              label={`Enlace o URL ${n}`}
              placeholder="https://drive.google.com/..."
              type="url"
              error={errors[`url${n}`]?.message}
              hint="Google Drive, Dropbox, OneDrive, iCloud"
              {...register(`url${n}`)}
            />
          ))}
        </div>
      </div>

      {/* Botones */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
        <Button type="button" variant="secondary" onClick={onBack}>← Anterior</Button>
        <Button type="submit" loading={loading}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>
          Enviar Solicitud
        </Button>
      </div>
    </form>
  )
}
