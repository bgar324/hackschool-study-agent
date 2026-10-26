import type { TSchema } from 'typebox';
import { Type } from '@earendil-works/pi-ai';
import { defineTool, type ExtensionAPI } from '@earendil-works/pi-coding-agent';
import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
export async function runBackend(name: string, params: unknown, signal?: AbortSignal) {
  const stdout = await new Promise<string>((accept, reject) => {
    execFile(resolve(root, '.venv/bin/python'), [resolve(root, 'scripts/study_tools.py'), name, JSON.stringify(params)],
      { cwd: root, signal, timeout: 200_000, maxBuffer: 2_000_000 }, (error, stdout, stderr) => {
        if (error) return reject(new Error(stdout.trim() || stderr.trim() || error.message));
        accept(stdout);
      });
  });
  return JSON.parse(stdout);
}

export default function (pi: ExtensionAPI) {
  const tools = [
    { name: 'web_search', label: 'Search the web', description: 'Search public web sources for supplemental explanations. Returns titles, URLs and snippets; use read_web before citing. Do not include private course text in queries.', parameters: Type.Object({query: Type.String(), limit: Type.Optional(Type.Integer({minimum: 1, maximum: 10}))}) },
    { name: 'read_web', label: 'Read a web source', description: 'Read public HTML/text or download and read a public PDF. Does not use browser cookies or execute JavaScript. Follow next_offset for long pages or read_pdf for remaining PDF pages.', parameters: Type.Object({url: Type.String(), offset: Type.Optional(Type.Integer({minimum: 0}))}) },
    { name: 'read_pdf', label: 'Read PDF pages', description: 'Extract page-numbered text from a project PDF. Defaults to five pages, maximum ten per call. Continue with next_page. For diagrams, scanned pages, or equations use render_pdf.', parameters: Type.Object({path: Type.String(), start_page: Type.Optional(Type.Integer({minimum: 1})), page_count: Type.Optional(Type.Integer({minimum: 1, maximum: 10}))}) },
    { name: 'render_pdf', label: 'View a PDF page', description: 'Render one project PDF page and return its image for visual reading, including scans and diagrams. Requires a vision-capable model for image interpretation.', parameters: Type.Object({path: Type.String(), page: Type.Integer({minimum: 1})}) },
    { name: 'compile_latex', label: 'Compile LaTeX to PDF', description: 'Compile an existing output/*.tex file with Tectonic. Returns PDF path and diagnostics. Use write to create the TeX first, then compile and render_pdf to verify layout. May download missing TeX packages on first run.', parameters: Type.Object({path: Type.String()}) },
  ];
  for (const tool of tools) {
    pi.registerTool(defineTool<TSchema>({
      ...tool,
      async execute(_id, params, signal) {
        const result = await runBackend(tool.name, params, signal);
        const content: Array<{type: 'text'; text: string} | {type: 'image'; data: string; mimeType: string}> = [{type: 'text', text: JSON.stringify(result)}];
        if (tool.name === 'render_pdf') content.push({type: 'image', data: (await readFile(result.image_path)).toString('base64'), mimeType: 'image/png'});
        return {content, details: result};
      },
    }));
  }
}
