import React from "react";
import { SvgIconProps } from "@material-ui/core";
import CancelOutlinedIcon from "@material-ui/icons/CancelOutlined";
import yellow from "@material-ui/core/colors/yellow";

export default function HaltedIcon(params: SvgIconProps): JSX.Element {
  return <CancelOutlinedIcon style={{ color: yellow[900] }} {...params} />;
}
