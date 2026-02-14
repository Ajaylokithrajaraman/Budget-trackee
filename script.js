let expenses = JSON.parse(localStorage.getItem("expenses")) || [];
let editIndex = -1;
let budget = localStorage.getItem("budget") || 0;

document.getElementById("budgetDisplay").innerText = budget;

if (localStorage.getItem("darkMode") === "true") {
    document.body.classList.add("dark");
}

if (localStorage.getItem("loggedIn") === "true") {
    showApp();
}

function login() {
    let user = document.getElementById("username").value;
    let pass = document.getElementById("password").value;

    if (user === "admin" && pass === "1234") {
        localStorage.setItem("loggedIn", "true");
        showApp();
    } else {
        alert("Invalid Login");
    }
}

function logout() {
    localStorage.clear();
    location.reload();
}

function showApp() {
    document.getElementById("loginSection").classList.add("hidden");
    document.getElementById("appSection").classList.remove("hidden");
    renderExpenses();
}

function toggleDarkMode() {
    document.body.classList.toggle("dark");
    localStorage.setItem("darkMode", document.body.classList.contains("dark"));
}

function setBudget() {
    budget = document.getElementById("budgetLimit").value;
    localStorage.setItem("budget", budget);
    document.getElementById("budgetDisplay").innerText = budget;
    checkBudget();
}

function addExpense() {
    let amount = document.getElementById("amount").value;
    let category = document.getElementById("category").value;
    let description = document.getElementById("description").value;
    let date = document.getElementById("date").value;

    if (!amount || !category || !description || !date) {
        alert("Fill all fields");
        return;
    }

    let expense = {
        amount,
        category,
        description,
        date,
        createdAt: new Date().toLocaleString()
    };

    if (editIndex === -1) {
        expenses.push(expense);
    } else {
        expenses[editIndex] = expense;
        editIndex = -1;
    }

    localStorage.setItem("expenses", JSON.stringify(expenses));
    renderExpenses();
}

function renderExpenses() {
    let tbody = document.getElementById("expenseBody");
    tbody.innerHTML = "";

    let total = 0;
    let search = document.getElementById("searchCategory").value.toLowerCase();
    let filterDate = document.getElementById("filterDate").value;

    expenses.forEach((exp, index) => {

        if (search && !exp.category.toLowerCase().includes(search)) return;
        if (filterDate && exp.date !== filterDate) return;

        total += Number(exp.amount);

        tbody.innerHTML += `
            <tr>
                <td>₹${exp.amount}</td>
                <td>${exp.category}</td>
                <td>${exp.description}</td>
                <td>${exp.date}</td>
                <td>${exp.createdAt}</td>
                <td>
                    <button onclick="editExpense(${index})">Edit</button>
                    <button onclick="deleteExpense(${index})">Delete</button>
                </td>
            </tr>
        `;
    });

    document.getElementById("total").innerText = total;
    checkBudget(total);
}

function editExpense(index) {
    let exp = expenses[index];
    document.getElementById("amount").value = exp.amount;
    document.getElementById("category").value = exp.category;
    document.getElementById("description").value = exp.description;
    document.getElementById("date").value = exp.date;
    editIndex = index;
}

function deleteExpense(index) {
    expenses.splice(index, 1);
    localStorage.setItem("expenses", JSON.stringify(expenses));
    renderExpenses();
}

function checkBudget(total = 0) {
    let alertMsg = document.getElementById("alertMessage");

    if (budget && total > budget) {
        alertMsg.innerText = "⚠ Budget Limit Exceeded!";
        alertMsg.classList.add("danger");
    } else {
        alertMsg.innerText = "";
    }
}

function exportToExcel() {
    let csv = "Amount,Category,Description,Date,Added At\n";

    expenses.forEach(exp => {
        csv += `${exp.amount},${exp.category},${exp.description},${exp.date},${exp.createdAt}\n`;
    });

    let blob = new Blob([csv], { type: "text/csv" });
    let link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "budget_data.csv";
    link.click();
}
