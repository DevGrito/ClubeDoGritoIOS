export const isAndroid = () =>
  /android/i.test(navigator.userAgent || "");

export const isIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent || "");

export const isWeb = () =>
  !isAndroid() && !isIOS();

/** iOS Safari fora da Tela de Início não suporta push web de forma confiável. */
export const isStandalonePwa = () =>
  window.matchMedia("(display-mode: standalone)").matches
  || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

export const iosPushNeedsHomeScreen = () => isIOS() && !isStandalonePwa();