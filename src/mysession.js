
//container
const SESSIONS = {};

//configuration vars
var _sesIntervalId;
var _cookieName = "SESSION"; //name cookie
var _maxage = 1000 * 60 * 60; //1h in miliseconds
var _sessionInterval = 1000 * 60 * 60; //default = 1h

//fully destroy sessions
function destroySession(key) {
	let node = SESSIONS[key];
	delete node.sessionHelper;
	delete node.startSession;
	delete node.sysdate;
	delete node.lastClick;
	delete node.mtime;
	delete node.rand;
	delete SESSIONS[key];
}

exports.open = function(opts) {
	opts = opts || {}; //init config
	_cookieName = opts.cookieName || _cookieName;
	_maxage = opts.maxage || _maxage;

	_sesIntervalId = setInterval(function() {
		let now = Date.now();
		for (let k in SESSIONS) {
			let session = SESSIONS[k];
			if ((now - session.mtime) > _maxage)
				destroySession(k);
		}
	}, opts.sessionInterval || _sessionInterval);
	return this;
}

exports.init = function(req, res) {
	var time = new Date(); //sysdate
	var mtime = time.getTime(); //microtime

	//get session key length, always = 20 characters
	var cookie = req.headers.cookie || ""; //cookie name
	var start = cookie.indexOf(_cookieName); //start index
	var rand = Math.random().toString(36).substr(2); //random string
	var key = (start < 0) ? (rand + "X" + mtime.toString(36)) : cookie.substr(start + _cookieName.length + 1, 20);
	res.setHeader("Set-Cookie", _cookieName + "=" + key + "; max-age=" + _maxage);

	//search session by key or initialize data
	var node = SESSIONS[key] || { sysdate: time };
	req.session = SESSIONS[key] = node; //save session

	req.add = function(data) { Object.assign(this.session, data); return this; } //add session data
	req.logged = function() { return this.session.startSession; } //session exists
	req.expired = function() { return ((this.session.sysdate - this.session.lastClick) > _maxage); }
	req.startSession = function() { this.session.startSession = this.session.sysdate; return this; }
	req.closeSession = function() { delete this.session.startSession; return this; }
	req.getSessionHelper = function() { return this.sessionHelper; }
	req.setSessionHelper = function(fn, req) { //clear helper and call handler
		this.sessionHelper = function() { delete this.sessionHelper; fn(req, this); };
		return this;
	}

	node.rand = rand; //random string
	node.mtime = mtime; //microtime
	node.lastClick = node.sysdate; //prev click time
	node.sysdate = time; //update sysdate
	node.yyyy = time.getFullYear();
	return node;
}

exports.close = function() {
	clearInterval(_sesIntervalId);
	for (let k in SESSIONS)
		destroySession(k);
	console.log("> Sessions closed.");
	return this;
}
