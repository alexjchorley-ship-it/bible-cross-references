import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

/**
 * Reproducible Tyndale Open Study Notes import.
 *
 * Tyndale House Publishers (2022), CC BY-SA 4.0, release 1.25.
 * Source transformation: One Blue Thread by sbrn3, CC BY-SA 4.0.
 * JSON from an immutable, source-audited Git commit; SHA-256 checked per book.
 * No personal annotations or credentials ever enter this pipeline.
 */
const SOURCE_COMMIT = '5a9b199abc2d50bd6aabbf6147f311ce02ad81a4';
const BASE = `https://raw.githubusercontent.com/sbrn3/one-blue-thread/${SOURCE_COMMIT}/assets/tyndale/`;
const OUTPUT = resolve(import.meta.dirname, '../../public/data/commentary');

function digest(data) {
  return createHash('sha256').update(data).digest('hex').toUpperCase();
}

async function fetchBytes(path) {
  const response = await fetch(new URL(path, BASE), { redirect: 'follow' });
  if (!response.ok) {
    throw new Error(`Tyndale source ${path}: HTTP ${String(response.status)}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

async function main() {
  const manifest = JSON.parse((await fetchBytes('manifest.json')).toString('utf8'));
  const entries = Object.entries(manifest.files)
    .filter(([path]) => /^study\/[a-z0-9]+\.json$/.test(path))
    .toSorted(([a], [b]) => a.localeCompare(b));

  if (entries.length !== 66 || manifest.source?.notes?.release !== '1.25') {
    throw new Error('The pinned commentary source has unexpected coverage or version.');
  }

  await mkdir(OUTPUT, { recursive: true });
  let cursor = 0;
  async function worker() {
    while (cursor < entries.length) {
      const next = entries[cursor];
      cursor += 1;
      if (!next) {
        continue;
      }
      const [path, checksum] = next;
      const name = path.slice('study/'.length);
      const local = resolve(OUTPUT, name);
      let bytes;
      try {
        bytes = await readFile(local);
      } catch {
        bytes = null;
      }
      if (!bytes || digest(bytes) !== checksum) {
        bytes = await fetchBytes(path);
        if (digest(bytes) !== checksum) {
          throw new Error(`Integrity mismatch for ${path}. Do not silently re-pin a source.`);
        }
      }
      const records = JSON.parse(bytes.toString('utf8'));
      const book = name.replace(/\.json$/, '');
      if (
        !Array.isArray(records) ||
        records.length !== manifest.books[book] ||
        !records.every(
          (record) =>
            typeof record.id === 'string' &&
            typeof record.type === 'string' &&
            Array.isArray(record.refs) &&
            Array.isArray(record.content),
        )
      ) {
        throw new Error(`Commentary ${path} fails structural validation.`);
      }
      await writeFile(local, bytes);
    }
  }

  await Promise.all(Array.from({ length: 6 }, () => worker()));
  await writeFile(
    resolve(OUTPUT, 'index.json'),
    JSON.stringify({
      source: 'Tyndale Open Study Notes',
      originalAuthor: 'Tyndale House Publishers',
      copyright: '© 2022 Tyndale House Publishers',
      sourceRelease: manifest.source.notes.release,
      sourceArchiveSha256: manifest.source.notes.sha256,
      adaptation: 'One Blue Thread (XML converted to JSON; maps and images omitted)',
      adaptationCommit: SOURCE_COMMIT,
      licence: 'CC BY-SA 4.0',
      licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
      originalUrl: 'https://tyndaleopenresources.com/',
      adaptationUrl: `https://github.com/sbrn3/one-blue-thread/tree/${SOURCE_COMMIT}/assets/tyndale`,
      books: manifest.books,
      checksums: Object.fromEntries(entries),
    }),
  );
  process.stdout.write(`Checked ${String(entries.length)} books of licensed Tyndale study notes.\n`);
}

await main();
