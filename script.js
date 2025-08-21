const taskForm = document.getElementById("task-form");
const taskInput = document.getElementById("task-input");
const taskCategory = document.getElementById("task-category");
let tasks = JSON.parse(localStorage.getItem("tasks")) || {
  design: [
    { text: "Create icons for a dashboard", done: false },
    { text: "Plan your meal", done: false },
    { text: "Prepare a design presentation", done: false },
  ],
  personal: [
    {
      text: "Review daily goals before sleeping. Add some new if time permits",
      done: false,
    },
    { text: "Stretch for 15 minutes", done: false },
  ],
  house: [{ text: "Water indoor plants", done: false }],
};

let draggedItem = null;
let sourceCategory = null;

function renderTasks() {
  ["design", "personal", "house"].forEach((cat) => {
    const ul = document.getElementById(cat);
    ul.innerHTML = "";
    
    if (tasks[cat].length === 0) {
      return; // Используем CSS псевдоэлемент для отображения сообщения
    }
    
    tasks[cat].forEach((task, index) => {
      const li = document.createElement("li");
      li.draggable = true;
      li.dataset.category = cat;
      li.dataset.index = index;

      li.innerHTML = `
        <input type="checkbox" ${task.done ? "checked" : ""}>
        <label class="${task.done ? "completed" : ""}">${task.text}</label>
        <button onclick="deleteTask('${cat}', ${index})">❌</button>
      `;

      li.querySelector("input").addEventListener("change", (e) => {
        tasks[cat][index].done = e.target.checked;
        saveTasks();
        renderTasks(); // Перерисовываем чтобы обновить стили
      });

      li.addEventListener("dragstart", (e) => {
        draggedItem = li;
        sourceCategory = cat;
        setTimeout(() => li.classList.add("dragging"), 0);
      });

      li.addEventListener("dragend", () => {
        li.classList.remove("dragging");
        draggedItem = null;
        sourceCategory = null;
      });

      ul.appendChild(li);
    });
  });
}

function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

taskForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = taskInput.value.trim();
  const category = taskCategory.value;
  
  if (text) {
    tasks[category].push({ text, done: false });
    taskInput.value = "";
    saveTasks();
    renderTasks();
  }
});

function deleteTask(category, index) {
  tasks[category].splice(index, 1);
  saveTasks();
  renderTasks();
}

// DragOver для списков
document.querySelectorAll(".task-list").forEach((list) => {
  list.addEventListener("dragover", (e) => {
    e.preventDefault();
    const afterElement = getDragAfterElement(list, e.clientY);
    const dragging = document.querySelector(".dragging");
    
    if (dragging) {
      if (afterElement == null) {
        list.appendChild(dragging);
      } else {
        list.insertBefore(dragging, afterElement);
      }
    }
  });

  list.addEventListener("drop", (e) => {
    e.preventDefault();
    if (!draggedItem) return;

    const targetCategory = list.id;
    const items = Array.from(list.querySelectorAll("li:not(.dragging)"));
    const newIndex = items.indexOf(draggedItem) !== -1 ? 
      items.indexOf(draggedItem) : items.length;

    // Перемещаем задачу между категориями
    if (sourceCategory !== targetCategory) {
      const taskIndex = parseInt(draggedItem.dataset.index);
      const task = tasks[sourceCategory][taskIndex];
      
      // Удаляем из исходной категории
      tasks[sourceCategory].splice(taskIndex, 1);
      // Добавляем в новую категорию
      tasks[targetCategory].splice(newIndex, 0, task);
    } 
    // Перемещаем внутри категории
    else {
      const fromIndex = parseInt(draggedItem.dataset.index);
      const toIndex = newIndex;
      
      if (fromIndex !== toIndex) {
        const [task] = tasks[sourceCategory].splice(fromIndex, 1);
        tasks[targetCategory].splice(toIndex, 0, task);
      }
    }

    saveTasks();
    renderTasks();
  });
});

function getDragAfterElement(container, y) {
  const elements = [...container.querySelectorAll("li:not(.dragging)")];
  
  return elements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    
    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// Инициализация
renderTasks();