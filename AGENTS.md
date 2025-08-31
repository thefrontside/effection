# AGENTS.md

## Project Overview

Effection is a structured concurrency and effects library for JavaScript that runs on Node.js, Browser, and Deno. This is a monorepo containing the core library and website.

## Project Structure

- `/lib/` - Core Effection library source code
- `/test/` - Tests for the core library
- `/www/` - Website and documentation (separate Deno project)
- `/docs/` - Documentation content (MDX files)
- `/tasks/` - Build scripts for JSR and NPM publishing

## Development Environment

- **Primary runtime**: Deno
- **Package manager**: Deno (with auto node_modules for www/)
- **Testing**: Deno test
- **Website**: Custom framework built on Revolution (React-like) and Tailwind

## Common Commands

### Core Library
```bash
# Run all tests
deno task test

# Test Node.js compatibility
deno task test:node

# Build for JSR
deno task build:jsr

# Build for NPM (requires version)
deno task build:npm 3.0.0-dev.1

# Format code
deno fmt

# Lint code
deno lint
```

### Website (in www/ directory)
```bash
cd www/

# Start development server
deno task dev

# Build static site
deno task staticalize

# Build search index
deno task pagefind
```

## Code Style

- **Linting**: Uses Deno's built-in linter with custom rules excluding `prefer-const` and `require-yield`
- **Formatting**: Uses Deno's built-in formatter
- **JSX**: Uses Revolution framework with React JSX transform
- **TypeScript**: Strict mode with DOM and Deno namespace libs

## Key Conventions

- **Generator functions**: Core library heavily uses generator functions with `function*` and `yield*`
- **Operations**: All async work is modeled as `Operation<T>` types
- **Structured concurrency**: Use `spawn()`, `all()`, `race()` for concurrent operations
- **Resources**: Use `resource()` for managing lifecycle and cleanup
- **Context**: Use Effection's context system for dependency injection

## Website Architecture

- **Framework**: Revolution (React-like) with server-side rendering
- **Styling**: Tailwind CSS
- **Documentation**: MDX files processed with custom hooks
- **API**: Git-based content loading using Deno.Command for git operations
- **Deployment**: Deno Deploy

## Testing Guidelines

- Tests use Deno's built-in test runner
- Test files end with `.test.ts`
- Main entry point tests are in `/test/main/`
- Website tests use custom testing utilities in `www/testing/`

## Repository Management

- **Git operations**: Use `useProcess()` with git CLI commands
- **Remote handling**: Support for multiple repositories with namespaced remotes
- **Content loading**: Git-based content fetching to avoid API rate limits

## Security Notes

- GitHub token required for API operations (set in environment)
- File system access needed for git operations
- Network access required for external dependencies and API calls

## Important Files

- `/deno.json` - Root project configuration and tasks
- `/www/deno.json` - Website-specific configuration
- `/www/main.tsx` - Website entry point
- `/lib/mod.ts` - Core library entry point
- `/tasks/` - Build and publishing scripts

## Dependencies

- **Core**: Pure TypeScript, no external dependencies
- **Website**: Revolution, Tailwind, @deno/doc, Octokit, unified ecosystem
- **Build**: Deno's built-in tools, custom build scripts for cross-platform publishing