#!/usr/bin/env node
import fs from "fs";
import path from "path";
import YAML from "js-yaml";
import logger from "fancy-log";

const JSON_ROOT = "./packs";
const YAML_ROOT = "./packs/_source";

function slugify(name) {
  return name.toLowerCase().replace("'", "").replace(/[^a-z0-9]+/gi, " ").trim().replace(/\s+|-{2,}/g, "-");
}

function deslugify(string) {
  return string?.split("_").join(" ") ?? "";
}

function _getSubfolderName(data, pack) {
  const parts = new Set();
  switch (pack) {
    case "adventuringgear":
    case "ammo":
    case "armor":
    case "blasters":
    case "lightweapons":
    case "enhanceditems":
    case "explosives":
    case "modification":
    case "starshipequipment":
    case "starshipmodifications":
    case "starshipweapons":
    case "vibroweapons":
      parts.add(data.type);
      parts.add(data.system?.armor?.type);
      parts.add(data.system?.consumableType);
      parts.add(data.system?.weaponType);
      parts.add(data.system?.modificationType);
      parts.add(data.system?.type?.value);
      parts.add(data.system?.system?.value?.toLowerCase());
      parts.add(data.system?.ammoType);
      parts.add(data.system?.type?.subtype);
      break;
    case "archetypes":
      return data.system?.classIdentifier ?? "";
    case "archetypefeatures":
    case "classfeatures":
    case "speciesfeatures":
    case "invocations":
      parts.add(data.system?.type?.subtype?.slice(0, 10));
      parts.add(deslugify(data.flags?.["sw5e-importer"]?.uid?.split(".")?.[1] ?? ""));
      parts.add(data.flags?.["sw5e-importer"]?.uid?.split(".")?.[2] ?? "");
      break;
    case "feats":
    case "starshipactions":
      parts.add(data.system?.type?.subtype);
      break;
    case "deploymentfeatures":
      parts.add(data.system?.deployment?.value);
      break;
    case "forcepowers":
    case "techpowers":
      if (data.system?.level === undefined) return "";
      if (data.system.level === 0) return "at-will";
      return `level-${data.system.level}`;
    case "maneuver":
      parts.add(data.system?.maneuverType);
      break;
    case "fistorcodex":
    case "monsters":
    case "monsters_temp":
      parts.add(data.system?.details?.type?.value);
      break;
    case "monstertraits":
      parts.add(data.system?.weaponType ?? data.system?.type?.value ?? data.type);
      break;
    default:
      break;
  }
  parts.delete(undefined);
  parts.delete("");
  parts.delete(pack);
  return [...parts].join("/");
}

function planMigrations() {
  if (!fs.existsSync(JSON_ROOT)) throw new Error(`Missing ${JSON_ROOT}`);
  const packs = fs.readdirSync(JSON_ROOT, { withFileTypes: true }).filter(d => d.isDirectory());
  const work = [];
  for (const dir of packs) {
    const pack = dir.name;
    const files = fs.readdirSync(path.join(JSON_ROOT, pack), { withFileTypes: true })
      .filter(f => f.isFile() && path.extname(f.name) === ".json");
    for (const f of files) work.push({ pack, src: path.join(JSON_ROOT, pack, f.name) });
  }
  return work;
}

function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }

function migrate() {
  const tasks = planMigrations();
  if (!tasks.length) {
    logger.info("No JSON pack files found to migrate.");
    return;
  }
  for (const t of tasks) {
    const data = JSON.parse(fs.readFileSync(t.src, "utf-8"));
    const subfolder = _getSubfolderName(data, t.pack);
    const destDir = path.join(YAML_ROOT, t.pack, subfolder);
    ensureDir(destDir);
    const out = path.join(destDir, `${slugify(data.name)}.yml`);
    fs.writeFileSync(out, `${YAML.dump(data)}\n`, { mode: 0o664 });
    logger.info(`Migrated ${t.src} -> ${out}`);
  }
  logger.info("Migration to YAML complete. You can now build from packs/_source.");
}

migrate();

