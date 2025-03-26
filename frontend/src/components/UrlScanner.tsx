import { useState, useEffect } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faSpinner,
  faExclamationTriangle,
  faCheckCircle,
  faTimesCircle,
  faShieldAlt,
  faGlobe,
  faExpand,
  faBullseye,
} from "@fortawesome/free-solid-svg-icons";

const UrlScanner = () => {
  const [url, setUrl] = useState("");
  const [scanResults, setScanResults] = useState<any>(null);
  const [virusTotalResults, setVirusTotalResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiErrors, setApiErrors] = useState<string[]>([]);

  useEffect(() => {
    const storedResults = sessionStorage.getItem("scanResults");
    const storedVirusResults = sessionStorage.getItem("virusTotalResults");

    if (storedResults) setScanResults(JSON.parse(storedResults));
    if (storedVirusResults) setVirusTotalResults(JSON.parse(storedVirusResults));
  }, []);

  const handleScan = async () => {
    if (!url) {
      setError("Please enter a URL");
      return;
    }

    setLoading(true);
    setError(null);
    setApiErrors([]);

    try {
      const crawlerPromise = axios.post("https://safelink-backend-3v3n.onrender.com/crawler/scan", { url });
      const virusTotalPromise = axios.post("https://safelink-backend-3v3n.onrender.com/virustotal/virustotal_scan", { url });

      const [crawlerResponse, virusResponse] = await Promise.allSettled([crawlerPromise, virusTotalPromise]);

      if (crawlerResponse.status === "fulfilled") {
        setScanResults(crawlerResponse.value.data);
        sessionStorage.setItem("scanResults", JSON.stringify(crawlerResponse.value.data));
      } else {
        setApiErrors((prev) => [...prev, "Crawler scan failed."]);
      }

      if (virusResponse.status === "fulfilled") {
        setVirusTotalResults(virusResponse.value.data);
        sessionStorage.setItem("virusTotalResults", JSON.stringify(virusResponse.value.data));
      } else {
        setApiErrors((prev) => [...prev, "VirusTotal scan failed."]);
      }
    } catch (err) {
      setError("Unexpected error occurred during scanning.");
    } finally {
      setLoading(false);
    }
  };

  const viewFullScreen = (imageUrl: string) => {
    const newWindow = window.open(imageUrl, "_blank");
    if (newWindow) newWindow.focus();
  };

  // Determine website safety status
  const getWebsiteStatus = () => {
    if (!virusTotalResults) return "Unknown";

    if (virusTotalResults.malicious_detections > 0) {
      return "Malicious";
    } else {
      return "Safe";
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 rounded-lg shadow-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition mt-28 mb-28 ">
      {/* ✅ Hero Section */}
      <div className="text-center mb-6 ">
        <h1 className="text-4xl font-bold flex justify-center items-center gap-2 ">
          <FontAwesomeIcon icon={faBullseye} className="text-blue-500 animate-pulse" /> BULLS EYE
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">Your ultimate website safety scanner</p>
      </div>

      {/* ✅ Input & Button */}
      <div className="flex gap-2 mt-20" >
        <input
          type="text"
          placeholder="Enter website URL"
          className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button
          onClick={handleScan}
          className="px-5 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center gap-2"
          disabled={loading}
        >
          {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faSearch} />}
          {loading ? "Scanning..." : "Scan"}
        </button>
      </div>

      {error && <p className="text-red-500 mt-2">{error}</p>}

      {/* ✅ API Errors */}
      {apiErrors.length > 0 && (
        <div className="mt-2 p-3 bg-red-100 text-red-600 rounded">
          {apiErrors.map((err, index) => (
            <p key={index} className="flex items-center gap-2">
              <FontAwesomeIcon icon={faExclamationTriangle} /> {err}
            </p>
          ))}
        </div>
      )}

      {/* ✅ Website Status Indicator */}
      {/* ✅ Website Status Indicator */}
{virusTotalResults && (
  <div className="mt-6 flex items-center justify-center gap-3 p-4 rounded-lg font-bold text-white text-lg">
    {getWebsiteStatus() === "Malicious" ? (
      <>
        <FontAwesomeIcon icon={faTimesCircle} className="text-red-500 animate-pulse text-2xl" />
        <span className="text-red-700 px-4 py-2 rounded-lg"> Warning: Malicious Website</span>
      </>
    ) : (
      <>
        <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 animate-pulse text-2xl" />
        <span className=" text-xl  text-green-600 px-1 py-2 rounded-lg"> This Website is Safe</span>
      </>
    )}
  </div>
)}

      {/* ✅ Scan Results Section */}
      {scanResults && (
        <div className="mt-6 p-4 border rounded-lg bg-gray-100 dark:bg-gray-800">
          <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
            <FontAwesomeIcon icon={faGlobe} /> Crawler Results
          </h3>
          <p><strong>URL:</strong> {scanResults.url}</p>
          <p><strong>Title:</strong> {scanResults.crawler_results?.title || "N/A"}</p>
          <p><strong>Description:</strong> {scanResults.crawler_results?.description || "N/A"}</p>

          {scanResults.crawler_results.screenshot_url && (
            <div className="mt-4">
              <img 
                src={scanResults.crawler_results.screenshot_url} 
                alt="Website Screenshot" 
                className="mt-2 w-full rounded border cursor-pointer hover:opacity-80 transition"
                onClick={() => viewFullScreen(scanResults.crawler_results.screenshot_url)}
              />
              <button
                onClick={() => viewFullScreen(scanResults.crawler_results.screenshot_url)}
                className="mt-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faExpand} /> View Full Screen
              </button>
            </div>
          )}
        </div>
      )}

      {/* ✅ VirusTotal Results */}
      {virusTotalResults && (
        <div className="mt-6 p-4 border rounded-lg bg-gray-100 dark:bg-gray-800">
          <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
            <FontAwesomeIcon icon={faCheckCircle} /> VirusTotal Results
          </h3>
          <p><strong>Status:</strong> {virusTotalResults.status || "Unknown"}</p>
          <p><strong>Total Scans:</strong> {virusTotalResults.total_scans || "Unknown"}</p>
          <p><strong>Malicious Detections:</strong> {virusTotalResults.malicious_detections || "Null"}</p>
          <p><strong>Last Scan Date:</strong> {virusTotalResults.last_scan_date || "Unknown"}</p>
        </div>
      )}
    </div>
  );
};

export default UrlScanner;
