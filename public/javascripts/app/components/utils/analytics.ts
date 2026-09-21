const telemetryHost = (): string => {
	switch (window.location.host) {
		case 'restorer.gutools.co.uk':
			return 'https://user-telemetry.gutools.co.uk';
		case 'restorer.code.dev-gutools.co.uk':
			return 'https://user-telemetry.code.dev-gutools.co.uk';
		default:
			return 'https://user-telemetry.local.dev-gutools.co.uk';
	}
};

const trackRoute = (path: string): void => {
	const image = new Image();
	image.src = `${telemetryHost()}/guardian-tool-accessed?app=restorer&path=${encodeURIComponent(path)}`;
};

export { trackRoute };
