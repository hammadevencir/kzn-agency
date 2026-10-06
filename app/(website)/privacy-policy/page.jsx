import React from "react";
import LegalPage from "@/components/sections/website/legal/LegalPage";

export const metadata = {
  title: "Privacy Policy | Kazan Solutions",
  description: "How Kazan Solutions collects, uses and protects your personal data.",
};

// TODO: replace with the client's final legal text.
const sections = [
  {
    heading: "1. Data we collect",
    body: [
      "Account details you provide (name, email, phone number), billing and payment references, ad account and top-up information, and messages you send to our team.",
    ],
  },
  {
    heading: "2. How we use it",
    body: [
      "To create and manage your account, process subscriptions and top-ups, provide support, prevent fraud, and send you service notifications.",
    ],
  },
  {
    heading: "3. Sharing",
    body: [
      "We do not sell your data. We share it only with service providers needed to run the platform (hosting, authentication, payments) and where required by law.",
    ],
  },
  {
    heading: "4. Retention and security",
    body: [
      "We keep your data for as long as your account is active and as required for legal and accounting purposes, and protect it with industry-standard security measures.",
    ],
  },
  {
    heading: "5. Your rights",
    body: [
      "You can ask us to access, correct or delete your personal data by contacting our team through the contact page.",
    ],
  },
];

const PrivacyPolicyPage = () => (
  <LegalPage
    title="Privacy Policy"
    updated="September 2026"
    intro="This policy explains what personal data Kazan Solutions collects and how we use it."
    sections={sections}
  />
);

export default PrivacyPolicyPage;
