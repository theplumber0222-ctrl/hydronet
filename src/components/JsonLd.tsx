import type { Messages } from "@/i18n/messages/types";
import { getPublicContactEmail, getPublicSiteUrl } from "@/lib/legal-business-info";

type Props = {
  messages: Messages;
};

export function JsonLd({ messages }: Props) {
  const site = getPublicSiteUrl();
  const email = getPublicContactEmail();
  const jd = messages.meta.jsonLd;

  const data = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: jd.name,
    description: jd.description,
    url: site,
    email,
    areaServed: { "@type": "Place", name: "Tennessee" },
    knowsAbout: jd.knowsAbout,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
