import { Icon } from "@/components/ui/icon";
import { InfoTip } from "@/components/ui/info-tip";
import { whatsappLink, whatsappNumber } from "@/lib/whatsapp";

// A direct WhatsApp chat link for a phone number the viewer already sees (e.g. an agent's own
// lead). Staff buttons about student files go through /api/whatsapp instead, which logs the click.
export function WhatsAppLink({ phone, message }: { phone: string; message: string }) {
  const number = whatsappNumber(phone);
  if (!number) return <InfoTip text="Add the country code (e.g. +44…) to chat on WhatsApp." />;
  return (
    <span className="inline-flex items-center">
      <a href={whatsappLink(number, message)} target="_blank" rel="noopener noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#25D366] px-3 text-xs font-semibold text-white hover:bg-[#1ebe5b]">
        <Icon name="chat" className="size-3.5" />
        WhatsApp
      </a>
      <InfoTip text="Opens a WhatsApp chat with this number, with a greeting typed in." align="right" />
    </span>
  );
}
