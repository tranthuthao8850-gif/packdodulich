import React, { useState } from 'react';
import { 
  GripHorizontal, 
  Trash2, 
  Plus, 
  FolderInput, 
  FolderOutput, 
  Layers, 
  ArrowRightLeft,
  Edit2,
  Check,
  X
} from 'lucide-react';
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
  onDeletePouch: (pouchId: string) => void;
  onUpdatePouchName: (pouchId: string, newName: string) => void;
  onQuickAddItem: (name: string, quantity: number, containerId: string) => void;
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
  onDeletePouch,
  onUpdatePouchName,
  onQuickAddItem
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(pouch.name);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [showMovePouchMenu, setShowMovePouchMenu] = useState(false);

  const colorStyle = BAG_COLORS[pouch.color] || BAG_COLORS.teal;
  const largeBags = allBags.filter(b => !b.isPouch);

  // Drag handlers for the POUCH ITSELF
  const handlePouchDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'pouch', id: pouch.id }));
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
      // Fallback text/plain
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

  const handleAddItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newItemName.trim()) {
      onQuickAddItem(newItemName.trim(), 1, pouch.id);
      setNewItemName('');
      setIsAddingItem(false);
    }
  };

  return (
    <div
      draggable
      onDragStart={handlePouchDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`rounded-xl border-2 transition-all select-none relative ${
        isDragOver
          ? 'border-amber-500 bg-amber-50/70 ring-2 ring-amber-400/20'
          : isNested
          ? 'border-stone-300/80 bg-stone-50/90 hover:border-stone-400 shadow-2xs'
          : 'border-stone-300 bg-white hover:border-stone-400 shadow-xs'
      }`}
    >
      {/* Pouch Header (Draggable Handle) */}
      <div className="px-3 py-2 border-b border-stone-200/80 flex items-center justify-between gap-2 cursor-grab active:cursor-grabbing bg-stone-100/70 rounded-t-lg">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <GripHorizontal className="w-3.5 h-3.5 text-stone-400 shrink-0" />
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
              <button onClick={handleSaveName} className="p-1 text-emerald-600 hover:bg-white rounded">
                <Check className="w-3 h-3" />
              </button>
              <button onClick={() => setIsEditingName(false)} className="p-1 text-stone-400 hover:bg-white rounded">
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
                className="p-0.5 text-stone-400 hover:text-stone-700"
                title="Đổi tên nhãn pouch"
              >
                <Edit2 className="w-2.5 h-2.5" />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <span className="text-[10px] font-mono text-stone-500 bg-white px-1.5 py-0.2 rounded border border-stone-200">
            {items.length} món
          </span>

          {/* Move Pouch to another Bag */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMovePouchMenu(!showMovePouchMenu)}
              className="p-1 text-stone-500 hover:text-stone-900 rounded hover:bg-white"
              title="Chuyển pouch sang túi khác"
            >
              <ArrowRightLeft className="w-3 h-3" />
            </button>

            {showMovePouchMenu && (
              <div 
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-full mt-1 w-52 bg-white border border-stone-200 rounded-xl shadow-lg p-1.5 z-40 text-xs space-y-0.5"
              >
                <div className="text-[10px] font-bold text-stone-400 px-2 py-1 uppercase">
                  Chuyển cả Pouch này vào:
                </div>

                {isNested && (
                  <button
                    type="button"
                    onClick={() => {
                      onMovePouch(pouch.id, null);
                      setShowMovePouchMenu(false);
                    }}
                    className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-stone-100 text-stone-700 flex items-center gap-1.5"
                  >
                    <FolderOutput className="w-3.5 h-3.5 text-stone-500" />
                    <span>Bỏ ra ngoài (Pouch độc lập)</span>
                  </button>
                )}

                {largeBags
                  .filter(b => b.id !== pouch.parentId)
                  .map(b => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        onMovePouch(pouch.id, b.id);
                        setShowMovePouchMenu(false);
                      }}
                      className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-stone-100 text-stone-900 font-medium flex items-center gap-1.5 truncate"
                    >
                      <FolderInput className="w-3.5 h-3.5 text-stone-500" />
                      <span>Cho vào {b.name}</span>
                    </button>
                  ))}
              </div>
            )}
          </div>

          {/* Delete Pouch */}
          <button
            type="button"
            onClick={() => {
              if (confirm(`Bạn có chắc muốn xóa "${pouch.name}"? Đồ đạc trong pouch sẽ được đưa về hàng đợi.`)) {
                onDeletePouch(pouch.id);
              }
            }}
            className="p-1 text-stone-400 hover:text-rose-600 rounded hover:bg-white transition-colors"
            title="Xóa pouch này"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Pouch Content (Items inside this pouch) */}
      <div className="p-2 space-y-1.5 min-h-[50px]">
        {items.map(item => (
          <ItemCard
            key={item.id}
            item={item}
            allBags={allBags}
            onTogglePacked={onTogglePacked}
            onDeleteItem={onDeleteItem}
            onMoveItem={onMoveItem}
            isNestedInsidePouch={true}
          />
        ))}

        {items.length === 0 && (
          <div className="py-3 text-center text-[11px] text-stone-400 italic">
            Kéo thả đồ đạc vào pouch này
          </div>
        )}

        {/* Quick add item form */}
        {isAddingItem ? (
          <form onSubmit={handleAddItemSubmit} className="pt-1 flex items-center gap-1">
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder="Tên món đồ..."
              className="px-2 py-1 text-xs border border-stone-300 rounded-lg flex-1 bg-white focus:outline-none focus:ring-1 focus:ring-stone-900"
              autoFocus
            />
            <button
              type="submit"
              className="px-2 py-1 text-xs font-bold text-white bg-stone-900 rounded-lg hover:bg-stone-800"
            >
              Thêm
            </button>
            <button
              type="button"
              onClick={() => setIsAddingItem(false)}
              className="px-2 py-1 text-xs text-stone-500 hover:bg-stone-200 rounded-lg"
            >
              Huỷ
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setIsAddingItem(true)}
            className="w-full mt-1 py-1 text-[11px] font-medium text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-md transition-colors flex items-center justify-center gap-1"
          >
            <Plus className="w-3 h-3" />
            <span>Thêm đồ vào {pouch.name}</span>
          </button>
        )}
      </div>
    </div>
  );
};
