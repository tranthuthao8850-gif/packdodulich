import { SimpleTripPlan, LuggageBag, LuggageItem } from '../types/packing';

const STORAGE_KEY = 'packvisual_simple_trip_v2';

export const DEFAULT_PLAN: SimpleTripPlan = {
  title: 'Chuyến đi du lịch',
  bags: [
    {
      id: 'bag-1',
      name: 'Vali chính 28 inch',
      isPouch: false,
      parentId: null,
      color: 'blue'
    },
    {
      id: 'bag-2',
      name: 'Balo xách tay',
      isPouch: false,
      parentId: null,
      color: 'slate'
    },
    {
      id: 'pouch-1',
      name: 'Túi mỹ phẩm & Skincare',
      isPouch: true,
      parentId: 'bag-1', // Nested inside bag-1!
      color: 'teal'
    },
    {
      id: 'pouch-2',
      name: 'Túi phụ kiện công nghệ',
      isPouch: true,
      parentId: 'bag-2', // Nested inside bag-2!
      color: 'indigo'
    },
    {
      id: 'pouch-3',
      name: 'Túi thuốc y tế',
      isPouch: true,
      parentId: null, // Standalone on workspace
      color: 'rose'
    }
  ],
  items: [
    // Inside Vali (bag-1)
    { id: 'item-1', name: 'Áo thun cotton', quantity: 4, containerId: 'bag-1', isPacked: true },
    { id: 'item-2', name: 'Quần short / váy dạo mát', quantity: 3, containerId: 'bag-1', isPacked: true },
    { id: 'item-3', name: 'Giày thể thao', quantity: 1, containerId: 'bag-1', isPacked: false },
    
    // Inside Pouch 1 (Túi mỹ phẩm, which is in bag-1)
    { id: 'item-4', name: 'Kem chống nắng SPF50', quantity: 1, containerId: 'pouch-1', isPacked: true },
    { id: 'item-5', name: 'Bàn chải & kem đánh răng', quantity: 1, containerId: 'pouch-1', isPacked: true },
    { id: 'item-6', name: 'Sữa rửa mặt', quantity: 1, containerId: 'pouch-1', isPacked: false },

    // Inside Balo (bag-2)
    { id: 'item-7', name: 'Hộ chiếu & CCCD', quantity: 1, containerId: 'bag-2', isPacked: true },
    { id: 'item-8', name: 'Ví tiền mặt', quantity: 1, containerId: 'bag-2', isPacked: true },

    // Inside Pouch 2 (Túi công nghệ, in bag-2)
    { id: 'item-9', name: 'Sạc dự phòng 20.000mAh', quantity: 1, containerId: 'pouch-2', isPacked: true },
    { id: 'item-10', name: 'Cáp sạc điện thoại & củ sạc', quantity: 2, containerId: 'pouch-2', isPacked: false },
    { id: 'item-11', name: 'Tai nghe Bluetooth', quantity: 1, containerId: 'pouch-2', isPacked: true },

    // Inside Pouch 3 (Túi thuốc y tế, standalone)
    { id: 'item-12', name: 'Thuốc hạ sốt Panadol', quantity: 1, containerId: 'pouch-3', isPacked: false },
    { id: 'item-13', name: 'Băng dán cá nhân Urgo', quantity: 5, containerId: 'pouch-3', isPacked: false },

    // Unassigned (Chưa xếp vào túi nào)
    { id: 'item-14', name: 'Kính râm chống nắng', quantity: 1, containerId: null, isPacked: false },
    { id: 'item-15', name: 'Mũ rộng vành đi biển', quantity: 1, containerId: null, isPacked: false }
  ]
};

export function loadTrip(): SimpleTripPlan {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.bags) && Array.isArray(parsed.items)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error loading trip:', err);
  }
  return DEFAULT_PLAN;
}

export function saveTrip(plan: SimpleTripPlan): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
  } catch (err) {
    console.error('Error saving trip:', err);
  }
}
