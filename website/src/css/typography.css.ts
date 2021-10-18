import { style } from '@vanilla-extract/css';
import { calc } from '@vanilla-extract/css-utils';
import vars, { darkThemeQuery, laptopQuery, desktopQuery } from './frontside-theme.css';

// import arrowWhite from '../img/q3-2021/arrow-white.svg';
// import arrowBlue from '../img/q3-2021/arrow-blue.svg';
// import arrowGreen from '../img/q3-2021/arrow-green.svg';

export const textXs = style({
  fontSize: vars.fontSize['xs'],
  lineHeight: vars.lineHeights['xs'],
  letterSpacing: vars.letterSpacing['xs'],
});

export const textSm = style({
  fontSize: vars.fontSize['sm'],
  lineHeight: vars.lineHeights['sm'],
  letterSpacing: vars.letterSpacing['sm'],
});

export const textSmCaps = style([textSm, {
  textTransform: 'uppercase',
}]);

export const boldCaps = style({
  fontWeight: vars.fontWeights.extrabold,
  textTransform: 'uppercase',
});

export const textMd = style({
  fontSize: vars.fontSize['base'],
  lineHeight: vars.lineHeights['base'],
  letterSpacing: vars.letterSpacing['base'],
});

export const textLg = style({
  fontSize: vars.fontSize['lg'],
  lineHeight: vars.lineHeights['lg'],
  letterSpacing: vars.letterSpacing['lg'],
});

export const textXl = style({
  fontSize: vars.fontSize['xl'],
  lineHeight: vars.lineHeights['xl'],
  letterSpacing: vars.letterSpacing['xl'],
});

export const text2Xl = style({
  fontSize: vars.fontSize['2xl'],
  lineHeight: vars.lineHeights['2xl'],
  letterSpacing: vars.letterSpacing['2xl'],
});

export const text3Xl = style({
  fontSize: vars.fontSize['2xl'],
  lineHeight: vars.lineHeights['2xl'],
  letterSpacing: vars.letterSpacing['2xl'],

  '@media': {
    [laptopQuery]: {
      fontSize: vars.fontSize['3xl'],
      lineHeight: vars.lineHeights['3xl'],
      letterSpacing: vars.letterSpacing['3xl'],
    }
  }
});

export const textExtrabold = style({
  fontWeight: vars.fontWeights.extrabold,
});

export const textUppercase = style({
  textTransform: 'uppercase',
});

export const textCentered = style({
  textAlign: 'center',
});

export const heading3Xl = style([text3Xl, boldCaps]);

export const heading2Xl = style([text2Xl, boldCaps]);

export const headingXl = style([textXl, boldCaps]);

export const headingLg = style([textLg, boldCaps]);

export const headingMd = style([textMd, boldCaps]);

export const headingXlNoMargin = style([headingXl, {
  marginTop: 0,
  marginBottom: 0,
}]);

export const textPink = style({
  color: vars.colors.pink,
});

export const textSkyblue = style({
  color: vars.colors.skyblue,
});

export const textGreen = style({
  color: vars.colors.green,
});

export const textBlueDashWhite = style({
  color: vars.colors.blue,
  '@media': {
    [darkThemeQuery]: {
      color: vars.colors.white,
    }
  }
});

export const textWhiteDashBlue = style({
  color: vars.colors.white,
  '@media': {
    [darkThemeQuery]: {
      color: vars.colors.blue,
    }
  }
});

export const textBlue = style({
  color: vars.colors.blue,
});

export const indentLine = style({
  display: 'inline-block',
  width: '2em',
  height: '1em',
});

export const fillBlueDashWhite = style({
  fill: vars.colors.blue,
  '@media': {
    [darkThemeQuery]: {
      fill: vars.colors.white,
    }
  }
});

const arrowDefinition = {
  content: '""',
  display: 'inline-block',
  width: '0.8em',
  height: '0.8rem',
  // background: `url(${arrowWhite}) no-repeat`,
  backgroundSize: 'contain',
}

const baseArrow = style({
  'selectors': {
    '&:before': {
      ...arrowDefinition,
      marginRight: '0.5em',
      marginBottom: '-0.05em',
    }
  }
});

const baseTextArrow = style({
  'selectors': {
    '&:after': {
      ...arrowDefinition,
      marginLeft: '0.5em',
      marginBottom: '-0.1em',
    }
  }
});

export const arrowText = style([baseArrow, {
  'selectors': {
    '&:before': {
      // backgroundImage: `url(${arrowBlue})`,
    }
  },
  '@media': {
    [darkThemeQuery]: {
      'selectors': {
        '&:before': {
          // backgroundImage: `url(${arrowWhite})`
        }
      }
    }
  }
}]);

export const arrowTextWhite = style([baseArrow]);

export const arrowTextGreen = style([arrowTextWhite, {
  'selectors': {
    '&:before': {
      // backgroundImage: `url(${arrowGreen})`,
    }
  }
}]);

export const textArrow = style([baseTextArrow, {
  'selectors': {
    '&:after': {
      // backgroundImage: `url(${arrowBlue})`,
    }
  },
  '@media': {
    [darkThemeQuery]: {
      'selectors': {
        '&:after': {
          // backgroundImage: `url(${arrowWhite})`
        }
      }
    }
  }
}]);

export const textArrowWhite = style([baseTextArrow]);

export const textArrowGreen = style([textArrowWhite, {
  'selectors': {
    '&:after': {
      // backgroundImage: `url(${arrowGreen})`,
    }
  }
}]);

export const featureHeading = style([textXl, {
  marginTop: 0,
  marginBottom: '1rem',
}]);

export const homeBackstageHeading = style([text2Xl, textExtrabold]);

const clipBackgroundToText = style({
  backgroundClip: 'text',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  display: 'inline-block',
  fontWeight: vars.fontWeights.extrabold
})

export const textGradientPinkSkyblue = style([clipBackgroundToText, {
  backgroundImage: `linear-gradient(90deg, ${vars.colors.pink}, ${vars.colors.skyblue} 95%)`,
}]);

export const textGradientSkybluePink = style([clipBackgroundToText, {
  backgroundImage: `linear-gradient(90deg, ${vars.colors.skyblue}, ${vars.colors.pink} 95%)`,
}]);

export const textGradientPinkPurple = style([clipBackgroundToText, {
  backgroundImage: `linear-gradient(90deg, ${vars.colors.pink} -20%, ${vars.colors.purple} 95%)`,
}]);

export const textGradientPurpleSkyblue = style([clipBackgroundToText, {
  backgroundImage: `linear-gradient(90deg, ${vars.colors.purple}, ${vars.colors.skyblue} 95%)`,
}]);

export const textGradientSkybluePurple = style([clipBackgroundToText, {
  backgroundImage: `linear-gradient(90deg, ${vars.colors.skyblue}, ${vars.colors.purple} 95%)`,
}]);

export const textGradientDemiSkybluePink = style([clipBackgroundToText, {
  backgroundImage: `linear-gradient(90deg, ${vars.colors.skyblue} -60%, ${vars.colors.pink} 180%)`,
}]);

export const textGradientPurplePink = style([clipBackgroundToText, {
  backgroundImage: `linear-gradient(90deg, ${vars.colors.purple}, ${vars.colors.pink} 95%)`,
}]);

export const textGradientGreenSkyblue = style([clipBackgroundToText, {
  backgroundImage: `linear-gradient(90deg, ${vars.colors.green}, ${vars.colors.skyblue} 95%)`,
}]);

export const textGradientSkyblueGreen = style([clipBackgroundToText, {
  backgroundImage: `linear-gradient(90deg, ${vars.colors.skyblue}, ${vars.colors.green} 95%)`,
}]);

export const textGradientSkyblueVioletPink = style([clipBackgroundToText, {
  backgroundImage: `linear-gradient(90deg, ${vars.colors.skyblue}, ${vars.colors.violet}, ${vars.colors.pink})`,
}]);

export const textGradientPinkViolet = style([clipBackgroundToText, {
  backgroundImage: `linear-gradient(90deg, ${vars.colors.pink}, ${vars.colors.violet})`,
}]);

export const textGradientPurpleViolet = style([clipBackgroundToText, {
  backgroundImage: `linear-gradient(90deg, ${vars.colors.purple}, ${vars.colors.violet})`,
}]);

export const textBottomGradient = style({
  position: 'relative',
  display: 'inline-block',
  selectors: {
    '&:before': {
      display: 'block',
      content: '" "',
      position: 'absolute',
      bottom: '0.210rem',
      left: 0,
      width: '100%',
      height: '0.200rem',
      background: `linear-gradient(90deg, ${vars.colors.skyblue}, ${vars.colors.pink} 95%)`
    }
  }
});

export const textBottomGreen = style({
  position: 'relative',
  display: 'inline-block',
  selectors: {
    '&:before': {
      display: 'block',
      content: '" "',
      position: 'absolute',
      bottom: '0.210rem',
      left: 0,
      width: '100%',
      height: '0.200rem',
      background: `linear-gradient(90deg, ${vars.colors.green}, ${vars.colors.skyblue} 95%)`
    }
  }
});

export const bigQuote = style([text3Xl, textBlueDashWhite, {
  fontWeight: vars.fontWeights.bold,
  margin: 0,
  textAlign: 'center',
  border: 'none',

  '@media': {
    [laptopQuery]: {
      marginRight: vars.space['2xl'],
      marginLeft: vars.space['2xl'],
    }
  }
}]);

export const bigQuoteAuthor = style([textLg, {
  marginBottom: vars.space['lg'],
  textAlign: 'center',
}]);

export const mardownColumn = style({
  boxSizing: 'border-box',
  width: '100vw',
  overflow: 'hidden',
  padding: vars.space.sm,
  maxWidth: calc('37rem').add(vars.space.sm).add(vars.space.sm).toString(),
  marginLeft: 'auto',
  marginRight: 'auto',

  '@media': {
    [laptopQuery]: {
      paddingLeft: vars.space.xl,
      paddingRight: vars.space.xl,
      maxWidth: calc('37rem').add(vars.space.xl).add(vars.space.xl).toString(),
    },
    [desktopQuery]: {
      paddingLeft: vars.space['2xl'],
      paddingRight: vars.space['2xl'],
      maxWidth: calc('37rem').add(vars.space['2xl']).add(vars.space['2xl']).toString(),
    }
  }
});
