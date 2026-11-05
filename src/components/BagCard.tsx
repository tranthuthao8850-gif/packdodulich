import React, { useState, useEffect, useRef } from 'react';
import { 
  Edit2, 
  Check, 
  X, 
  Layers, 
  PackageOpen,
  Luggage
} from 'lucide-react';
import { LuggageBag, LuggageItem } from '../types/packing';
import { BAG_COLORS } from '../utils/bagColors';
import { ItemCard } from './ItemCard';
import { PouchCard } from './PouchCard';

interface BagCardProps {
  bag: LuggageBag;
  directItems: LuggageItem[];
  nestedPouches: LuggageBag[];
  allItems: LuggageItem[];
  allBags: LuggageBag[];
  onMoveItem: (itemId: string, targetContainerId: string | null) => void;
  onTogglePacked: (itemId: string) => void;
  onDeleteItem: (itemId: string) => void;
  onMovePouch: (pouchId: string, targetParentLargeBagId: string | null) => void;
  onDeletePouch: (pouchId: string) => void;
  onUpdatePouchName: (pouchId: string, newName: string) => void;
  onDeleteBag?: (bagId: string) => void;
  onUpdateBagName: (bagId: string, newName: string) => void;
  onUpdateQuantity?: (itemId: string, quantity: number) => void;
  onUpdateBagWidth?: (bagId: string, width: number) => void;
  onUpdateItemName?: (itemId: string, name: string) => void;
  onConvertToBag?: (pouchId: string) => void;
  onMergePouch?: (sourceContainerId: string, targetContainerId: string) => void;
  onUnpackIntoParentBag?: (pouchId: string) => void;
  onQuickAddItem?: (name: string, quantity: number, containerId: string) => void;
}

export const BagCard: React.FC<BagCardProps> = ({
  bag,
  directItems,
  nestedPouches,
  allItems,
  allBags,
  onMoveItem,
  onTogglePacked,
  onDeleteItem,
  onMovePouch,
  onDeletePouch,
  onUpdatePouchName,
  onUpdateBagName,
  onUpdateQuantity,
  onUpdateBagWidth,
  onUpdateItemName,
  onConvertToBag,
  onMergePouch,
  onUnpackIntoParentBag
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(bag.name);

  // Horizontal resizability state
  const [width, setWidth] = useState<number>(bag.customWidth || 380);
  const [isResizing, setIsResizing] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bag.customWidth) {
      setWidth(bag.customWidth);
    }
  }, [bag.customWidth]);

  const colorStyle = BAG_COLORS[bag.color] || BAG_COLORS.slate;

  // Allow dragging the bag header to the trash bin on the right
  const handleBagDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'bag', id: bag.id, name: bag.name }));
    e.dataTransfer.setData('text/plain', bag.id);
  };

  // Dropping into this Large Bag
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    try {
      const raw = e.dataTransfer.getData('application/json');
      if (raw) {
        const data = JSON.parse(raw);
        if (data.type === 'item') {
          onMoveItem(data.id, bag.id);
          return;
        } else if (data.type === 'pouch' || data.type === 'bag') {
          if (data.id === bag.id) return;
          onMovePouch(data.id, bag.id);
          return;
        }
      }
    } catch {
      const id = e.dataTransfer.getData('text/plain');
      if (id && id !== bag.id) {
        const isContainer = allBags.some(b => b.id === id);
        if (isContainer) {
          onMovePouch(id, bag.id);
        } else {
          onMoveItem(id, bag.id);
        }
      }
    }
  };

  const handleSaveName = () => {
    if (nameInput.trim()) {
      onUpdateBagName(bag.id, nameInput.trim());
    }
    setIsEditingName(false);
  };

  // Draggable horizontal resize handle
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
      // Allow card width from 280px up to 1100px
      const newWidth = Math.max(280, Math.min(1100, Math.round(initialWidth + diff)));
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
        onUpdateBagWidth(bag.id, latestWidth);
      }
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onMove);
    window.addEventListener('touchend', onEnd);
  };

  const totalItemsInBag = directItems.length + nestedPouches.reduce((acc, p) => {
    return acc + allItems.filter(i => i.containerId === p.id).length;
  }, 0);

  return (
    <div
      ref={cardRef}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        width: `${width}px`,
        maxWidth: '100%',
        flex: `0 1 ${width}px`
      }}
      className={`rounded-2xl border-2 transition-all flex flex-col bg-white shadow-xs relative group/card overflow-hidden ${
        isResizing ? 'select-none ring-2 ring-amber-400' : ''
      } ${
        isDragOver
          ? 'border-amber-500 ring-4 ring-amber-400/20 bg-amber-50/20'
          : 'border-stone-200/90 hover:border-stone-300'
      }`}
    >
      {/* Drop feedback overlay when dragging into this Bag */}
      {isDragOver && (
        <div className="absolute inset-0 bg-amber-500/10 backdrop-blur-[1px] border-2 border-amber-500 rounded-2xl z-20 flex flex-col items-center justify-center p-4 text-center pointer-events-none">
          <div className="bg-white/95 px-4 py-2 rounded-xl shadow-lg border border-amber-300 flex items-center gap-2 text-stone-900 text-xs font-bold animate-bounce">
            <Luggage className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Thả vào đây: Vali sẽ chứa cả Pouch (giữ nguyên đồ trong pouch)</span>
          </div>
        </div>
      )}

      {/* Right Drag-to-Resize Handle */}
      <div
        onMouseDown={handleResizeStart}
        onTouchStart={handleResizeStart}
        className="absolute top-0 right-0 bottom-0 w-3.5 cursor-ew-resize hover:bg-amber-400/20 active:bg-amber-500/40 flex items-center justify-center transition-colors z-30 group/handle rounded-r-2xl"
        title="Kéo sang trái hoặc phải để tùy chỉnh độ rộng của khung"
      >
        <div className={`w-1 rounded-full transition-all ${
          isResizing 
            ? 'h-20 bg-amber-500 w-1.5' 
            : 'h-8 bg-stone-300 group-hover/handle:bg-amber-500 group-hover/handle:h-14'
        }`} />
        
        {isResizing && (
          <div className="absolute right-5 top-2 bg-stone-900 text-white text-[10px] font-mono px-2 py-0.5 rounded-md shadow-md whitespace-nowrap pointer-events-none">
            {width}px
          </div>
        )}
      </div>

      {/* Bag Header (Draggable so user can drag bag to trash) */}
      <div 
        draggable={!isResizing}
        onDragStart={handleBagDragStart}
        className={`p-3.5 sm:p-4 border-b border-stone-200 flex items-center justify-between gap-3 cursor-grab active:cursor-grabbing ${colorStyle.bgLight}`}
        title="Kéo cả Vali này vào Thùng rác để xóa"
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <span className={`w-3.5 h-3.5 rounded-full ${colorStyle.dot} shrink-0`} />

          {isEditingName ? (
            <div className="flex items-center gap-1.5 flex-1" onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="px-2.5 py-1 text-sm font-bold border border-stone-300 rounded-lg bg-white w-full"
                autoFocus
              />
              <button onClick={handleSaveName} className="p-1.5 bg-stone-900 text-white rounded-lg cursor-pointer">
                <Check className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setIsEditingName(false)} className="p-1.5 text-stone-500 hover:bg-stone-200 rounded-lg cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-stone-900 break-words leading-tight">
                🧳 {bag.name}
              </h3>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setNameInput(bag.name);
                  setIsEditingName(true);
                }}
                className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
                title="Đổi tên nhãn túi"
              >
                <Edit2 className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0 pr-2">
          <span className="text-[11px] sm:text-xs font-mono font-bold text-stone-600 bg-white px-2 sm:px-2.5 py-0.5 rounded-full border border-stone-200/80 shadow-2xs">
            {totalItemsInBag} món {nestedPouches.length > 0 ? `· ${nestedPouches.length} pouch` : ''}
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-3 sm:p-4 flex-1 space-y-3.5 sm:space-y-4">
        {/* SUBSECTION 1: Nested Pouches Inside This Bag */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-stone-600 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-stone-500" />
              <span>CÁC POUCH NHỎ BÊN TRONG ({nestedPouches.length})</span>
            </span>
            <span className="text-[10px] text-stone-400 font-normal normal-case">
              Vali chứa cả pouch · đồ vẫn ở trong pouch
            </span>
          </div>

          {nestedPouches.length > 0 ? (
            <div className="space-y-2.5">
              {nestedPouches.map(pouch => (
                <PouchCard
                  key={pouch.id}
                  pouch={pouch}
                  items={allItems.filter(i => i.containerId === pouch.id)}
                  allBags={allBags}
                  isNested={true}
                  onMoveItem={onMoveItem}
                  onTogglePacked={onTogglePacked}
                  onDeleteItem={onDeleteItem}
                  onMovePouch={onMovePouch}
                  onDeletePouch={onDeletePouch}
                  onUpdatePouchName={onUpdatePouchName}
                  onUpdateQuantity={onUpdateQuantity}
                  onUpdateItemName={onUpdateItemName}
                  onConvertToBag={onConvertToBag}
                  onMergePouch={onMergePouch}
                  onUnpackIntoParentBag={onUnpackIntoParentBag}
                />
              ))}
            </div>
          ) : (
            <div className="p-3 rounded-xl border border-dashed border-stone-200 bg-stone-50/50 text-center text-[11px] text-stone-500 flex items-center justify-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-stone-400" />
              <span>Kéo pouch nhỏ thả vào đây: Vali sẽ chứa cả pouch (giữ nguyên mọi đồ trong pouch)</span>
            </div>
          )}
        </div>

        {/* SUBSECTION 2: Direct Items in this Bag */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-stone-600 uppercase tracking-wider">
            <span>ĐỒ ĐẠC XẾP TRỰC TIẾP ({directItems.length})</span>
            <span className="text-[10px] text-stone-400 font-normal normal-case">
              Kéo thả vào pouch hoặc túi khác
            </span>
          </div>

          <div className="space-y-1.5">
            {directItems.map(item => (
              <ItemCard
                key={item.id}
                item={item}
                allBags={allBags}
                onTogglePacked={onTogglePacked}
                onDeleteItem={onDeleteItem}
                onMoveItem={onMoveItem}
                onUpdateQuantity={onUpdateQuantity}
                onUpdateName={onUpdateItemName}
                isNestedInsidePouch={false}
              />
            ))}

            {directItems.length === 0 && nestedPouches.length === 0 && (
              <div className="py-8 text-center text-xs text-stone-400 border border-dashed border-stone-200 rounded-xl flex flex-col items-center justify-center">
                <PackageOpen className="w-6 h-6 text-stone-300 mb-1" />
                <span>Chưa có đồ nào trong túi này.</span>
                <span className="text-[11px] text-stone-400">Kéo thả đồ vật hoặc pouch nhỏ vào đây!</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
