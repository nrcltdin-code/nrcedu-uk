import { getSiteSettings } from "@/lib/settings";
import { WelcomePopupDialog } from "./welcome-popup-dialog";

// Popup that greets visitors. Its text and on/off switch live in Dashboard → Site settings.
export async function WelcomePopup() {
  const { welcome } = await getSiteSettings();
  if (!welcome.enabled || !welcome.title) return null;
  return <WelcomePopupDialog {...welcome} />;
}
