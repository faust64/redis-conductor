'use strict';

const os = require('os');
const redis = require('redis');
const schedule = require('node-schedule');

class conductor {
    constructor(role, opts) {
	opts = opts || {};
	let connOptions = { db: opts.dbId || '0' };
	let logOpts = {};
	if (process.env.DEBUG !== undefined) { logOpts.debug = true; }
	this._channel = 'advertise-neighbors-' + (role || 'standalone');
	this._idString = os.hostname() + ':' + process.pid;
	this._log = require('wraplog')(`${role}-advertise-neighbors`, logOpts);
	this._neighbors = [];
	if (opts.idSuffix !== undefined) { this._idString = `${this._idString}:${opts.idSuffix}`; }
	opts.crashOnError = opts.crashOnError || true;
	opts.host = opts.host || '127.0.0.1';
	opts.intervalString = opts.intervalString || '*/10 * * * * *';
	opts.port = opts.port || 6379;
	if (opts.crashOnError === false || opts.crashOnError === 'false') { opts.exitOnError = true; }
	if (opts.authPass !== undefined) { connOptions.auth_pass = opts.authPass; }
	let self = this;

	const handleError = (where, e) => {
		let errStr = JSON.stringify(e || 'undefined error');
		self._log.error(`${where} caught error: ${errStr}`);
		if (opts.crashOnError !== false) {
		    throw new Error({ where: where, trace: e });
		} else if (opts.exitOnError !== false) {
		    process.exit(1);
		}
	    };
	this._publisher = redis.createClient(opts.port, opts.host, connOptions);
	this._subscriber = redis.createClient(opts.port, opts.host, connOptions);
	this._publisher.on('error', (e) => handleError('publisher', e));
	this._subscriber.on('error', (e) => handleError('subscriber', e));
	this._subscriber.on('message', (chan, msg) => {
		if (process.env.DEBUG) { self._log.info(`${self._idString} received message from ${msg}`); }
		if (self._neighbors[msg] === undefined) {
		    self._neighbors[msg] = 2;
		} else { self._neighbors[msg]++; }
	    });
	this._subscriber.subscribe(this._channel);

	this._advertiseNeighbors = schedule.scheduleJob(opts.intervalString, () => {
		self._publisher.publish(self._channel, self._idString);
		if (process.env.DEBUG) { self._log.info(`advertised neighbors from ${self._idString}`); }
	    });

	this._cleanupNeighbors = schedule.scheduleJob(opts.intervalString, () => {
		if (self._neighbors[self._idString] !== undefined) {
		    for (let key in self._neighbors) {
			if (self._neighbors[key] > 0) {
			    self._neighbors[key]--;
			    if (process.env.DEBUG) { self._log.info(`${self._idString} knows of ${key} with score ${self._neighbors[key]}`); }
			} else {
			    delete self._neighbors[key];
			    if (process.env.DEBUG) { self._log.info(`${self._idString} removing ${key} for no having checked in lately`); }
			}
		    }
		}
	    });
    }

    get itf() {
	return {
	    getId: () => { return this._idString; },
	    getNeighbors: () => { return this._neighbors; },
	    getOrderedNeighbors: () => {
		    let ret = [];
		    Object.keys(this._neighbors)
			.sort().forEach((i, j) => {
				ret.push(i);
			    });
		    return ret;
		},
	    isElectedMaster: () => {
		    let ret = [];
		    Object.keys(this._neighbors)
			.sort().forEach((i, j) => { ret.push(i); });
		    return ((ret[0] == this._idString));
		},
	    cancel: () => {
		    this._advertiseNeighbors.cancel();
		    this._cleanupNeighbors.cancel();
		}
	};
    }
}
module.exports = (role, opts) => new conductor(role, opts).itf;
