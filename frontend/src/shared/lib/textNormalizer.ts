const marker = /(?:Ã.|Â.|Ä.|Æ.|áº|á»|â€|…|—|Ò.|�)/;

function decodeWindows1252(value: string) {
  const bytes = Uint8Array.from(Array.from(value, (char) => char.charCodeAt(0) & 255));
  return new TextDecoder('windows-1252').decode(bytes);
}

export function normalizeDisplayText(value: string) {
  if (!marker.test(value) || value.startsWith('data:')) {
    return value;
  }

  let current = value;

  for (let index = 0; index < 3 && marker.test(current); index += 1) {
    const decoded = decodeWindows1252(current);

    if (decoded === current || decoded.includes('�')) {
      break;
    }

    current = decoded;
  }

  return current;
}

function normalizeNodeText(node: Node) {
  if (node.nodeType === Node.TEXT_NODE && node.textContent) {
    const next = normalizeDisplayText(node.textContent);
    if (next !== node.textContent) node.textContent = next;
    return;
  }

  if (!(node instanceof HTMLElement)) return;

  for (const attribute of ['title', 'alt', 'placeholder', 'aria-label']) {
    const value = node.getAttribute(attribute);
    if (!value) continue;
    const next = normalizeDisplayText(value);
    if (next !== value) node.setAttribute(attribute, next);
  }

  node.childNodes.forEach(normalizeNodeText);
}

export function installDisplayTextNormalizer() {
  const root = document.getElementById('root');
  if (!root) return () => undefined;

  normalizeNodeText(root);

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach(normalizeNodeText);

      if (mutation.type === 'characterData') {
        normalizeNodeText(mutation.target);
      }

      if (mutation.type === 'attributes') {
        normalizeNodeText(mutation.target);
      }
    }
  });

  observer.observe(root, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['title', 'alt', 'placeholder', 'aria-label'],
  });

  return () => observer.disconnect();
}
