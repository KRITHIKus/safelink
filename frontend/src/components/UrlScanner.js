import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faSpinner, faExclamationTriangle, faCheckCircle, faTimesCircle, faGlobe, faExpand, faBullseye, } from "@fortawesome/free-solid-svg-icons";
const UrlScanner = () => {
    const [url, setUrl] = useState("");
    const [scanResults, setScanResults] = useState(null);
    const [virusTotalResults, setVirusTotalResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [apiErrors, setApiErrors] = useState([]);
    useEffect(() => {
        const storedResults = sessionStorage.getItem("scanResults");
        const storedVirusResults = sessionStorage.getItem("virusTotalResults");
        if (storedResults)
            setScanResults(JSON.parse(storedResults));
        if (storedVirusResults)
            setVirusTotalResults(JSON.parse(storedVirusResults));
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
            }
            else {
                setApiErrors((prev) => [...prev, "Crawler scan failed."]);
            }
            if (virusResponse.status === "fulfilled") {
                setVirusTotalResults(virusResponse.value.data);
                sessionStorage.setItem("virusTotalResults", JSON.stringify(virusResponse.value.data));
            }
            else {
                setApiErrors((prev) => [...prev, "VirusTotal scan failed."]);
            }
        }
        catch (err) {
            setError("Unexpected error occurred during scanning.");
        }
        finally {
            setLoading(false);
        }
    };
    const viewFullScreen = (imageUrl) => {
        const newWindow = window.open(imageUrl, "_blank");
        if (newWindow)
            newWindow.focus();
    };
    // Determine website safety status
    const getWebsiteStatus = () => {
        if (!virusTotalResults)
            return "Unknown";
        if (virusTotalResults.malicious_detections > 0) {
            return "Malicious";
        }
        else {
            return "Safe";
        }
    };
    return (_jsxs("div", { className: "max-w-4xl mx-auto p-6 rounded-lg shadow-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition mt-28 mb-28 ", children: [_jsxs("div", { className: "text-center mb-6 ", children: [_jsxs("h1", { className: "text-4xl font-bold flex justify-center items-center gap-2 ", children: [_jsx(FontAwesomeIcon, { icon: faBullseye, className: "text-blue-500 animate-pulse" }), " BULLS EYE"] }), _jsx("p", { className: "text-gray-600 dark:text-gray-300 mt-2", children: "Your ultimate website safety scanner" })] }), _jsxs("div", { className: "flex gap-2 mt-20", children: [_jsx("input", { type: "text", placeholder: "Enter website URL", className: "flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition", value: url, onChange: (e) => setUrl(e.target.value) }), _jsxs("button", { onClick: handleScan, className: "px-5 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center gap-2", disabled: loading, children: [loading ? _jsx(FontAwesomeIcon, { icon: faSpinner, spin: true }) : _jsx(FontAwesomeIcon, { icon: faSearch }), loading ? "Scanning..." : "Scan"] })] }), error && _jsx("p", { className: "text-red-500 mt-2", children: error }), apiErrors.length > 0 && (_jsx("div", { className: "mt-2 p-3 bg-red-100 text-red-600 rounded", children: apiErrors.map((err, index) => (_jsxs("p", { className: "flex items-center gap-2", children: [_jsx(FontAwesomeIcon, { icon: faExclamationTriangle }), " ", err] }, index))) })), virusTotalResults && (_jsx("div", { className: "mt-6 flex items-center justify-center gap-3 p-4 rounded-lg font-bold text-white text-lg", children: getWebsiteStatus() === "Malicious" ? (_jsxs(_Fragment, { children: [_jsx(FontAwesomeIcon, { icon: faTimesCircle, className: "text-red-500 animate-pulse text-2xl" }), _jsx("span", { className: "text-red-700 px-4 py-2 rounded-lg", children: " Warning: Malicious Website" })] })) : (_jsxs(_Fragment, { children: [_jsx(FontAwesomeIcon, { icon: faCheckCircle, className: "text-green-500 animate-pulse text-2xl" }), _jsx("span", { className: " text-xl  text-green-600 px-1 py-2 rounded-lg", children: " This Website is Safe" })] })) })), scanResults && (_jsxs("div", { className: "mt-6 p-4 border rounded-lg bg-gray-100 dark:bg-gray-800", children: [_jsxs("h3", { className: "text-lg font-bold mb-2 flex items-center gap-2", children: [_jsx(FontAwesomeIcon, { icon: faGlobe }), " Crawler Results"] }), _jsxs("p", { children: [_jsx("strong", { children: "URL:" }), " ", scanResults.url] }), _jsxs("p", { children: [_jsx("strong", { children: "Title:" }), " ", scanResults.crawler_results?.title || "N/A"] }), _jsxs("p", { children: [_jsx("strong", { children: "Description:" }), " ", scanResults.crawler_results?.description || "N/A"] }), scanResults.crawler_results.screenshot_url && (_jsxs("div", { className: "mt-4", children: [_jsx("img", { src: scanResults.crawler_results.screenshot_url, alt: "Website Screenshot", className: "mt-2 w-full rounded border cursor-pointer hover:opacity-80 transition", onClick: () => viewFullScreen(scanResults.crawler_results.screenshot_url) }), _jsxs("button", { onClick: () => viewFullScreen(scanResults.crawler_results.screenshot_url), className: "mt-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition flex items-center gap-2", children: [_jsx(FontAwesomeIcon, { icon: faExpand }), " View Full Screen"] })] }))] })), virusTotalResults && (_jsxs("div", { className: "mt-6 p-4 border rounded-lg bg-gray-100 dark:bg-gray-800", children: [_jsxs("h3", { className: "text-lg font-bold mb-2 flex items-center gap-2", children: [_jsx(FontAwesomeIcon, { icon: faCheckCircle }), " VirusTotal Results"] }), _jsxs("p", { children: [_jsx("strong", { children: "Status:" }), " ", virusTotalResults.status || "Unknown"] }), _jsxs("p", { children: [_jsx("strong", { children: "Total Scans:" }), " ", virusTotalResults.total_scans || "Unknown"] }), _jsxs("p", { children: [_jsx("strong", { children: "Malicious Detections:" }), " ", virusTotalResults.malicious_detections || "Null"] }), _jsxs("p", { children: [_jsx("strong", { children: "Last Scan Date:" }), " ", virusTotalResults.last_scan_date || "Unknown"] })] }))] }));
};
export default UrlScanner;
