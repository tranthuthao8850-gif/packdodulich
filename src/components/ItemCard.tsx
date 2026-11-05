import React, { useState } from 'react';
import { CheckCircle2, Circle, Edit2, Check, X } from 'lucide-react';
import { LuggageBag, LuggageItem } from '../types/packing';

interface ItemCardProps {
  item: LuggageItem;
  allBags?: LuggageBag[];
  onTogglePacked: (id: string) => void;
  onDeleteItem?: (id: string) => void;
  onMoveItem?: (itemId: string, targetContainerId: string | null) => void;
  onUpdateQuantity?: (itemId: string, quantity: number) => void;
  onUpdateName?: (itemId: string, name: string) => void;
  isNestedInsidePouch?: boolean;
}

export const ItemCard: React.FC<ItemCardProps> = ({
  item,
  onTogglePacked,
  onUpdateQuantity,
  onUpdateName,
  isNestedInsidePouch = false
}) => {
  const [isEditingQty, setIsEditingQty] = useState(false);
  const [qtyInput, setQtyInput] = useState(item.quantity.toString());

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(item.name);

  const isBusyEditing = isEditingQty || isEditingName;

  const handleDragStart = (e: React.DragEvent) => {
    if (isBusyEditing) {
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

  const handleSaveName = () => {
    const trimmed = nameInput.trim();
    if (trimmed && trimmed !== item.name) {
      if (onUpdateName) {
        onUpdateName(item.id, trimmed);
      }
    } else {
      setNameInput(item.name);
    }
    setIsEditingName(false);
  };

  const handleCancelName = () => {
    setNameInput(item.name);
    setIsEditingName(false);
  };

  return (
    <div
      draggable={!isBusyEditing}
      onDragStart={handleDragStart}
      className={`group px-2.5 sm:px-3 py-2 rounded-xl border flex items-center justify-between gap-2 transition-all cursor-grab active:cursor-grabbing relative select-none hover:shadow-xs hover:-translate-y-0.5 ${
        item.isPacked
          ? 'bg-stone-50 border-stone-200 text-stone-400 opacity-70'
          : isNestedInsidePouch
          ? 'bg-white border-stone-200/90 hover:border-stone-300'
          : 'bg-white border-stone-200 hover:border-stone-300'
      }`}
      title={isBusyEditing ? undefined : "Kéo thả để di chuyển hoặc kéo vào Thùng rác bên phải để xóa"}
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

        {isEditingName ? (
          <div className="flex-1 flex items-center gap-1 min-w-0" onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveName();
                if (e.key === 'Escape') handleCancelName();
              }}
              onBlur={handleSaveName}
              autoFocus
              className="w-full px-2 py-0.5 text-xs font-semibold text-stone-900 bg-white border border-amber-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/50 shadow-2xs"
            />
            <button
              type="button"
              onClick={handleSaveName}
              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded cursor-pointer shrink-0"
              title="Lưu tên mới"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleCancelName}
              className="p-1 text-stone-400 hover:bg-stone-100 rounded cursor-pointer shrink-0"
              title="Hủy"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 min-w-0 flex-1 group/name">
            <span
              onClick={(e) => {
                e.stopPropagation();
                setNameInput(item.name);
                setIsEditingName(true);
              }}
              className={`text-xs font-semibold break-words leading-snug flex-1 cursor-text hover:text-amber-700 transition-colors ${
                item.isPacked ? 'line-through text-stone-400' : 'text-stone-800'
              }`}
              title="Bấm vào để chỉnh sửa tên món đồ"
            >
              {item.name}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setNameInput(item.name);
                setIsEditingName(true);
              }}
              className="opacity-0 group-hover:opacity-100 p-0.5 text-stone-400 hover:text-stone-800 rounded transition-opacity cursor-pointer shrink-0"
              title="Chỉnh sửa tên"
            >
              <Edit2 className="w-2.5 h-2.5" />
            </button>
          </div>
        )}
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
