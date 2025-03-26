import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import axios from "axios";
import { FaShieldAlt, FaClock } from "react-icons/fa"; // Using only relevant icons
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL; // ✅ Using backend URL from .env
const AllScans = () => {
    const [scans, setScans] = useState([]);
    const [filteredScans, setFilteredScans] = useState([]);
    const [statusFilter, setStatusFilter] = useState("All");
    useEffect(() => {
        fetchScans();
    }, []);
    const fetchScans = async () => {
        try {
            const response = await axios.get(`${BACKEND_URL}/db/get-urls-by-status`);
            const data = Array.isArray(response.data) ? response.data : [];
            setScans(data);
            setFilteredScans(data);
        }
        catch (error) {
            console.error("Error fetching scans:", error);
            setScans([]);
            setFilteredScans([]);
        }
    };
    useEffect(() => {
        let url = `${BACKEND_URL}/db/get-urls-by-status`;
        if (statusFilter === "Safe") {
            url += "?status=safe";
        }
        else if (statusFilter === "Malicious") {
            url += "?status=malicious";
        }
        axios
            .get(url)
            .then((response) => {
            const data = Array.isArray(response.data) ? response.data : [];
            setFilteredScans(data);
        })
            .catch((error) => {
            console.error(`Error fetching ${statusFilter} scans:`, error);
            setFilteredScans([]);
        });
    }, [statusFilter]);
    return (_jsxs("div", { className: "max-w-4xl mx-auto p-6 bg-[#1e293b] text-white rounded-lg shadow-lg mt-24 mb-16 transition-all", children: [_jsxs("h2", { className: "text-3xl font-bold mb-6 text-center", children: [_jsx("span", { className: "animate-glow text-blue-400", children: "Shield" }), " Your Web Experience", " ", _jsx(FaShieldAlt, { className: "inline-block text-blue-400" })] }), _jsx("div", { className: "flex flex-wrap gap-4 mb-6 justify-center", children: _jsxs("select", { className: "p-2 border bg-[#334155] text-white rounded focus:outline-none focus:ring focus:ring-blue-400 transition-all", value: statusFilter, onChange: (e) => setStatusFilter(e.target.value), children: [_jsx("option", { value: "All", children: "All" }), _jsx("option", { value: "Safe", children: "Safe" }), _jsx("option", { value: "Malicious", children: "Malicious" })] }) }), filteredScans.length > 0 ? (_jsx("ul", { className: "space-y-4", children: filteredScans.map((scan, index) => (_jsxs("li", { className: "p-4 bg-[#334155] rounded-lg shadow-md transition-transform hover:scale-105 hover:bg-[#3b4252]", children: [_jsxs("p", { children: [_jsx("strong", { className: "text-blue-300", children: "URL:" }), " ", scan.url] }), _jsxs("p", { children: [_jsx("strong", { className: "text-blue-300", children: "Status:" }), " ", scan.virustotal_results?.status || "Unknown"] }), _jsxs("p", { children: [_jsx("strong", { className: "text-blue-300", children: "Scan Date:" }), " ", scan.timestamp ? new Date(scan.timestamp).toLocaleString() : "Unknown", _jsx(FaClock, { className: "inline-block ml-2 text-gray-400" })] })] }, index))) })) : (_jsx("p", { className: "text-gray-400 text-center mt-4", children: "No scans found." }))] }));
};
export default AllScans;
