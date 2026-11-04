import React, { useState } from 'react';
import { X, Package, Plus } from 'lucide-react';
import { LuggageBag } from '../types/packing';

interface NewItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  allBags: LuggageBag[];
  initialContainerId?: string | null;
  onAddItem: (name: string, quantity: number, containerId: string | null) => void;
}

export const NewItemModal: React.FC<NewItemModalProps> = ({
  isOpen,
  onClose,
  allBags,
  initialContainerId = null,
  onAddItem
}) => {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [containerId, setContainerId] = useState<string | null>(initialContainerId);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Vui lòng nhập tên đồ vật.');
      return;
    }

    onAddItem(name.trim(), Math.max(1, Number(quantity) || 1), containerId);
    setName('');
    setQuantity(1);
    setError('');
    onClose();
  };

  const largeBags = allBags.filter(b => !b.isPouch);
  const pouches = allBags.filter(b => b.isPouch);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
      <div 
        className="bg-white rounded-2xl max-w-md w-full shadow-xl overflow-hidden border border-stone-200"
        role="dialog"
      >
        <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-stone-700" />
            <h2 className="text-base font-bold text-stone-900">
              Thêm đồ đạc mới
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-2.5 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Tên món đồ <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              placeholder="Ví dụ: Áo thun, Kem chống nắng, Sạc dự phòng, Dép..."
              className="w-full px-3 py-2 text-sm bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Số lượng
              </label>
              <input
                type="number"
                min={1}
                max={99}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                className="w-full px-3 py-2 text-sm bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900 font-mono"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Xếp vào đâu?
              </label>
              <select
                value={containerId || ''}
                onChange={(e) => setContainerId(e.target.value ? e.target.value : null)}
                className="w-full px-3 py-2 text-sm bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900"
              >
                <option value="">⏳ Chưa xếp túi (Hàng đợi)</option>

                {largeBags.length > 0 && (
                  <optgroup label="Túi lớn / Vali:">
                    {largeBags.map((b) => (
                      <option key={b.id} value={b.id}>
                        🧳 {b.name}
                      </option>
                    ))}
                  </optgroup>
                )}

                {pouches.length > 0 && (
                  <optgroup label="Pouch nhỏ:">
                    {pouches.map((p) => {
                      const parent = allBags.find(b => b.id === p.parentId);
                      return (
                        <option key={p.id} value={p.id}>
                          👝 {p.name} {parent ? `(trong ${parent.name})` : '(ngoài sàn)'}
                        </option>
                      );
                    })}
                  </optgroup>
                )}
              </select>
            </div>
          </div>

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
              Thêm món đồ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
