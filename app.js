/* NEXOS v3.0 — Master-Detail SVG + Arborescence
   Left: Interactive SVG diagram (clickable nodes)
   Right: Tree panel (<details>/<summary>) with full detail
   Breadcrumb navigation, highlight on selection */

// ─── STATE ───────────────────────────────────────────
let view = 'macro';       // 'macro' | phaseId | sectionId
let selected = null;       // highlighted node id within current view
let breadcrumbPath = [];   // [{id, label, icon}]

// ─── SVG HELPERS ─────────────────────────────────────
const NS = 'http://www.w3.org/2000/svg';
const ARROW_DEFS = `<defs>
<marker id="ah" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0,8 3,0 6" fill="#555570"/></marker>
<marker id="ahg" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0,8 3,0 6" fill="#22c55e"/></marker>
<marker id="ahr" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0,8 3,0 6" fill="#ef4444"/></marker>
</defs>`;

function svgEl(w, h) { return `<svg xmlns="${NS}" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${ARROW_DEFS}`; }
function rect(x,y,w,h,color,op=.15,rx=10,sw=1.5) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${color}" fill-opacity="${op}" stroke="${color}" stroke-width="${sw}"/>`;
}
function txt(x,y,t,sz=11,col='#e4e4ef',wt=600,anchor='middle') {
  return `<text x="${x}" y="${y}" fill="${col}" font-size="${sz}" font-weight="${wt}" text-anchor="${anchor}">${esc(t)}</text>`;
}
function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function arrow(x1,y1,x2,y2,flow=false,mk='ah') {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#555570" stroke-width="1.5" marker-end="url(#${mk})" ${flow?'class="flow-line"':''}/>`;
}
function arrowP(d,flow=false,col='#555570',mk='ah') {
  return `<path d="${d}" stroke="${col}" stroke-width="1.5" fill="none" marker-end="url(#${mk})" ${flow?'class="flow-line"':''}/>`;
}
function nodeG(x,y,w,h,color,label,sub,dataId,rx=10,tooltip='') {
  const tip = tooltip || (sub ? `${label} — ${sub}` : label || '');
  let s = `<g class="node" data-id="${dataId}" style="--glow-color:${color}80" tabindex="0" role="button" aria-label="${esc(tip)}">`;
  s += `<title>${esc(tip)}</title>`;
  s += rect(x,y,w,h,color,.15,rx);
  if (label) s += txt(x+w/2, y+h/2-(sub?6:0), label, 11);
  if (sub) s += txt(x+w/2, y+h/2+10, sub, 8, 'rgba(255,255,255,.5)', 400);
  return s + '</g>';
}
function staticG(x,y,w,h,color,label,sub,rx=10) {
  let s = rect(x,y,w,h,color,.12,rx);
  if (label) s += txt(x+w/2, y+h/2-(sub?6:0), label, 11);
  if (sub) s += txt(x+w/2, y+h/2+10, sub, 8, 'rgba(255,255,255,.5)', 400);
  return s;
}
function gateG(x,y,w,h,label) {
  return `<g class="gate-glow"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="#22c55e" fill-opacity=".1" stroke="#22c55e" stroke-width="1.5" stroke-dasharray="4 2"/>${txt(x+w/2,y+h/2+1,label,10,'#22c55e',700)}</g>`;
}

// ─── DATA: PHASES ────────────────────────────────────
const PHASES = [
  { id:'ph0', name:'Phase 0', full:'Discovery', color:'#3b82f6', icon:'🔍',
    desc:'Analyse concurrentielle et découverte du secteur client',
    input:'brief-client.json', output:'ph0-discovery-report.md', outputSub:'7 sections + score /10',
    gate:'μ ≥ 7.0', timeout:'5 min',
    agents:[
      {id:'web-scout', name:'web-scout', role:'Scrape 5 concurrents + analyse SWOT',
       inputs:['brief-client.json','URLs secteur'], process:['Scrape pages concurrents','Analyse Forces/Faiblesses','SWOT matrix','Classement par score'], outputs:['Rapport SWOT','Classement concurrents','swot-matrix.json']},
      {id:'tech-inspector', name:'tech-inspector', role:'Stack technique concurrents',
       inputs:['URLs concurrents'], process:['Détection framework/CMS','CDN, hosting, edge','Technologies front-end','Bundles JS / taille'], outputs:['Rapport stacks','Recommandations techniques']},
      {id:'ux-analyst', name:'ux-analyst', role:'Patterns UX dominants du secteur',
       inputs:['Screenshots concurrents'], process:['Analyse navigation patterns','Patterns CTA & conversion','Social proof audit','Mobile UX review'], outputs:['Rapport UX patterns','Best practices secteur']},
      {id:'content-evaluator', name:'content-evaluator', role:'Évalue contenu existant',
       inputs:['Contenu client actuel'], process:['Inventaire pages','Qualité rédactionnelle','Gaps de contenu','Ton & voix actuels'], outputs:['Audit contenu','Propositions structure']},
      {id:'design-critic', name:'design-critic', role:'Benchmark design visuel',
       inputs:['Visuels concurrents'], process:['Analyse couleurs/typo','Layouts & grilles','Tendances design 2026','Cohérence visuelle'], outputs:['Benchmark design','Recommandations visuelles']}
    ]},
  { id:'ph1', name:'Phase 1', full:'Strategy', color:'#8b5cf6', icon:'🎯',
    desc:'Positionnement, architecture info et planification technique',
    input:'ph0-discovery-report.md', output:'ph1-strategy-report.md', outputSub:'+ scaffold-plan.json',
    gate:'μ ≥ 8.0', timeout:'5 min',
    agents:[
      {id:'brand-strategist', name:'brand-strategist', role:'Positionnement, voix, palette',
       inputs:['ph0-discovery-report.md'], process:['Définir positionnement','Voix & ton de marque','Palette couleurs primaire'], outputs:['Charte de marque','Directives voix']},
      {id:'info-architect', name:'info-architect', role:'Architecture info, navigation, routes',
       inputs:['Brief + ph0 report'], process:['Arbre de navigation','Routes Next.js App Router','Hiérarchie contenu par page'], outputs:['Sitemap logique','Architecture pages']},
      {id:'seo-strategist', name:'seo-strategist', role:'Mots-clés, meta, JSON-LD',
       inputs:['ph0 report + secteur'], process:['Recherche mots-clés (FR/EN)','Stratégie meta tags','Plan JSON-LD schemas'], outputs:['Stratégie SEO','Keyword map']},
      {id:'solution-architect', name:'solution-architect', role:'Stack technique Next.js 15+',
       inputs:['Brief + contraintes'], process:['Choix stack & versions','Architecture composants','Plan intégrations tierces'], outputs:['Architecture technique','Stack decisions']},
      {id:'scaffold-planner', name:'scaffold-planner', role:'Arbre fichiers complet',
       inputs:['Architecture + stack'], process:['Générer scaffold-plan.json','Routes, composants, configs','Dépendances npm listées'], outputs:['scaffold-plan.json','Arbre fichiers']}
    ]},
  { id:'ph2', name:'Phase 2', full:'Design', color:'#f59e0b', icon:'🎨',
    desc:'Système design, wireframes, animations et responsive',
    input:'ph0 + ph1 rapports', output:'ph2-design-report.md', outputSub:'+ design-tokens.json',
    gate:'μ ≥ 8.0', timeout:'10 min',
    agents:[
      {id:'design-system', name:'design-system', role:'Tokens, palette AA, typo, spacing',
       inputs:['Brand strategy','ph1 report'], process:['Palette contraste AA (4.5:1)','Échelle typographique','Spacing, shadows, radii'], outputs:['design-tokens.json','Guidelines visuelles']},
      {id:'layout-designer', name:'layout-designer', role:'Wireframes textuels par page',
       inputs:['Architecture info','Tokens'], process:['Wireframe hero section','Wireframe features/CTA','Footer & navigation layout'], outputs:['Wireframes par page','Layout specifications']},
      {id:'interaction-designer', name:'interaction-designer', role:'Animations Framer Motion',
       inputs:['Wireframes','Tokens'], process:['Micro-interactions définies','Transitions entre pages','prefers-reduced-motion support'], outputs:['Animation specs','Motion guidelines']},
      {id:'responsive-spec', name:'responsive-spec.', role:'Mobile-first, breakpoints',
       inputs:['Wireframes','Tokens'], process:['Breakpoints Tailwind standard','Mobile adaptations par page','Touch targets ≥ 44px'], outputs:['Responsive specs','Breakpoint rules']},
      {id:'asset-director', name:'asset-director', role:'Images, icônes, favicon, OG',
       inputs:['Design tokens','Brand'], process:['Sélection images Unsplash','Icônes Lucide React','OG image 1200×630'], outputs:['Asset list complète','Image specifications']}
    ]},
  { id:'ph3', name:'Phase 3', full:'Content', color:'#10b981', icon:'✍',
    desc:'Rédaction, SEO, i18n et traduction',
    input:'ph0 + ph1 + ph2', output:'ph3-content-report.md', outputSub:'+ messages/fr.json + en.json',
    gate:'μ ≥ 8.0', timeout:'10 min',
    agents:[
      {id:'copywriter', name:'copywriter', role:'Rédaction FR (hero, sections, CTA)',
       inputs:['Brand voice','Wireframes'], process:['Rédaction hero accrocheuse','Sections & CTA persuasifs','Micro-copy (boutons, labels)'], outputs:['Contenu FR complet','messages/fr.json']},
      {id:'seo-copywriter', name:'seo-copywriter', role:'SEO in-text, meta <160 chars',
       inputs:['Contenu FR','Keyword map'], process:['Optimisation mots-clés naturelle','Meta descriptions <160 chars','Alt text images descriptifs'], outputs:['Contenu SEO-optimisé','Meta tags']},
      {id:'content-arch', name:'content-arch.', role:'Structure i18n next-intl',
       inputs:['Contenu FR','Architecture'], process:['Clés hiérarchiques JSON','Format home.hero.title','Validation structure i18n'], outputs:['Structure i18n','Clés next-intl']},
      {id:'translator', name:'translator', role:'Traduction FR → EN (adaptation)',
       inputs:['messages/fr.json'], process:['Traduction culturelle (pas littérale)','Adaptation expressions locales','Vérification cohérence bilingue'], outputs:['messages/en.json','Rapport traduction']},
      {id:'reviewer', name:'reviewer', role:'Gate-keeper qualité éditoriale',
       inputs:['Tous les contenus'], process:['Orthographe/grammaire FR+EN','Cohérence voix de marque','Validation finale qualité'], outputs:['Rapport qualité','PASS/FAIL']}
    ]},
  { id:'ph4', name:'Phase 4', full:'Build', color:'#eab308', icon:'🔨',
    desc:'Génération code, composants React, pages Next.js',
    input:'ph1-3 + scaffold + tokens', output:'clients/{slug}/site/', outputSub:'+ ph4-build-log.md',
    gate:'BUILD PASS', timeout:'20 min',
    agents:[
      {id:'bootstrapper', name:'bootstrapper', role:'Templates sécurisés, next.config',
       inputs:['scaffold-plan.json','Templates NEXOS'], process:['Copier templates sécurisés','next.config, vercel.json','cookie-consent, privacy page'], outputs:['Squelette projet','Configs sécurisées']},
      {id:'component-builder', name:'component-builder', role:'Composants React/Tailwind',
       inputs:['Wireframes','Tokens','i18n'], process:['Composants UI atomiques','Tailwind utility classes','Props TypeScript strict'], outputs:['src/components/','Composants testés']},
      {id:'page-assembler', name:'page-assembler', role:'Pages Next.js App Router',
       inputs:['Composants','Routes'], process:['Assembler pages complètes','Layout [locale] + metadata','generateStaticParams()'], outputs:['src/app/[locale]/','Pages complètes']},
      {id:'integration-eng', name:'integration-eng.', role:'next/font, dynamic imports',
       inputs:['Code source'], process:['next/font (jamais <link>)','dynamic() pour below-fold','safeError() sanitization'], outputs:['Code optimisé','Intégrations clean']},
      {id:'seo-assets', name:'seo-assets', role:'Sitemap, robots, OG, favicon',
       inputs:['Routes','Design tokens'], process:['sitemap.xml multilingue','robots.txt + sitemap ref','OG image, favicon, JSON-LD'], outputs:['public/ assets','SEO assets']},
      {id:'build-validator', name:'build-validator', role:'tsc, vitest, npm run build',
       inputs:['Code source complet'], process:['tsc --noEmit (0 errors)','vitest run','npm run build (exit 0)'], outputs:['BUILD PASS/FAIL','ph4-build-log.md']}
    ]},
  { id:'ph5', name:'Phase 5', full:'QA + Deploy', color:'#ef4444', icon:'🚀',
    desc:'23 agents QA en 8 groupes + déploiement Vercel',
    input:'ph4-build-log + tooling/', output:'ph5-qa-report.md', outputSub:'12 sections + scoring SOIC',
    gate:'μ ≥ 8.5', timeout:'30 min',
    groups:[
      {name:'Performance', color:'#f59e0b', agents:[
        {id:'lighthouse-runner',name:'lighthouse-runner',role:'Lighthouse scores',inputs:['tooling/lighthouse.json'],process:['Analyse LCP/FID/CLS/TTFB','Score performance global','Recommandations optimisation'],outputs:['Scores Lighthouse','Actions perf']},
        {id:'bundle-analyzer',name:'bundle-analyzer',role:'Chunks JS > 100KB',inputs:['Code source build'],process:['Analyse taille bundles','Détection chunks lourds','Code splitting suggestions'],outputs:['Rapport bundles','Optimisations']},
        {id:'image-optimizer',name:'image-optimizer',role:'WebP/AVIF, lazy',inputs:['public/ images'],process:['Format optimal WebP/AVIF','Compression < 200KB','Alt + lazy loading check'],outputs:['Images optimisées','Rapport images']},
        {id:'css-purger',name:'css-purger',role:'CSS/Tailwind inutilisé',inputs:['Styles + HTML output'],process:['Détection CSS mort','Purge Tailwind config','Réduction taille CSS'],outputs:['CSS purgé','Rapport CSS']},
        {id:'cache-strategy',name:'cache-strategy',role:'Headers cache HTTP',inputs:['vercel.json config'],process:['Cache-Control optimal','stale-while-revalidate','CDN edge strategy'],outputs:['Config cache','Headers optimisés']}
      ]},
      {name:'Sécurité', color:'#ef4444', agents:[
        {id:'security-headers',name:'security-headers',role:'6+ headers HTTP',inputs:['tooling/headers.json'],process:['Vérifier HSTS, CSP','X-Frame, X-Content-Type','Permissions-Policy'],outputs:['Rapport headers','Fix manquants']},
        {id:'ssl-auditor',name:'ssl-auditor',role:'TLS/SSL audit',inputs:['tooling/ssl.json'],process:['Version TLS ≥ 1.2','Certificat valide','Cipher suites modernes'],outputs:['Rapport SSL','Score TLS']},
        {id:'xss-scanner',name:'xss-scanner',role:'dangerouslySetInnerHTML, eval',inputs:['Code source JSX'],process:['Scan XSS patterns','eval/innerHTML détection','DOMPurify presence check'],outputs:['Vulnérabilités XSS','Corrections']},
        {id:'dep-vulnerability',name:'dep-vulnerability',role:'npm audit',inputs:['tooling/npm-audit.json'],process:['Analyse CVE connues','Severity HIGH/CRITICAL','Upgrade paths proposés'],outputs:['Rapport CVE','Fix commands']},
        {id:'csp-generator',name:'csp-generator',role:'Content-Security-Policy',inputs:['Code + assets externes'],process:['Analyser sources tierces','Générer CSP strict','Nonces si inline nécessaire'],outputs:['CSP header','Rapport CSP']}
      ]},
      {name:'SEO', color:'#818cf8', agents:[
        {id:'seo-meta-auditor',name:'seo-meta-auditor',role:'title, OG, hreflang',inputs:['Pages HTML rendues'],process:['Vérifier meta tags par page','OG tags complets','hreflang alternate links'],outputs:['Rapport meta','Fix manquants']},
        {id:'jsonld-generator',name:'jsonld-generator',role:'Organization, WebSite',inputs:['Layout + données client'],process:['JSON-LD Organization','WebSite + SearchAction','Service/Product schemas'],outputs:['Scripts JSON-LD','Validation schema.org']},
        {id:'sitemap-validator',name:'sitemap-validator',role:'Cohérence sitemap/robots',inputs:['sitemap.xml','robots.txt'],process:['URLs valides et accessibles','Cohérence avec routes app','Multilingue hreflang correct'],outputs:['Validation sitemap','Erreurs corrigées']},
        {id:'broken-link-checker',name:'broken-link-checker',role:'HTTP 200, ancres',inputs:['Toutes les pages'],process:['Vérifier liens internes 200','Liens externes accessibles','Ancres mailto/tel valides'],outputs:['Liens cassés','Fix links']}
      ]},
      {name:'Accessibilité', color:'#2dd4bf', agents:[
        {id:'a11y-auditor',name:'a11y-auditor',role:'WCAG 2.2 AA',inputs:['tooling/pa11y.json'],process:['Analyse violations WCAG','Catégorisation sévérité','Priorité de correction'],outputs:['Rapport a11y','Actions correctives']},
        {id:'contrast-fixer',name:'contrast-fixer',role:'AA 4.5:1, large 3:1',inputs:['Design tokens','Pages'],process:['Vérifier contrastes texte','Correction palette si besoin','Large text ratio 3:1'],outputs:['Palette corrigée','Rapport contraste']},
        {id:'keyboard-nav',name:'keyboard-nav',role:'Skip-links, tab, focus',inputs:['Pages HTML'],process:['Skip-link fonctionnel','Tab order logique','Focus visible sur tous éléments'],outputs:['Rapport clavier','Fix a11y']}
      ]},
      {name:'Code', color:'#a3e635', agents:[
        {id:'test-coverage',name:'test-coverage',role:'Fichiers non testés',inputs:['Tests + source'],process:['Détection fichiers sans tests','Composants critiques non testés','Coverage report global'],outputs:['Rapport coverage','Tests manquants']},
        {id:'typo-fixer',name:'typo-fixer',role:'Orthographe FR, typographie',inputs:['Contenus texte'],process:['Spell check FR/EN','Typographie française (« »)','Guillemets et apostrophes'],outputs:['Corrections typo','Rapport']}
      ]},
      {name:'Conformité', color:'#fb923c', agents:[
        {id:'legal-compliance',name:'legal-compliance',role:'28 points Loi 25 QC',inputs:['Site complet déployé'],process:['28 checks Loi 25','Cookies, politique, mentions','Score dimension D8'],outputs:['Score Loi 25 /100','Rapport conformité']}
      ]},
      {name:'Post-Deploy', color:'#64748b', agents:[
        {id:'post-deploy',name:'post-deploy',role:'GSC, Analytics, DNS',inputs:['Site déployé Vercel'],process:['Google Search Console setup','Analytics/GTM config','DNS verification'],outputs:['Checklist post-deploy','Configs externes']}
      ]},
      {name:'Gate-Keepers', color:'#22c55e', agents:[
        {id:'deploy-master',name:'deploy-master',role:'Vercel deploy si μ ≥ 8.5',inputs:['Tous les rapports QA'],process:['Score μ final calculé','Vérifier D4/D8 non-bloquants','Décision DEPLOY ou FAIL'],outputs:['DEPLOY ou FAIL','Commande Vercel']},
        {id:'visual-qa',name:'visual-qa',role:'Consolide rapport 12 sections',inputs:['Tous rapports agents'],process:['Consolider 12 sections','Score global SOIC','Rapport final formaté'],outputs:['ph5-qa-report.md','Score final μ']}
      ]}
    ]}
];

// ─── DATA: TOOLING ───────────────────────────────────
const TOOLING = {id:'tooling', name:'Tooling', full:'Preflight Scans', color:'#06b6d4', icon:'🔧',
  desc:'6 scans CLI réels — mesures objectives, pas des estimations LLM',
  steps:[
    {id:'lighthouse-scan',name:'lighthouse-scan.sh',role:'Lighthouse CI headless',tool:'Lighthouse',timeout:'60s',output:'lighthouse.json',desc:'Performance, a11y, SEO, best-practices via Chrome headless'},
    {id:'a11y-scan',name:'a11y-scan.sh',role:'pa11y WCAG 2.2 AA',tool:'pa11y',timeout:'60s',output:'pa11y.json',desc:'Violations accessibilité WCAG 2.2 niveau AA'},
    {id:'headers-scan',name:'headers-scan.sh',role:'curl -sI headers HTTP',tool:'curl',timeout:'30s',output:'headers.json',desc:'6 headers sécurité : HSTS, CSP, X-Frame, etc.'},
    {id:'ssl-scan',name:'ssl-scan.sh',role:'testssl.sh / openssl',tool:'testssl',timeout:'30s',output:'ssl.json',desc:'TLS version, certificat, cipher suites'},
    {id:'deps-scan',name:'deps-scan.sh',role:'npm audit --json',tool:'npm audit',timeout:'30s',output:'npm-audit.json',desc:'CVE connues dans les dépendances npm'},
    {id:'osiris-scan',name:'osiris-scan.sh',role:'Scanner sobriété web',tool:'OSIRIS',timeout:'60s',output:'osiris.json',desc:'Éco-conception et sobriété numérique'}
  ]};

// ─── DATA: SOIC v3 ───────────────────────────────────
const SOIC = {id:'soic', name:'SOIC v3', full:'Quality Gates', color:'#a78bfa', icon:'⚖',
  desc:'Synthèse Objective Intégrée de Conformité — 9 dimensions pondérées',
  formula:'μ = Σ(Di × Wi) / ΣWi',
  dims:[
    {id:'D1',name:'Architecture',weight:1.0,blocking:false,desc:'Structure projet, organisation fichiers, patterns'},
    {id:'D2',name:'Documentation',weight:0.8,blocking:false,desc:'README, JSDoc, commentaires, guides'},
    {id:'D3',name:'Tests',weight:0.9,blocking:false,desc:'Coverage, qualité tests, edge cases'},
    {id:'D4',name:'Sécurité',weight:1.2,blocking:true,desc:'Headers, CSP, XSS, CVE, secrets'},
    {id:'D5',name:'Performance',weight:1.0,blocking:false,desc:'Core Web Vitals, bundles, images'},
    {id:'D6',name:'Accessibilité',weight:1.1,blocking:false,desc:'WCAG 2.2 AA, contrastes, clavier'},
    {id:'D7',name:'SEO',weight:1.0,blocking:false,desc:'Meta, JSON-LD, sitemap, hreflang'},
    {id:'D8',name:'Conformité',weight:1.1,blocking:true,desc:'Loi 25 QC, RGPD, cookies, mentions'},
    {id:'D9',name:'Code Quality',weight:0.9,blocking:false,desc:'ESLint, TypeScript strict, conventions'}
  ],
  gates:[
    {id:'W-01',name:'project-structure',dim:'D1',priority:'Normal'},
    {id:'W-02',name:'documentation',dim:'D2',priority:'Normal'},
    {id:'W-03',name:'tests-run',dim:'D3',priority:'Normal'},
    {id:'W-04',name:'coverage ≥80%',dim:'D3',priority:'Normal'},
    {id:'W-05',name:'dependencies',dim:'D4',priority:'Critique'},
    {id:'W-06',name:'security-headers 6+',dim:'D4',priority:'Critique'},
    {id:'W-07',name:'no-client-secrets',dim:'D4',priority:'Critique'},
    {id:'W-08',name:'perf-core-vitals',dim:'D5',priority:'Haute'},
    {id:'W-09',name:'code-splitting',dim:'D5',priority:'Haute'},
    {id:'W-10',name:'accessibility-pa11y',dim:'D6',priority:'Haute'},
    {id:'W-11',name:'aria-attributes',dim:'D6',priority:'Haute'},
    {id:'W-12',name:'seo-meta-basic',dim:'D7',priority:'Normal'},
    {id:'W-13',name:'seo-advanced',dim:'D7',priority:'Normal'},
    {id:'W-14',name:'legal-compliance',dim:'D8',priority:'Bloquant'},
    {id:'W-15',name:'linting eslint',dim:'D9',priority:'Normal'},
    {id:'W-16',name:'typescript-strict',dim:'D9',priority:'Normal'},
    {id:'W-17',name:'cookie-consent',dim:'D8',priority:'Bloquant'}
  ]};

// ─── DATA: CONVERGENCE ───────────────────────────────
const CONVERGENCE = {id:'convergence', name:'Convergence', full:'Boucle autonome', color:'#f472b6', icon:'🔄',
  desc:'PhaseIterator — max 4 itérations par phase avec feedback automatique',
  decisions:[
    {id:'ACCEPT',desc:'μ ≥ seuil ET pas de blocage D4/D8',action:'Phase validée → avancer à la suivante',color:'#22c55e'},
    {id:'ITERATE',desc:'μ < seuil, marge de progression détectée',action:'Re-exécuter la phase avec feedback ciblé',color:'#f472b6'},
    {id:'ABORT_PLATEAU',desc:'2 deltas μ ≤ 0 consécutifs',action:'Stop — plus d\'amélioration possible',color:'#ef4444'},
    {id:'ABORT_MAX_ITER',desc:'Maximum 4 itérations atteintes',action:'Stop — limite d\'itérations atteinte',color:'#ef4444'},
    {id:'ABORT_LOW_COV',desc:'Coverage < 0.7 après itération 2',action:'Stop — données insuffisantes pour scoring',color:'#ef4444'}
  ],
  flow:['GateEngine.run_all_gates()','Converger.decide()','FeedbackRouter.generate()','RerunContext.rerun()','RunStore.save_run()']
};

// ─── DATA: TEMPLATES ─────────────────────────────────
const TEMPLATES = {id:'templates', name:'Templates', full:'15 Templates Sécurisés', color:'#34d399', icon:'📄',
  desc:'Fichiers de base pré-sécurisés copiés par le bootstrapper en Phase 4',
  items:[
    {id:'t-next-config',name:'next.config.ts',role:'Config Next.js avec headers sécurité',category:'Config',placeholders:['siteName','defaultLocale','locales[]']},
    {id:'t-vercel-json',name:'vercel.json',role:'Config Vercel + headers HTTP',category:'Config',placeholders:['projectName','framework']},
    {id:'t-layout',name:'layout.tsx',role:'Root layout App Router avec metadata',category:'Layout',placeholders:['siteName','description','locale']},
    {id:'t-page',name:'page.tsx',role:'Page template avec generateMetadata',category:'Pages',placeholders:['pageTitle','sections[]']},
    {id:'t-hero',name:'HeroSection.tsx',role:'Section hero avec CTA et i18n',category:'Components',placeholders:['headline','subline','ctaText','ctaHref']},
    {id:'t-features',name:'FeaturesSection.tsx',role:'Grille features responsive',category:'Components',placeholders:['features[]','columns']},
    {id:'t-cta',name:'CTASection.tsx',role:'Call-to-action avec conversion tracking',category:'Components',placeholders:['title','buttonText','href']},
    {id:'t-footer',name:'Footer.tsx',role:'Footer avec liens légaux et social',category:'Components',placeholders:['links[]','socialLinks[]']},
    {id:'t-cookie',name:'CookieConsent.tsx',role:'Bandeau cookies Loi 25 natif',category:'Conformité',placeholders:['policyUrl','categories[]']},
    {id:'t-privacy',name:'privacy-policy/page.tsx',role:'Page politique de confidentialité',category:'Conformité',placeholders:['companyName','email','dataTypes[]']},
    {id:'t-terms',name:'terms/page.tsx',role:'Page conditions d\'utilisation',category:'Conformité',placeholders:['companyName','jurisdiction']},
    {id:'t-sitemap',name:'sitemap.ts',role:'Sitemap dynamique multilingue',category:'SEO',placeholders:['baseUrl','locales[]','routes[]']},
    {id:'t-robots',name:'robots.ts',role:'robots.txt avec sitemap ref',category:'SEO',placeholders:['baseUrl','disallow[]']},
    {id:'t-manifest',name:'manifest.json',role:'PWA manifest basique',category:'Config',placeholders:['name','shortName','themeColor']},
    {id:'t-env',name:'.env.example',role:'Variables d\'environnement documentées',category:'Config',placeholders:['NEXT_PUBLIC_*','ANALYTICS_ID']}
  ]};

// ─── DATA: LOI 25 ────────────────────────────────────
const LOI25 = {id:'loi25', name:'Loi 25', full:'Conformité Québec', color:'#fb923c', icon:'⚖',
  desc:'28 points de vérification — Loi sur la protection des renseignements personnels (Québec)',
  sections:[
    {id:'A',name:'Politique de confidentialité',color:'#fb923c',checks:[
      {id:'A1',text:'Politique accessible en ≤2 clics depuis toute page'},
      {id:'A2',text:'Types de renseignements collectés listés explicitement'},
      {id:'A3',text:'Fins de la collecte décrites clairement'},
      {id:'A4',text:'Durée de conservation spécifiée'},
      {id:'A5',text:'Coordonnées du responsable de la protection'},
      {id:'A6',text:'Date de dernière mise à jour visible'}
    ]},
    {id:'B',name:'Consentement & Cookies',color:'#f59e0b',checks:[
      {id:'B1',text:'Bandeau cookie affiché avant tout tracking'},
      {id:'B2',text:'Consentement granulaire par catégorie (nécessaire/analytique/marketing)'},
      {id:'B3',text:'Option "Tout refuser" aussi visible que "Tout accepter"'},
      {id:'B4',text:'Aucun cookie non-essentiel avant consentement'},
      {id:'B5',text:'Préférences modifiables après coup'},
      {id:'B6',text:'Consentement enregistré avec horodatage'}
    ]},
    {id:'C',name:'Droits des utilisateurs',color:'#3b82f6',checks:[
      {id:'C1',text:'Droit d\'accès aux renseignements personnels'},
      {id:'C2',text:'Droit de rectification'},
      {id:'C3',text:'Droit de suppression / désindexation'},
      {id:'C4',text:'Formulaire de demande accessible'},
      {id:'C5',text:'Délai de réponse ≤ 30 jours mentionné'},
      {id:'C6',text:'Procédure de plainte décrite'}
    ]},
    {id:'D',name:'Mesures de sécurité',color:'#ef4444',checks:[
      {id:'D1',text:'HTTPS obligatoire (TLS 1.2+)'},
      {id:'D2',text:'Headers sécurité : HSTS, CSP, X-Frame-Options'},
      {id:'D3',text:'Pas de secrets côté client (clés API exposées)'},
      {id:'D4',text:'Chiffrement des données sensibles'},
      {id:'D5',text:'Journalisation des accès aux données'},
      {id:'D6',text:'Protocole en cas d\'incident de confidentialité'}
    ]},
    {id:'E',name:'Conformité organisationnelle',color:'#8b5cf6',checks:[
      {id:'E1',text:'Responsable de la protection désigné'},
      {id:'E2',text:'Évaluation des facteurs relatifs à la vie privée (ÉFVP)'},
      {id:'E3',text:'Registre des incidents tenu à jour'},
      {id:'E4',text:'Formation des employés sur la protection des RP'}
    ]}
  ]};

// ─── DATA: SITE UPDATE (mode modify) ────────────────
const SITE_UPDATE = {id:'site-update', name:'Site Update', full:'Pipeline Modification', color:'#14b8a6', icon:'🔄',
  desc:'Pipeline de modification — ajouter/modifier des pages sur un site existant',
  agents:[
    {id:'change-analyst',name:'change-analyst',role:'Analyse impact du changement demandé',
     inputs:['Demande client','Site existant'], process:['Identifier pages impactées','Évaluer risques de régression','Estimer scope du changement'], outputs:['Impact analysis','Change plan']},
    {id:'content-updater',name:'content-updater',role:'Mise à jour contenu i18n',
     inputs:['Change plan','messages/*.json'], process:['Modifier clés i18n','Ajouter nouveau contenu','Valider cohérence bilingue'], outputs:['messages/ mis à jour','Diff contenu']},
    {id:'component-patcher',name:'component-patcher',role:'Modifier/créer composants',
     inputs:['Change plan','Composants existants'], process:['Patcher composants existants','Créer nouveaux si nécessaire','Respecter design system'], outputs:['Composants modifiés','Rapport patches']},
    {id:'regression-tester',name:'regression-tester',role:'Tests de non-régression',
     inputs:['Code modifié','Tests existants'], process:['Exécuter tests existants','Ajouter tests pour changements','Vérifier aucune régression'], outputs:['Rapport tests','PASS/FAIL']},
    {id:'incremental-deployer',name:'incremental-deployer',role:'Deploy incrémental Vercel',
     inputs:['Code validé','Vercel config'], process:['Build incrémental','Preview deploy','Promotion production si OK'], outputs:['URL preview','URL production']}
  ]};

// ─── DATA: KNOWLEDGE (SOIC-11) ───────────────────────
const KNOWLEDGE = {id:'knowledge', name:'Knowledge', full:'SOIC-11 Knowledge Flow', color:'#818cf8', icon:'🧠',
  desc:'Base de connaissances cumulative — chaque run enrichit le système',
  steps:[
    {id:'k-collect',name:'Collecte',desc:'Résultats bruts des scans tooling + évaluations agents'},
    {id:'k-score',name:'Scoring',desc:'Calcul μ par dimension Di avec pondération Wi'},
    {id:'k-store',name:'Stockage',desc:'Append dans soic-runs.jsonl (historique complet)'},
    {id:'k-compare',name:'Comparaison',desc:'Delta μ entre itérations → tendance amélioration'},
    {id:'k-feedback',name:'Feedback',desc:'Top 5 gates échouées → instructions de correction ciblées'},
    {id:'k-learn',name:'Apprentissage',desc:'Patterns récurrents identifiés → amélioration des templates'}
  ]};

// ─── DATA: STATS ─────────────────────────────────────
const STATS = {
  agents: 46, phases: 6, dimensions: 9, gates: 17,
  checksLoi25: 28, templates: 15, tools: 6, modes: 5,
  stack: ['Next.js 15+','TypeScript strict','Tailwind CSS','Vercel','next-intl','Framer Motion'],
  modes: ['create','audit','modify','content','knowledge']
};

// ─── ALL SECTIONS (for macro view) ───────────────────
const ALL_SECTIONS = {
  ph0: PHASES[0], ph1: PHASES[1], ph2: PHASES[2], ph3: PHASES[3], ph4: PHASES[4], ph5: PHASES[5],
  tooling: TOOLING, soic: SOIC, convergence: CONVERGENCE,
  templates: TEMPLATES, loi25: LOI25, 'site-update': SITE_UPDATE, knowledge: KNOWLEDGE
};

function getSection(id) { return ALL_SECTIONS[id] || null; }

function getAgent(sectionId, agentId) {
  const s = getSection(sectionId);
  if (!s) return null;
  if (s.agents) return s.agents.find(a => a.id === agentId) || null;
  if (s.groups) {
    for (const g of s.groups) {
      const a = g.agents.find(a => a.id === agentId);
      if (a) return a;
    }
  }
  return null;
}

// ─── NAVIGATION ──────────────────────────────────────
function updateHash() {
  const hash = view === 'macro' ? '' : (selected ? `${view}/${selected}` : view);
  const target = hash ? `#${hash}` : ' ';
  if (location.hash.slice(1) !== hash) history.pushState(null, '', hash ? `#${hash}` : location.pathname);
}

function navFromHash() {
  const h = location.hash.slice(1);
  if (!h) { view = 'macro'; selected = null; }
  else if (h.includes('/')) { const [v, s] = h.split('/'); view = v; selected = s; }
  else { view = h; selected = null; }
  render();
}

function nav(newView, nodeId) {
  view = newView;
  selected = nodeId || null;
  updateHash();
  render();
}

function selectNode(nodeId) {
  selected = (selected === nodeId) ? null : nodeId;
  updateHash();
  applyHighlight(selected);
  renderTree();
}

// ─── BREADCRUMB ──────────────────────────────────────
function renderBreadcrumb() {
  const el = document.getElementById('breadcrumb');
  let h = `<span class="crumb ${view==='macro'?'current':''}" data-nav="macro">🏠 NEXOS Pipeline</span>`;
  if (view !== 'macro') {
    const s = getSection(view);
    if (s) {
      h += `<span class="crumb-sep">›</span>`;
      h += `<span class="crumb ${!selected?'current':''}" data-nav="${view}">${s.icon||''} ${s.name} — ${s.full}</span>`;
    }
    if (selected) {
      const a = getAgent(view, selected);
      const label = a ? a.name : selected;
      h += `<span class="crumb-sep">›</span>`;
      h += `<span class="crumb current">🤖 ${esc(label)}</span>`;
    }
  }
  el.innerHTML = h;
  el.querySelectorAll('.crumb[data-nav]').forEach(c => {
    c.addEventListener('click', () => nav(c.dataset.nav));
  });
}

// ─── MAIN RENDER ─────────────────────────────────────
function render() {
  renderBreadcrumb();
  renderDiagram();
  renderTree();
}

// ─── DIAGRAM PANEL ───────────────────────────────────
let _lastView = null;
function renderDiagram() {
  const el = document.getElementById('diagram-panel');
  const viewChanged = (_lastView !== view);
  _lastView = view;

  if (viewChanged) {
    el.classList.add('view-fade');
    requestAnimationFrame(() => {
      if (view === 'macro') { el.innerHTML = renderMacroSVG(); }
      else { el.innerHTML = renderSectionSVG(view); }
      attachDiagramHandlers(el);
      if (selected) applyHighlight(selected);
      requestAnimationFrame(() => el.classList.remove('view-fade'));
    });
    return;
  }

  if (view === 'macro') { el.innerHTML = renderMacroSVG(); }
  else { el.innerHTML = renderSectionSVG(view); }
  attachDiagramHandlers(el);
  if (selected) applyHighlight(selected);
}

function attachDiagramHandlers(el) {
  el.querySelectorAll('.node').forEach(n => {
    const handler = (e) => {
      e.stopPropagation();
      if (e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
      if (e.type === 'keydown') e.preventDefault();
      const id = n.dataset.id;
      if (!id) return;
      if (view === 'macro') { nav(id); }
      else { selectNode(id); }
    };
    n.addEventListener('click', handler);
    n.addEventListener('keydown', handler);
  });
}

// ─── SVG: MACRO PIPELINE (Level 0) ──────────────────
function renderMacroSVG() {
  let h = `<div class="hero">
    <h1>NEXOS v3.0</h1>
    <p class="tagline">Pipeline web autonome — du brief au déploiement</p>
    <div class="hero-stats">
      <div class="stat"><span class="val">${STATS.agents}</span><span class="lbl">Agents</span></div>
      <div class="stat"><span class="val">${STATS.phases}</span><span class="lbl">Phases</span></div>
      <div class="stat"><span class="val">${STATS.dimensions}</span><span class="lbl">Dimensions</span></div>
      <div class="stat"><span class="val">${STATS.gates}</span><span class="lbl">Gates</span></div>
      <div class="stat"><span class="val">${STATS.checksLoi25}</span><span class="lbl">Checks Loi 25</span></div>
    </div></div>`;

  // Main pipeline
  const W = 1100, H = 200;
  const nodes = [
    {id:'_brief', label:'Brief', sub:'JSON', color:'#64748b', x:10, static:true},
    {id:'ph0', label:'Phase 0', sub:'Discovery', color:'#3b82f6', x:130},
    {id:'ph1', label:'Phase 1', sub:'Strategy', color:'#8b5cf6', x:250},
    {id:'ph2', label:'Phase 2', sub:'Design', color:'#f59e0b', x:370},
    {id:'ph3', label:'Phase 3', sub:'Content', color:'#10b981', x:490},
    {id:'ph4', label:'Phase 4', sub:'Build', color:'#eab308', x:610},
    {id:'tooling', label:'Tooling', sub:'Preflight', color:'#06b6d4', x:730},
    {id:'ph5', label:'Phase 5', sub:'QA+Deploy', color:'#ef4444', x:850},
    {id:'_deploy', label:'Deploy', sub:'Vercel', color:'#22c55e', x:980, static:true},
  ];
  const nW = 100, nH = 55, nY = 70;
  let svg = svgEl(W, H);

  // Arrows
  for (let i = 0; i < nodes.length-1; i++) {
    svg += arrow(nodes[i].x+nW+2, nY+nH/2, nodes[i+1].x-2, nY+nH/2, true);
  }
  // Gate labels between phases
  const gl = [{x:165,l:'μ≥7.0'},{x:285,l:'μ≥8.0'},{x:405,l:'μ≥8.0'},{x:525,l:'μ≥8.0'},{x:645,l:'BUILD'},{x:775,l:'scans'},{x:895,l:'μ≥8.5'}];
  gl.forEach(g => { svg += txt(g.x+30, nY+nH+22, g.l, 7, '#22c55e', 600); });

  // Nodes
  nodes.forEach(n => {
    if (n.static) svg += staticG(n.x, nY, nW, nH, n.color, n.label, n.sub);
    else svg += nodeG(n.x, nY, nW, nH, n.color, n.label, n.sub, n.id);
  });
  svg += '</svg>';
  h += `<div class="svg-wrap">${svg}</div>`;

  // Secondary row: transversal modules
  const W2 = 1000, H2 = 85;
  let svg2 = svgEl(W2, H2);
  const sec = [
    {id:'soic', label:'SOIC v3', sub:'9 dim.', color:'#a78bfa', x:10},
    {id:'convergence', label:'Convergence', sub:'Boucle', color:'#f472b6', x:175},
    {id:'site-update', label:'Site Update', sub:'Modify', color:'#14b8a6', x:340},
    {id:'knowledge', label:'Knowledge', sub:'SOIC-11', color:'#818cf8', x:505},
    {id:'templates', label:'Templates', sub:'15 fichiers', color:'#34d399', x:670},
    {id:'loi25', label:'Loi 25', sub:'28 checks', color:'#fb923c', x:835},
  ];
  sec.forEach(n => {
    svg2 += nodeG(n.x, 12, 150, 55, n.color, n.label, n.sub, n.id, 8);
  });
  svg2 += '</svg>';
  h += `<div class="svg-wrap" style="margin-top:.25rem">${svg2}</div>`;
  h += `<p class="click-hint">Cliquez sur un bloc pour explorer son contenu</p>`;
  return h;
}

// ─── SVG: SECTION INTERNAL VIEW ──────────────────────
function renderSectionSVG(sectionId) {
  const s = getSection(sectionId);
  if (!s) return '<p>Section introuvable</p>';

  // Route to specialized renderers
  if (s.id === 'ph5') return renderPh5SVG(s);
  if (s.id === 'tooling') return renderToolingSVG(s);
  if (s.id === 'soic') return renderSoicSVG(s);
  if (s.id === 'convergence') return renderConvergenceSVG(s);
  if (s.id === 'templates') return renderTemplatesSVG(s);
  if (s.id === 'loi25') return renderLoi25SVG(s);
  if (s.id === 'site-update') return renderAgentsSVG(s, s.agents);
  if (s.id === 'knowledge') return renderKnowledgeSVG(s);
  if (s.agents) return renderAgentsSVG(s, s.agents);
  return '<p>Vue non disponible</p>';
}

// ─── SVG: Phase with agents (ph0-ph4, site-update) ──
function renderAgentsSVG(section, agents) {
  const n = agents.length;
  let h = `<div class="level-header">
    <h1><span class="icon">${section.icon}</span>${section.name} — ${section.full}</h1>
    <p class="sub">${n} agents${section.gate?' | Gate: '+section.gate:''}${section.timeout?' | Timeout: '+section.timeout:''}</p>
    <div class="color-bar" style="background:${section.color}"></div></div>`;

  const aW = 115, aH = 52, gap = 12;
  const totalW = n * aW + (n-1) * gap;
  const padX = 50;
  const svgW = Math.max(totalW + padX*2, 650);
  const cx = svgW / 2;
  const inputY = 15, orchY = 90, agentY = 185, outputY = 290, gateY = 365;
  const svgH = section.gate ? 430 : 370;

  let svg = svgEl(svgW, svgH);

  // Input
  const iW = 200;
  if (section.input) {
    svg += staticG(cx-iW/2, inputY, iW, 45, '#64748b', section.input, 'Input');
    svg += arrow(cx, inputY+47, cx, orchY-2, true);
  }
  // Orchestrator
  const oW = 210;
  svg += staticG(cx-oW/2, orchY, oW, 45, section.color, '_orchestrator.md', `${n} agents`);

  // Agents fan-out
  const startX = cx - totalW/2;
  agents.forEach((a, i) => {
    const ax = startX + i*(aW+gap);
    const acx = ax + aW/2;
    svg += arrowP(`M${cx},${orchY+45} C${cx},${orchY+70} ${acx},${orchY+70} ${acx},${agentY-2}`, true, section.color);
    svg += nodeG(ax, agentY, aW, aH, section.color, a.name, a.role.substring(0,16)+'…', a.id, 10, `${a.name} — ${a.role}`);
    svg += arrowP(`M${acx},${agentY+aH} C${acx},${agentY+aH+22} ${cx},${agentY+aH+22} ${cx},${outputY-2}`, false);
  });

  // Output
  if (section.output) {
    const outW = 240;
    svg += staticG(cx-outW/2, outputY, outW, 45, '#22c55e', section.output, section.outputSub||'');
    if (section.gate) {
      svg += arrow(cx, outputY+47, cx, gateY-2, false, 'ahg');
      svg += gateG(cx-75, gateY, 150, 38, `GATE: ${section.gate}`);
    }
  }
  svg += '</svg>';
  h += `<div class="svg-wrap">${svg}</div>`;
  h += `<p class="click-hint">Cliquez un agent pour voir ses détails → panneau droit</p>`;
  return h;
}

// ─── SVG: Phase 5 (grouped agents) ──────────────────
function renderPh5SVG(phase) {
  const groups = phase.groups;
  let h = `<div class="level-header">
    <h1><span class="icon">${phase.icon}</span>${phase.name} — ${phase.full}</h1>
    <p class="sub">23 agents en 8 groupes | Gate: ${phase.gate} | Timeout: ${phase.timeout}</p>
    <div class="color-bar" style="background:${phase.color}"></div></div>`;

  const gW = 120, aH = 28, gPad = 22, gBot = 6, gapX = 8;
  let maxA = 0;
  groups.forEach(g => { if (g.agents.length > maxA) maxA = g.agents.length; });
  const gH = gPad + maxA*(aH+3) + gBot;
  const totalW = groups.length*(gW+gapX) - gapX + 30;
  const svgW = Math.max(totalW, 900);
  const svgH = gH + 200;

  let svg = svgEl(svgW, svgH);
  const cx = svgW/2;

  // Input + Orchestrator
  svg += staticG(cx-130, 8, 260, 40, '#64748b', 'ph4-build-log + tooling/', 'Input');
  svg += arrow(cx, 50, cx, 70, true);
  svg += staticG(cx-140, 70, 280, 35, phase.color, '_orchestrator ph5-qa', '23 agents');

  // Groups
  const startX = 15, gY = 130;
  groups.forEach((g, gi) => {
    const gx = startX + gi*(gW+gapX);
    svg += rect(gx, gY, gW, gH, g.color, .06, 7, 1);
    svg += txt(gx+gW/2, gY+13, g.name, 7, g.color, 700);
    svg += arrowP(`M${cx},${105} L${gx+gW/2},${gY-2}`, false, g.color);
    g.agents.forEach((a, ai) => {
      const ay = gY + gPad + ai*(aH+3);
      svg += `<g class="node" data-id="${a.id}" style="--glow-color:${g.color}80" tabindex="0" role="button" aria-label="${esc(a.name+' — '+a.role)}">`;
      svg += `<title>${esc(a.name+' — '+a.role)}</title>`;
      svg += rect(gx+3, ay, gW-6, aH, g.color, .12, 5, 1);
      svg += txt(gx+gW/2, ay+aH/2+1, a.name, 7, '#e4e4ef', 500);
      svg += '</g>';
    });
  });

  // Output + Gate
  const outY = gY + gH + 15;
  svg += arrow(cx, gY+gH+2, cx, outY-2, false);
  svg += staticG(cx-120, outY, 240, 40, '#22c55e', 'ph5-qa-report.md', '12 sections + μ');
  svg += arrow(cx, outY+42, cx, outY+58, false, 'ahg');
  svg += gateG(cx-70, outY+58, 140, 32, `GATE: ${phase.gate}`);

  svg += '</svg>';
  h += `<div class="svg-wrap">${svg}</div>`;
  h += `<p class="click-hint">Cliquez un agent pour voir son processus</p>`;
  return h;
}

// ─── SVG: Tooling ────────────────────────────────────
function renderToolingSVG(t) {
  let h = `<div class="level-header">
    <h1><span class="icon">${t.icon}</span>${t.name} — ${t.full}</h1>
    <p class="sub">${t.desc}</p>
    <div class="color-bar" style="background:${t.color}"></div></div>`;

  const steps = t.steps;
  const tW = 115, tH = 72, gap = 10;
  const totalW = steps.length*tW + (steps.length-1)*gap;
  const svgW = Math.max(totalW+60, 800);
  const cx = svgW/2;
  const svgH = 330;

  let svg = svgEl(svgW, svgH);
  svg += staticG(cx-130, 8, 260, 40, '#64748b', 'clients/{slug}/site/', 'Code source');
  svg += arrow(cx, 50, cx, 70, true);
  svg += staticG(cx-120, 70, 240, 35, t.color, 'run_preflight()', 'build → start → scan');

  const startX = cx - totalW/2;
  const toolY = 135;
  steps.forEach((s, i) => {
    const tx = startX + i*(tW+gap);
    const tcx = tx + tW/2;
    svg += arrowP(`M${cx},${105} C${cx},${120} ${tcx},${120} ${tcx},${toolY-2}`, true, t.color);
    svg += nodeG(tx, toolY, tW, tH, t.color, s.tool, s.timeout, s.id, 8);
    svg += txt(tcx, toolY+tH-8, s.output, 6, 'rgba(255,255,255,.35)', 400);
    svg += arrow(tcx, toolY+tH+2, cx, 260, false);
  });

  svg += staticG(cx-140, 260, 280, 42, '#22c55e', 'tooling/ (6 JSON)', 'Mesures → agents ph5');
  svg += '</svg>';
  h += `<div class="svg-wrap">${svg}</div>`;
  return h;
}

// ─── SVG: SOIC ───────────────────────────────────────
function renderSoicSVG(s) {
  let h = `<div class="level-header">
    <h1><span class="icon">${s.icon}</span>${s.name} — ${s.full}</h1>
    <p class="sub">${s.desc}</p>
    <div class="color-bar" style="background:${s.color}"></div></div>`;

  const svgW = 660, svgH = 380;
  let svg = svgEl(svgW, svgH);
  const cx = svgW/2, cy = 175, r = 145;
  const dimC = ['#60a5fa','#a78bfa','#34d399','#f87171','#fbbf24','#2dd4bf','#818cf8','#fb923c','#a3e635'];

  // Center hub
  svg += `<circle cx="${cx}" cy="${cy}" r="42" fill="${s.color}" fill-opacity=".1" stroke="${s.color}" stroke-width="1.5"/>`;
  svg += txt(cx, cy-5, 'SOIC v3', 11, '#e4e4ef', 700);
  svg += txt(cx, cy+9, 'μ = Σ(Di×Wi)/ΣWi', 7, 'rgba(255,255,255,.5)', 400);

  s.dims.forEach((d, i) => {
    const angle = (Math.PI*2*i/s.dims.length) - Math.PI/2;
    const dx = cx + Math.cos(angle)*r;
    const dy = cy + Math.sin(angle)*r;
    const bw = 95, bh = 40;
    svg += `<line x1="${cx+Math.cos(angle)*44}" y1="${cy+Math.sin(angle)*44}" x2="${dx}" y2="${dy}" stroke="${dimC[i]}" stroke-width="1" stroke-opacity=".35"/>`;
    const cls = d.blocking ? ' class="pulse"' : '';
    svg += `<g${cls}>`;
    svg += `<g class="node" data-id="${d.id}" style="--glow-color:${dimC[i]}80" tabindex="0" role="button" aria-label="${esc(d.id+' '+d.name+' — '+d.desc)}">`;
    svg += `<title>${esc(d.id+' '+d.name+': '+d.desc+(d.blocking?' (BLOQUANT)':''))}</title>`;
    svg += rect(dx-bw/2, dy-bh/2, bw, bh, dimC[i], .15, 7, d.blocking?2:1);
    svg += txt(dx, dy-6, `${d.id} ${d.name}`, 8, '#e4e4ef', d.blocking?700:500);
    svg += txt(dx, dy+7, `×${d.weight}${d.blocking?' ◄BLOQUANT':''}`, 6, d.blocking?'#ef4444':'rgba(255,255,255,.5)', d.blocking?700:400);
    svg += '</g></g>';
  });

  svg += txt(cx, svgH-15, 'D4 ou D8 en FAIL = veto (même si μ ≥ seuil)', 9, '#ef4444', 600);
  svg += '</svg>';
  h += `<div class="svg-wrap">${svg}</div>`;
  return h;
}

// ─── SVG: Convergence ────────────────────────────────
function renderConvergenceSVG(c) {
  let h = `<div class="level-header">
    <h1><span class="icon">${c.icon}</span>${c.name} — ${c.full}</h1>
    <p class="sub">${c.desc}</p>
    <div class="color-bar" style="background:${c.color}"></div></div>`;

  const svgW = 700, svgH = 460;
  let svg = svgEl(svgW, svgH);
  const cx = svgW/2, bW = 250;

  const steps = [
    {y:8, label:'GateEngine.run_all_gates()', sub:'W-01..W-17', color:'#a78bfa'},
    {y:80, label:'Converger.decide()', sub:'ACCEPT / ITERATE / ABORT', color:'#f472b6'},
    {y:195, label:'FeedbackRouter.generate()', sub:'Top 5 gates échouées', color:'#f59e0b'},
    {y:265, label:'RerunContext.rerun()', sub:'Re-invoke + feedback', color:'#06b6d4'},
    {y:335, label:'RunStore.save_run()', sub:'soic-runs.jsonl', color:'#64748b'},
  ];
  steps.forEach((s,i) => {
    svg += nodeG(cx-bW/2, s.y, bW, 48, s.color, s.label, s.sub, 'step-'+i);
    if (i < steps.length-1 && i !== 1) svg += arrow(cx, s.y+50, cx, steps[i+1].y-2, true);
  });

  // Decision diamond
  const dy = 155;
  svg += arrow(cx, 128, cx, dy-17, true);
  svg += `<polygon points="${cx},${dy-15} ${cx+55},${dy} ${cx},${dy+15} ${cx-55},${dy}" fill="#f472b6" fill-opacity=".1" stroke="#f472b6" stroke-width="1.5"/>`;
  svg += txt(cx, dy+2, 'Décision?', 8, '#f472b6', 600);
  svg += arrow(cx, dy+15, cx, 193, true);

  // ACCEPT right
  svg += `<line x1="${cx+55}" y1="${dy}" x2="${cx+155}" y2="${dy}" stroke="#22c55e" stroke-width="1.5" marker-end="url(#ahg)"/>`;
  svg += staticG(cx+160, dy-18, 100, 36, '#22c55e', 'ACCEPT', 'μ OK');

  // ABORT left
  svg += `<line x1="${cx-55}" y1="${dy}" x2="${cx-155}" y2="${dy}" stroke="#ef4444" stroke-width="1.5" marker-end="url(#ahr)"/>`;
  svg += staticG(cx-255, dy-18, 100, 36, '#ef4444', 'ABORT', 'Échec');

  // ITERATE loop
  svg += arrowP(`M${cx+bW/2+4},${345} C${cx+bW/2+50},${345} ${cx+bW/2+50},${25} ${cx+bW/2+4},${25}`, true, '#f472b6');
  svg += txt(cx+bW/2+42, 185, 'ITERATE', 8, '#f472b6', 600);

  // Result
  svg += staticG(cx-120, 405, 240, 42, '#22c55e', 'LoopResult', 'final_mu, converged, iterations');

  svg += '</svg>';
  h += `<div class="svg-wrap">${svg}</div>`;
  return h;
}

// ─── SVG: Templates ──────────────────────────────────
function renderTemplatesSVG(t) {
  let h = `<div class="level-header">
    <h1><span class="icon">${t.icon}</span>${t.name} — ${t.full}</h1>
    <p class="sub">${t.desc}</p>
    <div class="color-bar" style="background:${t.color}"></div></div>`;

  const cats = {};
  t.items.forEach(i => { (cats[i.category] = cats[i.category] || []).push(i); });
  const catNames = Object.keys(cats);
  const cW = 140, gap = 10, iH = 28, cPad = 22, cBot = 6;
  let maxI = 0;
  catNames.forEach(c => { if (cats[c].length > maxI) maxI = cats[c].length; });
  const cH = cPad + maxI*(iH+3) + cBot;
  const totalW = catNames.length*(cW+gap) - gap + 30;
  const svgW = Math.max(totalW, 750);
  const svgH = cH + 80;

  let svg = svgEl(svgW, svgH);
  const startX = 15;
  catNames.forEach((cat, ci) => {
    const cx = startX + ci*(cW+gap);
    svg += rect(cx, 15, cW, cH, t.color, .06, 7, 1);
    svg += txt(cx+cW/2, 30, cat, 8, t.color, 700);
    cats[cat].forEach((item, ii) => {
      const iy = 15 + cPad + ii*(iH+3);
      svg += `<g class="node" data-id="${item.id}" style="--glow-color:${t.color}80" tabindex="0" role="button" aria-label="${esc(item.name+' — '+item.role)}">`;
      svg += `<title>${esc(item.name+': '+item.role)}</title>`;
      svg += rect(cx+3, iy, cW-6, iH, t.color, .12, 5, 1);
      svg += txt(cx+cW/2, iy+iH/2+1, item.name, 7, '#e4e4ef', 500);
      svg += '</g>';
    });
  });

  svg += '</svg>';
  h += `<div class="svg-wrap">${svg}</div>`;
  h += `<p class="click-hint">Cliquez un template pour voir ses placeholders</p>`;
  return h;
}

// ─── SVG: Loi 25 ─────────────────────────────────────
function renderLoi25SVG(l) {
  let h = `<div class="level-header">
    <h1><span class="icon">${l.icon}</span>${l.name} — ${l.full}</h1>
    <p class="sub">${l.desc}</p>
    <div class="color-bar" style="background:${l.color}"></div></div>`;

  const secs = l.sections;
  const sW = 170, gap = 12, cH = 24, sPad = 24, sBot = 8;
  let maxC = 0;
  secs.forEach(s => { if (s.checks.length > maxC) maxC = s.checks.length; });
  const sH = sPad + maxC*(cH+2) + sBot;
  const totalW = secs.length*(sW+gap) - gap + 30;
  const svgW = Math.max(totalW, 900);
  const svgH = sH + 50;

  let svg = svgEl(svgW, svgH);
  const startX = 15;
  secs.forEach((sec, si) => {
    const sx = startX + si*(sW+gap);
    svg += rect(sx, 15, sW, sH, sec.color, .06, 7, 1);
    svg += txt(sx+sW/2, 30, `${sec.id}. ${sec.name}`, 8, sec.color, 700);
    sec.checks.forEach((ch, ci) => {
      const cy = 15 + sPad + ci*(cH+2);
      svg += `<g class="node" data-id="${ch.id}" style="--glow-color:${sec.color}80" tabindex="0" role="button" aria-label="${esc(ch.id+': '+ch.text)}">`;
      svg += `<title>${esc(ch.id+': '+ch.text)}</title>`;
      svg += rect(sx+3, cy, sW-6, cH, sec.color, .1, 4, 1);
      svg += txt(sx+sW/2, cy+cH/2+1, `${ch.id}: ${ch.text.substring(0,22)}…`, 6.5, '#e4e4ef', 400);
      svg += '</g>';
    });
  });

  svg += '</svg>';
  h += `<div class="svg-wrap">${svg}</div>`;
  h += `<p class="click-hint">Cliquez un check pour voir le détail complet</p>`;
  return h;
}

// ─── SVG: Knowledge ──────────────────────────────────
function renderKnowledgeSVG(k) {
  let h = `<div class="level-header">
    <h1><span class="icon">${k.icon}</span>${k.name} — ${k.full}</h1>
    <p class="sub">${k.desc}</p>
    <div class="color-bar" style="background:${k.color}"></div></div>`;

  const steps = k.steps;
  const svgW = 650, bW = 240, bH = 45, gap = 15;
  const svgH = steps.length*(bH+gap) + 30;
  let svg = svgEl(svgW, svgH);
  const cx = svgW/2;

  steps.forEach((s, i) => {
    const y = 10 + i*(bH+gap);
    svg += nodeG(cx-bW/2, y, bW, bH, k.color, s.name, s.desc.substring(0,28)+'…', s.id);
    if (i < steps.length-1) svg += arrow(cx, y+bH+2, cx, y+bH+gap-2, true);
  });

  svg += '</svg>';
  h += `<div class="svg-wrap">${svg}</div>`;
  return h;
}

// ─── HIGHLIGHT ───────────────────────────────────────
function applyHighlight(selectedId) {
  const nodes = document.querySelectorAll('#diagram-panel svg .node');
  nodes.forEach(n => {
    n.classList.remove('selected', 'dimmed');
    if (!selectedId) return;
    if (n.dataset.id === selectedId) n.classList.add('selected');
    else n.classList.add('dimmed');
  });
}

// ─── TREE PANEL ──────────────────────────────────────
function treeControls() {
  return `<div class="tree-controls">
    <button class="tree-btn" data-action="expand">▾ Tout ouvrir</button>
    <button class="tree-btn" data-action="collapse">▸ Tout fermer</button>
  </div>`;
}

function attachTreeControls(el) {
  el.querySelectorAll('.tree-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const open = btn.dataset.action === 'expand';
      el.querySelectorAll('details').forEach(d => d.open = open);
    });
  });
}

function renderTree() {
  const el = document.getElementById('detail-panel');
  if (view === 'macro') { el.innerHTML = renderMacroTree(); attachTreeControls(el); return; }
  const s = getSection(view);
  if (!s) { el.innerHTML = ''; return; }
  el.innerHTML = `${treeControls()}<div class="tree-root">${buildSectionTree(s)}</div>`;
  attachTreeControls(el);

  // Auto-expand and scroll to selected node
  if (selected) {
    const target = el.querySelector(`details[data-tree-id="${selected}"]`);
    if (target) {
      // Open all ancestor details
      let parent = target.parentElement;
      while (parent && parent !== el) {
        if (parent.tagName === 'DETAILS') parent.open = true;
        parent = parent.parentElement;
      }
      target.open = true;
      target.classList.add('tree-selected');
      target.scrollIntoView({behavior:'smooth', block:'nearest'});
    }
  }
}

// ─── TREE: Macro overview ────────────────────────────
function renderMacroTree() {
  let h = treeControls();
  h += '<div class="tree-root">';

  // Stats summary
  h += detailsNode('📊', 'Récapitulatif NEXOS v3.0', true, () => {
    let c = kv('Agents', STATS.agents) + kv('Phases', STATS.phases);
    c += kv('Dimensions SOIC', STATS.dimensions) + kv('Gates', STATS.gates);
    c += kv('Checks Loi 25', STATS.checksLoi25) + kv('Templates', STATS.templates);
    c += kv('Outils Preflight', STATS.tools) + kv('Modes', STATS.modes.join(', '));
    c += kv('Stack', STATS.stack.join(', '));
    return c;
  });

  // Phases
  PHASES.forEach(p => {
    const agentCount = p.agents ? p.agents.length : (p.groups ? p.groups.reduce((s,g) => s+g.agents.length, 0) : 0);
    h += detailsNode(p.icon, `${p.name} — ${p.full}`, false, () => {
      let c = kv('Agents', agentCount) + kv('Gate', p.gate) + kv('Timeout', p.timeout);
      c += kv('Input', p.input) + kv('Output', p.output);
      return c;
    });
  });

  // Transversal modules
  [TOOLING, SOIC, CONVERGENCE, TEMPLATES, LOI25, SITE_UPDATE, KNOWLEDGE].forEach(s => {
    h += detailsNode(s.icon, `${s.name} — ${s.full}`, false, () => kv('Description', s.desc));
  });

  h += '</div>';
  return h;
}

// ─── TREE: Section tree builder ──────────────────────
function buildSectionTree(s) {
  if (s.agents) return buildAgentsTree(s);
  if (s.groups) return buildGroupsTree(s);
  if (s.id === 'tooling') return buildToolingTree(s);
  if (s.id === 'soic') return buildSoicTree(s);
  if (s.id === 'convergence') return buildConvergenceTree(s);
  if (s.id === 'templates') return buildTemplatesTree(s);
  if (s.id === 'loi25') return buildLoi25Tree(s);
  if (s.id === 'knowledge') return buildKnowledgeTree(s);
  return '<p>Arborescence non disponible</p>';
}

// ─── TREE: Agents (ph0-ph4, site-update) ────────────
function buildAgentsTree(s) {
  let h = '';
  h += detailsNode(s.icon, `${s.name} — ${s.full}`, true, () => {
    let c = kv('Description', s.desc||'');
    if (s.gate) c += kv('Gate SOIC', s.gate);
    if (s.timeout) c += kv('Timeout', s.timeout);
    if (s.input) c += kv('Input', s.input);
    if (s.output) c += kv('Output', s.output);
    return c;
  });

  h += detailsNode('🤖', `Agents (${s.agents.length})`, true, () => {
    return s.agents.map(a => buildAgentNode(a)).join('');
  });

  if (s.gate) {
    h += detailsNode('⚡', `Gate SOIC: ${s.gate}`, false, () => {
      return kv('Seuil', s.gate) + kv('Bloquants', 'D4 (Sécurité), D8 (Conformité)') + kv('Veto', 'D4 ou D8 FAIL = reject même si μ ≥ seuil');
    });
  }

  return h;
}

function buildAgentNode(a) {
  return detailsNode('🤖', a.name, false, () => {
    let c = kv('Rôle', a.role);
    c += kv('Inputs', (a.inputs||[]).join(', '));
    c += '<div style="margin:.3rem 0">';
    c += `<div class="k" style="margin-bottom:.2rem">PROCESS</div>`;
    (a.process||[]).forEach((step, i) => {
      c += `<div class="v" style="padding-left:.5rem;font-size:.76rem;color:var(--text2)">→ ${esc(step)}</div>`;
    });
    c += '</div>';
    c += kv('Outputs', (a.outputs||[]).join(', '));
    return c;
  }, a.id);
}

// ─── TREE: Groups (ph5) ─────────────────────────────
function buildGroupsTree(s) {
  let h = '';
  h += detailsNode(s.icon, `${s.name} — ${s.full}`, true, () => {
    let c = kv('Description', s.desc||'');
    if (s.gate) c += kv('Gate', s.gate);
    if (s.timeout) c += kv('Timeout', s.timeout);
    return c;
  });

  s.groups.forEach(g => {
    h += detailsNode('📦', `${g.name} (${g.agents.length} agents)`, false, () => {
      return g.agents.map(a => buildAgentNode(a)).join('');
    });
  });

  return h;
}

// ─── TREE: Tooling ───────────────────────────────────
function buildToolingTree(t) {
  let h = detailsNode(t.icon, `${t.name} — ${t.full}`, true, () => kv('Description', t.desc));
  h += detailsNode('🔧', `Scans (${t.steps.length})`, true, () => {
    return t.steps.map(s =>
      detailsNode('⚙', s.name, false, () => {
        return kv('Outil', s.tool) + kv('Rôle', s.role) + kv('Timeout', s.timeout) +
               kv('Output', s.output) + kv('Description', s.desc);
      }, s.id)
    ).join('');
  });
  return h;
}

// ─── TREE: SOIC ──────────────────────────────────────
function buildSoicTree(s) {
  let h = detailsNode(s.icon, `${s.name} — ${s.full}`, true, () => {
    return kv('Description', s.desc) + kv('Formule', s.formula);
  });

  h += detailsNode('📐', `Dimensions (${s.dims.length})`, true, () => {
    return s.dims.map(d =>
      detailsNode(d.blocking?'🔴':'🔵', `${d.id} — ${d.name}`, false, () => {
        return kv('Poids', `×${d.weight}`) + kv('Bloquant', d.blocking?'OUI — veto si FAIL':'Non') + kv('Description', d.desc);
      }, d.id)
    ).join('');
  });

  h += detailsNode('🚪', `Gates (${s.gates.length})`, false, () => {
    return s.gates.map(g => {
      const pColor = {Normal:'#64748b',Haute:'#3b82f6',Critique:'#f59e0b',Bloquant:'#ef4444'}[g.priority]||'#64748b';
      return `<div class="kv"><span class="k" style="font-family:var(--mono);color:var(--accent)">${g.id}</span><span class="v">${esc(g.name)} <span class="tree-tag" style="background:${pColor}20;color:${pColor}">${g.priority}</span> (${g.dim})</span></div>`;
    }).join('');
  });

  return h;
}

// ─── TREE: Convergence ───────────────────────────────
function buildConvergenceTree(c) {
  let h = detailsNode(c.icon, `${c.name} — ${c.full}`, true, () => kv('Description', c.desc));

  h += detailsNode('🔀', `Décisions (${c.decisions.length})`, true, () => {
    return c.decisions.map(d =>
      detailsNode('', d.id, false, () => {
        return kv('Condition', d.desc) + kv('Action', d.action);
      })
    ).join('');
  });

  h += detailsNode('📋', 'Flow d\'exécution', false, () => {
    return c.flow.map((step, i) =>
      `<div class="v" style="padding:.15rem 0;font-size:.78rem"><span style="color:var(--accent);font-family:var(--mono)">${i+1}.</span> ${esc(step)}</div>`
    ).join('');
  });

  return h;
}

// ─── TREE: Templates ─────────────────────────────────
function buildTemplatesTree(t) {
  let h = detailsNode(t.icon, `${t.name} — ${t.full}`, true, () => kv('Description', t.desc));

  const cats = {};
  t.items.forEach(i => { (cats[i.category] = cats[i.category] || []).push(i); });

  Object.keys(cats).forEach(cat => {
    h += detailsNode('📁', `${cat} (${cats[cat].length})`, false, () => {
      return cats[cat].map(item =>
        detailsNode('📄', item.name, false, () => {
          return kv('Rôle', item.role) + kv('Catégorie', item.category) +
                 kv('Placeholders', item.placeholders.join(', '));
        }, item.id)
      ).join('');
    });
  });

  return h;
}

// ─── TREE: Loi 25 ────────────────────────────────────
function buildLoi25Tree(l) {
  let h = detailsNode(l.icon, `${l.name} — ${l.full}`, true, () => kv('Description', l.desc));

  l.sections.forEach(sec => {
    h += detailsNode('📋', `Section ${sec.id} — ${sec.name} (${sec.checks.length})`, false, () => {
      return sec.checks.map(ch =>
        detailsNode('✓', `${ch.id}`, false, () => kv('Exigence', ch.text), ch.id)
      ).join('');
    });
  });

  const total = l.sections.reduce((s, sec) => s + sec.checks.length, 0);
  h += detailsNode('📊', `Total: ${total} checks`, false, () => {
    return l.sections.map(sec =>
      kv(`Section ${sec.id}`, `${sec.checks.length} checks — ${sec.name}`)
    ).join('');
  });

  return h;
}

// ─── TREE: Knowledge ─────────────────────────────────
function buildKnowledgeTree(k) {
  let h = detailsNode(k.icon, `${k.name} — ${k.full}`, true, () => kv('Description', k.desc));

  h += detailsNode('🔄', `Flow (${k.steps.length} étapes)`, true, () => {
    return k.steps.map(s =>
      detailsNode('→', s.name, false, () => kv('Description', s.desc), s.id)
    ).join('');
  });

  return h;
}

// ─── TREE HELPERS ────────────────────────────────────
function detailsNode(icon, label, openDefault, contentFn, dataId) {
  const idAttr = dataId ? ` data-tree-id="${dataId}"` : '';
  return `<details${openDefault?' open':''}${idAttr}>
    <summary><span class="tree-icon">${icon}</span> ${esc(label)}</summary>
    <div class="tree-children">${contentFn()}</div>
  </details>`;
}

function kv(key, val) {
  return `<div class="kv"><span class="k">${esc(key)}</span><span class="v">${esc(String(val))}</span></div>`;
}

// ─── INIT ────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Double-click on diagram goes back to macro (attached once)
  document.getElementById('diagram-panel').addEventListener('dblclick', () => {
    if (view !== 'macro') nav('macro');
  });

  // Hash routing: read initial hash, listen for back/forward
  window.addEventListener('popstate', navFromHash);
  navFromHash();
});
