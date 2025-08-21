document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const taskForm = document.getElementById("task-form");
    const taskInput = document.getElementById("task-input");
    const taskCategorySelect = document.getElementById("task-category");
    const taskLists = document.querySelectorAll(".task-list");

    // State
    const tasks = JSON.parse(localStorage.getItem("tasks")) || {
        design: [
            { id: 1, text: "Create icons for a dashboard", done: false },
            { id: 2, text: "Plan your meal", done: false },
        ],
        personal: [
            { id: 3, text: "Review daily goals", done: false },
            { id: 4, text: "Stretch for 15 minutes", done: false },
        ],
        house: [{ id: 5, text: "Water indoor plants", done: false }],
    };

    let draggedItem = null;

    // --- Core Functions ---

    const saveTasks = () => {
        localStorage.setItem("tasks", JSON.stringify(tasks));
    };

    const renderTasks = () => {
        taskLists.forEach(list => {
            list.innerHTML = ""; // Clear existing tasks
            const category = list.id;
            if (tasks[category]) {
                tasks[category].forEach((task) => {
                    const taskElement = createTaskElement(task, category);
                    list.appendChild(taskElement); // Correctly append the created element
                });
            }
        });
    };

    const createTaskElement = (task, category) => {
        const li = document.createElement("li");
        li.draggable = true;
        li.dataset.id = task.id;
        li.dataset.category = category;
        if (task.done) {
            li.classList.add("completed");
        }

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = task.done;
        checkbox.addEventListener("change", () => {
            task.done = checkbox.checked;
            li.classList.toggle("completed", task.done);
            saveTasks();
        });

        const label = document.createElement("label");
        label.textContent = task.text;

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "❌";
        deleteBtn.className = "delete-btn";
        deleteBtn.setAttribute("aria-label", `Delete task: ${task.text}`);
        deleteBtn.addEventListener("click", () => {
            tasks[category] = tasks[category].filter(t => t.id !== task.id);
            saveTasks();
            renderTasks();
        });

        li.append(checkbox, label, deleteBtn);

        // Drag and Drop Listeners
        li.addEventListener("dragstart", handleDragStart);
        li.addEventListener("dragend", handleDragEnd);

        return li;
    };

    // --- Event Handlers ---

    const handleTaskFormSubmit = (e) => {
        e.preventDefault();
        const text = taskInput.value.trim();
        const category = taskCategorySelect.value;
        if (text) {
            const newTask = { id: Date.now(), text, done: false };
            if (!tasks[category]) {
                tasks[category] = [];
            }
            tasks[category].push(newTask);
            saveTasks();
            renderTasks();
            taskInput.value = "";
            taskInput.focus();
        }
    };

    function handleDragStart(e) {
        draggedItem = e.target;
        setTimeout(() => {
            if (draggedItem) {
                draggedItem.classList.add("dragging");
            }
        }, 0);
    }

    function handleDragEnd() {
        if (draggedItem) {
            draggedItem.classList.remove("dragging");
        }
        draggedItem = null;
    }

    function handleDragOver(e) {
        e.preventDefault();
    }

    function handleDrop(e) {
        e.preventDefault();
        if (!draggedItem) return;

        const targetList = e.target.closest('.task-list');
        if (!targetList) return;

        const sourceCategory = draggedItem.dataset.category;
        const targetCategory = targetList.id;
        const taskId = Number(draggedItem.dataset.id);

        // Find the task to move
        const taskIndex = tasks[sourceCategory].findIndex(t => t.id === taskId);
        if (taskIndex === -1) return;
        
        const [task] = tasks[sourceCategory].splice(taskIndex, 1);

        // Find where to insert it
        const afterElement = getDragAfterElement(targetList, e.clientY);
        
        if (afterElement) {
            const afterId = Number(afterElement.dataset.id);
            const newIndex = tasks[targetCategory].findIndex(t => t.id === afterId);
            tasks[targetCategory].splice(newIndex, 0, task);
        } else {
            tasks[targetCategory].push(task);
        }

        saveTasks();
        renderTasks();
    }

    const getDragAfterElement = (container, y) => {
        const draggableElements = [...container.querySelectorAll("li:not(.dragging)")];
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    };

    // --- Initialization ---

    taskForm.addEventListener("submit", handleTaskFormSubmit);
    taskLists.forEach(list => {
        list.addEventListener("dragover", handleDragOver);
        list.addEventListener("drop", handleDrop);
    });

    renderTasks();
});
