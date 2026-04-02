# Mesa de Partes Virtual

App web React + Vite + Supabase para registro de expedientes.

## Stack
- **React 18** + Vite
- **react-hook-form** + **Zod** — validaciones robustas
- **react-dropzone** — subida de archivos drag & drop
- **Supabase** — base de datos + storage
- **react-router-dom** — rutas (/ y /admin)

## Estructura

```
src/
├── components/
│   ├── ui.jsx           # Input, Select, Button, Badge, Toast, Card, RadioGroup
│   ├── Stepper.jsx      # Barra de progreso multi-paso
│   ├── PersonaForm.jsx  # Formulario reutilizable Demandante/Demandado
│   ├── AnexosForm.jsx   # Paso de documentos y URLs
│   ├── FileDropzone.jsx # Drag & drop de archivos
│   ├── SuccessScreen.jsx
│   └── Layout.jsx       # Header + footer
├── pages/
│   ├── FormPage.jsx     # Flujo principal (3 pasos)
│   └── AdminPage.jsx    # Panel admin con tabla, filtros, paginación
├── lib/
│   ├── supabase.js      # Cliente + queries
│   └── schemas.js       # Validaciones Zod
└── styles/global.css
```

## Setup

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar Supabase
Edita `.env.local`:
```
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_KEY=TU-ANON-KEY
```

### 3. Crear tabla en Supabase
Ejecuta `supabase-schema.sql` en el SQL Editor de Supabase.

### 4. Crear bucket de storage
En Supabase → Storage → New Bucket:
- Nombre: `anexos`
- Public: No
- Tamaño máximo por archivo: 20MB

### 5. Correr en local
```bash
npm run dev
```

### 6. Build para producción
```bash
npm run build
```
Despliega la carpeta `dist/` en Netlify, Vercel, o cualquier hosting estático.

## Rutas
- `/`      → Formulario público (3 pasos)
- `/admin` → Panel de administración
