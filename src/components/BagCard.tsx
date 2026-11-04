import React, { useState } from 'react';
import { 
  Edit2, 
  Check, 
  X, 
  Layers, 
  PackageOpen
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
  onUpdateQuantity
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(bag.name);

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
        } else if (data.type === 'pouch') {
          onMovePouch(data.id, bag.id);
          return;
        }
      }
    } catch {
      const id = e.dataTransfer.getData('text/plain');
      if (id) {
        const isPouchObj = allBags.some(b => b.id === id && b.isPouch);
        if (isPouchObj) {
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

  const totalItemsInBag = directItems.length + nestedPouches.reduce((acc, p) => {
    return acc + allItems.filter(i => i.containerId === p.id).length;
  }, 0);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`rounded-2xl border-2 transition-all flex flex-col bg-white shadow-xs overflow-hidden ${
        isDragOver
          ? 'border-amber-500 ring-4 ring-amber-400/20 bg-amber-50/20'
          : 'border-stone-200/90 hover:border-stone-300'
      }`}
    >
      {/* Bag Header (Draggable so user can drag bag to trash) */}
      <div 
        draggable
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
              <h3 className="text-sm sm:text-base font-bold text-stone-900 truncate">
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

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] sm:text-xs font-mono font-bold text-stone-600 bg-white px-2 sm:px-2.5 py-0.5 rounded-full border border-stone-200/80 shadow-2xs">
            {totalItemsInBag} món {nestedPouches.length > 0 ? `· ${nestedPouches.length} pouch` : ''}
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-3 sm:p-4 flex-1 space-y-3.5 sm:space-y-4">
        {/* SUBSECTION 1: Nested Pouches Inside This Bag */}
        {nestedPouches.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-stone-600 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-stone-500" />
                <span>CÁC POUCH NHỎ BÊN TRONG ({nestedPouches.length})</span>
              </span>
              <span className="text-[10px] text-stone-400 font-normal normal-case">
                Kéo pouch ra ngoài nếu muốn đổi túi
              </span>
            </div>

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
                />
              ))}
            </div>
          </div>
        )}

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
