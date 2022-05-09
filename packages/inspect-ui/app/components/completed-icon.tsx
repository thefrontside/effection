import React from "react";
import { SvgIconProps } from "@material-ui/core";
import CheckCircleOutlineIcon from "@material-ui/icons/CheckCircleOutline";
import green from "@material-ui/core/colors/green";

export default function CompletedIcon(params: SvgIconProps): JSX.Element {
  return <CheckCircleOutlineIcon style={{ color: green[500] }} {...params} />;
}
