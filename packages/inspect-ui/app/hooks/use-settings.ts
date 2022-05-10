import { useContext, useMemo } from "react";
import { To, useNavigate, useSearchParams } from "react-router-dom";
import { Settings, SettingsContext } from "../context";
import { searchString } from "../utils/search-string";

interface UseSettings {
  settings: Settings;
  setSettings(settings: Settings): void;
  toSettings: To;
  isShowingSettings: boolean;
  closeSettings: () => void;
}

export function useSettings(): UseSettings {
  let { settings, setSettings } = useContext(SettingsContext);
  let [search] = useSearchParams();
  let navigate = useNavigate();
  let isShowingSettings = search.has("showSettings");

  let toSettings = useMemo(
    () => ({
      search: searchString({
        showSettings: isShowingSettings ? undefined : true,
      }),
    }),
    [isShowingSettings]
  );

  return {
    settings,
    setSettings,
    isShowingSettings,
    toSettings,
    closeSettings: () =>
      isShowingSettings &&
      navigate({ search: searchString({ showSettings: undefined }) }),
  };
}
