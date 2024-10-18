export function timeAgo(date: string) {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;

  // less than a minute
  if (diff < 60) {
    return `${Math.floor(diff)}s`;
  }

  // less than an hour
  if (diff < 60 * 60) {
    return `${Math.floor(diff / 60)}m`;
  }

  // less than a day
  if (diff < 86400) {
    return `${Math.floor(diff / 3600)}h`;
  }

  return `${Math.floor(diff / 86400)}d`;
}
