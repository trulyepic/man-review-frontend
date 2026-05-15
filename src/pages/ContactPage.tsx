// src/pages/ContactPage.tsx

import { Helmet } from "react-helmet";
import SocialLinks from "../components/SocialLinks";
import {
  absoluteUrl,
  CONTACT_EMAIL,
  OPERATOR_NAME,
  SITE_NAME,
} from "../config/site";
import { infoPageBodyText, infoPageHeadingText } from "../util/infoPageStyles";

const ContactPage = () => {
  return (
    <div className="max-w-4xl mx-auto py-16 px-4">
      <Helmet>
        <title>Contact | {SITE_NAME}</title>
        <link rel="canonical" href={absoluteUrl("/contact")} />
        <meta
          name="description"
          content={`Contact ${SITE_NAME}, operated by ${OPERATOR_NAME}, for questions, suggestions, and collaboration inquiries.`}
        />
        <meta property="og:title" content={`Contact | ${SITE_NAME}`} />
        <meta
          property="og:description"
          content={`Get in touch with ${SITE_NAME}, operated by ${OPERATOR_NAME}.`}
        />
        <meta property="og:url" content={absoluteUrl("/contact")} />
        <meta property="og:type" content="website" />
      </Helmet>
      <h1 className={`mb-4 text-3xl font-bold ${infoPageHeadingText}`}>
        Contact Us
      </h1>
      <p className={`mb-4 ${infoPageBodyText}`}>
        Toon Ranks is operated by {OPERATOR_NAME}. For questions, suggestions,
        or collaborations, feel free to reach out to us directly:
      </p>
      <p className="text-blue-500 text-lg font-medium">
        <a href={`mailto:${CONTACT_EMAIL}`} className="hover:underline">
          {CONTACT_EMAIL}
        </a>
      </p>
      <p className={`mt-6 ${infoPageBodyText}`}>
        Or follow us on <SocialLinks /> to stay updated!
      </p>
    </div>
  );
};

export default ContactPage;
