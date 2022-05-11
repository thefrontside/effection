import { makeStyles } from "@material-ui/core/styles";
import { purple, grey } from "@material-ui/core/colors";

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
    color: purple[700],
    display: "inline-block",
    paddingRight: theme.spacing(0.5),
    fontWeight: "bold",
  },
  typeText: {
    color: grey[400],
    display: "inline-block",
    paddingLeft: theme.spacing(0.5),
    paddingRight: theme.spacing(0.5),
  },
  idText: {
    color: grey[600],
  },
  labelChipName: {
    color: grey[600],
  },
  labelChip: {
    marginLeft: theme.spacing(0.25),
    marginRight: theme.spacing(0.25),
  },
  linkText: {
    color: "black",
  },
  treeItem: {
    paddingTop: theme.spacing(0.25),
    paddingBottom: theme.spacing(0.25),
  },
  settingsForm: {
    padding: theme.spacing(2)
  },
  settingsFormHeader: {
    color: grey[800]
  }
}));
