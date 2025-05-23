"use client";
import { usePathname } from "next/navigation";
import { Separator } from "../components/ui/separator";
import { SidebarTrigger } from "../components/ui/sidebar";

export function SiteHeader() {
  const pathname = usePathname();
  let pageTitle = "Documents";

  if (pathname.includes("homepage")) {
    pageTitle = "Homepage";
  } else if (pathname.includes("wallet")) {
    pageTitle = "Wallet";
  } else if (pathname.includes("investments")) {
    pageTitle = "Investments";
  } else if (pathname.includes("projections")) {
    pageTitle = "Projections";
  }

  return (
    <header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-6 bg-white"
        />
        <h1 className="ml-2 text-base font-medium text-white">{pageTitle}</h1>
      </div>
    </header>
  );
}
