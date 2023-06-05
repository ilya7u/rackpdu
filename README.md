# rackpdu

This is a native SNMP library for manage APC Rack PDU.

Tested on APC Rack PDU switched 9000 series.

## Install

Using NPM:
```
$ npm install rackpdu
```

Using YARN:
```
$ yarn add rackpdu
```

## Usage
```ts
import { RackPDU } from 'rackpdu';

const client = new RackPDU('127.0.0.1:161');
console.log(await client.isAlive());

await client.close();
```

## Configure Rack PDU Hardware

1. In Administration -> Network -> SNMPv1 -> access

    - enable Enable 'Enable SNMPv1 access'

2. In Administration -> Network -> SNMPv1 -> access control
    - set 'Access Type' of public Community Name to 'Read'
    - set 'Access Type' of private Community Name to 'Write+'
