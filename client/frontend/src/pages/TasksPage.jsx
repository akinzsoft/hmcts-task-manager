import React, { useEffect, useMemo, useState } from "react";

const API_ROOT = "http://127.0.0.1:8000/api";

// ---- endpoints that exactly match your urls.py ----
const endpoints = {
  list: () => `${API_ROOT}/tasks/`,
  create: () => `${API_ROOT}/tasks/create/`,
  detail: (id) => `${API_ROOT}/tasks/${id}/`,
  update: (id) => `${API_ROOT}/tasks/${id}/update/`,
  del: (id) => `${API_ROOT}/tasks/${id}/delete/`,
};

const TaskRow = ({ task, onEdit, onDelete }) => (
  <tr>
    <td style={td}>{task.id}</td>
    <td style={td}>{task.title}</td>
    <td
      style={{
        ...td,
        maxWidth: 320,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      }}
      title={task.description || ""}
    >
      {task.description || "—"}
    </td>
    <td style={td}>{task.status}</td>
    <td style={td}>{task.created_at ? new Date(task.created_at).toLocaleString() : "—"}</td>
    <td style={{ ...td, whiteSpace: "nowrap" }}>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => onEdit(task)}>Edit</button>
        <button onClick={() => onDelete(task)} style={{ background: "#f2dede" }}>
          Delete
        </button>
      </div>
    </td>
  </tr>
);

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  // create form
  const [createForm, setCreateForm] = useState({
    title: "",
    description: "",
    status: "pending",
    created_at: "",
  });

  // search by id
  const [searchId, setSearchId] = useState("");
  const [searchResult, setSearchResult] = useState(null);

  // edit form
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    status: "pending",
    created_at: "",
  });

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const headers = useMemo(() => ({ "Content-Type": "application/json" }), []);

  const resetAlerts = () => {
    setError("");
    setMessage("");
  };

  const fetchTasks = async () => {
    setLoading(true);
    resetAlerts();
    try {
      const res = await fetch(endpoints.list());
      if (!res.ok) throw new Error(`Failed to load tasks (${res.status})`);
      const data = await res.json();
      setTasks(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.message || "Failed to fetch tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- CREATE ----------
  const createTask = async (e) => {
    e.preventDefault();
    resetAlerts();

    const payload = {
      title: createForm.title.trim(),
      description: createForm.description,
      status: createForm.status,
      created_at: createForm.created_at ? new Date(createForm.created_at).toISOString() : null,
    };

    if (!payload.title) return setError("Title cannot be empty.");

    try {
      const res = await fetch(endpoints.create(), {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const maybe = await safeJson(res);
        throw new Error(`Create failed (${res.status}) ${maybe ? JSON.stringify(maybe) : ""}`);
      }

      const created = await res.json();
      setMessage(`Created task ${created.id}.`);

      // reset create form
      setCreateForm({ title: "", description: "", status: "pending", created_at: "" });

      // update list (prepend)
      setTasks((prev) => [created, ...prev]);
    } catch (e) {
      setError(e?.message || "Create failed");
    }
  };

  // ---------- SEARCH ----------
  const handleSearchById = async (e) => {
    e.preventDefault();
    resetAlerts();
    setSearchResult(null);

    const id = String(searchId).trim();
    if (!id) return setError("Enter a task ID.");
    if (!/^\d+$/.test(id)) return setError("Task ID must be a number.");

    try {
      const res = await fetch(endpoints.detail(id));
      if (res.status === 404) return setError(`No task found with ID ${id}.`);
      if (!res.ok) throw new Error(`Search failed (${res.status})`);
      const data = await res.json();
      setSearchResult(data);
      setMessage(`Found task ID ${id}.`);
    } catch (e) {
      setError(e?.message || "Search failed");
    }
  };

  // ---------- EDIT ----------
  const openEdit = (task) => {
    resetAlerts();
    setEditing(task);
    setEditForm({
      title: task.title ?? "",
      description: task.description ?? "",
      status: task.status ?? "pending",
      created_at: task.created_at ? toDatetimeLocal(task.created_at) : "",
    });
  };

  const closeEdit = () => setEditing(null);

  const updateTask = async (e) => {
    e.preventDefault();
    if (!editing) return;

    resetAlerts();

    const payload = {
      title: editForm.title.trim(),
      description: editForm.description,
      status: editForm.status,
      created_at: editForm.created_at ? new Date(editForm.created_at).toISOString() : null,
    };

    if (!payload.title) return setError("Title cannot be empty.");

    try {
      // Your backend has /update/ endpoint
      // Use PATCH if your view supports it; if not, change to PUT.
      const res = await fetch(endpoints.update(editing.id), {
        method: "PATCH",
        headers,
        body: JSON.stringify(payload),
      });

      // If your update view only accepts PUT, fallback automatically:
      if (res.status === 405) {
        const resPut = await fetch(endpoints.update(editing.id), {
          method: "PUT",
          headers,
          body: JSON.stringify(payload),
        });
        if (!resPut.ok) {
          const maybe = await safeJson(resPut);
          throw new Error(`Update failed (${resPut.status}) ${maybe ? JSON.stringify(maybe) : ""}`);
        }
        const updated = await resPut.json();
        applyUpdatedTask(updated);
        return;
      }

      if (!res.ok) {
        const maybe = await safeJson(res);
        throw new Error(`Update failed (${res.status}) ${maybe ? JSON.stringify(maybe) : ""}`);
      }

      const updated = await res.json();
      applyUpdatedTask(updated);
    } catch (e) {
      setError(e?.message || "Update failed");
    }
  };

  const applyUpdatedTask = (updated) => {
    setMessage(`Task ${updated.id} updated.`);
    setEditing(null);
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    setSearchResult((prev) => (prev && prev.id === updated.id ? updated : prev));
  };

  // ---------- DELETE ----------
  const deleteTask = async (task) => {
    resetAlerts();

    const ok = window.confirm(`Delete task ${task.id} (${task.title})?`);
    if (!ok) return;

    try {
      const res = await fetch(endpoints.del(task.id), { method: "DELETE" });

      if (res.status !== 204 && !res.ok) {
        const maybe = await safeJson(res);
        throw new Error(`Delete failed (${res.status}) ${maybe ? JSON.stringify(maybe) : ""}`);
      }

      setMessage(`Task ${task.id} deleted.`);
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
      setSearchResult((prev) => (prev && prev.id === task.id ? null : prev));
      if (editing?.id === task.id) setEditing(null);
    } catch (e) {
      setError(e?.message || "Delete failed");
    }
  };

  return (
    <div style={page}>
      <h2>Tasks</h2>

      {/* CREATE */}
      <div style={{ marginTop: 10, border: "1px solid #ddd", borderRadius: 8, padding: 14 }}>
        <h3>Create Task</h3>
        <form onSubmit={createTask} style={{ display: "grid", gap: 10, maxWidth: 520 }}>
          <label>
            Title
            <input
              value={createForm.title}
              onChange={(e) => setCreateForm((p) => ({ ...p, title: e.target.value }))}
              style={{ width: "100%", marginTop: 4 }}
            />
          </label>

          <label>
            Description (optional)
            <textarea
              value={createForm.description}
              onChange={(e) => setCreateForm((p) => ({ ...p, description: e.target.value }))}
              rows={3}
              style={{ width: "100%", marginTop: 4 }}
            />
          </label>

          <label>
            Status
            <select
              value={createForm.status}
              onChange={(e) => setCreateForm((p) => ({ ...p, status: e.target.value }))}
              style={{ width: "100%", marginTop: 4 }}
            >
              <option value="pending">pending</option>
              <option value="in_progress">in_progress</option>
              <option value="done">done</option>
            </select>
          </label>

          <label>
            Due date/time
            <input
              type="datetime-local"
              value={createForm.created_at}
              onChange={(e) => setCreateForm((p) => ({ ...p, created_at: e.target.value }))}
              style={{ width: "100%", marginTop: 4 }}
            />
          </label>

          <div style={{ display: "flex", gap: 10 }}>
            <button type="submit">Create</button>
            <button type="button" onClick={fetchTasks} disabled={loading}>
              {loading ? "Refreshing..." : "Refresh List"}
            </button>
          </div>
        </form>
      </div>

      {/* ALERTS */}
      {error && (
        <div style={alertError}>
          <b>Error:</b> {error}
        </div>
      )}
      {message && <div style={alertInfo}>{message}</div>}

      {/* SEARCH */}
      <div style={{ marginTop: 18 }}>
        <h3>Search</h3>
        <form onSubmit={handleSearchById} style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <label>
            Search by ID:
            <input
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder="e.g. 12"
              style={{ marginLeft: 8 }}
            />
          </label>
          <button type="submit">Search</button>
        </form>

        <div style={{ marginTop: 10 }}>
          {searchResult ? (
            <div style={card}>
              <div><b>ID:</b> {searchResult.id}</div>
              <div><b>Title:</b> {searchResult.title}</div>
              <div><b>Description:</b> {searchResult.description || "—"}</div>
              <div><b>Status:</b> {searchResult.status}</div>
              <div><b>Due:</b> {searchResult.created_at ? new Date(searchResult.created_at).toLocaleString() : "—"}</div>
              <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                <button onClick={() => openEdit(searchResult)}>Edit</button>
                <button onClick={() => deleteTask(searchResult)} style={{ background: "#f2dede" }}>
                  Delete
                </button>
              </div>
            </div>
          ) : (
            <div style={{ color: "#666" }}>No result yet.</div>
          )}
        </div>
      </div>

      {/* LIST */}
      <div style={{ marginTop: 18 }}>
        <h3>All Tasks</h3>

        <div style={{ overflowX: "auto", border: "1px solid #ddd", borderRadius: 8 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f7f7f7" }}>
                <th style={th}>ID</th>
                <th style={th}>Title</th>
                <th style={th}>Description</th>
                <th style={th}>Status</th>
                <th style={th}>Due</th>
                <th style={th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 12, color: "#666" }}>
                    {loading ? "Loading..." : "No tasks found."}
                  </td>
                </tr>
              ) : (
                tasks.map((t) => (
                  <TaskRow key={t.id} task={t} onEdit={openEdit} onDelete={deleteTask} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT */}
      {editing && (
        <div style={{ marginTop: 22, border: "1px solid #ddd", borderRadius: 8, padding: 14 }}>
          <h3>Edit Task #{editing.id}</h3>

          <form onSubmit={updateTask} style={{ display: "grid", gap: 10, maxWidth: 520 }}>
            <label>
              Title
              <input
                value={editForm.title}
                onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))}
                style={{ width: "100%", marginTop: 4 }}
              />
            </label>

            <label>
              Description (optional)
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                rows={3}
                style={{ width: "100%", marginTop: 4 }}
              />
            </label>

            <label>
              Status
              <select
                value={editForm.status}
                onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value }))}
                style={{ width: "100%", marginTop: 4 }}
              >
                <option value="pending">pending</option>
                <option value="in_progress">in_progress</option>
                <option value="done">done</option>
              </select>
            </label>

            <label>
              Due date/time
              <input
                type="datetime-local"
                value={editForm.created_at}
                onChange={(e) => setEditForm((p) => ({ ...p, created_at: e.target.value }))}
                style={{ width: "100%", marginTop: 4 }}
              />
            </label>

            <div style={{ display: "flex", gap: 10 }}>
              <button type="submit">Save</button>
              <button type="button" onClick={closeEdit}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// ---------- styles ----------
const page = { padding: 20, maxWidth: 1100, margin: "0 auto", fontFamily: "system-ui, Arial" };
const th = { textAlign: "left", padding: 10, borderBottom: "1px solid #ddd" };
const td = { padding: 10, borderBottom: "1px solid #eee", verticalAlign: "top" };
const card = { border: "1px solid #ddd", padding: 12, borderRadius: 8 };
const alertError = { marginTop: 12, padding: 10, background: "#ffecec", border: "1px solid #f5c2c2" };
const alertInfo = { marginTop: 12, padding: 10, background: "#eef9ff", border: "1px solid #bfe3ff" };

async function safeJson(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function toDatetimeLocal(isoString) {
  const d = new Date(isoString);
  const pad = (n) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const min = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}