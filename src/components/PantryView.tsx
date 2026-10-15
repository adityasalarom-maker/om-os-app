import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type PantryItem } from '../db';
import { 
  UtensilsCrossed, 
  Plus, 
  AlertTriangle, 
  CheckCircle2, 
  Package, 
  Trash2, 
  Edit2 
} from 'lucide-react';

export const PantryView: React.FC = () => {
  const [selectedCat, setSelectedCat] = useState<string>('All');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState<PantryItem['category']>('Grains & Pulses');
  const [qty, setQty] = useState('');
  const [reorder, setReorder] = useState('');
  const [storage, setStorage] = useState<PantryItem['storageType']>('Pantry');

  const items = useLiveQuery(() => db.pantry.toArray(), []) || [];

  const handleUpdateStatus = async (id: string, status: PantryItem['status']) => {
    await db.pantry.update(id, { status, updatedAt: Date.now() });
  };

  const handleDelete = async (id: string) => {
    await db.pantry.delete(id);
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const now = Date.now();
    await db.pantry.add({
      id: `pantry-${now}`,
      itemName: name.trim(),
      category,
      currentQty: qty.trim() || '1 unit',
      reorderPoint: reorder.trim() || '0.5 unit',
      status: 'In Stock',
      storageType: storage,
      updatedAt: now
    });

    setName('');
    setQty('');
    setReorder('');
    setShowAddModal(false);
  };

  const filteredItems = items.filter(i => selectedCat === 'All' || i.category === selectedCat);

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#181a24] p-5 rounded-2xl border border-[#272b3b]">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <UtensilsCrossed className="text-amber-400" size={22} />
            <span>Kitchen Operations & Pantry Inventory</span>
          </h2>
          <p className="text-gray-400 text-xs mt-1">
            Track daily groceries, spices, oils, herbs, and reorder thresholds without stockouts.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-600/30 flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>Add Pantry Item</span>
        </button>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {['All', 'Grains & Pulses', 'Spices & Oils', 'Fresh Fruits & Veg', 'Dairy & Essentials', 'Herbs & Supplements'].map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCat(cat)}
            className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors ${
              selectedCat === cat
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-[#181a24] text-gray-400 hover:text-white border border-[#272b3b]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Items Table / Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map(item => {
          const isLow = item.status === 'Low' || item.status === 'Need to Order';
          return (
            <div
              key={item.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                isLow
                  ? 'bg-[#221c1f] border-rose-500/30 shadow-sm'
                  : 'bg-[#181a24] border-[#272b3b]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-[10px] text-gray-400 mb-2">
                  <span className="font-mono bg-[#141622] px-2 py-0.5 rounded border border-[#282d3e]">
                    {item.category}
                  </span>
                  <span className={`font-mono px-2 py-0.5 rounded font-bold ${
                    item.status === 'In Stock'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-300 border border-rose-500/20 animate-pulse'
                  }`}>
                    {item.status}
                  </span>
                </div>
                <h3 className="text-xs font-bold text-white mb-2">
                  {item.itemName}
                </h3>
                <div className="grid grid-cols-2 gap-2 text-[11px] bg-[#141622] p-2.5 rounded-xl border border-[#252a3b] mb-3">
                  <div>
                    <span className="text-gray-500 block text-[10px]">Current Qty:</span>
                    <span className="font-mono font-bold text-white">{item.currentQty}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[10px]">Reorder At:</span>
                    <span className="font-mono text-gray-400">{item.reorderPoint}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#252a3b]">
                <div className="flex items-center gap-1">
                  {(['In Stock', 'Low', 'Need to Order'] as const).map(st => (
                    <button
                      key={st}
                      onClick={() => handleUpdateStatus(item.id, st)}
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded transition-colors ${
                        item.status === st ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="text-gray-500 hover:text-rose-400 p-1"
                  title="Remove item"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1d2c] border border-[#2e344d] w-full max-w-md rounded-2xl p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-4">Add Item to Kitchen Inventory</h3>
            <form onSubmit={handleCreateItem} className="space-y-4">
              <div>
                <label className="text-xs text-gray-300 block mb-1">Item Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Cold-Pressed Mustard Oil"
                  className="w-full bg-[#141622] border border-[#2b3147] rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-300 block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e: any) => setCategory(e.target.value)}
                    className="w-full bg-[#141622] border border-[#2b3147] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Grains & Pulses">Grains & Pulses</option>
                    <option value="Spices & Oils">Spices & Oils</option>
                    <option value="Fresh Fruits & Veg">Fresh Fruits & Veg</option>
                    <option value="Dairy & Essentials">Dairy & Essentials</option>
                    <option value="Herbs & Supplements">Herbs & Supplements</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-300 block mb-1">Storage</label>
                  <select
                    value={storage}
                    onChange={(e: any) => setStorage(e.target.value)}
                    className="w-full bg-[#141622] border border-[#2b3147] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Pantry">Pantry</option>
                    <option value="Fridge">Fridge</option>
                    <option value="Spice Rack">Spice Rack</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-300 block mb-1">Current Quantity</label>
                  <input
                    type="text"
                    required
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    placeholder="e.g. 2 kg or 1 L"
                    className="w-full bg-[#141622] border border-[#2b3147] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-300 block mb-1">Reorder Point</label>
                  <input
                    type="text"
                    required
                    value={reorder}
                    onChange={(e) => setReorder(e.target.value)}
                    placeholder="e.g. 0.5 kg"
                    className="w-full bg-[#141622] border border-[#2b3147] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#2b3147]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-md shadow-indigo-600/30"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
