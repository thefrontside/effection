import { makeStyles } from "@material-ui/core/styles";

export const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    flexDirection: "column",
  },
  content: {
    padding: theme.spacing(2)
  },
  appBar: {
    alignItems: "center",
    flexDirection: "row",
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1),
    paddingBottom: theme.spacing(0.5),
    paddingTop: theme.spacing(0.5),
  },
  appBarLeftSection: {},
  appBarRightSection: {
    display: "flex",
    flexGrow: 1,
    justifyContent: "end",
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
    padding: theme.spacing(2),
  },
  settingsFormHeader: {
    color: theme.palette.text.primary,
  },
}));
