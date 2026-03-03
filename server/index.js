const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
const allowedOrigins = ["http://3.26.0.207/", "http://localhost:5173"];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  }),
);
app.use(express.json());

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  });

// Todo model
const Todo = mongoose.model(
  "Todo",
  new mongoose.Schema(
    {
      text: {
        type: String,
        required: [true, "Text is required"],
        trim: true,
      },
      done: { type: Boolean, default: false },
    },
    { timestamps: true },
  ),
);

// ─── Response Helpers ────────────────────────────────────────────────────────

const sendSuccess = (res, data, message = "Success", statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

const sendError = (res, message = "Something went wrong", statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    message,
    data: null,
  });
};

// ─── Routes ──────────────────────────────────────────────────────────────────

// GET /api/todos — Get all todos
app.get("/api/todos", async (req, res) => {
  try {
    const todos = await Todo.find().sort({ createdAt: -1 });
    return sendSuccess(res, todos, "Todos fetched successfully");
  } catch (err) {
    console.error("GET /api/todos:", err.message);
    return sendError(res, "Failed to fetch todos");
  }
});

// GET /api/todos/:id — Get a single todo
app.get("/api/todos/:id", async (req, res) => {
  try {
    const todo = await Todo.findById(req.params.id);
    if (!todo) return sendError(res, "Todo not found", 404);
    return sendSuccess(res, todo, "Todo fetched successfully");
  } catch (err) {
    console.error("GET /api/todos/:id:", err.message);
    if (err.name === "CastError") return sendError(res, "Invalid todo ID", 400);
    return sendError(res, "Failed to fetch todo");
  }
});

// POST /api/todos — Create a new todo
app.post("/api/todos", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return sendError(res, "Text is required", 400);
    }
    const todo = await Todo.create({ text: text.trim() });
    return sendSuccess(res, todo, "Todo created successfully", 201);
  } catch (err) {
    console.error("POST /api/todos:", err.message);
    if (err.name === "ValidationError") {
      return sendError(res, err.message, 400);
    }
    return sendError(res, "Failed to create todo");
  }
});

// PUT /api/todos/:id — Update a todo
app.put("/api/todos/:id", async (req, res) => {
  try {
    const { text, done } = req.body;
    const todo = await Todo.findByIdAndUpdate(
      req.params.id,
      { text, done },
      { new: true, runValidators: true },
    );
    if (!todo) return sendError(res, "Todo not found", 404);
    return sendSuccess(res, todo, "Todo updated successfully");
  } catch (err) {
    console.error("PUT /api/todos/:id:", err.message);
    if (err.name === "CastError") return sendError(res, "Invalid todo ID", 400);
    if (err.name === "ValidationError") return sendError(res, err.message, 400);
    return sendError(res, "Failed to update todo");
  }
});

// DELETE /api/todos/:id — Delete a todo
app.delete("/api/todos/:id", async (req, res) => {
  try {
    const todo = await Todo.findByIdAndDelete(req.params.id);
    if (!todo) return sendError(res, "Todo not found", 404);
    return sendSuccess(res, null, "Todo deleted successfully");
  } catch (err) {
    console.error("DELETE /api/todos/:id:", err.message);
    if (err.name === "CastError") return sendError(res, "Invalid todo ID", 400);
    return sendError(res, "Failed to delete todo");
  }
});

// ─── Serve React Frontend (Production) ───────────────────────────────────────

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../client/dist")));

  app.use((req, res) => {
    res.sendFile(path.join(__dirname, "../client/dist", "index.html"));
  });
}

// ─── 404 Handler ─────────────────────────────────────────────────────────────

app.use((req, res) => {
  return sendError(res, `Route ${req.originalUrl} not found`, 404);
});

// ─── Global Error Handler ─────────────────────────────────────────────────────

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.message);
  return sendError(res, "Internal server error");
});

// ─── Start Server ─────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
