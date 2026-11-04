export interface LuggageBag {
  id: string;
  name: string;
  isPouch: boolean; // false = Túi lớn / Vali / Thùng; true = Pouch nhỏ / Túi con
  parentId: string | null; // Nếu là pouch: null = ở ngoài sàn; hoặc ID của túi lớn chứa nó
  color: string;
}

export interface LuggageItem {
  id: string;
  name: string;
  quantity: number;
  containerId: string | null; // null = Chưa xếp túi; hoặc ID của túi lớn / pouch
  isPacked?: boolean;
}

export interface SimpleTripPlan {
  title: string;
  bags: LuggageBag[];
  items: LuggageItem[];
}
