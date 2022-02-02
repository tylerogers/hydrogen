import prettier from 'prettier';
import {extname} from 'path';

const DEFAULT_PRETTIER_CONFIG = {...require('@shopify/prettier-config')};

/**
 * Format a string using prettier.
 *
 * @param content - Options to pass to prettier.
 * @param options - The path to the file being formatted.
 * @returns The formatted content.
 */
export async function formatFile(content: string, options: {path: string}) {
  const ext = extname(options.path);
  const prettierConfig = {
    // TODO: Search for local project config with fallback to Shopify
    ...DEFAULT_PRETTIER_CONFIG,
    parser: 'babel',
  };

  switch (ext) {
    case '.html':
    case '.css':
      prettierConfig.parser = ext.slice(1);
      break;
  }

  const formattedContent = await prettier.format(content, prettierConfig);

  return formattedContent;
}
