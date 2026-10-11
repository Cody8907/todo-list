(function () {
  "use strict";

  const STORAGE_KEY = "todo-list-items";

  const form = document.getElementById("todo-form");
  const input = document.getElementById("todo-input");
  const list = document.getElementById("todo-list");
  const emptyState = document.getElementById("empty-state");
  const footer = document.getElementById("footer");
  const taskCount = document.getElementById("task-count");
  const clearCompletedBtn = document.getElementById("clear-completed");
  const filterBtns = document.querySelectorAll(".filter-btn");

  let todos = loadTodos();
  let currentFilter = "all";

  function loadTodos() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function saveTodos() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }

  function createTodoElement(todo) {
    const li = document.createElement("li");
    li.className = "todo-item" + (todo.completed ? " completed" : "");
    li.dataset.id = todo.id;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "todo-checkbox";
    checkbox.checked = todo.completed;
    checkbox.setAttribute("aria-label", "Mark task as complete");
    checkbox.addEventListener("change", () => toggleTodo(todo.id));

    const text = document.createElement("span");
    text.className = "todo-text";
    text.textContent = todo.text;
    text.title = "Double-click to edit";
    text.addEventListener("dblclick", () => startEdit(li, todo));

    const editBtn = document.createElement("button");
    editBtn.className = "btn-icon";
    editBtn.textContent = "✏️";
    editBtn.title = "Edit";
    editBtn.addEventListener("click", () => startEdit(li, todo));

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn-icon btn-delete";
    deleteBtn.textContent = "🗑️";
    deleteBtn.title = "Delete";
    deleteBtn.addEventListener("click", () => deleteTodo(todo.id));

    li.append(checkbox, text, editBtn, deleteBtn);
    return li;
  }

  function startEdit(li, todo) {
    if (li.querySelector(".todo-edit-input")) return;

    const textEl = li.querySelector(".todo-text");
    const editInput = document.createElement("input");
    editInput.type = "text";
    editInput.className = "todo-edit-input";
    editInput.value = todo.text;
    editInput.maxLength = 200;

    textEl.replaceWith(editInput);
    editInput.focus();
    editInput.select();

    let cancelled = false;

    function commit() {
      const value = editInput.value.trim();
      if (!cancelled && value) {
        todo.text = value;
        saveTodos();
      }
      render();
    }

    editInput.addEventListener("blur", commit);
    editInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        editInput.blur();
      } else if (e.key === "Escape") {
        cancelled = true;
        editInput.blur();
      }
    });
  }

  function addTodo(text) {
    todos.unshift({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      text,
      completed: false,
      createdAt: new Date().toISOString(),
    });
    saveTodos();
    render();
  }

  function toggleTodo(id) {
    const todo = todos.find((t) => t.id === id);
    if (todo) {
      todo.completed = !todo.completed;
      saveTodos();
      render();
    }
  }

  function deleteTodo(id) {
    todos = todos.filter((t) => t.id !== id);
    saveTodos();
    render();
  }

  function getVisibleTodos() {
    if (currentFilter === "active") return todos.filter((t) => !t.completed);
    if (currentFilter === "completed") return todos.filter((t) => t.completed);
    return todos;
  }

  function render() {
    list.innerHTML = "";
    const visible = getVisibleTodos();
    visible.forEach((todo) => list.appendChild(createTodoElement(todo)));

    const remaining = todos.filter((t) => !t.completed).length;
    taskCount.textContent = `${remaining} task${remaining === 1 ? "" : "s"} left`;

    const hasAny = todos.length > 0;
    const hasCompleted = todos.some((t) => t.completed);
    emptyState.classList.toggle("hidden", !(hasAny && visible.length === 0));
    if (!hasAny) {
      emptyState.textContent = "No tasks here. Add one above! 🎉";
    } else {
      emptyState.textContent = "Nothing to show for this filter.";
    }

    footer.classList.toggle("hidden", !hasAny);
    clearCompletedBtn.disabled = !hasCompleted;
    clearCompletedBtn.style.opacity = hasCompleted ? "1" : "0.5";
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    addTodo(text);
    input.value = "";
    input.focus();
  });

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentFilter = btn.dataset.filter;
      render();
    });
  });

  clearCompletedBtn.addEventListener("click", () => {
    todos = todos.filter((t) => !t.completed);
    saveTodos();
    render();
  });

  render();
})();
