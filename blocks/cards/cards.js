import { createOptimizedPicture } from '../../scripts/aem.js';

const SCENE7_BASE = 'https://s7d1.scene7.com/is/image/';

export default function decorate(block) {
  // Convert /scene7/ links to images before restructuring
  // DA resolves relative /scene7/ to absolute https://domain/scene7/
  block.querySelectorAll('a[href*="/scene7/"]').forEach((a) => {
    const href = a.getAttribute('href') || a.href;
    const match = href.match(/\/scene7\/(.+)/);
    if (!match) return;
    const path = match[1];
    const alt = a.textContent.trim();
    const img = document.createElement('img');
    img.src = `${SCENE7_BASE}${path}?fmt=png-alpha`;
    img.alt = alt;
    img.loading = 'lazy';
    const picture = document.createElement('picture');
    picture.appendChild(img);
    const parent = a.parentElement;
    if (parent.tagName === 'P' && parent.textContent.trim() === alt) {
      parent.replaceWith(picture);
    } else {
      a.replaceWith(picture);
    }
  });

  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-card-image';
      else div.className = 'cards-card-body';
    });
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }])));
  block.replaceChildren(ul);
}
