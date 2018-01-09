'use strict';

const Q = require('q');
const exec = require('child_process').exec;
const execPromise = Q.nfbind(exec);

describe('test orchestrator', () => {
	const conductor = require('../index.js');
	const intervalString = '*/2 * * * * *';
	const handleError = (e) => {
		if (e === undefined) {
		    throw Error('caught undefined error');
		} else if (typeof e === 'string') {
		    throw Error(e);
		} else { throw e; }
	    };
	it('instantiates forks of same worker', () => {
		let adv1 = conductor('test1', { idSuffix: 'fork1', intervalString: intervalString });
		let adv2 = conductor('test1', { idSuffix: 'fork2', intervalString: intervalString });
		let adv3 = conductor('test1', { idSuffix: 'fork3', intervalString: intervalString });
		if (process.env.DEBUG !== undefined) {
		    console.log('fork1 has id string', adv1.getId());
		    console.log('fork2 has id string', adv2.getId());
		    console.log('fork3 has id string', adv3.getId());
		}
		return execPromise('sleep 5')
		    .then(() => {
			    if (adv1.isElectedMaster() !== true) { throw Error('fork1 should be master, returned slave'); }
			    else if (adv2.isElectedMaster() !== false) { throw Error('fork2 should be slave, returned master'); }
			    else if (adv3.isElectedMaster() !== false) { throw Error('fork3 should be slave, returned master'); }
			    return;
			})
		    .catch((e) => handleError(e));
	    }).timeout(7000);

	it('instantiates forks of distinct workers', () => {
		let adv1 = conductor('test1', { intervalString: intervalString });
		let adv2 = conductor('test2', { intervalString: intervalString });
		let adv3 = conductor('test3', { intervalString: intervalString });
		if (process.env.DEBUG !== undefined) {
		    console.log('worker1 has id string', adv1.getId());
		    console.log('worker2 has id string', adv2.getId());
		    console.log('worker3 has id string', adv3.getId());
		}
		return execPromise('sleep 5')
		    .then(() => {
			    if (adv1.isElectedMaster() !== true) { throw Error('fork1 should be master, returned slave'); }
			    else if (adv2.isElectedMaster() !== true) { throw Error('fork2 should be master, returned slave'); }
			    else if (adv3.isElectedMaster() !== true) { throw Error('fork3 should be master, returned slave'); }
			    return;
			})
		    .catch((e) => handleError(e));
	    }).timeout(7000);
    });
