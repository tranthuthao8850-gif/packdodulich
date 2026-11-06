import React, { useState, useEffect } from 'react';
import { Trash2, Undo2 } from 'lucide-react';
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
        const foundItem = items.find(i => i.id === id);
        if (foundItem) {
          onDeleteItem(id);
          showDeletedToast(foundItem.name, foundItem);
          return;
        }
        const foundPouch = bags.find(b => b.id === id && b.isPouch);
        if (foundPouch) {
          onDeletePouch(id);
          showDeletedToast(`Pouch: ${foundPouch.name}`);
          return;
        }
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
        <div className="fixed bottom-20 sm:bottom-6 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:w-auto z-50 bg-stone-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center justify-between sm:justify-start gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200 border border-stone-800">
          <div className="flex items-center gap-2 min-w-0">
            <Trash2 className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="text-xs font-medium truncate">
              Đã xóa: <strong className="font-bold text-amber-300">{lastDeletedName}</strong>
            </span>
          </div>
          {recentlyDeletedItem && onRestoreItem && (
            <button
              onClick={handleUndo}
              className="px-2.5 py-1 text-xs font-bold bg-amber-400 hover:bg-amber-300 text-stone-900 rounded-lg transition-colors flex items-center gap-1 cursor-pointer shrink-0"
            >
              <Undo2 className="w-3 h-3" />
              <span>Hoàn tác</span>
            </button>
          )}
        </div>
      )}

      {/* 1. DESKTOP TRASH BIN (Visible on lg: screens and above) */}
      <aside
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        aria-label="Thùng rác xóa đồ"
        className={`hidden lg:flex fixed right-[10mm] top-20 z-40 transition-all duration-200 select-none ${
          isDragOver
            ? 'scale-115'
            : isWindowDragging
            ? 'scale-110 animate-pulse'
            : 'opacity-85 hover:opacity-100 hover:scale-105'
        }`}
      >
        {isWindowDragging ? (
          <div
            className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border-2 transition-all shadow-xl backdrop-blur-md cursor-pointer min-w-[120px] ${
              isDragOver
                ? 'bg-rose-500 border-rose-600 text-white ring-4 ring-rose-400/40 shadow-rose-500/30'
                : 'bg-rose-50/95 border-rose-400 text-rose-700 ring-4 ring-rose-300/30 shadow-md'
            }`}
            title="Kéo đồ đạc hoặc túi vào đây để xoá luôn"
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center mb-1 transition-all ${
                isDragOver ? 'bg-white text-rose-600 scale-115 shadow-md rotate-6' : 'bg-rose-100 text-rose-600'
              }`}
            >
              <Trash2 className="w-5 h-5 transition-transform" />
            </div>

            <span className={`text-xs font-bold tracking-tight text-center ${isDragOver ? 'text-white' : 'text-rose-700'}`}>
              {isDragOver ? 'Thả để xoá!' : 'Thùng rác'}
            </span>

            <span className={`text-[9px] text-center mt-0.5 leading-tight ${isDragOver ? 'text-rose-100' : 'text-rose-600 font-medium'}`}>
              {isDragOver ? 'Thả tay để xoá' : 'Thả vào để xoá'}
            </span>
          </div>
        ) : (
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-stone-200/90 bg-white/95 text-stone-600 hover:border-rose-400 hover:text-rose-600 shadow-md transition-all cursor-pointer backdrop-blur-xs"
            title="Thùng rác: Khi kéo đồ hoặc túi sẽ tự động mở rộng để bạn thả vào xóa"
          >
            <Trash2 className="w-4 h-4 text-rose-500" />
            <span className="text-xs font-semibold">Thùng rác</span>
          </div>
        )}
      </aside>

      {/* 2. MOBILE & TABLET TRASH BIN (Visible only below lg screens) */}
      {/* State A: Idle (Floating bottom pill - does not cover any cards or text) */}
      {!isWindowDragging && (
        <aside
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          aria-label="Thùng rác trên di động"
          className="lg:hidden fixed bottom-4 right-4 z-40 transition-all select-none"
        >
          <div
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-white/95 border border-stone-300 shadow-lg text-stone-700 backdrop-blur-md active:scale-95 transition-all"
            title="Kéo đồ thả vào đây để xóa"
          >
            <div className="w-7 h-7 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <Trash2 className="w-4 h-4" />
            </div>
            <div className="flex flex-col pr-1">
              <span className="text-xs font-bold text-stone-800 leading-tight">Thùng rác</span>
              <span className="text-[10px] text-stone-400 leading-tight">Kéo vào để xóa</span>
            </div>
          </div>
        </aside>
      )}

      {/* State B: Active Dragging on Mobile (Expands to bottom drop bar across the screen) */}
      {isWindowDragging && (
        <aside
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          aria-label="Khu vực thả xóa đồ trên di động"
          className={`lg:hidden fixed bottom-3 inset-x-3 z-50 p-4 rounded-2xl shadow-2xl transition-all duration-200 select-none border-2 flex items-center justify-center gap-3 ${
            isDragOver
              ? 'bg-rose-700 border-white ring-4 ring-rose-500/60 scale-102 text-white'
              : 'bg-rose-600 border-rose-300 text-white animate-pulse'
          }`}
        >
          <Trash2 className={`w-6 h-6 shrink-0 ${isDragOver ? 'scale-125 rotate-12' : 'animate-bounce'}`} />
          <div className="text-center">
            <span className="text-sm font-black tracking-wide block uppercase">
              {isDragOver ? 'BỎ TAY ĐỂ XÓA NGAY!' : 'THẢ VÀO ĐÂY ĐỂ XÓA'}
            </span>
            <span className="text-[11px] text-rose-100 font-medium block">
              {isDragOver ? 'Món đồ / túi sẽ bị xóa lập tức' : 'Kéo xuống thanh này và nhả tay'}
            </span>
          </div>
        </aside>
      )}
    </>
  );
};
