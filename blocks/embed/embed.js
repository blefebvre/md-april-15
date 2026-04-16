export default function decorate(block) {
  const link = block.querySelector('a');
  if (!link) return;

  const url = new URL(link.href);
  let embedUrl = null;

  if (url.hostname.includes('youtube.com') || url.hostname.includes('youtu.be')) {
    const vid = url.hostname.includes('youtu.be')
      ? url.pathname.slice(1)
      : url.searchParams.get('v');
    if (vid) embedUrl = `https://www.youtube.com/embed/${vid}?rel=0`;
  } else if (url.hostname.includes('vimeo.com')) {
    const vid = url.pathname.split('/').pop();
    if (vid) embedUrl = `https://player.vimeo.com/video/${vid}`;
  }

  if (embedUrl) {
    const wrapper = document.createElement('div');
    wrapper.className = 'embed-responsive';
    wrapper.innerHTML = `<iframe src="${embedUrl}" allowfullscreen loading="lazy" allow="autoplay; encrypted-media; picture-in-picture"></iframe>`;
    block.textContent = '';
    block.append(wrapper);
  }
}
