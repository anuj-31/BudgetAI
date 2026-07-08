import Dashboard from "../components/Dashboard.jsx";
import {useUser} from "../hooks/useUser.jsx";
import {Plus} from "lucide-react";
import CategoryList from "../components/CategoryList.jsx";
import {useEffect, useState} from "react";
import axiosConfig from "../util/axiosConfig.jsx";
import {API_ENDPOINTS} from "../util/apiEndpoints.js";
import toast from "react-hot-toast";
import Modal from "../components/Modal.jsx";
import AddCategoryForm from "../components/AddCategoryForm.jsx";

const Category = () => {
    useUser();
    const [loading, setLoading] = useState(false);
    const [categoryData, setCategoryData] = useState([]);
    const [openAddCategoryModal, setOpenAddCategoryModal] = useState(false);
    const [openEditCategoryModal, setOpenEditCategoryModal] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);

    const normalizeCategory = (category) => ({
        ...category,
        type: category.type || category.categoryType || "income",
        categoryType: category.type || category.categoryType || "income",
    });

    const fetchCategoryDetails = async (force = false) => {
        if (loading && !force) return;

        setLoading(true);

        try {
            const response = await axiosConfig.get(API_ENDPOINTS.GET_ALL_CATEGORIES);
            if (response.status === 200) {
                const rawCategories =
                    Array.isArray(response.data) ? response.data :
                    Array.isArray(response.data?.data) ? response.data.data :
                    Array.isArray(response.data?.categories) ? response.data.categories :
                    [];

                console.log('categories', rawCategories);
                setCategoryData(rawCategories.map(normalizeCategory));
            }
        } catch (error) {
            console.error('Something went wrong. Please try again.', error);
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchCategoryDetails();
    }, []);

    const handleAddCategory = async (category) => {
        const {name, type, icon} = category;

        if (!name.trim()) {
            toast.error("Category Name is required");
            return;
        }

        //check if the category already exists
        const isDuplicate = categoryData.some((category) => {
            return category.name.toLowerCase() === name.trim().toLowerCase();
        })

        if (isDuplicate) {
            toast.error("Category Name already exists");
            return;
        }

        try {
            const response = await axiosConfig.post(API_ENDPOINTS.ADD_CATEGORY, {
                name,
                type,
                icon,
                categoryType: type,
            });
            if (response.status === 201) {
                toast.success("Category added successfully");
                setOpenAddCategoryModal(false);
                fetchCategoryDetails();
            }
        }catch (error) {
            console.error('Error adding category:', error);
            toast.error(error.response?.data?.message || "Failed to add category.");
        }
    }

    const handleEditCategory = (categoryToEdit) => {
        setSelectedCategory(normalizeCategory(categoryToEdit));
        setOpenEditCategoryModal(true);
    }

    const handleUpdateCategory = async (updatedCategory) => {
        const id = updatedCategory.id || updatedCategory._id;
        const finalType = updatedCategory.type || updatedCategory.categoryType || "income";
        const {name, icon} = updatedCategory;

        if (!name.trim()) {
            toast.error("Category Name is required");
            return;
        }

        if (!id) {
            toast.error("Category ID is missing for update");
            return;
        }

        try {
            // First, update the local state immediately for instant UI feedback
            setCategoryData((prev) =>
                prev.map((category) => {
                    const currentId = category.id || category._id;
                    if (currentId === id || String(currentId) === String(id)) {
                        return {
                            ...category,
                            name,
                            type: finalType,
                            categoryType: finalType,
                            icon,
                        };
                    }
                    return category;
                })
            );

            // Then send the update to the server
            const response = await axiosConfig.put(API_ENDPOINTS.UPDATE_CATEGORY(id), {
                name,
                type: finalType,
                icon,
                categoryType: finalType,
            });

            if (response.status === 200 || response.status === 201 || response.status === 204) {
                await fetchCategoryDetails(true);
                setOpenEditCategoryModal(false);
                setSelectedCategory(null);
                toast.success("Category updated successfully");
            }
        } catch (error) {
            console.error('Error updating category:', error.response?.data?.message || error.message);
            toast.error(error.response?.data?.message || "Failed to update category.");
            // Revert the local state on error by refetching
            fetchCategoryDetails(true);
        }
    }

    return (
        <Dashboard activeMenu="Category">
            <div className="my-5 mx-auto">
                {/* Add button to add category*/}
                <div className="flex justify-between items-center mb-5">
                    <h2 className="text-2xl font-semibold">All Categories</h2>
                    <button
                        onClick={() => setOpenAddCategoryModal(true)}
                        className="add-btn flex items-center gap-1">
                        <Plus size={15} />
                        Add Category
                    </button>
                </div>

                {/* Category list */}
                <CategoryList categories={categoryData} onEditCategory={handleEditCategory} />

                {/* Adding category modal*/}
                <Modal
                    isOpen={openAddCategoryModal}
                    onClose={() => setOpenAddCategoryModal(false)}
                    title="Add Category"
                >
                    <AddCategoryForm onAddCategory={handleAddCategory}/>
                </Modal>
                {/* Updating category modal*/}
                <Modal
                    onClose={() =>{
                        setOpenEditCategoryModal(false);
                        setSelectedCategory(null);
                    }}
                    isOpen={openEditCategoryModal}
                    title="Update Category"
                >
                    <AddCategoryForm
                        initialCategoryData={selectedCategory}
                        onAddCategory={handleUpdateCategory}
                        isEditing={true}
                    />
                </Modal>
            </div>
        </Dashboard>
    )
}

export default Category;