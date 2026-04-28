const suspiciousPattern = /(?:\u00c3\u0192.|\u00c3\u201a.|\u00c3\u201e.|\u00c3\u2020.|\u00c3\u00a1\u00c2\u00bb.|\u00c3\u00a1\u00c2\u00ba.|ï¿½)/;
const suspiciousCharacters = /[\u00c3\u00c2\u0192\u00d2]|ï¿½/g;

const collapsePairs: Array<[RegExp, string]> = [
  [/\u00c3\u0192\u00c2/g, '\u00c3'],
  [/\u00c3\u00a0\u00c2/g, '\u00e0'],
  [/\u00c3\u00a1\u00c2/g, '\u00e1'],
  [/\u00c3\u00a2\u00c2/g, '\u00e2'],
  [/\u00c3\u00a3\u00c2/g, '\u00e3'],
  [/\u00c3\u00a8\u00c2/g, '\u00e8'],
  [/\u00c3\u00a9\u00c2/g, '\u00e9'],
  [/\u00c3\u00aa\u00c2/g, '\u00ea'],
  [/\u00c3\u00ac\u00c2/g, '\u00ec'],
  [/\u00c3\u00ad\u00c2/g, '\u00ed'],
  [/\u00c3\u00b2\u00c2/g, '\u00f2'],
  [/\u00c3\u00b3\u00c2/g, '\u00f3'],
  [/\u00c3\u00b4\u00c2/g, '\u00f4'],
  [/\u00c3\u00b5\u00c2/g, '\u00f5'],
  [/\u00c3\u00b9\u00c2/g, '\u00f9'],
  [/\u00c3\u00ba\u00c2/g, '\u00fa'],
  [/\u00c3\u00bd\u00c2/g, '\u00fd'],
  [/\u00c2/g, ''],
];

function decodeUtf8FromSingleByteString(value: string) {
  const bytes = Uint8Array.from(Array.from(value, (char) => char.charCodeAt(0) & 255));
  return new TextDecoder('utf-8').decode(bytes);
}

function collapseDoubleMojibake(value: string) {
  return collapsePairs.reduce((current, [pattern, next]) => current.replace(pattern, next), value);
}

function scoreCandidate(value: string) {
  const suspicious = (value.match(suspiciousPattern) ?? []).length;
  const suspiciousChars = (value.match(suspiciousCharacters) ?? []).length;
  const replacement = (value.match(/�/g) ?? []).length;
  const vietnamese = (value.match(/[àáảãạăắằẳẵặâấầẩẫậđèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵ]/gi) ?? []).length;
  const readable = (value.match(/[a-z0-9\s,./:;()%-]/gi) ?? []).length;
  return (vietnamese * 3) + readable - (suspicious * 6) - (suspiciousChars * 5) - (replacement * 8);
}

export function normalizeDisplayText(value: string) {
  if (!value || value.startsWith('data:')) {
    return value;
  }

  const candidates = [value];
  let current = collapseDoubleMojibake(value);
  if (!candidates.includes(current)) {
    candidates.push(current);
  }

  for (let index = 0; index < 3; index += 1) {
    const decoded = decodeUtf8FromSingleByteString(current);
    if (!decoded || decoded === current) {
      break;
    }

    candidates.push(decoded);
    current = collapseDoubleMojibake(decoded);
    if (!candidates.includes(current)) {
      candidates.push(current);
    }

    if (!suspiciousPattern.test(current)) {
      break;
    }
  }

  return candidates.reduce((currentBest, candidate) => (
    scoreCandidate(candidate) > scoreCandidate(currentBest) ? candidate : currentBest
  ), value);
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
