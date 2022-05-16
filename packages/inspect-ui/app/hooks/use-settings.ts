import { useContext, useMemo, useCallback } from "react";
import { To, useNavigate } from "react-router-dom";
import { Settings, SettingsContext } from "../context";
import { useQueryParams } from "./use-query-params";

interface UseSettings {
  settings: Settings;
  setSettings(settings: Settings): void;
  toSettings: To;
  isShowingSettings: boolean;
  closeSettings: () => void;
}

export function useSettings(): UseSettings {
  let { settings, setSettings } = useContext(SettingsContext);
  let [queryParams, mergeQueryParams] = useQueryParams();
  let navigate = useNavigate();

  let isShowingSettings = !!queryParams["showSettings"];

  let toSettings = useMemo(() => {
    return {
      search: mergeQueryParams({ showSettings: true }),
    };
  }, [mergeQueryParams]);

  let closeSettings = useCallback(() => {
    navigate({
      search: mergeQueryParams({ showSettings: null }),
    });
  }, [navigate, mergeQueryParams]);

  return {
    settings,
    setSettings,
    isShowingSettings,
    toSettings,
    closeSettings,
  };
}
