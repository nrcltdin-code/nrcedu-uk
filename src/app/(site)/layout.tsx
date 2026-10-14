import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";

// Public website pages: shared header and footer. The dashboard has its own layout.
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Header />
      <div className="flex flex-1 flex-col">{children}</div>
      <Footer />
    </>
  );
}
