// Hosts that images may be loaded from. Used by next.config.ts and by admin form validation,
// so an image URL the site cannot display is rejected when it is entered.
// picsum.photos serves the sample photos (remove before launch); the file storage host comes
// from STORAGE_PUBLIC_URL, so uploaded images are always allowed.
function storageHost() {
  try {
    return process.env.STORAGE_PUBLIC_URL ? new URL(process.env.STORAGE_PUBLIC_URL).hostname : null;
  } catch {
    return null;
  }
}

export const imageHosts = ["picsum.photos", "fastly.picsum.photos", storageHost()].filter((host): host is string => Boolean(host));

// Built-in illustrations shipped with the site (public/banners).
const builtInImage = /^\/banners\/[a-z0-9-]+\.svg$/;

export function isAllowedImageUrl(value: string) {
  if (builtInImage.test(value)) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && imageHosts.includes(url.hostname);
  } catch {
    return false;
  }
}
