import React, { useState, useMemo } from 'react';
import { X, FileText, Check, ListPlus, Sparkles } from 'lucide-react';
import { LuggageBag } from '../types/packing';

interface ParsedItem {
  id: string;
  name: string;
  quantity: number;
}

interface ImportItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  allBags: LuggageBag[];
  initialContainerId?: string | null;
  onImportItems: (items: Array<{ name: string; quantity: number }>, containerId: string | null) => void;
}

export function parseListText(rawText: string): ParsedItem[] {
  const lines = rawText.split('\n');
  const results: ParsedItem[] = [];

  lines.forEach((line, index) => {
    let clean = line.trim();
    if (!clean) return;

    // 1. Strip leading list bullets, numbers, or dashes: e.g. "1. ", "1) ", "- ", "* ", "• "
    clean = clean.replace(/^(\d+[\.\)\-:]|\*|-|•)\s*/, '').trim();
    if (!clean) return;

    let name = clean;
    let quantity = 1;

    // Pattern 1: Leading quantity like "3x Áo thun" or "3 Áo thun"
    const leadingQtyMatch = clean.match(/^(\d+)\s*(?:x|X|\*|\:)?\s+([^\d].*)$/);
    if (leadingQtyMatch) {
      const q = parseInt(leadingQtyMatch[1], 10);
      if (!isNaN(q) && q > 0) {
        quantity = q;
        name = leadingQtyMatch[2].trim();
      }
    } else {
      // Pattern 2: Trailing quantity in parentheses like "Áo thun (3)" or "Áo thun (3 cái)"
      const parenMatch = clean.match(/^(.*?)\s*\((\d+)(?:\s*[\p{L}\w]+)?\)\s*$/u);
      if (parenMatch && parenMatch[1].trim()) {
        const q = parseInt(parenMatch[2], 10);
        if (!isNaN(q) && q > 0) {
          quantity = q;
          name = parenMatch[1].trim();
        }
      } else {
        // Pattern 3: Trailing quantity with 'x' or ':' like "Áo thun x3", "Áo thun * 3", "Áo thun: 3"
        const trailingXMatch = clean.match(/^(.*?)\s*(?:x|X|\*|:)\s*(\d+)\s*$/);
        if (trailingXMatch && trailingXMatch[1].trim()) {
          const q = parseInt(trailingXMatch[2], 10);
          if (!isNaN(q) && q > 0) {
            quantity = q;
            name = trailingXMatch[1].trim();
          }
        } else {
          // Pattern 4: Trailing number optionally followed by unit like "Áo thun 3" or "Áo thun 3 cái"
          const trailingNumMatch = clean.match(/^(.*?)\s+(\d+)(?:\s*(?:cái|chiếc|bộ|đôi|hộp|gói|viên|tuýp|chai|lon|cây|cuộn))?\s*$/i);
          if (trailingNumMatch && trailingNumMatch[1].trim()) {
            const q = parseInt(trailingNumMatch[2], 10);
            if (!isNaN(q) && q > 0 && q <= 999) {
              quantity = q;
              name = trailingNumMatch[1].trim();
            }
          }
        }
      }
    }

    if (name) {
      results.push({
        id: `parsed-${index}-${Date.now()}`,
        name,
        quantity: Math.max(1, Math.min(999, quantity))
      });
    }
  });

  return results;
}

export const ImportItemsModal: React.FC<ImportItemsModalProps> = ({
  isOpen,
  onClose,
  allBags,
  initialContainerId = null,
  onImportItems
}) => {
  const [inputText, setInputText] = useState('');
  const [containerId, setContainerId] = useState<string | null>(initialContainerId);
  const [error, setError] = useState('');

  const parsedItems = useMemo(() => parseListText(inputText), [inputText]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedItems.length === 0) {
      setError('Vui lòng dán ít nhất 1 dòng tên đồ vật.');
      return;
    }

    onImportItems(
      parsedItems.map(p => ({ name: p.name, quantity: p.quantity })),
      containerId
    );

    setInputText('');
    setError('');
    onClose();
  };

  const handlePasteExample = () => {
    setInputText(
`Áo thun cotton 4
Quần short dạo phố 2
Váy maxi đi biển
Kem chống nắng SPF50 x1
Bàn chải & kem đánh răng (2 cái)
Sạc dự phòng 20.000mAh
Tai nghe Bluetooth
Thuốc say xe 4
Kính râm chống nắng`
    );
    setError('');
  };

  const largeBags = allBags.filter(b => !b.isPouch);
  const pouches = allBags.filter(b => b.isPouch);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-stone-200 flex flex-col max-h-[90vh]"
        role="dialog"
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between shrink-0 bg-stone-50/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-stone-900 text-amber-400 flex items-center justify-center shrink-0">
              <ListPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">
                Import danh sách đồ đạc
              </h2>
              <p className="text-xs text-stone-500">
                Dán danh sách, mỗi dòng 1 món đồ — hệ thống tự nhận diện số lượng
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200/80 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-2.5 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-stone-700">
                Danh sách đồ đạc (Mỗi dòng là 1 món)
              </label>
              <button
                type="button"
                onClick={handlePasteExample}
                className="text-[11px] font-semibold text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3 text-amber-600" />
                <span>Dán danh sách mẫu</span>
              </button>
            </div>

            <textarea
              rows={7}
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                if (error) setError('');
              }}
              placeholder={`Dán danh sách từ ghi chú hoặc tin nhắn vào đây:
Áo thun 4
Quần short x2
Kem chống nắng
Bàn chải (2 cái)
Sạc dự phòng...`}
              className="w-full px-3.5 py-2.5 text-xs font-mono bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900 leading-relaxed resize-y"
              autoFocus
            />
          </div>

          {/* Target Container Selector */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Thêm các món này vào đâu?
            </label>
            <select
              value={containerId || ''}
              onChange={(e) => setContainerId(e.target.value ? e.target.value : null)}
              className="w-full px-3 py-2 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900"
            >
              <option value="">⏳ Chưa xếp túi (Hàng đợi chờ đóng gói)</option>

              {largeBags.length > 0 && (
                <optgroup label="Túi lớn / Vali:">
                  {largeBags.map((b) => (
                    <option key={b.id} value={b.id}>
                      🧳 {b.name}
                    </option>
                  ))}
                </optgroup>
              )}

              {pouches.length > 0 && (
                <optgroup label="Pouch nhỏ:">
                  {pouches.map((p) => {
                    const parent = allBags.find(b => b.id === p.parentId);
                    return (
                      <option key={p.id} value={p.id}>
                        👝 {p.name} {parent ? `(trong ${parent.name})` : '(ngoài sàn)'}
                      </option>
                    );
                  })}
                </optgroup>
              )}
            </select>
          </div>

          {/* Parsed Preview */}
          {parsedItems.length > 0 && (
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-stone-700">
                <span className="flex items-center gap-1.5 text-emerald-700">
                  <Check className="w-3.5 h-3.5" />
                  <span>Sẽ thêm {parsedItems.length} món đồ:</span>
                </span>
                <span className="text-[11px] text-stone-400 font-normal">
                  Tổng {parsedItems.reduce((acc, it) => acc + it.quantity, 0)} cái/chiếc
                </span>
              </div>

              <div className="max-h-36 overflow-y-auto space-y-1 pr-1 text-xs">
                {parsedItems.map((it, idx) => (
                  <div
                    key={it.id || idx}
                    className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-stone-200/80"
                  >
                    <span className="font-medium text-stone-800 truncate pr-2">
                      {idx + 1}. {it.name}
                    </span>
                    <span className="text-[11px] font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded shrink-0">
                      x{it.quantity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={parsedItems.length === 0}
              className={`px-4 py-2 text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
                parsedItems.length > 0
                  ? 'bg-stone-900 text-white hover:bg-stone-800'
                  : 'bg-stone-200 text-stone-400 cursor-not-allowed'
              }`}
            >
              <ListPlus className="w-3.5 h-3.5" />
              <span>
                Thêm {parsedItems.length > 0 ? `${parsedItems.length} món` : 'vào danh sách'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
