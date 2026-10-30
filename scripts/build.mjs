// Generador estático de Quality & Services LLC — sin dependencias externas (solo Node.js 18+).
// Uso: node scripts/build.mjs
// Variables de entorno opcionales:
//   SITE_URL   URL pública sin barra final (p. ej. https://usuario.github.io/repo o https://www.dominio.com)
//   BASE_PATH  Ruta base donde se sirve el sitio ("/" para dominio propio, "/repo" para GitHub Pages de proyecto)
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const readJSON = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'));

const config = readJSON('src/site.config.json');
const photos = Object.fromEntries(readJSON('src/content/photos.json').photos.map((p) => [p.id, p]));
const content = { en: readJSON('src/content/en.json'), es: readJSON('src/content/es.json') };
const LANGS = config.languages;

// ---------- Rutas ----------
let BASE = (process.env.BASE_PATH ?? '/').trim();
if (!BASE.startsWith('/')) BASE = '/' + BASE;
if (!BASE.endsWith('/')) BASE += '/';
const SITE_URL = (process.env.SITE_URL || config.siteUrl || '').replace(/\/+$/, '') || null;

const PAGE_KEYS = ['home', 'about', 'services', 'process', 'faq', 'contact', 'credits'];
const routeOf = (lang, key) => {
  const slug = content[lang].slugs[key];
  return `${lang}/${slug ? slug + '/' : ''}`;
};
const href = (p = '') => BASE + p.replace(/^\//, '');
const abs = (p = '') => (SITE_URL ? `${SITE_URL}/${p.replace(/^\//, '')}` : null);

// ---------- Utilidades ----------
const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fmt = (s, vars) => s.replace(/\{(\w+)\}/g, (_, k) => vars[k]);

function hashFile(p) { return createHash('sha256').update(readFileSync(p)).digest('hex').slice(0, 10); }

function srcset(id) {
  const ph = photos[id];
  return ph.widths.map((w) => `${href(`images/photos/${id}-${w}.webp`)} ${w}w`).join(', ');
}
function img(id, alt, { sizes = '100vw', loading = 'lazy', cls = '', priority = false, position } = {}) {
  const ph = photos[id];
  const mid = ph.widths[Math.min(1, ph.widths.length - 1)];
  const style = position ? ` style="object-position:${esc(position)}"` : '';
  return `<img src="${href(`images/photos/${id}-${mid}.webp`)}" srcset="${srcset(id)}" sizes="${sizes}" alt="${esc(alt)}" loading="${loading}" decoding="async"${priority ? ' fetchpriority="high"' : ''}${cls ? ` class="${cls}"` : ''}${style} width="${ph.widths.at(-1)}" height="${Math.round(ph.widths.at(-1) * 0.66)}">`;
}

// Íconos lineales (trazo dorado/azul)
const ICONS = {
  conversation: '<path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 3.5V16H6.5A2.5 2.5 0 0 1 4 13.5z"/><path d="M8.5 9h7M8.5 12h4.5"/>',
  compass: '<circle cx="12" cy="12" r="8.5"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
  options: '<rect x="3.5" y="4.5" width="7" height="7" rx="1"/><rect x="13.5" y="4.5" width="7" height="7" rx="1"/><rect x="3.5" y="14" width="7" height="6" rx="1"/><path d="M14 17h6M17 14v6"/>',
  followup: '<path d="M20 12a8 8 0 1 1-2.34-5.66"/><path d="M20 4.5V8h-3.5"/><path d="M12 8v4l2.5 2"/>',
  integrity: '<path d="M12 3.5 5 6.5v5c0 4.2 2.9 7.7 7 9 4.1-1.3 7-4.8 7-9v-5z"/><path d="m9 12 2 2 4-4"/>',
  transparency: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
  commitment: '<path d="M7 11.5 10.5 8a2.1 2.1 0 0 1 3 0l.5.5"/><path d="m3 12 4-4 3 1 4-1.5 7 6.5-3 3"/><path d="m7.5 13.5 3 3M10 12l3.5 3.5M13 11l3 3"/>',
  excellence: '<path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z"/>',
  attention: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c.8-3.6 3.6-6 7-6s6.2 2.4 7 6"/>',
  arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  arrowLeft: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  pause: '<path d="M9 6v12M15 6v12"/>',
  play: '<path d="M8 5.5v13l10.5-6.5z"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6.5 8.5 6.5 8.5-6.5"/>',
  phone: '<path d="M5 4h3.5l1.5 4-2 1.5a11 11 0 0 0 6.5 6.5L16 14l4 1.5V19a1.5 1.5 0 0 1-1.5 1.5A15.5 15.5 0 0 1 3.5 5.5 1.5 1.5 0 0 1 5 4z"/>',
  whatsapp: '<path d="M4 20l1.2-3.8A8.5 8.5 0 1 1 8 19z"/><path d="M9 8.5c0 3.5 3 6.5 6.5 6.5l1-1.6-2-1-1 1a5 5 0 0 1-2.5-2.5l1-1-1-2z"/>',
  pin: '<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.5"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  area: '<path d="M3.5 6.5 9 4l6 2.5L20.5 4v13.5L15 20l-6-2.5L3.5 20z"/><path d="M9 4v13.5M15 6.5V20"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  external: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
};
const icon = (name, cls = 'icon') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>`;

const logo = (t, cls = 'brand__logo', h = 64) => `<picture><source type="image/webp" srcset="${href('images/brand/logo-64.webp')} 1x, ${href('images/brand/logo-128.webp')} 2x"><img class="${cls}" src="${href('images/brand/logo-128.png')}" alt="${esc(t.ui.logoAlt)}" width="${Math.round(h * 2.325)}" height="${h}" decoding="async"></picture>`;

// ---------- Activos con huella para caché ----------
const assetVersion = {};
function assetHref(file) { return `${href('assets/' + file)}?v=${assetVersion[file]}`; }

// ---------- Plantilla base ----------
function layout({ lang, key, title, description, body, bodyClass = '', alternates = true, noindex = false, pathOverride }) {
  const t = content[lang];
  const other = LANGS.find((l) => l !== lang);
  const path = pathOverride ?? routeOf(lang, key);
  const canonical = abs(path);
  const ogImage = abs('images/brand/og-image.jpg');

  const hreflangs = alternates && key ? LANGS.map((l) => (abs(routeOf(l, key)) ? `<link rel="alternate" hreflang="${content[l].htmlLang}" href="${abs(routeOf(l, key))}">` : '')).join('\n  ') +
    (abs('') ? `\n  <link rel="alternate" hreflang="x-default" href="${abs(routeOf(config.defaultLanguage, key))}">` : '') : '';

  const navItems = ['home', 'about', 'services', 'process', 'faq', 'contact'];
  const navLinks = navItems.map((k) => `<li><a href="${href(routeOf(lang, k))}"${k === key ? ' aria-current="page"' : ''}>${esc(t.nav[k])}</a></li>`).join('');

  const langSwitch = (extraCls = '') => `<div class="lang ${extraCls}" role="group" aria-label="${esc(t.ui.langLabel)}">${LANGS.map((l) => {
    const target = key ? routeOf(l, key) : `${l}/`;
    const label = l.toUpperCase();
    return l === lang
      ? `<span class="lang__item is-active" aria-current="true" lang="${content[l].htmlLang}"><abbr title="${esc(content[l].languageName)}">${label}</abbr></span>`
      : `<a class="lang__item" href="${href(target)}" hreflang="${content[l].htmlLang}" lang="${content[l].htmlLang}" data-lang-switch="${l}" title="${esc(t.ui.switchTo)}"><span class="visually-hidden">${esc(t.ui.switchTo)} — </span>${label}</a>`;
  }).join('<span class="lang__sep" aria-hidden="true">/</span>')}</div>`;

  const org = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: config.companyName,
    ...(abs('') ? { url: abs(''), logo: abs('images/brand/logo-1200.png') } : {}),
    ...(config.contact.email ? { email: config.contact.email } : {}),
    ...(config.contact.phone ? { telephone: config.contact.phone } : {}),
    ...(Object.values(config.social).filter(Boolean).length ? { sameAs: Object.values(config.social).filter(Boolean) } : {}),
  };

  const year = new Date().getFullYear();
  const footerLinks = ['about', 'services', 'process', 'faq', 'contact'].map((k) => `<li><a href="${href(routeOf(lang, k))}">${esc(t.nav[k])}</a></li>`).join('');

  return `<!doctype html>
<html lang="${t.htmlLang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  ${noindex ? '<meta name="robots" content="noindex">' : ''}
  ${canonical ? `<link rel="canonical" href="${canonical}">` : ''}
  ${hreflangs}
  <meta name="theme-color" content="#112A44">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${esc(config.companyName)}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:locale" content="${t.ogLocale}">
  <meta property="og:locale:alternate" content="${content[other].ogLocale}">
  ${canonical ? `<meta property="og:url" content="${canonical}">` : ''}
  ${ogImage ? `<meta property="og:image" content="${ogImage}">\n  <meta property="og:image:width" content="1200">\n  <meta property="og:image:height" content="630">\n  <meta property="og:image:alt" content="${esc(t.ui.logoAlt)}">` : ''}
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  ${ogImage ? `<meta name="twitter:image" content="${ogImage}">` : ''}
  <link rel="icon" href="${href('favicon.ico')}" sizes="48x48">
  <link rel="icon" type="image/png" href="${href('favicon-32.png')}" sizes="32x32">
  <link rel="apple-touch-icon" href="${href('apple-touch-icon.png')}">
  <link rel="manifest" href="${href('site.webmanifest')}">
  <link rel="preload" href="${href('fonts/cormorant-garamond-latin.woff2')}" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="${href('fonts/inter-latin.woff2')}" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="${assetHref('styles.css')}">
  <script>document.documentElement.classList.add('js')</script>
  <script type="application/ld+json">${JSON.stringify(org)}</script>
</head>
<body class="${bodyClass}" data-lang="${lang}">
  <a class="skip-link" href="#main">${esc(t.ui.skip)}</a>
  <header class="site-header" data-header>
    <div class="container site-header__inner">
      <a class="brand" href="${href(routeOf(lang, 'home'))}" aria-label="${esc(t.ui.homeLink)}">${logo(t)}</a>
      <nav class="site-nav" id="site-nav" aria-label="${esc(t.ui.mainNav)}" data-nav>
        <ul class="site-nav__list">${navLinks}</ul>
        <a class="btn btn--navy btn--sm site-nav__cta" href="${href(routeOf(lang, 'contact'))}">${esc(t.ui.contactCta)}</a>
      </nav>
      <div class="site-header__tools">
        ${langSwitch()}
        <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav" data-nav-toggle data-label-open="${esc(t.ui.openMenu)}" data-label-close="${esc(t.ui.closeMenu)}">
          <span class="nav-toggle__icon nav-toggle__icon--open">${icon('menu')}</span>
          <span class="nav-toggle__icon nav-toggle__icon--close">${icon('close')}</span>
          <span class="visually-hidden" data-nav-toggle-label>${esc(t.ui.openMenu)}</span>
        </button>
      </div>
    </div>
  </header>

  <main id="main" tabindex="-1">
${body}
  </main>

  <footer class="site-footer">
    <div class="container site-footer__grid">
      <div class="site-footer__brand">
        <a href="${href(routeOf(lang, 'home'))}" aria-label="${esc(t.ui.homeLink)}">${logo(t, 'site-footer__logo', 64)}</a>
        <p class="site-footer__tagline">${esc(t.footer.tagline)}</p>
      </div>
      <nav class="site-footer__nav" aria-label="${esc(t.ui.footerNav)}">
        <p class="site-footer__heading">${esc(t.footer.explore)}</p>
        <ul>${footerLinks}</ul>
      </nav>
      <div class="site-footer__lang">
        <p class="site-footer__heading">${esc(t.footer.language)}</p>
        ${langSwitch('lang--footer')}
      </div>
    </div>
    <div class="container site-footer__legal">
      <p>© ${year} ${esc(config.companyName)}. ${esc(t.footer.rights)}</p>
      <p>${esc(t.footer.illustrative)} <a href="${href(routeOf(lang, 'credits'))}">${esc(t.footer.credits)}</a>.</p>
      <p>${esc(t.footer.privacy)}</p>
    </div>
  </footer>
  <script src="${assetHref('main.js')}" defer></script>
</body>
</html>
`;
}

// ---------- Secciones reutilizables ----------
const sectionHead = (kicker, title, lead, { id, align = '' } = {}) => `
      <header class="section-head ${align}">
        ${kicker ? `<p class="kicker">${esc(kicker)}</p>` : ''}
        <h2 class="section-title"${id ? ` id="${id}"` : ''}>${esc(title)}</h2>
        ${lead ? `<p class="section-lead">${esc(lead)}</p>` : ''}
      </header>`;

const valuesGrid = (t, headingLevel = 3) => `
      <ul class="values" role="list">
        ${t.values.map((v) => `<li class="value">
          <span class="value__icon">${icon(v.key)}</span>
          <h${headingLevel} class="value__title">${esc(v.title)}</h${headingLevel}>
          <p class="value__text">${esc(v.text)}</p>
        </li>`).join('\n        ')}
      </ul>`;

const servicesGrid = (t, headingLevel = 3) => `
      <ul class="services" role="list">
        ${t.services.items.map((s, i) => `<li class="service">
          <span class="service__num" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
          <span class="service__icon">${icon(s.icon)}</span>
          <h${headingLevel} class="service__title">${esc(s.title)}</h${headingLevel}>
          <p class="service__text">${esc(s.text)}</p>
        </li>`).join('\n        ')}
      </ul>`;

const stepsList = (t, headingLevel = 3) => `
      <ol class="steps">
        ${t.process.steps.map((s, i) => `<li class="step">
          <span class="step__num" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
          <div class="step__body">
            <h${headingLevel} class="step__title">${esc(s.title)}</h${headingLevel}>
            <p class="step__text">${esc(s.text)}</p>
          </div>
        </li>`).join('\n        ')}
      </ol>`;

const ctaBand = (lang, title, text, button) => `
    <section class="cta-band" aria-labelledby="cta-title">
      <div class="container cta-band__inner">
        <div>
          <h2 class="cta-band__title" id="cta-title">${esc(title)}</h2>
          <p class="cta-band__text">${esc(text)}</p>
        </div>
        <a class="btn btn--navy" href="${href(routeOf(lang, 'contact'))}">${esc(button)} ${icon('arrowRight', 'icon icon--sm')}</a>
      </div>
    </section>`;

const pageHero = (kicker, title, lead, image) => `
    <section class="page-hero${image ? ' page-hero--image' : ''}">
      ${image ? `<div class="page-hero__media">${img(image.image, '', { sizes: '100vw', loading: 'eager', priority: true })}</div>` : ''}
      <div class="container page-hero__inner">
        <p class="kicker kicker--light">${esc(kicker)}</p>
        <h1 class="page-hero__title">${esc(title)}</h1>
        ${lead ? `<p class="page-hero__lead">${esc(lead)}</p>` : ''}
      </div>
    </section>`;

// ---------- Páginas ----------
function pageHome(lang) {
  const t = content[lang]; const h = t.home; const c = t.ui.carousel;
  const total = h.slides.length;
  const slides = h.slides.map((s, i) => `
          <div class="hero__slide${i === 0 ? ' is-active' : ''}" role="group" aria-roledescription="slide" aria-label="${esc(fmt(c.slide, { n: i + 1, total }))}"${i === 0 ? '' : ' aria-hidden="true"'} data-slide>
            ${img(s.image, s.alt, { sizes: '100vw', loading: i === 0 ? 'eager' : 'lazy', priority: i === 0, position: s.position })}
          </div>`).join('');
  const dots = h.slides.map((s, i) => `<button type="button" class="hero__dot" aria-label="${esc(fmt(c.goTo, { n: i + 1, total }))}"${i === 0 ? ' aria-current="true"' : ''} data-dot="${i}"><span></span></button>`).join('');

  const body = `
    <section class="hero" aria-labelledby="hero-title">
      <div class="hero__carousel" aria-roledescription="carousel" aria-label="${esc(c.label)}" data-carousel data-interval="6000" data-duration="800">
        <div class="hero__track" aria-live="off" data-track>${slides}
        </div>
        <div class="hero__overlay" aria-hidden="true"></div>
      </div>
      <div class="container hero__content">
        <p class="kicker kicker--light">${esc(h.hero.eyebrow)}</p>
        <h1 class="hero__title" id="hero-title">${esc(h.hero.title)}</h1>
        <p class="hero__lead">${esc(h.hero.lead)}</p>
        <div class="hero__actions">
          <a class="btn btn--gold" href="${href(routeOf(lang, 'contact'))}">${esc(h.hero.primary)}</a>
          <a class="btn btn--ghost-light" href="${href(routeOf(lang, 'process'))}">${esc(h.hero.secondary)}</a>
        </div>
      </div>
      <div class="hero__controls" data-carousel-controls>
        <div class="hero__dots" role="group" aria-label="${esc(c.label)}">${dots}</div>
        <div class="hero__buttons">
          <button type="button" class="hero__btn" data-prev aria-label="${esc(c.prev)}">${icon('arrowLeft')}</button>
          <button type="button" class="hero__btn" data-toggle aria-label="${esc(c.pause)}" data-label-pause="${esc(c.pause)}" data-label-play="${esc(c.play)}">
            <span class="hero__btn-pause">${icon('pause')}</span><span class="hero__btn-play">${icon('play')}</span>
          </button>
          <button type="button" class="hero__btn" data-next aria-label="${esc(c.next)}">${icon('arrowRight')}</button>
        </div>
      </div>
    </section>

    <section class="section section--intro" aria-labelledby="intro-title">
      <div class="container intro">
        <div class="intro__head">
          <p class="kicker">${esc(h.intro.kicker)}</p>
          <h2 class="section-title" id="intro-title">${esc(h.intro.title)}</h2>
        </div>
        <div class="intro__body">
          ${h.intro.body.map((p) => `<p>${esc(p)}</p>`).join('\n          ')}
          <a class="link-arrow" href="${href(routeOf(lang, 'about'))}">${esc(h.intro.link)} ${icon('arrowRight', 'icon icon--sm')}</a>
        </div>
      </div>
    </section>

    <section class="section section--alt" aria-labelledby="values-title">
      <div class="container">
        ${sectionHead(h.values.kicker, h.values.title, '', { id: 'values-title', align: 'section-head--center' })}
        ${valuesGrid(t)}
      </div>
    </section>

    <section class="section" aria-labelledby="process-title">
      <div class="container media-split media-split--home">
        <figure class="media-split__media">
          ${img(h.process.image.image, h.process.image.alt, { sizes: '(min-width: 900px) 45vw, 100vw', position: h.process.image.position })}
        </figure>
        <div class="media-split__text">
          <p class="kicker">${esc(h.process.kicker)}</p>
          <h2 class="section-title" id="process-title">${esc(h.process.title)}</h2>
          ${stepsList(t).replace('class="steps"', 'class="steps steps--compact"')}
          <a class="link-arrow" href="${href(routeOf(lang, 'process'))}">${esc(h.process.link)} ${icon('arrowRight', 'icon icon--sm')}</a>
        </div>
      </div>
    </section>

    <section class="section section--alt" aria-labelledby="services-title">
      <div class="container">
        <div class="split-head">
          ${sectionHead(h.services.kicker, h.services.title, h.services.lead, { id: 'services-title' })}
          <a class="link-arrow" href="${href(routeOf(lang, 'services'))}">${esc(h.services.link)} ${icon('arrowRight', 'icon icon--sm')}</a>
        </div>
        ${servicesGrid(t)}
      </div>
    </section>
${ctaBand(lang, h.cta.title, h.cta.body, h.cta.button)}`;
  return layout({ lang, key: 'home', ...t.pages.home, body, bodyClass: 'page-home' });
}

function pageAbout(lang) {
  const t = content[lang]; const a = t.about;
  const body = `
${pageHero(a.kicker, a.title, a.lead, null)}
    <section class="section" aria-labelledby="story-title">
      <div class="container media-split">
        <div class="media-split__text">
          <h2 class="section-title" id="story-title">${esc(a.story.title)}</h2>
          ${a.story.body.map((p) => `<p>${esc(p)}</p>`).join('\n          ')}
        </div>
        <figure class="media-split__media">
          ${img(a.image.image, a.image.alt, { sizes: '(min-width: 900px) 45vw, 100vw' })}
        </figure>
      </div>
    </section>

    <section class="section section--alt" aria-labelledby="approach-title">
      <div class="container">
        ${sectionHead('', a.approach.title, '', { id: 'approach-title' })}
        <ul class="approach" role="list">
          ${a.approach.items.map((it) => `<li class="approach__item"><h3>${esc(it.title)}</h3><p>${esc(it.text)}</p></li>`).join('\n          ')}
        </ul>
      </div>
    </section>

    <section class="section" aria-label="${esc(a.mission.label)} · ${esc(a.vision.label)}">
      <div class="container statements">
        <article class="statement">
          <h2 class="statement__label">${esc(a.mission.label)}</h2>
          <p class="statement__text">${esc(a.mission.text)}</p>
        </article>
        <article class="statement">
          <h2 class="statement__label">${esc(a.vision.label)}</h2>
          <p class="statement__text">${esc(a.vision.text)}</p>
        </article>
      </div>
    </section>

    <section class="section section--alt" aria-labelledby="values-title">
      <div class="container">
        ${sectionHead('', a.valuesTitle, a.valuesLead, { id: 'values-title', align: 'section-head--center' })}
        ${valuesGrid(t)}
      </div>
    </section>
${ctaBand(lang, t.home.cta.title, t.home.cta.body, t.home.cta.button)}`;
  return layout({ lang, key: 'about', ...t.pages.about, body });
}

function pageServices(lang) {
  const t = content[lang]; const s = t.services;
  const body = `
${pageHero(s.kicker, s.title, s.lead, null)}
    <section class="section" aria-label="${esc(s.title)}">
      <div class="container">
        ${servicesGrid(t, 2)}
        <p class="note">${esc(s.note)}</p>
      </div>
    </section>
${ctaBand(lang, s.ctaTitle, s.ctaBody, t.ui.contactCta)}`;
  return layout({ lang, key: 'services', ...t.pages.services, body });
}

function pageProcess(lang) {
  const t = content[lang]; const p = t.process;
  const body = `
${pageHero(p.kicker, p.title, p.lead, null)}
    <section class="section" aria-label="${esc(p.title)}">
      <div class="container media-split media-split--top">
        <div class="media-split__text">
          ${stepsList(t, 2).replace('class="steps"', 'class="steps steps--vertical"')}
          <p class="note">${esc(p.disclaimer)}</p>
        </div>
        <figure class="media-split__media media-split__media--sticky">
          ${img(p.image.image, p.image.alt, { sizes: '(min-width: 900px) 45vw, 100vw' })}
        </figure>
      </div>
    </section>
${ctaBand(lang, t.home.cta.title, t.home.cta.body, t.home.cta.button)}`;
  return layout({ lang, key: 'process', ...t.pages.process, body });
}

function pageFaq(lang) {
  const t = content[lang]; const f = t.faq;
  const faqLd = {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: f.items.map((it) => ({ '@type': 'Question', name: it.q, acceptedAnswer: { '@type': 'Answer', text: it.a } })),
  };
  const body = `
${pageHero(f.kicker, f.title, f.lead, null)}
    <section class="section" aria-label="${esc(f.title)}">
      <div class="container container--narrow">
        <div class="faq">
          ${f.items.map((it, i) => `<details class="faq__item"${i === 0 ? ' open' : ''}>
            <summary class="faq__q"><span>${esc(it.q)}</span>${icon('plus', 'icon faq__icon')}</summary>
            <div class="faq__a"><p>${esc(it.a)}</p></div>
          </details>`).join('\n          ')}
        </div>
      </div>
    </section>
    <script type="application/ld+json">${JSON.stringify(faqLd)}</script>
${ctaBand(lang, t.home.cta.title, t.home.cta.body, t.home.cta.button)}`;
  return layout({ lang, key: 'faq', ...t.pages.faq, body });
}

function pageContact(lang) {
  const t = content[lang]; const c = t.contact; const L = c.labels; const cc = config.contact;
  const rows = [];
  if (cc.email) rows.push(['mail', L.email, `<a href="mailto:${esc(cc.email)}">${esc(cc.email)}</a>`]);
  if (cc.phone) rows.push(['phone', L.phone, `<a class="channel__primary" href="tel:${esc(cc.phone.replace(/[^\d+]/g, ''))}">${esc(cc.phone)}</a>`]);
  if (cc.whatsapp) rows.push(['whatsapp', L.whatsapp, `<a href="https://wa.me/${esc(cc.whatsapp.replace(/\D/g, ''))}" rel="noopener" target="_blank">+${esc(cc.whatsapp.replace(/\D/g, ''))}</a>`]);
  if (cc.address) rows.push(['pin', L.address, `<span>${esc(cc.address)}</span>`]);
  if (cc.hours?.[lang]) rows.push(['clock', L.hours, `<span>${esc(cc.hours[lang])}</span>`]);
  if (cc.serviceArea?.[lang]) rows.push(['area', L.serviceArea, `<span>${esc(cc.serviceArea[lang])}</span>`]);
  const social = Object.entries(config.social).filter(([, v]) => v);
  if (social.length) rows.push(['external', L.social, social.map(([k, v]) => `<a href="${esc(v)}" rel="noopener" target="_blank">${esc(k[0].toUpperCase() + k.slice(1))}</a>`).join(' · ')]);

  const channels = rows.length
    ? `<dl class="channels">${rows.map(([ic, label, val]) => `<div class="channel"><dt>${icon(ic)}<span>${esc(label)}</span></dt><dd>${val}</dd></div>`).join('')}</dl>`
    : `<p class="channels-empty">${esc(c.noChannels)}</p>`;

  const F = c.form;
  const enabled = Boolean(config.form.endpoint);
  const req = `<span class="field__req" aria-hidden="true">*</span>`;
  const msgs = esc(JSON.stringify({ ...F.errors, sending: F.sending, success: F.success, error: F.error, submit: F.submit }));
  const hidden = enabled && config.form.accessKeyField && config.form.accessKey
    ? `<input type="hidden" name="${esc(config.form.accessKeyField)}" value="${esc(config.form.accessKey)}">` : '';

  // El formulario solo se genera cuando hay un receptor configurado (site.config.json → form.endpoint).
  // Mientras tanto se oculta y la página muestra un aviso de que habrá más medios de contacto.
  const form = !enabled ? '' : `
          <form class="contact-form" action="${esc(config.form.endpoint)}" method="post" data-form novalidate data-messages="${msgs}">
            <h2 class="contact-form__title">${esc(F.title)}</h2>
            <fieldset>
              <legend class="visually-hidden">${esc(F.title)}</legend>
              ${hidden}
              <div class="field">
                <label for="f-name">${esc(F.name)} ${req}</label>
                <input id="f-name" name="name" type="text" autocomplete="name" required aria-required="true">
                <p class="field__error" id="f-name-err" hidden></p>
              </div>
              <div class="field-row">
                <div class="field">
                  <label for="f-email">${esc(F.email)} ${req}</label>
                  <input id="f-email" name="email" type="email" autocomplete="email" required aria-required="true">
                  <p class="field__error" id="f-email-err" hidden></p>
                </div>
                <div class="field">
                  <label for="f-phone">${esc(F.phone)}</label>
                  <input id="f-phone" name="phone" type="tel" autocomplete="tel">
                </div>
              </div>
              <div class="field">
                <label for="f-topic">${esc(F.topic)}</label>
                <select id="f-topic" name="topic">
                  <option value="">${esc(F.topicPlaceholder)}</option>
                  ${F.topics.map((tp) => `<option>${esc(tp)}</option>`).join('')}
                </select>
              </div>
              <div class="field">
                <label for="f-message">${esc(F.message)} ${req}</label>
                <textarea id="f-message" name="message" rows="5" required aria-required="true"></textarea>
                <p class="field__error" id="f-message-err" hidden></p>
              </div>
              <div class="field field--check">
                <input id="f-consent" name="consent" type="checkbox" value="yes" required aria-required="true">
                <label for="f-consent">${esc(F.consent)} ${req}</label>
                <p class="field__error" id="f-consent-err" hidden></p>
              </div>
              <input type="text" name="_gotcha" tabindex="-1" autocomplete="off" class="hp" aria-hidden="true">
              <input type="hidden" name="language" value="${lang}">
              <div class="form-actions">
                <button class="btn btn--primary" type="submit">${esc(F.submit)}</button>
                <p class="form-status" role="status" aria-live="polite" data-status></p>
              </div>
            </fieldset>
          </form>`;

  const body = `
${pageHero(c.kicker, c.title, c.lead, c.image)}
    <section class="section section--tight" aria-label="${esc(c.title)}">
      ${enabled ? `<div class="container contact">
        <div class="contact__info">
          <h2 class="section-title section-title--sm">${esc(c.channelsTitle)}</h2>
          ${channels}
        </div>
        <div class="contact__form">${form}
        </div>
      </div>` : `<div class="container container--narrow">
        <div class="contact-card">
          <h2 class="section-title section-title--sm">${esc(c.channelsTitle)}</h2>
          ${channels}
        </div>
      </div>`}
    </section>`;
  return layout({ lang, key: 'contact', ...t.pages.contact, body });
}

function pageCredits(lang) {
  const t = content[lang]; const cr = t.credits;
  const list = Object.values(photos).map((p) => `
          <li class="credit">
            <img src="${href(`images/photos/${p.id}-${p.widths[0]}.webp`)}" alt="" loading="lazy" decoding="async" width="160" height="106">
            <div>
              <p class="credit__title">${esc(cr.by)} <a href="${esc(p.profile)}?utm_source=quality_services&amp;utm_medium=referral" rel="noopener" target="_blank">${esc(p.author)}</a> <a href="${esc(p.page)}" rel="noopener" target="_blank">${esc(cr.on)}</a></p>
              <p class="credit__meta">${esc(cr.usedFor)}: ${esc(p.usage[lang])} · <a href="https://unsplash.com/license" rel="noopener" target="_blank">${esc(cr.license)}</a></p>
            </div>
          </li>`).join('');
  const body = `
${pageHero(t.footer.credits, cr.title, cr.lead, null)}
    <section class="section" aria-label="${esc(cr.title)}">
      <div class="container container--narrow">
        <ul class="credits" role="list">${list}
        </ul>
      </div>
    </section>`;
  return layout({ lang, key: 'credits', ...t.pages.credits, body });
}

function page404() {
  const en = content.en, es = content.es;
  const col = (t, l) => `
          <div class="notfound__col" lang="${t.htmlLang}">
            <p class="kicker kicker--light">${esc(t.notFound.code)}</p>
            <h${l === 'en' ? 1 : 2} class="notfound__title">${esc(t.notFound.title)}</h${l === 'en' ? 1 : 2}>
            <p>${esc(t.notFound.body)}</p>
            <div class="notfound__actions">
              <a class="btn btn--gold" href="${href(routeOf(l, 'home'))}" data-lang-switch="${l}">${esc(t.notFound.home)}</a>
              <a class="btn btn--ghost-light" href="${href(routeOf(l, 'contact'))}" data-lang-switch="${l}">${esc(t.notFound.contact)}</a>
            </div>
          </div>`;
  const body = `
    <section class="notfound">
      <div class="notfound__media">${img('notfound-facade', '', { loading: 'eager', priority: true })}</div>
      <div class="container notfound__inner">${col(en, 'en')}${col(es, 'es')}
      </div>
    </section>`;
  return layout({ lang: 'en', key: null, title: `${en.pages.notFound.title}`, description: en.pages.notFound.description, body, bodyClass: 'page-404', alternates: false, noindex: true, pathOverride: '404.html' });
}

function rootRedirect() {
  const def = config.defaultLanguage;
  const canonical = abs(routeOf(def, 'home'));
  return `<!doctype html>
<html lang="${def}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(config.companyName)}</title>
  <meta name="description" content="${esc(content[def].pages.home.description)}">
  ${canonical ? `<link rel="canonical" href="${canonical}">` : ''}
  ${LANGS.map((l) => (abs(routeOf(l, 'home')) ? `<link rel="alternate" hreflang="${l}" href="${abs(routeOf(l, 'home'))}">` : '')).join('\n  ')}
  <link rel="icon" href="${href('favicon.ico')}" sizes="48x48">
  <script>
    (function () {
      var langs = ${JSON.stringify(LANGS)}, lang = ${JSON.stringify(def)};
      try { var s = localStorage.getItem('qs-lang'); if (langs.indexOf(s) > -1) lang = s; } catch (e) {}
      location.replace(${JSON.stringify(BASE)} + lang + '/' + location.hash);
    })();
  </script>
  <noscript><meta http-equiv="refresh" content="0; url=${href(`${def}/`)}"></noscript>
  <style>body{font-family:system-ui,sans-serif;background:#FAF7F0;color:#112A44;display:grid;place-items:center;min-height:100vh;margin:0}a{color:#112A44}</style>
</head>
<body>
  <p><a href="${href('en/')}" lang="en">English</a> · <a href="${href('es/')}" lang="es">Español</a></p>
</body>
</html>
`;
}

// ---------- Construcción ----------
rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });
cpSync(join(root, 'public'), dist, { recursive: true });
mkdirSync(join(dist, 'assets'), { recursive: true });
for (const f of readdirSync(join(root, 'src/assets'))) {
  cpSync(join(root, 'src/assets', f), join(dist, 'assets', f));
  assetVersion[f] = hashFile(join(root, 'src/assets', f));
}

const builders = { home: pageHome, about: pageAbout, services: pageServices, process: pageProcess, faq: pageFaq, contact: pageContact, credits: pageCredits };
const written = [];
for (const lang of LANGS) {
  for (const key of PAGE_KEYS) {
    const out = join(dist, routeOf(lang, key), 'index.html');
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, builders[key](lang));
    written.push(routeOf(lang, key));
  }
}
writeFileSync(join(dist, 'index.html'), rootRedirect());
writeFileSync(join(dist, '404.html'), page404());
writeFileSync(join(dist, '.nojekyll'), '');

// Manifest
writeFileSync(join(dist, 'site.webmanifest'), JSON.stringify({
  name: config.companyName, short_name: 'Q&S LLC', start_url: href(''), scope: href(''), display: 'browser',
  background_color: '#FAF7F0', theme_color: '#112A44',
  icons: [{ src: href('icon-192.png'), sizes: '192x192', type: 'image/png' }, { src: href('icon-512.png'), sizes: '512x512', type: 'image/png' }],
}, null, 2));

// robots y sitemap
const robots = ['User-agent: *', 'Allow: /'];
if (SITE_URL) {
  const today = new Date().toISOString().slice(0, 10);
  const urls = PAGE_KEYS.flatMap((key) => LANGS.map((lang) => `  <url>
    <loc>${abs(routeOf(lang, key))}</loc>
    <lastmod>${today}</lastmod>
${LANGS.map((l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${abs(routeOf(l, key))}"/>`).join('\n')}
  </url>`)).join('\n');
  writeFileSync(join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>
`);
  robots.push(`Sitemap: ${abs('sitemap.xml')}`);
}
writeFileSync(join(dist, 'robots.txt'), robots.join('\n') + '\n');

const size = (d) => readdirSync(d).reduce((s, f) => { const p = join(d, f); const st = statSync(p); return s + (st.isDirectory() ? size(p) : st.size); }, 0);
console.log(`✓ ${written.length} páginas + index + 404 → dist/ (${(size(dist) / 1024 / 1024).toFixed(2)} MB)`);
console.log(`  BASE_PATH=${BASE}  SITE_URL=${SITE_URL ?? '(sin definir: se omiten canonical, og:url y sitemap)'}`);
console.log(`  Formulario: ${config.form.endpoint ? 'ACTIVO → ' + config.form.endpoint : 'desactivado (sin endpoint configurado)'}`);
