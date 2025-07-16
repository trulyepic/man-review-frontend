// src/pages/ContactPage.tsx

import SocialLinks from "../components/SocialLinks";

const ContactPage = () => {
  return (
    <div className="max-w-4xl mx-auto py-16 px-4">
      <h1 className="text-3xl font-bold mb-4">Contact Us</h1>
      <p className="text-gray-700 mb-4">
        For questions, suggestions, or collaborations, feel free to reach out to
        us directly:
      </p>
      <p className="text-blue-500 text-lg font-medium">
        <a
          href="mailto:trulyepickstudios@gmail.com"
          className="hover:underline"
        >
          trulyepickstudios@gmail.com
        </a>
        <p className="text-gray-700 mt-6">
          Or follow us on <SocialLinks /> to stay updated!
        </p>
      </p>
    </div>
  );
};

export default ContactPage;
