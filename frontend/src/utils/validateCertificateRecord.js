const VALID_TIERS = new Set(["bronze", "silver", "gold"]);

export function validateCertificateRecord(record, requestedId) {
  if (!record || typeof record !== "object") {
    return { valid: false, reason: "Record is not an object" };
  }

  if (!/^\d+$/.test(String(requestedId))) {
    return { valid: false, reason: "Invalid certificate ID" };
  }

  if (String(record.id) !== String(requestedId)) {
    return { valid: false, reason: "Certificate identity mismatch" };
  }

  if (typeof record.user !== "string" || record.user.trim() === "") {
    return { valid: false, reason: "Invalid certificate user" };
  }

  if (
    record.tier !== undefined &&
    !VALID_TIERS.has(String(record.tier).toLowerCase())
  ) {
    return { valid: false, reason: "Invalid certificate tier" };
  }

  if (record.stats !== undefined && typeof record.stats !== "object") {
    return { valid: false, reason: "Invalid certificate statistics" };
  }

  if (
    record.stats?.repositories !== undefined &&
    !Array.isArray(record.stats.repositories)
  ) {
    return { valid: false, reason: "Invalid repository list" };
  }

  return { valid: true, record };
}
