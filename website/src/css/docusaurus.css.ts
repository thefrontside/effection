import { globalStyle } from '@vanilla-extract/css';
import { calc } from '@vanilla-extract/css-utils';
import vars, { darkThemeQuery, laptopQuery } from './frontside-theme.css';

globalStyle('.container', {
  maxWidth: '37rem',
  '@media': {
    [laptopQuery]: {
      maxWidth: vars.pixelBase.maxWdith,
    }
  }
});

globalStyle('.menu--responsive .menu__button', {
  background: vars.colors.blue,
  borderColor: vars.colors.blue,
  color: vars.colors.white,
})

globalStyle('.menu', {
  fontSize: vars.fontSize['sm'],
  lineHeight: vars.lineHeights['sm'],
  letterSpacing: vars.letterSpacing['sm'],
});

globalStyle('.table-of-contents', {
  fontSize: vars.fontSize['xs'],
  lineHeight: vars.lineHeights['xs'],
  letterSpacing: vars.letterSpacing['xs']
})

const markdownBlockDescription = {
  lineHeight: '1.4090909rem',
  marginTop: '0',
  marginBottom: '1.4090909rem',
};

globalStyle(`.markdown > p`, markdownBlockDescription);

globalStyle(`.markdown > ul`, markdownBlockDescription);

globalStyle(`.markdown > ol`, markdownBlockDescription);

globalStyle(`.markdown > table`, markdownBlockDescription);

globalStyle(`.markdown > pre`, markdownBlockDescription);

globalStyle(`.markdown > blockquote`, markdownBlockDescription);

globalStyle('.markdown > .admonition-note', markdownBlockDescription);
globalStyle('.markdown > .tabs-container', markdownBlockDescription);

globalStyle('.markdown a', {
  textDecoration: 'underline',
});

globalStyle('.markdown h1', {
  fontSize: vars.fontSize['3xl'],
  lineHeight: vars.lineHeights['3xl'],
  letterSpacing: vars.letterSpacing['3xl']
});

globalStyle(`.markdown > h2`, {
  fontSize: '1.4545455rem',
  lineHeight: '1.8181818rem',
  marginTop: '1.4090909rem',
  marginBottom: '1.4090909rem',
  letterSpacing: vars.letterSpacing.xl
});

globalStyle(`.markdown > h3`, {
  fontSize: '1rem',
  lineHeight: '1.8181818rem',
  marginTop: '1.4090909rem',
  marginBottom: '0',
  fontWeight: vars.fontWeights.bold,
  letterSpacing: vars.letterSpacing.xl,
  textTransform: 'uppercase'
});

globalStyle(`.markdown > h3 code`, {
  textTransform: 'none'
});

globalStyle(`.markdown > h4`, {
  fontSize: '1rem',
  lineHeight: '2.8181818rem',
  marginTop: '1.4090909rem',
  marginBottom: '0',
  fontWeight: vars.fontWeights.bold,
  letterSpacing: vars.letterSpacing.xl,
});

globalStyle('.markdown code', {
  '@media': {
    [darkThemeQuery]: {
      borderColor: 'rgba(255, 255, 255, 0.2)',
    }
  }
})

globalStyle('.tabs-container .tabs', {
  marginBottom: '-1.3rem',
  fontSize: vars.fontSize.sm,
});

globalStyle('.tabs-container .tabpanel', {
  background: vars.colors.blue,
  padding: vars.space['3xs'],
})

globalStyle(".tabs__item", {
  paddingTop: vars.space['3xs'],
  paddingBottom: calc(vars.space['3xs']).add('0.3rem').toString(),
  border: 'none',
  color: 'inherit',
});

globalStyle('.tabs-container .tabs__item--active', {
  background: vars.colors.blue,
  color: vars.colors.white,
});

globalStyle('.admonition-content .tabs-container .tabs__item', {
  color: vars.colors.white,
})

globalStyle('.footer', {
  fontSize: vars.fontSize.sm,
})

globalStyle('.footer__title', {
  fontSize: vars.fontSize.xs,
  textTransform: 'uppercase',
})

globalStyle('.footer__col', {
  textAlign: 'center'
})

globalStyle('.footer__copyright', {
  fontSize: vars.fontSize.xs
})

globalStyle('.menu__link--sublist:after', {
  backgroundSize: '100%',
  minWidth: '0.8rem',
  height: '0.8rem',
});
