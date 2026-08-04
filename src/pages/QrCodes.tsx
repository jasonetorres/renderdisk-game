import { useState } from 'react';
import { Check, Copy, ExternalLink } from 'lucide-react';
import { NORMAL_SPECIES } from '@/data/species';

const DISK_IDS = NORMAL_SPECIES.map((s) => s.diskId).sort();

export function QrCodes() {
  const base = window.location.origin;
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const copyUrl = (url: string, idx: number) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 1800);
    });
  };

  const copyAll = () => {
    const all = DISK_IDS.map((id) => `${base}/disk/${id}`).join('\n');
    navigator.clipboard.writeText(all).then(() => {
      setCopiedIdx(-1);
      setTimeout(() => setCopiedIdx(null), 2000);
    });
  };

  return (
    <div className="min-h-[100dvh] bg-ink-900 text-ink-100 p-5 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="font-pixel text-base text-forest-300 mb-1">RenderDisk QR Code URLs</h1>
        <p className="font-body text-lg text-ink-400 mb-4">
          One URL per disk. Use a QR code generator to encode each one and print it on the matching disk.
        </p>
        <button
          onClick={copyAll}
          className="inline-flex items-center gap-2 px-4 py-3 font-pixel text-xs uppercase tracking-wider bg-forest-700 border-2 border-forest-500 text-ink-100 hover:bg-forest-600 transition-colors"
        >
          {copiedIdx === -1 ? <Check size={14} className="text-forest-300" /> : <Copy size={14} />}
          {copiedIdx === -1 ? 'Copied All!' : 'Copy All 20 URLs'}
        </button>
      </div>

      <div className="space-y-2">
        {DISK_IDS.map((diskId, idx) => {
          const species = NORMAL_SPECIES.find((s) => s.diskId === diskId);
          const url = `${base}/disk/${diskId}`;
          return (
            <div
              key={diskId}
              className="flex items-center gap-3 bg-ink-800 border-2 border-ink-700 px-4 py-3"
            >
              {/* Sprite */}
              {species?.spriteImage ? (
                <img src={species.spriteImage} alt={species.name} className="w-10 h-10 object-contain shrink-0" draggable={false} />
              ) : (
                <span className="text-2xl w-10 text-center shrink-0">{species?.sprite}</span>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-pixel text-xs text-gold-300">{diskId}</p>
                <p className="font-body text-lg text-ink-100 truncate">{species?.name ?? '—'}</p>
                <p className="font-body text-sm text-ink-500 truncate">{url}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => copyUrl(url, idx)}
                  className="p-2 border-2 border-ink-600 hover:border-forest-500 text-ink-400 hover:text-forest-300 transition-colors"
                  title="Copy URL"
                >
                  {copiedIdx === idx ? <Check size={14} className="text-forest-400" /> : <Copy size={14} />}
                </button>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 border-2 border-ink-600 hover:border-ocean-500 text-ink-400 hover:text-ocean-300 transition-colors"
                  title="Open link"
                >
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      <p className="font-body text-sm text-ink-600 mt-6 text-center">
        Base URL: {base}
      </p>
    </div>
  );
}
