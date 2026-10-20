import { Fragment } from "react";

/**
 * Renders one or more JSON-LD blocks.
 *
 * The payload is serialised with `JSON.stringify` and the `<` character is
 * escaped, because a product or business name containing `</script>` would
 * otherwise close the tag early and break the page — a real XSS vector since
 * these strings come from admin-entered data.
 *
 * `@context`/`@type` are passed through untouched so callers can emit either a
 * single schema.org node or an `@graph`.
 */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  const blocks = Array.isArray(data) ? data : [data];
  return (
    <>
      {blocks.map((block, i) => (
        <Fragment key={i}>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(block).replace(/</g, "\\u003c"),
            }}
          />
        </Fragment>
      ))}
    </>
  );
}
