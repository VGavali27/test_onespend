import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

// Available font options
export const fontOptions = [
  { id: 'inter', label: 'Inter', family: "'Inter', system-ui, -apple-system, sans-serif" },
  { id: 'roboto', label: 'Roboto', family: "'Roboto', system-ui, -apple-system, sans-serif" },
  { id: 'poppins', label: 'Poppins', family: "'Poppins', system-ui, -apple-system, sans-serif" },
  { id: 'system', label: 'System Default', family: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" },
];

// Font size options (scale factor applied to base)
export const fontSizeOptions = [
  { id: 'small', label: 'Small', scale: 14 },
  { id: 'medium', label: 'Medium', scale: 16 },
  { id: 'large', label: 'Large', scale: 18 },
];

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [fontFamily, setFontFamily] = useState(() => localStorage.getItem('fontFamily') || 'inter');
  const [fontSize, setFontSize] = useState(() => localStorage.getItem('fontSize') || 'medium');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Apply font family
  useEffect(() => {
    const option = fontOptions.find((f) => f.id === fontFamily) || fontOptions[0];
    document.documentElement.style.setProperty('--font-sans', option.family);
    localStorage.setItem('fontFamily', fontFamily);
  }, [fontFamily]);

  // Apply font size (scales the base root font-size)
  useEffect(() => {
    const option = fontSizeOptions.find((f) => f.id === fontSize) || fontSizeOptions[1];
    document.documentElement.style.fontSize = `${option.scale}px`;
    localStorage.setItem('fontSize', fontSize);
  }, [fontSize]);

  const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, fontFamily, setFontFamily, fontSize, setFontSize }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
