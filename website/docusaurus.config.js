module.exports = {
  title: 'Effection',
  tagline: 'Effects made easy',
  url: 'https://frontside.com',
  baseUrl: '/effection/',
  onBrokenLinks: 'throw',
  favicon: 'images/favicon.png',
  organizationName: 'thefrontside',
  projectName: 'bigtest',
  themeConfig: {
    colorMode: {
      disableSwitch: true,
      respectPrefersColorScheme: true,
    },
    prism: {
      theme: require('prism-react-renderer/themes/nightOwl'),
    },
    navbar: {
      title: 'Effection',
      items: [
        {
          to: '/docs/use-cases/autocomplete',
          label: 'Use Cases',
          position: 'left'
        },
        {
          to: '/about',
          label: 'About',
          position: 'left'
        }, {
          href: 'https://github.com/thefrontside/effection',
          label: 'GitHub',
          position: 'right',
        },
        {
          href: 'https://discord.gg/r6AvtnU',
          label: 'Discord',
          position: 'right',
        }
      ],
    },
    footer: {
      style: 'light',
      links: [
        {
          title: 'Community',
          items: [
            {
              label: 'Discord',
              href: 'https://discord.gg/r6AvtnU',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/thefrontside/effection',
            }
          ],
        }
      ],
      copyright: `Copyright © ${new Date().getFullYear()} The Frontside Software, Inc.`,
    },
    image: 'images/meta-image.png'
  },
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      },
    ],
  ],
  stylesheets: [
    'https://use.typekit.net/gyc5wys.css'
  ],
};
