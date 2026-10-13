const dateTime = new Intl.DateTimeFormat('en-ID', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  year: 'numeric'
})

export function formatDateTime(iso: string) {
  return dateTime.format(new Date(iso))
}
