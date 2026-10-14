# Certificate security regression suite

The policy catalog is a deterministic, local-only contract for certificate
identity, input handling, record parsing, and cooldown behavior. It does not
call GitHub, Cloudflare, or production endpoints and it never requires a
credential.

## Adding a policy

Add a unique object to `.github/certificate-policies.json`. Each object must
include an ID, category, severity, operation, description, input, expected
result, and at least one tag. Use dummy identities and avoid real tokens.

Supported operations are `decimal-id`, `safe-name`, `record-identity`,
`json-record`, and `cooldown`. Keep one behavior per rule so a failed rule has
an obvious diagnosis.

## Local validation

```bash
node scripts/validate-certificate-policies.mjs
node scripts/run-certificate-regression.mjs
cd frontend && npm ci && npm test && npm run build
```

The pull-request workflow runs the same commands. A malformed catalog, a
duplicate rule ID, or a behavior mismatch fails the check.
