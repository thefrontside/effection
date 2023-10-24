# @effection/jest

## \[2.0.6]

### Dependencies

- Upgraded to `effection@2.0.8`

## \[2.0.5]

### Dependencies

- Updated to latest `@effection/core`
- Updated to latest `effection`

## \[2.0.4]

- delegate `error` and `name` properties to underlying `Error`. fixes  https://github.com/thefrontside/effection/issues/675)
  - Bumped due to a bump in effection.
  - [84a66d7](https://github.com/thefrontside/effection/commit/84a66d799060ba2292fff2482d87bf6abafa7937) Delegate error properties to original error on 2022-10-05

## \[2.0.3]

- Expose `formatError` so other packages can format errors the same way as `main`
  - Bumped due to a bump in effection.
  - [6b2077f](https://github.com/thefrontside/effection/commit/6b2077f6217883630e20df4569e22d2ebce3a6ce) Expose  so packages other than  can make nice errors on 2022-05-27

## \[2.0.2]

- Do not run each trial of it.eventually() in each scope
  - [ca9de5c](https://github.com/thefrontside/effection/commit/ca9de5c0e6dc0baa33a05772ab53154fea385326) Don't run each it.eventually trial in test scope on 2022-02-03

## \[2.0.1]

- depends on effection 2.0.3
  - [09531d9](https://github.com/thefrontside/effection/commit/09531d978cd4c3468098bd21d44d68b63ebc5cb6) Add @effection/jest to covector on 2022-01-27
- test suite and each test get independent sibling scopes.
  - [163ea9b](https://github.com/thefrontside/effection/commit/163ea9bdde09eab82f8eec50d7a877e6404be226) Create totally independent scopes for before{All/Each}() on 2022-01-28

## \[2.0.0]

- Initial release
