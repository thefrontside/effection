## Effection Website

The Effection website shows documentation and packages that it pulls from GIT
repositories on GitHub.

## About Git Integration

The Effection website uses sophisticated GitHub integration to dynamically load
and display documentation and packages from Effection repositories. This
integration works through multiple layers:

### Repository Access

- **Dual Provider System**: Uses both Git commands (`git-provider.ts`) and
  GitHub's Octokit API (`octokit-provider.ts`) for redundant access to
  repository data
- **Dynamic Remote Management**: Automatically adds and fetches GitHub remotes
  for repositories, enabling access to branches, tags, and file contents
- **Branch & Tag Detection**: Intelligently determines whether references are
  branches or tags and normalizes them to proper Git reference formats

### Documentation Loading

- **Guides**: Pulls structured documentation from `docs/structure.json` and
  loads MDX files from the `docs/` directory in the
  [**thefrontside/effection**](https://github.com/thefrontside/effection)
  repository
- **API Documentation**: Generates API documentation using Deno's documentation
  generator from TypeScript source files in the
  [**thefrontside/effection**](https://github.com/thefrontside/effection)
  repository (supports both v3 and v4 via tags like `effection-v3.*` and
  `effection-v4.*`)
- **README Integration**: Loads and renders README.md files from package
  directories using MDX processing

### Package Discovery

- **Workspace Integration**: Reads `deno.json` files to discover packages and
  their configurations within:
  - [**thefrontside/effection**](https://github.com/thefrontside/effection) -
    Core Effection library packages
  - [**thefrontside/effectionx**](https://github.com/thefrontside/effectionx) -
    Extended Effection ecosystem packages
- **Multi-Version Support**: Handles different versions of packages by working
  with Git tags and branches from both repositories
- **Export Mapping**: Maps package exports to their corresponding source files
  for direct GitHub links

### Dynamic Content

- **Live Repository Data**: Fetches star counts, default branches, and
  repository metadata directly from GitHub
- **Content Versioning**: Supports loading content from specific Git references
  (branches, tags, commits)
- **Badge Integration**: Generates badges for JSR packages, npm packages, bundle
  sizes, and other metrics

This integration ensures that the website always reflects the current state of
the Effection ecosystem by pulling data directly from the source repositories on
GitHub.

## Deployment

The website is deployed to Deno Deploy using a static site generation process
powered by the [Staticalize](https://github.com/thefrontside/staticalize)
utility:

### Automated Deployment Process

- **Trigger**: Runs automatically every 8 hours via scheduled GitHub Action, on
  pushes to `main` branch, and can be manually triggered
- **Static Generation**: The live website is crawled and converted to static
  files using Staticalize
- **Search Integration**: Pagefind indexes the static content to enable
  client-side search functionality
- **Deno Deploy**: Static files are uploaded to
  [Deno Deploy](https://deno.com/deploy) and served via their edge network

### Deployment Pipeline

1. **Server Startup**: Spins up the dynamic website locally using
   `deno task dev`
2. **Content Crawling**: Staticalize crawls `http://127.0.0.1:8000` to generate
   static HTML/CSS/JS
3. **Search Indexing**: Pagefind processes the static files to create search
   indexes
4. **Upload**: Deploys the built static site to the `effection-www` project on
   Deno Deploy

This ensures the website stays current with repository changes while providing
fast global delivery through static hosting.

## Troubleshooting

### "Bad credentials" Error from GitHub API

If you encounter an `HttpError: Bad credentials` error when running the website:

1. **Verify your GITHUB_TOKEN**: Ensure the `GITHUB_TOKEN` environment variable
   is set with a valid GitHub personal access token
2. **Clear the cache**: Old cached data may contain requests made with an
   expired or invalid token. Run the clear-cache task:
   ```bash
   deno task clear-cache
   ```
3. **Restart the server**: After clearing the cache, restart the development
   server

This error typically occurs when the cache contains authenticated requests from
a previous token that is no longer valid.
