import React, { useState } from 'react';
import { X, Luggage, Plus } from 'lucide-react';
import { LuggageBag } from '../types/packing';
import { BAG_COLORS } from '../utils/bagColors';

interface NewContainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  allBags: LuggageBag[];
  initialIsPouch?: boolean;
  onAddContainer: (name: string, isPouch: boolean, parentId: string | null, color: string) => void;
}

export const NewContainerModal: React.FC<NewContainerModalProps> = ({
  isOpen,
  onClose,
  allBags,
  initialIsPouch = false,
  onAddContainer
}) => {
  const [name, setName] = useState('');
  const [isPouch, setIsPouch] = useState(initialIsPouch);
  const [parentId, setParentId] = useState<string | null>(null);
  const [color, setColor] = useState('blue');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const largeBags = allBags.filter(b => !b.isPouch);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Vui lòng nhập tên / nhãn cho túi.');
      return;
    }

    onAddContainer(name.trim(), isPouch, isPouch ? parentId : null, color);
    setName('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
      <div 
        className="bg-white rounded-2xl max-w-md w-full shadow-xl overflow-hidden border border-stone-200"
        role="dialog"
      >
        <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Luggage className="w-5 h-5 text-stone-700" />
            <h2 className="text-base font-bold text-stone-900">
              Thêm Túi / Vali / Pouch mới
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-2.5 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
              {error}
            </div>
          )}

          {/* Type Choice: Large Bag vs Pouch */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Loại túi đựng
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsPouch(false);
                  setParentId(null);
                }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  !isPouch
                    ? 'border-stone-900 bg-stone-900 text-white shadow-xs'
                    : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                }`}
              >
                <div className="text-base font-bold">🧳 Túi lớn / Vali</div>
                <div className={`text-[11px] mt-0.5 ${!isPouch ? 'text-stone-300' : 'text-stone-500'}`}>
                  Chứa đồ đạc & chứa được các pouch nhỏ
                </div>
              </button>

              <button
                type="button"
                onClick={() => setIsPouch(true)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isPouch
                    ? 'border-stone-900 bg-stone-900 text-white shadow-xs'
                    : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                }`}
              >
                <div className="text-base font-bold">👝 Pouch nhỏ / Túi con</div>
                <div className={`text-[11px] mt-0.5 ${isPouch ? 'text-stone-300' : 'text-stone-500'}`}>
                  Có thể kéo thả xếp vào trong túi lớn
                </div>
              </button>
            </div>
          </div>

          {/* Name input */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Tên / Nhãn túi <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              placeholder={isPouch ? 'Ví dụ: Túi mỹ phẩm, Túi thuốc, Túi sạc cáp...' : 'Ví dụ: Vali to 28 inch, Balo xách tay, Thùng đồ...'}
              className="w-full px-3 py-2 text-sm bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900"
              autoFocus
            />
          </div>

          {/* If Pouch: Choose initial location */}
          {isPouch && (
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Vị trí ban đầu của Pouch
              </label>
              <select
                value={parentId || ''}
                onChange={(e) => setParentId(e.target.value ? e.target.value : null)}
                className="w-full px-3 py-2 text-sm bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900"
              >
                <option value="">Để bên ngoài sàn (Kéo thả vào túi sau)</option>
                {largeBags.map((b) => (
                  <option key={b.id} value={b.id}>
                    Xếp luôn vào trong: {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Color choice */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Màu sắc phân biệt
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {Object.keys(BAG_COLORS).map((cKey) => {
                const c = BAG_COLORS[cKey];
                const isSelected = color === cKey;
                return (
                  <button
                    key={cKey}
                    type="button"
                    onClick={() => setColor(cKey)}
                    className={`w-7 h-7 rounded-full ${c.dot} flex items-center justify-center transition-all ${
                      isSelected ? 'ring-2 ring-stone-900 ring-offset-2 scale-110' : 'opacity-70 hover:opacity-100'
                    }`}
                    title={c.label}
                  />
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg"
            >
              Huỷ
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 rounded-lg shadow-xs"
            >
              Tạo túi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
