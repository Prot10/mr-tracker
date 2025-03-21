import { cookies } from "next/headers";

import { AppSidebar } from "../components/app-sidebar";
import { SidebarInset, SidebarProvider } from "../components/ui/sidebar";
import { SiteHeader } from "./site-header";

export default async function Layout({ children }) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <main className="bg-neutral-950 text-white">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
