import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";
import { Suspense } from "react";
import { MaintenanceNotice } from "@/components/site/maintenance-notice";
import { ChatWidget } from "@/components/site/chat-widget";
import { PageViewTracker } from "@/components/site/page-view-tracker";

// Public website pages: shared header and footer. The dashboard has its own layout.
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Header />
      <div className="flex flex-1 flex-col">{children}</div>
      <Footer />
      <Suspense>
        <PageViewTracker />
      </Suspense>
      <Suspense>
        <ChatWidget />
      </Suspense>
      {process.env.NODE_ENV === "production" && <MaintenanceNotice />}
    </>
  );
}
