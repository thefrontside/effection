import { Button, ClickAwayListener, Drawer } from "@material-ui/core";
// import { useStyles } from "../hooks/use-styles";
import SettingsIcon from "@material-ui/icons/Settings";
import React from "react";
import { Link as RouterLink } from "react-router-dom";
import { useSettings } from "../hooks/use-settings";

export function SettingsButton({
  children,
}: {
  children: JSX.Element;
}): JSX.Element {
  let { isShowingSettings, toSettings, closeSettings } = useSettings();

  return (
    <>
      <Button
        component={RouterLink}
        disabled={isShowingSettings}
        aria-label="show settings"
        to={toSettings}
        startIcon={<SettingsIcon />}
      >
        Settings
      </Button>
      {isShowingSettings && (
        <ClickAwayListener
          mouseEvent="onMouseDown"
          touchEvent="onTouchStart"
          onClickAway={closeSettings}
        >
          <Drawer open={isShowingSettings} variant="persistent" anchor="right">
            {children}
          </Drawer>
        </ClickAwayListener>
      )}
    </>
  );
}
