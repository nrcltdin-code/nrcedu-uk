// Turns a browser's user-agent string into "Chrome on Windows" for the devices list.
// Order matters: Edge and Opera also say "Chrome", and Chrome also says "Safari".
export function describeDevice(userAgent: string | null | undefined) {
  if (!userAgent) return "Unknown device";

  const browser =
    /Edg\//.test(userAgent) ? "Edge"
    : /OPR\/|Opera/.test(userAgent) ? "Opera"
    : /SamsungBrowser/.test(userAgent) ? "Samsung Internet"
    : /Firefox\/|FxiOS/.test(userAgent) ? "Firefox"
    : /Chrome\/|CriOS/.test(userAgent) ? "Chrome"
    : /Safari\//.test(userAgent) ? "Safari"
    : "Browser";

  const os =
    /iPhone/.test(userAgent) ? "iPhone"
    : /iPad/.test(userAgent) ? "iPad"
    : /Android/.test(userAgent) ? "Android"
    : /Windows/.test(userAgent) ? "Windows"
    : /Mac OS X|Macintosh/.test(userAgent) ? "Mac"
    : /CrOS/.test(userAgent) ? "Chromebook"
    : /Linux/.test(userAgent) ? "Linux"
    : null;

  return os ? `${browser} on ${os}` : browser;
}

export function isMobileDevice(userAgent: string | null | undefined) {
  return Boolean(userAgent && /iPhone|iPad|Android|Mobile/.test(userAgent));
}
