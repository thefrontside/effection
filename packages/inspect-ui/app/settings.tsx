import React, { createContext, useContext, useState } from 'react';

interface Settings {
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

export const SettingsContext = createContext<{ settings: Settings, setSettings(settings: Settings): void }>({
  settings: DEFAULT_SETTINGS,
  setSettings: () => {},
});

export function SettingsMenu(): JSX.Element {
  let [isOpen, setOpen] = useState(false);
  let { settings, setSettings } = useContext(SettingsContext);

  return (
    <div className="settings-menu">
      <button className="settings-menu--toggle" onClick={() => setOpen(!isOpen)}>
        <img src={(new URL("settings-icon.svg", import.meta.url)).toString()}/>
        <span>Settings</span>
      </button>
      {isOpen ? (
        <ol className="settings-menu--body">
          <li>
            <label>
              <input type="checkbox" checked={settings.showCompleted} onChange={(event) => setSettings({ ...settings, showCompleted: event.target.checked })}/>&nbsp;
              Show completed
            </label>
          </li>
          <li>
            <label>
              <input type="checkbox" checked={settings.showErrored} onChange={(event) => setSettings({ ...settings, showErrored: event.target.checked })}/>&nbsp;
              Show errored
            </label>
          </li>
          <li>
            <label>
              <input type="checkbox" checked={settings.showHalted} onChange={(event) => setSettings({ ...settings, showHalted: event.target.checked })}/>&nbsp;
              Show halted
            </label>
          </li>
          <li>
            <label>
              <input type="checkbox" checked={settings.showStackTraces} onChange={(event) => setSettings({ ...settings, showStackTraces: event.target.checked })}/>&nbsp;
              Show stack traces
            </label>
          </li>
        </ol>
      ) : null}
    </div>
  );
}
