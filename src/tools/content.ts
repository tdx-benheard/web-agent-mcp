import { initBrowser, getCurrentFrame } from '../browser.js';
import { GetPageContentArgs, QueryPageArgs, QuerySpec, QueryResults, ToolResult } from '../types.js';

/**
 * Get the current context (frame or page)
 */
async function getContext() {
  const page = await initBrowser();
  const currentFrame = getCurrentFrame();
  return currentFrame || page;
}

export async function handleGetPageContent(args: GetPageContentArgs): Promise<ToolResult> {
  const context = await getContext();
  const { format = 'text' } = args;

  let content: string;
  if (format === 'html') {
    content = await context.content();
  } else {
    content = await context.textContent('body') || '';
  }

  return {
    content: [{
      type: 'text',
      text: content
    }]
  };
}

export async function handleQueryPage(args: QueryPageArgs): Promise<ToolResult> {
  const context = await getContext();
  const { queries } = args;

  if (!queries || !Array.isArray(queries)) {
    throw new Error('queries must be an array');
  }

  // Execute all queries in the browser context
  const results = await context.evaluate((querySpecs: QuerySpec[]): QueryResults => {
    const output: Record<string, string | string[] | null> = {};

    for (const spec of querySpecs) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const elements = (globalThis as any).document.querySelectorAll(spec.selector);

      if (elements.length === 0) {
        output[spec.name] = spec.all ? [] : null;
        continue;
      }

      const extractType = spec.extract || 'text';

      // Helper function to extract content from an element
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const extractContent = (element: any): string => {
        switch (extractType) {
          case 'text':
            return element.textContent?.trim() || '';
          case 'innerText':
            return element.innerText?.trim() || '';
          case 'html':
            return element.innerHTML;
          case 'outerHTML':
            return element.outerHTML;
          default:
            return element.textContent?.trim() || '';
        }
      };

      // If 'all' is true, return array of all matching elements
      if (spec.all) {
        const results: string[] = [];
        for (let i = 0; i < elements.length; i++) {
          results.push(extractContent(elements[i]));
        }
        output[spec.name] = results;
      } else {
        // Select which element to use
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let element: any | undefined;
        if (spec.index !== undefined) {
          const idx = spec.index < 0 ? elements.length + spec.index : spec.index;
          element = elements[idx];
        } else {
          element = elements[0];
        }

        if (!element) {
          output[spec.name] = null;
          continue;
        }

        output[spec.name] = extractContent(element);
      }
    }

    return output;
  }, queries);

  return {
    content: [{
      type: 'text',
      text: JSON.stringify(results, null, 2)
    }]
  };
}
