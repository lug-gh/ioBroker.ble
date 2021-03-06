﻿import { Global as _ } from "../lib/global";
import { ChannelObjectDefinition, DeviceObjectDefinition, PeripheralObjectStructure, Plugin, StateObjectDefinition } from "./plugin";

function parseData(raw: Buffer): string | number {
	if (raw.length === 1) {
		// single byte
		return raw[0];
	} else {
		// Output hex value
		return raw.toString("hex");
	}
}

const plugin: Plugin = {
	name: "_default",
	description: "Handles all peripherals that are not handled by other plugins",

	// Just handle all services we receive already
	advertisedServices: [],
	isHandling: (p) => true,

	// No special context necessary. Return the peripheral, so it gets passed to the other methods.
	createContext: (peripheral: BLE.Peripheral) => peripheral,

	defineObjects: (peripheral: BLE.Peripheral): PeripheralObjectStructure => {

		const deviceObject: DeviceObjectDefinition = { // no special definitions neccessary
			common: undefined,
			native: undefined,
		};

		const channelId = `services`;
		const channelObject: ChannelObjectDefinition = {
			id: channelId,
			common: {
				// common
				name: "Advertised services",
				role: "info",
			},
			native: undefined,
		};

		const stateObjects: StateObjectDefinition[] = [];
		if (peripheral.advertisement && peripheral.advertisement.serviceData) {
			for (const entry of peripheral.advertisement.serviceData) {
				const uuid = entry.uuid;
				const stateId = `${channelId}.${uuid}`;

				stateObjects.push({
					id: stateId,
					common: {
						role: "value",
						name: "Advertised service " + uuid, // TODO: create readable names
						desc: "",
						type: "mixed",
						read: true,
						write: false,
					},
					native: undefined,
				});
			}
		}
		if (peripheral.advertisement && peripheral.advertisement.manufacturerData && peripheral.advertisement.manufacturerData.length > 0) {
			stateObjects.push({
				id: `${channelId}.manufacturerData`,
				common: {
					role: "value",
					name: "Manufacturer Data",
					desc: "",
					type: "mixed",
					read: true,
					write: false,
				},
				native: undefined,
			});
		}

		return {
			device: deviceObject,
			channels: [channelObject],
			states: stateObjects,
		};

	},

	getValues: (peripheral: BLE.Peripheral) => {
		const ret = {};
		if (peripheral.advertisement && peripheral.advertisement.serviceData) {
			for (const entry of peripheral.advertisement.serviceData) {
				const uuid = entry.uuid;
				const stateId = `services.${uuid}`;
				// remember the transmitted data
				ret[stateId] = parseData(entry.data);
				_.log(`_default: ${peripheral.address} > got data ${ret[stateId]} for ${uuid}`, "debug");
			}
		}
		if (peripheral.advertisement && peripheral.advertisement.manufacturerData && peripheral.advertisement.manufacturerData.length > 0) {
			const stateId = `services.manufacturerData`;
			// remember the transmitted data
			ret[stateId] = parseData(peripheral.advertisement.manufacturerData);
			_.log(`_default: ${peripheral.address} > got manufacturer data ${ret[stateId]}`, "debug");
		}
		return ret;
	},
};

export = plugin;
