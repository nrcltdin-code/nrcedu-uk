// WhatsApp click-to-chat links (wa.me). They open a chat with the number and a message typed
// in; WhatsApp itself says so if the number has no account. Files cannot be attached this way,
// so messages carry a link to the portal, where the file lives.

// Digits with the country code, or null when the number cannot be used. A number starting
// with a single 0 is a local number: without the country code WhatsApp cannot find it.
export function whatsappNumber(phone: string | null | undefined): string | null {
  if (!phone) return null;
  let value = phone.replace(/[\s().-]/g, "");
  if (value.startsWith("00")) value = `+${value.slice(2)}`;
  if (!value.startsWith("+") && value.startsWith("0")) return null;
  const digits = value.replace(/^\+/, "");
  return /^[1-9]\d{7,14}$/.test(digits) ? digits : null;
}

export const whatsappLink = (number: string, message: string) => `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
