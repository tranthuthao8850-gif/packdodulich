import React from 'react';
import { X, Combine, Layers, Luggage, ArrowRight } from 'lucide-react';
import { LuggageBag } from '../types/packing';
import { BAG_COLORS } from '../utils/bagColors';

interface MergePouchModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourcePouch: LuggageBag | null;
  allBags: LuggageBag[];
  sourceItemsCount: number;
  onMerge: (sourceId: string, targetId: string) => void;
}

export const MergePouchModal: React.FC<MergePouchModalProps> = ({
  isOpen,
  onClose,
  sourcePouch,
  allBags,
  sourceItemsCount,
  onMerge
}) => {
  if (!isOpen || !sourcePouch) return null;

  // Filter eligible targets (cannot merge into itself)
  const eligibleBags = allBags.filter(b => b.id !== sourcePouch.id);
  const otherPouches = eligibleBags.filter(b => b.isPouch);
  const largeBags = eligibleBags.filter(b => !b.isPouch);

  const parentBag = sourcePouch.parentId 
    ? allBags.find(b => b.id === sourcePouch.parentId) 
    : null;

  const handleSelectTarget = (targetId: string) => {
    onMerge(sourcePouch.id, targetId);
    onClose();
  };

  const sourceColor = BAG_COLORS[sourcePouch.color] || BAG_COLORS.teal;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-md overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Combine className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-sm">Gộp Pouch</h3>
              <p className="text-xs text-stone-500">
                Hợp nhất toàn bộ đồ đạc sang một túi/pouch khác
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Source Pouch Info */}
        <div className="px-5 py-3 bg-indigo-50/50 border-b border-indigo-100/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${sourceColor.dot}`} />
            <span className="font-bold text-stone-900">👝 {sourcePouch.name}</span>
          </div>
          <span className="font-medium text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded-full">
            {sourceItemsCount} món đồ sẽ được chuyển đi
          </span>
        </div>

        {/* Target Selection Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Quick Option: If nested, option to merge into parent bag directly */}
          {parentBag && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                Gộp trực tiếp vào Túi mẹ chứa pouch này
              </span>
              <button
                type="button"
                onClick={() => handleSelectTarget(parentBag.id)}
                className="w-full text-left p-3 rounded-xl border-2 border-amber-300 bg-amber-50/70 hover:bg-amber-100/80 transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Luggage className="w-4 h-4 text-amber-700" />
                  <div>
                    <div className="text-xs font-bold text-stone-900">
                      Gộp vào {parentBag.name}
                    </div>
                    <div className="text-[11px] text-stone-500">
                      Chuyển đồ trực tiếp vào vali, giải nén pouch này
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-amber-700 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          )}

          {/* Other Pouches to Merge with */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-teal-600" />
              <span>Gộp vào một Pouch khác ({otherPouches.length})</span>
            </span>

            {otherPouches.length === 0 ? (
              <div className="text-xs text-stone-400 italic py-2">
                Không có pouch nào khác để gộp cùng.
              </div>
            ) : (
              <div className="space-y-1.5">
                {otherPouches.map(targetPouch => {
                  const targetColor = BAG_COLORS[targetPouch.color] || BAG_COLORS.teal;
                  const targetParent = targetPouch.parentId 
                    ? allBags.find(b => b.id === targetPouch.parentId)
                    : null;

                  return (
                    <button
                      key={targetPouch.id}
                      type="button"
                      onClick={() => handleSelectTarget(targetPouch.id)}
                      className="w-full text-left p-2.5 rounded-xl border border-stone-200 hover:border-teal-400 hover:bg-teal-50/50 transition-all flex items-center justify-between group cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${targetColor.dot}`} />
                        <div>
                          <span className="text-xs font-semibold text-stone-900">
                            👝 {targetPouch.name}
                          </span>
                          {targetParent && (
                            <span className="text-[10px] text-stone-400 ml-1.5">
                              (ở trong {targetParent.name})
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-[11px] text-teal-700 font-semibold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                        <span>Gộp vào</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Large Bags */}
          <div className="space-y-2 pt-2 border-t border-stone-100">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1">
              <Luggage className="w-3.5 h-3.5 text-stone-600" />
              <span>Hoặc gộp trực tiếp vào Túi lớn / Vali ({largeBags.length})</span>
            </span>

            <div className="space-y-1.5">
              {largeBags.map(targetBag => {
                const bagColor = BAG_COLORS[targetBag.color] || BAG_COLORS.slate;
                return (
                  <button
                    key={targetBag.id}
                    type="button"
                    onClick={() => handleSelectTarget(targetBag.id)}
                    className="w-full text-left p-2.5 rounded-xl border border-stone-200 hover:border-stone-400 hover:bg-stone-50 transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${bagColor.dot}`} />
                      <span className="text-xs font-semibold text-stone-900">
                        🧳 {targetBag.name}
                      </span>
                    </div>
                    <span className="text-[11px] text-stone-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                      <span>Gộp vào</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-stone-50 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
          <span>* Mẹo: Bạn cũng có thể kéo trực tiếp Pouch thả đè lên Pouch khác để gộp.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 text-xs font-semibold text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-100 cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
