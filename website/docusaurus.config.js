module.exports = {
  title: 'Effection',
  tagline: 'Structured Concurrency for JavaScript',
  url: 'https://frontside.com',
  baseUrl: '/effection/V2/',
  onBrokenLinks: 'throw',
  favicon: 'images/favicon-effection.png',
  organizationName: 'thefrontside',
  projectName: 'effection',
  themeConfig: {
    announcementBar: {
      id: 'effection_v3_announce',
      content:
      '📣 These docs are for Effection V2. Check out the <a href="https://frontside.com/effection/">latest release here</a>',
      backgroundColor: '#fafbfc',
      textColor: '#091E42',
      isCloseable: false,
    },
    colorMode: {
      disableSwitch: true,
      respectPrefersColorScheme: true,
    },
    prism: {
      theme: require('prism-react-renderer/themes/nightOwl'),
    },
    navbar: {
      title: 'Effection',
      logo: {
        alt: 'Effection',
        src: 'images/effection-logo.svg'
      },
      items: [
        {
          to: '/docs',
          label: 'Guides',
          position: "right",
        },
        {
          href: 'https://frontside.com/effection/V2/api/index.html',
          label: 'API Reference',
          position: 'right',
        },
        {
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
          title: 'About',
          items: [
            {
              label: "Maintained by Frontside",
              href: "https://frontside.com/",
            },
          ]
        },
        {
          title: "OSS Projects",
          items: [
            {
              label: "Interactors",
              href: "https://frontside.com/interactors",
            },
            {
              label: "Bigtest",
              href: "https://frontside.com/bigtest",
            },
            {
              label: "Effection v3",
              to: "https://frontside.com/effection",
            },
          ],
        },
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
    image: 'images/meta-effection.png'
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
  stylesheets: ["https://use.typekit.net/ugs0ewy.css"],
  plugins: [
    [
      require.resolve("./plugins/docusaurus-plugin-vanilla-extract"),
      {
        /* options */
      },
    ],
  ],
  scripts: [
    {
      src: "https://plausible.io/js/plausible.js",
      async: true,
      defer: true,
      "data-domain": "frontside.com/effection",
    },
  ],
};
