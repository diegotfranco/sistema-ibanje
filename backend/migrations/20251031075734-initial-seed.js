'use strict';

import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

var dbm;
var type;
var seed;

/**
 * We receive the dbmigrate dependency from dbmigrate initially.
 * This enables us to not have to rely on NODE_PATH.
 */
export function setup(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
}

export async function up(db) {
  // Use import.meta.url to get the current file's path
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const filePath = join(__dirname, 'sqls', '20251031075734-initial-seed-up.sql');
  const sql = await readFile(filePath, { encoding: 'utf-8' });
  return db.runSql(sql);
}

export async function down(db) {
  // Use import.meta.url to get the current file's path
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const filePath = join(__dirname, 'sqls', '20251031075734-initial-seed-down.sql');
  const sql = await readFile(filePath, { encoding: 'utf-8' });
  return db.runSql(sql);
}

export const _meta = {
  version: 1
};
