# Ministerios Zoar — alabanzazoar.github.io

Sitio estático de Ministerios Zoar (iglesia). Dos áreas: **Alabanza** (cancionero
con cifrados y transposición) y **Discipulado** (lecciones en PDF).

- **Deploy:** GitHub Pages, rama `main`, carpeta raíz. Push a `main` = publicar.
  Publicado en `https://alabanzazoar.github.io`.
- **Stack:** HTML + CSS + JavaScript ES5 vanilla. **Sin build, sin npm, sin
  framework, sin bundler.** Todo el JS y casi todo el CSS va inline dentro de
  cada `.html`.
- **Backend:** Airtable, consumido directo desde el navegador con `fetch`.

## Mapa de navegación

```
index.html
├── alabanza.html          buscador de cantos (Airtable + array local legacy)
│   ├── LISTA_CANTOS.html  selección múltiple → PDF del repertorio, con transposición
│   ├── AGREGAR_CANTO.html editor de cantos (el archivo grande, ~64 KB)
│   └── ver_canto.html     lectura de un canto — ?nombre=<Name URL-encoded>
└── discipulado.html       5 módulos → leccion.html?modulo=..&leccion=..
    └── leccion.html       resuelve el PDF desde Airtable y lo muestra
```

Páginas sueltas, no enlazadas desde el índice: `PROGRA_CANTOS_DOMINGO.html`,
`PROGRA_CANTOS_MIERCOLES.html` (y sus `* copy.html`), `TABLA_CANTOS.html`,
`CIRCULO_DE_QUINTAS.html`, `cumple.html`.

## Airtable — hay DOS bases, no una

Este es el punto que más confunde al tocar el proyecto:

| Base | ID | Tablas | La usan |
|---|---|---|---|
| **Actual** | `appyn3FuqAu63Ak0j` | `Estructuras`, `Lecciones` | `alabanza.html`, `LISTA_CANTOS.html`, `AGREGAR_CANTO.html`, `ver_canto.html`, `leccion.html` |
| **Anterior** | `appdq30kG3hMuzDqc` | `Cantos` | `PROGRA_CANTOS_*.html`, `FUNCIONES_AIRTABLE_INSERTAR.js`, `PATCH_AGREGAR_CANTO.md` |

Cada base tiene su propio token, y **cada archivo repite las constantes
`AT_TOKEN` / `AT_BASE` / `AT_TABLE` por su cuenta**. No hay config compartido:
cambiar de base o rotar el token obliga a editar todos los archivos de esa
columna.

Campos de `Estructuras`: `Name` (mayúsculas, es la clave de búsqueda), `Autor`,
`Tipo` (`Adoración` / `Celebración`), `NotaBase`, `BPM`, `EstructuraJSON`.
Campos de `Cantos` (base anterior): `Name`, `Nota`, `Cifrado`, `Tipo`,
`Directora`, `NumCanto`.
Campos de `Lecciones`: `modulo`, `leccion`, `url_pdf`.

### Formato de `EstructuraJSON`

Es un string JSON con el array de secciones del canto:

```js
[{ id, tipo, tipoCustom, lineas: [ { id, segs: [ { id, nota, texto } ] } ] }]
```

Cada `seg` acopla un acorde a un fragmento de texto. El acorde se posiciona
visualmente contando caracteres — ver `calcLinea()`, duplicada en
`ver_canto.html`, `LISTA_CANTOS.html` y `AGREGAR_CANTO.html` (como `msCalcLinea`).
Si cambia el algoritmo de posicionamiento, hay que cambiarlo en las tres.

Las notas viven en dos arrays paralelos de 12 (`NM` mayores, `NA` menores) y la
transposición es aritmética modular sobre el índice. También está duplicado.

## Convenciones

- `Name` en Airtable se guarda **en MAYÚSCULAS**; las búsquedas comparan en
  minúsculas con `localeCompare('es', {sensitivity:'base'})` para ignorar tildes.
- Los cantos viejos en `CANTOS_ADORACION2/` y `CANTOS_CELEBRACION2/` son HTML
  estáticos con un CSS propio por canto en `*_ESTILOS/`. Es el sistema anterior a
  Airtable: **no se agregan cantos nuevos ahí**. El array `cancionesLocales` de
  `alabanza.html` que los enlazaba está completo pero comentado.
- Nombres de archivo de cantos: `MAYUSCULAS_CON_GUION_BAJO.html`, sin tildes
  salvo `Ñ` (`EXALTATE_SEÑOR.html`).
- Prefijo `ms*` en `AGREGAR_CANTO.html` = funciones del "modo simple". Sin
  prefijo = "modo dev". Son dos editores en el mismo archivo; no los mezcles.
- Los mensajes de commit del historial son todos `cambios` / `cantos`. Si
  querés algo más descriptivo, hay que empezar ahora.

## Trampas conocidas

- **Rutas absolutas.** Varias páginas usan `/ver_canto.html`, `/alabanza.html`,
  `/LOGOS/logo.jpg`. Funcionan porque es un *user site* servido en la raíz del
  dominio, pero **se rompen al abrir el HTML con `file://`** o al servirlo desde
  un subdirectorio. Para probar local: `python -m http.server 8000` desde la raíz
  del repo y entrar a `http://localhost:8000`.
- **`ver_canto.html` sólo lee de Airtable.** Un canto que exista como HTML
  estático pero no en la tabla `Estructuras` da "No encontrado".
- **`filterByFormula` con comillas.** Las consultas arman `{Name}='...'` por
  concatenación; un nombre de canto con apóstrofo rompe la fórmula.
- **Archivos `* copy.html`** son duplicados reales de trabajo, no plantillas.
- **`PATCH_AGREGAR_CANTO.md`** describe cambios ya aplicados a
  `AGREGAR_CANTO.html`, contra la base **anterior**. Es histórico: no lo apliques
  otra vez ni copies sus IDs.
- No hay `.gitignore`.

## Seguridad

Los tokens de Airtable (`pat...`) están **hardcodeados en archivos de un repo
público**, así que cualquiera puede leerlos y escribir en las bases. Es
inherente al diseño (sitio estático sin backend). Si en algún momento se quiere
cerrar: token de sólo lectura para las páginas de consulta, y un proxy
(Cloudflare Worker / Netlify Function) para las de escritura.
Al tocar estos archivos, no pegues tokens nuevos en el repo sin decidir esto
antes.
