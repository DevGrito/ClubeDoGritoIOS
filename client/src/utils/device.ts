export const isAndroid = () =>
  /android/i.test(navigator.userAgent || "");

export const isIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent || "");

export const isWeb = () =>
  !isAndroid() && !isIOS();