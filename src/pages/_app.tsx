// _app.tsx
import React, { useEffect, useState } from 'react';
import { AppProps } from 'next/app';
import { NextUIProvider, createTheme } from "@nextui-org/react";
import "@/src/styles/globals.css";

// Custom themes
const darkTheme = createTheme({
  type: 'dark', // Default dark theme
  theme: {
    colors: {
      background: '#1a1a1a',
      text: '#fff',
      primary: '#3B82F6',
    }
  }
});

const lightTheme = createTheme({
  type: 'light',
  theme: {
    colors: {
      background: '#ffffff',
      text: '#000',
      primary: '#3B82F6',
    }
  }
});

function MyApp({ Component, pageProps }: AppProps) {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true); // Default dark mode

  useEffect(() => {
    // Get the user's theme preference from local storage or system default
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    } else {
      const prefersDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setIsDarkMode(prefersDarkMode);
    }
  }, []);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    localStorage.setItem('theme', isDarkMode ? 'light' : 'dark');
  };

  return (
    <NextUIProvider theme={isDarkMode ? darkTheme : lightTheme}>
      <Component {...pageProps} toggleTheme={toggleTheme} />
    </NextUIProvider>
  );
}

export default MyApp;
