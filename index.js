const promisify = require('promisify-node');

const alsaMonitor = require('alsa-monitor');
const loudness = promisify('loudness');

const moment = require('moment');
const objectEntries = require('object.entries');
const acpi = require('acpi')({socket: '/var/run/acpid.socket'});

const DATE_FORMAT = 'MMM DD HH:mm'; // Jun 05 21:39
const BAR_LENGTH = 5;

const VOLUME_CHARS = {
	fill: '●',
	fillMuted: '·',
	unfill: '○',
}

const sections = {
	volume: '',
	power: '',
	clock: '',
};

const renderVolume = () => {
	return new Promise((res, rej) => {
		Promise.all([loudness.getVolume(), loudness.getMuted()])
			.then(([volume, muted]) => {
				switch (true) {
					case volume === 0: {
						return res(VOLUME_CHARS.unfill.repeat(BAR_LENGTH));
					}

					case volume === 100: {
						return res(VOLUME_CHARS[muted ? 'fillMuted' : 'fill'].repeat(BAR_LENGTH));
					}

					default: {
						const fillLength = Math.ceil(volume/(100/BAR_LENGTH));
						const fillString = VOLUME_CHARS[muted ? 'fillMuted' : 'fill'].repeat(fillLength);

						return res(`${fillString}${VOLUME_CHARS.unfill.repeat(BAR_LENGTH - fillLength)}`);
					}
				}
			});
	});
};

const render = (dirty = Object.keys(sections), ...args) => {
	renderVolume(...args).then(console.log.bind(console));
};

// Unused but maybe useful one day:
// video/brightnessup
// video/brighnessdown
const acpiEvents = {
	battery: 'power',
};

objectEntries(acpiEvents).forEach(([evt, dirty]) => {
	acpi.on(evt, (...args) => {
		render([dirty], evt, ...args);
	});
});

acpi.on('close', () => process.exit(0));

alsaMonitor.monitor((...args) => render(['volume'], ...args));

