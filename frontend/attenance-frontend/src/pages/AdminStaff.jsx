import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";

export default function AdminStaff() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [newStaff, setNewStaff] = useState({
    staffId: "",
    name: "",
    email: "",
    department: "",
    password: "",
  });

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const limit = 10;

  const [editingId, setEditingId] = useState(null);
  const [editingData, setEditingData] = useState({
    staffId: "",
    name: "",
    email: "",
    department: "",
    password: "",
  });

  /* ---------------- API CLIENT ---------------- */
  const apiClient = () => {
    const api = axios.create({
      baseURL: "https://college-attendence.onrender.com/api",
    });
    const stored = JSON.parse(localStorage.getItem("user")) || null;
    if (stored?.token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${stored.token}`;
    }
    return api;
  };

  /* ---------------- FETCH STAFF (FIXED) ---------------- */
  const fetchStaff = useCallback(
    async (p = 1, q = "") => {
      setLoading(true);
      setError("");

      try {
        const params = { page: p, limit };
        if (q) params.q = q;

        const res = await apiClient().get("/staff", { params });

        setStaff(res.data?.data || []);
        setPage(res.data?.page || 1);
        setPages(res.data?.pages || 1);
      } catch (err) {
        console.error("Fetch staff error", err);
        const status = err?.response?.status;
        if (status === 401 || status === 403) {
          window.location.href = "/admin/login";
          return;
        }
        setError(
          err?.response?.data?.message ||
            err.message ||
            "Could not load staff"
        );
      } finally {
        setLoading(false);
      }
    },
    [limit]
  );

  /* ---------------- INITIAL LOAD ---------------- */
  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  /* ---------------- CREATE STAFF ---------------- */
  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await apiClient().post("/staff", newStaff);
      setNewStaff({
        staffId: "",
        name: "",
        email: "",
        department: "",
        password: "",
      });
      fetchStaff();
    } catch (err) {
      console.error("Create staff error", err);
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        window.location.href = "/admin/login";
        return;
      }
      setError(err?.response?.data?.message || "Create failed");
    }
  };

  /* ---------------- EDIT STAFF ---------------- */
  const startEdit = (u) => {
    setEditingId(u._id);
    setEditingData({
      staffId: u.staffId || "",
      name: u.name || "",
      email: u.email || "",
      department: u.department || "",
      password: "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingData({
      staffId: "",
      name: "",
      email: "",
      department: "",
      password: "",
    });
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    try {
      await apiClient().put(`/staff/${editingId}`, editingData);
      setEditingId(null);
      fetchStaff(page, search);
    } catch (err) {
      console.error("Update staff error", err);
      setError(err?.response?.data?.message || "Update failed");
    }
  };

  /* ---------------- DELETE STAFF ---------------- */
  const deleteStaff = async (id, name) => {
    if (!window.confirm(`Delete staff ${name}? This cannot be undone.`)) return;

    try {
      await apiClient().delete(`/staff/${id}`);
      fetchStaff(page, search);
    } catch (err) {
      console.error("Delete staff error", err);
      setError(err?.response?.data?.message || "Delete failed");
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <div style={{ padding: 16 }}>
      <h2>Staff Management</h2>

      {/* CREATE */}
      <section style={{ marginBottom: 20 }}>
        <h3>Add Staff</h3>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <form
          onSubmit={handleCreate}
          style={{ display: "flex", gap: 8, flexWrap: "wrap" }}
        >
          <input
            placeholder="Staff ID"
            value={newStaff.staffId}
            onChange={(e) =>
              setNewStaff({ ...newStaff, staffId: e.target.value })
            }
          />
          <input
            placeholder="Name"
            value={newStaff.name}
            onChange={(e) =>
              setNewStaff({ ...newStaff, name: e.target.value })
            }
            required
          />
          <input
            placeholder="Email"
            value={newStaff.email}
            onChange={(e) =>
              setNewStaff({ ...newStaff, email: e.target.value })
            }
            required
          />
          <input
            placeholder="Department"
            value={newStaff.department}
            onChange={(e) =>
              setNewStaff({ ...newStaff, department: e.target.value })
            }
          />
          <input
            type="password"
            placeholder="Password"
            value={newStaff.password}
            onChange={(e) =>
              setNewStaff({ ...newStaff, password: e.target.value })
            }
            required
          />
          <button type="submit">Create</button>
        </form>
      </section>

      {/* SEARCH */}
      <div style={{ marginBottom: 10 }}>
        <input
          placeholder="Search staff"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button onClick={() => fetchStaff(1, search)}>Search</button>
      </div>

      {/* TABLE */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table width="100%" border="1" cellPadding="6">
          <thead>
            <tr>
              <th>#</th>
              <th>Staff ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Department</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((u, i) => (
              <tr key={u._id}>
                <td>{i + 1}</td>
                <td>{u.staffId}</td>
                <td>
                  {editingId === u._id ? (
                    <input
                      value={editingData.name}
                      onChange={(e) =>
                        setEditingData({
                          ...editingData,
                          name: e.target.value,
                        })
                      }
                    />
                  ) : (
                    u.name
                  )}
                </td>
                <td>{u.email}</td>
                <td>{u.department}</td>
                <td>
                  {editingId === u._id ? (
                    <>
                      <input
                        type="password"
                        placeholder="New password"
                        value={editingData.password}
                        onChange={(e) =>
                          setEditingData({
                            ...editingData,
                            password: e.target.value,
                          })
                        }
                      />
                      <button onClick={saveEdit}>Save</button>
                      <button onClick={cancelEdit}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => startEdit(u)}>Edit</button>
                      <button
                        onClick={() => deleteStaff(u._id, u.name)}
                        style={{ marginLeft: 6 }}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* PAGINATION */}
      <div style={{ marginTop: 12 }}>
        <button disabled={page <= 1} onClick={() => fetchStaff(page - 1, search)}>
          Prev
        </button>
        <span style={{ margin: "0 10px" }}>
          Page {page} / {pages}
        </span>
        <button
          disabled={page >= pages}
          onClick={() => fetchStaff(page + 1, search)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
