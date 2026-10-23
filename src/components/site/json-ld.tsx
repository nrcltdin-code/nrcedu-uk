import { serializeLd } from "@/lib/seo";

// Structured data for search engines. Pass schema.org objects without "@context".
export function JsonLd({ data }: { data: Record<string, unknown>[] }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeLd(data) }} />;
}
