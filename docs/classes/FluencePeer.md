[@fluencelabs/fluence](../README.md) / [Exports](../modules.md) / FluencePeer

# Class: FluencePeer

This class implements the Fluence protocol for javascript-based environments.
It provides all the necessary features to communicate with Fluence network

## Table of contents

### Constructors

- [constructor](FluencePeer.md#constructor)

### Accessors

- [internals](FluencePeer.md#internals)

### Methods

- [getStatus](FluencePeer.md#getstatus)
- [start](FluencePeer.md#start)
- [stop](FluencePeer.md#stop)
- [isInstance](FluencePeer.md#isinstance)

## Constructors

### constructor

• **new FluencePeer**()

Creates a new Fluence Peer instance.

#### Defined in

[internal/FluencePeer.ts:107](https://github.com/fluencelabs/fluence-js/blob/ac8b613/src/internal/FluencePeer.ts#L107)

## Accessors

### internals

• `get` **internals**(): `Object`

Is not intended to be used manually. Subject to change

#### Returns

`Object`

| Name | Type |
| :------ | :------ |
| `callServiceHandler` | `CallServiceHandler` |
| `initiateFlow` | (`request`: `RequestFlow`) => `Promise`<`void`\> |

#### Defined in

[internal/FluencePeer.ts:182](https://github.com/fluencelabs/fluence-js/blob/ac8b613/src/internal/FluencePeer.ts#L182)

## Methods

### getStatus

▸ **getStatus**(): [`PeerStatus`](../interfaces/PeerStatus.md)

Get the peer's status

#### Returns

[`PeerStatus`](../interfaces/PeerStatus.md)

#### Defined in

[internal/FluencePeer.ts:125](https://github.com/fluencelabs/fluence-js/blob/ac8b613/src/internal/FluencePeer.ts#L125)

___

### start

▸ **start**(`config?`): `Promise`<`void`\>

Initializes the peer: starts the Aqua VM, initializes the default call service handlers
and (optionally) connect to the Fluence network

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `config?` | `PeerConfig` | object specifying peer configuration |

#### Returns

`Promise`<`void`\>

#### Defined in

[internal/FluencePeer.ts:144](https://github.com/fluencelabs/fluence-js/blob/ac8b613/src/internal/FluencePeer.ts#L144)

___

### stop

▸ **stop**(): `Promise`<`void`\>

Uninitializes the peer: stops all the underltying workflows, stops the Aqua VM
and disconnects from the Fluence network

#### Returns

`Promise`<`void`\>

#### Defined in

[internal/FluencePeer.ts:172](https://github.com/fluencelabs/fluence-js/blob/ac8b613/src/internal/FluencePeer.ts#L172)

___

### isInstance

▸ `Static` **isInstance**(`obj`): `boolean`

Checks whether the object is instance of FluencePeer class

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `obj` | [`FluencePeer`](FluencePeer.md) | object to check if it is FluencePeer |

#### Returns

`boolean`

true if the object is FluencePeer false otherwise

#### Defined in

[internal/FluencePeer.ts:114](https://github.com/fluencelabs/fluence-js/blob/ac8b613/src/internal/FluencePeer.ts#L114)
