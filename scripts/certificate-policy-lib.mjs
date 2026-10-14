export const SEVERITIES = new Set(['critical', 'high', 'medium', 'low', 'informational']);

export const isDecimalId = (value) => typeof value === 'string' && /^[0-9]+$/.test(value);

export const sanitizeName = (value) => {
  if (typeof value !== 'string' || value.length === 0) return null;
  const normalized = value.replace(/[^a-zA-Z\s-]/g, '').replace(/\s+/g, ' ').trim().slice(0, 20);
  return normalized || null;
};

export const validateRecordIdentity = (requestedId, record) => (
  Boolean(isDecimalId(requestedId) && record && String(record.id) === String(requestedId))
);

export const parseRecord = (content) => {
  if (typeof content !== 'string') return { ok: false, value: null };
  try {
    const value = JSON.parse(content);
    return { ok: Boolean(value && typeof value === 'object' && !Array.isArray(value)), value };
  } catch {
    return { ok: false, value: null };
  }
};

export const isDispatchPayloadSafe = (payload) => {
  if (!payload || typeof payload !== 'object') return false;
  const required = ['full_name', 'github_user', 'github_id', 'user_token'];
  return required.every((key) => typeof payload[key] === 'string' && payload[key].length > 0);
};

export const isCertificateShapeValid = (record) => (
  Boolean(record && isDecimalId(String(record.id)) && ['Bronze', 'Silver', 'Gold'].includes(record.tier))
);

export const isScoreFinite = (stats) => {
  if (!stats || typeof stats !== 'object') return false;
  return ['lines_added', 'lines_removed', 'merged_commits'].every((key) => {
    const value = Number(stats[key]);
    return Number.isFinite(value) && value >= 0;
  });
};

export const cooldownState = ({ now, lastIssued = 0, lastAttempt = 0, seconds = 86400 }) => {
  const latest = Math.max(Number(lastIssued) || 0, Number(lastAttempt) || 0);
  const elapsed = Math.max(0, Number(now) - latest);
  return { active: latest > 0 && elapsed < seconds, secondsRemaining: latest > 0 ? Math.max(seconds - elapsed, 0) : 0 };
};

export const evaluatePolicy = (policy) => {
  const input = policy.input || {};
  switch (policy.operation) {
    case 'decimal-id':
      return isDecimalId(String(input.value ?? ''));
    case 'safe-name':
      return sanitizeName(input.value) === input.expected;
    case 'record-identity':
      return validateRecordIdentity(String(input.requestedId ?? ''), input.record);
    case 'json-record':
      return parseRecord(input.content).ok;
    case 'dispatch-payload':
      return isDispatchPayloadSafe(input.payload);
    case 'certificate-shape':
      return isCertificateShapeValid(input.record);
    case 'score-stats':
      return isScoreFinite(input.stats);
    case 'cooldown':
      return cooldownState(input).active;
    default:
      throw new Error(`Unsupported policy operation: ${policy.operation}`);
  }
};
