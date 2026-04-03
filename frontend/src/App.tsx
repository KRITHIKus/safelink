import { Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { SystemStatusProvider } from "./context/SystemStatusContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./components/UrlScanner";
import AllScans from "./components/AllScans";
import About from "./components/InfoSection";

const App = () => {
  return (
    <ThemeProvider>
      <SystemStatusProvider>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            minHeight: "100vh",
            background: "var(--bg-base)",
            color: "var(--text-primary)",
            transition: "background 600ms ease-in-out, color 600ms ease-in-out",
          }}
        >
          <Navbar />
          <main style={{ flexGrow: 1 }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/all-scans" element={<AllScans />} />
              <Route path="/about" element={<About />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </SystemStatusProvider>
    </ThemeProvider>
  );
};

export default App;