import React from "react";
import { SvgIconProps } from "@material-ui/core";
import ErrorOutlinedIcon from "@material-ui/icons/ErrorOutline";

export default function ErroredIcon(params: SvgIconProps): JSX.Element {
  return <ErrorOutlinedIcon color="error" {...params} />;
}
