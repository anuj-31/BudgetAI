import Dashboard from "../components/Dashboard.jsx";
import {useUser} from "../hooks/useUser.jsx";
import {useEffect, useState, useContext} from "react";
import { AppContext } from "../context/AppContext.jsx";
import axiosConfig from "../util/axiosConfig.jsx";
import {API_ENDPOINTS, BASE_URL} from "../util/apiEndpoints.js";
import toast from "react-hot-toast";
import IncomeList from "../components/IncomeList.jsx";
import Modal from "../components/Modal.jsx";
import AddIncomeForm from "../components/AddIncomeForm.jsx";
import DeleteAlert from "../components/DeleteAlert.jsx";
import IncomeOverview from "../components/IncomeOverview.jsx";

const Income = () => {
    useUser();
    const { user } = useContext(AppContext);

    const getIncomeStorageKey = () => {
        if (!user) return 'incomes_guest';
        return `incomes_${user.id || user._id || user.email}`;
    }

    const [incomeData, setIncomeData] = useState(() => {
        try {
            const raw = localStorage.getItem(getIncomeStorageKey());
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    });
    const setAndPersistIncomeData = (updater) => {
        setIncomeData((prev) => {
            const next = typeof updater === "function" ? updater(prev) : updater;
            const safeNext = Array.isArray(next) ? next : [];
            try { localStorage.setItem(getIncomeStorageKey(), JSON.stringify(safeNext)); } catch (e) {}
            return safeNext;
        });
    }

    useEffect(() => {
        fetchIncomeDetails();
        fetchIncomeCategories();
    }, [user]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);

    const [openAddIncomeModal, setOpenAddIncomeModal] = useState(false);
    const [openDeleteAlert, setOpenDeleteAlert] = useState({
        show: false,
        data: null,
    });

    
        const normalizeIncomeItem = (item) => ({
            id: item.id || item._id || (item.categoryId ? `${item.categoryId}-${item.date}-${item.amount}` : undefined),
            name: item.name || item.title || "",
            amount: item.amount ?? item.value ?? 0,
            date: item.date || item.createdAt || "",
            icon: item.icon || item.emoji || "",
            categoryId: item.categoryId || item.category?.id || item.category || "",
            categoryName: item.categoryName || item.category?.name || item.category || "",
            category: item.category || item.categoryId || null,
        });

        // Fetch income details from the API
        const fetchIncomeDetails = async () => {
            setLoading(true);

            try {
                const response = await axiosConfig.get(API_ENDPOINTS.GET_ALL_INCOMES);
                if (response.status === 200) {
                    const raw =
                        Array.isArray(response.data) ? response.data :
                        Array.isArray(response.data?.data) ? response.data.data :
                        Array.isArray(response.data?.incomes) ? response.data.incomes :
                        [];

                    const normalized = raw.map(normalizeIncomeItem);
                    setAndPersistIncomeData(normalized);
                }
            }catch(error) {
                console.error('Failed to fetch income details:', error);
                toast.error(error.response?.data?.message || "Failed to fetch income details");
                setAndPersistIncomeData((prev) => Array.isArray(prev) ? prev : []);
            }finally {
                setLoading(false);
            }
        }

    // Fetch categories for income
    const fetchIncomeCategories = async () => {
        try {
            const response = await axiosConfig.get(API_ENDPOINTS.CATEGORY_BY_TYPE("income"));
            if (response.status === 200) {
                console.log('income categories', response.data);
                    const categoriesResponse =
                        Array.isArray(response.data) ? response.data :
                        Array.isArray(response.data?.data) ? response.data.data :
                        response.data?.categories || [];
                    setCategories(categoriesResponse);
            }
        }catch(error) {
            console.log('Failed to fetch income categories:', error);
            toast.error(error.data?.message || "Failed to fetch income categories");
        }
    }

    //save the income details
    const handleAddIncome = async (income) => {
        const {name, amount, date, icon, categoryId} = income;

        //validation
        if (!name.trim()) {
            toast.error("Please enter a name");
            return;
        }

        if (!amount || isNaN(amount) || Number(amount) <= 0) {
            toast.error("Amount should be a valid number greater than 0");
            return;
        }

        if (!date) {
            toast.error("Please select a date");
            return;
        }

        const today = new Date().toISOString().split('T')[0];
        if (date > today) {
            toast.error('Date cannot be in the future');
            return;
        }

        if (!categoryId) {
            toast.error("Please select a category");
            return;
        }

        try {
                const payload = { name, amount: Number(amount), date, icon, categoryId };
                console.log('handleAddIncome payload:', payload);
                const response = await axiosConfig.post(API_ENDPOINTS.ADD_INCOME, payload)
                console.log('handleAddIncome response:', response);
                if (response.status === 201 || response.status === 200) {
                    toast.success("Income added successfully");
                    setOpenAddIncomeModal(false);

                    const createdRaw = response.data?.data || response.data || payload;
                    const createdIncome = normalizeIncomeItem(createdRaw);
                    setAndPersistIncomeData((prev) => [createdIncome, ...(Array.isArray(prev) ? prev : [])]);

                    await fetchIncomeDetails();
                    await fetchIncomeCategories();
                }
        }catch(error){
            console.log('Error adding income', error);
            toast.error(error.response?.data?.message || "Failed to adding income");
        }
    }

    //delete income details
    const deleteIncome = async (id) => {
        try {
            await axiosConfig.delete(API_ENDPOINTS.DELETE_INCOME(id));
            setOpenDeleteAlert({show: false, data: null});
            toast.success("Income deleted successfully");
            fetchIncomeDetails();
        }catch(error) {
            console.log('Error deleting income', error);
            toast.error(error.response?.data?.message || "Failed to delete income");
        }
    }

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
            toast.error("No income data available to download.");
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

    const handleDownloadIncomeDetails = async() => {
        const csvFilename = "income_details.csv";

        if (incomeData && incomeData.length > 0) {
            downloadCsvFromData(incomeData, csvFilename);
            toast.success("Income details downloaded successfully.");
            return;
        }

        try {
            const response = await axiosConfig.get(API_ENDPOINTS.INCOME_EXCEL_DOWNLOAD, {
                responseType: "arraybuffer",
            });

            if (response.data && response.data.byteLength > 0) {
                const blob = new Blob([response.data], {
                    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.setAttribute("download", "income_details.xlsx");
                document.body.appendChild(link);
                link.click();
                link.parentNode.removeChild(link);
                window.URL.revokeObjectURL(url);
                toast.success("Download income details successfully");
                return;
            }

            toast.error("No income data available for download.");
        } catch (error) {
            console.error('Error downloading income details:', error);
            toast.error(error.response?.data?.message || "Failed to download income");
        }
    }

    const handleEmailIncomeDetails = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            toast.error("Please login to send income email.");
            return;
        }

        try {
            const response = await axiosConfig.get(API_ENDPOINTS.EMAIL_INCOME, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                responseType: "text",
            });
            if (response.status === 200) {
                toast.success("Income details emailed successfully");
            }
        }catch(error) {
            console.error('Error emailing income details:', error);
            if (error.response?.status === 403) {
                toast.error("Authorization failed. Please login again.");
            } else {
                toast.error(error.response?.data?.message || "Failed to email income");
            }
        }
    }

    useEffect(() => {
        fetchIncomeDetails();
        fetchIncomeCategories()
    }, []);

    // Debug helper to quickly add a sample income for testing
    const testAddSampleIncome = async () => {
        if (!categories || categories.length === 0) {
            toast.error("No income categories available to assign sample income.");
            return;
        }

        const sample = {
                name: "Test Salary",
                amount: 1000,
                date: new Date().toISOString().split('T')[0],
                icon: "",
                categoryId: categories[0].id || categories[0]._id || categories[0].value,
        };

        await handleAddIncome(sample);
    }

    return (
        <Dashboard activeMenu="Income">
            <div className="my-5 mx-auto">
                <div className="grid grid-cols-1 gap-6">
                    <div>
                        {/* overview for income with line char */}
                        <IncomeOverview transactions={incomeData} onAddIncome={() => setOpenAddIncomeModal(true)} />
                        <div className="mt-2">
                            <button onClick={testAddSampleIncome} className="card-btn">Add Test Income</button>
                        </div>
                    </div>

                    <IncomeList
                        transactions={incomeData}
                        onDelete={(id) => setOpenDeleteAlert({show: true, data: id})}
                        onDownload={handleDownloadIncomeDetails}
                        onEmail={handleEmailIncomeDetails}
                    />

                    {/* Add Income Modal */}
                    <Modal
                        isOpen={openAddIncomeModal}
                        onClose={() => setOpenAddIncomeModal(false)}
                        title="Add Income"
                    >
                        <AddIncomeForm
                            onAddIncome={(income) => handleAddIncome(income)}
                            categories={categories}
                        />
                    </Modal>

                    {/* Delete Income Modal */}
                    <Modal
                        isOpen={openDeleteAlert.show}
                        onClose={() => setOpenDeleteAlert({show: false, data: null})}
                        title="Delete Income"
                    >
                        <DeleteAlert
                            content="Are you sure want to delete this income details?"
                            onDelete={() => deleteIncome(openDeleteAlert.data)}
                        />
                    </Modal>
                </div>
            </div>
        </Dashboard>
    )
}

export default Income;