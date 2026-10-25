import { getSignedInUser } from "@/lib/session";
import { getSiteSettings, messengerHref, whatsappHref } from "@/lib/settings";
import { ChatLauncher, type ChatOption } from "./chat-launcher";

// Floating message button on the public site. It offers WhatsApp and Messenger, and sends
// signed-in people to their own messages page instead of the contact form.
export async function ChatWidget() {
  const [settings, user] = await Promise.all([getSiteSettings(), getSignedInUser()]);
  const options: ChatOption[] = [];

  // Without a separate WhatsApp number, the main phone number is used.
  const whatsapp = settings.contact.whatsapp || settings.contact.phone;
  if (whatsapp) options.push({ kind: "whatsapp", label: "WhatsApp", hint: "Chat with us on WhatsApp", href: whatsappHref(whatsapp) });
  const messenger = messengerHref(settings);
  if (messenger) options.push({ kind: "messenger", label: "Messenger", hint: "Message our Facebook page", href: messenger });

  if (!user) {
    options.push({ kind: "site", label: "Send us a message", hint: "We reply by email", href: "/contact" });
  } else if (user.role === "STUDENT") {
    options.push({ kind: "site", label: "Message your counsellor", hint: "In your dashboard", href: "/dashboard/messages" });
  } else if (user.role === "AGENT") {
    options.push({ kind: "site", label: "Your dashboard", hint: "Students, leads and applications", href: "/dashboard" });
  } else {
    options.push({ kind: "site", label: "Student messages", hint: "Open the inbox", href: "/dashboard/messages" });
  }

  return <ChatLauncher options={options} />;
}
