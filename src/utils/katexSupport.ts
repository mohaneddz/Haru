import katex from 'katex';
import 'katex/dist/katex.min.css';

export function useKatex() {
  const renderMathToFragment = (
    mathText: string,
    displayMode: boolean,
    fragment: DocumentFragment,
    originalText: string
  ) => {
    try {
      const rendered = katex.renderToString(mathText, {
        displayMode,
        throwOnError: false,
        strict: false,
        trust: true,
      });

      const wrapper = document.createElement(displayMode ? 'div' : 'span');
      wrapper.className = displayMode ? 'katex-display' : 'katex-inline';
      wrapper.innerHTML = rendered;
      fragment.appendChild(wrapper);
    } catch (error) {
      console.warn('KaTeX render error:', error);
      const errorSpan = document.createElement('span');
      errorSpan.className = 'katex-error';
      errorSpan.style.color = 'red';
      errorSpan.textContent = originalText;
      fragment.appendChild(errorSpan);
    }
  };

  const getTextNodes = (element: HTMLElement): Text[] => {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        if (
          parent.closest('.katex') ||
          parent.closest('script[type^="math/tex"]')
        ) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    const nodes: Text[] = [];
    let current;
    while ((current = walker.nextNode())) nodes.push(current as Text);
    return nodes;
  };

  const processTextNode = (node: Text) => {
    const text = node.nodeValue || '';
    const parts = text.split(
      /(\$\$[\s\S]+?\$\$|\$[^$\n]+\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\))/
    );

    if (parts.length <= 1) return;

    const frag = document.createDocumentFragment();

    parts.forEach((part) => {
      if (/^\$\$[\s\S]+?\$\$$/.test(part)) {
        renderMathToFragment(part.slice(2, -2), true, frag, part);
      } else if (/^\$[^$\n]+\$/.test(part)) {
        renderMathToFragment(part.slice(1, -1), false, frag, part);
      } else if (/^\\\[[\s\S]+?\\\]$/.test(part)) {
        renderMathToFragment(part.slice(2, -2), true, frag, part);
      } else if (/^\\\([\s\S]+?\\\)$/.test(part)) {
        renderMathToFragment(part.slice(2, -2), false, frag, part);
      } else {
        frag.appendChild(document.createTextNode(part));
      }
    });

    if (node.parentNode) {
      node.parentNode.replaceChild(frag, node);
    }
  };

  const renderInElement = (element: HTMLElement) => {
    if (!element) return;

    // 1. Handle <script type="math/tex"> elements
    element.querySelectorAll('script[type^="math/tex"]').forEach((scriptEl) => {
      const math = scriptEl.textContent || '';
      const display = (scriptEl as HTMLScriptElement).type.includes('mode=display');
      try {
        const html = katex.renderToString(math, {
          displayMode: display,
          throwOnError: false,
          strict: false,
          trust: true,
        });
        const span = document.createElement(display ? 'div' : 'span');
        span.className = display ? 'katex-display' : 'katex-inline';
        span.innerHTML = html;
        scriptEl.replaceWith(span);
      } catch (err) {
        const errorSpan = document.createElement('span');
        errorSpan.className = 'katex-error';
        errorSpan.style.color = 'red';
        errorSpan.textContent = math;
        scriptEl.replaceWith(errorSpan);
      }
    });

    // 2. Process inline math in text
    getTextNodes(element).forEach(processTextNode);
  };

  return { renderInElement };
}
