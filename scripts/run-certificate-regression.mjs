import fs from 'node:fs';
import path from 'node:path';
import { evaluatePolicy } from './certificate-policy-lib.mjs';

const policyPath = path.join(process.cwd(), '.github', 'certificate-policies.json');
const policies = JSON.parse(fs.readFileSync(policyPath, 'utf8'));
const failures = [];
for (const policy of policies) {
  try {
    const actual = evaluatePolicy(policy);
    const expected = Boolean(policy.expected.result);
    if (actual !== expected) failures.push(`${policy.id}: expected ${expected}, got ${actual}`);
  } catch (error) {
    failures.push(`${policy.id}: ${error.message}`);
  }
}

console.log(`Passed: ${policies.length - failures.length}`);
console.log(`Failed: ${failures.length}`);
if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
