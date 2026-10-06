// Single source of truth for all public pricing numbers.
// Change prices / fees here and every card on /pricing updates.
export const PRICING = {
  currency: "€",
  agency: {
    start: { monthly: 199, topUpFee: 2.8 },

    scale: { monthly: 599, topUpFee: 2.2 },
    elite: { monthly: 899, topUpFee: 1.8 },
  },
  supplements: {
    essential: { monthly: 399, topUpFee: 4 },
    advanced: { monthly: 699, topUpFee: 2.8 },
    ultimate: { monthly: 1499, topUpFee: 1.8 },
  },
};

export const SIGNUP_HREF = "/user/signup";

export const PRICING_TRACKS = [
  {
    id: "agency",
    label: "Agency Ad Accounts",
    title: "Agency Ad Accounts",
    intro:
      "Choose the plan that fits where you are today. High-quality Agency Ad Accounts for every stage of your growth.",
    plans: [
      {
        id: "start",
        emoji: "🔥",
        name: "KAZAN Start",
        ...PRICING.agency.start,
        tagline: "Starting out or still testing? Start here.",
        description:
          "Perfect if you're starting out, testing new products, or building consistency. Get access to our high-quality Agency Ad Accounts without committing to a high monthly fee.",
      },
      {
        id: "scale",
        emoji: "🚀",
        name: "KAZAN Scale",
        ...PRICING.agency.scale,
        featured: true,
        badge: "Most chosen",
        tagline: "Ideal for scaling businesses!",
        description:
          "Built for advertisers who are already spending consistently and want better cost efficiency as they grow. You get a lower top-up fee while having our team right beside you.",
      },
      {
        id: "elite",
        emoji: "⚡",
        name: "KAZAN Elite",
        ...PRICING.agency.elite,
        tagline: "For serious advertisers managing high volume.",
        description:
          "Built for high-spending advertisers where every percentage counts. Get our lowest top-up fee, maximum priority from our team, and the most stable agency ad-accounts to keep your volume running without interruptions.",
      },
    ],
  },
  {
    id: "supplements",
    label: "Supplements Ad Accounts",
    title: "Supplements Agency Ad Accounts",
    intro:
      "Choose the package that fits your advertising needs. Whether you're entering the supplement market, ready to scale, or already managing serious volume, KAZAN provides specialized Agency Ad-Accounts built for supplement advertisers.",
    plans: [
      {
        id: "essential",
        emoji: "🔥",
        name: "Essential",
        ...PRICING.supplements.essential,
        description:
          "Starting or expanding your supplement brand? Our Essential package gives you access to our specialized Supplement Agency Ad-Accounts with a manageable monthly commitment. Test your campaigns, find what works, and scale when you're ready!",
      },
      {
        id: "advanced",
        emoji: "🚀",
        name: "Advanced",
        ...PRICING.supplements.advanced,
        description:
          "Your campaigns are performing. Now it's time to scale! Advanced is built for supplement advertisers who are ready to increase their spend and want better cost efficiency while growing. You get a lower top-up fee with our team right beside you whenever you need support.",
      },
      {
        id: "ultimate",
        emoji: "⚡",
        name: "Ultimate",
        ...PRICING.supplements.ultimate,
        description:
          "For serious supplement advertisers where performance, stability, and every percentage matters. Ultimate is our highest-level package, built for high-spending advertisers managing serious volume. Get our lowest top-up fee, maximum priority from our team and the most qualitative agency ad-accounts built to support your growth within your space.",
      },
    ],
  },
];

export const WHY_WORK_WITH_US = [
  "The best ad-accounts for Supplement stores.",
  "Free ad-account replacements.",
  "1 to 7 minutes top-ups, 24/7 availability.",
  "Unlimited Ad-Acc Request.",
  "Ultra-fast replies 10 minutes response.",
  "Highest ad approval rates, less rejections",
  "24/7 technical support with expertise.",
  "No Spend Issues, No Credit line Issues.",
  "Unlimited Spend, No Spending Limits.",
  "Best Algorithm For Nutraceutical Advertisers.",
  "No random Ad-Acc restrictions/bans.",
  "Ad-Acc delivery within 36 hours.",
  "All time-zones are available to use.",
  "Policy compliance checks.",
  "Expert guidance (8+ years experience)",
  "Direct META representative.",
  "Cancel monthly.",
];

export const CURRENT_AD_SPEND_OPTIONS = [
  "$500K-1M",
  "2M",
  "5M",
  "10M",
  "$10M+",
];

export const formatPrice = (amount) =>
  `${PRICING.currency}${Number(amount).toLocaleString("en-US")}`;

export const formatFee = (fee) => `${fee}%`;
