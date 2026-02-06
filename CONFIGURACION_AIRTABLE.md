# Guía de Configuración - Integración con Airtable

## Pasos para conectar tu base de datos Airtable

### 1. Crear tu base de datos en Airtable

1. Ve a [airtable.com](https://airtable.com) y crea una cuenta (o inicia sesión)
2. Crea una nueva base o usa una existente
3. Crea una tabla llamada **"Lecciones"** con los siguientes campos:
   - **modulo** (texto): Nombre del módulo (ej: "Mirad que nadie os engañe")
   - **leccion** (texto): Nombre de la lección (ej: "Sectas")
   - **url_pdf** (URL): URL del PDF (puede ser de Google Drive, Dropbox, etc.)

### 2. Obtener tu Token de API

1. Ve a https://airtable.com/account/tokens
2. Haz clic en "Create new token"
3. Dale un nombre descriptivo (ej: "Zoar Discipulado")
4. Selecciona los permisos de lectura en la base
5. Copia el token completo

### 3. Obtener el ID de tu Base

1. Abre tu base en Airtable
2. En la URL verás algo como: `https://airtable.com/tbl...`
3. El ID comienza con `app` y está en: https://airtable.com/api (selecciona tu base y verás el ID)

### 4. Configurar los archivos

**En `leccion.html`**, busca estas líneas y reemplaza:

```javascript
const AIRTABLE_TOKEN = 'YOUR_AIRTABLE_TOKEN_HERE'; // Reemplaza con tu token
const AIRTABLE_BASE_ID = 'YOUR_BASE_ID_HERE'; // Reemplaza con tu ID de base
const AIRTABLE_TABLE_NAME = 'Lecciones'; // Nombre de tu tabla
```

Ejemplo completo:
```javascript
const AIRTABLE_TOKEN = 'patXYZ123abc...'; 
const AIRTABLE_BASE_ID = 'appQWERT456...'; 
const AIRTABLE_TABLE_NAME = 'Lecciones';
```

### 5. Cargar PDFs

Para cada lección en Airtable, puedes usar:
- **Google Drive**: Haz clic derecho → "Compartir" → copia el enlace PDF
- **Dropbox**: Comparte el enlace y asegúrate de que termine en `?dl=1`
- **URLs directas** a archivos PDF públicos

### 6. Estructura de datos en Airtable

Tu tabla debe verse así:

| modulo | leccion | url_pdf |
|--------|---------|---------|
| Mirad que nadie os engañe | Sectas | https://... |
| Mirad que nadie os engañe | El diario vivir para el creyente | https://... |

### 7. Cómo funciona

1. El usuario abre discipulado.html
2. Expande el módulo 5
3. Hace clic en el botón "📖 Leer" de una lección
4. Se abre leccion.html con los parámetros
5. La página consulta Airtable y carga el PDF

---

## Agregar más lecciones a otros módulos

Si quieres agregar botones a otros módulos, copia este patrón en `discipulado.html`:

```html
<li>
    <div class="lesson-item">
        <span>Nombre de la lección</span>
        <button class="lesson-btn" onclick="abrirLeccion('Nombre del Módulo', 'Nombre de la lección')">📖 Leer</button>
    </div>
</li>
```

---

## Seguridad

⚠️ **IMPORTANTE**: El token estará visible en el código cliente. Para mayor seguridad:
- Usa tokens con permisos limitados solo a lectura
- Considera crear un backend que intermedie las llamadas a Airtable
