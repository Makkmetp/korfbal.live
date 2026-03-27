#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { watch } from "node:fs";

const projectRoot = process.cwd();

const args = parseArgs(process.argv.slice(2));
const inputDir = path.resolve(projectRoot, args.input);
const outputDir = path.resolve(projectRoot, args.output);

await ensureDirectory(inputDir, "Input directory bestaat niet");
await fs.mkdir(outputDir, { recursive: true });

await generateIcons({ inputDir, outputDir });

if (args.watch) {
  startWatchMode({ inputDir, outputDir });
}

function parseArgs(rawArgs) {
  const config = {
    input: "src/assets/icons",
    output: "src/components/icons",
    watch: false,
  };

  for (let i = 0; i < rawArgs.length; i += 1) {
    const arg = rawArgs[i];

    if (arg === "--input" || arg === "-i") {
      config.input = rawArgs[i + 1] ?? config.input;
      i += 1;
      continue;
    }

    if (arg === "--output" || arg === "-o") {
      config.output = rawArgs[i + 1] ?? config.output;
      i += 1;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      printHelpAndExit();
    }

    if (arg === "--watch" || arg === "-w") {
      config.watch = true;
    }
  }

  return config;
}

function printHelpAndExit() {
  console.log(`Gebruik:
  npm run generate:icons
  npm run generate:icons -- --input src/icons --output src/components/icons

Opties:
  --input, -i   Bronmap met .svg bestanden (default: src/assets/icons)
  --output, -o  Doelmap voor .astro icon-componenten (default: src/components/icons)
  --watch, -w   Blijf luisteren naar wijzigingen in de bronmap
`);
  process.exit(0);
}

async function generateIcons({ inputDir, outputDir }) {
  const svgFiles = await collectSvgFiles(inputDir);

  if (svgFiles.length === 0) {
    console.log(`[icons] Geen .svg bestanden gevonden in: ${relativeToRoot(inputDir)}`);
    return;
  }

  const generated = [];

  for (const filePath of svgFiles) {
    const source = await fs.readFile(filePath, "utf8");
    const componentName = toComponentName(path.basename(filePath, ".svg"));
    const componentPath = path.join(outputDir, `${componentName}.astro`);
    const svgMarkup = normalizeSvg(source);

    const astroComponent = buildAstroComponent({
      componentName,
      svgMarkup,
      defaultTitle: toDefaultTitle(componentName),
    });

    await fs.writeFile(componentPath, astroComponent, "utf8");
    generated.push(componentName);
  }

  await writeIndexFile(outputDir, generated);

  console.log(
    `[icons] ${generated.length} componenten gegenereerd in: ${relativeToRoot(outputDir)}`,
  );
}

async function ensureDirectory(directoryPath, errorPrefix) {
  try {
    const stat = await fs.stat(directoryPath);
    if (!stat.isDirectory()) {
      throw new Error();
    }
  } catch {
    console.error(`[icons] ${errorPrefix}: ${relativeToRoot(directoryPath)}`);
    process.exit(1);
  }
}

async function collectSvgFiles(startDir) {
  const entries = await fs.readdir(startDir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(startDir, entry.name);

    if (entry.isDirectory()) {
      const nested = await collectSvgFiles(fullPath);
      files.push(...nested);
      continue;
    }

    if (entry.isFile() && entry.name.toLowerCase().endsWith(".svg")) {
      files.push(fullPath);
    }
  }

  return files.sort((a, b) => a.localeCompare(b));
}

function normalizeSvg(svg) {
  let content = svg.trim();
  content = content.replace(/<\?xml[\s\S]*?\?>/g, "").trim();
  content = content.replace(/<!DOCTYPE[\s\S]*?>/gi, "").trim();
  content = content.replace(/\r\n?/g, "\n");
  content = content.replace(/\sclass=(['"])[\s\S]*?\1/g, "");

  // Zorg dat icon kleur via CSS te sturen is.
  content = content.replace(/stroke=(['"])black\1/gi, 'stroke="currentColor"');
  content = content.replace(/fill=(['"])black\1/gi, 'fill="currentColor"');
  content = content.replace(/\bstroke-width=(['"])[^'"]+\1/gi, "stroke-width={strokeWidth}");

  return content;
}

function buildAstroComponent({ componentName, svgMarkup, defaultTitle }) {
  const wrappedSvg = svgMarkup
    .replace("<svg", '<svg class={className}')
    .replace(/width=(['"])[^'"]+\1/, "width={size}")
    .replace(/height=(['"])[^'"]+\1/, "height={size}")
    .replace(
      ">",
      '\n  aria-hidden={decorative ? "true" : "false"}\n  role={decorative ? undefined : "img"}>',
    );

  return `---
interface Props {
  size?: number | string;
  strokeWidth?: number | string;
  class?: string;
  title?: string;
  decorative?: boolean;
}

const {
  size = 24,
  strokeWidth = 1.5,
  class: className = "",
  title = "${defaultTitle}",
  decorative = true,
} = Astro.props;
---

${wrappedSvg.replace(
  /<svg([^>]*)>/,
  `<svg$1>\n  {!decorative && <title>{title}</title>}`,
)}`;
}

function toComponentName(fileName) {
  const cleaned = fileName
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join("");

  return `Icon${cleaned || "Svg"}`;
}

function toDefaultTitle(componentName) {
  return componentName
    .replace(/^Icon/, "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .trim();
}

async function writeIndexFile(iconsDir, componentNames) {
  const lines = componentNames.map(
    (name) => `export { default as ${name} } from "./${name}.astro";`,
  );
  const file = `${lines.join("\n")}\n`;

  await fs.writeFile(path.join(iconsDir, "index.ts"), file, "utf8");
}

function relativeToRoot(absolutePath) {
  return path.relative(projectRoot, absolutePath) || ".";
}

function startWatchMode({ inputDir, outputDir }) {
  console.log(`[icons] Watch mode actief op: ${relativeToRoot(inputDir)}`);

  let timer = null;
  let isGenerating = false;
  let shouldRunAgain = false;

  const scheduleGeneration = () => {
    if (timer) {
      clearTimeout(timer);
    }

    timer = setTimeout(async () => {
      if (isGenerating) {
        shouldRunAgain = true;
        return;
      }

      isGenerating = true;
      try {
        await generateIcons({ inputDir, outputDir });
      } catch (error) {
        console.error("[icons] Fout tijdens genereren:", error);
      } finally {
        isGenerating = false;
      }

      if (shouldRunAgain) {
        shouldRunAgain = false;
        scheduleGeneration();
      }
    }, 120);
  };

  const watcher = watch(
    inputDir,
    { recursive: true },
    (eventType, fileName) => {
      if (!fileName || !fileName.toLowerCase().endsWith(".svg")) {
        return;
      }

      console.log(`[icons] ${eventType}: ${fileName}`);
      scheduleGeneration();
    },
  );

  watcher.on("error", (error) => {
    console.error("[icons] Watcher fout:", error);
  });
}
