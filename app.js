// TaskSpin App - Main JavaScript File

class TaskSpinApp {
    constructor() {
        this.tasks = [];
        this.settings = {
            theme: 'light',
            resetInterval: 'daily',
            customHours: 24,
            wheelSpeed: 1500
        };
        this.nextResetTime = null;
        this.timerInterval = null;
        
        this.initializeApp();
    }

    initializeApp() {
        this.loadData();
        this.setupEventListeners();
        this.updateDateDisplay();
        this.updateTheme();
        this.startTimer();
        this.renderTasks();
        this.updateSettingsUI();
    }

    // Data Management
    loadData() {
        const savedTasks = localStorage.getItem('taskspin_tasks');
        const savedSettings = localStorage.getItem('taskspin_settings');
        const savedResetTime = localStorage.getItem('taskspin_nextReset');

        if (savedTasks) {
            this.tasks = JSON.parse(savedTasks);
        }

        if (savedSettings) {
            this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
        }

        if (savedResetTime) {
            this.nextResetTime = new Date(parseInt(savedResetTime));
        } else {
            this.calculateNextResetTime();
        }
    }

    saveData() {
        localStorage.setItem('taskspin_tasks', JSON.stringify(this.tasks));
        localStorage.setItem('taskspin_settings', JSON.stringify(this.settings));
        if (this.nextResetTime) {
            localStorage.setItem('taskspin_nextReset', this.nextResetTime.getTime().toString());
        }
    }

    // Event Listeners
    setupEventListeners() {
        // Task input
        document.getElementById('addTaskBtn').addEventListener('click', () => this.addTask());
        document.getElementById('taskInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });

        // Settings modal
        document.getElementById('settingsBtn').addEventListener('click', () => this.openSettings());
        document.getElementById('closeSettingsBtn').addEventListener('click', () => this.closeSettings());
        document.getElementById('settingsModal').addEventListener('click', (e) => {
            if (e.target.id === 'settingsModal') this.closeSettings();
        });

        // Theme buttons
        document.getElementById('lightModeBtn').addEventListener('click', () => this.setTheme('light'));
        document.getElementById('darkModeBtn').addEventListener('click', () => this.setTheme('dark'));

        // Settings controls
        document.getElementById('resetInterval').addEventListener('change', (e) => this.updateResetInterval(e.target.value));
        document.getElementById('customHours').addEventListener('input', (e) => this.updateCustomHours(e.target.value));
        document.getElementById('wheelSpeed').addEventListener('input', (e) => this.updateWheelSpeed(e.target.value));

        // Spin wheel
        document.getElementById('spinWheelBtn').addEventListener('click', () => this.spinWheel());
    }

    // Task Management
    addTask() {
        const input = document.getElementById('taskInput');
        const text = input.value.trim();
        
        if (text) {
            const task = {
                id: Date.now(),
                text: text,
                completed: false,
                createdAt: new Date().toISOString()
            };
            
            this.tasks.push(task);
            this.saveData();
            this.renderTasks();
            input.value = '';
        }
    }

    toggleTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            this.saveData();
            this.renderTasks();
        }
    }

    deleteTask(taskId) {
        this.tasks = this.tasks.filter(t => t.id !== taskId);
        this.saveData();
        this.renderTasks();
    }

    renderTasks() {
        const taskList = document.getElementById('taskList');
        taskList.innerHTML = '';

        if (this.tasks.length === 0) {
            taskList.innerHTML = '<div class="empty-state">No tasks yet. Add your first task above!</div>';
            return;
        }

        this.tasks.forEach(task => {
            const taskElement = document.createElement('div');
            taskElement.className = `task-item ${task.completed ? 'completed' : ''}`;
            taskElement.innerHTML = `
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                <span class="task-text">${this.escapeHtml(task.text)}</span>
                <button class="delete-task-btn" aria-label="Delete task">🗑️</button>
            `;

            const checkbox = taskElement.querySelector('.task-checkbox');
            const deleteBtn = taskElement.querySelector('.delete-task-btn');

            checkbox.addEventListener('change', () => this.toggleTask(task.id));
            deleteBtn.addEventListener('click', () => this.deleteTask(task.id));

            taskList.appendChild(taskElement);
        });
    }

    // Timer Management
    calculateNextResetTime() {
        const now = new Date();
        
        switch (this.settings.resetInterval) {
            case 'daily':
                this.nextResetTime = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
                break;
            case '6h':
                this.nextResetTime = new Date(now.getTime() + 6 * 60 * 60 * 1000);
                break;
            case '12h':
                this.nextResetTime = new Date(now.getTime() + 12 * 60 * 60 * 1000);
                break;
            case 'custom':
                this.nextResetTime = new Date(now.getTime() + this.settings.customHours * 60 * 60 * 1000);
                break;
            default:
                this.nextResetTime = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
        }
    }

    startTimer() {
        this.updateTimer();
        this.timerInterval = setInterval(() => this.updateTimer(), 1000);
    }

    updateTimer() {
        if (!this.nextResetTime) {
            this.calculateNextResetTime();
        }

        const now = new Date();
        const timeLeft = this.nextResetTime - now;

        if (timeLeft <= 0) {
            this.resetTasks();
            this.calculateNextResetTime();
            this.showResetNotification();
        }

        const hours = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

        const timerDisplay = document.getElementById('timer');
        timerDisplay.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        this.updateTimerStatus();
    }

    updateTimerStatus() {
        const statusElement = document.getElementById('timerStatus');
        switch (this.settings.resetInterval) {
            case 'daily':
                statusElement.textContent = 'Daily Reset';
                break;
            case '6h':
                statusElement.textContent = 'Every 6 Hours';
                break;
            case '12h':
                statusElement.textContent = 'Every 12 Hours';
                break;
            case 'custom':
                statusElement.textContent = `Every ${this.settings.customHours} Hours`;
                break;
        }
    }

    resetTasks() {
        this.tasks.forEach(task => {
            task.completed = false;
        });
        this.saveData();
        this.renderTasks();
    }

    showResetNotification() {
        const notification = document.getElementById('resetNotification');
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    // Wheel Spinning
    spinWheel() {
        const incompleteTasks = this.tasks.filter(task => !task.completed);
        
        if (incompleteTasks.length === 0) {
            this.showWheelResult('No incomplete tasks to choose from!');
            return;
        }

        const spinBtn = document.getElementById('spinWheelBtn');
        const resultElement = document.getElementById('wheelResult');
        
        // Disable button and add spinning animation
        spinBtn.disabled = true;
        spinBtn.classList.add('spinning');
        resultElement.classList.remove('show');

        // Simulate spinning delay
        setTimeout(() => {
            const randomTask = incompleteTasks[Math.floor(Math.random() * incompleteTasks.length)];
            this.showWheelResult(`🎯 Try this: ${randomTask.text}`);
            
            // Remove spinning animation
            spinBtn.classList.remove('spinning');
            spinBtn.disabled = false;
        }, this.settings.wheelSpeed);
    }

    showWheelResult(text) {
        const resultElement = document.getElementById('wheelResult');
        resultElement.textContent = text;
        resultElement.classList.add('show');
        
        setTimeout(() => {
            resultElement.classList.remove('show');
        }, 5000);
    }

    // Settings Management
    openSettings() {
        document.getElementById('settingsModal').classList.add('show');
    }

    closeSettings() {
        document.getElementById('settingsModal').classList.remove('show');
    }

    setTheme(theme) {
        this.settings.theme = theme;
        this.updateTheme();
        this.updateSettingsUI();
        this.saveData();
    }

    updateTheme() {
        document.documentElement.setAttribute('data-theme', this.settings.theme);
    }

    updateSettingsUI() {
        // Update theme buttons
        document.getElementById('lightModeBtn').classList.toggle('active', this.settings.theme === 'light');
        document.getElementById('darkModeBtn').classList.toggle('active', this.settings.theme === 'dark');

        // Update reset interval
        document.getElementById('resetInterval').value = this.settings.resetInterval;
        this.toggleCustomHoursContainer();

        // Update custom hours
        document.getElementById('customHours').value = this.settings.customHours;

        // Update wheel speed
        document.getElementById('wheelSpeed').value = this.settings.wheelSpeed;
        document.getElementById('wheelSpeedValue').textContent = `${(this.settings.wheelSpeed / 1000).toFixed(1)}s`;
    }

    updateResetInterval(value) {
        this.settings.resetInterval = value;
        this.toggleCustomHoursContainer();
        this.calculateNextResetTime();
        this.saveData();
    }

    toggleCustomHoursContainer() {
        const container = document.getElementById('customHoursContainer');
        container.style.display = this.settings.resetInterval === 'custom' ? 'block' : 'none';
    }

    updateCustomHours(value) {
        this.settings.customHours = parseInt(value) || 24;
        if (this.settings.resetInterval === 'custom') {
            this.calculateNextResetTime();
            this.saveData();
        }
    }

    updateWheelSpeed(value) {
        this.settings.wheelSpeed = parseInt(value);
        document.getElementById('wheelSpeedValue').textContent = `${(this.settings.wheelSpeed / 1000).toFixed(1)}s`;
        this.saveData();
    }

    // Utility Functions
    updateDateDisplay() {
        const dateElement = document.getElementById('dateDisplay');
        const now = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        dateElement.textContent = now.toLocaleDateString('en-US', options);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TaskSpinApp();
});

// Add some CSS for empty state
const style = document.createElement('style');
style.textContent = `
    .empty-state {
        text-align: center;
        padding: 40px 20px;
        color: var(--text-muted);
        font-style: italic;
        background-color: var(--bg-secondary);
        border-radius: 12px;
        border: 2px dashed var(--border-color);
    }
`;
document.head.appendChild(style);
