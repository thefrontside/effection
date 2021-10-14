import { style } from '@vanilla-extract/css';
import vars, { darkThemeQuery } from './frontside-theme.css';
import { textSmCaps } from './typography.css';

export const baseButton = style({
  display: 'inline-block',
  border: 'none',
  fontFamily: vars.fontFamily.main,
  fontSize: vars.fontSize.base,
  fontWeight: vars.fontWeights.bold,
  background: vars.colors.blue,
  color: vars.colors.white,
  borderRadius: vars.radius.md,
  padding: vars.space['xs'],
  cursor: 'pointer',
  'selectors': {
    '&:hover': {
      color: vars.colors.white,
    }
  }
});

export const paginationButton = style([baseButton, {
  padding: vars.space['2xs'],
  paddingRight: vars.space['xs'],
  paddingLeft: vars.space['xs'],
  marginLeft: vars.space.md,
  marginRight: vars.space.md,
}]);

export const tagButton = style({
  color: vars.colors.blue,
  padding: vars.space['3xs'],
  paddingRight: vars.space['2xs'],
  paddingLeft: vars.space['2xs'],
  textTransform: 'uppercase',
  border: `1px solid ${vars.colors.blue}`,
  borderRadius: vars.radius.lg,
  fontSize: vars.fontSize.xs,
  '@media': {
    [darkThemeQuery]: {
      color: vars.colors.white,
      borderColor: vars.colors.white,
    }
  }
});

export const bigTagButton = style([tagButton, {
  fontSize: vars.fontSize.lg,
}]);

export const socialLink = style([textSmCaps, {
  display: 'inline-block',
  background: vars.colors.blue,
  color: vars.colors.white,
  borderRadius: vars.radius.md,
  padding: vars.space['2xs'],
  paddingRight: vars.space['xs'],
  paddingLeft: vars.space['xs'],
  textTransform: 'uppercase',
  fontWeight: vars.fontWeights.bold,
  marginRight: vars.space.sm,
  marginTop: vars.space.md,
  marginBottom: vars.space.md,
}]);

const baseActionButton = style([baseButton, {
  paddingRight: vars.space['sm'],
  paddingLeft: vars.space['sm'],
  transition: 'ease-in background 200ms',
  backgroundSize: 'calc(100% + 30px)',
  backgroundPosition: '-5px',
  'selectors': {
    '&:hover': {
      backgroundPosition: '-30px',
    }
  }
}]);

export const actionButton = style([baseActionButton, {
  backgroundImage: `linear-gradient(135deg, ${vars.colors.pink}, ${vars.colors.violet} 46%, ${vars.colors.violet} 54%, ${vars.colors.skyblue})`,
}]);

export const toPageButton = style([baseActionButton, {
  backgroundImage: `linear-gradient(135deg, ${vars.colors.pink}, ${vars.colors.violet} 60%)`,
}])

export const actionButtonGreen = style([baseActionButton, {
  backgroundImage: `linear-gradient(135deg, ${vars.colors.green}, ${vars.colors.violet} 46%, ${vars.colors.violet} 54%, ${vars.colors.skyblue})`,
}]);

export const toPageButtonGreen = style([baseActionButton, {
  backgroundImage: `linear-gradient(135deg, ${vars.colors.green}, ${vars.colors.violet} 60%)`,
}])

export const openmicButton = style([baseButton, {
  background: vars.colors.blue,
  color: vars.colors.lightGreen,
  fontWeight: vars.fontWeights.bold,
  paddingTop: vars.space['2xs'],
  paddingBottom: vars.space['2xs'],
}]);
