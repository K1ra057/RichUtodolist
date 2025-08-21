document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const taskForm = document.getElementById("task-form");
    const taskInput = document.getElementById("task-input");
    const taskCategorySelect = document.getElementById("task-category");
    const taskLists = document.querySelectorAll(".task-list");

    // State
    const tasks = JSON.parse(localStorage.getItem("tasks")) || {
        design: [],
        personal: [],
        house: [],
    };

    let draggedItem = null;
    let touchTimer = null;

    // --- Core Functions ---

    const saveTasks = () => {
        localStorage.setItem("tasks", JSON.stringify(tasks));
    };

    const renderTasks = () => {
        taskLists.forEach(list => {
            list.innerHTML = "";
            const category = list.id;
            if (tasks[category]) {
                tasks[category].forEach((task) => {
                    const taskElement = createTaskElement(task, category);
                    list.appendChild(taskElement);
                });
            }
        });
    };

    const createTaskElement = (task, category) => {
        const li = document.createElement("li");
        li.dataset.id = task.id;
        li.dataset.category = category;
        if (task.done) {
            li.classList.add("completed");
        }

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = task.done;
        checkbox.id = `task-${task.id}`;
        checkbox.addEventListener("change", () => {
            task.done = checkbox.checked;
            li.classList.toggle("completed", task.done);
            saveTasks();
        });

        const label = document.createElement("label");
        label.textContent = task.text;
        label.htmlFor = `task-${task.id}`;

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "X";
        deleteBtn.className = "delete-btn";
        deleteBtn.setAttribute("aria-label", `Delete task: ${task.text}`);
        deleteBtn.addEventListener("click", () => {
            tasks[category] = tasks[category].filter(t => t.id !== task.id);
            saveTasks();
            renderTasks();
        });

        li.append(checkbox, label, deleteBtn);

        // Touch Listeners for Drag & Drop
        li.addEventListener("touchstart", handleTouchStart, { passive: false });
        li.addEventListener("touchend", handleTouchEnd);
        li.addEventListener("touchcancel", handleTouchEnd);

        return li;
    };

    // --- Event Handlers ---

    const handleTaskFormSubmit = (e) => {
        e.preventDefault();
        const text = taskInput.value.trim();
        const category = taskCategorySelect.value;
        if (text) {
            const newTask = { id: Date.now(), text, done: false };
            if (!tasks[category]) tasks[category] = [];
            tasks[category].push(newTask);
            saveTasks();
            renderTasks();
            taskInput.value = "";
        }
    };

    // --- Touch Handlers for Drag & Drop ---

    function handleTouchStart(e) {
        const li = e.currentTarget;
        if (li.classList.contains('completed')) return;

        touchTimer = setTimeout(() => {
            e.preventDefault(); // Prevent click event after long press
            draggedItem = li;
            draggedItem.classList.add("dragging");
            document.addEventListener("touchmove", handleTouchMove, { passive: false });
        }, 350); // Delay to initiate drag
    }

    function handleTouchMove(e) {
        clearTimeout(touchTimer);
        if (!draggedItem) return;
        e.preventDefault(); // Prevent page scroll while dragging

        const touch = e.touches[0];
        const elementUnder = document.elementFromPoint(touch.clientX, touch.clientY);
        if (!elementUnder) return;

        const targetList = elementUnder.closest('.task-list');
        if (targetList) {
            const afterElement = getDragAfterElement(targetList, touch.clientY);
            targetList.insertBefore(draggedItem, afterElement);
        }
    }

    function handleTouchEnd() {
        clearTimeout(touchTimer);
        document.removeEventListener("touchmove", handleTouchMove);
        if (!draggedItem) return;

        const targetList = draggedItem.closest('.task-list');
        if (targetList) {
            updateTaskOrder(draggedItem, targetList);
        }
        draggedItem.classList.remove("dragging");
        draggedItem = null;
    }

    // --- Utility Functions ---

    const getDragAfterElement = (container, y) => {
        const draggableElements = [...container.querySelectorAll("li:not(.dragging)")];
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    };

    const updateTaskOrder = (item, targetList) => {
        const sourceCategory = item.dataset.category;
        const targetCategory = targetList.id;
        const taskId = Number(item.dataset.id);

        const taskIndex = tasks[sourceCategory].findIndex(t => t.id === taskId);
        if (taskIndex === -1) return;
        
        // ИСПРАВЛЕНА ОПЕЧАТКА: было source_category
        const [task] = tasks[sourceCategory].splice(taskIndex, 1);

        const newLiElements = [...targetList.querySelectorAll('li')];
        const newIndex = newLiElements.indexOf(item);
        
        if (!tasks[targetCategory]) tasks[targetCategory] = [];
        tasks[targetCategory].splice(newIndex, 0, task);

        saveTasks();
        renderTasks();
    };

    // --- Initialization ---
    taskForm.addEventListener("submit", handleTaskFormSubmit);
    renderTasks();
});
