import fs from 'node:fs';
import path from 'node:path';
import { SEVERITIES } from './certificate-policy-lib.mjs';

const root = process.cwd();
const policyPath = path.join(root, '.github', 'certificate-policies.json');
const policies = JSON.parse(fs.readFileSync(policyPath, 'utf8'));
const errors = [];
const ids = new Set();
const required = ['id', 'category', 'severity', 'operation', 'description', 'input', 'expected'];

if (!Array.isArray(policies)) errors.push('Policy catalog must be an array.');
for (const [index, policy] of (Array.isArray(policies) ? policies : []).entries()) {
  for (const key of required) if (!(key in policy)) errors.push(`Rule ${index} is missing ${key}.`);
  if (ids.has(policy.id)) errors.push(`Duplicate rule ID: ${policy.id}`);
  ids.add(policy.id);
  if (!SEVERITIES.has(policy.severity)) errors.push(`Invalid severity for ${policy.id}: ${policy.severity}`);
  if (typeof policy.description !== 'string' || policy.description.length < 20) errors.push(`Description too short: ${policy.id}`);
  if (!policy.tags || !Array.isArray(policy.tags) || policy.tags.length === 0) errors.push(`Missing tags: ${policy.id}`);
}

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join('\n'));
  process.exit(1);
}

console.log(`Validated ${policies.length} certificate security policies.`);
