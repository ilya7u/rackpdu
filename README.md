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

const client = new RackPDU('192.168.1.102:161'); // or new RackPDU('192.168.1.102', { timeout: 30000});
console.log(await client.isAlive());

await client.close();
```

```ts
import { RackPDU } from 'rackpdu';

console.log(await RackPDU.isAlive('192.168.1.102'));
```

## Methods

Common:

- isAlive
- getName
- getHardwareRevision
- getFirmwareRevision
- getDayOfManufacture
- getModelNumber
- getSerialNumber
- getDescription
- getUptime
- getPowerDraw

Outlets:

- getOutletsCount
- getOutletName
- getOutletNames
- getOutletState
- getOutletStates

Commands:

- runDeviceCommand
- runOutletsCommand

## Static methods

- RackPDU.isAlive
- RackPDU.getOutletsNames
- RackPDU.outletRunCommand
- RackPDU.outletOn
- RackPDU.outletOff
- RackPDU.outletReboot
- RackPDU.outletsReboot

## Configure Rack PDU Hardware

1. In Administration -> Network -> SNMPv1 -> access

    - enable Enable 'Enable SNMPv1 access'

2. In Administration -> Network -> SNMPv1 -> access control
    - set 'Access Type' of public Community Name to 'Read'
    - set 'Access Type' of private Community Name to 'Write+'
