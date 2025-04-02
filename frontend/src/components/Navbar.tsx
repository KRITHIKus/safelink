import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faTimes } from "@fortawesome/free-solid-svg-icons";

const Navbar = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
  }, [isOpen]);

  const closeMenu = () => setIsOpen(false);

  return (
    <nav className="fixed top-0 left-0 w-full bg-gradient-to-r from-[#0a0f29] to-[#11193f] shadow-md px-6 py-4 flex justify-between items-center transition-all duration-300 z-50">
      {/* Logo */}
      <Link to="/" className="text-2xl font-bold text-white tracking-wide">
        SafeSurf
      </Link>

      {/* Desktop Navigation */}
      <div className="hidden md:flex gap-6 items-center">
        <Link
          to="/"
          className={`text-white transition-all duration-300 hover:text-blue-400 ${
            location.pathname === "/" ? "font-semibold border-b-2 border-blue-400" : ""
          }`}
        >
          Home
        </Link>
        <Link
          to="/all-scans"
          className={`text-white transition-all duration-300 hover:text-blue-400 ${
            location.pathname === "/all-scans" ? "font-semibold border-b-2 border-blue-400" : ""
          }`}
        >
          Scans
        </Link>

        {/* Rickroll Prank Link */}
        <a
          href="https://youtu.be/xvFZjo5PgG0?feature=shared"
          target="_blank"
          rel="noopener noreferrer"
          className="text-white transition-all duration-300 hover:text-blue-400"
        >
          Click for the source
        </a>
      </div>

      {/* Mobile Menu Button */}
      <button
        className="md:hidden text-white focus:outline-none transition-transform duration-300 transform hover:scale-110 hover:text-blue-400 hover:bg-white/10 p-2 rounded-full"
        onClick={() => setIsOpen(!isOpen)}
      >
        <FontAwesomeIcon icon={isOpen ? faTimes : faBars} size="lg" />
      </button>

      {/* Mobile Navigation */}
      <div
        className={`fixed top-0 left-0 w-full h-screen bg-black/60 backdrop-blur-md flex flex-col items-center justify-center transition-all duration-500 ${
          isOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
        onClick={closeMenu}
      >
        <div
          className={`bg-[#121a36] p-6 rounded-lg shadow-xl flex flex-col items-center gap-6 max-h-screen overflow-y-auto transform transition-all duration-500 ${
            isOpen ? "translate-y-0 opacity-100" : "-translate-y-10 opacity-0"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button Inside Menu */}
          <button
            className="self-end text-white text-2xl focus:outline-none transition-transform duration-300 transform hover:scale-110 hover:text-blue-400"
            onClick={closeMenu}
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>

          <Link
            to="/"
            className={`text-white text-lg transition-all duration-300 hover:text-blue-400 ${
              location.pathname === "/" ? "font-semibold border-b-2 border-blue-400" : ""
            }`}
            onClick={closeMenu}
          >
            Home
          </Link>

          <Link
            to="/all-scans"
            className={`text-white text-lg transition-all duration-300 hover:text-blue-400 ${
              location.pathname === "/all-scans" ? "font-semibold border-b-2 border-blue-400" : ""
            }`}
            onClick={closeMenu}
          >
            Scans
          </Link>

          {/* Rickroll Prank Link in Mobile */}
          <a
            href="https://youtu.be/xvFZjo5PgG0?feature=shared"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white text-lg transition-all duration-300 hover:text-blue-400"
          >
            Click for the source
          </a>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
