import { useState, useEffect } from "react";
import axios from "axios";
import { FaShieldAlt, FaClock } from "react-icons/fa"; // Using only relevant icons

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL; // ✅ Using backend URL from .env

const AllScans = () => {
  const [scans, setScans] = useState<any[]>([]);
  const [filteredScans, setFilteredScans] = useState<any[]>([]);
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
    } catch (error) {
      console.error("Error fetching scans:", error);
      setScans([]);
      setFilteredScans([]);
    }
  };

  useEffect(() => {
    let url = `${BACKEND_URL}/db/get-urls-by-status`;

    if (statusFilter === "Safe") {
      url += "?status=safe";
    } else if (statusFilter === "Malicious") {
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

  return (
    <div className="max-w-4xl mx-auto p-6 bg-[#1e293b] text-white rounded-lg shadow-lg mt-24 mb-16 transition-all">
      {/* Slogan with Animation */}
      <h2 className="text-3xl font-bold mb-6 text-center">
        <span className="animate-glow text-blue-400">Shield</span> Your Web Experience{" "}
        <FaShieldAlt className="inline-block text-blue-400" />
      </h2>

      {/* Filters Section */}
      <div className="flex flex-wrap gap-4 mb-6 justify-center">
        <select
          className="p-2 border bg-[#334155] text-white rounded focus:outline-none focus:ring focus:ring-blue-400 transition-all"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="All">All</option>
          <option value="Safe">Safe</option>
          <option value="Malicious">Malicious</option>
        </select>
      </div>

      {/* List of Scans */}
      {filteredScans.length > 0 ? (
        <ul className="space-y-4">
          {filteredScans.map((scan, index) => (
            <li
              key={index}
              className="p-4 bg-[#334155] rounded-lg shadow-md transition-transform hover:scale-105 hover:bg-[#3b4252]"
            >
              <p>
                <strong className="text-blue-300">URL:</strong> {scan.url}
              </p>
              <p>
                <strong className="text-blue-300">Status:</strong> {scan.virustotal_results?.status || "Unknown"}
              </p>
              <p>
                <strong className="text-blue-300">Scan Date:</strong>{" "}
                {scan.timestamp ? new Date(scan.timestamp).toLocaleString() : "Unknown"}
                <FaClock className="inline-block ml-2 text-gray-400" />
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-400 text-center mt-4">No scans found.</p>
      )}
    </div>
  );
};

export default AllScans;
