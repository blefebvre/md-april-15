export default function decorate(block) {
  if (!block.querySelector('picture')) {
    block.classList.add('no-image');
  }
}
