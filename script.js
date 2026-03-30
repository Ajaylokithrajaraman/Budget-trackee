

// ============ STATE MANAGEMENT ============

let users = JSON.parse(localStorage.getItem("budgetTrackerUsers")) || [];
let currentUser = null;
let expenses = [];
let budget = 0;

// ============ INITIALIZATION ============

document.addEventListener('DOMContentLoaded', function() {
    checkUserSession();
    
    // Dark mode persistence
    if (localStorage.getItem("darkMode") === "true") {
        document.body.classList.add("dark");
    }
    
    // Set default date after DOM is fully loaded
    setTimeout(function() {
        setDefaultDate();
    }, 100);
});

function checkUserSession() {
    let loggedInUser = localStorage.getItem("loggedInUser");
    
    if (loggedInUser) {
        currentUser = JSON.parse(loggedInUser);
        loadUserData();
        showApp();
    } else {
        showAuthPage();
    }
}

function setDefaultDate() {
    let today = new Date().toISOString().split('T')[0];
    document.getElementById("date").value = today;
}

// ============ VIEW MODE TOGGLE ============

function setViewMode(mode) {
    let authContainer = document.getElementById("authSection");
    let buttons = document.querySelectorAll(".view-toggle-btn");
    
    // Remove active class from all buttons
    buttons.forEach(btn => btn.classList.remove("active"));
    
    // Add active class to clicked button using event target
    if (event && event.target) {
        event.target.classList.add("active");
    }
    
    // Toggle mobile-view class
    if (mode === 'mobile') {
        authContainer.classList.add("mobile-view");
        localStorage.setItem("viewMode", "mobile");
    } else {
        authContainer.classList.remove("mobile-view");
        localStorage.setItem("viewMode", "desktop");
    }
    
    console.log("View mode changed to:", mode);
    console.log("Mobile view class present:", authContainer.classList.contains("mobile-view"));
}

// ============ AUTHENTICATION FUNCTIONS ============

function toggleAuthForm() {
    event.preventDefault();
    document.getElementById("loginForm").classList.toggle("active");
    document.getElementById("registerForm").classList.toggle("active");
    clearAuthErrors();
}

function handleRegister() {
    let name = document.getElementById("registerName").value.trim();
    let email = document.getElementById("registerEmail").value.trim();
    let password = document.getElementById("registerPassword").value;
    let confirmPassword = document.getElementById("registerConfirm").value;
    let errorDiv = document.getElementById("registerError");

    errorDiv.classList.remove("show");
    errorDiv.innerText = "";

    // Validation
    if (!name || !email || !password || !confirmPassword) {
        showError(errorDiv, "Please fill all fields");
        return;
    }

    if (name.length < 3) {
        showError(errorDiv, "Name must be at least 3 characters");
        return;
    }

    if (!isValidEmail(email)) {
        showError(errorDiv, "Please enter a valid email");
        return;
    }

    if (password.length < 6) {
        showError(errorDiv, "Password must be at least 6 characters");
        return;
    }

    if (password !== confirmPassword) {
        showError(errorDiv, "Passwords don't match");
        return;
    }

    // Check if email already exists
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        showError(errorDiv, "Email already registered");
        return;
    }

    // Create new user
    let newUser = {
        id: Date.now(),
        name: name,
        email: email,
        password: btoa(password), // Simple encoding (not recommended for real apps)
        createdAt: new Date().toLocaleString(),
        expenses: []
    };

    users.push(newUser);
    localStorage.setItem("budgetTrackerUsers", JSON.stringify(users));

    showSuccess(errorDiv, "Registration successful! Please login.");
    
    setTimeout(() => {
        toggleAuthForm();
        document.getElementById("registerName").value = "";
        document.getElementById("registerEmail").value = "";
        document.getElementById("registerPassword").value = "";
        document.getElementById("registerConfirm").value = "";
    }, 1500);
}

function handleLogin() {
    let email = document.getElementById("loginEmail").value.trim();
    let password = document.getElementById("loginPassword").value;
    let errorDiv = document.getElementById("loginError");

    errorDiv.classList.remove("show");
    errorDiv.innerText = "";

    if (!email || !password) {
        showError(errorDiv, "Please enter email and password");
        return;
    }

    let user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
        showError(errorDiv, "Email not registered");
        return;
    }

    if (btoa(password) !== user.password) {
        showError(errorDiv, "Incorrect password");
        return;
    }

    currentUser = user;
    localStorage.setItem("loggedInUser", JSON.stringify(currentUser));
    loadUserData();
    showApp();
}

function logout() {
    if (confirm("Are you sure you want to logout?")) {
        // Save user data before logout
        let userIndex = users.findIndex(u => u.id === currentUser.id);
        if (userIndex > -1) {
            users[userIndex].expenses = expenses;
            users[userIndex].budget = budget;
            localStorage.setItem("budgetTrackerUsers", JSON.stringify(users));
        }

        localStorage.removeItem("loggedInUser");
        currentUser = null;
        expenses = [];
        budget = 0;
        clearAuthErrors();
        document.getElementById("loginEmail").value = "";
        document.getElementById("loginPassword").value = "";
        showAuthPage();
    }
}

// ============ UI FUNCTIONS ============

function showAuthPage() {
    document.getElementById("authSection").classList.remove("hidden");
    document.getElementById("appSection").classList.add("hidden");
    document.getElementById("loginForm").classList.add("active");
    document.getElementById("registerForm").classList.remove("active");
}

function showApp() {
    document.getElementById("authSection").classList.add("hidden");
    document.getElementById("appSection").classList.remove("hidden");
    document.getElementById("userDisplayName").innerText = currentUser.name;
    renderExpenses();
    updateBudgetDisplay();
}

function clearAuthErrors() {
    document.getElementById("loginError").classList.remove("show");
    document.getElementById("registerError").classList.remove("show");
}

function showError(element, message) {
    element.innerText = "❌ " + message;
    element.classList.add("show");
}

function showSuccess(element, message) {
    element.innerHTML = "✅ " + message;
    element.classList.add("show");
    element.style.background = "#dcfce7";
    element.style.color = "#166534";
}

// ============ DATA MANAGEMENT ============

function loadUserData() {
    let user = users.find(u => u.id === currentUser.id);
    if (user) {
        expenses = user.expenses || [];
        budget = user.budget || 0;
        document.getElementById("budgetDisplay").innerText = budget;
    }
}

function saveUserData() {
    let userIndex = users.findIndex(u => u.id === currentUser.id);
    if (userIndex > -1) {
        users[userIndex].expenses = expenses;
        users[userIndex].budget = budget;
        localStorage.setItem("budgetTrackerUsers", JSON.stringify(users));
    }
}

// ============ BUDGET FUNCTIONS ============

function setBudget() {
    let budgetLimit = document.getElementById("budgetLimit").value;

    if (!budgetLimit || budgetLimit <= 0) {
        alert("Please enter a valid budget amount");
        return;
    }

    budget = Number(budgetLimit);
    updateBudgetDisplay();
    saveUserData();
    alert("Budget set to ₹" + budget);
}

function updateBudgetDisplay() {
    document.getElementById("budgetDisplay").innerText = budget;
}

// ============ EXPENSE FUNCTIONS ============

function addExpense() {
    let amount = document.getElementById("amount").value;
    let category = document.getElementById("category").value;
    let description = document.getElementById("description").value;
    let date = document.getElementById("date").value;

    if (!amount || !category || !description || !date) {
        alert("⚠️ Please fill all fields");
        return;
    }

    let expense = {
        id: Date.now(),
        amount: Number(amount),
        category: category,
        description: description,
        date: date,
        createdAt: new Date().toLocaleString()
    };

    expenses.push(expense);
    saveUserData();
    renderExpenses();

    // Clear form
    document.getElementById("amount").value = "";
    document.getElementById("category").value = "";
    document.getElementById("description").value = "";
    document.getElementById("date").value = new Date().toISOString().split('T')[0];

    alert("✅ Expense added successfully");
}

function deleteExpense(id) {
    if (confirm("Are you sure you want to delete this expense?")) {
        expenses = expenses.filter(exp => exp.id !== id);
        saveUserData();
        renderExpenses();
    }
}

function editExpense(id) {
    let expense = expenses.find(exp => exp.id === id);
    if (expense) {
        document.getElementById("amount").value = expense.amount;
        document.getElementById("category").value = expense.category;
        document.getElementById("description").value = expense.description;
        document.getElementById("date").value = expense.date;
        
        // Add an update button temporarily
        let oldButton = document.querySelector(".btn-primary");
        let updateBtn = document.createElement("button");
        updateBtn.className = "btn btn-success";
        updateBtn.innerText = "💾 UPDATE EXPENSE";
        updateBtn.onclick = function() {
            updateExpense(id);
        };
        
        let cancelBtn = document.createElement("button");
        cancelBtn.className = "btn btn-secondary";
        cancelBtn.innerText = "❌ CANCEL";
        cancelBtn.style.marginTop = "10px";
        cancelBtn.style.width = "100%";
        cancelBtn.onclick = function() {
            document.getElementById("amount").value = "";
            document.getElementById("category").value = "";
            document.getElementById("description").value = "";
            document.getElementById("date").value = new Date().toISOString().split('T')[0];
            updateBtn.remove();
            cancelBtn.remove();
        };
        
        oldButton.parentNode.insertBefore(updateBtn, oldButton.nextSibling);
        updateBtn.parentNode.insertBefore(cancelBtn, updateBtn.nextSibling);
        oldButton.style.display = "none";
    }
}

function updateExpense(id) {
    let amount = document.getElementById("amount").value;
    let category = document.getElementById("category").value;
    let description = document.getElementById("description").value;
    let date = document.getElementById("date").value;

    if (!amount || !category || !description || !date) {
        alert("Please fill all fields");
        return;
    }

    let expenseIndex = expenses.findIndex(exp => exp.id === id);
    if (expenseIndex > -1) {
        expenses[expenseIndex].amount = Number(amount);
        expenses[expenseIndex].category = category;
        expenses[expenseIndex].description = description;
        expenses[expenseIndex].date = date;
        
        saveUserData();
        renderExpenses();
        
        // Reset form
        document.getElementById("amount").value = "";
        document.getElementById("category").value = "";
        document.getElementById("description").value = "";
        document.getElementById("date").value = new Date().toISOString().split('T')[0];
        
        alert("✅ Expense updated successfully");
    }
}

function renderExpenses() {
    let tbody = document.getElementById("expenseBody");
    tbody.innerHTML = "";

    let totalSpent = 0;
    let search = document.getElementById("searchCategory").value.toLowerCase();
    let filterDate = document.getElementById("filterDate").value;

    if (expenses.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #999;">No expenses added yet</td></tr>`;
        checkBudgetStatus(0);
        return;
    }

    expenses.forEach((exp) => {
        // Apply filters
        if (search && !exp.category.toLowerCase().includes(search)) return;
        if (filterDate && exp.date !== filterDate) return;

        totalSpent += exp.amount;

        tbody.innerHTML += `
            <tr>
                <td><strong>₹${exp.amount}</strong></td>
                <td>${exp.category}</td>
                <td>${exp.description}</td>
                <td>${exp.date}</td>
                <td>${exp.createdAt}</td>
                <td>
                    <button class="btn-edit" onclick="editExpense(${exp.id})">✏️ Edit</button>
                    <button class="btn-delete" onclick="deleteExpense(${exp.id})">🗑️ Delete</button>
                </td>
            </tr>
        `;
    });

    document.getElementById("total").innerText = totalSpent;
    checkBudgetStatus(totalSpent);
}

function checkBudgetStatus(totalSpent) {
    let alertMsg = document.getElementById("alertMessage");

    alertMsg.classList.remove("show", "warning", "success");

    if (budget > 0) {
        if (totalSpent > budget) {
            alertMsg.innerHTML = "⚠️ <strong>Budget Exceeded!</strong> You've spent ₹" + (totalSpent - budget) + " more than your budget.";
            alertMsg.classList.add("show", "warning");
        } else if (totalSpent > budget * 0.8) {
            alertMsg.innerHTML = "📊 You've spent " + Math.round((totalSpent / budget) * 100) + "% of your budget.";
            alertMsg.classList.add("show", "warning");
        }
    }
}

// ============ DARK MODE ============

function toggleDarkMode() {
    document.body.classList.toggle("dark");
    localStorage.setItem("darkMode", document.body.classList.contains("dark"));
}

// ============ EXPORT FUNCTIONS ============

function exportToPDF() {
    if (expenses.length === 0) {
        alert("No expenses to export");
        return;
    }

    let htmlContent = `
        <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    h1 { color: #667eea; text-align: center; }
                    .user-info { text-align: center; color: #666; margin-bottom: 20px; }
                    .summary { background: #f0f0f0; padding: 15px; border-radius: 8px; margin: 20px 0; }
                    .summary-item { display: inline-block; margin-right: 30px; }
                    .summary-item strong { display: block; color: #667eea; font-size: 1.2em; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th { background: #667eea; color: white; padding: 12px; text-align: left; }
                    td { padding: 10px; border-bottom: 1px solid #ddd; }
                    tr:nth-child(even) { background: #f9f9f9; }
                    .total-row { font-weight: bold; background: #e8e8e8; }
                    .footer { text-align: center; margin-top: 30px; color: #999; font-size: 12px; }
                </style>
            </head>
            <body>
                <h1>💰 Budget Tracker Report</h1>
                <div class="user-info">
                    <p><strong>User:</strong> ${currentUser.name}</p>
                    <p><strong>Email:</strong> ${currentUser.email}</p>
                    <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
                </div>
                
                <div class="summary">
                    <div class="summary-item">
                        <strong>Total Budget:</strong>
                        <span>₹${budget}</span>
                    </div>
                    <div class="summary-item">
                        <strong>Total Spent:</strong>
                        <span>₹${expenses.reduce((sum, exp) => sum + exp.amount, 0)}</span>
                    </div>
                    <div class="summary-item">
                        <strong>Remaining:</strong>
                        <span>₹${budget - expenses.reduce((sum, exp) => sum + exp.amount, 0)}</span>
                    </div>
                </div>

                <h2>Expense Details</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Category</th>
                            <th>Description</th>
                            <th>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${expenses.map(exp => `
                            <tr>
                                <td>${exp.date}</td>
                                <td>${exp.category}</td>
                                <td>${exp.description}</td>
                                <td>₹${exp.amount}</td>
                            </tr>
                        `).join('')}
                        <tr class="total-row">
                            <td colspan="3">TOTAL</td>
                            <td>₹${expenses.reduce((sum, exp) => sum + exp.amount, 0)}</td>
                        </tr>
                    </tbody>
                </table>

                <div class="footer">
                    <p>This is an automatically generated report from Budget Tracker.</p>
                </div>
            </body>
        </html>
    `;

    let opt = {
        margin: 10,
        filename: 'Budget_Report_' + new Date().getTime() + '.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
    };

    html2pdf().set(opt).from(htmlContent).save();
}

function exportToExcel() {
    if (expenses.length === 0) {
        alert("No expenses to export");
        return;
    }

    let csv = "Date,Category,Description,Amount,Added At\n";

    expenses.forEach(exp => {
        csv += `"${exp.date}","${exp.category}","${exp.description}",${exp.amount},"${exp.createdAt}"\n`;
    });

    csv += `\n\nSummary\n`;
    csv += `Total Budget,${budget}\n`;
    csv += `Total Spent,${expenses.reduce((sum, exp) => sum + exp.amount, 0)}\n`;
    csv += `Remaining,${budget - expenses.reduce((sum, exp) => sum + exp.amount, 0)}\n`;

    let blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    let link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Budget_Report_" + new Date().getTime() + ".csv";
    link.click();
}

// ============ HELPER FUNCTIONS ============

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
