// Commit-hash versions are unreadable at full length; show them like git does.
export function shortRelease(version: string) {
  return /^[0-9a-f]{12,}$/i.test(version) ? version.slice(0, 7) : version;
}
