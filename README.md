# Quality & Services LLC — sitio web

Sitio informativo bilingüe (inglés / español) de **Quality & Services LLC**. Es un sitio estático: HTML, CSS y JavaScript generados por un script de Node.js **sin dependencias**, publicado con **GitHub Pages** mediante GitHub Actions. No usa Vercel, Supabase, servidor, base de datos, cookies ni rastreadores.

## Requisitos

- Node.js 18 o superior (solo para compilar). No hace falta `npm install`.

## Ejecutar y compilar

```bash
node scripts/build.mjs          # genera dist/
node scripts/check.mjs          # verifica enlaces, recursos, alt, títulos y descripciones
npx serve dist                  # vista previa local (o cualquier servidor estático)
```

Para simular la publicación dentro de un repositorio (`usuario.github.io/repositorio`):

```bash
BASE_PATH=/quality-services-web SITE_URL=https://usuario.github.io/quality-services-web node scripts/build.mjs
```

En Windows (PowerShell): `$env:BASE_PATH="/quality-services-web"; node scripts/build.mjs`

## Publicar en GitHub Pages

1. Sube el proyecto a la rama `main`.
2. En GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Cada `push` a `main` ejecuta `.github/workflows/deploy.yml`: compila, verifica y publica.
4. **Dominio propio (opcional):** en *Settings → Pages → Custom domain* escribe el dominio y configura el DNS que indique GitHub. El flujo detecta la URL y la ruta base automáticamente; no hay que cambiar el código.

> Publicar Pages desde un repositorio **privado** requiere un plan de pago de GitHub (Pro, Team o Enterprise). Con el plan gratuito, el repositorio debe ser público para usar Pages.

## Estructura

```
src/site.config.json      Datos de contacto, redes, formulario y URL (campos en null = no se publican)
src/content/en.json       Todos los textos en inglés (navegación, páginas, SEO, formularios, mensajes)
src/content/es.json       Todos los textos en español (misma estructura)
src/content/photos.json   Registro de fotografías: autor, fuente, licencia y uso
src/assets/styles.css     Estilos (paleta y tipografía en :root)
src/assets/main.js        Menú móvil, selector de idioma, carrusel, formulario
scripts/build.mjs         Generador del sitio
scripts/check.mjs         Verificación de enlaces y recursos
scripts/optimize-images.mjs  Optimización de fotos y generación de logo/favicon (usa sharp)
public/                   Archivos que se copian tal cual (fotos optimizadas, logo, fuentes, íconos)
brand-source/             Logo original sin modificar + versiones recortadas con fondo transparente
docs/                     Datos pendientes y créditos fotográficos
```

## Actualizar contenido

- **Textos:** edita `src/content/en.json` y `src/content/es.json`. Mantén las mismas claves en ambos archivos.
- **Servicios:** lista `services.items` en cada archivo de idioma. Cada elemento tiene `icon` (`conversation`, `compass`, `options`, `followup`), `title` y `text`.
- **Preguntas frecuentes:** lista `faq.items` (`q`, `a`).
- **Contacto:** completa `src/site.config.json → contact`. Solo se muestran los campos con valor. Si no hay ninguno, la página de contacto lo indica con claridad.
- **Rutas de cada idioma:** `slugs` en cada archivo de idioma (p. ej. `services` ↔ `servicios`).

## Idiomas

- Rutas: `/en/...` y `/es/...`. La raíz `/` redirige al idioma guardado por el visitante o, si no hay preferencia, a inglés.
- El selector EN / ES lleva a la página equivalente en el otro idioma, conserva la sección (`#ancla`) y guarda la preferencia en `localStorage` (no es una cookie).
- Para agregar un idioma: crea `src/content/xx.json` con la misma estructura y añade `"xx"` a `languages` en `src/site.config.json`.

## Imágenes

- Las fotos optimizadas están en `public/images/photos/<nombre>-<ancho>.webp`.
- Para cambiar o agregar fotos: coloca los originales en una carpeta fuera del proyecto, ajusta la tabla `photos` de `scripts/optimize-images.mjs` y ejecuta:
  ```bash
  npm install --no-save sharp
  node scripts/optimize-images.mjs ../carpeta-con-originales
  ```
  Luego registra autor, enlace y licencia en `src/content/photos.json` (se muestran en la página de créditos).
- Para cambiar la portada, edita `home.slides` en ambos archivos de idioma (imagen, texto alternativo y encuadre `position`).
- **Logo:** el original está en `brand-source/logo-original.png`. Si cambia, reemplaza `brand-source/logo-recortado-transparente.png` y `simbolo-transparente.png` y vuelve a ejecutar el script para regenerar logo web, favicon e imagen para compartir.

## Formulario de contacto

Está **desactivado** porque aún no hay un correo ni servicio de recepción. Se muestra deshabilitado con un aviso y no envía nada. Para habilitarlo:

1. Crea un formulario en un servicio que reciba envíos por `POST` y responda en JSON (por ejemplo Formspree, Web3Forms o Basin; revisa sus planes y condiciones).
2. Escribe su URL en `src/site.config.json → form.endpoint`. Si el servicio pide una clave pública dentro del formulario (como Web3Forms), usa `accessKeyField` y `accessKey`. **Nunca** pongas contraseñas ni tokens privados.
3. Publica. El formulario valida los campos y solo muestra "mensaje enviado" si el servicio responde correctamente; si falla, muestra un error.
4. Antes de activarlo, prepara un aviso de privacidad revisado por un profesional y enlázalo desde el formulario.

## Paleta y tipografía

| Uso | Color |
| --- | --- |
| Azul marino (logo) | `#112A44` |
| Azul profundo | `#0B1D31` |
| Dorado de acento (sobre azul) | `#C9A766` |
| Dorado para texto sobre claro | `#7D5F2A` (contraste 5.5:1) |
| Marfil / arena | `#FAF7F0` / `#F3EDE2` |
| Texto secundario | `#5B6573` |

Tipografías autoalojadas (licencia SIL Open Font License): **Cormorant Garamond** para títulos e **Inter** para texto.
