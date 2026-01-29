import { useEffect } from 'react';
import { Header } from './components/layout/Header';
import { CsvUploader } from './components/upload/CsvUploader';
import { Dashboard } from './components/visualization/Dashboard';
import { useDataStore } from './context/DataContext';
import { decodeStateFromUrl, applyUrlState } from './utils/urlState';

function App() {
  const {
    darkMode,
    dataLoaded,
    setRatePeriods,
    setBatteryConfig,
    setSolarConfig,
  } = useDataStore();

  // Load configuration from URL on mount
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const urlState = decodeStateFromUrl(searchParams);

    if (Object.keys(urlState).length > 0) {
      applyUrlState(urlState, {
        setRatePeriods,
        setBatteryConfig,
        setSolarConfig,
      });
      // Clear URL params after loading
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [setRatePeriods, setBatteryConfig, setSolarConfig]);

  // Apply dark mode class to document element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="container mx-auto py-8 px-4">
        {!dataLoaded ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <CsvUploader />
          </div>
        ) : (
          <Dashboard />
        )}
      </main>
    </div>
  );
}

export default App;
