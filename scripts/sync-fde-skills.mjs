import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, relative, resolve } from "node:path";

const repo = "bingyue/fde-skills";
const branch = "master";
const projectRoot = resolve(import.meta.dirname, "..");
const manifestPath = join(projectRoot, "src/data/fde-skills-manifest.json");
const runtimePath = join(projectRoot, "src/data/fde-skills-runtime.json");
const downloadDir = join(projectRoot, "public/skill-downloads");
const tempRoot = mkdtempSync(join(tmpdir(), "fde-skills-sync-"));
const archive = join(tempRoot, "repo.tar.gz");

function command(bin, args, cwd) {
  execFileSync(bin, args, { cwd, stdio: "pipe" });
}

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function titleFrom(markdown, fallback) {
  const frontmatterName = markdown.match(/^---[\s\S]*?\nname:\s*["']?([^\n"']+)/)?.[1]?.trim();
  const heading = markdown.match(/^#\s+(.+)$/m)?.[1]?.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, "").trim();
  return frontmatterName || heading || fallback.replaceAll("-", " ");
}

function summaryFrom(markdown) {
  const frontmatterDescription = markdown.match(/^---[\s\S]*?\ndescription:\s*["']?([^\n"']+)/)?.[1]?.trim();
  if (frontmatterDescription) return frontmatterDescription.slice(0, 220);
  const paragraphs = markdown.replace(/^---[\s\S]*?---/, "").split(/\n\s*\n/).map((part) => part.replace(/^#+\s+.*$/gm, "").replace(/[`>*#|]/g, "").replace(/\s+/g, " ").trim()).filter((part) => part.length > 36);
  return (paragraphs[0] || "FDE 项目交付技能与可复用工作方法。").slice(0, 220);
}

function categoryFor(path) {
  const root = path.split("/")[0];
  const labels = { ".agents": "扩展工具", "01-Foundation": "基础能力", "02-Discovery": "需求发现", "03-Solution-Design": "方案设计", "04-AI-Delivery": "AI 交付", "05-Deployment": "部署", "06-Integration": "集成", "07-Operations": "运营", "08-Security-Compliance": "安全合规", "09-Industry": "行业实践", "10-Templates": "交付模板", "11-Best-Practice": "最佳实践" };
  return labels[root] || "其他";
}

try {
  command("curl", ["-L", "--max-time", "90", "-sS", `https://api.github.com/repos/${repo}/tarball/${branch}`, "-o", archive]);
  command("tar", ["-xzf", archive, "-C", tempRoot]);
  const sourceRoot = readdirSync(tempRoot, { withFileTypes: true }).find((entry) => entry.isDirectory())?.name;
  if (!sourceRoot) throw new Error("GitHub archive did not contain a source directory");
  const source = join(tempRoot, sourceRoot);
  const sha = sourceRoot.split("-").at(-1) || "unknown";
  const allFiles = walk(source);
  const skillDirectories = [...new Set(allFiles.filter((file) => ["SKILL.md", "prompt.md"].includes(basename(file))).map(dirname))].sort();

  mkdirSync(dirname(manifestPath), { recursive: true });
  mkdirSync(downloadDir, { recursive: true });
  for (const file of readdirSync(downloadDir)) if (file.endsWith(".zip")) rmSync(join(downloadDir, file));

  const runtime = {};
  const skills = skillDirectories.map((directory) => {
    const sourcePath = relative(source, directory).replaceAll("\\", "/");
    const files = walk(directory);
    const primary = [join(directory, "SKILL.md"), join(directory, "prompt.md"), join(directory, "README.md")].find(existsSync);
    const content = primary ? readFileSync(primary, "utf8") : "";
    const id = slugify(sourcePath);
    const hasScripts = files.some((file) => relative(directory, file).split(/[\\/]/).includes("scripts"));
    const hasWorkflow = files.some((file) => ["workflow.md", "SKILL.md"].includes(basename(file)));
    const zipPath = join(downloadDir, `${id}.zip`);
    command("zip", ["-qr", zipPath, basename(directory)], dirname(directory));
    runtime[id] = { prompt: content.slice(0, 60_000), sourcePath };
    return {
      id,
      name: titleFrom(content, basename(directory)),
      summary: summaryFrom(content),
      category: categoryFor(sourcePath),
      sourcePath,
      sourceUrl: `https://github.com/${repo}/tree/${branch}/${sourcePath.split("/").map(encodeURIComponent).join("/")}`,
      downloadUrl: `/skill-downloads/${id}.zip`,
      fileCount: files.length,
      sizeBytes: files.reduce((sum, file) => sum + statSync(file).size, 0),
      hasScripts,
      hasWorkflow,
      executionMode: "ai",
      runtimeSafety: hasScripts ? "prompt_only" : "safe_prompt",
    };
  });

  const manifest = { source: `https://github.com/${repo}`, branch, commit: sha, syncedAt: new Date().toISOString(), license: "未声明", total: skills.length, skills };
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  writeFileSync(runtimePath, `${JSON.stringify(runtime)}\n`);
  process.stdout.write(`Synced ${skills.length} skills at ${sha}; generated ${skills.length} ZIP downloads.\n`);
} finally {
  rmSync(tempRoot, { recursive: true, force: true });
}
