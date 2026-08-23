/** Pure helpers for account detail panel */

export function relativeTimeFr(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMin = Math.floor((now - then) / 60_000);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 30) return `${diffD}d ago`;
  const diffM = Math.floor(diffD / 30);
  if (diffM < 12) return `${diffM} mo ago`;
  return `${Math.floor(diffM / 12)}y ago`;
}

export function monthsSince(dateStr: string): string {
  const then = new Date(dateStr);
  const now = new Date();
  const months =
    (now.getFullYear() - then.getFullYear()) * 12 +
    (now.getMonth() - then.getMonth());
  if (months < 1) return 'less than a month';
  if (months === 1) return '1 month';
  return `${months} months`;
}
