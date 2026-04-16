export default function decorate(block) {
  const rows = [...block.children];
  block.textContent = '';

  rows.forEach((row) => {
    const cols = [...row.children];
    if (cols.length < 2) return;

    const details = document.createElement('details');
    const summary = document.createElement('summary');
    summary.textContent = cols[0].textContent.trim();
    details.append(summary);

    const content = document.createElement('div');
    content.className = 'accordion-content';
    content.append(...cols[1].childNodes);
    details.append(content);

    block.append(details);
  });
}
