# @effection/vitest

## \[2.1.2]

### Dependencies

- Upgraded to `effection@2.0.8`

## \[2.1.1]

### Dependencies

- Updated to latest `@effection/core`
- Updated to latest `effection`

## \[2.1.0]

- Add cjs support to @effection/vitest by adding require to package imports
  - [3261079](https://github.com/thefrontside/effection/commit/3261079d702106b29a2da2b810534da6f297b1be) add require to @effction/vitest exports ([#681](https://github.com/thefrontside/effection/pull/681)) on 2022-11-08

## \[2.0.2]

- Make @effection/vitest esm only.
  - [a5350c4](https://github.com/thefrontside/effection/commit/a5350c4613306747322580c63ce471141ec63872) remove all cjs from @effection/vitest ([#678](https://github.com/thefrontside/effection/pull/678)) on 2022-11-08

## \[2.0.1]

- delegate `error` and `name` properties to underlying `Error`. fixes  https://github.com/thefrontside/effection/issues/675)
  - Bumped due to a bump in effection.
  - [84a66d7](https://github.com/thefrontside/effection/commit/84a66d799060ba2292fff2482d87bf6abafa7937) Delegate error properties to original error on 2022-10-05

## \[2.0.0]

- Release @effection/vitest@2.0.0
  - Versioned to implement with Effection@2.0.0
