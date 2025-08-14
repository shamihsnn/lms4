import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useToast } from './use-toast';

export function useKeyboardShortcuts() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Only trigger if no input/textarea is focused
      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey
      ) {
        return;
      }

      switch (event.key.toLowerCase()) {
        case 'd':
          setLocation('/dashboard');
          showShortcutToast('Dashboard');
          break;
        case 'p':
          setLocation('/patients');
          showShortcutToast('Patients');
          break;
        case 'r':
          setLocation('/reports');
          showShortcutToast('Reports');
          break;
        case 't':
          setLocation('/tests/cbc'); // Default test page
          showShortcutToast('Tests');
          break;
        case '?':
          showHelpToast();
          break;
      }
    };

    const showShortcutToast = (page: string) => {
      toast({
        title: `Navigated to ${page}`,
        description: "Use '?' key to see all shortcuts",
        duration: 2000,
      });
    };

    const showHelpToast = () => {
      toast({
        title: "Keyboard Shortcuts",
        description: `
          D - Dashboard
          P - Patients
          R - Reports
          T - Tests
          ? - Show this help
        `,
        duration: 5000,
      });
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [setLocation, toast]);
}
