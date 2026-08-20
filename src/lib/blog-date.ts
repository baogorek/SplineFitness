const BLOG_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
})

export function formatBlogDate(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : BLOG_DATE_FORMATTER.format(date)
}
