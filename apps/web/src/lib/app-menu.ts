export type AppMenuItem = {
  href: string;
  label: string;
};

export const APP_MENU_ITEMS: AppMenuItem[] = [
  { href: "/documents", label: "Documents" },
  { href: "/collections", label: "Collections" },
  { href: "/courses", label: "Courses" },
  { href: "/review", label: "Review" },
  { href: "/graph", label: "Graph" },
  { href: "/health", label: "Health" },
  { href: "/productivity", label: "Productivity" },
  { href: "/settings", label: "Settings" },
];
