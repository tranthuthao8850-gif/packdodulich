import React, { useState, useEffect, useRef } from 'react';
import { Edit2, Check, X } from 'lucide-react';
import { LuggageBag, LuggageItem } from '../types/packing';
import { BAG_COLORS } from '../utils/bagColors';
import { ItemCard } from './ItemCard';

interface PouchCardProps {
  pouch: LuggageBag;
  items: LuggageItem[];
  allBags: LuggageBag[];
  isNested: boolean;
  onMoveItem: (itemId: string, targetContainerId: string | null) => void;
  onTogglePacked: (itemId: string) => void;
  onDeleteItem: (itemId: string) => void;
  onMovePouch: (pouchId: string, targetParentLargeBagId: string | null) => void;
  onDeletePouch?: (pouchId: string) => void;
  onUpdatePouchName: (pouchId: string, newName: string) => void;
  onUpdateQuantity?: (itemId: string, quantity: number) => void;
  onUpdateBagWidth?: (bagId: string, width: number) => void;
  onUpdateItemName?: (itemId: string, name: string) => void;
  onConvertToBag?: (pouchId: string) => void;
  onQuickAddItem?: (name: string, quantity: number, containerId: string) => void;
}

export const PouchCard: React.FC<PouchCardProps> = ({
  pouch,
  items,
  allBags,
  isNested,
  onMoveItem,
  onTogglePacked,
  onDeleteItem,
  onMovePouch,
  onUpdatePouchName,
  onUpdateQuantity,
  onUpdateBagWidth,
  onUpdateItemName,
  onConvertToBag
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(pouch.name);

  // Width resizing for standalone pouches
  const [width, setWidth] = useState<number>(pouch.customWidth || 320);
  const [isResizing, setIsResizing] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (pouch.customWidth) {
      setWidth(pouch.customWidth);
    }
  }, [pouch.customWidth]);

  const colorStyle = BAG_COLORS[pouch.color] || BAG_COLORS.teal;

  // Drag handlers for the POUCH ITSELF
  const handlePouchDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'pouch', id: pouch.id, name: pouch.name }));
    e.dataTransfer.setData('text/plain', pouch.id);
  };

  // Drag over handlers for dropping ITEMS into this Pouch
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    try {
      const raw = e.dataTransfer.getData('application/json');
      if (raw) {
        const data = JSON.parse(raw);
        if (data.type === 'item') {
          onMoveItem(data.id, pouch.id);
          return;
        }
      }
    } catch {
      const itemId = e.dataTransfer.getData('text/plain');
      if (itemId) {
        onMoveItem(itemId, pouch.id);
      }
    }
  };

  const handleSaveName = () => {
    if (nameInput.trim()) {
      onUpdatePouchName(pouch.id, nameInput.trim());
    }
    setIsEditingName(false);
  };

  // Draggable horizontal resize handle for standalone pouch
  const handleResizeStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);

    const startX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const initialWidth = cardRef.current?.offsetWidth || width;
    let latestWidth = initialWidth;

    const onMove = (moveEvent: MouseEvent | TouchEvent) => {
      const currentX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const diff = currentX - startX;
      const newWidth = Math.max(260, Math.min(900, Math.round(initialWidth + diff)));
      latestWidth = newWidth;
      setWidth(newWidth);
    };

    const onEnd = () => {
      setIsResizing(false);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);

      if (onUpdateBagWidth) {
        onUpdateBagWidth(pouch.id, latestWidth);
      }
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onMove);
    window.addEventListener('touchend', onEnd);
  };

  return (
    <div
      ref={cardRef}
      draggable={!isResizing}
      onDragStart={handlePouchDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={!isNested ? {
        width: `${width}px`,
        maxWidth: '100%',
        flex: `0 1 ${width}px`
      } : undefined}
      className={`rounded-xl border-2 transition-all select-none relative cursor-grab active:cursor-grabbing group/pouch ${
        isResizing ? 'select-none ring-2 ring-amber-400' : ''
      } ${
        isDragOver
          ? 'border-amber-500 bg-amber-50/70 ring-2 ring-amber-400/20'
          : isNested
          ? 'border-stone-300/80 bg-stone-50/90 hover:border-stone-400 shadow-2xs w-full'
          : 'border-stone-300 bg-white hover:border-stone-400 shadow-xs'
      }`}
      title="Kéo cả Pouch này vào Vali khác hoặc kéo vào Thùng rác để xóa"
    >
      {/* Right Drag-to-Resize Handle for Standalone Pouch */}
      {!isNested && (
        <div
          onMouseDown={handleResizeStart}
          onTouchStart={handleResizeStart}
          className="absolute top-0 right-0 bottom-0 w-3 cursor-ew-resize hover:bg-amber-400/20 active:bg-amber-500/40 flex items-center justify-center transition-colors z-30 group/handle rounded-r-xl"
          title="Kéo sang trái hoặc phải để tùy chỉnh độ rộng pouch"
        >
          <div className={`w-0.5 rounded-full transition-all ${
            isResizing 
              ? 'h-16 bg-amber-500 w-1' 
              : 'h-6 bg-stone-300 group-hover/handle:bg-amber-500 group-hover/handle:h-10'
          }`} />
          {isResizing && (
            <div className="absolute right-4 top-1 bg-stone-900 text-white text-[9px] font-mono px-1.5 py-0.5 rounded shadow whitespace-nowrap pointer-events-none">
              {width}px
            </div>
          )}
        </div>
      )}

      {/* Pouch Header */}
      <div className="px-3 py-2 border-b border-stone-200/80 flex items-center justify-between gap-2 bg-stone-100/70 rounded-t-lg">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <span className={`w-2.5 h-2.5 rounded-full ${colorStyle.dot} shrink-0`} />

          {isEditingName ? (
            <div className="flex items-center gap-1 flex-1">
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="px-2 py-0.5 text-xs font-bold border border-stone-300 rounded bg-white w-full"
                autoFocus
              />
              <button onClick={handleSaveName} className="p-1 text-emerald-600 hover:bg-white rounded cursor-pointer">
                <Check className="w-3 h-3" />
              </button>
              <button onClick={() => setIsEditingName(false)} className="p-1 text-stone-400 hover:bg-white rounded cursor-pointer">
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xs font-bold text-stone-900 break-words leading-tight">
                👝 {pouch.name}
              </span>
              <button
                type="button"
                onClick={() => {
                  setNameInput(pouch.name);
                  setIsEditingName(true);
                }}
                className="p-0.5 text-stone-400 hover:text-stone-700 cursor-pointer"
                title="Đổi tên nhãn pouch"
              >
                <Edit2 className="w-2.5 h-2.5" />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] font-mono font-bold text-stone-500 bg-white px-1.5 py-0.5 rounded border border-stone-200">
            {items.length} món
          </span>

          {isNested && onConvertToBag && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onConvertToBag(pouch.id);
              }}
              className="text-[10px] font-semibold text-stone-600 hover:text-stone-900 bg-white hover:bg-stone-100 px-1.5 py-0.5 rounded border border-stone-200 shadow-2xs transition-colors cursor-pointer flex items-center gap-0.5"
              title="Kéo ra ngoài hoặc bấm để biến thành Túi lớn riêng biệt"
            >
              <span>Thành Túi ↗</span>
            </button>
          )}
        </div>
      </div>

      {/* Pouch Content (Items inside this pouch) */}
      <div className="p-2 space-y-1.5 min-h-[44px]">
        {items.map(item => (
          <ItemCard
            key={item.id}
            item={item}
            allBags={allBags}
            onTogglePacked={onTogglePacked}
            onDeleteItem={onDeleteItem}
            onMoveItem={onMoveItem}
            onUpdateQuantity={onUpdateQuantity}
            onUpdateName={onUpdateItemName}
            isNestedInsidePouch={true}
          />
        ))}

        {items.length === 0 && (
          <div className="py-2.5 text-center text-[11px] text-stone-400 italic">
            Kéo thả đồ đạc vào pouch này
          </div>
        )}
      </div>
    </div>
  );
};
