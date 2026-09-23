import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const source = readFileSync(new URL('../supabase/functions/create-user/index.ts', import.meta.url), 'utf8').replace(/^import .*;\r?\n/, '');
const code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } }).outputText;
function setup(options = {}) {
  let handler;
  const calls = [];
  const client = {
    auth: {
      getUser: async () => ({ data: { user: options.invalidToken ? null : { id: 'admin' } }, error: null }),
      admin: {
        createUser: async (value) => { calls.push(['create', value]); return { data: { user: { id: 'new' } }, error: options.duplicate ? { message: 'Email already exists' } : null }; },
        deleteUser: async (id) => { calls.push(['delete', id]); return { error: options.rollbackFailure ? {} : null }; },
      },
    },
    from: () => ({
      select: () => ({ eq: () => ({ single: async () => ({ data: { role: options.role || 'leader', is_active: options.active ?? true }, error: null }) }) }),
      upsert: async (value) => { calls.push(['profile', value]); return { error: options.profileFailure ? {} : null }; },
    }),
  };
  vm.runInNewContext(code, { createClient: () => client, Response, console: { error() {} }, Deno: { env: { get: () => 'test' }, serve: (fn) => { handler = fn; } } });
  return { calls, request: (body = { email: ' New@Example.com ', password: 'secret123', role: 'leader' }, token = 'token') => handler(new Request('https://example.com', { method: 'POST', headers: token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : {}, body: JSON.stringify(body) })) };
}
for (const [name, options, token, expected] of [
  ['missing token', {}, '', 401], ['invalid token', { invalidToken: true }, 'bad', 401],
  ['staff', { role: 'worker' }, 'token', 403], ['inactive administrator', { active: false }, 'token', 403],
]) test(`rejects ${name} before creating an account`, async () => {
  const app = setup(options);
  assert.equal((await app.request(undefined, token)).status, expected);
  assert.equal(app.calls.length, 0);
});
test('creates a confirmed staff account and ignores requested elevated role', async () => {
  const app = setup();
  const response = await app.request();
  assert.equal(response.status, 201);
  assert.equal(app.calls[0][1].email, 'new@example.com');
  assert.equal(app.calls[0][1].email_confirm, true);
  assert.equal(app.calls[1][1].role, 'worker');
  assert.equal(app.calls[1][1].password, undefined);
  assert.equal(JSON.stringify(await response.json()).includes('secret123'), false);
});
test('rejects invalid input before creation', async () => {
  const app = setup();
  assert.equal((await app.request({ email: 'bad', password: 'secret123' })).status, 400);
  assert.equal((await app.request({ email: 'a@example.com', password: '123' })).status, 400);
  assert.equal(app.calls.length, 0);
});
test('duplicate account errors do not write a profile', async () => {
  const app = setup({ duplicate: true });
  assert.equal((await app.request()).status, 400);
  assert.equal(app.calls.length, 1);
});
test('rolls back auth account when profile creation fails', async () => {
  const app = setup({ profileFailure: true });
  assert.equal((await app.request()).status, 500);
  assert.equal(app.calls[2][0], 'delete');
  assert.equal(app.calls[2][1], 'new');
});
test('reports incomplete account if rollback fails', async () => {
  const app = setup({ profileFailure: true, rollbackFailure: true });
  const response = await app.request();
  assert.equal(response.status, 500);
  assert.match((await response.json()).error, /incomplete account/);
});