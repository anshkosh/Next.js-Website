"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserPlus, ShieldOff } from "lucide-react";
import { setAdminRole, removeAdminRole } from "@/app/actions/user.actions";

export default function AdminManager({ admins, currentUserId }: { admins: any[], currentUserId: string }) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleAddSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    
    const formData = new FormData(e.currentTarget);
    const res = await setAdminRole(formData);
    
    setIsSubmitting(false);
    if (res.error) {
      setError(res.error);
    } else {
      setIsAddOpen(false);
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm("Are you sure you want to revoke this user's admin/reviewer access?")) return;
    
    setIsSubmitting(true);
    setError("");
    
    const res = await removeAdminRole(id);
    
    setIsSubmitting(false);
    if (res.error) {
      setError(res.error);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-700">Manage Access</h2>
        <button 
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-coral-500 text-white rounded-md font-medium hover:bg-coral-600 transition-colors"
        >
          <UserPlus size={16} /> Add Admin/Reviewer
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
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {admins.map((admin) => (
              <TableRow key={admin.id}>
                <TableCell className="font-medium">{admin.name || "No name"}</TableCell>
                <TableCell>{admin.email}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    admin.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                  }`}>
                    {admin.role.toUpperCase()}
                  </span>
                </TableCell>
                <TableCell>{new Date(admin.createdAt).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  {admin.id !== currentUserId ? (
                    <button 
                      onClick={() => handleRemove(admin.id)}
                      disabled={isSubmitting}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded disabled:opacity-30" 
                      title="Revoke Access"
                    >
                      <ShieldOff size={16} />
                    </button>
                  ) : (
                    <span className="text-xs text-gray-400 italic">You</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Add Dialog */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-xl font-bold mb-4">Add Admin or Reviewer</h3>
            <p className="text-sm text-gray-500 mb-4">
              Enter the email of an existing user to elevate their privileges.
            </p>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">User Email</label>
                <input name="email" type="email" required className="w-full border rounded-md p-2 outline-none focus:border-coral-500" placeholder="user@example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select name="role" className="w-full border rounded-md p-2 outline-none focus:border-coral-500 bg-white">
                  <option value="reviewer">Reviewer (Can approve/reject startups)</option>
                  <option value="admin">Admin (Full access to settings/users)</option>
                </select>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsAddOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md font-medium">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-coral-500 text-white rounded-md font-medium hover:bg-coral-600 disabled:opacity-50">
                  {isSubmitting ? "Adding..." : "Add Access"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
