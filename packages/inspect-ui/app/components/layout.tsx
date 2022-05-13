import AppBar from "@material-ui/core/AppBar";
import Button from "@material-ui/core/Button";
import ClickAwayListener from "@material-ui/core/ClickAwayListener";
import Drawer from "@material-ui/core/Drawer";
import ArrowBack from "@material-ui/icons/ArrowBack";
import SettingsIcon from "@material-ui/icons/Settings";
import React from "react";
import { Link as RouterLink, Outlet, useParams } from "react-router-dom";
import { useSettings } from "../hooks/use-settings";
import { useStyles } from "../hooks/use-styles";
import { SettingsForm } from "./settings-form";

export function Layout(): JSX.Element {
  let classes = useStyles();
  let { id } = useParams();
  let { isShowingSettings, toSettings, closeSettings } = useSettings();


  return (
    <div className={classes.root}>
      <AppBar position="sticky" className={classes.appBar}>
        <div className={classes.appBarLeftSection}>
          {id && (
            <Button
              to=".."
              component={RouterLink}
              startIcon={<ArrowBack />}
              className={classes.appBarText}
            >
              Show all
            </Button>
          )}
        </div>
        <div className={classes.appBarRightSection}>
          <Button
            component={RouterLink}
            disabled={isShowingSettings}
            aria-label="show settings"
            to={toSettings}
            startIcon={<SettingsIcon />}
            className={classes.appBarText}
          >
            Settings
          </Button>
          {isShowingSettings && (
            <ClickAwayListener
              mouseEvent="onMouseDown"
              touchEvent="onTouchStart"
              onClickAway={closeSettings}
            >
              <Drawer
                open={isShowingSettings}
                variant="persistent"
                anchor="right"
              >
                <SettingsForm />
              </Drawer>
            </ClickAwayListener>
          )}
        </div>
      </AppBar>
      <main className={classes.content}>
        <Outlet />
      </main>
    </div>
  );
}
