export type AppMenuItem = {
  href: string;
  label: string;
};

export const APP_MENU_ITEMS: AppMenuItem[] = [
  { href: "/app/search", label: "Search" },
  { href: "/app/documents", label: "Documents" },
  { href: "/app/collections", label: "Collections" },
  { href: "/app/courses", label: "Courses" },
  { href: "/app/review", label: "Daily Review" },
  { href: "/app/graph", label: "Graph" },
  { href: "/app/health", label: "System Health" },
  { href: "/app/productivity", label: "Productivity" },
  { href: "/app/settings", label: "Settings" },
];
