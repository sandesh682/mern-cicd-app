import { useEffect, useState } from "react";
import axios from "axios";

function App() {
  const [todos, setTodos] = useState([]);
  const [text, setText] = useState("");
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchTodos = async () => {
    const res = await axios.get(`/api/todos`);
    setTodos(res.data.data);
  };

  useEffect(() => {
    let isMounted = true;

    const loadTodos = async () => {
      const res = await axios.get(`/api/todos`);
      if (isMounted) setTodos(res.data.data);
    };

    loadTodos();

    return () => {
      isMounted = false;
    };
  }, []);

  const addTodo = async () => {
    if (!text.trim()) return;
    setLoading(true);
    await axios.post(`/api/todos`, { text });
    setText("");
    await fetchTodos();
    setLoading(false);
  };

  const toggleDone = async (todo) => {
    await axios.put(`/api/todos/${todo._id}`, {
      text: todo.text,
      done: !todo.done,
    });
    await fetchTodos();
  };

  const deleteTodo = async (id) => {
    await axios.delete(`/api/todos/${id}`);
    await fetchTodos();
  };

  const startEdit = (todo) => {
    setEditId(todo._id);
    setEditText(todo.text);
  };

  const saveEdit = async () => {
    if (!editText.trim()) return;
    await axios.put(`/api/todos/${editId}`, { text: editText });
    setEditId(null);
    setEditText("");
    await fetchTodos();
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Sandesh Todo App</h1>

      {/* Add Todo */}
      <div style={styles.inputRow}>
        <input
          style={styles.input}
          placeholder="Add a new todo..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTodo()}
        />
        <button style={styles.addBtn} onClick={addTodo} disabled={loading}>
          {loading ? "Adding..." : "Add"}
        </button>
      </div>

      {/* Todo List */}
      {todos.length === 0 && (
        <p style={{ color: "#888", marginTop: 20 }}>No todos yet. Add one!</p>
      )}

      <ul style={styles.list}>
        {todos.map((todo) => (
          <li key={todo._id} style={styles.item}>
            {editId === todo._id ? (
              // Edit mode
              <div style={styles.inputRow}>
                <input
                  style={styles.input}
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                  autoFocus
                />
                <button style={styles.saveBtn} onClick={saveEdit}>
                  Save
                </button>
                <button
                  style={styles.cancelBtn}
                  onClick={() => setEditId(null)}
                >
                  Cancel
                </button>
              </div>
            ) : (
              // View mode
              <div style={styles.row}>
                <input
                  type="checkbox"
                  checked={todo.done}
                  onChange={() => toggleDone(todo)}
                  style={{ marginRight: 10, cursor: "pointer" }}
                />
                <span
                  style={{
                    ...styles.todoText,
                    textDecoration: todo.done ? "line-through" : "none",
                    color: todo.done ? "#aaa" : "#222",
                  }}
                >
                  {todo.text}
                </span>
                <div style={styles.actions}>
                  <button
                    style={styles.editBtn}
                    onClick={() => startEdit(todo)}
                  >
                    Edit
                  </button>
                  <button
                    style={styles.deleteBtn}
                    onClick={() => deleteTodo(todo._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: 600,
    margin: "60px auto",
    fontFamily: "sans-serif",
    padding: "0 20px",
  },
  title: { fontSize: 28, marginBottom: 20 },
  inputRow: { display: "flex", gap: 8, marginBottom: 8 },
  input: {
    flex: 1,
    padding: "8px 12px",
    fontSize: 15,
    borderRadius: 6,
    border: "1px solid #ccc",
  },
  addBtn: {
    padding: "8px 16px",
    background: "#4f46e5",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 15,
  },
  saveBtn: {
    padding: "8px 14px",
    background: "#16a34a",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
  },
  cancelBtn: {
    padding: "8px 14px",
    background: "#6b7280",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
  },
  list: { listStyle: "none", padding: 0, marginTop: 16 },
  item: {
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    padding: "12px 16px",
    marginBottom: 10,
  },
  row: { display: "flex", alignItems: "center" },
  todoText: { flex: 1, fontSize: 15 },
  actions: { display: "flex", gap: 6 },
  editBtn: {
    padding: "4px 10px",
    background: "#f59e0b",
    color: "#fff",
    border: "none",
    borderRadius: 5,
    cursor: "pointer",
  },
  deleteBtn: {
    padding: "4px 10px",
    background: "#ef4444",
    color: "#fff",
    border: "none",
    borderRadius: 5,
    cursor: "pointer",
  },
};

export default App;
