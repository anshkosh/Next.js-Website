"use client";

import { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit2, Trash2, Search, X } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { createCategory, updateCategory, deleteCategory } from "@/app/actions/category.actions";
import type { Prisma } from "@prisma/client";
import type { LucideProps } from "lucide-react";

type ManagedCategory = Prisma.CategoryGetPayload<{ include: { _count: { select: { startups: true } } } }>;

const CURATED_ICONS = [
  "Banknote", "GraduationCap", "HeartPulse", "ShoppingCart", "Cloud",
  "Sprout", "Bot", "Truck", "Gamepad2", "Building", "Car", "Laptop",
  "Smartphone", "Wifi", "Activity", "Briefcase", "Coins", "CreditCard",
  "DollarSign", "Factory", "Globe", "Lightbulb", "Microscope", "Rocket",
  "Server", "Shield", "Users", "Zap", "Monitor", "Code", "Cpu", "Database"
];

function DynamicIcon({ name, ...props }: { name: string } & LucideProps) {
  const Icon = LucideIcons.icons[name as keyof typeof LucideIcons.icons];
  return Icon ? <Icon {...props} /> : <span>{name}</span>;
}

function IconPickerModal({ isOpen, onClose, onSelect }: { isOpen: boolean, onClose: () => void, onSelect: (name: string) => void }) {
  const [search, setSearch] = useState("");
  
  const allIconNames = useMemo(() => {
    return Object.keys(LucideIcons.icons);
  }, []);

  const otherIconNames = useMemo(() => {
    const curatedSet = new Set(CURATED_ICONS);
    return allIconNames.filter(name => !curatedSet.has(name));
  }, [allIconNames]);

  const searchedIcons = useMemo(() => {
    if (!search.trim()) return null;
    const lowerSearch = search.toLowerCase();
    return allIconNames.filter(name => name.toLowerCase().includes(lowerSearch));
  }, [search, allIconNames]);

  if (!isOpen) return null;

  const renderIconList = (icons: string[]) => (
    <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
      {icons.map((iconName) => (
        <button
          key={iconName}
          type="button"
          onClick={() => {
            onSelect(iconName);
            onClose();
            setSearch(""); // reset search
          }}
          className="flex flex-col items-center justify-center p-2 rounded-md hover:bg-gray-100 transition-colors gap-1 border border-transparent hover:border-gray-200"
          title={iconName}
        >
          <DynamicIcon name={iconName} size={24} className="text-gray-700" />
        </button>
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-xl flex flex-col max-h-[80vh]">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Select Icon</h3>
          <button type="button" onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X size={20} />
          </button>
        </div>
        
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input 
            type="text" 
            placeholder="Search icons..." 
            className="w-full border rounded-md pl-10 pr-4 py-2 outline-none focus:border-coral-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        <div className="flex-1 overflow-y-auto min-h-[300px]">
          {searchedIcons ? (
            <>
              {searchedIcons.length > 0 ? renderIconList(searchedIcons) : (
                <div className="text-center text-gray-500 py-8">No icons found for &quot;{search}&quot;</div>
              )}
            </>
          ) : (
            <>
              <div className="mb-2 text-sm font-semibold text-gray-500">Common Icons</div>
              {renderIconList(CURATED_ICONS)}
              
              <div className="mt-6 mb-2 text-sm font-semibold text-gray-500">All Icons</div>
              {renderIconList(otherIconNames)}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CategoryManager({ initialCategories }: { initialCategories: ManagedCategory[] }) {
  const categories = initialCategories;
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<ManagedCategory | null>(null);
  const [deleteCategoryObj, setDeleteCategoryObj] = useState<ManagedCategory | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [addIconName, setAddIconName] = useState("");
  const [iconPickerTarget, setIconPickerTarget] = useState<'add' | 'edit' | null>(null);

  const handleAddSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    
    const formData = new FormData(e.currentTarget);
    const res = await createCategory(formData);
    
    setIsSubmitting(false);
    if (res.error) {
      setError(res.error);
    } else {
      setIsAddOpen(false);
      window.location.reload();
    }
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editCategory || !editCategory.id) return;

    setIsSubmitting(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    formData.append("id", editCategory.id);
    const res = await updateCategory(formData);

    setIsSubmitting(false);
    if (res.error) {
      setError(res.error);
    } else {
      setEditCategory(null);
      window.location.reload();
    }
  };

  const handleDelete = async () => {
    if (!deleteCategoryObj || !deleteCategoryObj.id) return;

    setIsSubmitting(true);
    setError("");

    const res = await deleteCategory(deleteCategoryObj.id);

    setIsSubmitting(false);
    if (res.error) {
      setError(res.error);
      setDeleteCategoryObj(null);
    } else {
      setDeleteCategoryObj(null);
      window.location.reload();
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-700">Manage Categories</h2>
        <button 
          onClick={() => { setIsAddOpen(true); setAddIconName("CircleDashed"); }}
          className="flex items-center gap-2 px-4 py-2 bg-coral-600 text-white rounded-md font-medium hover:bg-coral-700 transition-colors"
        >
          <Plus size={16} /> Add Category
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md mb-4 border border-red-200">
          {error}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Icon</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Startups</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(categories || []).filter((cat) => cat && cat.id).map((cat) => {
              const startupCount = cat._count?.startups ?? 0;
              return (
                <TableRow key={cat.id}>
                  <TableCell className="text-gray-700">
                    <DynamicIcon name={cat.iconName || "Rocket"} size={24} />
                  </TableCell>
                  <TableCell className="font-medium">{cat.name}</TableCell>
                  <TableCell className="text-gray-500 text-sm">{cat.slug}</TableCell>
                  <TableCell className="max-w-xs truncate text-gray-500">{cat.description}</TableCell>
                  <TableCell>
                    <span className="bg-gray-100 px-2 py-1 rounded-full text-xs font-semibold">
                      {startupCount}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => setEditCategory(cat)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" 
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => {
                          if (startupCount > 0) {
                            alert(`Cannot delete category because it has ${startupCount} startups attached.`);
                          } else {
                            setDeleteCategoryObj(cat);
                          }
                        }}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded disabled:opacity-30" 
                        title="Delete"
                        disabled={startupCount > 0}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {categories.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  No categories found. Create your first one!
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add Dialog */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-xl font-bold mb-4">Add New Category</h3>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input name="name" required className="w-full border rounded-md p-2 outline-none focus:border-coral-500" placeholder="e.g. Fintech" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                <input type="hidden" name="iconName" value={addIconName} />
                <button
                  type="button"
                  onClick={() => setIconPickerTarget('add')}
                  className="w-full border rounded-md p-2 flex items-center justify-between outline-none focus:border-coral-500 hover:bg-gray-50 transition-colors bg-white text-left"
                >
                  <span className="flex items-center gap-2">
                    {addIconName ? <DynamicIcon name={addIconName} size={20} className="text-gray-600" /> : <div className="w-5 h-5 bg-gray-100 rounded-full" />}
                    <span className="text-gray-700">{addIconName || "Select an icon"}</span>
                  </span>
                  <Edit2 size={14} className="text-gray-500" />
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea name="description" className="w-full border rounded-md p-2 h-24 outline-none focus:border-coral-500" placeholder="Startups in financial tech..."></textarea>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsAddOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md font-medium">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-coral-600 text-white rounded-md font-medium hover:bg-coral-700 disabled:opacity-50">
                  {isSubmitting ? "Creating..." : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      {editCategory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-xl font-bold mb-4">Edit Category</h3>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input name="name" defaultValue={editCategory.name.replace(/[^A-Za-z0-9 /\-&]/g, '').trim()} required className="w-full border rounded-md p-2 outline-none focus:border-coral-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                <input type="hidden" name="iconName" value={editCategory.iconName || ""} />
                <button
                  type="button"
                  onClick={() => setIconPickerTarget('edit')}
                  className="w-full border rounded-md p-2 flex items-center justify-between outline-none focus:border-coral-500 hover:bg-gray-50 transition-colors bg-white text-left"
                >
                  <span className="flex items-center gap-2">
                    <DynamicIcon name={editCategory.iconName || "Rocket"} size={20} className="text-gray-600" />
                    <span className="text-gray-700">{editCategory.iconName}</span>
                  </span>
                  <Edit2 size={14} className="text-gray-500" />
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea name="description" defaultValue={editCategory.description || ""} className="w-full border rounded-md p-2 h-24 outline-none focus:border-coral-500"></textarea>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setEditCategory(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md font-medium">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50">
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteCategoryObj && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl text-center">
            <h3 className="text-xl font-bold mb-2">Delete Category</h3>
            <p className="text-gray-500 mb-6">Are you sure you want to delete the &quot;{deleteCategoryObj.name}&quot; category? This action cannot be undone.</p>
            
            <div className="flex justify-center gap-3">
              <button type="button" onClick={() => setDeleteCategoryObj(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md font-medium w-full">Cancel</button>
              <button type="button" onClick={handleDelete} disabled={isSubmitting} className="px-4 py-2 bg-red-600 text-white rounded-md font-medium hover:bg-red-700 disabled:opacity-50 w-full">
                {isSubmitting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Icon Picker Modal */}
      <IconPickerModal 
        isOpen={iconPickerTarget !== null} 
        onClose={() => setIconPickerTarget(null)}
        onSelect={(iconName) => {
          if (iconPickerTarget === 'add') {
            setAddIconName(iconName);
          } else if (iconPickerTarget === 'edit' && editCategory) {
            setEditCategory({ ...editCategory, iconName });
          }
        }}
      />
    </div>
  );
}

