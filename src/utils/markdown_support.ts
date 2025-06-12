import { marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';

export function useMarkdown() {
  // Configure marked with syntax highlighting
  marked.use(markedHighlight({
    langPrefix: 'hljs language-',
    highlight(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext';
      return hljs.highlight(code, { language }).value;
    }
  }));

  // Custom renderer to preserve math expressions
  const renderer = new marked.Renderer();
  
  // Override text rendering to preserve math expressions temporarily
  const originalText = renderer.text.bind(renderer);
  renderer.text = function(token) {
    const textInput = typeof token === 'string' ? token : token.text;
    
    // Get placeholders from renderer instance
    const currentPlaceholders = (this as any)._mathPlaceholders;
    let currentIndex = (this as any)._placeholderIndex;

    if (typeof currentPlaceholders === 'undefined' || typeof currentIndex === 'undefined') {
      console.warn("Math placeholder system not initialized for renderer.text. Skipping math processing for this segment.");
      return originalText(token);
    }

    let processedText = textInput;
    
    // Handle display math ($$...$$)
    processedText = processedText.replace(/\$\$([\s\S]*?)\$\$/g, (match, _math) => {
      const placeholder = `__MATH_DISPLAY_${currentIndex}__`;
      currentPlaceholders[placeholder] = match;
      currentIndex++;
      (this as any)._placeholderIndex = currentIndex;
      return placeholder;
    });
    
    // Handle inline math ($...$)
    processedText = processedText.replace(/\$([^$\n]+?)\$/g, (match, _math) => {
      if (match.startsWith('__MATH_') || match.endsWith('__')) return match;

      const placeholder = `__MATH_INLINE_${currentIndex}__`;
      currentPlaceholders[placeholder] = match;
      currentIndex++;
      (this as any)._placeholderIndex = currentIndex;
      return placeholder;
    });
    
    // Create a mock token for the original text renderer
    const mockToken = typeof token === 'string' ? token : { ...token, text: processedText };
    return originalText(mockToken);
  };

  // Configure marked options
  marked.setOptions({
    renderer,
    gfm: true,
    breaks: true,
    pedantic: false,
    smartypants: true,
  });

  const parse = async (content: string): Promise<string> => {
    // Initialize/reset placeholder context for this parse call on the renderer instance
    (renderer as any)._mathPlaceholders = {};
    (renderer as any)._placeholderIndex = 0;

    try {
      // Parse markdown to HTML
      let html = await marked.parse(content);
      
      const storedPlaceholders = (renderer as any)._mathPlaceholders;
      if (storedPlaceholders && Object.keys(storedPlaceholders).length > 0) {
        // Restore math expressions from placeholders
        html = html.replace(/__(MATH_DISPLAY|MATH_INLINE)_(\d+)__/g, (placeholderKey) => {
          const originalMathExpression = storedPlaceholders[placeholderKey];
          if (originalMathExpression) {
            if (placeholderKey.includes('__MATH_DISPLAY_')) {
              const mathContent = originalMathExpression.slice(2, -2);
              return `<script type="math/tex; mode=display">${mathContent}</script>`;
            } else {
              const mathContent = originalMathExpression.slice(1, -1);
              return `<script type="math/tex">${mathContent}</script>`;
            }
          }
          console.warn(`Math placeholder ${placeholderKey} not found in stored placeholders.`);
          return placeholderKey; 
        });
      }
      
      return html;
    } catch (error) {
      console.error('Markdown parsing error:', error);
      return content;
    } finally {
      // Clean up custom properties on the renderer instance
      delete (renderer as any)._mathPlaceholders;
      delete (renderer as any)._placeholderIndex;
    }
  };

  return {
    parse,
    marked
  };
}