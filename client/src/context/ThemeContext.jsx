// src/context/ThemeContext.jsx
import { createContext, useContext, useState, useEffect } from "react";

// Create context
export const ThemeContext = createContext(); // Export added here

// Provider component
export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false);

  // Load theme from localStorage on mount
  useEffect(() => {
    const storedTheme = localStorage.getItem("darkMode");
    if (storedTheme) {
      setDarkMode(storedTheme === "true");
      document.documentElement.classList.toggle("dark", storedTheme === "true");
    }
  }, []);

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      localStorage.setItem("darkMode", !prev);
      document.documentElement.classList.toggle("dark", !prev);
      return !prev;
    });
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook for convenience
export const useTheme = () => useContext(ThemeContext);
