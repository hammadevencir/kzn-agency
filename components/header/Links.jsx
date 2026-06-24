export const links = (pathname) => [
  {
    label: "Home",
    href: "/",
    active: pathname === "/",
  },
  {
    label: "Solutions",
    href: "/solutions",
    active: pathname === "/solutions",
  },
  {
    label: "Platforms",
    href: "/platforms",
    active: pathname === "/platforms",
  },
  {
    label: "Contact",
    href: "/contact",
    active: pathname === "/contact",
  },
  {
    label: "Affiliates",
    href: "/affiliates",
    active: pathname === "/affiliates",
  },
  // {
  //   label: "B2B",
  //   href: "/b2b",
  //   active: pathname === "/b2b",
  // },
];
