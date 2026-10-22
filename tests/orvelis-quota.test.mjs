import test from 'node:test';
import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
test('quota SQL enforces per-minute/day limits, resets and database access restrictions', async () => {
const db = new PGlite();
await db.exec(`create schema auth; create table auth.users(id uuid primary key); create role anon; create role authenticated; create function auth.uid() returns uuid language sql as $$ select nullif(current_setting('test.uid', true), '')::uuid $$;`);
await db.exec(await readFile(new URL('../supabase/migrations/202610220001_orvelis_quota.sql', import.meta.url), 'utf8'));
const uid = '11111111-1111-4111-8111-111111111111';
await db.exec(`insert into auth.users values ('${uid}'); set test.uid = '${uid}'; set role authenticated;`);
const consume = async () => (await db.query('select public.consume_orvelis_quota() as allowed')).rows[0].allowed;
assert.deepEqual(await Promise.all(Array.from({ length: 10 }, consume)), [true,true,true,true,true,true,false,false,false,false]);
await assert.rejects(() => db.query('select * from public.orvelis_usage'), /permission denied/);
await db.exec('reset role;');
await db.exec("update public.orvelis_usage set minute_start=now()-interval '2 minutes',day_count=59;");
await db.exec('set role authenticated;');
assert.equal(await consume(), true);
assert.equal(await consume(), false);
await db.exec('reset role;');
await db.exec("update public.orvelis_usage set minute_start=now()-interval '2 minutes',day_start=now()-interval '2 days';");
await db.exec('set role authenticated;');
assert.equal(await consume(), true);
await db.exec("reset role; set test.uid=''; set role authenticated;");
assert.equal(await consume(), false);
await db.exec('reset role; set role anon;');
await assert.rejects(consume, /permission denied/);
await db.close();

});
