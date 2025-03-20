import { cookies } from "next/headers";

import { AppSidebar } from "../components/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "../components/ui/sidebar";

export default async function Layout({ children }) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <div className="flex min-h-screen min-w-screen">
        <AppSidebar />
        <main className="flex-1">
          <SidebarTrigger />
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
