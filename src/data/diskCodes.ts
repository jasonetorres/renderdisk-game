/**
 * Unique QR code tokens for each physical floppy disk.
 * Each token maps to a specific disk ID — non-guessable so
 * players must physically find the disk to scan it.
 *
 * DO NOT change these after the QR codes are printed.
 */
export const DISK_CODE_MAP: Record<string, string> = {
  "68MNXZG6": "RD-01",  // Terrabo
  "V85DJ4NE": "RD-02",  // Voltix
  "TH2FQJH7": "RD-03",  // Aurora
  "QBRTF23D": "RD-04",  // Tidalfin
  "B7Z2CVFF": "RD-05",  // Pyrax
  "FFSTFU7R": "RD-06",  // Leafquill
  "NYQNYH45": "RD-07",  // Rocknel
  "N79SX86E": "RD-08",  // Buzzle
  "NJXLUWG8": "RD-09",  // Cloudash
  "92VS963T": "RD-10",  // Whirli
  "PRR4ZTYG": "RD-11",  // Droplin
  "FU7HK9TS": "RD-12",  // Solbud
  "955XGJ67": "RD-13",  // Honee
  "FXUUWQG9": "RD-14",  // Crystab
  "HC7XQSY6": "RD-15",  // Bouncer
  "DCBFT2EV": "RD-16",  // Nibblit
  "UNB4KD22": "RD-17",  // Mosswal
  "S8NBL26P": "RD-18",  // Gloomper
  "HUGDQ5CN": "RD-19",  // Pingo
  "5UP8PZ3B": "RD-20",  // Tadpol
};

/** Resolve a raw scanned code to a canonical RD-XX disk ID. */
export function resolveDiskCode(raw: string): string | null {
  const upper = raw.toUpperCase().trim();

  // Unique QR token first
  if (DISK_CODE_MAP[upper]) return DISK_CODE_MAP[upper];

  // Fallback: accept legacy RD-01 / RD01 / rd-01 format
  const match = upper.match(/^RD-?(\d+)$/);
  if (match) return `RD-${match[1].padStart(2, '0')}`;

  return null;
}
