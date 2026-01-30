import { Moon, Sun, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDataStore } from '@/context/DataContext';

export function Header() {
  const { darkMode, toggleDarkMode, dataLoaded, clearConsumptionData } = useDataStore();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="flex items-center gap-2">
          <img src="/logo.svg" alt="SPARK Logo" className="w-8 h-8" />
          <div>
            <h1 className="text-2xl font-bold">SPARK</h1>
            <p className="text-xs text-muted-foreground">Solar Planning And ROI Kit</p>
          </div>
        </div>

        <div className="flex-1" />

        <nav className="flex items-center gap-2">
          {dataLoaded && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearConsumptionData}
              className="gap-2"
            >
              <Upload className="w-4 h-4" />
              New Upload
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            aria-label="Toggle dark mode"
          >
            {darkMode ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </Button>
        </nav>
      </div>
    </header>
  );
}
