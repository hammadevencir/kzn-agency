import React from "react";
import LegalPage from "@/components/sections/website/legal/LegalPage";

export const metadata = {
  title: "User Notice | Kazan Solutions",
  description: "The terms that apply when you create and use a Kazan Solutions account.",
};

// TODO: replace with the client's final legal text.
const sections = [
  {
    heading: "1. Who we are",
    body: [
      "Kazan Solutions is operated by KZ Digital Media Group LLC, 30 N Gould St Ste R, Sheridan, WY 82801-6317, US.",
    ],
  },
  {
    heading: "2. Your account",
    body: [
      "You must provide accurate details when you sign up and keep your login credentials safe. You are responsible for all activity on your account.",
      "We may suspend or close accounts that provide false information, violate advertising platform policies, or misuse our services.",
    ],
  },
  {
    heading: "3. Subscriptions and top-ups",
    body: [
      "Access to agency ad accounts requires an active monthly subscription. Top-up fees depend on your subscription package and are shown before you submit a request.",
      "Top-ups and subscription payments are processed after our team confirms receipt of your transfer. Ad accounts may be paused while a subscription payment is outstanding.",
    ],
  },
  {
    heading: "4. Advertising policies",
    body: [
      "You agree to follow the advertising policies of each platform you advertise on. We may refuse or pause service for content that breaks those policies.",
    ],
  },
  {
    heading: "5. Contact",
    body: [
      "Questions about this notice can be sent through the contact page or via our support channels.",
    ],
  },
];

const UserNoticePage = () => (
  <LegalPage
    title="User Notice"
    updated="September 2026"
    intro="Please read this notice carefully. By creating an account you agree to the terms below."
    sections={sections}
  />
);

export default UserNoticePage;
