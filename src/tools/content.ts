import { initBrowser } from '../browser.js';
import { GetPageContentArgs, QueryPageArgs, QuerySpec, QueryResults, ToolResult } from '../types.js';

export async function handleGetPageContent(args: GetPageContentArgs): Promise<ToolResult> {
  const page = await initBrowser();
  const { format = 'text' } = args;

  let content: string;
  if (format === 'html') {
    content = await page.content();
  } else {
    content = await page.textContent('body') || '';
  }

  return {
    content: [{
      type: 'text',
      text: content
    }]
  };
}

export async function handleQueryPage(args: QueryPageArgs): Promise<ToolResult> {
  const page = await initBrowser();
  const { queries } = args;

  if (!queries || !Array.isArray(queries)) {
    throw new Error('queries must be an array');
  }

  // Execute all queries in the browser context
  const results = await page.evaluate((querySpecs: QuerySpec[]): QueryResults => {
    const output: Record<string, string | null> = {};

    for (const spec of querySpecs) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const elements = (globalThis as any).document.querySelectorAll(spec.selector);

      if (elements.length === 0) {
        output[spec.name] = null;
        continue;
      }

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

      // Extract the requested content
      const extractType = spec.extract || 'text';
      switch (extractType) {
        case 'text':
          output[spec.name] = element.textContent?.trim() || '';
          break;
        case 'innerText':
          output[spec.name] = element.innerText?.trim() || '';
          break;
        case 'html':
          output[spec.name] = element.innerHTML;
          break;
        case 'outerHTML':
          output[spec.name] = element.outerHTML;
          break;
        default:
          output[spec.name] = element.textContent?.trim() || '';
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
