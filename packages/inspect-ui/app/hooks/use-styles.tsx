import { makeStyles } from "@material-ui/core/styles";

export const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
  },
  content: {
    flexGrow: 1,
    height: "100vh",
    overflow: "auto",
    paddingTop: theme.spacing(3),
  },
  appBar: {
    display: "flex",
    alignItems: "end",
  },
  appBarSpacer: theme.mixins.toolbar,
  container: {
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
  },
  yieldText: {
    color: theme.palette.info.main,
    display: "inline-block",
    paddingRight: theme.spacing(0.5),
    fontWeight: "bold",
  },
  typeText: {
    color: theme.palette.text.secondary,
    display: "inline-block",
    paddingLeft: theme.spacing(0.5),
    paddingRight: theme.spacing(0.5),
  },
  idText: {
    color: theme.palette.text.hint,
  },
  labelChipName: {
    color: theme.palette.text.secondary,
  },
  labelChip: {
    marginLeft: theme.spacing(0.25),
    marginRight: theme.spacing(0.25),
  },
  linkText: {
    color: theme.palette.text.primary,
  },
  treeItem: {
    paddingTop: theme.spacing(0.25),
    paddingBottom: theme.spacing(0.25),
  },
  settingsForm: {
    padding: theme.spacing(2)
  },
  settingsFormHeader: {
    color: theme.palette.text.primary
  }
}));
