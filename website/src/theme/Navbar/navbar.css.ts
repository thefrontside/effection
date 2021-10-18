import vars, {
  laptopQuery,
  darkThemeQuery,
  desktopQuery,
} from "../../css/frontside-theme.css";
import { globalStyle, style, styleVariants } from "@vanilla-extract/css";
import { layoutWrap } from "../../css/page.css";
import { headingMd, textBlue, textGradientPinkViolet, textGradientSkybluePink, textGradientPurpleViolet, textSm } from "../../css/typography.css";
import { calc } from "@vanilla-extract/css-utils";

const navWrap = style([
  layoutWrap,
  {
    display: "flex",
    flexFlow: "row wrap",
    alignItems: "center",
    justifyContent: "space-between",
    padding: vars.space.sm,
    position: 'sticky',
    top: 0,
    zIndex: 300,
    boxShadow: `0 1px 6px rgba(255, 255, 255, 0.5)`,
    overflow: 'visible',

    '@media': {
      [desktopQuery]: {
        marginTop: vars.space.xs,
        borderRadius: vars.radius.md,
        paddingRight: vars.space.md,
        paddingLeft: vars.space.md,
      },
      [darkThemeQuery]: {
        boxShadow: `0 3px 6px rgba(0, 0, 0, 0.5)`,
      }
    }
  },
]);

const interactorsNav = style({
  backgroundImage: `linear-gradient(45deg, ${vars.colors.blue} -5%, ${vars.colors.violet}, ${vars.colors.pink} 105%)`,
});

const effectionNav = style({
  backgroundImage: `linear-gradient(45deg, ${vars.colors.blue} -5%, ${vars.colors.violet}, ${vars.colors.skyblue} 105%)`,
});

const bigtestNav = style({
  backgroundImage: `linear-gradient(45deg, ${vars.colors.blue} -5%, ${vars.colors.violet}, ${vars.colors.blue} 105%)`,
});

export const navBar = styleVariants({
  'Interactors': [navWrap, interactorsNav],
  'Effection': [navWrap, effectionNav],
  'Bigtest': [navWrap, bigtestNav],
  default: [navWrap]
});

export const navLink = style({
  fontWeight: vars.fontWeights.bold,
  fontSize: vars.fontSize.xs,
  letterSpacing: vars.letterSpacing.xs,
  color: vars.colors.white,
  display: "inline-block",
  position: "relative",
  marginLeft: vars.space.sm,

  "@media": {
    [laptopQuery]: {
      marginLeft: vars.space.md,
    },
  },
  selectors: {
    '&:hover': {
      color: vars.colors.white,
    },
  },
});

export const logoCol = style({
  display: 'flex',
  flexFlow: 'row nowrap',
  alignItems: 'center',
});

globalStyle(`${logoCol} b`, {
  display: 'none',
})

export const frontsideLink = style({
  display: 'none',
  '@media': {
    [laptopQuery]: {
      display: 'inline-block',
      marginRight: vars.space.sm,
      paddingRight: vars.space.sm,
      borderRight: `1px solid ${vars.colors.black}`,
    }
  }
});

export const arrowDropdownButton = style({
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  marginLeft: vars.space.xs,
});

export const logoFrontside = style({
  width: '1.5rem',
})

export const linksGroup = style({
  display: "flex",
  width: "100%",
  order: 4,
  justifyContent: "space-between",
  marginTop: vars.space.md,

  "@media": {
    [laptopQuery]: {
      order: 2,
      width: "auto",
      marginTop: 0,
    },
  },
});

export const labelDropdown = style({
  position: 'absolute',
  top: '-300px',
});

export const projectsList = style({
  background: vars.colors.white,
  position: 'absolute',
  listStyle: 'none',
  padding: 0,
  borderRadius: vars.radius.sm,
  top: calc(vars.space.sm).subtract(vars.space['2xs']).toString(),
  boxShadow: `0 2px 15px rgba(0, 0, 0, 0.10)`,
  zIndex: 350,
  '@media': {
    [darkThemeQuery]: {
      boxShadow: `0 2px 15px rgba(0, 0, 0, 0.40)`
    }
  }
});

globalStyle(`${arrowDropdownButton}[aria-expanded=true] + ${projectsList}`, {
  padding: '1px',
});

export const projectItem = style({
  padding: vars.space['2xs'],
  'selectors': {
    '&:first-child': {
      borderTopLeftRadius: vars.radius.sm,
      borderTopRightRadius: vars.radius.sm,
    },
    '&:last-child': {
      borderBottomLeftRadius: vars.radius.sm,
      borderBottomRightRadius: vars.radius.sm,
    }
  }
});

export const projectItemHighlighted = style([projectItem, {
  background: 'rgba(38, 171, 232, 0.10);',
}]);

export const projectTitle = style([headingMd, textBlue, {
  marginBottom: 0,
  letterSpacing: vars.letterSpacing["2xl"],
  display: 'block',
}]);

export const projectCurrent = styleVariants({
  'Interactors': [projectTitle, textGradientPinkViolet],
  'Effection': [projectTitle, textGradientSkybluePink],
  'Bigtest': [projectTitle, textGradientPurpleViolet],
  default: [projectTitle],
});

export const projectDescription = style([textSm, textBlue, {
  marginBottom: 0,
  display: 'block',
}]);
