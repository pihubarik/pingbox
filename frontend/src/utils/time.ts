import { formatDistanceToNow, format } from 'date-fns'

export function timeAgo(date: string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function formatTime(date: string): string {
  return format(new Date(date), 'HH:mm')
}

export function formatDate(date: string): string {
  return format(new Date(date), 'MMM dd, yyyy')
}
