// Single source of truth for all public pricing numbers.
// Change prices / fees here and every card on /pricing updates.
export const PRICING = {
  currency: "€",
  agency: {
    silver: { monthly: 99, topUpFee: 3 },
    gold: { monthly: 199, topUpFee: 2 },
    platinum: { monthly: 699, topUpFee: 0 },
    platinumExclusive: { monthly: 999, topUpFee: 0 },
  },
  supplements: {
    gold: { monthly: 499, topUpFee: 5 },
    diamond: { monthly: 799, topUpFee: 4 },
    platinum: { monthly: 1999, topUpFee: 2 },
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
        id: "silver",
        emoji: "💼",
        name: "Silver",
        ...PRICING.agency.silver,
        tagline: "Solid starter accounts.",
        description:
          "Solid starter accounts at the lowest price in the market. Reliable access, clean algorithm, and perfect for businesses testing or growing steadily.",
      },
      {
        id: "gold",
        emoji: "💎",
        name: "Gold",
        ...PRICING.agency.gold,
        featured: true,
        badge: "Most chosen",
        tagline: "Stronger performance, higher trust scores.",
        description:
          "Step up to stronger performance with higher trust scores. These accounts deliver better results and consistency, ideal for advertisers ready to scale with confidence.",
      },
      {
        id: "platinum",
        emoji: "🏆",
        name: "Platinum",
        ...PRICING.agency.platinum,
        tagline: "For advertisers spending $10K+/month.",
        description:
          "Our premium solution for high-volume advertisers spending $10K+/month. No top-up fees, faster scaling power, and full VIP treatment to maximize growth.",
      },
      {
        id: "platinum-exclusive",
        emoji: "🌟",
        name: "Platinum Exclusive",
        ...PRICING.agency.platinumExclusive,
        tagline: "Dedicated Business Managers for our biggest clients.",
        description:
          "For our biggest clients with the highest priority. Dedicated Business Managers built only for big spenders, offering maximum stability, better stats, and priority support.",
      },
    ],
  },
  {
    id: "supplements",
    label: "Beauty & Supplements",
    title: "Beauty & Supplements Agency Ad Accounts",
    intro:
      "Only Health & Beauty. We don't prefer adult or sexual content — send your creatives first so we can check. Strong internal Business Managers, no setup fee.",
    plans: [
      {
        id: "gold",
        emoji: "🏅",
        name: "Gold",
        ...PRICING.supplements.gold,
        description:
          "Powerful accounts in the META space, designed for advertisers spending $20K+ per month. Exceptional performance with fewer rejections compared to standard accounts, up to 57% lower CPAs.",
      },
      {
        id: "diamond",
        emoji: "🏆",
        name: "Diamond",
        ...PRICING.supplements.diamond,
        featured: true,
        badge: "Most chosen",
        description:
          "Our most powerful accounts with the cleanest algorithm in the META space, built for advertisers spending $60K+ per month. Highest stability with the best performance, lowest rejection rates, and up to 63% lower CPAs.",
      },
      {
        id: "platinum",
        emoji: "⚡",
        name: "Platinum",
        ...PRICING.supplements.platinum,
        description:
          "Built for advertisers spending $100K+ per month. Platinum runs on a separate Business Manager reserved for high-level clients, with 24/7 priority service. Spots are limited; once full, entry may take up to a year.",
      },
    ],
  },
];

export const WHY_WORK_WITH_US = [
  "5-10 minutes top-ups, 24/7 availability.",
  "Ultra-fast replies, 10 minutes response.",
  "No Spend Issues, No Credit line Issues.",
  "Unlimited Spend, No Spending Limits.",
  "Unlimited Ad-Acc Request.",
  "Best Algorithm For Advertisers.",
  "No random Ad-Acc restrictions/bans.",
  "Higher ad approvals, fewer rejections",
  "24/7 technical support with expertise.",
  "Ad-Acc delivery within 24-72 hours.",
  "All time-zones are available to use.",
  "Policy compliance checks.",
  "Expert guidance (8+ years experience)",
  "Direct META representative.",
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
