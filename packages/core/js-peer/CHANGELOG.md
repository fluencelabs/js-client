# Changelog

## [0.8.7](https://github.com/fluencelabs/js-client/compare/js-peer-v0.8.6...js-peer-v0.8.7) (2023-04-04)


### Features

* Cleaning up technical debts ([#295](https://github.com/fluencelabs/js-client/issues/295)) ([0b2f12d](https://github.com/fluencelabs/js-client/commit/0b2f12d8ac223db341d6c30ff403166b3eae2e56))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @fluencelabs/interfaces bumped from 0.7.4 to 0.7.5

## [0.8.6](https://github.com/fluencelabs/js-client/compare/js-peer-v0.8.5...js-peer-v0.8.6) (2023-03-31)


### Features

* **logs:** Use `debug.js` library for logging [DXJ-327] ([#285](https://github.com/fluencelabs/js-client/issues/285)) ([e95c34a](https://github.com/fluencelabs/js-client/commit/e95c34a79220bd8ecdcee806802ac3d69a2af0cb))
* **test:** Automate smoke tests for JS Client [DXJ-293] ([#282](https://github.com/fluencelabs/js-client/issues/282)) ([10d7eae](https://github.com/fluencelabs/js-client/commit/10d7eaed809dde721b582d4b3228a48bbec50884))


### Bug Fixes

* **test:** All tests are working with vitest [DXJ-306] ([#291](https://github.com/fluencelabs/js-client/issues/291)) ([58ad3ca](https://github.com/fluencelabs/js-client/commit/58ad3ca6f666e8580997bb47609947645903436d))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @fluencelabs/interfaces bumped from 0.7.3 to 0.7.4

## [0.8.5](https://github.com/fluencelabs/js-client/compare/js-peer-v0.8.4...js-peer-v0.8.5) (2023-03-03)


### Bug Fixes

* Increase number of inbound and outbound streams to 1024 ([#280](https://github.com/fluencelabs/js-client/issues/280)) ([1ccc483](https://github.com/fluencelabs/js-client/commit/1ccc4835328426b546f31e1646d3a49ed042fdf9))

## [0.8.4](https://github.com/fluencelabs/js-client/compare/js-peer-v0.8.3...js-peer-v0.8.4) (2023-02-22)


### Bug Fixes

* `nodenext` moduleResolution for js peer ([#271](https://github.com/fluencelabs/js-client/issues/271)) ([78d98f1](https://github.com/fluencelabs/js-client/commit/78d98f15c12431dee9fdd7b9869d57760503f8c7))

## [0.8.3](https://github.com/fluencelabs/js-client/compare/js-peer-v0.8.2...js-peer-v0.8.3) (2023-02-16)


### Bug Fixes

* Trigger release to publish packages that were built ([#262](https://github.com/fluencelabs/js-client/issues/262)) ([47abf38](https://github.com/fluencelabs/js-client/commit/47abf3882956ffbdc52df372db26ba6252e8306b))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @fluencelabs/interfaces bumped from 0.7.2 to 0.7.3

## [0.8.2](https://github.com/fluencelabs/js-client/compare/js-peer-v0.8.1...js-peer-v0.8.2) (2023-02-16)


### Features

* Add `getRelayPeerId` method for `IFluenceClient` ([#260](https://github.com/fluencelabs/js-client/issues/260)) ([a10278a](https://github.com/fluencelabs/js-client/commit/a10278afaa782a307feb10c4eac060094c101230))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @fluencelabs/interfaces bumped from 0.7.1 to 0.7.2

## [0.8.1](https://github.com/fluencelabs/js-client/compare/js-peer-v0.8.0...js-peer-v0.8.1) (2023-02-16)


### Features

* Simplify JS Client public API ([#257](https://github.com/fluencelabs/js-client/issues/257)) ([9daaf41](https://github.com/fluencelabs/js-client/commit/9daaf410964d43228192c829c7ff785db6e88081))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @fluencelabs/interfaces bumped from 0.7.0 to 0.7.1

## [0.8.0](https://github.com/fluencelabs/fluence-js/compare/js-peer-v0.7.0...js-peer-v0.8.0) (2023-02-15)


### ⚠ BREAKING CHANGES

* Expose updated JS Client API via `js-client.api` package ([#246](https://github.com/fluencelabs/fluence-js/issues/246))
* Standalone web JS Client ([#243](https://github.com/fluencelabs/fluence-js/issues/243))

### Features

* Expose updated JS Client API via `js-client.api` package ([#246](https://github.com/fluencelabs/fluence-js/issues/246)) ([d4bb8fb](https://github.com/fluencelabs/fluence-js/commit/d4bb8fb42964b3ba25154232980b9ae82c21e627))
* Standalone web JS Client ([#243](https://github.com/fluencelabs/fluence-js/issues/243)) ([9667c4f](https://github.com/fluencelabs/fluence-js/commit/9667c4fec6868f984bba13249f3c47d293396406))


### Bug Fixes

* NodeJS package building ([#248](https://github.com/fluencelabs/fluence-js/issues/248)) ([0d05e51](https://github.com/fluencelabs/fluence-js/commit/0d05e517d89529af513fcb96cfa6c722ccc357a7))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @fluencelabs/interfaces bumped from 0.6.0 to 0.7.0
