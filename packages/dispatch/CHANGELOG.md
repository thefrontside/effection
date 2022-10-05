# Changelog

## \[2.0.6]

- delegate `error` and `name` properties to underlying `Error`. fixes  https://github.com/thefrontside/effection/issues/675)
  - Bumped due to a bump in effection.
  - [84a66d7](https://github.com/thefrontside/effection/commit/84a66d799060ba2292fff2482d87bf6abafa7937) Delegate error properties to original error on 2022-10-05

## \[2.0.5]

- Expose `formatError` so other packages can format errors the same way as `main`
  - Bumped due to a bump in effection.
  - [6b2077f](https://github.com/thefrontside/effection/commit/6b2077f6217883630e20df4569e22d2ebce3a6ce) Expose  so packages other than  can make nice errors on 2022-05-27

## \[2.0.4]

- Allow pass object with `Symbol.operation` as an operation
  - Bumped due to a bump in effection.
  - [3e7daa8](https://github.com/thefrontside/effection/commit/3e7daa82cce974ea6b4ff90764343594ae7cba13) add changelog on 2022-01-26
  - [c623a84](https://github.com/thefrontside/effection/commit/c623a8448dfef764a03b3af6a6b0afa9ee834ba9) remove fetch and process packages from changes list on 2022-01-26

## \[2.0.3]

- Remove redundant node-fetch from dependencies
  - Bumped due to a bump in effection.
  - [b4a87d5](https://github.com/thefrontside/effection/commit/b4a87d525d270e53b92543676c9fb10c7fd1edd7) Add change file for covector on 2022-01-24

## \[2.0.2]

- Extract `AbortSignal` from `@effection/fetch` to `@effection/core` as a resource
  - Bumped due to a bump in effection.
  - [8ac2e85](https://github.com/thefrontside/effection/commit/8ac2e8515ac2cb1ee6ed5a200f31d28024bfdae2) Add covector change file on 2021-11-18
  - [b6d0e15](https://github.com/thefrontside/effection/commit/b6d0e1502ca8345bf488aef695b16fe7a5a5945d) Patch for fetch and not minor on 2021-11-19
