import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./components/UrlScanner";
import AllScans from "./components/AllScans";
import InfoSection from "./components/InfoSection";

const App = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      {/* Main Content Area */}
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/all-scans" element={<AllScans />} />
          <Route path="/info" element={<InfoSection />} /> 
        </Routes>
      </main>

      {/* Info Section (before Footer) */}
      <InfoSection />

      <Footer />
    </div>
  );
};

export default App;
