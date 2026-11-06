import React, { useState, useEffect, useRef } from 'react';
import { 
  Luggage, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Layers, 
  PackageOpen, 
  MoveRight, 
  Sparkles,
  RotateCcw,
  Edit2,
  Check,
  X,
  Package,
  ListPlus,
  Combine,
  Cloud,
  LogOut
} from 'lucide-react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { useAuth } from './context/AuthContext';
import { AuthModal } from './components/AuthModal';
import { handleFirestoreError, OperationType } from './utils/firestoreErrors';
import { LuggageBag, LuggageItem, SimpleTripPlan } from './types/packing';
import { DEFAULT_PLAN, loadTrip, saveTrip } from './utils/storage';
import { BagCard } from './components/BagCard';
import { PouchCard } from './components/PouchCard';
import { ItemCard } from './components/ItemCard';
import { NewContainerModal } from './components/NewContainerModal';
import { NewItemModal } from './components/NewItemModal';
import { ImportItemsModal } from './components/ImportItemsModal';
import { TrashBinZone } from './components/TrashBinZone';
import { useAutoScrollOnDrag } from './utils/useAutoScrollOnDrag';

export default function App() {
  const { user, logout } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const isUpdatingFromCloudRef = useRef(false);

  const [trip, setTrip] = useState<SimpleTripPlan>(loadTrip);

  // Auto-scroll screen when dragging items/pouches near viewport edges
  useAutoScrollOnDrag();

  // Modals
  const [isNewContainerOpen, setIsNewContainerOpen] = useState(false);
  const [newContainerIsPouch, setNewContainerIsPouch] = useState(false);
  const [isNewItemOpen, setIsNewItemOpen] = useState(false);
  const [newItemInitialContainerId, setNewItemInitialContainerId] = useState<string | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Quick inline add item to unassigned shelf
  const [quickItemText, setQuickItemText] = useState('');

  // Title inline editing
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(trip.title);

  // Active drop state for Unassigned shelf or Standalone Pouches shelf
  const [isDropOverUnassigned, setIsDropOverUnassigned] = useState(false);
  const [isDropOverStandalonePouches, setIsDropOverStandalonePouches] = useState(false);
  const [isDropOverBagsWorkspace, setIsDropOverBagsWorkspace] = useState(false);
  const [isDropOverExtractZone, setIsDropOverExtractZone] = useState(false);

  // Feedback Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // 1. Realtime Firestore listener when authenticated
  useEffect(() => {
    if (!user) return;

    setIsSyncing(true);
    const planDocPath = `userPlans/${user.uid}`;
    const planDocRef = doc(db, 'userPlans', user.uid);

    const unsubscribe = onSnapshot(
      planDocRef,
      (docSnap) => {
        setIsSyncing(false);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data && data.title && Array.isArray(data.bags) && Array.isArray(data.items)) {
            isUpdatingFromCloudRef.current = true;
            setTrip({
              title: data.title,
              bags: data.bags,
              items: data.items
            });
            saveTrip({
              title: data.title,
              bags: data.bags,
              items: data.items
            });
            setTimeout(() => {
              isUpdatingFromCloudRef.current = false;
            }, 300);
          }
        } else {
          // New account with no cloud plan yet: migrate current local trip to Firestore
          setDoc(planDocRef, {
            userId: user.uid,
            title: trip.title,
            bags: trip.bags,
            items: trip.items,
            updatedAt: new Date().toISOString()
          }).catch((err) => {
            handleFirestoreError(err, OperationType.WRITE, planDocPath);
          });
        }
      },
      (error) => {
        setIsSyncing(false);
        handleFirestoreError(error, OperationType.GET, planDocPath);
      }
    );

    setToastMessage(`Đã kết nối: ${user.email || user.displayName || 'Tài khoản'}. Dữ liệu tự động đồng bộ đám mây!`);

    return () => unsubscribe();
  }, [user]);

  // 2. Auto-save to localStorage, and sync to Firestore when user is authenticated
  useEffect(() => {
    saveTrip(trip);

    if (!user || isUpdatingFromCloudRef.current) return;

    const timer = setTimeout(async () => {
      const planDocPath = `userPlans/${user.uid}`;
      try {
        await setDoc(
          doc(db, 'userPlans', user.uid),
          {
            userId: user.uid,
            title: trip.title,
            bags: trip.bags,
            items: trip.items,
            updatedAt: new Date().toISOString()
          },
          { merge: true }
        );
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, planDocPath);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [trip, user]);

  // Derived lists
  const largeBags = trip.bags.filter(b => !b.isPouch);
  const pouches = trip.bags.filter(b => b.isPouch);
  const standalonePouches = pouches.filter(p => p.parentId === null);
  const unassignedItems = trip.items.filter(i => i.containerId === null);

  // --- Handlers for Items ---
  const handleMoveItem = (itemId: string, targetContainerId: string | null) => {
    setTrip(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.id === itemId ? { ...item, containerId: targetContainerId } : item
      )
    }));
  };

  const handleTogglePacked = (itemId: string) => {
    setTrip(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.id === itemId ? { ...item, isPacked: !item.isPacked } : item
      )
    }));
  };

  const handleDeleteItem = (itemId: string) => {
    setTrip(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId)
    }));
  };

  const handleRestoreItem = (restoredItem: LuggageItem) => {
    setTrip(prev => ({
      ...prev,
      items: [restoredItem, ...prev.items]
    }));
  };

  const handleUpdateItemQuantity = (itemId: string, newQuantity: number) => {
    const validQty = Math.max(1, Math.min(999, Math.floor(newQuantity) || 1));
    setTrip(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.id === itemId ? { ...item, quantity: validQty } : item
      )
    }));
  };

  const handleUpdateBagWidth = (bagId: string, width: number) => {
    setTrip(prev => ({
      ...prev,
      bags: prev.bags.map(b => b.id === bagId ? { ...b, customWidth: width } : b)
    }));
  };

  const handleSetAllBagsWidth = (width: number) => {
    setTrip(prev => ({
      ...prev,
      bags: prev.bags.map(b => (!b.isPouch ? { ...b, customWidth: width } : b))
    }));
  };

  const handleUpdateItemName = (itemId: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setTrip(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.id === itemId ? { ...item, name: trimmed } : item
      )
    }));
  };

  const handleImportItemList = (
    importedItems: Array<{ name: string; quantity: number }>,
    targetContainerId: string | null
  ) => {
    const newItems: LuggageItem[] = importedItems.map((item, idx) => ({
      id: `item-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      name: item.name,
      quantity: Math.max(1, Math.min(999, Math.floor(item.quantity) || 1)),
      containerId: targetContainerId,
      isPacked: false
    }));

    setTrip(prev => ({
      ...prev,
      items: [...newItems, ...prev.items]
    }));
  };

  const handleAddItem = (name: string, quantity: number, containerId: string | null) => {
    const newItem: LuggageItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name,
      quantity,
      containerId,
      isPacked: false
    };
    setTrip(prev => ({
      ...prev,
      items: [newItem, ...prev.items]
    }));
  };

  const handleQuickAddUnassigned = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickItemText.trim()) {
      handleAddItem(quickItemText.trim(), 1, null);
      setQuickItemText('');
    }
  };

  // --- Handlers for Pouches & Bags ---
  // Convert a pouch (nested or standalone) to an independent large Bag (parentId: null, isPouch: false).
  // CRITICAL: Items inside that pouch are NEVER changed; they stay safely in containerId = containerId!
  const handleConvertPouchToBag = (containerId: string) => {
    const targetPouch = trip.bags.find(b => b.id === containerId);
    const pouchName = targetPouch ? targetPouch.name : 'Pouch';

    setTrip(prev => ({
      ...prev,
      bags: prev.bags.map(b => {
        if (b.id !== containerId) return b;
        return { ...b, parentId: null, isPouch: false };
      })
    }));

    setToastMessage(`Đã tách "${pouchName}" ra ngoài thành 1 Túi lớn riêng biệt (đồ vẫn giữ nguyên 100%)!`);
  };

  // Move a pouch to the standalone shelf outside of all large bags (parentId: null, isPouch: true)
  const handleMoveToStandalonePouch = (containerId: string) => {
    const targetPouch = trip.bags.find(b => b.id === containerId);
    const pouchName = targetPouch ? targetPouch.name : 'Pouch';

    setTrip(prev => ({
      ...prev,
      bags: prev.bags.map(b => {
        if (b.id !== containerId) return b;
        return { ...b, parentId: null, isPouch: true };
      })
    }));

    setToastMessage(`Đã chuyển "${pouchName}" ra kệ Pouch bên ngoài!`);
  };

  // Move a pouch into a parent bag (isPouch = true, parentId = targetBagId)
  // Or if targetParentLargeBagId is null, convert it to an independent Bag.
  const handleMovePouch = (containerId: string, targetParentLargeBagId: string | null) => {
    if (targetParentLargeBagId === null) {
      handleConvertPouchToBag(containerId);
      return;
    }

    const targetPouch = trip.bags.find(b => b.id === containerId);
    const targetParent = trip.bags.find(b => b.id === targetParentLargeBagId);
    const pouchName = targetPouch ? targetPouch.name : 'Pouch';
    const parentName = targetParent ? targetParent.name : 'Vali';

    setTrip(prev => ({
      ...prev,
      bags: prev.bags.map(b => {
        if (b.id !== containerId) return b;
        return { ...b, parentId: targetParentLargeBagId, isPouch: true };
      })
    }));

    setToastMessage(`Đã xếp cả "${pouchName}" vào trong "${parentName}" (đồ vẫn ở nguyên trong pouch)!`);
  };

  // Merge one container (source) into another (target).
  // All items in source move to target, and source is removed.
  const handleMergeContainers = (sourceContainerId: string, targetContainerId: string) => {
    if (sourceContainerId === targetContainerId) return;

    const sourceBag = trip.bags.find(b => b.id === sourceContainerId);
    const targetBag = trip.bags.find(b => b.id === targetContainerId);
    if (!sourceBag || !targetBag) return;

    const sourceItems = trip.items.filter(i => i.containerId === sourceContainerId);
    const count = sourceItems.length;

    setTrip(prev => {
      // 1. Reassign all items from source to target
      const updatedItems = prev.items.map(item =>
        item.containerId === sourceContainerId
          ? { ...item, containerId: targetContainerId }
          : item
      );

      // 2. If source had any nested pouches, reassign them to target
      const updatedBags = prev.bags
        .filter(b => b.id !== sourceContainerId)
        .map(b => b.parentId === sourceContainerId 
          ? { ...b, parentId: targetBag.isPouch ? targetBag.parentId : targetBag.id } 
          : b
        );

      return {
        ...prev,
        bags: updatedBags,
        items: updatedItems
      };
    });

    setToastMessage(`Đã gộp "${sourceBag.name}" vào "${targetBag.name}" (${count} món đồ)!`);
  };

  // Unpack a nested pouch directly into its parent bag
  const handleUnpackIntoParentBag = (pouchId: string) => {
    const pouch = trip.bags.find(b => b.id === pouchId);
    if (!pouch || !pouch.parentId) return;
    handleMergeContainers(pouchId, pouch.parentId);
  };

  const handleAddContainer = (name: string, isPouch: boolean, parentId: string | null, color: string) => {
    const newBag: LuggageBag = {
      id: `bag-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name,
      isPouch,
      parentId,
      color
    };
    setTrip(prev => ({
      ...prev,
      bags: [...prev.bags, newBag]
    }));
  };

  const handleDeleteBag = (bagId: string) => {
    setTrip(prev => {
      // 1. Remove this bag
      const nextBags = prev.bags.filter(b => b.id !== bagId);
      // 2. If it had nested pouches, set their parentId = null (move outside)
      const unnestedPouches = nextBags.map(b => b.parentId === bagId ? { ...b, parentId: null } : b);
      // 3. Move items inside this bag to unassigned
      const nextItems = prev.items.map(i => i.containerId === bagId ? { ...i, containerId: null } : i);

      return {
        ...prev,
        bags: unnestedPouches,
        items: nextItems
      };
    });
  };

  const handleDeletePouch = (pouchId: string) => {
    setTrip(prev => ({
      ...prev,
      bags: prev.bags.filter(b => b.id !== pouchId),
      // Move items in that pouch to unassigned
      items: prev.items.map(i => i.containerId === pouchId ? { ...i, containerId: null } : i)
    }));
  };

  const handleUpdateBagName = (bagId: string, newName: string) => {
    setTrip(prev => ({
      ...prev,
      bags: prev.bags.map(b => b.id === bagId ? { ...b, name: newName } : b)
    }));
  };

  const handleSaveTitle = () => {
    if (titleInput.trim()) {
      setTrip(prev => ({ ...prev, title: titleInput.trim() }));
    }
    setIsEditingTitle(false);
  };

  const handleResetToDefault = () => {
    if (confirm('Khôi phục về danh sách mẫu ban đầu?')) {
      setTrip(DEFAULT_PLAN);
    }
  };

  // Dropping on the "Đồ chưa xếp" shelf
  const handleDropOnUnassigned = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDropOverUnassigned(false);
    try {
      const raw = e.dataTransfer.getData('application/json');
      if (raw) {
        const data = JSON.parse(raw);
        if (data.type === 'item') {
          handleMoveItem(data.id, null);
        }
      }
    } catch {
      const itemId = e.dataTransfer.getData('text/plain');
      if (itemId) handleMoveItem(itemId, null);
    }
  };

  // Dropping on the "Pouch bên ngoài" shelf
  const handleDropOnStandalonePouches = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDropOverStandalonePouches(false);
    try {
      const raw = e.dataTransfer.getData('application/json');
      if (raw) {
        const data = JSON.parse(raw);
        if (data.type === 'pouch' || data.type === 'bag') {
          handleMoveToStandalonePouch(data.id);
        }
      }
    } catch {
      const pouchId = e.dataTransfer.getData('text/plain');
      if (pouchId) handleMoveToStandalonePouch(pouchId);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100/70 text-stone-900 font-sans antialiased flex flex-col">
      {/* 1. CLEAN TOP BAR */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-30 shadow-2xs">
        <div className="w-full max-w-[1840px] mx-auto px-2.5 sm:px-4 lg:px-6 py-2 sm:py-0 sm:h-16 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
          {/* Brand + Trip Title */}
          <div className="flex items-center justify-between sm:justify-start gap-2.5 sm:gap-3 min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-400 text-stone-900 flex items-center justify-center font-black text-xs sm:text-sm shadow-xs shrink-0 tracking-tight">
                TT
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
                <span className="font-extrabold text-stone-900 tracking-tight text-sm sm:text-base whitespace-nowrap">
                  Thu Thảo đi đâu đấy?
                </span>
                <span className="text-stone-300 hidden md:inline">/</span>

                {isEditingTitle ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={titleInput}
                      onChange={(e) => setTitleInput(e.target.value)}
                      className="px-2 py-0.5 text-xs sm:text-sm font-semibold border border-stone-300 rounded-lg bg-white w-28 sm:w-48"
                      autoFocus
                    />
                    <button onClick={handleSaveTitle} className="p-1 bg-stone-900 text-white rounded-lg">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setIsEditingTitle(false)} className="p-1 text-stone-500 hover:bg-stone-100 rounded-lg">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 min-w-0">
                    <span className="text-xs sm:text-sm font-medium text-stone-600 truncate bg-stone-100 px-2 py-0.5 rounded-md border border-stone-200 max-w-[110px] sm:max-w-[200px]">
                      {trip.title}
                    </span>
                    <button
                      onClick={() => {
                        setTitleInput(trip.title);
                        setIsEditingTitle(true);
                      }}
                      className="p-1 text-stone-400 hover:text-stone-700 rounded"
                      title="Đổi tên chuyến đi"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Primary Action Buttons & Cloud Sync */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 justify-end w-full sm:w-auto flex-wrap sm:flex-nowrap">
            {/* Account & Multi-device Cloud Sync */}
            {user ? (
              <div className="flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200/80 px-2.5 py-1.5 rounded-xl border border-stone-200 text-xs shrink-0 transition-colors">
                <span className={`w-2 h-2 rounded-full shrink-0 ${isSyncing ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'}`} />
                <Cloud className="w-3.5 h-3.5 text-stone-600 shrink-0" />
                <span 
                  className="font-semibold text-stone-800 max-w-[100px] sm:max-w-[140px] truncate" 
                  title={user.email || 'Tài khoản'}
                >
                  {user.displayName || user.email?.split('@')[0]}
                </span>
                <button
                  type="button"
                  onClick={async () => {
                    await logout();
                    setToastMessage('Đã đăng xuất tài khoản.');
                  }}
                  className="ml-0.5 p-0.5 text-stone-400 hover:text-stone-700 rounded cursor-pointer shrink-0"
                  title="Đăng xuất khỏi thiết bị này"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                className="px-2.5 sm:px-3 py-1.5 text-xs font-bold text-amber-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0"
                title="Đăng ký hoặc đăng nhập để lưu trữ dữ liệu vào database và dùng trên nhiều thiết bị"
              >
                <Cloud className="w-3.5 h-3.5" />
                <span>Đăng nhập / Đăng ký</span>
              </button>
            )}

            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex-1 sm:flex-initial px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 rounded-lg transition-colors flex items-center justify-center gap-1 sm:gap-1.5 whitespace-nowrap cursor-pointer shadow-2xs"
              title="Nhập nhanh danh sách nhiều món đồ cùng lúc (mỗi dòng 1 món)"
            >
              <ListPlus className="w-3.5 h-3.5 text-amber-700" />
              <span className="sm:inline hidden">Import danh sách</span>
              <span className="sm:hidden">Import</span>
            </button>

            <button
              onClick={() => {
                setNewContainerIsPouch(false);
                setIsNewContainerOpen(true);
              }}
              className="flex-1 sm:flex-initial px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-stone-800 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors flex items-center justify-center gap-1 sm:gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-stone-600" />
              <span className="sm:inline hidden">+ Thêm Túi / Vali</span>
              <span className="sm:hidden">+ Túi/Vali</span>
            </button>

            <button
              onClick={() => {
                setNewContainerIsPouch(true);
                setIsNewContainerOpen(true);
              }}
              className="flex-1 sm:flex-initial px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200/80 rounded-lg transition-colors flex items-center justify-center gap-1 sm:gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-teal-700" />
              <span className="sm:inline hidden">+ Thêm Pouch nhỏ</span>
              <span className="sm:hidden">+ Pouch</span>
            </button>

            <button
              onClick={() => {
                setNewItemInitialContainerId(null);
                setIsNewItemOpen(true);
              }}
              className="flex-1 sm:flex-initial px-3 sm:px-3.5 py-1.5 text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 rounded-lg transition-colors shadow-xs flex items-center justify-center gap-1 sm:gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Thêm Đồ</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. MAIN WORKSPACE WITH LEFT COLUMN */}
      <main className="w-full max-w-[1840px] mx-auto px-2.5 sm:px-4 lg:px-5 py-3 sm:py-4 flex-1 lg:pr-32 xl:pr-36 pb-24 sm:pb-12">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-5 items-start w-full">
          {/* CỘT BÊN TRÁI: ĐỒ CHƯA XẾP VÀO TÚI */}
          <section
            onDragOver={(e) => {
              e.preventDefault();
              setIsDropOverUnassigned(true);
            }}
            onDragLeave={() => setIsDropOverUnassigned(false)}
            onDrop={handleDropOnUnassigned}
            className={`w-full lg:w-64 xl:w-72 shrink-0 lg:sticky lg:top-20 z-10 p-3 sm:p-3.5 rounded-2xl border-2 transition-all flex flex-col bg-white shadow-xs ${
              isDropOverUnassigned
                ? 'border-amber-500 bg-amber-50/80 ring-4 ring-amber-400/20'
                : 'border-stone-200 hover:border-stone-300'
            }`}
          >
            <div className="flex items-center justify-between pb-2.5 border-b border-stone-100 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                <h2 className="text-sm font-bold text-stone-900">
                  Đồ chưa xếp ({unassignedItems.length})
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(true)}
                className="px-2 py-1 text-[11px] font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 rounded-lg transition-colors flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs"
                title="Dán danh sách nhiều món đồ (mỗi dòng 1 món)"
              >
                <ListPlus className="w-3 h-3 text-amber-700" />
                <span>Import</span>
              </button>
            </div>

            {/* Quick inline input */}
            <form onSubmit={handleQuickAddUnassigned} className="flex items-center gap-1.5 mb-3 w-full">
              <input
                type="text"
                value={quickItemText}
                onChange={(e) => setQuickItemText(e.target.value)}
                placeholder="Nhập tên món đồ..."
                className="px-2.5 py-1.5 text-xs border border-stone-300 rounded-lg bg-stone-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-900 flex-1 min-w-0"
              />
              <button
                type="submit"
                className="px-2.5 py-1.5 text-xs font-bold text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                + Thêm
              </button>
            </form>

            {/* List of unassigned items */}
            <div className="flex-1 max-h-[50vh] lg:max-h-[calc(100vh-250px)] overflow-y-auto pr-1">
              {unassignedItems.length === 0 ? (
                <div className="py-6 text-center text-xs text-stone-400 border border-dashed border-stone-200 rounded-xl flex flex-col items-center justify-center">
                  <PackageOpen className="w-5 h-5 text-stone-300 mb-1" />
                  <span>Hàng đợi trống.</span>
                  <span className="text-[11px] text-stone-400">Tất cả đồ đã được xếp vào túi!</span>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 items-center content-start">
                  {unassignedItems.map(item => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      allBags={trip.bags}
                      onTogglePacked={handleTogglePacked}
                      onDeleteItem={handleDeleteItem}
                      onMoveItem={handleMoveItem}
                      onUpdateQuantity={handleUpdateItemQuantity}
                      onUpdateName={handleUpdateItemName}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* CỘT BÊN PHẢI: VALI LỚN & POUCH NHỎ */}
          <div className="flex-1 min-w-0 space-y-4 sm:space-y-6 w-full">

        {/* SECTION 1: CÁC TÚI LỚN & VALI CHÍNH */}
        <section
          onDragOver={(e) => {
            e.preventDefault();
            setIsDropOverBagsWorkspace(true);
          }}
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
              setIsDropOverBagsWorkspace(false);
            }
          }}
          onDrop={(e) => {
            e.preventDefault();
            setIsDropOverBagsWorkspace(false);
            setIsDropOverExtractZone(false);
            try {
              const raw = e.dataTransfer.getData('application/json');
              if (raw) {
                const data = JSON.parse(raw);
                if (data.type === 'pouch' || data.type === 'bag') {
                  // Dragging a pouch out into the empty workspace turns it into an independent bag!
                  handleConvertPouchToBag(data.id);
                  return;
                }
              }
            } catch {
              const id = e.dataTransfer.getData('text/plain');
              if (id) {
                const isBagOrPouch = trip.bags.some(b => b.id === id);
                if (isBagOrPouch) {
                  handleConvertPouchToBag(id);
                }
              }
            }
          }}
          className={`space-y-3 p-3 sm:p-4 rounded-2xl border-2 transition-all ${
            isDropOverBagsWorkspace
              ? 'border-indigo-400 bg-indigo-50/40 ring-4 ring-indigo-300/20'
              : 'border-transparent'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <Luggage className="w-4 h-4 text-stone-700" />
              <h2 className="text-sm font-bold text-stone-900">
                Các Túi lớn, Vali & Thùng đựng ({largeBags.length})
              </h2>
            </div>

            {/* Quick width presets */}
            <div className="flex items-center gap-2 text-xs">
              <div className="flex items-center bg-white border border-stone-200 rounded-lg p-0.5 shadow-2xs">
                <button
                  type="button"
                  onClick={() => handleSetAllBagsWidth(360)}
                  className="px-2 py-0.5 text-[11px] font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded cursor-pointer"
                  title="Đặt cỡ chuẩn (360px)"
                >
                  Chuẩn
                </button>
                <button
                  type="button"
                  onClick={() => handleSetAllBagsWidth(480)}
                  className="px-2 py-0.5 text-[11px] font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded cursor-pointer"
                  title="Đặt cỡ rộng (480px)"
                >
                  Rộng
                </button>
                <button
                  type="button"
                  onClick={() => handleSetAllBagsWidth(680)}
                  className="px-2 py-0.5 text-[11px] font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded cursor-pointer"
                  title="Đặt cỡ rất rộng (680px)"
                >
                  Rất rộng
                </button>
              </div>
            </div>
          </div>

          {largeBags.length === 0 ? (
            <div className="p-8 text-center bg-white border border-dashed border-stone-300 rounded-2xl text-stone-500 space-y-2">
              <Luggage className="w-8 h-8 text-stone-400 mx-auto" />
              <p className="text-xs">Chưa có túi lớn hoặc vali nào.</p>
              <button
                onClick={() => {
                  setNewContainerIsPouch(false);
                  setIsNewContainerOpen(true);
                }}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-stone-900 rounded-lg hover:bg-stone-800 cursor-pointer"
              >
                + Thêm Vali / Túi lớn đầu tiên
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-4 sm:gap-5 items-start">
              {largeBags.map(bag => {
                const directItems = trip.items.filter(i => i.containerId === bag.id);
                const nestedPouches = pouches.filter(p => p.parentId === bag.id);

                return (
                  <BagCard
                    key={bag.id}
                    bag={bag}
                    directItems={directItems}
                    nestedPouches={nestedPouches}
                    allItems={trip.items}
                    allBags={trip.bags}
                    onMoveItem={handleMoveItem}
                    onTogglePacked={handleTogglePacked}
                    onDeleteItem={handleDeleteItem}
                    onMovePouch={handleMovePouch}
                    onDeletePouch={handleDeletePouch}
                    onUpdatePouchName={(id, name) => handleUpdateBagName(id, name)}
                    onDeleteBag={handleDeleteBag}
                    onUpdateBagName={handleUpdateBagName}
                    onUpdateQuantity={handleUpdateItemQuantity}
                    onUpdateBagWidth={handleUpdateBagWidth}
                    onUpdateItemName={handleUpdateItemName}
                    onConvertToBag={handleConvertPouchToBag}
                    onMergePouch={handleMergeContainers}
                    onUnpackIntoParentBag={handleUnpackIntoParentBag}
                  />
                );
              })}

              {/* Dedicated Visual Drop Target to turn Pouch into Bag */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDropOverExtractZone(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDropOverExtractZone(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDropOverExtractZone(false);
                  try {
                    const raw = e.dataTransfer.getData('application/json');
                    if (raw) {
                      const data = JSON.parse(raw);
                      if (data.type === 'pouch' || data.type === 'bag') {
                        handleConvertPouchToBag(data.id);
                        return;
                      }
                    }
                  } catch {
                    const id = e.dataTransfer.getData('text/plain');
                    if (id) handleConvertPouchToBag(id);
                  }
                }}
                className={`min-h-[220px] w-64 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-5 text-center transition-all cursor-pointer ${
                  isDropOverExtractZone
                    ? 'border-indigo-600 bg-indigo-100/90 text-indigo-900 scale-102 ring-4 ring-indigo-300/50 shadow-md'
                    : 'border-stone-300 bg-stone-50/70 hover:border-indigo-400 hover:bg-indigo-50/30 text-stone-600'
                }`}
                onClick={() => {
                  setNewContainerIsPouch(false);
                  setIsNewContainerOpen(true);
                }}
                title="Kéo thả Pouch vào đây để biến thành Túi lớn, hoặc bấm để tạo thêm Túi/Vali mới"
              >
                <div className="w-10 h-10 rounded-xl bg-white shadow-xs border border-stone-200 flex items-center justify-center mb-2.5 text-indigo-600">
                  <Luggage className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold text-stone-800 mb-1">
                  Kéo Pouch thả vào đây
                </div>
                <p className="text-[11px] text-stone-500 leading-relaxed mb-3">
                  Pouch sẽ tự động tách ra thành <strong className="text-indigo-600 font-semibold">1 Túi lớn riêng biệt</strong> (toàn bộ đồ bên trong vẫn giữ nguyên 100%)
                </p>
                <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200/60">
                  + Hoặc bấm tạo Vali mới
                </span>
              </div>
            </div>
          )}
        </section>

        {/* SECTION 2: CÁC POUCH NHỎ ĐỂ NGOÀI (Chưa xếp vào túi lớn nào) */}
        <section
          onDragOver={(e) => {
            e.preventDefault();
            setIsDropOverStandalonePouches(true);
          }}
          onDragLeave={() => setIsDropOverStandalonePouches(false)}
          onDrop={handleDropOnStandalonePouches}
          className={`p-4 sm:p-5 rounded-2xl border-2 transition-all space-y-3 ${
            isDropOverStandalonePouches
              ? 'border-teal-500 bg-teal-50/50 ring-4 ring-teal-400/20'
              : 'border-stone-200 bg-white shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <div>
              <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-teal-700" />
                <span>Pouch nhỏ để ngoài ({standalonePouches.length})</span>
              </h2>
            </div>

            <button
              onClick={() => {
                setNewContainerIsPouch(true);
                setIsNewContainerOpen(true);
              }}
              className="px-3 py-1.5 text-xs font-semibold text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Thêm Pouch</span>
            </button>
          </div>

          {standalonePouches.length === 0 ? (
            <div className="py-6 text-center text-xs text-stone-400 border border-dashed border-stone-200 rounded-xl">
              Tất cả pouch nhỏ đã được kéo thả xếp gọn vào trong các vali lớn bên trên.
              <br />
              <span className="text-[11px] text-stone-400">
                (Muốn lấy pouch nào ra ngoài thành túi lớn riêng, bạn có thể kéo thả pouch đó ra khu vực các túi bên trên).
              </span>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3 items-start">
              {standalonePouches.map(pouch => (
                <PouchCard
                  key={pouch.id}
                  pouch={pouch}
                  items={trip.items.filter(i => i.containerId === pouch.id)}
                  allBags={trip.bags}
                  isNested={false}
                  onMoveItem={handleMoveItem}
                  onTogglePacked={handleTogglePacked}
                  onDeleteItem={handleDeleteItem}
                  onMovePouch={handleMovePouch}
                  onDeletePouch={handleDeletePouch}
                  onUpdatePouchName={(id, name) => handleUpdateBagName(id, name)}
                  onUpdateQuantity={handleUpdateItemQuantity}
                  onUpdateBagWidth={handleUpdateBagWidth}
                  onUpdateItemName={handleUpdateItemName}
                  onConvertToBag={handleConvertPouchToBag}
                  onMergePouch={handleMergeContainers}
                />
              ))}
            </div>
          )}
        </section>
          </div>
        </div>
      </main>

      {/* 3. CLEAN FOOTER */}
      <footer className="border-t border-stone-200 py-3 sm:py-4 px-3 sm:px-6 text-xs text-stone-500 bg-white">
        <div className="w-full max-w-[1840px] mx-auto flex items-center justify-between">
          <span>Thu Thảo đi đâu đấy? · Sắp xếp đồ du lịch & lồng ghép pouch trực quan</span>
          <button
            onClick={handleResetToDefault}
            className="text-stone-400 hover:text-stone-700 flex items-center gap-1 text-[11px] cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Khôi phục mẫu mặc định</span>
          </button>
        </div>
      </footer>

      {/* FLOATING RIGHT TRASH BIN ZONE */}
      <TrashBinZone
        onDeleteItem={handleDeleteItem}
        onDeletePouch={handleDeletePouch}
        onDeleteBag={handleDeleteBag}
        items={trip.items}
        bags={trip.bags}
        onRestoreItem={handleRestoreItem}
      />

      {/* TOAST NOTIFICATION FOR MERGE / ACTIONS */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-stone-900/95 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold backdrop-blur-xs border border-stone-700 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <Combine className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-stone-400 hover:text-white cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* MODALS */}
      <NewContainerModal
        isOpen={isNewContainerOpen}
        onClose={() => setIsNewContainerOpen(false)}
        allBags={trip.bags}
        initialIsPouch={newContainerIsPouch}
        onAddContainer={handleAddContainer}
      />

      <NewItemModal
        isOpen={isNewItemOpen}
        onClose={() => setIsNewItemOpen(false)}
        allBags={trip.bags}
        initialContainerId={newItemInitialContainerId}
        onAddItem={handleAddItem}
      />

      <ImportItemsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        allBags={trip.bags}
        onImportItems={handleImportItemList}
      />

      {/* AUTH MODAL FOR DATABASE & MULTI-DEVICE CLOUD SYNC */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}
