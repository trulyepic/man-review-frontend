import { Helmet } from "react-helmet";

export function NoIndexSeo({ title }: { title: string }) {
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="robots" content="noindex,follow" />
    </Helmet>
  );
}
