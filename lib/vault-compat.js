/* Reads the vault's entity-link schema back into the nested tags this branch's
   templates were written against.

   The vault moved its taxonomy out of tags and into links to entity notes:
   `group:`, `about:`, `musician:`, `project:`, `platforms:` and `tools:` now say
   what `AlbumGroup/…`, `AlbumInfo/…`, `Design/…` and `Case-Studies/…` tags used
   to, and case studies flattened their `project:` map to top-level keys. The
   templates here still read the old shape, so it is rebuilt at parse time —
   front matter is the one hook that runs before collections are assembled, and
   `eleventyComputed` tags never reach a collection.

   Additive only: an authored tag is never removed, so a note in the old shape
   passes through unchanged and the same build reads either vault. Delete this
   file once the templates read the new keys themselves. */
import yaml from 'js-yaml';
import { entityWebsite } from './entity-notes.js';

// `[[Entities/Places/Austin|Austin]]` -> { path, kind: "Places", name: "Austin" }
function entity(value) {
  const m = String(value).match(/^\[\[([^\]|]+)(?:\|([^\]]+))?\]\]$/);
  if (!m) return null;
  const parts = m[1].split('/');
  return { path: m[1], kind: parts[1], name: (m[2] || parts.at(-1)).trim() };
}
const entities = (v) => (Array.isArray(v) ? v : v ? [v] : []).map(entity).filter(Boolean);

const ABOUT = { Gear: 'Camera', Places: 'Location', Periods: 'Period' };

/* Obsidian tags cannot hold a space, so the vault hyphenated `Monthly Notes` and
   `Aging Parents` when they were still tags. Only a hyphen between two
   capitalised words goes back, which leaves `no-JS` alone. */
const unhyphenateTopic = (tag) =>
  tag.startsWith('Topic/') ? tag.replace(/([A-Z][a-z]+)-(?=[A-Z][a-z])/g, '$1 ') : tag;

/* A collaborator used to be a markdown link written out by hand; it is now a link
   to a person note, and the person's site lives on that note. */
function collaborator(value) {
  const person = entity(value);
  if (!person) return value;
  const site = entityWebsite(person.path);
  return site ? `[${person.name}](${site}){target=blank}` : person.name;
}

function caseStudyProject(data) {
  if (data.project && typeof data.project === 'object') return;
  if (!['outcome', 'skills', 'tools', 'period', 'collaborators'].some((k) => k in data)) return;
  const project = {};
  if (data.outcome) project.outcome = data.outcome;
  if (data.client) project.client = data.client;
  if (data.skills) project.skills = data.skills;
  if (data.tools) project.tools = entities(data.tools).map((t) => t.name);
  if (data.period) project.period = data.period;
  if (data.collaborators) project.collaborators = [].concat(data.collaborators).map(collaborator);
  data.project = project;
}

export function legacyShape(data) {
  if (!data || typeof data !== 'object') return data;
  const authored = (Array.isArray(data.tags) ? data.tags : data.tags ? [data.tags] : []).map(unhyphenateTopic);

  // In the order the old notes listed them, which is the order page headers show.
  const derived = [];
  const about = entities(data.about);
  for (const a of about) if (a.kind === 'Gear') derived.push(`AlbumInfo/Camera/${a.name}`);
  for (const m of entities(data.musician)) derived.push(`AlbumInfo/Musician/${m.name}`);
  for (const kind of ['Places', 'Periods']) {
    for (const a of about) if (a.kind === kind) derived.push(`AlbumInfo/${ABOUT[kind]}/${a.name}`);
  }
  for (const g of entities(data.group)) derived.push(`AlbumGroup/${g.name}`);
  if (typeof data.project === 'string') for (const p of entities(data.project)) derived.push(`Design/${p.name}`);
  for (const p of entities(data.platforms)) derived.push(`Case-Studies/Platforms/${p.name}`);
  for (const t of entities(data.tools)) derived.push(`Case-Studies/Tools/${t.name}`);

  caseStudyProject(data);

  if (authored.length || derived.length) {
    // Case-study groups led the old list, ahead of platforms, tools and topics.
    const groups = authored.filter((t) => t.startsWith('Case-Studies/'));
    const rest = authored.filter((t) => !t.startsWith('Case-Studies/'));
    data.tags = [...new Set([...groups, ...derived, ...rest])];
  }
  return data;
}

export const frontMatterParsingOptions = {
  engines: { yaml: (source) => legacyShape(yaml.load(source)) ?? {} },
};
