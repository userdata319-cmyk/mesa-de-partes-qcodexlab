import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { demandanteSchema, docLimits } from '../lib/schemas'
import { Input, Select, Button, RadioGroup } from './ui'

const DOC_OPTIONS = [
  { value: 'DNI',       label: 'DNI' },
  { value: 'CE',        label: 'Carnet de Extranjería' },
  { value: 'PASAPORTE', label: 'Pasaporte' },
  { value: 'RUC',       label: 'RUC (Persona Jurídica)' },
]

export function PersonaForm({ title, schema, defaultValues, onSubmit, onBack, submitLabel = 'Continuar' }) {
  const { register, handleSubmit, watch, control, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: defaultValues || {
      tipo_persona: 'natural',
      tipo_doc: '',
      num_doc: '',
      nombres: '',
      razon_social: '',
      celular: '',
      domicilio: '',
      correo: '',
    },
  })

  const tipoPersona = watch('tipo_persona')
  const tipoDoc     = watch('tipo_doc')
  const maxLen      = docLimits[tipoDoc] || 12

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      {/* Tipo de persona */}
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 10 }}>Tipo de persona</p>
        <Controller
          name="tipo_persona"
          control={control}
          render={({ field }) => (
            <RadioGroup
              name={`tipo_persona_${title}`}
              value={field.value}
              onChange={field.onChange}
              options={[
                { value: 'natural',  label: 'Persona Natural' },
                { value: 'juridica', label: 'Persona Jurídica' },
              ]}
            />
          )}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Tipo documento */}
        <Select
          label="Tipo de documento de identidad"
          required
          error={errors.tipo_doc?.message}
          {...register('tipo_doc')}
        >
          <option value="">Elegir</option>
          {DOC_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </Select>

        {/* Número de documento */}
        <Input
          label="Número de documento"
          required
          placeholder={tipoDoc === 'RUC' ? '20123456789' : '12345678'}
          maxLength={maxLen}
          counter
          error={errors.num_doc?.message}
          hint={tipoDoc ? `Máximo ${maxLen} caracteres` : undefined}
          onInput={e => {
            if (tipoDoc === 'DNI' || tipoDoc === 'RUC') {
              e.target.value = e.target.value.replace(/\D/g, '')
            }
          }}
          {...register('num_doc')}
        />

        {/* Nombres / Razón social */}
        {tipoPersona === 'natural' ? (
          <Input
            label="Nombres y apellidos"
            required
            placeholder="Nombres y Apellidos"
            error={errors.nombres?.message}
            style={{ gridColumn: '1 / 2' }}
            {...register('nombres')}
          />
        ) : (
          <Input
            label="Razón social"
            required
            placeholder="Razón Social"
            error={errors.razon_social?.message}
            style={{ gridColumn: '1 / 2' }}
            {...register('razon_social')}
          />
        )}

        {/* Celular */}
        <Input
          label="Celular"
          required
          type="tel"
          placeholder="999888777"
          maxLength={9}
          error={errors.celular?.message}
          onInput={e => { e.target.value = e.target.value.replace(/\D/g, '') }}
          {...register('celular')}
        />

        {/* Domicilio */}
        <div style={{ gridColumn: '1 / -1' }}>
          <Input
            label="Domicilio completo"
            placeholder="Av. Ejemplo 123, Distrito, Provincia"
            error={errors.domicilio?.message}
            {...register('domicilio')}
          />
        </div>

        {/* Correo */}
        <div style={{ gridColumn: '1 / -1' }}>
          <Input
            label="Correo electrónico"
            type="email"
            placeholder="ejemplo@correo.com"
            error={errors.correo?.message}
            {...register('correo')}
          />
        </div>
      </div>

      {/* Botones */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
        {onBack ? (
          <Button type="button" variant="secondary" onClick={onBack}>← Anterior</Button>
        ) : <span />}
        <Button type="submit" loading={isSubmitting}>
          {submitLabel}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
        </Button>
      </div>
    </form>
  )
}
