export function formatFallbackTitle(date: Date, locale: string = "en"): string {
  const formatter = new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const parts = formatter.formatToParts(date);
  const day = parts.find((part) => part.type === "day")?.value ?? "";
  const monthRaw = parts.find((part) => part.type === "month")?.value ?? "";
  const year = parts.find((part) => part.type === "year")?.value ?? "";
  const month = monthRaw.replace(/\.$/, "");

  return [day, month, year].filter(Boolean).join(" ");
}
