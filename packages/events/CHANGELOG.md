# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.6.1] - 2020-04-29

## Changed

* Event dispatch of `once` is asynchronous, to avoid problems with
  misbehaving event emitters.
  https://github.com/thefrontside/effection.js/pull/107

## Added

* EventSource type is exported.
  https://github.com/thefrontside/effection/pull/102
