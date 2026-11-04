import React, { useState } from 'react';
import { GripVertical, Trash2, CheckCircle2, Circle, ArrowRightLeft } from 'lucide-react';
import { LuggageBag, LuggageItem } from '../types/packing';

interface ItemCardProps {
  item: LuggageItem;
  allBags: LuggageBag[];
  onTogglePacked: (id: string) => void;
  onDeleteItem: (id: string) => void;
  onMoveItem: (itemId: string, targetContainerId: string | null) => void;
  isNestedInsidePouch?: boolean;
}

export const ItemCard: React.FC<ItemCardProps> = ({
  item,
  allBags,
  onTogglePacked,
  onDeleteItem,
  onMoveItem,
  isNestedInsidePouch = false
}) => {
  const [showMoveMenu, setShowMoveMenu] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'item', id: item.id }));
    e.dataTransfer.setData('text/plain', item.id);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className={`group px-2.5 py-1.5 rounded-lg border flex items-center justify-between gap-2 transition-all cursor-grab active:cursor-grabbing relative select-none ${
        item.isPacked
          ? 'bg-stone-50 border-stone-200 text-stone-400'
          : isNestedInsidePouch
          ? 'bg-white border-stone-200 hover:border-stone-300 shadow-2xs'
          : 'bg-white border-stone-200/90 hover:border-stone-300 shadow-xs'
      }`}
    >
      {/* Left: Drag Handle + Checkbox + Item Name */}
      <div className="flex items-center gap-1.5 min-w-0 flex-1">
        <GripVertical className="w-3.5 h-3.5 text-stone-300 group-hover:text-stone-500 shrink-0 cursor-grab" />
        
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onTogglePacked(item.id);
          }}
          className="shrink-0 text-stone-400 hover:text-stone-700 focus:outline-none"
          title={item.isPacked ? 'Đã xếp xong (Bấm để bỏ chọn)' : 'Chưa xếp (Bấm để đánh dấu đã xếp)'}
        >
          {item.isPacked ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          ) : (
            <Circle className="w-3.5 h-3.5 text-stone-300 hover:text-stone-500" />
          )}
        </button>

        <span className={`text-xs font-medium truncate ${item.isPacked ? 'line-through text-stone-400' : 'text-stone-800'}`}>
          {item.name}
        </span>
      </div>

      {/* Right: Quantity badge + Move Menu + Delete */}
      <div className="flex items-center gap-1 shrink-0">
        <span className="text-[10px] font-mono font-bold text-stone-500 bg-stone-100 px-1.5 py-0.2 rounded">
          x{item.quantity}
        </span>

        {/* Move dropdown button */}
        <div className="relative">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowMoveMenu(!showMoveMenu);
            }}
            className="p-1 text-stone-400 hover:text-stone-700 rounded hover:bg-stone-100 transition-colors"
            title="Chuyển sang túi khác..."
          >
            <ArrowRightLeft className="w-3 h-3" />
          </button>

          {showMoveMenu && (
            <div 
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 top-full mt-1 w-52 bg-white border border-stone-200 rounded-xl shadow-lg p-1.5 z-40 text-xs space-y-0.5"
            >
              <div className="text-[10px] font-bold text-stone-400 px-2 py-1 uppercase">
                Chuyển đồ vật này sang:
              </div>

              {item.containerId !== null && (
                <button
                  type="button"
                  onClick={() => {
                    onMoveItem(item.id, null);
                    setShowMoveMenu(false);
                  }}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-stone-100 text-stone-700 flex items-center gap-1.5"
                >
                  <span>⏳ Đồ chưa xếp (Hàng đợi)</span>
                </button>
              )}

              {/* Large bags */}
              {allBags.filter(b => !b.isPouch && b.id !== item.containerId).map(b => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => {
                    onMoveItem(item.id, b.id);
                    setShowMoveMenu(false);
                  }}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-stone-100 text-stone-900 font-medium flex items-center gap-1.5 truncate"
                >
                  <span>🧳 {b.name}</span>
                </button>
              ))}

              {/* Pouches */}
              {allBags.filter(b => b.isPouch && b.id !== item.containerId).map(p => {
                const parent = allBags.find(b => b.id === p.parentId);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      onMoveItem(item.id, p.id);
                      setShowMoveMenu(false);
                    }}
                    className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-stone-100 text-stone-700 flex items-center gap-1.5 truncate pl-4"
                  >
                    <span>👝 {p.name} {parent ? `(trong ${parent.name})` : ''}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Delete item */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDeleteItem(item.id);
          }}
          className="p-1 text-stone-300 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
          title="Xóa đồ vật"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
