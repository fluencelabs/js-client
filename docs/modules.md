[@fluencelabs/fluence](README.md) / Exports

# @fluencelabs/fluence

## Table of contents

### Classes

- [FluencePeer](classes/FluencePeer.md)
- [KeyPair](classes/KeyPair.md)

### Interfaces

- [CallParams](interfaces/CallParams.md)
- [PeerStatus](interfaces/PeerStatus.md)

### Type aliases

- [AvmLoglevel](modules.md#avmloglevel)
- [PeerIdB58](modules.md#peeridb58)

### Variables

- [Fluence](modules.md#fluence)

### Functions

- [setLogLevel](modules.md#setloglevel)

## Type aliases

### AvmLoglevel

Ƭ **AvmLoglevel**: `LogLevel`

Enum representing the log level used in Aqua VM.
Possible values: 'info', 'trace', 'debug', 'info', 'warn', 'error', 'off';

#### Defined in

[internal/FluencePeer.ts:27](https://github.com/fluencelabs/fluence-js/blob/8655605/src/internal/FluencePeer.ts#L27)

___

### PeerIdB58

Ƭ **PeerIdB58**: `string`

Peer ID's id as a base58 string (multihash/CIDv0).

#### Defined in

[internal/commonTypes.ts:22](https://github.com/fluencelabs/fluence-js/blob/8655605/src/internal/commonTypes.ts#L22)

## Variables

### Fluence

• `Const` **Fluence**: `Object`

Public interface to Fluence JS

#### Type declaration

| Name | Type |
| :------ | :------ |
| `getPeer` | () => [`FluencePeer`](classes/FluencePeer.md) |
| `getStatus` | () => [`PeerStatus`](interfaces/PeerStatus.md) |
| `start` | (`config?`: `PeerConfig`) => `Promise`<`void`\> |
| `stop` | () => `Promise`<`void`\> |

#### Defined in

[index.ts:36](https://github.com/fluencelabs/fluence-js/blob/8655605/src/index.ts#L36)

## Functions

### setLogLevel

▸ `Const` **setLogLevel**(`level`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `level` | `LogLevelDesc` |

#### Returns

`void`

#### Defined in

[index.ts:25](https://github.com/fluencelabs/fluence-js/blob/8655605/src/index.ts#L25)
