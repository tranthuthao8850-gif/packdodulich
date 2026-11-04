import React, { useState } from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import { LuggageBag, LuggageItem } from '../types/packing';

interface ItemCardProps {
  item: LuggageItem;
  allBags?: LuggageBag[];
  onTogglePacked: (id: string) => void;
  onDeleteItem?: (id: string) => void;
  onMoveItem?: (itemId: string, targetContainerId: string | null) => void;
  onUpdateQuantity?: (itemId: string, quantity: number) => void;
  isNestedInsidePouch?: boolean;
}

export const ItemCard: React.FC<ItemCardProps> = ({
  item,
  onTogglePacked,
  onUpdateQuantity,
  isNestedInsidePouch = false
}) => {
  const [isEditingQty, setIsEditingQty] = useState(false);
  const [qtyInput, setQtyInput] = useState(item.quantity.toString());

  const handleDragStart = (e: React.DragEvent) => {
    if (isEditingQty) {
      e.preventDefault();
      return;
    }
    e.stopPropagation();
    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'item', id: item.id, name: item.name }));
    e.dataTransfer.setData('text/plain', item.id);
  };

  const handleSaveQty = () => {
    const val = parseInt(qtyInput, 10);
    const validQty = isNaN(val) || val < 1 ? 1 : Math.min(val, 999);
    setQtyInput(validQty.toString());
    if (onUpdateQuantity) {
      onUpdateQuantity(item.id, validQty);
    }
    setIsEditingQty(false);
  };

  return (
    <div
      draggable={!isEditingQty}
      onDragStart={handleDragStart}
      className={`group px-2.5 sm:px-3 py-2 rounded-xl border flex items-center justify-between gap-2 transition-all cursor-grab active:cursor-grabbing relative select-none hover:shadow-xs hover:-translate-y-0.5 ${
        item.isPacked
          ? 'bg-stone-50 border-stone-200 text-stone-400 opacity-70'
          : isNestedInsidePouch
          ? 'bg-white border-stone-200/90 hover:border-stone-300'
          : 'bg-white border-stone-200 hover:border-stone-300'
      }`}
      title={isEditingQty ? undefined : "Kéo thả để di chuyển giữa các túi hoặc kéo vào Thùng rác bên phải để xóa"}
    >
      {/* Checkbox + Item Name */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onTogglePacked(item.id);
          }}
          className="shrink-0 text-stone-400 hover:text-stone-700 p-0.5 -ml-0.5 focus:outline-none transition-transform active:scale-90 cursor-pointer"
          title={item.isPacked ? 'Đã xếp xong (Bấm để bỏ chọn)' : 'Chưa xếp (Bấm để đánh dấu đã xếp)'}
        >
          {item.isPacked ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          ) : (
            <Circle className="w-4 h-4 text-stone-300 hover:text-stone-500" />
          )}
        </button>

        <span className={`text-xs font-semibold truncate ${item.isPacked ? 'line-through text-stone-400' : 'text-stone-800'}`}>
          {item.name}
        </span>
      </div>

      {/* Quantity badge with direct inline number editing */}
      {isEditingQty ? (
        <div 
          onClick={(e) => e.stopPropagation()} 
          className="flex items-center gap-1 shrink-0 bg-amber-50 px-1 py-0.5 rounded-lg border border-amber-300 shadow-2xs"
        >
          <span className="text-[10px] font-mono font-bold text-amber-700">x</span>
          <input
            type="number"
            min={1}
            max={999}
            value={qtyInput}
            onChange={(e) => setQtyInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveQty();
              if (e.key === 'Escape') setIsEditingQty(false);
            }}
            onBlur={handleSaveQty}
            autoFocus
            onFocus={(e) => e.target.select()}
            className="w-12 px-1 text-xs font-mono font-bold text-stone-900 bg-white border border-amber-400 rounded text-center focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setQtyInput(item.quantity.toString());
            setIsEditingQty(true);
          }}
          className="text-[11px] font-mono font-bold text-stone-600 bg-stone-100 hover:bg-amber-100 hover:text-amber-900 hover:border-amber-300 px-2 py-0.5 rounded-md border border-stone-200/90 transition-all shrink-0 cursor-pointer flex items-center gap-0.5"
          title="Bấm vào để tự điền số lượng mới"
        >
          <span>x{item.quantity}</span>
        </button>
      )}
    </div>
  );
};
