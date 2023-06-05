import snmp from 'net-snmp';
import _ from 'lodash';

// # OIDs for the PDUs
// # PowerNet-MIB::sPDUIdentModelNumber.0
// my $pdu_model_oid = '.1.3.6.1.4.1.318.1.1.4.1.4.0';
// # PowerNet-MIB::rPDULoadDevNumBanks.0
// my $num_banks_oid = '.1.3.6.1.4.1.318.1.1.12.2.1.4.0';
// # PowerNet-MIB::rPDUIdentDevicePowerWatts.0
// my $phase_power_oid = '.1.3.6.1.4.1.318.1.1.12.1.16.0';
// # PowerNet-MIB::rPDULoadStatusLoad.1
// my $phase_current_oid = '.1.3.6.1.4.1.318.1.1.12.2.3.1.1.2.1';
// # PowerNet-MIB::rPDULoadStatusLoad.2
// my $bank1_oid = '.1.3.6.1.4.1.318.1.1.12.2.3.1.1.2.2';
// # PowerNet-MIB::rPDULoadStatusLoad.3
// my $bank2_oid = '.1.3.6.1.4.1.318.1.1.12.2.3.1.1.2.3';
// # PowerNet-MIB::rPDULoadPhaseConfigOverloadThreshold.phase1
// my $phase_overload_oid = '.1.3.6.1.4.1.318.1.1.12.2.2.1.1.4.1';
// # PowerNet-MIB::rPDULoadPhaseConfigNearOverloadThreshold.phase1
// my $phase_nearoverload_oid = '.1.3.6.1.4.1.318.1.1.12.2.2.1.1.3.1';

const DEFAULT_PORT = 161;
const DEFAULT_VERSION = snmp.Version1;
const DEFAULT_TIMEOUT = 10000;

export enum OutletState {
    On = 1,
    Off = 2,
}

export enum DeviceCommand {
    NoCommandAll = 1,
    ImmediateAllOn = 2,
    ImmediateAllOff = 3,
    ImmediateAllReboot = 4,
    DelayedAllOn = 5,
    DelayedAllOff = 6,
    DelayedAllReboot = 7,
    CancelAllPendingCommands = 8,
}

export enum OutletCommand {
    ImmediateOn = 1,
    ImmediateOff = 2,
    ImmediateReboot = 3,
    DelayedOn = 4,
    DelayedOff = 5,
    DelayedReboot = 6,
    CancelPendingCommand = 7,
}

const OID_MIB2 = '1.3.6.1.2.1.';
const OID_RPDU = '1.3.6.1.4.1.318.1.1.12.';

// https://www.apc.com/us/en/faqs/FA156179/

export interface RackPDUOptions {
    version?: snmp.Version1 | snmp.Version2c | snmp.Version3;
    timeout?: number;
}

export class RackPDU {
    private _public;
    private _private;

    constructor(public host: string, protected options: RackPDUOptions = {}) {
        const [hostname, port] = host.split(':');
        this.options.version ??= DEFAULT_VERSION;
        this.options.timeout ??= DEFAULT_TIMEOUT;

        this._public = snmp.createSession(hostname, 'public', {
            port: port ?? DEFAULT_PORT,
            version: this.options.version,
            timeout: this.options.timeout,
        });

        this._private = snmp.createSession(hostname, 'private', {
            port: port ?? DEFAULT_PORT,
            version: this.options.version,
            timeout: this.options.timeout,
        });
    }

    async isAlive() {
        try {
            const result = await this._get([OID_RPDU + '1.1.0']);
            return true;
        } catch (error) {}
        return false;
    }

    async getName() {
        const result = await this._get([OID_RPDU + '1.1.0']);
        return result[0];
    }

    async getHardwareRevision() {
        const result = await this._get([OID_RPDU + '1.2.0']);
        return result[0];
    }

    async getFirmwareRevision() {
        const result = await this._get([OID_RPDU + '1.3.0']);
        return result[0];
    }

    async getDayOfManufacture() {
        const result = await this._get([OID_RPDU + '1.4.0']);
        return result[0];
    }

    async getModelNumber() {
        const result = await this._get([OID_RPDU + '1.5.0']);
        return result[0];
    }

    async getSerialNumber() {
        const result = await this._get([OID_RPDU + '1.6.0']);
        return result[0];
    }

    async getOutletsCount() {
        const result = await this._get([OID_RPDU + '1.8.0']);
        return parseInt(result[0]);
    }

    async getOutletName(id: number) {
        const result = await this._get([OID_RPDU + '3.5.1.1.2.' + id]);
        return result[0];
    }

    async getOutletsNames() {
        const nOutlets = await this.getOutletsCount();
        const result = await this._get(
            Array(nOutlets)
                .fill(0)
                .map((_, i) => OID_RPDU + '3.5.1.1.2.' + (i + 1)),
        );
        return result.reduce((acc, val, idx) => {
            acc[idx + 1] = val;
            return acc;
        }, {});
    }

    async getOutletState(id: number) {
        const result = await this._get([OID_RPDU + '3.5.1.1.4.' + id]);
        return parseInt(result[0]);
    }

    async getOutletsStates() {
        const nOutlets = await this.getOutletsCount();
        const result = await this._get(
            Array(nOutlets)
                .fill(0)
                .map((_, i) => OID_RPDU + '3.5.1.1.4.' + (i + 1)),
        );
        return result.reduce((acc, val, idx) => {
            acc[idx + 1] = val;
            return acc;
        }, {});
    }

    // 1.3.6.1.4.1.318.1.1.12.1.16.0 power watts

    // 12
    // Your Vote:

    // In addition to the MIB's above listed by user Jason Proos, we were able to modify the MIB for various others:

    // 1.3.6.1.4.1.318.1.1.12.2.3.1.1.2.1
    // - total amps/load (divide by 10) - change unit to "A" for amps

    // 1.3.6.1.4.1.318.1.1.12.2.3.1.1.2.2
    // - bank 1 load (divide by 10) - change unit to "A" for amps

    // 1.3.6.1.4.1.318.1.1.12.2.3.1.1.2.3
    // - bank 2 load (divide by 10) - change unit to "A" for amps

    // 1.3.6.1.4.1.318.1.1.12.2.3.1.1.2.0

    //
    async getPowerDraw() {
        const result = await this._get([OID_RPDU + '2.3.1.1.2.1']);
        return result[0] / 10.0;
        // Getting this OID will return the phase/bank load measured in tenths of Amps.
    }

    async getTest() {
        // const result = await this._get(['1.3.6.1.2.1.2.1.0']);
        const result = await this._get(['1.3.6.1.2.1.2.2.1.6.2'], true);
        // const result = await this._get(['1.3.6.1.2.1.4.20.1'], true);
        return result[0].toString('hex');
    }

    async getDescription() {
        const result = await this._get([OID_MIB2 + '1.1.0']);
        return result[0];
    }

    // in ms
    async getUptime() {
        const result = await this._get([OID_MIB2 + '1.3.0']);
        return result[0] * 10.0;
    }

    //     /**
    //  * Get the low load warning threshold
    //  *
    //  * @param   function    callback
    //  */
    // pdu.prototype.getLowLoadThreshold = function(callback) {
    //   // Using PowerNet-MIB::rPDULoadPhaseConfigLowLoadThreshold.phase1
    //   this.getByOid('1.1.12.2.2.1.1.2.1', callback, 'Unable to get the low warning threshold');
    // }

    // /**
    //  * Get the near load warning threshold
    //  *
    //  * @param   function    callback
    //  */
    // pdu.prototype.getNearLoadThreshold = function(callback) {
    //   // Using PowerNet-MIB::rPDULoadPhaseConfigNearOverloadThreshold.phase1
    //   this.getByOid('1.1.12.2.2.1.1.3.1', callback, 'Unable to get the near warning threshold')
    // }

    // /**
    //  * Get the over load alarm threshold
    //  *
    //  * @param   function    callback
    //  */
    // pdu.prototype.getOverloadThreshold = function(callback) {
    //   // Using PowerNet-MIB::rPDULoadPhaseConfigOverloadThreshold.phase1
    //   this.getByOid('1.1.12.2.2.1.1.4.1', callback, 'Unable to get overload threshold');
    // }

    // /**
    //  * Get the load state
    //  *  bankLoadNormal(1)
    //  *  bankLoadLow(2)
    //  *  bankLoadNearOverload(3)
    //  *  bankLoadOverload(4)
    //  *
    //  * @param   function  callback
    //  */
    // pdu.prototype.getLoadState = function(callback) {
    //   // Using PowerNet-MIB::rPDULoadStatusLoadState.0
    //   this.getByOid('1.1.12.2.3.1.1.3.0', callback, 'Unable to get load state');
    // }

    async runDeviceCommand(command: DeviceCommand) {
        const pdus = [
            {
                oid: OID_RPDU + '3.1.1.0',
                type: snmp.ObjectType.Integer,
                value: Number(command),
            },
        ];
        const result = await this._set(pdus);
        return result[0];
    }

    async runOutletsCommand(command: OutletCommand, ids: number[] = []) {
        if (ids.length === 0) {
            const nOutlets = await this.getOutletsCount();
            ids.push(
                ...Array(nOutlets)
                    .fill(0)
                    .map((_, i) => i + 1),
            );
        }

        const pdus = ids.map((i) => {
            return {
                oid: OID_RPDU + '3.3.1.1.4.' + i,
                type: snmp.ObjectType.Integer,
                value: Number(command),
            };
        });

        const result = await this._set(pdus);
        return result;
    }

    async close() {
        try {
            await this._public.close();
        } catch (error) {}

        try {
            await this._private.close();
        } catch (error) {}
    }

    static async getOutletsNames(pduHost: string) {
        let result = null;
        const pdu = new RackPDU(pduHost);
        try {
            result = await pdu.getOutletsNames();
        } catch (error) {
            console.error(error);
        }
        await pdu.close();
        return result;
    }

    static async outletRunCommand(pduHost: string, outletId: number, command: OutletCommand) {
        const pdu = new RackPDU(pduHost);
        try {
            await pdu.runOutletsCommand(command, [outletId]);
        } catch (error) {
            console.error(error);
        }
        await pdu.close();
    }

    static async outletOn(pduHost: string, outletId: number) {
        return await RackPDU.outletRunCommand(pduHost, outletId, OutletCommand.ImmediateOn);
    }

    static async outletOff(pduHost: string, outletId: number) {
        return await RackPDU.outletRunCommand(pduHost, outletId, OutletCommand.ImmediateOff);
    }

    static async outletReboot(pduHost: string, outletId: number) {
        return await RackPDU.outletRunCommand(pduHost, outletId, OutletCommand.ImmediateReboot);
    }

    static async outletsReboot(pduHost: string, patterns: string[]) {
        const pdu = new RackPDU(pduHost);
        const rebootedOutlets = [];

        try {
            const outlets = await pdu.getOutletsNames();

            const pduOutlets = {};

            for (const text of patterns) {
                const patternRegex = new RegExp(text, 'i');

                for (const [outletId, outletName] of Object.entries<string>(outlets)) {
                    if (outletName.match(patternRegex)) {
                        pduOutlets[parseInt(outletId)] = outletName;
                    }
                }
            }

            const ids = Object.keys(pduOutlets).map(Number);

            if (ids.length > 0) {
                await pdu.runOutletsCommand(OutletCommand.ImmediateReboot, ids);
                rebootedOutlets.push(...Object.values(pduOutlets));
            }
        } catch (error: any) {
            console.error(error);
            throw error;
        } finally {
            await pdu.close();
        }
        return rebootedOutlets;
    }

    static async isAlive(host: string) {
        const rackPDU = new RackPDU(host);
        let result = false;
        try {
            result = await rackPDU.isAlive();
        } catch (error) {
        } finally {
            await rackPDU.close();
        }
        return result;
    }

    private _set(pdus: any[]): Promise<any[]> {
        return new Promise((resolve, reject) => {
            this._private.set(pdus, (error, varbinds) => {
                if (error) {
                    reject(error);
                } else {
                    const result = Array(pdus.length);
                    const oids = pdus.map((p) => p.oid);
                    for (let i = 0; i < varbinds.length; i++) {
                        if (snmp.isVarbindError(varbinds[i])) {
                            reject(snmp.varbindError(varbinds[i]));
                            return;
                        } else {
                            const idx = oids.indexOf(varbinds[i].oid);
                            if (varbinds[i].type === snmp.ObjectType.OctetString) {
                                result[idx] = varbinds[i].value.toString();
                            } else {
                                result[idx] = varbinds[i].value;
                            }
                        }
                    }
                    resolve(result);
                }
            });
        });
    }

    private _get(oids: string[], raw = false): Promise<any[]> {
        return new Promise((resolve, reject) => {
            if (_.uniq(oids).length !== oids.length) {
                reject(new Error('non unique oids'));
                return;
            }
            this._public.get(oids, (error, varbinds) => {
                if (error) {
                    reject(error);
                } else {
                    const result = Array(oids.length);
                    for (let i = 0; i < varbinds.length; i++) {
                        if (snmp.isVarbindError(varbinds[i])) {
                            reject(snmp.varbindError(varbinds[i]));
                            return;
                        } else {
                            const idx = oids.indexOf(varbinds[i].oid);
                            if (varbinds[i].type === snmp.ObjectType.OctetString && raw !== true) {
                                // console.log(require('util').inspect(varbinds[i], true, 5, true))
                                result[idx] = varbinds[i].value.toString();
                            } else {
                                result[idx] = varbinds[i].value;
                            }
                        }
                    }
                    resolve(result);
                }
            });
        });
    }
}
