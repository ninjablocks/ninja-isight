var
	fs = require('fs')
	, os = require('os')
	, util = require('util')
	, stream = require('stream')
	, snap = require('imagesnap')
	, path = require('path')
	, http = require('http')
	, https = require('https')
;

util.inherits(isight, stream);
module.exports = isight;

function isight(opts, app) {
	
	var mod = this;
	stream.call(this);

	this.writable = true;
	this.readable = true;
	this.configurable = true;

	this.V = 0;
	this.G = "0";
	this.D = 1004;
	
	this.app = app;
	this.interval = undefined; // setInterval ref
	this.present = false;

	function init() {

		if(os.platform() !== 'darwin') {

			mod.log.error("isight: This module is only for OSX");
			return;
		}
		mod.log.info("isight: Assuming camera is present");
		mod.emit('register', mod);
		mod.plugin();
	};
};

isight.prototype.write = function write(data) {
	
	this.log.info("isight: Attempting snapshot...");
	var
		postOpts = {

			host : this.opts.streamHost
			, port : this.opts.streamPort
			, path : '/rest/v0/camera/' + this.guid + '/snapshot'
			, method : 'POST'
		}
		, mod = this
	;
	
	var proto = (this.opts.streamPort == 443 ? https : http);

	
	postOpts.headers = res.headers;
	postOpts.headers['X-Ninja-Token'] = mod.app.token;	

	var post = proto.request(postOpts, function(res) {

		res.on('end', function() {

			mod.log.debug("isight: streaming done");
		});
	});

	var get = snap();

	get.pipe(post).on('error', function(err) {

		mod.log.error("isight: Error streaming snapshot: %s", err);
	});
	get.on('error', function(err) { 

		mod.log.error("isight: Error retrieving snapshot: %s", err);
	});
	get.on('end', function() { post.end(); });
};

isight.prototype.heartbeat = function heartbeat(bool) {

	clearInterval(this.interval);

	if(!!bool) {

		var 
			mod = this
			, ival = this.opts.interval || 10000
		;
		this.log.debug(

			"isight: Setting data interval to %s"
			, Math.round(ival / 1000)
		);
		
		this.emit('data', '1');
		this.interval = setInterval(function() {

			mod.emit('data', '1');

		}, ival);
		return;
	}
	this.log.debug("isight: Clearing data interval");
};

isight.prototype.unplug = function unplug() {

	this.present = false;
	this.heartbeat(false);
	this.emit('config', {

		G : this.G
		, V : this.V
		, D : this.D
		, type : 'UNPLUG'
	});
};

isight.prototype.plugin = function plugin() {

	this.present = true;
	this.heartbeat(true);
	this.emit('data', '1');
	this.emit('config', {

		G : this.G
		, V : this.V
		, D : this.D
		, type : 'PLUGIN'
	});
};

isight.prototype.config = function config(opts) {
	
	// we can do something with config opts here

	this.save(opts);
};
