import fs from 'node:fs';
import path from 'node:path';

const rules = [];
const normalizeName = (value) => {
  if (!value) return null;
  const sanitized = String(value).replace(/[^a-zA-Z\s-]/g, '').replace(/\s+/g, ' ').substring(0, 20).trim();
  return sanitized || null;
};
const add = (category, operation, description, input, result, tags, severity = 'medium') => {
  const number = String(rules.length + 1).padStart(4, '0');
  rules.push({
    id: `CERT-${category.toUpperCase()}-${number}`,
    category,
    severity,
    operation,
    description,
    input,
    expected: { result },
    tags,
  });
};

for (const value of ['0', '1', '7', '42', '12345', '999999', '000123', '12345678901234567890']) {
  add('identity-validation', 'decimal-id', `Accept decimal certificate identity ${value} without normalizing it through a path operation.`, { value }, true, ['identity', 'positive'], 'high');
}
for (const value of ['', ' ', '-1', '+1', '1.0', '1/2', '../1', '..%2f1', 'certs/1', '1.json', '0x10', '1e3', '１２３', '1\n2', '1?x=2', '#1', '1\\2', 'null', 'undefined', 'NaN', 'Infinity', '1,2', '1 2', ' 1', '1 ']) {
  add('identity-validation', 'decimal-id', `Reject path-like or non-decimal certificate identity input ${JSON.stringify(value)} before making a data request.`, { value }, false, ['identity', 'negative'], 'high');
}

const nameCases = [
  ['Ada Lovelace', 'Ada Lovelace'], ['Grace-Hopper', 'Grace-Hopper'], ['Alan Turing', 'Alan Turing'],
  ['O\'Connor', 'OConnor'], ['Zoë Kravitz', 'Zo Kravitz'], ['  spaced   name  ', 'spaced name'],
  ['name<script>', 'namescript'], ['<img src=x>', 'img srcx'], ['a_b', 'ab'], ['a.b', 'ab'],
  ['name/other', 'nameother'], ['emoji 🚀', 'emoji'], ['12345', null], ['!!!', null], ['', null],
  ['   ', null], ['a'.repeat(25), 'a'.repeat(20)], ['John--Doe', 'John--Doe'], ['a\tb', 'a b'],
  ['A&B', 'AB'], ['safe-name-1', 'safe-name'], ['é', null], ['राम', null], ['name\nnext', 'name next'],
];
for (const [value, expected] of nameCases) {
  add('profile-input', 'safe-name', `Normalize contributor display name ${JSON.stringify(value)} to a bounded safe value before dispatch.`, { value, expected }, normalizeName(value) === expected, ['input', 'display-name'], 'medium');
}

const records = [
  ['100', { id: 100, tier: 'Bronze' }, true], ['001', { id: '001', tier: 'Silver' }, true],
  ['42', { id: 42, tier: 'Gold', stats: {} }, true], ['0', { id: 0 }, true],
  ['100', { id: 101 }, false], ['100', { id: '1000' }, false], ['100', {}, false],
  ['100', null, false], ['../100', { id: '../100' }, false], ['100.json', { id: '100.json' }, false],
  ['100', [], false], ['100', { id: 100, extra: '<script>' }, true],
];
for (const [requestedId, record, result] of records) {
  add('record-integrity', 'record-identity', `Compare requested certificate identity ${requestedId} with the embedded record identity without trusting the path alone.`, { requestedId, record }, result, ['record', 'idor'], result ? 'medium' : 'high');
}

const jsonRecords = [
  ['{"id":1,"tier":"Bronze"}', true], ['{"id":"2","stats":{}}', true], ['{"id":0}', true],
  ['{}', true], ['null', false], ['[]', false], ['true', false], ['"text"', false], ['', false],
  ['{', false], ['{"id":}', false], ['{"__proto__":{"polluted":true}}', true],
  ['{"id":1,"nested":{"x":[1,2,3]}}', true], ['undefined', false], ['NaN', false],
];
for (const [content, result] of jsonRecords) {
  add('record-parsing', 'json-record', `Parse certificate record content safely and return a structured object only for valid JSON objects.`, { content }, result, ['parser', result ? 'positive' : 'negative'], 'high');
}

const cooldownCases = [
  [100000, 0, 0, false], [100000, 99999, 0, true], [100000, 13600, 0, false],
  [100000, 0, 99999, true], [100000, 0, 13600, false], [100000, 99999, 99998, true],
  [100000, 0, 0, false], [100000, 100000, 0, true], [100000, 100001, 0, true],
  [100000, 13601, 0, false], [100000, 0, 13601, false], [100000, -1, -1, false],
  [100000, '99999', '0', true], [100000, 'invalid', 'invalid', false],
];
for (const [now, lastIssued, lastAttempt] of cooldownCases) {
  const latest = Math.max(Number(lastIssued) || 0, Number(lastAttempt) || 0);
  const active = latest > 0 && Math.max(0, Number(now) - latest) < 86400;
  add('rate-limit', 'cooldown', `Apply the 24-hour issuance cooldown using the latest valid issuance or attempt timestamp.`, { now, lastIssued, lastAttempt, seconds: 86400 }, active, ['rate-limit', active ? 'blocked' : 'available'], 'high');
}

const dispatchCases = [
  [{ full_name: 'Ada Lovelace', github_user: 'ada', github_id: '1', user_token: 'fixture-token' }, true],
  [{ full_name: 'Grace Hopper', github_user: 'grace-hopper', github_id: '2', user_token: 'fixture-token' }, true],
  [{ full_name: 'Alan Turing', github_user: 'alan', github_id: '3', user_token: 'fixture-token' }, true],
  [{ full_name: '', github_user: 'ada', github_id: '1', user_token: 'fixture-token' }, false],
  [{ full_name: 'Ada', github_user: '', github_id: '1', user_token: 'fixture-token' }, false],
  [{ full_name: 'Ada', github_user: 'ada', github_id: '', user_token: 'fixture-token' }, false],
  [{ full_name: 'Ada', github_user: 'ada', github_id: '1', user_token: '' }, false],
  [{ full_name: 'Ada', github_user: 'ada', github_id: 1, user_token: 'fixture-token' }, false],
  [{ full_name: 'Ada', github_user: 'ada', github_id: '1', user_token: null }, false],
  [{ full_name: 'Ada', github_user: 'ada', github_id: '1' }, false],
  [null, false], [[], false], ['payload', false],
];
for (const [payload, result] of dispatchCases) {
  add('dispatch-contract', 'dispatch-payload', 'Require every server-side certificate dispatch field before starting the GitHub workflow.', { payload }, result, ['dispatch', result ? 'positive' : 'negative'], 'high');
}

const shapeCases = [
  [{ id: '1', tier: 'Bronze' }, true], [{ id: '2', tier: 'Silver' }, true], [{ id: '3', tier: 'Gold' }, true],
  [{ id: 0, tier: 'Bronze' }, true], [{ id: '001', tier: 'Gold' }, true], [{ id: '1', tier: 'bronze' }, false],
  [{ id: '1', tier: 'Platinum' }, false], [{ id: '1.0', tier: 'Gold' }, false], [{ id: '../1', tier: 'Gold' }, false],
  [{ tier: 'Gold' }, false], [{ id: '1' }, false], [null, false], [[], false],
];
for (const [record, result] of shapeCases) {
  add('certificate-schema', 'certificate-shape', 'Require a certificate record to contain a decimal identity and an issued tier.', { record }, result, ['schema', result ? 'positive' : 'negative'], 'high');
}

const scoreCases = [
  [{ lines_added: 0, lines_removed: 0, merged_commits: 0 }, true],
  [{ lines_added: 1, lines_removed: 1, merged_commits: 1 }, true],
  [{ lines_added: '100', lines_removed: '50', merged_commits: '2' }, true],
  [{ lines_added: '0', lines_removed: '0', merged_commits: '0' }, true],
  [{ lines_added: -1, lines_removed: 0, merged_commits: 0 }, false],
  [{ lines_added: 0, lines_removed: -1, merged_commits: 0 }, false],
  [{ lines_added: 0, lines_removed: 0, merged_commits: -1 }, false],
  [{ lines_added: 'NaN', lines_removed: 0, merged_commits: 0 }, false],
  [{ lines_added: 'Infinity', lines_removed: 0, merged_commits: 0 }, false],
  [{ lines_added: null, lines_removed: 0, merged_commits: 0 }, true],
  [{ lines_added: 0, lines_removed: undefined, merged_commits: 0 }, false],
  [{ lines_added: 0, lines_removed: 0 }, false],
  [null, false], [[], false],
];
for (const [stats, result] of scoreCases) {
  add('score-input', 'score-stats', 'Accept only finite non-negative contribution metrics before score normalization.', { stats }, result, ['scoring', result ? 'positive' : 'negative'], 'medium');
}

const out = path.join(process.cwd(), '.github', 'certificate-policies.json');
fs.writeFileSync(out, `${JSON.stringify(rules, null, 2)}\n`);
console.log(`Wrote ${rules.length} policy cases to ${out}`);
