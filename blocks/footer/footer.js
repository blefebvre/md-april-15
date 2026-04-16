import { loadFragment } from '../fragment/fragment.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const footerPath = '/footer';
  const fragment = await loadFragment(footerPath);
  if (!fragment) return;

  block.textContent = '';
  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  // Restructure flat H3+UL pairs into column divs for grid layout
  const sections = footer.querySelectorAll('.section');
  if (sections.length > 0) {
    const linksSection = sections[0];
    const wrapper = linksSection.querySelector('.default-content-wrapper');
    if (wrapper) {
      const columns = document.createElement('div');
      columns.className = 'footer-columns';

      let currentCol = null;
      Array.from(wrapper.children).forEach((child) => {
        if (child.tagName === 'H3') {
          currentCol = document.createElement('div');
          currentCol.className = 'footer-col';
          columns.append(currentCol);
        }
        if (currentCol) {
          currentCol.append(child);
        }
      });

      wrapper.textContent = '';
      wrapper.append(columns);
    }
  }

  block.append(footer);
}
