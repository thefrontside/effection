import React from "react";
import {
  Checkbox,
  List,
  ListItem,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
  Typography,
} from "@material-ui/core";
import ErroredIcon from "./errored-icon";
import HaltedIcon from "./halted-icon";
import CompletedIcon from "./completed-icon";
import { useSettings } from "../hooks/use-settings";
import { useStyles } from "../hooks/use-styles";

export function SettingsForm(): JSX.Element {
  let { settings, setSettings } = useSettings();
  let classes = useStyles();

  return (
    <div className={classes.settingsForm}>
      <Typography variant="h5" className={classes.settingsFormHeader}>
        Settings
      </Typography>
      <List>
        <ListItem
          role={undefined}
          dense
          button
          onClick={() =>
            setSettings({
              ...settings,
              showCompleted: !settings.showCompleted,
            })
          }
        >
          <ListItemIcon>
            <CompletedIcon />
          </ListItemIcon>
          <ListItemText primary="Show completed" />
          <ListItemSecondaryAction>
            <Checkbox
              onClick={() =>
                setSettings({
                  ...settings,
                  showCompleted: !settings.showCompleted,
                })
              }
              edge="start"
              checked={settings.showCompleted}
              tabIndex={-1}
              disableRipple
              inputProps={{ "aria-labelledby": `Show completed` }}
            />
          </ListItemSecondaryAction>
        </ListItem>
        <ListItem
          role={undefined}
          dense
          button
          onClick={() =>
            setSettings({
              ...settings,
              showHalted: !settings.showHalted,
            })
          }
        >
          <ListItemIcon>
            <HaltedIcon />
          </ListItemIcon>
          <ListItemText primary={`Show halted`} />
          <ListItemSecondaryAction>
            <Checkbox
              onClick={() =>
                setSettings({
                  ...settings,
                  showHalted: !settings.showHalted,
                })
              }
              edge="start"
              checked={settings.showHalted}
              tabIndex={-1}
              disableRipple
              inputProps={{ "aria-labelledby": `Show halted` }}
            />
          </ListItemSecondaryAction>
        </ListItem>
        <ListItem
          role={undefined}
          dense
          button
          onClick={() =>
            setSettings({
              ...settings,
              showErrored: !settings.showErrored,
            })
          }
        >
          <ListItemIcon>
            <ErroredIcon />
          </ListItemIcon>
          <ListItemText primary={`Show errored`} />
          <ListItemSecondaryAction>
            <Checkbox
              onClick={() =>
                setSettings({
                  ...settings,
                  showErrored: !settings.showErrored,
                })
              }
              edge="start"
              checked={settings.showErrored}
              tabIndex={-1}
              disableRipple
              inputProps={{ "aria-labelledby": `Show errored` }}
            />
          </ListItemSecondaryAction>
        </ListItem>
        <ListItem
          role={undefined}
          dense
          button
          onClick={() =>
            setSettings({
              ...settings,
              showStackTraces: !settings.showStackTraces,
            })
          }
        >
          <ListItemIcon />
          <ListItemText primary={`Show stacktraces`} />
          <ListItemSecondaryAction>
            <Checkbox
              onClick={() =>
                setSettings({
                  ...settings,
                  showStackTraces: !settings.showStackTraces,
                })
              }
              edge="start"
              checked={settings.showStackTraces}
              tabIndex={-1}
              disableRipple
              inputProps={{ "aria-labelledby": `Show stacktraces` }}
            />
          </ListItemSecondaryAction>
        </ListItem>
      </List>
    </div>
  );
}
