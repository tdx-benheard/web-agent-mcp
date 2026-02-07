import { initBrowser, getCurrentFrame } from '../browser.js';
import { GetPageContentArgs, QueryPageArgs, QuerySpec, QueryResults, ToolResult } from '../types.js';

const MAX_RESULT_LENGTH = 1000;

/**
 * Truncate large results to prevent token waste
 */
export function truncateResult(result: string, allowLarge: boolean | undefined, context: string): string {
  if (allowLarge || result.length <= MAX_RESULT_LENGTH) return result;

  return result.substring(0, MAX_RESULT_LENGTH) +
    `\n\n⚠️ TRUNCATED - ${result.length} chars (showing ${MAX_RESULT_LENGTH}).\n\n` +
    `To get full result: add allowLargeResults: true\n` +
    `To avoid truncation: ${context}`;
}

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
  const resultsWithMetadata = await context.evaluate((querySpecs: QuerySpec[]) => {
    const output: Record<string, string | string[] | null> = {};
    const metadata: Record<string, { returned: number; total: number }> = {};

    for (const spec of querySpecs) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const elements = (globalThis as any).document.querySelectorAll(spec.selector);
      const totalCount = elements.length;

      if (totalCount === 0) {
        output[spec.name] = null;
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

      // Handle index parameter (for selecting a specific element)
      if (spec.index !== undefined) {
        const idx = spec.index < 0 ? totalCount + spec.index : spec.index;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const element = elements[idx] as any;

        if (!element) {
          output[spec.name] = null;
          continue;
        }

        output[spec.name] = extractContent(element);
        metadata[spec.name] = { returned: 1, total: totalCount };
        continue;
      }

      // Default max to 5 if not specified
      const max = spec.max !== undefined ? spec.max : 5;

      // Special case: max: 1 returns a single string (not array)
      if (max === 1) {
        output[spec.name] = extractContent(elements[0]);
        metadata[spec.name] = { returned: 1, total: totalCount };
        continue;
      }

      // max: 0 means unlimited, otherwise take min(max, totalCount)
      const itemsToReturn = max === 0 ? totalCount : Math.min(max, totalCount);
      const results: string[] = [];

      for (let i = 0; i < itemsToReturn; i++) {
        results.push(extractContent(elements[i]));
      }

      output[spec.name] = results;
      metadata[spec.name] = { returned: itemsToReturn, total: totalCount };
    }

    return { results: output, metadata };
  }, queries);

  // Format the response with metadata
  const { results, metadata } = resultsWithMetadata;

  // Apply truncation to html/outerHTML results
  const processedResults: Record<string, string | string[] | null> = {};
  for (const [name, value] of Object.entries(results) as [string, string | string[] | null][]) {
    const query = queries.find(q => q.name === name);
    const isExpensiveExtract = query?.extract === 'html' || query?.extract === 'outerHTML';

    if (isExpensiveExtract && value !== null) {
      if (Array.isArray(value)) {
        processedResults[name] = value.map((item: string) =>
          truncateResult(item, query?.allowLargeResults, "Use extract: 'text' or execute_console for structure inspection")
        );
      } else if (typeof value === 'string') {
        processedResults[name] = truncateResult(value, query?.allowLargeResults, "Use extract: 'text' or execute_console for structure inspection");
      } else {
        processedResults[name] = value;
      }
    } else {
      processedResults[name] = value;
    }
  }

  let responseText = JSON.stringify(processedResults, null, 2);

  // Add metadata information
  const metadataLines: string[] = [];
  for (const [name, meta] of Object.entries(metadata) as [string, { returned: number; total: number }][]) {
    if (meta.total > meta.returned) {
      metadataLines.push(`'${name}' returned ${meta.returned} of ${meta.total} total matches (use max: 0 for all)`);
    }
  }

  if (metadataLines.length > 0) {
    responseText += '\n\nMetadata:\n' + metadataLines.join('\n');
  }

  return {
    content: [{
      type: 'text',
      text: responseText
    }]
  };
}
