# Changelog

## [0.1.1](https://github.com/fluencelabs/js-client/compare/js-client-v0.1.0...js-client-v0.1.1) (2023-08-25)


### Bug Fixes

* Use info log level instead trace [Fixes DXJ-457] ([#328](https://github.com/fluencelabs/js-client/issues/328)) ([477c6f0](https://github.com/fluencelabs/js-client/commit/477c6f0c151ef6759aaa2802c5e9907065d58e17))

## [0.1.0](https://github.com/fluencelabs/js-client/compare/js-client-v0.0.10...js-client-v0.1.0) (2023-08-24)


### ⚠ BREAKING CHANGES

* Unify all packages ([#327](https://github.com/fluencelabs/js-client/issues/327))

### Features

* Unify all packages ([#327](https://github.com/fluencelabs/js-client/issues/327)) ([97c2491](https://github.com/fluencelabs/js-client/commit/97c24918d84b34e7ac58337838dc8343cbd44b19))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @fluencelabs/interfaces bumped from 0.8.1 to 0.8.2
  * devDependencies
    * @fluencelabs/marine-worker bumped to 0.3.0

## [0.9.1](https://github.com/fluencelabs/js-client/compare/js-peer-v0.9.0...js-peer-v0.9.1) (2023-08-08)


### Bug Fixes

* **deps:** update dependency @fluencelabs/avm to v0.43.1 ([#322](https://github.com/fluencelabs/js-client/issues/322)) ([c1d1fa6](https://github.com/fluencelabs/js-client/commit/c1d1fa6659b6dc2c6707786748b3410fab7f1bcd))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @fluencelabs/interfaces bumped from 0.8.0 to 0.8.1

## [0.9.0](https://github.com/fluencelabs/js-client/compare/js-peer-v0.8.10...js-peer-v0.9.0) (2023-06-29)


### ⚠ BREAKING CHANGES

* **avm:** avm 0.40.0 (https://github.com/fluencelabs/js-client/pull/315)

### Features

* **avm:** avm 0.40.0 (https://github.com/fluencelabs/js-client/pull/315) ([8bae6e2](https://github.com/fluencelabs/js-client/commit/8bae6e24e62153b567f320ccecc7bce76bc826d1))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @fluencelabs/interfaces bumped from 0.7.6 to 0.8.0

## [0.8.10](https://github.com/fluencelabs/js-client/compare/js-peer-v0.8.9...js-peer-v0.8.10) (2023-06-20)


### Features

* support signatures [fixes DXJ-389] ([#310](https://github.com/fluencelabs/js-client/issues/310)) ([a60dfe0](https://github.com/fluencelabs/js-client/commit/a60dfe0d680b4d9ac5092dec64e2ebf478bf80eb))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @fluencelabs/interfaces bumped from 0.7.5 to 0.7.6

## [0.8.9](https://github.com/fluencelabs/js-client/compare/js-peer-v0.8.8...js-peer-v0.8.9) (2023-06-14)


### Features

* Add tracing service [fixes DXJ-388] ([#307](https://github.com/fluencelabs/js-client/issues/307)) ([771086f](https://github.com/fluencelabs/js-client/commit/771086fddf52b7a5a1280894c7238e409cdf6a64))
* improve ttl error message ([#300](https://github.com/fluencelabs/js-client/issues/300)) ([9821183](https://github.com/fluencelabs/js-client/commit/9821183d53870240cb5700be67cb8d57533b954b))

## [0.8.8](https://github.com/fluencelabs/js-client/compare/js-peer-v0.8.7...js-peer-v0.8.8) (2023-05-30)


### Features

* add run-console ([#305](https://github.com/fluencelabs/js-client/issues/305)) ([cf1f029](https://github.com/fluencelabs/js-client/commit/cf1f02963c1d7e1a17866f5798901a0f61b8bc31))

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