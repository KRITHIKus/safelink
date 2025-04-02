import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.tsx";
import Footer from "./components/Footer";
import Home from "./components/UrlScanner";
import AllScans from "./components/AllScans";
import InfoSection from "./components/InfoSection";
const App = () => {
    return (_jsxs("div", { className: "flex flex-col min-h-screen", children: [_jsx(Navbar, {}), _jsx("main", { className: "flex-grow", children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(Home, {}) }), _jsx(Route, { path: "/all-scans", element: _jsx(AllScans, {}) }), _jsx(Route, { path: "/info", element: _jsx(InfoSection, {}) })] }) }), _jsx(InfoSection, {}), _jsx(Footer, {})] }));
};
export default App;
