import React, { useState, useEffect } from 'react';
import { Trash2, Undo2, AlertCircle } from 'lucide-react';
import { LuggageBag, LuggageItem } from '../types/packing';

interface TrashBinZoneProps {
  onDeleteItem: (itemId: string) => void;
  onDeletePouch: (pouchId: string) => void;
  onDeleteBag: (bagId: string) => void;
  items: LuggageItem[];
  bags: LuggageBag[];
  onRestoreItem?: (item: LuggageItem) => void;
}

export const TrashBinZone: React.FC<TrashBinZoneProps> = ({
  onDeleteItem,
  onDeletePouch,
  onDeleteBag,
  items,
  bags,
  onRestoreItem
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isWindowDragging, setIsWindowDragging] = useState(false);
  const [lastDeletedName, setLastDeletedName] = useState<string | null>(null);
  const [recentlyDeletedItem, setRecentlyDeletedItem] = useState<LuggageItem | null>(null);
  const [toastTimer, setToastTimer] = useState<NodeJS.Timeout | null>(null);

  // Listen to window-level drag events to highlight the trash zone when user starts dragging anything
  useEffect(() => {
    let dragCounter = 0;

    const handleWindowDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragCounter++;
      setIsWindowDragging(true);
    };

    const handleWindowDragLeave = () => {
      dragCounter--;
      if (dragCounter <= 0) {
        setIsWindowDragging(false);
        dragCounter = 0;
      }
    };

    const handleWindowDrop = () => {
      dragCounter = 0;
      setIsWindowDragging(false);
      setIsDragOver(false);
    };

    const handleWindowDragEnd = () => {
      dragCounter = 0;
      setIsWindowDragging(false);
      setIsDragOver(false);
    };

    window.addEventListener('dragenter', handleWindowDragEnter);
    window.addEventListener('dragleave', handleWindowDragLeave);
    window.addEventListener('drop', handleWindowDrop);
    window.addEventListener('dragend', handleWindowDragEnd);

    return () => {
      window.removeEventListener('dragenter', handleWindowDragEnter);
      window.removeEventListener('dragleave', handleWindowDragLeave);
      window.removeEventListener('drop', handleWindowDrop);
      window.removeEventListener('dragend', handleWindowDragEnd);
    };
  }, []);

  const showDeletedToast = (name: string, itemObj?: LuggageItem) => {
    if (toastTimer) clearTimeout(toastTimer);
    setLastDeletedName(name);
    if (itemObj) setRecentlyDeletedItem(itemObj);

    const timer = setTimeout(() => {
      setLastDeletedName(null);
      setRecentlyDeletedItem(null);
    }, 4500);
    setToastTimer(timer);
  };

  const handleUndo = () => {
    if (recentlyDeletedItem && onRestoreItem) {
      onRestoreItem(recentlyDeletedItem);
      setLastDeletedName(null);
      setRecentlyDeletedItem(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setIsWindowDragging(false);

    try {
      const raw = e.dataTransfer.getData('application/json');
      if (raw) {
        const data = JSON.parse(raw);
        if (data.type === 'item') {
          const found = items.find(i => i.id === data.id);
          const name = found ? found.name : (data.name || 'Món đồ');
          onDeleteItem(data.id);
          showDeletedToast(name, found);
          return;
        } else if (data.type === 'pouch') {
          const found = bags.find(b => b.id === data.id);
          const name = found ? found.name : 'Pouch';
          onDeletePouch(data.id);
          showDeletedToast(`Pouch: ${name}`);
          return;
        } else if (data.type === 'bag') {
          const found = bags.find(b => b.id === data.id);
          const name = found ? found.name : 'Túi/Vali';
          onDeleteBag(data.id);
          showDeletedToast(`Túi: ${name}`);
          return;
        }
      }
    } catch {
      // Fallback text/plain
      const id = e.dataTransfer.getData('text/plain');
      if (id) {
        // Check if item
        const foundItem = items.find(i => i.id === id);
        if (foundItem) {
          onDeleteItem(id);
          showDeletedToast(foundItem.name, foundItem);
          return;
        }
        // Check if pouch
        const foundPouch = bags.find(b => b.id === id && b.isPouch);
        if (foundPouch) {
          onDeletePouch(id);
          showDeletedToast(`Pouch: ${foundPouch.name}`);
          return;
        }
        // Check if bag
        const foundBag = bags.find(b => b.id === id && !b.isPouch);
        if (foundBag) {
          onDeleteBag(id);
          showDeletedToast(`Túi: ${foundBag.name}`);
          return;
        }
      }
    }
  };

  return (
    <>
      {/* Undo Toast Notification */}
      {lastDeletedName && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-stone-900 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200 border border-stone-800">
          <Trash2 className="w-4 h-4 text-rose-400 shrink-0" />
          <span className="text-xs font-medium">
            Đã xóa: <strong className="font-bold text-amber-300">{lastDeletedName}</strong>
          </span>
          {recentlyDeletedItem && onRestoreItem && (
            <button
              onClick={handleUndo}
              className="ml-2 px-2.5 py-1 text-xs font-bold bg-amber-400 hover:bg-amber-300 text-stone-900 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Undo2 className="w-3 h-3" />
              <span>Hoàn tác</span>
            </button>
          )}
        </div>
      )}

      {/* FLOATING RIGHT TRASH BIN ZONE */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`fixed right-3 sm:right-6 top-24 z-40 transition-all duration-200 select-none ${
          isDragOver
            ? 'scale-105'
            : isWindowDragging
            ? 'scale-102 animate-pulse'
            : ''
        }`}
      >
        <div
          className={`flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-2xl border-2 transition-all shadow-lg backdrop-blur-md cursor-pointer ${
            isDragOver
              ? 'bg-rose-500 border-rose-600 text-white ring-4 ring-rose-400/40 shadow-rose-500/25'
              : isWindowDragging
              ? 'bg-rose-50/95 border-rose-400 text-rose-700 ring-4 ring-rose-300/30 shadow-md'
              : 'bg-white/95 border-stone-300 hover:border-rose-400 text-stone-600 hover:text-rose-600 shadow-md'
          } w-28 sm:w-36`}
          title="Kéo đồ đạc hoặc túi vào đây để xoá luôn"
        >
          {/* Animated Trash Icon */}
          <div
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-1.5 transition-all ${
              isDragOver
                ? 'bg-white text-rose-600 scale-110 shadow-md rotate-6'
                : isWindowDragging
                ? 'bg-rose-100 text-rose-600 scale-105'
                : 'bg-stone-100 text-stone-500'
            }`}
          >
            <Trash2 className="w-6 h-6 transition-transform" />
          </div>

          {/* Label */}
          <span className={`text-xs sm:text-sm font-bold tracking-tight text-center ${
            isDragOver ? 'text-white' : isWindowDragging ? 'text-rose-700' : 'text-stone-800'
          }`}>
            {isDragOver ? 'Thả để xoá!' : 'Thùng rác'}
          </span>

          <span className={`text-[10px] text-center mt-0.5 leading-tight hidden sm:block ${
            isDragOver ? 'text-rose-100' : isWindowDragging ? 'text-rose-600 font-medium' : 'text-stone-400'
          }`}>
            {isDragOver ? 'Bỏ tay để xoá ngay' : 'Kéo đồ vào đây để xoá'}
          </span>
        </div>
      </div>
    </>
  );
};
