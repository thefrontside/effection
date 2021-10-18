import { style } from '@vanilla-extract/css';
import { calc } from '@vanilla-extract/css-utils';
import vars, { laptopQuery, desktopQuery } from './frontside-theme.css';

export const layoutWrap = style({
  boxSizing: 'border-box',
  width: '100%',
  overflow: 'hidden',
  maxWidth: '37rem',
  margin: '0 auto',
  '@media': {
    [laptopQuery]: {
      maxWidth: vars.pixelBase.maxWdith,
    },
    [desktopQuery]: {
      margin: '0 auto'
    },
  }
});

export const pageWrap = style([layoutWrap, {
  padding: vars.space.sm,
  '@media': {
    [laptopQuery]: {
      padding: vars.space.md,
    },
  }
}]);

export const heroWrap = style([pageWrap, {
  '@media': {
    [laptopQuery]: {
      margin: '0 auto',
      display: 'flex',
      flexFlow: 'row nowrap',
    },
  }
}]);

export const heroText = style({
  '@media': {
    [laptopQuery]: {
      boxSizing: 'border-box',
      width: '50%',
      paddingRight: vars.space.lg,
      flexShrink: 0,
    },
    [desktopQuery]: {
      boxSizing: 'border-box',
      // width: calc(vars.pixelBase.maxWdith).divide(2).toString(),
      paddingRight: vars.space.lg,
      // flexShrink: 0,
    },
  }
});

export const heroBreak = style({
  display: 'none',
  '@media': {
    [laptopQuery]: {
      display: 'block',
    }
  }
});

export const sideImage = style({
  flexShrink: 1,
  marginTop: vars.space.md,
  textAlign: 'center',

  '@media': {
    [laptopQuery]: {
      marginTop: 0,
      width: calc('50%').subtract(vars.space.lg).toString(),
    }
  }
});

export const heroImage = style([sideImage, {
  '@media': {
    [laptopQuery]: {
      marginTop: calc(vars.space.md).negate().toString(),
    }
  }
}]);

export const featureRow = style({
  marginBottom: vars.space['md'],

  '@media': {
    [laptopQuery]: {
      display: 'flex',
      flexFlow: 'row nowrap',
      paddingLeft: vars.space.lg,
      paddingRight: vars.space.lg,
      alignItems: 'center',
      justifyContent: 'center'
    },
  }
});

export const featureText = style({
  '@media': {
    [laptopQuery]: {
      boxSizing: 'border-box',
      width: calc('50%').add(vars.space.lg).toString(),
      paddingRight: vars.space.lg,
      flexShrink: 0,
      display: 'flex',
      flexFlow: 'column nowrap',
      justifyContent: 'space-between',
    },
    [desktopQuery]: {
      width: calc(vars.pixelBase.maxWdith).subtract(vars.space.lg).subtract(vars.space.lg).divide(2).toString(),
    },
  }
});

export const featureTextAlternate = style([featureText, {
  '@media': {
    [laptopQuery]: {
      paddingLeft: vars.space.lg,
      paddingRight: 0,
      order: 2
    },
  }
}]);

export const featureImage = sideImage;

export const featureImageSmaller = style({
  '@media': {
    [laptopQuery]: {
      maxWidth: '15rem',
    }
  }
})

export const homeBottomCTA = style({
  marginTop: vars.space.lg,
  marginBottom: vars.space.lg,
  textAlign: 'center',
});

