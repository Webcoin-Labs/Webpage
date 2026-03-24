"use client";

import dynamic from "next/dynamic";

const AppHelpWidget = dynamic(
  () => import("@/components/app/AppHelpWidget").then((mod) => mod.AppHelpWidget),
  { ssr: false },
);

export function AppHelpWidgetClient() {
  return <AppHelpWidget />;
}
