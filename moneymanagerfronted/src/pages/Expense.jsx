import { useEffect, useState, useContext } from "react";
import toast from "react-hot-toast";
import {useUser} from "../hooks/useUser.jsx";
import axiosConfig from "../util/axiosConfig.jsx";
import {API_ENDPOINTS, BASE_URL} from "../util/apiEndpoints.js";
import Dashboard from "../components/Dashboard.jsx";
import { AppContext } from "../context/AppContext.jsx";
import ExpenseOverview from "../components/ExpenseOverview.jsx";
import ExpenseList from "../components/ExpenseList.jsx";
import Modal from "../components/Modal.jsx";
import AddExpenseForm from "../components/AddExpenseForm.jsx";
import DeleteAlert from "../components/DeleteAlert.jsx";

const Expense = () => {
    useUser();
    const { user } = useContext(AppContext);

    const getExpenseStorageKey = () => {
        if (!user) return 'expenses_guest';
        return `expenses_${user.id || user._id || user.email}`;
    }

    const [expenseData, setExpenseData] = useState(() => {
        try {
            const raw = localStorage.getItem(getExpenseStorageKey());
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    });

    const setAndPersistExpenseData = (updater) => {
        setExpenseData((prev) => {
            const next = typeof updater === "function" ? updater(prev) : updater;
            const safeNext = Array.isArray(next) ? next : [];
            try { localStorage.setItem(getExpenseStorageKey(), JSON.stringify(safeNext)); } catch (e) {}
            return safeNext;
        });
    }

    useEffect(() => {
        fetchExpenseDetails();
        fetchExpenseCategories();
    }, [user]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [openAddExpenseModal, setOpenAddExpenseModal] = useState(false);
    const [openDeleteAlert, setOpenDeleteAlert] = useState({
        show: false,
        data: null,
    });

    const normalizeExpenseItem = (item) => ({
        id: item.id || item._id || (item.categoryId ? `${item.categoryId}-${item.date}-${item.amount}` : undefined),
        name: item.name || item.title || "",
        amount: item.amount ?? item.value ?? 0,
        date: item.date || item.createdAt || "",
        icon: item.icon || item.emoji || "",
        categoryId: item.categoryId || item.category?.id || item.category || "",
        categoryName: item.categoryName || item.category?.name || item.category || "",
        category: item.category || item.categoryId || null,
    });

    // Get All Expense Details
    const fetchExpenseDetails = async () => {
        setLoading(true);

        try {
            const response = await axiosConfig.get(`${API_ENDPOINTS.GET_ALL_EXPENSE}`);
            console.log('fetchExpenseDetails response:', response);

            const raw =
                Array.isArray(response.data) ? response.data :
                Array.isArray(response.data?.data) ? response.data.data :
                Array.isArray(response.data?.expenses) ? response.data.expenses :
                [];

            const normalized = raw.map(normalizeExpenseItem);
            setAndPersistExpenseData(normalized);
            }catch(error) {
            console.error("Failed to fetch expense details:", error);
            toast.error("Failed to fetch expense details.");
            setAndPersistExpenseData((prev) => Array.isArray(prev) ? prev : []);
        } finally {
            setLoading(false);
        }
    };

    // New: Fetch Expense Categories
    const fetchExpenseCategories = async () => {
        try {
            const response = await axiosConfig.get(API_ENDPOINTS.CATEGORY_BY_TYPE("expense"));
            const categoriesResponse =
                Array.isArray(response.data) ? response.data :
                Array.isArray(response.data?.data) ? response.data.data :
                response.data?.categories || [];
            setCategories(categoriesResponse);
        } catch (error) {
            console.error("Failed to fetch expense categories:", error);
            toast.error("Failed to fetch expense categories.");
        }
    };


    // Handle Add Expense
    const handleAddExpense = async (expense) => {
        const { name, categoryId, amount, date, icon } = expense; // Changed 'category' to 'categoryId'

        if (!name.trim()) {
            toast.error("Name is required.");
            return;
        }

        // Validation Checks
        if (!categoryId) { // Validate categoryId now
            toast.error("Category is required.");
            return;
        }

        if (!amount || isNaN(amount) || Number(amount) <= 0) {
            toast.error("Amount should be a valid number greater than 0.");
            return;
        }

        if (!date) {
            toast.error("Date is required.");
            return;
        }

        const today = new Date().toISOString().split('T')[0];
        if (date > today) {
            toast.error('Date cannot be in the future');
            return;
        }

        try {
            const payload = {
                name,
                categoryId,
                amount: Number(amount),
                date,
                icon,
            };
            console.log('handleAddExpense payload:', payload);
            const response = await axiosConfig.post(API_ENDPOINTS.ADD_EXPENSE, payload);
            console.log('handleAddExpense response:', response);

            if (response.status === 201 || response.status === 200) {
                toast.success("Expense added successfully");
                setOpenAddExpenseModal(false);

                const createdRaw = response.data?.data || response.data || payload;
                const createdExpense = normalizeExpenseItem(createdRaw);
                setAndPersistExpenseData((prev) => [createdExpense, ...(Array.isArray(prev) ? prev : [])]);

                await fetchExpenseDetails();
                await fetchExpenseCategories();
            }
        } catch (error) {
            console.error(
                "Error adding expense:",
                error.response?.data?.message || error.message
            );
            toast.error(error.response?.data?.message || "Failed to add expense.");
        }
    };

    // Debug helper to quickly add a sample expense for testing
    const testAddSampleExpense = async () => {
        if (!categories || categories.length === 0) {
            toast.error("No expense categories available to assign sample expense.");
            return;
        }

        const sample = {
            name: "Test Expense",
            categoryId: categories[0].id || categories[0]._id || categories[0].value,
            amount: 50,
            date: new Date().toISOString().split('T')[0],
            icon: "",
        };

        await handleAddExpense(sample);
    };

    // Delete Expense
    const deleteExpense = async (id) => {
        try {
            await axiosConfig.delete(API_ENDPOINTS.DELETE_EXPENSE(id));

            setOpenDeleteAlert({ show: false, data: null });
            toast.success("Expense details deleted successfully");
            fetchExpenseDetails();
        } catch (error) {
            console.error(
                "Error deleting expense:",
                error.response?.data?.message || error.message
            );
            toast.error(error.response?.data?.message || "Failed to delete expense.");
        }
    };

    const formatExportDate = (dateValue) => {
        if (!dateValue) return "";
        if (typeof dateValue === "string") {
            const parsed = new Date(dateValue);
            if (!isNaN(parsed)) {
                return parsed.toISOString().split("T")[0];
            }
            return dateValue;
        }
        if (dateValue instanceof Date) {
            return dateValue.toISOString().split("T")[0];
        }
        return String(dateValue);
    };

    const downloadCsvFromData = (items, filename) => {
        if (!Array.isArray(items) || items.length === 0) {
            toast.error("No expense data available to download.");
            return;
        }

        const escapeCsv = (value) => {
            if (value === null || value === undefined) return "";
            const text = String(value);
            return text.includes(",") || text.includes("\"") || text.includes("\n")
                ? `"${text.replace(/"/g, '""')}"`
                : text;
        };

        const rows = items.map((item, index) => [
            index + 1,
            item.name || "",
            item.categoryName || item.category || "",
            item.amount ?? "",
            formatExportDate(item.date),
        ]);

        const csvContent = [
            ["S.No", "Name", "Category", "Amount", "Date"].map(escapeCsv).join(","),
            ...rows.map(row => row.map(escapeCsv).join(",")),
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);
    };

    const downloadBlobFile = async (endpoint, filename) => {
        const token = localStorage.getItem("token");

        try {
            const response = await fetch(`${BASE_URL}${endpoint}`, {
                method: "GET",
                headers: {
                    Accept: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });

            if (!response.ok) {
                throw new Error(`Download request failed with status ${response.status}`);
            }

            const blob = await response.blob();
            if (!blob || blob.size === 0) {
                throw new Error("Received empty file from server");
            }

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
            return true;
        } catch (error) {
            console.error("Expense download error:", error);
            return false;
        }
    };

    const handleDownloadExpenseDetails = async () => {
        const csvFilename = "expense_details.csv";

        if (expenseData && expenseData.length > 0) {
            downloadCsvFromData(expenseData, csvFilename);
            toast.success("Expense details downloaded successfully.");
            return;
        }

        try {
            const response = await axiosConfig.get(API_ENDPOINTS.EXPENSE_EXCEL_DOWNLOAD, {
                responseType: "arraybuffer",
            });

            if (response.data && response.data.byteLength > 0) {
                const blob = new Blob([response.data], {
                    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.setAttribute("download", "expense_details.xlsx");
                document.body.appendChild(link);
                link.click();
                link.parentNode.removeChild(link);
                window.URL.revokeObjectURL(url);
                toast.success("Expense details downloaded successfully!");
                return;
            }

            toast.error("No expense data available for download.");
        } catch (error) {
            console.error("Error downloading expense details:", error);
            toast.error("Failed to download expense details. Please try again.");
        }
    };

    const handleEmailExpenseDetails = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            toast.error("Please login to send expense email.");
            return;
        }

        try {
            const response = await axiosConfig.get(API_ENDPOINTS.EMAIL_EXPENSE, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                responseType: "text",
            });
            if(response.status === 200) {
                toast.success("Email sent");
            }
        }catch (e) {
            console.error("Error emailing expense details:", e);
            if (e.response?.status === 403) {
                toast.error("Authorization failed. Please login again.");
            } else {
                toast.error("Failed to email expense details. Please try again.");
            }
        }
    }

    useEffect(() => {
        fetchExpenseDetails();
        fetchExpenseCategories(); // Fetch categories when component mounts
    }, []);

    return (
        <Dashboard activeMenu="Expense">
            <div className="my-5 mx-auto">
                <div className="grid grid-cols-1 gap-6">
                    <div className="">
                        <ExpenseOverview
                            transactions={expenseData}
                            onExpenseIncome={() => setOpenAddExpenseModal(true)}
                        />
                        <div className="mt-2">
                            <button onClick={testAddSampleExpense} className="card-btn">Add Test Expense</button>
                        </div>
                    </div>

                    <ExpenseList
                        transactions={expenseData}
                        onDelete={(id) => {
                            setOpenDeleteAlert({ show: true, data: id });
                        }}
                        onDownload={handleDownloadExpenseDetails}
                        onEmail={handleEmailExpenseDetails}
                    />

                    <Modal
                        isOpen={openAddExpenseModal}
                        onClose={() => setOpenAddExpenseModal(false)}
                        title="Add Expense"
                    >
                        {/* Pass the fetched expense categories to the AddExpenseForm */}
                        <AddExpenseForm
                            onAddExpense={handleAddExpense}
                            categories={categories} // Pass categories here
                        />
                    </Modal>

                    <Modal
                        isOpen={openDeleteAlert.show}
                        onClose={() => setOpenDeleteAlert({ show: false, data: null })}
                        title="Delete Expense"
                    >
                        <DeleteAlert
                            content="Are you sure you want to delete this expense detail?"
                            onDelete={() => deleteExpense(openDeleteAlert.data)}
                        />
                    </Modal>
                </div>
            </div>
        </Dashboard>
    );
};

export default Expense;