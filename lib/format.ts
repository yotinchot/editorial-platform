export function formatPostDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function formatReadingTime(minutes: number): string {
  return `${minutes} min read`;
}
