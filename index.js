'use strict';
var childProcess = require('child_process');
var stripAnsi = require('strip-ansi');
var delimiter = require('path').delimiter;
var shell = process.env.SHELL || '/bin/sh';
var user = process.env.USER;
var opts = {encoding: 'utf8'};

module.exports = function (cb) {
	if (process.platform === 'win32') {
		setImmediate(cb, null, process.env.PATH);
		return;
	}

	pathFromShell(function (err, p1) {
		if (err) {
			cb(err);
			return;
		}

		pathFromSudo(function (err, p2) {
			if (err) {
				cb(err);
				return;
			}

			// return the longest found path
			cb(null, longest([p1, p2, process.env.PATH]));
		});
	});
};

module.exports.sync = function () {
	if (process.platform === 'win32') {
		return process.env.PATH;
	}

	var p1 = pathFromShellSync();
	var p2 = pathFromSudoSync();

	// return the longest found path
	return longest([p1, p2, process.env.PATH]);
};

function pathFromShell(cb) {
	childProcess.execFile(shell, ['-i', '-c', 'echo "$PATH"'], opts, function (err, stdout) {
		if (err) {
			cb(err);
			return;
		}

		cb(null, clean(stdout));
	});
}

function pathFromShellSync() {
	return clean(childProcess.execFileSync(shell, ['-i', '-c', 'echo "$PATH"'], opts));
}

function pathFromSudo(cb) {
	childProcess.exec('sudo -Hiu ' + user + ' echo "$PATH"', opts, function (err, stdout) {
		if (err) {
			// may fail with 'sudo: must be setuid root'
			cb(null, '');
			return;
		}

		cb(null, clean(stdout));
	});
}

function pathFromSudoSync() {
	try {
		return clean(childProcess.execSync('sudo -Hiu ' + user + ' echo "$PATH"', opts));
	} catch (err) {
		// may fail with 'sudo: must be setuid root'
		return '';
	}
}

function clean(str) {
	return stripAnsi(str.trim());
}

function longest(arr) {
	return arr.reduce(function (a, b) {
		return a.split(delimiter).length > b.split(delimiter).length ? a : b;
	});
}
