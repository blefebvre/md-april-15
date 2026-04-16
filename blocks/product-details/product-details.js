/**
 * Product Details block - placeholder for product configurator.
 * Renders a placeholder image until the real implementation is built.
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const picture = document.createElement('picture');
  const img = document.createElement('img');
  img.src = `${window.hlx.codeBasePath}/assets/product-details-placeholder.png`;
  img.alt = 'Product details placeholder';
  img.loading = 'eager';
  img.width = 1400;
  img.height = 1400;
  picture.append(img);

  block.textContent = '';
  block.append(picture);
}
