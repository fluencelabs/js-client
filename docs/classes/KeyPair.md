[@fluencelabs/fluence](../README.md) / [Exports](../modules.md) / KeyPair

# Class: KeyPair

## Table of contents

### Constructors

- [constructor](KeyPair.md#constructor)

### Properties

- [Libp2pPeerId](KeyPair.md#libp2ppeerid)

### Methods

- [toEd25519PrivateKey](KeyPair.md#toed25519privatekey)
- [fromEd25519SK](KeyPair.md#fromed25519sk)
- [randomEd25519](KeyPair.md#randomed25519)

## Constructors

### constructor

• **new KeyPair**(`libp2pPeerId`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `libp2pPeerId` | `PeerId` |

#### Defined in

[internal/KeyPair.ts:27](https://github.com/fluencelabs/fluence-js/blob/0786493/src/internal/KeyPair.ts#L27)

## Properties

### Libp2pPeerId

• **Libp2pPeerId**: `PeerId`

Key pair in libp2p format. Used for backward compatibility with the current FluencePeer implementation

#### Defined in

[internal/KeyPair.ts:25](https://github.com/fluencelabs/fluence-js/blob/0786493/src/internal/KeyPair.ts#L25)

## Methods

### toEd25519PrivateKey

▸ **toEd25519PrivateKey**(): `Uint8Array`

#### Returns

`Uint8Array`

32 byte private key

#### Defined in

[internal/KeyPair.ts:55](https://github.com/fluencelabs/fluence-js/blob/0786493/src/internal/KeyPair.ts#L55)

___

### fromEd25519SK

▸ `Static` **fromEd25519SK**(`arr`): `Promise`<[`KeyPair`](KeyPair.md)\>

Generates new KeyPair from ed25519 private key represented as a 32 byte array

#### Parameters

| Name | Type |
| :------ | :------ |
| `arr` | `Uint8Array` |

#### Returns

`Promise`<[`KeyPair`](KeyPair.md)\>

- Promise with the created KeyPair

#### Defined in

[internal/KeyPair.ts:36](https://github.com/fluencelabs/fluence-js/blob/0786493/src/internal/KeyPair.ts#L36)

___

### randomEd25519

▸ `Static` **randomEd25519**(): `Promise`<[`KeyPair`](KeyPair.md)\>

Generates new KeyPair with a random secret key

#### Returns

`Promise`<[`KeyPair`](KeyPair.md)\>

- Promise with the created KeyPair

#### Defined in

[internal/KeyPair.ts:47](https://github.com/fluencelabs/fluence-js/blob/0786493/src/internal/KeyPair.ts#L47)
