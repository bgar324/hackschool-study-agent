# HackSchool Study Agent

A Pi agent that reads course PDFs, finds supplemental explanations online,
and generates a study plan as a PDF using LaTeX.

## Setup

You need Node.js (22 or newer), Python (tested with 3.13),
[uv](https://docs.astral.sh/uv/getting-started/installation/), and
[Tectonic](https://tectonic-typesetting.github.io/).
On macOS, Tectonic is available with `brew install tectonic`.

```sh
git clone https://github.com/bgar324/hackschool-study-agent.git
cd hackschool-study-agent
npm ci
uv venv --python 3.13 .venv
uv pip install --python .venv/bin/python -r requirements.txt
npm start
```

This installs and launches the project's pinned Pi version. A global Pi
installation is not required. Do not copy another machine's `.venv` or
`node_modules`; install them using the commands above.

Inside Pi, trust this project's extension if prompted, use `/login` to connect
a model provider, and `/model` to select a model. The demo was smoke-tested
with `openai-codex` / `gpt-6.1-sol`. Use a model that supports images to inspect
PDF page images. Provider access and usage limits depend on your account.

## Add your materials

Put your syllabus and lecture PDFs in `course/`. Course files are not included
in this repository. Local course materials and generated output are ignored
by Git.

Then ask Pi:

```text
Help me study for my next quiz using the syllabus and lecture PDFs in course/.
Ask me which instructor's section I'm in, any missing quiz details, and which
dates I can study. I have 60 minutes per day.

Find helpful supplemental explanations online and cite your sources.
Generate a study plan as a PDF using LaTeX, check its time totals and formatting,
and save it in output/.
```

The instructions currently cap each day at 60 minutes, including supplemental
reading. Adjust `AGENTS.md` if you want a different limit. Pi should ask for
missing information instead of inventing quiz dates or topics.

## Project files

| File | Purpose |
| --- | --- |
| `AGENTS.md` | Study-planning instructions and output requirements. |
| `.pi/extensions/study-tools.ts` | Registers five model-callable tools with Pi. |
| `scripts/study_tools.py` | Implements search, webpage reading, and PDF operations. |
| `templates/study-plan.tex` | Starting LaTeX document. |
| `course/` | Your input PDFs. |
| `output/` | Generated Markdown, LaTeX, PDFs, and page previews. |

## Custom tools

| Tool | What it does |
| --- | --- |
| `web_search` | Searches public sources through DDGS, without a search API key. |
| `read_web` | Reads webpage text or downloads a public PDF. |
| `read_pdf` | Extracts PDF text with page numbers and pagination. |
| `render_pdf` | Returns a PDF page image for visual inspection. |
| `compile_latex` | Compiles an existing `.tex` file under `output/` with Tectonic. |

Pi's built-in file and shell tools remain available. The model writes the
LaTeX source, calls the compiler, and inspects rendered pages before finishing.
The first compilation may download missing TeX packages; rehearse once online.

Web search can be rate-limited. Web reading does not execute JavaScript or
access logged-in pages. Scans and diagrams require a vision-capable model;
a separate OCR engine is not configured. Local PDF text/images are sent to
your selected model as context, not uploaded to the search provider.

The agent checks study-time totals through its own reasoning. There is no
separate `check_study_plan` tool. Verify the final plan and its citations.
Project instructions guide behavior; they are not a filesystem sandbox.

## Development

```sh
npm run typecheck
```

Dependencies are pinned. The `undici` override includes security fixes.
The project was smoke-tested through Pi: course PDF reading, live web search,
webpage reading, LaTeX compilation, and rendered PDF inspection all succeeded.

Pi documentation: https://pi.dev/docs/latest/extensions
