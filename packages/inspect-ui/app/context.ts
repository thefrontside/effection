import { createContext } from 'react';

export interface Settings {
  showCompleted: boolean;
  showErrored: boolean;
  showHalted: boolean;
  showStackTraces: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  showCompleted: false,
  showErrored: true,
  showHalted: false,
  showStackTraces: false,
};

export const SettingsContext = createContext<{
  settings: Settings;
  setSettings(settings: Settings): void;
}>({
  settings: DEFAULT_SETTINGS,
  setSettings: () => {},
});
