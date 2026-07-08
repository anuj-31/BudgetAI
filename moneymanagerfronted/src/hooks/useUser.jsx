import {useContext, useEffect} from "react";
import {AppContext} from "../context/AppContext.jsx";
import {useNavigate} from "react-router-dom";
import axiosConfig from "../util/axiosConfig.jsx";
import {API_ENDPOINTS} from "../util/apiEndpoints.js";

export const useUser = () => {
    const {user, setUser, clearUser} = useContext(AppContext);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            clearUser();
            navigate("/login");
            return;
        }

        if (user) {
            return;
        }

        let isMounted = true;

        const fetchUserInfo = async () => {
            try {
                const response = await axiosConfig.get(API_ENDPOINTS.GET_USER_INFO);

                if (isMounted && response.data) {
                    setUser(response.data);
                }

            }catch (error) {
                console.log("Failed to fetch the user info", error);
                if (isMounted) {
                    clearUser();
                    const status = error.response?.status;
                    if (status === 401 || status === 403) {
                        navigate("/login");
                    }
                }
            }
        }

        fetchUserInfo();

        return () => {
            isMounted = false;
        }
    }, [user, setUser, clearUser, navigate]);

}
