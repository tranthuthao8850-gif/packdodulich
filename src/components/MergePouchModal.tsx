import React from 'react';
import { X, Combine, Layers, Luggage, ArrowRight, FolderInput } from 'lucide-react';
import { LuggageBag } from '../types/packing';
import { BAG_COLORS } from '../utils/bagColors';

interface MergePouchModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourcePouch: LuggageBag | null;
  allBags: LuggageBag[];
  sourceItemsCount: number;
  onMerge: (sourceId: string, targetId: string) => void;
  onMovePouch?: (pouchId: string, targetParentLargeBagId: string | null) => void;
}

export const MergePouchModal: React.FC<MergePouchModalProps> = ({
  isOpen,
  onClose,
  sourcePouch,
  allBags,
  sourceItemsCount,
  onMerge,
  onMovePouch
}) => {
  if (!isOpen || !sourcePouch) return null;

  // Filter eligible targets (cannot merge/move into itself)
  const eligibleBags = allBags.filter(b => b.id !== sourcePouch.id);
  const otherPouches = eligibleBags.filter(b => b.isPouch);
  const largeBags = eligibleBags.filter(b => !b.isPouch);

  const parentBag = sourcePouch.parentId 
    ? allBags.find(b => b.id === sourcePouch.parentId) 
    : null;

  const handleMergeIntoPouch = (targetPouchId: string) => {
    onMerge(sourcePouch.id, targetPouchId);
    onClose();
  };

  const handleMoveIntoBag = (targetBagId: string) => {
    if (onMovePouch) {
      onMovePouch(sourcePouch.id, targetBagId);
    }
    onClose();
  };

  const handleUnpackIntoParent = (parentBagId: string) => {
    onMerge(sourcePouch.id, parentBagId);
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
              <FolderInput className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-sm">Xếp / Gộp Pouch</h3>
              <p className="text-xs text-stone-500">
                Xếp cả pouch vào Vali hoặc gộp chung đồ với pouch khác
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
            {sourceItemsCount} món đồ bên trong
          </span>
        </div>

        {/* Target Selection Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* SECTION 1: XẾP CẢ POUCH VÀO TÚI LỚN / VALI (TÚI CHỨA CẢ POUCH, ĐỒ NẰM NGUYÊN TRONG POUCH) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1">
                <Luggage className="w-3.5 h-3.5 text-stone-700" />
                <span>Xếp cả Pouch này vào Túi lớn / Vali</span>
              </span>
              <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                Giữ nguyên đồ trong Pouch
              </span>
            </div>

            {largeBags.length === 0 ? (
              <div className="text-xs text-stone-400 italic py-1.5">
                Chưa có vali lớn nào.
              </div>
            ) : (
              <div className="space-y-1.5">
                {largeBags.map(targetBag => {
                  const bagColor = BAG_COLORS[targetBag.color] || BAG_COLORS.slate;
                  const isCurrentParent = sourcePouch.parentId === targetBag.id;

                  return (
                    <button
                      key={targetBag.id}
                      type="button"
                      disabled={isCurrentParent}
                      onClick={() => handleMoveIntoBag(targetBag.id)}
                      className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between group ${
                        isCurrentParent
                          ? 'border-stone-200 bg-stone-50 opacity-60 cursor-default'
                          : 'border-stone-200 hover:border-amber-400 hover:bg-amber-50/60 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${bagColor.dot}`} />
                        <div>
                          <div className="text-xs font-bold text-stone-900">
                            🧳 {targetBag.name}
                          </div>
                          <div className="text-[10px] text-stone-500">
                            {isCurrentParent
                              ? 'Đang ở trong vali này rồi'
                              : 'Vali sẽ chứa cả pouch, toàn bộ đồ giữ nguyên trong pouch'}
                          </div>
                        </div>
                      </div>
                      {!isCurrentParent && (
                        <span className="text-[11px] text-amber-700 font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                          <span>Xếp vào</span>
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* SECTION 2: GỘP CHUNG VÀO MỘT POUCH KHÁC (MERGE 2 POUCH) */}
          <div className="space-y-2 pt-3 border-t border-stone-100">
            <span className="text-[11px] font-bold text-stone-600 uppercase tracking-wider flex items-center gap-1">
              <Combine className="w-3.5 h-3.5 text-indigo-600" />
              <span>Gộp đồ sang một Pouch khác ({otherPouches.length})</span>
            </span>

            {otherPouches.length === 0 ? (
              <div className="text-xs text-stone-400 italic py-1.5">
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
                      onClick={() => handleMergeIntoPouch(targetPouch.id)}
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
                              (trong {targetParent.name})
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-[11px] text-teal-700 font-semibold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                        <span>Gộp đồ vào</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* OPTIONAL: UNPACK ITEMS TO PARENT BAG IF NESTED */}
          {parentBag && (
            <div className="space-y-1.5 pt-3 border-t border-stone-100">
              <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                Giải nén đồ ra ngoài Vali mẹ
              </span>
              <button
                type="button"
                onClick={() => handleUnpackIntoParent(parentBag.id)}
                className="w-full text-left p-2.5 rounded-xl border border-dashed border-stone-300 hover:bg-stone-50 transition-all flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <div className="text-xs font-medium text-stone-700">
                    Đổ tất cả đồ ra ngoài {parentBag.name}
                  </div>
                  <div className="text-[10px] text-stone-400">
                    Đồ sẽ thành đồ xếp trực tiếp trong vali, và bỏ pouch này
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-stone-50 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
          <span>* Mẹo: Bạn chỉ cần kéo Pouch thả vào Vali là vali sẽ chứa cả pouch!</span>
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
