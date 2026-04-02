import { z } from 'zod'

const emailOpt = z.union([
  z.string().email('Correo electrónico inválido'),
  z.literal(''),
]).optional()

const celular = z
  .string()
  .min(1, 'El celular es obligatorio')
  .regex(/^\d{9}$/, 'El celular debe tener exactamente 9 dígitos numéricos')

function docSchema(prefix) {
  return z.object({
    tipo_persona: z.enum(['natural', 'juridica']),
    tipo_doc: z.string().min(1, 'Seleccione un tipo de documento'),
    num_doc: z.string().min(1, 'Ingrese el número de documento'),
    nombres: z.string().optional(),
    razon_social: z.string().optional(),
    celular,
    domicilio: z.string().optional(),
    correo: emailOpt,
  }).superRefine((val, ctx) => {
    // Validar longitud de num_doc según tipo
    const lens = { DNI: 8, CE: 12, PASAPORTE: 12, RUC: 11 }
    const msgs = {
      DNI: 'El DNI debe tener exactamente 8 dígitos numéricos',
      CE: 'El CE debe tener hasta 12 caracteres',
      PASAPORTE: 'El Pasaporte debe tener hasta 12 caracteres',
      RUC: 'El RUC debe tener exactamente 11 dígitos numéricos',
    }
    const required = lens[val.tipo_doc]
    if (required && val.num_doc.length !== required) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: msgs[val.tipo_doc], path: ['num_doc'] })
    }
    // DNI y RUC solo numéricos
    if ((val.tipo_doc === 'DNI' || val.tipo_doc === 'RUC') && !/^\d+$/.test(val.num_doc)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Solo se permiten dígitos numéricos', path: ['num_doc'] })
    }
    // Nombre o razón social según tipo persona
    if (val.tipo_persona === 'natural' && !val.nombres?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Este campo es obligatorio', path: ['nombres'] })
    }
    if (val.tipo_persona === 'juridica' && !val.razon_social?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'La razón social es obligatoria', path: ['razon_social'] })
    }
  })
}

export const demandanteSchema = docSchema('dem')
export const demandadoSchema  = docSchema('ddo')

export const anexosSchema = z.object({
  archivos: z.array(z.instanceof(File)).min(1, 'Debe adjuntar al menos un documento'),
  url1: z.string().url('URL inválida').or(z.literal('')).optional(),
  url2: z.string().url('URL inválida').or(z.literal('')).optional(),
  url3: z.string().url('URL inválida').or(z.literal('')).optional(),
  url4: z.string().url('URL inválida').or(z.literal('')).optional(),
})

export const docLimits = { DNI: 8, CE: 12, PASAPORTE: 12, RUC: 11 }
