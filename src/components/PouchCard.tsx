import React, { useState } from 'react';
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
  onUpdateQuantity
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(pouch.name);

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

  return (
    <div
      draggable
      onDragStart={handlePouchDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`rounded-xl border-2 transition-all select-none relative cursor-grab active:cursor-grabbing ${
        isDragOver
          ? 'border-amber-500 bg-amber-50/70 ring-2 ring-amber-400/20'
          : isNested
          ? 'border-stone-300/80 bg-stone-50/90 hover:border-stone-400 shadow-2xs'
          : 'border-stone-300 bg-white hover:border-stone-400 shadow-xs'
      }`}
      title="Kéo cả Pouch này vào Vali khác hoặc kéo vào Thùng rác bên phải để xóa"
    >
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
              <span className="text-xs font-bold text-stone-900 truncate">
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

        <span className="text-[10px] font-mono font-bold text-stone-500 bg-white px-1.5 py-0.5 rounded border border-stone-200 shrink-0">
          {items.length} món
        </span>
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
