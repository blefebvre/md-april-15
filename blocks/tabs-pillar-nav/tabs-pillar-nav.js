export default async function decorate(block) {
  // Build a horizontal nav bar from the tab rows
  // Each row has: col1 = label text, col2 = link
  const nav = document.createElement('nav');
  nav.className = 'tabs-pillar-nav-list';
  nav.setAttribute('role', 'navigation');
  nav.setAttribute('aria-label', 'Five Pillars of Security');

  [...block.children].forEach((row) => {
    const cols = [...row.children];
    const linkCell = cols[1];
    const link = linkCell?.querySelector('a');

    if (link) {
      link.className = 'tabs-pillar-nav-link';
      // Mark active based on current page URL match
      if (window.location.href.includes(new URL(link.href).pathname)) {
        link.classList.add('active');
      }
      nav.append(link);
    }
  });

  block.textContent = '';
  block.append(nav);
}
