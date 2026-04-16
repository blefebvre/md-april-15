import {
  buildBlock,
  loadHeader,
  loadFooter,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
} from './aem.js';

/**
 * Builds hero block and prepends to main in a new section.
 * @param {Element} main The container element
 */
function buildHeroBlock(main) {
  const h1 = main.querySelector('h1');
  const picture = main.querySelector('picture');
  // eslint-disable-next-line no-bitwise
  if (h1 && picture && (h1.compareDocumentPosition(picture) & Node.DOCUMENT_POSITION_PRECEDING)) {
    // Check if h1 or picture is already inside a hero block (including variants)
    if (h1.closest('[class^="hero"]') || picture.closest('[class^="hero"]')) {
      return; // Don't create a duplicate hero block
    }
    const section = document.createElement('div');
    section.append(buildBlock('hero', { elems: [picture, h1] }));
    main.prepend(section);
  }
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

/**
 * Extracts a clean Scene7/Dynamic Media URL from a potentially corrupted href.
 * DA editor may wrap URLs in curly quotes, producing hrefs like:
 *   \u201Dhttps://s7d1.scene7.com/is/image/canon/foo\u201D
 * The browser resolves this relative to the page, so a.href becomes:
 *   https://da.live/%E2%80%9Dhttps://s7d1.scene7.com/...%E2%80%9D
 * This function extracts just the Scene7 URL.
 * @param {string} raw The raw href attribute value or resolved href
 * @returns {string|null} Clean Scene7 URL or null if not a match
 */
function extractDMUrl(raw) {
  const match = raw.match(/(https?:\/\/s7[a-z0-9]*\.scene7\.com\/is\/image\/[^\s\u201C\u201D\u201E\u201F"]+)/);
  return match ? match[1] : null;
}

/**
 * Converts Dynamic Media / Scene7 links to picture elements.
 * Authored as: <a href="https://s7d1.scene7.com/is/image/canon/...">Alt text</a>
 * Becomes: <picture><source><img src="..." alt="..."></picture>
 * Handles curly quotes added by DA editor around URLs.
 * @param {Element} main The container element
 */
function buildDynamicMediaImages(main) {
  main.querySelectorAll('a[href]').forEach((a) => {
    // Try raw attribute first, fall back to resolved href
    const rawHref = a.getAttribute('href') || a.href;
    const src = extractDMUrl(rawHref) || extractDMUrl(a.href);
    if (!src) return;

    const alt = a.textContent.trim();

    const picture = document.createElement('picture');
    const srcWebp = `${src}?fmt=webp&wid=1200`;
    const srcFallback = `${src}?fmt=jpg&wid=1200`;
    picture.innerHTML = `<source type="image/webp" srcset="${srcWebp}"><img src="${srcFallback}" alt="${alt}" loading="lazy" width="1200">`;

    const parent = a.parentElement;
    if (parent.tagName === 'P' && parent.textContent.trim() === alt) {
      parent.replaceWith(picture);
    } else {
      a.replaceWith(picture);
    }
  });
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks(main) {
  try {
    // auto load `*/fragments/*` references
    const fragments = [...main.querySelectorAll('a[href*="/fragments/"]')].filter((f) => !f.closest('.fragment'));
    if (fragments.length > 0) {
      // eslint-disable-next-line import/no-cycle
      import('../blocks/fragment/fragment.js').then(({ loadFragment }) => {
        fragments.forEach(async (fragment) => {
          try {
            const { pathname } = new URL(fragment.href);
            const frag = await loadFragment(pathname);
            fragment.parentElement.replaceWith(...frag.children);
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Fragment loading failed', error);
          }
        });
      });
    }

    buildDynamicMediaImages(main);
    buildHeroBlock(main);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Decorates formatted links to style them as buttons.
 * @param {HTMLElement} main The main container element
 */
function decorateButtons(main) {
  main.querySelectorAll('p a[href]').forEach((a) => {
    a.title = a.title || a.textContent;
    const p = a.closest('p');
    const text = a.textContent.trim();

    // quick structural checks
    if (a.querySelector('img') || p.textContent.trim() !== text) return;

    // skip URL display links
    try {
      if (new URL(a.href).href === new URL(text, window.location).href) return;
    } catch { /* continue */ }

    // require authored formatting for buttonization
    const strong = a.closest('strong');
    const em = a.closest('em');
    if (!strong && !em) return;

    p.className = 'button-wrapper';
    a.className = 'button';
    if (strong && em) { // high-impact call-to-action
      a.classList.add('accent');
      const outer = strong.contains(em) ? strong : em;
      outer.replaceWith(a);
    } else if (strong) {
      a.classList.add('primary');
      strong.replaceWith(a);
    } else {
      a.classList.add('secondary');
      em.replaceWith(a);
    }
  });
}

/**
 * Groups consecutive sections with class "tab" into a tabbed container.
 * Each tab section must have section-metadata with style=tab and tab-title.
 * @param {Element} main The main element
 */
function buildTabs(main) {
  const sections = [...main.querySelectorAll(':scope > .section.tab')];
  if (sections.length === 0) return;

  // Group consecutive tab sections
  const groups = [];
  let current = [];
  sections.forEach((section) => {
    const prev = current.length ? current[current.length - 1] : null;
    if (prev && prev.nextElementSibling === section) {
      current.push(section);
    } else {
      if (current.length) groups.push(current);
      current = [section];
    }
  });
  if (current.length) groups.push(current);

  groups.forEach((group) => {
    const tabContainer = document.createElement('div');
    tabContainer.className = 'tabs-container';

    const tabNav = document.createElement('div');
    tabNav.className = 'tabs-nav';

    const tabPanels = document.createElement('div');
    tabPanels.className = 'tabs-panels';

    // Place container in the DOM before moving sections
    group[0].before(tabContainer);
    tabContainer.append(tabNav, tabPanels);

    group.forEach((section, i) => {
      const title = section.getAttribute('data-tab-title') || `Tab ${i + 1}`;

      const btn = document.createElement('button');
      btn.className = `tabs-tab${i === 0 ? ' active' : ''}`;
      btn.textContent = title;
      btn.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
      btn.addEventListener('click', () => {
        tabNav.querySelectorAll('.tabs-tab').forEach((t) => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        tabPanels.querySelectorAll('.tabs-panel').forEach((p) => p.classList.remove('active'));
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
        tabPanels.children[i].classList.add('active');
      });
      tabNav.append(btn);

      section.classList.add('tabs-panel');
      if (i === 0) section.classList.add('active');
      tabPanels.append(section);
    });
  });
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  buildTabs(main);
  decorateBlocks(main);
  decorateButtons(main);
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    document.body.classList.add('appear');
    await loadSection(main.querySelector('.section'), waitForFirstImage);
  }

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  loadHeader(doc.querySelector('header'));

  const main = doc.querySelector('main');
  await loadSections(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadFooter(doc.querySelector('footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => import('./delayed.js'), 3000);
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();
