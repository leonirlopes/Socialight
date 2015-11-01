/*jslint browser: true, debug: true*/
/*global define, module, exports*/
(function (root, factory) {
    "use strict";
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory();
    } else {
        root.Socialight = factory();
    }
}(this, function () {
    "use strict";

    if (!Array.prototype.indexOf) {
        Array.prototype.indexOf = function (elem, startFrom) {
            var i;

            startFrom = startFrom || 0;

            if (startFrom > this.length) {
                return -1;
            }

            for (i = 0; i < this.length; i += 1) {
                if (this[i] === elem && startFrom <= i) {
                    return i;
                } else if (this[i] === elem && startFrom > i) {
                    return -1;
                }
            }

            return -1;
        };
    }

    if (!(Function.prototype.hasOwnProperty('bind'))) {
        Function.prototype.bind = function () {
            var fn = this, context = arguments[0], args = Array.prototype.slice.call(arguments, 1);
            return function () {
                return fn.apply(context, args.concat(Array.prototype.slice.call(arguments)));
            };
        };
    }

    var Socialight = function () {
        if (!this || !(this instanceof Socialight)) {
            return new Socialight();
        }

        this.container = document.querySelectorAll('[data-socialight-url]');
        this.channels  = ['facebook', 'twitter', 'linkedin', 'googleplus', 'pinterest', 'buffer'];

        this.ready();
    };

    Socialight.prototype = {
        post: function (path, data, callback) {
            var xhttp = new XMLHttpRequest();

            xhttp.open('POST', path, true);
            xhttp.setRequestHeader('Content-Type', 'application/json');
            xhttp.onreadystatechange = function () {
                if (this.readyState === 4) {
                    if (this.status >= 200 && this.status < 400) {
                        var response = '';
                        try {
                            response = JSON.parse(this.responseText);
                        } catch (err) {
                            response = this.responseText;
                        }
                        callback.call(window, response);
                    } else {
                        throw new Error(this.status + " - " + this.statusText);
                    }
                }
            };
            xhttp.send(data);
            xhttp = null;
        },
        jsonp: function (url, callback, context) {
            var name = 'jsonp_' + Math.round(100000 * Math.random()),
                head,
                script,
                extScript;

            head           = document.head || document.getElementsByTagName('head')[0];
            extScript      = document.createElement('script');
            extScript.type = 'text/javascript';

            script       = extScript.cloneNode();
            script.src   = url + (url.indexOf('?') >= 0 ? '&' : '?') + 'callback=' + name;
            script.async = true;

            head.appendChild(script);

            window[name] = function (data) {
                callback.call((context || window), data);
                head.removeChild(script);
                script = null;
                delete this.name;
            }.bind(this);
        },
        abbrNum: function (number, decPlaces) {
            decPlaces = Math.pow(10, decPlaces);

            var abbrev = [ "k", "m", "b", "t" ], size, i;

            for (i = abbrev.length - 1; i >= 0; i -= 1) {
                size = Math.pow(10, (i + 1) * 3);

                if (size <= number) {
                    number = Math.round(number * decPlaces / size) / decPlaces;

                    if ((number === 1000) && (i < abbrev.length - 1)) {
                        number = 1;
                        i += 1;
                    }
                    number += abbrev[i];

                    break;
                }
            }

            return number;
        },
        each: function (els, callback) {
            var i = 0, max = els.length;

            while (i < max) {
                callback(els[i], i);
                i += 1;
            }
        },
        isInArray: function (array, search) {
            return array.indexOf(search) >= 0;
        },
        createChannels: function () {
            var channels, span, i, j, k, len;

            for (i = 0, len = this.container.length; i < len; i += 1) {
                channels = JSON.parse(this.container[i].getAttribute('data-socialight-channels'));

                for (j = 0, k = channels.length; j < k; j += 1) {
                    if (this.isInArray(this.channels, channels[j])) {
                        span = document.createElement('span');
                        span.setAttribute('data-socialight-channel', channels[j]);

                        this.container[i].appendChild(span).cloneNode(true);
                    }
                }
            }
        },
        getCounterFb: function () {
            var matches = document.querySelectorAll('[data-socialight-channel="facebook"]'), url;

            this.each(matches, function (match) {
                url = match.parentNode.getAttribute('data-socialight-url');

                this.jsonp('https://graph.facebook.com/?id=' + url, function (data) {
                    match.innerHTML = this.abbrNum(data.shares, 1);
                }.bind(this));
            }.bind(this));
        },
        getCounterTwitter: function () {
            var matches = document.querySelectorAll('[data-socialight-channel="twitter"]'), url;

            this.each(matches, function (match) {
                url = match.parentNode.getAttribute('data-socialight-url');

                this.jsonp('https://cdn.api.twitter.com/1/urls/count.json?url=' + url, function (data) {
                    match.innerHTML = this.abbrNum(data.count, 1);
                }.bind(this));
            }.bind(this));
        },
        getCounterGooglePlus: function () {
            var matches = document.querySelectorAll('[data-socialight-channel="googleplus"]'), url, data;

            this.each(matches, function (match) {
                url  = match.parentNode.getAttribute('data-socialight-url');
                data = JSON.stringify({
                    'method': 'pos.plusones.get',
                    'id': url,
                    'params': {
                        'nolog': true,
                        'id': url,
                        'source': 'widget',
                        'userId': '@viewer',
                        'groupId': '@self'
                    },
                    'jsonrpc': '2.0',
                    'key': 'p',
                    'apiVersion': 'v1'
                });

                this.post('https://clients6.google.com/rpc', data, function (data) {
                    match.innerHTML = this.abbrNum(data.result.metadata.globalCounts.count, 1);
                }.bind(this));
            }.bind(this));
        },
        getCounterLinkedin: function () {
            var matches = document.querySelectorAll('[data-socialight-channel="linkedin"]'), url;

            this.each(matches, function (match) {
                url = match.parentNode.getAttribute('data-socialight-url');

                this.jsonp('https://www.linkedin.com/countserv/count/share?url=' + url, function (data) {
                    match.innerHTML = this.abbrNum(data.count, 1);
                }.bind(this));
            }.bind(this));
        },
        getCounterBuffer: function () {
            var matches = document.querySelectorAll('[data-socialight-channel="buffer"]'), url;

            this.each(matches, function (match) {
                url = match.parentNode.getAttribute('data-socialight-url');

                this.jsonp('https://api.bufferapp.com/1/links/shares.json?url=' + url, function (data) {
                    match.innerHTML = this.abbrNum(data.shares, 1);
                }.bind(this));
            }.bind(this));
        },
        getCounterPinterest: function () {
            var matches = document.querySelectorAll('[data-socialight-channel="pinterest"]'), url;

            this.each(matches, function (match) {
                url = match.parentNode.getAttribute('data-socialight-url');

                this.jsonp('https://api.pinterest.com/v1/urls/count.json?&url=' + url, function (data) {
                    match.innerHTML = this.abbrNum(data.count, 1);
                }.bind(this));
            }.bind(this));
        },
        getCounters: function () {
            this.getCounterFb();
            this.getCounterTwitter();
            this.getCounterGooglePlus();
            this.getCounterLinkedin();
            this.getCounterBuffer();
            this.getCounterPinterest();
        },
        ready: function () {
            this.createChannels();
            this.getCounters();
        }
    };

    return Socialight;
}));