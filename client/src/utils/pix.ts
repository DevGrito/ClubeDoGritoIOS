export const buildPixDeepLink = (payloadEmv: string) =>
  `br.gov.bcb.pix://${encodeURIComponent(payloadEmv)}`;

// Em Android, também podemos usar intent:// para garantir resolução pelo SO:
// NOTE: manter sem package para permitir chooser
export const buildAndroidIntent = (payloadEmv: string) =>
  `intent://pay/#Intent;scheme=br.gov.bcb.pix;S.payload=${encodeURIComponent(payloadEmv)};end;`;