import type { BodyId, TrainerAppearance, TrainerLayerOption } from '@/data/trainer2/types';
import { TRAINER_OPTIONS } from '@/data/trainer2/options';
import { BODY_FRAME, HEAD_FRAME, HEAD_PASTE_OFFSET } from '@/data/trainer2/constants';

type LoadedImage = HTMLImageElement & { __src?: string };
const imageCache = new Map<string, Promise<LoadedImage>>();
const spriteCache = new Map<string, Promise<string>>();

// ── Appearance cache key ──────────────────────────────────────────────────────
function appearanceKey(a: TrainerAppearance) {
  return [
    a.body, a.top, a.bottom, a.shoes, a.head, a.eyes,
    a.faceAcc ?? 'none',
    a.hair, a.headwear ?? 'none', a.hairFront,
    a.skinTone  ?? 'skin-3',
    a.hairColor ?? '#3d1f0e',
    a.topColor  ?? '#1848c0',
    a.bottomColor  ?? '#163068',
    a.bottomColor2 ?? '#0a1040',
    a.version,
  ].join('|');
}

function findOption(id: string): TrainerLayerOption {
  const opt = TRAINER_OPTIONS.find((o) => o.id === id);
  if (!opt) throw new Error(`Unknown trainer option: ${id}`);
  return opt;
}
function findOptionSafe(id: string): TrainerLayerOption | null {
  return TRAINER_OPTIONS.find((o) => o.id === id) ?? null;
}
function bodyBaseId(body: BodyId) {
  return body === 'average' ? 'body-average' : 'body-small';
}
function loadImage(src: string): Promise<LoadedImage> {
  if (!src) return Promise.reject(new Error('Empty image src'));
  const existing = imageCache.get(src);
  if (existing) return existing;
  const p = new Promise<LoadedImage>((resolve, reject) => {
    const img = new Image() as LoadedImage;
    img.__src = src;
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load: ${src}`));
    img.src = src;
  });
  imageCache.set(src, p);
  return p;
}

// ── Frame helpers ─────────────────────────────────────────────────────────────
function frame48() {
  return { x: BODY_FRAME.idle.col * BODY_FRAME.width, y: BODY_FRAME.idle.row * BODY_FRAME.height, width: BODY_FRAME.width, height: BODY_FRAME.height };
}
function frame32() {
  return { x: HEAD_FRAME.southCol * HEAD_FRAME.width, y: 0, width: HEAD_FRAME.width, height: HEAD_FRAME.height };
}
type FR = { x: number; y: number; width: number; height: number };

// ── Color math ────────────────────────────────────────────────────────────────
function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [h * 360, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h /= 360;
  let r: number, g: number, b: number;
  if (s === 0) { r = g = b = l; } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1; if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function paletteDist(pr: number, pg: number, pb: number, r: number, g: number, b: number) {
  return Math.abs(r - pr) + Math.abs(g - pg) + Math.abs(b - pb);
}

/**
 * Build a target color ramp from a sorted list of source palette entries.
 * The source palette is sorted dark→light, and we produce a target ramp
 * that spans from [tl*0.35 .. min(0.95, tl+0.28)] using the target's H/S.
 */
function buildRamp(
  sortedSource: readonly [number, number, number][],
  targetHex: string,
): Map<string, [number, number, number]> {
  const [th, ts, tl] = hexToHsl(targetHex);
  const n = sortedSource.length;
  const tMin = Math.max(0.04, tl * 0.35);
  const tMax = Math.min(0.95, tl + 0.28);

  const map = new Map<string, [number, number, number]>();
  sortedSource.forEach(([r, g, b], i) => {
    const t = n === 1 ? 0.5 : i / (n - 1);
    const newL = tMin + t * (tMax - tMin);
    map.set(`${r},${g},${b}`, hslToRgb(th, ts, newL));
  });
  return map;
}

function applyPaletteSwap(
  canvas: HTMLCanvasElement,
  rampMap: Map<string, [number, number, number]>,
  tolerance = 12,
): void {
  const ctx = canvas.getContext('2d')!;
  const id = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = id.data;

  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 10) continue;
    const r = d[i], g = d[i + 1], b = d[i + 2];
    let bestKey: string | null = null, bestDist = tolerance;
    for (const key of rampMap.keys()) {
      const [pr, pg, pb] = key.split(',').map(Number) as [number, number, number];
      const dist = paletteDist(pr, pg, pb, r, g, b);
      if (dist < bestDist) { bestDist = dist; bestKey = key; }
    }
    if (bestKey) {
      const [nr, ng, nb] = rampMap.get(bestKey)!;
      d[i] = nr; d[i + 1] = ng; d[i + 2] = nb;
    }
  }
  ctx.putImageData(id, 0, 0);
}

// ── Hair palette: blue-purple placeholder ramp (dark → light) ────────────────
// Confirmed by pixel inspection of actual hair PNG files
const HAIR_SOURCE = [
  [48, 48, 112],   // dark shadow  L≈0.31
  [72, 72, 200],   // mid-dark     L≈0.53
  [128, 128, 240], // mid-light    L≈0.72
  [176, 176, 248], // highlight    L≈0.83
] as const;

function applyHairRecolor(canvas: HTMLCanvasElement, hex: string): void {
  const map = buildRamp(HAIR_SOURCE, hex);
  applyPaletteSwap(canvas, map);
}

// ── Shirt/clothing palette: red placeholder ramp (dark → light) ──────────────
// Confirmed by pixel inspection: all garments share this red placeholder
const SHIRT_SOURCE = [
  [200, 72, 72],   // dark (main shadow)
  [200, 136, 72],  // dark accent (trim/belt)
  [240, 128, 128], // medium
  [240, 184, 128], // light (highlight)
] as const;

function applyShirtRecolor(canvas: HTMLCanvasElement, hex: string): void {
  const map = buildRamp(SHIRT_SOURCE, hex);
  applyPaletteSwap(canvas, map);
}

// ── Two-tone pants: dark pixels → color2, light pixels → color1 ──────────────
const PANTS_DARK_SOURCE  = [[200, 72, 72], [200, 136, 72]] as const;
const PANTS_LIGHT_SOURCE = [[240, 128, 128], [240, 184, 128]] as const;

function applyPantsRecolor(canvas: HTMLCanvasElement, color1: string, color2: string): void {
  const darkMap  = buildRamp(PANTS_DARK_SOURCE,  color2);
  const lightMap = buildRamp(PANTS_LIGHT_SOURCE, color1);
  // Merge both into one pass
  const combined = new Map([...darkMap, ...lightMap]);
  applyPaletteSwap(canvas, combined);
}

// ── Skin tone recoloring ──────────────────────────────────────────────────────
// Head sprites use green placeholder ramp for skin areas
const SKIN_HEX_MAP: Record<string, [number, number, number][]> = {
  'skin-1': [[248, 216, 184], [216, 168, 128], [176, 124,  88]],
  'skin-2': [[248, 224, 192], [220, 180, 140], [180, 136,  96]],
  'skin-3': [[200, 144,  96], [160, 104,  64], [120,  72,  40]],
  'skin-4': [[168, 128,  80], [136,  96,  56], [100,  64,  32]],
  'skin-5': [[152, 104,  96], [120,  72,  64], [ 88,  48,  40]],
  'skin-6': [[152, 104,  64], [120,  72,  40], [ 88,  48,  24]],
  'skin-7': [[ 88,  64,  46], [ 64,  40,  28], [ 44,  24,  14]],
};

// Confirmed green ramp from head/oval.png pixel inspection
const GREEN_RAMP: [number, number, number][] = [
  [184, 248, 184], // light green → light skin
  [112, 216, 112], // medium green → mid skin
  [ 54,  64,  48], // dark green → dark skin
];

function applySkinRecolor(canvas: HTMLCanvasElement, skinToneId: string): void {
  const targets = SKIN_HEX_MAP[skinToneId] ?? SKIN_HEX_MAP['skin-3'];
  const ctx = canvas.getContext('2d')!;
  const id = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = id.data;
  const TOL = 18;

  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 10) continue;
    const r = d[i], g = d[i + 1], b = d[i + 2];
    for (let k = 0; k < GREEN_RAMP.length; k++) {
      if (paletteDist(GREEN_RAMP[k][0], GREEN_RAMP[k][1], GREEN_RAMP[k][2], r, g, b) < TOL) {
        const [tr, tg, tb] = targets[k];
        d[i] = tr; d[i + 1] = tg; d[i + 2] = tb;
        break;
      }
    }
  }
  ctx.putImageData(id, 0, 0);
}

// ── Hat mask (destination-out erase) ─────────────────────────────────────────
async function buildMaskedLayer(
  img: HTMLImageElement,
  maskImg: HTMLImageElement,
  frame: FR,
): Promise<HTMLCanvasElement> {
  const { width: W, height: H } = frame;
  const tmp = document.createElement('canvas');
  tmp.width = W; tmp.height = H;
  const tctx = tmp.getContext('2d')!;
  tctx.imageSmoothingEnabled = false;
  tctx.drawImage(img, frame.x, frame.y, W, H, 0, 0, W, H);
  tctx.globalCompositeOperation = 'destination-out';
  tctx.drawImage(maskImg, frame.x, frame.y, W, H, 0, 0, W, H);
  tctx.globalCompositeOperation = 'source-over';
  return tmp;
}

function slugFrom(id: string, prefix: string): string {
  return id.startsWith(prefix) ? id.slice(prefix.length) : id;
}

// ── Main compose ──────────────────────────────────────────────────────────────
export async function composeTrainerSprite(appearance: TrainerAppearance): Promise<string> {
  const key = appearanceKey(appearance);
  const cached = spriteCache.get(key);
  if (cached) return cached;

  const p = (async () => {
    // NOTE: if this rejects, we remove it from the cache so the next call retries.
    const f48 = frame48();
    const f32 = frame32();
    const off = HEAD_PASTE_OFFSET[appearance.body];
    const W = HEAD_FRAME.width, H = HEAD_FRAME.height;
    const hairHex = appearance.hairColor ?? '#3d1f0e';
    const skinId  = appearance.skinTone  ?? 'skin-3';
    const topHex  = appearance.topColor  ?? '#1848c0';
    const botHex1 = appearance.bottomColor  ?? '#163068';
    const botHex2 = appearance.bottomColor2 ?? '#0a1040';

    const BW = BODY_FRAME.width, BH = BODY_FRAME.height;

    // ── 48×48 body canvas ──────────────────────────────────────────────────
    const canvas = document.createElement('canvas');
    canvas.width = BW; canvas.height = BH;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, BW, BH);

    const hatSlug = appearance.headwear ? slugFrom(appearance.headwear, 'headwear-') : null;
    const hairSlug = slugFrom(appearance.hair, 'hair-');

    // Helper: draw layer to isolated canvas with palette recolor, then blit
    async function blitRecolored(
      src: string, frame: FR, dx: number, dy: number,
      recolor: ((c: HTMLCanvasElement) => void) | null,
      targetCtx: CanvasRenderingContext2D,
    ) {
      const img = await loadImage(src).catch(() => null);
      if (!img) return;
      const tmp = document.createElement('canvas');
      tmp.width = frame.width; tmp.height = frame.height;
      const tctx = tmp.getContext('2d')!;
      tctx.imageSmoothingEnabled = false;
      tctx.drawImage(img, frame.x, frame.y, frame.width, frame.height, 0, 0, frame.width, frame.height);
      if (recolor) recolor(tmp);
      targetCtx.drawImage(tmp, dx, dy);
    }

    // 1. Hair-back (behind body, optionally masked by hat-back-mask)
    const hairBackOpt = findOptionSafe(`hair-back-${hairSlug}`);
    if (hairBackOpt?.image) {
      if (hatSlug) {
        const backMaskOpt = findOptionSafe(`hat-back-mask-${hatSlug}`);
        if (backMaskOpt?.image) {
          const [hbImg, maskImg] = await Promise.all([
            loadImage(hairBackOpt.image).catch(() => null),
            loadImage(backMaskOpt.image).catch(() => null),
          ]);
          if (hbImg && maskImg) {
            const masked = await buildMaskedLayer(hbImg, maskImg, f32);
            applyHairRecolor(masked, hairHex);
            ctx.drawImage(masked, off.x, off.y);
          } else if (hbImg) {
            await blitRecolored(hairBackOpt.image, f32, off.x, off.y, (c) => applyHairRecolor(c, hairHex), ctx);
          }
        } else {
          await blitRecolored(hairBackOpt.image, f32, off.x, off.y, (c) => applyHairRecolor(c, hairHex), ctx);
        }
      } else {
        await blitRecolored(hairBackOpt.image, f32, off.x, off.y, (c) => applyHairRecolor(c, hairHex), ctx);
      }
    }

    // 2. Hat-back (behind body)
    if (hatSlug) {
      const hatBackOpt = findOptionSafe(`hat-back-${hatSlug}`);
      if (hatBackOpt?.image) {
        await blitRecolored(hatBackOpt.image, f32, off.x, off.y, null, ctx);
      }
    }

    // 3. Body base + skin recolor
    const bodyOpt = findOption(bodyBaseId(appearance.body));
    const bodyTmp = document.createElement('canvas');
    bodyTmp.width = BW; bodyTmp.height = BH;
    const btctx = bodyTmp.getContext('2d')!;
    btctx.imageSmoothingEnabled = false;
    const bodyImg = await loadImage(bodyOpt.image);
    btctx.drawImage(bodyImg, f48.x, f48.y, f48.width, f48.height, 0, 0, BW, BH);
    applySkinRecolor(bodyTmp, skinId);
    ctx.drawImage(bodyTmp, 0, 0);

    // 4. Top (shirt) recolored
    const topOpt = findOption(appearance.top);
    await blitRecolored(topOpt.image, f48, 0, 0, (c) => applyShirtRecolor(c, topHex), ctx);

    // 5. Bottom (pants) two-tone recolored
    const bottomOpt = findOption(appearance.bottom);
    await blitRecolored(bottomOpt.image, f48, 0, 0, (c) => applyPantsRecolor(c, botHex1, botHex2), ctx);

    // 6. Shoes (no recolor — keep as-is)
    const shoesOpt = findOption(appearance.shoes);
    await blitRecolored(shoesOpt.image, f48, 0, 0, null, ctx);

    // ── 32×32 head sub-composite ───────────────────────────────────────────
    const headCanvas = document.createElement('canvas');
    headCanvas.width = W; headCanvas.height = H;
    const hctx = headCanvas.getContext('2d')!;
    hctx.imageSmoothingEnabled = false;
    hctx.clearRect(0, 0, W, H);

    // 7. Head shape + skin recolor (always first on head canvas)
    const headTmp = document.createElement('canvas');
    headTmp.width = W; headTmp.height = H;
    const htctx = headTmp.getContext('2d')!;
    htctx.imageSmoothingEnabled = false;
    const headImg = await loadImage(findOption(appearance.head).image);
    htctx.drawImage(headImg, f32.x, f32.y, W, H, 0, 0, W, H);
    applySkinRecolor(headTmp, skinId);
    hctx.drawImage(headTmp, 0, 0);

    // 8. Eyes
    const eyesImg = await loadImage(findOption(appearance.eyes).image);
    hctx.drawImage(eyesImg, f32.x, f32.y, W, H, 0, 0, W, H);

    // 9. Face accessory (ON TOP of face/eyes — glasses, beard, mustache, etc.)
    if (appearance.faceAcc && appearance.faceAcc !== 'face-acc-none') {
      const faceAccOpt = findOptionSafe(appearance.faceAcc);
      if (faceAccOpt?.image) {
        const faceAccImg = await loadImage(faceAccOpt.image).catch(() => null);
        if (faceAccImg) {
          hctx.drawImage(faceAccImg, f32.x, f32.y, W, H, 0, 0, W, H);
        }
      }
    }

    // 10. Hair (optionally masked under hat) + recolor
    const hairOpt = findOption(appearance.hair);
    if (hatSlug) {
      const maskOpt = findOptionSafe(`hat-mask-${hatSlug}`);
      if (maskOpt?.image) {
        const [hairImg, maskImg] = await Promise.all([
          loadImage(hairOpt.image).catch(() => null),
          loadImage(maskOpt.image).catch(() => null),
        ]);
        if (hairImg && maskImg) {
          const masked = await buildMaskedLayer(hairImg, maskImg, f32);
          applyHairRecolor(masked, hairHex);
          hctx.drawImage(masked, 0, 0);
        } else if (hairImg) {
          await blitRecolored(hairOpt.image, f32, 0, 0, (c) => applyHairRecolor(c, hairHex), hctx);
        }
      } else {
        await blitRecolored(hairOpt.image, f32, 0, 0, (c) => applyHairRecolor(c, hairHex), hctx);
      }
    } else {
      await blitRecolored(hairOpt.image, f32, 0, 0, (c) => applyHairRecolor(c, hairHex), hctx);
    }

    // 11. Headwear (on top of hair)
    if (appearance.headwear && hatSlug) {
      const hatOpt = findOptionSafe(appearance.headwear);
      if (hatOpt?.image) {
        await blitRecolored(hatOpt.image, f32, 0, 0, null, hctx);
      }
    }

    // 12. Hair-front (optionally masked, drawn LAST on head canvas) + recolor
    const hairFrontOpt = findOptionSafe(appearance.hairFront);
    if (hairFrontOpt?.image) {
      if (hatSlug) {
        const maskOpt = findOptionSafe(`hat-mask-${hatSlug}`);
        if (maskOpt?.image) {
          const [hfImg, maskImg] = await Promise.all([
            loadImage(hairFrontOpt.image).catch(() => null),
            loadImage(maskOpt.image).catch(() => null),
          ]);
          if (hfImg && maskImg) {
            const masked = await buildMaskedLayer(hfImg, maskImg, f32);
            applyHairRecolor(masked, hairHex);
            hctx.drawImage(masked, 0, 0);
          } else if (hfImg) {
            await blitRecolored(hairFrontOpt.image, f32, 0, 0, (c) => applyHairRecolor(c, hairHex), hctx);
          }
        } else {
          await blitRecolored(hairFrontOpt.image, f32, 0, 0, (c) => applyHairRecolor(c, hairHex), hctx);
        }
      } else {
        await blitRecolored(hairFrontOpt.image, f32, 0, 0, (c) => applyHairRecolor(c, hairHex), hctx);
      }
    }

    // ── Paste head sub-canvas onto body canvas ─────────────────────────────
    ctx.drawImage(headCanvas, off.x, off.y);

    return canvas.toDataURL('image/png');
  })();

  // If composition fails, evict from cache so next render retries.
  p.catch(() => {
    if (spriteCache.get(key) === p) spriteCache.delete(key);
    console.error('[TrainerSprite] compose failed for key:', key);
  });

  spriteCache.set(key, p);
  return p;
}

export function clearSpriteCache(): void {
  spriteCache.clear();
}
