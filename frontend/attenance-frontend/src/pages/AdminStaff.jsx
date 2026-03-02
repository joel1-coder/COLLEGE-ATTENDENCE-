import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import Toast from "../components/Toast";
import useToast from "../Hooks/usetoast";

export default function AdminStaff() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingData, setEditingData] = useState({ staffId: "", name: "", email: "", department: "", password: "" });
  const [newStaff, setNewStaff] = useState({ staffId: "", name: "", email: "", department: "", password: "" });

  // 💡 Replaced setError / plain alerts with toast notifications
  const { toasts, toast, removeToast } = useToast();

  const apiClient = useCallback(() => {
    const api = axios.create({ baseURL: "https://college-attendence.onrender.com/api" });
    const stored = JSON.parse(localStorage.getItem("user"));
    if (stored?.token) api.defaults.headers.common["Authorization"] = `Bearer ${stored.token}`;
    return api;
  }, []);

  const fetchStaff = useCallback(async (p = 1, q = "") => {
    setLoading(true);
    try {
      const res = await apiClient().get("/staff", { params: { page: p, limit: 10, search: q } });
      setStaff(res.data.staff || res.data || []);
      setPages(res.data.pages || 1);
      setPage(p);
    } catch (err) {
      console.error("Fetch staff error", err);
      toast.error(err?.response?.data?.message || "Failed to load staff");
      const status = err?.response?.status;
      if (status === 401 || status === 403) window.location.href = "/admin/login";
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  useEffect(() => { fetchStaff(1, search); }, []);

  const createStaff = async (e) => {
    e.preventDefault();
    try {
      await apiClient().post("/staff", newStaff);
      toast.success(`Staff "${newStaff.name}" created successfully`);
      setNewStaff({ staffId: "", name: "", email: "", department: "", password: "" });
      fetchStaff(page, search);
    } catch (err) {
      console.error("Create staff error", err);
      const status = err?.response?.status;
      if (status === 401 || status === 403) { window.location.href = "/admin/login"; return; }
      toast.error(err?.response?.data?.message || "Create failed");
    }
  };

  const startEdit = (u) => {
    setEditingId(u._id);
    setEditingData({ staffId: u.staffId || "", name: u.name || "", email: u.email || "", department: u.department || "", password: "" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingData({ staffId: "", name: "", email: "", department: "", password: "" });
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    try {
      await apiClient().put(`/staff/${editingId}`, editingData);
      toast.success("Staff details updated successfully");
      setEditingId(null);
      fetchStaff(page, search);
    } catch (err) {
      console.error("Update staff error", err);
      toast.error(err?.response?.data?.message || "Update failed");
    }
  };

  const deleteStaff = async (id, name) => {
    if (!window.confirm(`Delete staff ${name}?`)) return;
    try {
      await apiClient().delete(`/staff/${id}`);
      toast.success(`Staff "${name}" deleted successfully`);
      fetchStaff(page, search);
    } catch (err) {
      console.error("Delete staff error", err);
      toast.error(err?.response?.data?.message || "Delete failed");
    }
  };

  return (
    <div style={{ padding: 16 }}>
      {/* Toast notifications */}
      <Toast toasts={toasts} removeToast={removeToast} />

      <h2>Staff Management</h2>

      {/* CREATE STAFF FORM */}
      <form onSubmit={createStaff} style={{ marginBottom: 24, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input placeholder="Staff ID" value={newStaff.staffId} onChange={e => setNewStaff({ ...newStaff, staffId: e.target.value })} required />
        <input placeholder="Name" value={newStaff.name} onChange={e => setNewStaff({ ...newStaff, name: e.target.value })} required />
        <input placeholder="Email" value={newStaff.email} onChange={e => setNewStaff({ ...newStaff, email: e.target.value })} required />
        <input placeholder="Department" value={newStaff.department} onChange={e => setNewStaff({ ...newStaff, department: e.target.value })} />
        <input type="password" placeholder="Password" value={newStaff.password} onChange={e => setNewStaff({ ...newStaff, password: e.target.value })} required />
        <button type="submit">Add Staff</button>
      </form>

      {/* SEARCH */}
      <div style={{ marginBottom: 12 }}>
        <input
          placeholder="Search..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === "Enter" && fetchStaff(1, search)}
        />
        <button onClick={() => fetchStaff(1, search)} style={{ marginLeft: 8 }}>Search</button>
      </div>

      {loading ? <p>Loading...</p> : (
        <table width="100%" border="1" cellPadding="6">
          <thead>
            <tr>
              <th>#</th><th>Staff ID</th><th>Name</th><th>Email</th><th>Department</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((u, i) => (
              <tr key={u._id}>
                <td>{i + 1}</td>
                <td>{u.staffId}</td>
                <td>
                  {editingId === u._id
                    ? <input value={editingData.name} onChange={e => setEditingData({ ...editingData, name: e.target.value })} />
                    : u.name}
                </td>
                <td>{u.email}</td>
                <td>{u.department}</td>
                <td>
                  {editingId === u._id ? (
                    <>
                      <input type="password" placeholder="New password" value={editingData.password} onChange={e => setEditingData({ ...editingData, password: e.target.value })} />
                      <button onClick={saveEdit}>Save</button>
                      <button onClick={cancelEdit}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => startEdit(u)}>Edit</button>
                      <button onClick={() => deleteStaff(u._id, u.name)} style={{ marginLeft: 6 }}>Delete</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div style={{ marginTop: 12 }}>
        <button disabled={page <= 1} onClick={() => fetchStaff(page - 1, search)}>Prev</button>
        <span style={{ margin: "0 10px" }}>Page {page} / {pages}</span>
        <button disabled={page >= pages} onClick={() => fetchStaff(page + 1, search)}>Next</button>
      </div>
    </div>
  );
}