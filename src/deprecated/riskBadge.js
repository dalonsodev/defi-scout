export function getRiskBadge(risk) {
  const BADGE_MAP = {
    Low: 'badge-success',
    Medium: 'badge-warning',
    High: 'badge-error',
  }
  return BADGE_MAP[risk] || 'badge-neutral'
}
