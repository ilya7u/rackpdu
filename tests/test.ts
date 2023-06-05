import pino from 'pino';
import { DeviceCommand, OutletCommand, RackPDU } from '../src';

const logger = pino({
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: true,
        },
    },
});

const HOST = '192.168.1.102';

(async () => {
    logger.info(`Start with host: ${HOST}`);

    const r = new RackPDU(HOST);

    const isAlive = await r.isAlive();
    logger.info(`Alive: ${isAlive}`);
    if (!isAlive) {
        return;
    }

    logger.info(`Model number: ${await r.getModelNumber()}`);
    logger.info(`Serial Number: ${await r.getSerialNumber()}`);
    logger.info(`Firmware Revision: ${await r.getFirmwareRevision()}`);
    logger.info(`Day of Manufacture: ${await r.getDayOfManufacture()}`);
    logger.info(`Description: ${await r.getDescription()}`);
    logger.info(`Uptime: ${await r.getUptime()}`);

    logger.info(`Outlets count: ${await r.getOutletsCount()}`);
    logger.info(`Outlets names: ${JSON.stringify(await r.getOutletsNames())}`);
    logger.info(`Outlets states: ${JSON.stringify(await r.getOutletsStates())}`);

    logger.info(`2 outlets off: ${await r.runOutletsCommand(OutletCommand.ImmediateOff, [1, 2])}`);
    logger.info(`Device immediate all reboot: ${await r.runDeviceCommand(DeviceCommand.ImmediateAllReboot)}`);

    await r.close();
})();
