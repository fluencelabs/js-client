[@fluencelabs/fluence](../README.md) / [Exports](../modules.md) / CallParams

# Interface: CallParams<ArgName\>

Additional information about a service call

## Type parameters

| Name | Type |
| :------ | :------ |
| `ArgName` | extends `string` \| ``null`` |

## Table of contents

### Properties

- [initPeerId](CallParams.md#initpeerid)
- [particleId](CallParams.md#particleid)
- [signature](CallParams.md#signature)
- [tetraplets](CallParams.md#tetraplets)
- [timeStamp](CallParams.md#timestamp)
- [ttl](CallParams.md#ttl)

## Properties

### initPeerId

• **initPeerId**: `string`

The peer id which created the particle

#### Defined in

[internal/commonTypes.ts:37](https://github.com/fluencelabs/fluence-js/blob/ac8b613/src/internal/commonTypes.ts#L37)

___

### particleId

• **particleId**: `string`

The identifier of particle which triggered the call

#### Defined in

[internal/commonTypes.ts:32](https://github.com/fluencelabs/fluence-js/blob/ac8b613/src/internal/commonTypes.ts#L32)

___

### signature

• **signature**: `string`

Particle's signature

#### Defined in

[internal/commonTypes.ts:52](https://github.com/fluencelabs/fluence-js/blob/ac8b613/src/internal/commonTypes.ts#L52)

___

### tetraplets

• **tetraplets**: { [key in string]: SecurityTetraplet[]}

Security tetraplets

#### Defined in

[internal/commonTypes.ts:57](https://github.com/fluencelabs/fluence-js/blob/ac8b613/src/internal/commonTypes.ts#L57)

___

### timeStamp

• **timeStamp**: `number`

Particle's timestamp when it was created

#### Defined in

[internal/commonTypes.ts:42](https://github.com/fluencelabs/fluence-js/blob/ac8b613/src/internal/commonTypes.ts#L42)

___

### ttl

• **ttl**: `number`

Time to live in milliseconds. The time after the particle should be expired

#### Defined in

[internal/commonTypes.ts:47](https://github.com/fluencelabs/fluence-js/blob/ac8b613/src/internal/commonTypes.ts#L47)
