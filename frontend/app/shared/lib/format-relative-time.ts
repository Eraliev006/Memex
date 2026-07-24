export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24))

  if (days <= 0) return 'сегодня'
  if (days === 1) return 'вчера'
  if (days < 7) return `${days} дн. назад`
  if (days < 30) return `${Math.floor(days / 7)} нед. назад`
  return `${Math.floor(days / 30)} мес. назад`
}
