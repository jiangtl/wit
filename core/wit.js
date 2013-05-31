/*!
 * Wit JS Library 1.2
 * Copyright(c) 2013 baifendian Inc.
 * http://www.baifendian.com/wit
 * author:Jack FED
 * tenglong.jiang@baifendian.com
 */
// for old browsers
window.undefined = window.undefined;
/**
 * @class Wit
 * Wit core utilities and functions.
 * @singleton
 */
Wit = {
	/**
     * The version of the framework
     * @type String
     */
    version : '1.2',
	pubDate : '2013-4-25',
	addEvent : null,
	delEvent : null
}
/**
 * Copies all the properties of config to obj.
 * @param {Object} obj The receiver of the properties
 * @param {Object} config The source of the properties
 * @param {Object} defaults A different object that will also be applied for default values
 * @return {Object} returns obj
 * @member Wit apply
 */
Wit.apply = function(o, c, defaults){
    // no "this" reference for friendly out of scope calls
    if(defaults){
        Wit.apply(o, defaults);
    }
    if(o && c && typeof c === 'object'){
        for(var p in c){
            o[p] = c[p];
        }
    }
    return o;
};

(function(){
	/**
	 * 添加/删除事件，兼容各浏览器
	 * @method addEvent
	 * @param {Object} DOM元素
	 * @param {String} 事件句柄
	 * @param {Function} 自定义监听函数
	 */
	if(typeof window.addEventListener === 'function') {
		Wit.addEvent = function(element, type, listener){
			element.addEventListener(type, listener, false );			
		}
		Wit.delEvent = function(element, type, handler){			
			element.removeEventListener(type, handler, false );
		}
	} else if(typeof window.attachEvent === 'function') {
		Wit.addEvent = function(element, type, listener){
			element.attachEvent('on' + type, listener);
		}
		Wit.delEvent = function(element, type, handler){			
			element.detachEvent('on' + type, handler);
		}
	} else {//更早版本的浏览器
		Wit.addEvent = function(element, type, listener){
			element["on" + type] = listener;
		}
		Wit.delEvent = function(element, type, handler){			
			element["on" + type] = null;
		}
	}	
	var idSeed = 0,
        toString = Object.prototype.toString,
        ua = navigator.userAgent.toLowerCase(),
        check = function(r){
            return r.test(ua);
        },
        DOC = document,
        docMode = DOC.documentMode,
        isStrict = DOC.compatMode == "CSS1Compat",
        isOpera = check(/opera/),
        isChrome = check(/\bchrome\b/),
        isWebKit = check(/webkit/),
        isSafari = !isChrome && check(/safari/),
        isSafari2 = isSafari && check(/applewebkit\/4/), // unique to Safari 2
        isSafari3 = isSafari && check(/version\/3/),
        isSafari4 = isSafari && check(/version\/4/),
        isIE = !isOpera && check(/msie/),
        isIE7 = isIE && (check(/msie 7/) || docMode == 7),
        isIE8 = isIE && (check(/msie 8/) && docMode != 7),
        isIE9 = isIE && check(/msie 9/),
        isIE6 = isIE && !isIE7 && !isIE8 && !isIE9,
        isGecko = !isWebKit && check(/gecko/),
        isGecko2 = isGecko && check(/rv:1\.8/),
        isGecko3 = isGecko && check(/rv:1\.9/),
        isBorderBox = isIE && !isStrict,
        isWindows = check(/windows|win32/),
        isMac = check(/macintosh|mac os x/),
        isAir = check(/adobeair/),
        isLinux = check(/linux/),
        isSecure = /^https/i.test(window.location.protocol);

    // remove css image flicker
    if(isIE6){
        try{
            DOC.execCommand("BackgroundImageCache", false, true);
        }catch(e){}
    }
	
	Wit.apply(Wit, {
		SSL_SECURE_URL : isSecure && isIE ? 'javascript:""' : 'about:blank',
        isStrict : isStrict,
        isSecure : isSecure,
        isReady : false,
        /**
         * Copies all the properties of config to obj if they don't already exist.
         * @param {Object} obj The receiver of the properties
         * @param {Object} config The source of the properties
         * @return {Object} returns obj
         */
        applyIf : function(o, c){
            if(o){
                for(var p in c){
                    if(!Wit.isDefined(o[p])){
                        o[p] = c[p];
                    }
                }
            }
            return o;
        },


        id : function(el, prefix){
            el = Wit.getDom(el, true) || {};
            if (!el.id) {
                el.id = (prefix || "ext-gen") + (++idSeed);
            }
            return el.id;
        },
		toArray : function(){
             return isIE ?
                 function(a, i, j, res){
                     res = [];
                     for(var x = 0, len = a.length; x < len; x++) {
                         res.push(a[x]);
                     }
                     return res.slice(i || 0, j || res.length);
                 } :
                 function(a, i, j){
                     return Array.prototype.slice.call(a, i || 0, j || a.length);
                 };
         }(),
		 isIterable : function(v){
            //check for array or arguments
            if(Wit.isArray(v) || v.callee){
                return true;
            }
            //check for node list type
            if(/NodeList|HTMLCollection/.test(toString.call(v))){
                return true;
            }
            //NodeList has an item and length property
            //IXMLDOMNodeList has nextNode method, needs to be checked first.
            return ((typeof v.nextNode != 'undefined' || v.item) && Wit.isNumber(v.length));
        },
		each : function(array, fn, scope){
            if(Wit.isEmpty(array, true)){
                return;
            }
            if(!Wit.isIterable(array) || Wit.isPrimitive(array)){
                array = [array];
            }
            for(var i = 0, len = array.length; i < len; i++){
                if(fn.call(scope || array[i], array[i], i, array) === false){
                    return i;
                };
            }
        }, 
		iterate : function(obj, fn, scope){
            if(Wit.isEmpty(obj)){
                return;
            }
            if(Wit.isIterable(obj)){
                Wit.each(obj, fn, scope);
                return;
            }else if(typeof obj == 'object'){
                for(var prop in obj){
                    if(obj.hasOwnProperty(prop)){
                        if(fn.call(scope || obj, prop, obj[prop], obj) === false){
                            return;
                        };
                    }
                }
            }
        }, 
		getDom : function(el, strict){
            if(!el || !DOC){
                return null;
            }
            if (el.dom){
                return el.dom;
            } else {
                if (typeof el == 'string') {
                    var e = DOC.getElementById(el);
                    // IE returns elements with the 'name' and 'id' attribute.
                    // we do a strict check to return the element with only the id attribute
                    if (e && isIE && strict) {
                        if (el == e.getAttribute('id')) {
                            return e;
                        } else {
                            return null;
                        }
                    }
                    return e;
                } else {
                    return el;
                }
            }
        },
		getBody : function(){
            return DOC.body || DOC.documentElement;
        },
		getHead : function() {
            var head;            
            return function() {
                if (head == undefined) {
                    head = DOC.getElementsByTagName("head")[0];
                }
                
                return head;
            };
        }(),
		removeNode : isIE && !isIE8 ? function(){
            var d;
            return function(n){
                if(n && n.tagName != 'BODY'){
                    (Wit.enableNestedListenerRemoval) ? Wit.EventManager.purgeElement(n, true) : Wit.EventManager.removeAll(n);
                    d = d || DOC.createElement('div');
                    d.appendChild(n);
                    d.innerHTML = '';
                    delete Wit.elCache[n.id];
                }
            };
        }() : function(n){
            if(n && n.parentNode && n.tagName != 'BODY'){
                (Wit.enableNestedListenerRemoval) ? Wit.EventManager.purgeElement(n, true) : Wit.EventManager.removeAll(n);
                n.parentNode.removeChild(n);
                delete Wit.elCache[n.id];
            }
        },
		isEmpty : function(v, allowBlank){
            return v === null || v === undefined || ((Wit.isArray(v) && !v.length)) || (!allowBlank ? v === '' : false);
        },
		isArray : function(v){
            return Object.prototype.toString.call(v) === '[object Array]';
        },
		isDate : function(v){
            return Object.prototype.toString.call(v) === '[object Date]';
        },
		isObject : function(v){
            return !!v && Object.prototype.toString.call(v) === '[object Object]';
        },
		isPrimitive : function(v){
            return Wit.isString(v) || Wit.isNumber(v) || Wit.isBoolean(v);
        },
		isFunction : function(v){
            return Object.prototype.toString.call(v) === '[object Function]';
        },
		isNumber : function(v){
            return typeof v === 'number' && isFinite(v);
        },
		isString : function(v){
            return typeof v === 'string';
        },
		isBoolean : function(v){
            return typeof v === 'boolean';
        },
		isElement : function(v) {
            return v ? !!v.tagName : false;
        },
		isDefined : function(v){
            return typeof v !== 'undefined';
        },
        isOpera : isOpera,
        isWebKit : isWebKit,
        isChrome : isChrome,
        isSafari : isSafari,
        isSafari3 : isSafari3,
        isSafari4 : isSafari4,
        isSafari2 : isSafari2,
        isIE : isIE,
        isIE6 : isIE6,
        isIE7 : isIE7,
        isIE8 : isIE8,
        isIE9 : isIE9,
        isGecko : isGecko,
        isGecko2 : isGecko2,
        isGecko3 : isGecko3,
        isBorderBox : isBorderBox,
        isLinux : isLinux,
        isWindows : isWindows,
        isMac : isMac,
        isAir : isAir,
		 
		/**
		 * 用于存储指定节点的上级节点信息，在getParentNode函数中被应用。
		 */
		parentNodes : [],
		/**
		 * 根据ID获取元素对象
		 * @method $:
		 * @param {string} 元素id
		 * @return {Array} 元素
		 */
		$:function(id) {
			return document.getElementById(id);
		},
		/**
		 * 获得兄弟DOM元素
		 * @method siblings
		 * @param {nodeObject} DOM元素
		 * @return {Array} 返回elem同级DOM元素集合
		 */
		siblings:function(elem){	
			var n = elem.parentNode.firstChild;
			var r = [];
			for ( ; n; n = n.nextSibling ) {
				if ( n.nodeType === 1 && n !== elem ) {
					r.push( n );
				}
			}
			return r;
		},
		/**
		 * 获取elem之前的同级相同元素
		 * @method preSiblings
		 * @param {nodeObject} DOM元素
		 * @return {Array} 返回elem之前的同级相同元素集合
		 */
		preSiblings : function(elem) {
			var matched = [],
			cur = elem.previousSibling;
			
			while (cur) {
				if(cur.nodeType == 1 && cur.nodeName == elem.nodeName) 
					matched.push( cur );
				
				cur = cur.previousSibling;
				
			}
			return matched;
		},
		/**
		 * 获取elem之前的同级相同元素
		 * @method preSiblingss
		 * @param {nodeObject} DOM元素
		 * @return {Array} 返回elem之前的同级相同元素集合
		 */
		preSiblingss : function(elem) {
			var matched = [],
			cur = elem.previousSibling;
			
			while (cur) {
				if(cur.nodeType == 1) 
					matched.push( cur );
				
				cur = cur.previousSibling;
				
			}
			return matched;
		},
		nextSiblings : function(elem) {
			var matched = [],
			cur = elem.nextSibling;
			
			while (cur) {
				if(cur.nodeType == 1) 
					matched.push( cur );
				
				cur = cur.nextSibling;
				
			}
			return matched;
		},
		/**
		 * 获取elem之后的同级相同元素
		 * @method getSameTags
		 * @param {nodeObject} DOM元素
		 * @return {Array} 返回elem之后的同级相同元素集合
		 */
		getSameTags:function(elem, name) {
			var matched = [];
			cur = elem;
			var i=0;
			while (cur) {
				if(cur.nodeType == 1 && cur.nodeName.toLowerCase() == name) {
					i++;
					matched.push( cur );
				}
				cur = cur.nextSibling;				
			}
			return matched;
		},
		/**
		 * 递归获取元素n的上级节点，直到document结束，
		 * 同时记录上级节点的id、className、以及在同级元素下的索引
		 * @method getParentNode
		 * @param {Object} DOM元素
		 * @return {Array} 元素n的上级节点集合
		 */
		getParentNode:function(n,topNode){		
			if(n.nodeName.toLowerCase() !== 'body'){//#document
				if(topNode) {
					if(n === topNode) return;
				}
				var node = n.nodeName.toLowerCase();
				//node = (n.id)?(node + '@'+n.id):node + '@';
				node=node +"@";
				node = (n.className && !(/\d{3,}/.test(n.className)))?(node + '@'+n.className):node + '@';
				
				if(n.parentNode.nodeName.toLowerCase() === 'body'){
					node +='@'+(this.siblings(n).length-4);
				}else{
					node +='@'+this.siblings(n).length;
				}
				node +='@'+this.preSiblings(n).length;//获取当前节点同级索引
				
				this.parentNodes.unshift(node);
				this.getParentNode(n.parentNode,topNode);
			}else{
				return this.parentNodes;
			}
		},
		/**
		 * 根据特殊的元素路径，获取页面元素。
		 * @name Tools.getNodeByBFDPath
		 * @memberOf BCore.tools
		 * @function getNodeByBFDPath
		 * @param {string} elem path
		 * @author tenglong.jiang on 2012-3-14
		 * @example
		 * //引入tools类
		 * var Tools = BCore.tools.Tools;
		 * Tools.getNodeByBFDPath('html@@@0@0/body@@@2@0/div@@block@0@0/div@@flowBox@3@0')
		 */
		getElByBFDPath : function (s,topNode) {
			if(s == "" || typeof s!="string") return null;
			if(s.charAt(s.length-1) === ',') {
				s = s.substring(0,s.length-1);
			}
			var arr = s.split(",");
			var el;
			for(var i=1; i<arr.length; i++) {		
				//if((i+1) < arr.length) {
					if(i == 1) {
						if(topNode) {
							el = topNode;
						} else {
							el = document.getElementsByTagName("body")[0];
						}
					}
					el = function(parent, node) {
						if(!parent) return;
						narr = node.split("@");
						var nodes = Wit.getSameTags(parent.firstChild, narr[0]);
						if(Wit.validateNode(nodes[narr[4]], narr)) {
							return nodes[narr[4]];
						} else {
							return Wit.serchNode(nodes, narr[4], narr);
						}
					}(el, arr[i]);
				//}
			}
			return el;
		},
		validateNode:function(node, nodeAttrs){
			if(!node) return false;
			//if(nodeAttrs[1] != "") {
			//	if(node.id != nodeAttrs[1]) return false;
			//}
			if(nodeAttrs[2] != "" && !(/\d{3,}/.test(nodeAttrs[2]))) {
				if(node.className != nodeAttrs[2]) return false;
			}
			return true;
		},
		serchNode:function(nodes, index, nodeAttrs) {
			var length = nodes.length;
			index = parseInt(index);
			if(index == 0) {
				for(var i=0; i<length; i++) {
					if(this.validateNode(nodes[index+i], nodeAttrs)) {
						return nodes[index+i];
					} 
				}
			}
			if(index > 0 && length > index) {
				if(this.validateNode(nodes[index-1], nodeAttrs)) {
					return nodes[index-1];
				}
				if(this.validateNode(nodes[index+1], nodeAttrs)) {
					return nodes[index+1];
				}
				if(index-2 >= 0) {
					if(this.validateNode(nodes[index-2], nodeAttrs)) {
						return nodes[index-2];
					}
				}
				if(index+2 < length) {
					if(this.validateNode(nodes[index+2], nodeAttrs)) {
						return nodes[index+2];
					}
				}
			}
			if(index == length) {
				for(var i=length-1; i>=0; i--) {
					if(this.validateNode(nodes[i], nodeAttrs)) {
						return nodes[i];
					} 
				}
			}
			return;
		},
		/**
		 * 执行函数绑定作用域
		 * @method bind
		 * @param {Function} 执行函数
		 * @param {Object} 作用域对象
		 */
		bind : function(fn, context) {
			return function() {
				return fn.apply(context, arguments);
			}
		},
		/**
		 * 取消超链接默认事件，屏蔽超链接
		 * @method hrefHandler
		 * @param {Object} DOM元素
		 */
		hrefHandler : function(e) {
			var x =e.target || e.srcElement; // get the link tha  
			 if(x.nodeName.toLowerCase() === 'a'){
				 e.preventDefault();  
			 }  
		},		
		/**
		 * 过滤字符串，去html标签、换行、空格
		 * @method filterName
		 * @param {String} 过滤之前的字符串
		 * @return {String} 过滤之后的字符串
		 */
		filterName:function(str){
			return this.trim(str);
		},
		/**
		 * 过滤字符串，去html标签、换行、两边空格
		 * @method trim
		 * @param {String} 过滤之前的字符串
		 * @return {String} 过滤之后的字符串
		 */
		trim:function(str){
			str = str.replace(/<(S*?)[^>]*>.*?|<.*?\/>/igm,"");
			str = str.replace(/[\r|\n]*/igm,'');
			str = str.replace(/(&nbsp;)*/igm,'');
			str = str.replace(/(^\s*)|(\s*$)/igm,'');
			return str;
		},
		/**
		 * 字符串转换成数值
		 * @method toNumber
		 * @param {String} 需要转化的字符串
		 * @return {Float} 
		 */
		toNumber:function (str){
			str = str.toString();
			str = this.trim(str);
			str = str.replace(/[^\d\.]/gi,'');
			return parseFloat(str);
		},
		/**
		 * 取cookie
		 * @method getCookie
		 * @param {String} cookie名
		 * @return {String} cookie值
		 */
		getCookie : function(name){
			var strCookie=document.cookie;
			var arrCookie=strCookie.split("; "); 
			var stepid; 
			//遍历cookie数组
			for(var i=0;i<arrCookie.length;i++){ 
				var arr=arrCookie[i].split("=");
				if(name==arr[0]){ 
					stepid=arr[1]; 
					break; 
				}
			} 
			return stepid;
		},
		/**
		 * 设置cookie
		 * @method setCookie
		 * @param {String} cookie名
		 * @param {String} cookie值
		 */
		setCookie : function(name, value) {
			//document.cookie = name+"="+value+";"; 
			var now = new Date();
			now.setTime(now.getTime() + 365 * 24 * 60 * 60 * 1000);
			document.cookie = name+"="+value+";path=/;domain="+this.getRootDomain(this.getDomain())+";expire="+now; 
		},
		/**
		 * 删除cookie
		 * @method removeCookie
		 * @param {String} cookie名
		 * @param {String} cookie值
		 */
		removeCookie : function(name) {
			var date=new Date();
			date.setTime(date.getTime()-1);
			document.cookie = name+"='';expire="+date.toGMTString()+";path=/;domain="+this.getRootDomain(this.getDomain())+";";
			
		},
		/**
		 * 获取当前页面域名地址
		 * @method getDomain
		 * @return {String} URL地址
		 */
		getDomain:function (){
			var _url = window.location.href;
			//去掉http://
			_url = _url.replace(/^(http|ftp|https|ssh):\/\//ig,"");
			
			_url = _url.split("/")[0];
			//去掉端口号
			_url = _url.replace(/\:\d+$/ig,"");
			
			return _url;
		},
		/**
		 * 获取当前页面主域
		 * @method getRootDomain
		 * @param {String} URL地址
		 * @return {String} URL地址
		 */
		getRootDomain:function (str){
			//去掉结尾的/
			str = str.replace(/\/$/ig,"");
			//去掉http://
			str = str.replace(/^(http|ftp|https|ssh):\/\//ig,"");
			//替换掉域名结尾
			str = str.replace(/(.com|.info|.net|.org|.me|.mobi|.us|.biz|.xxx|.ca|.mx|.tv|.ws|.com.ag|.net.ag|.org.ag|.ag|.am|.asia|.at|.be|.com.br|.net.br|.com.bz|.net.bz|.bz|.cc|.com.co|.net.co|.com.co|.co|.de|.com.es|.nom.es|.org.es|.es|.eu|.fm|.fr|.gs|.co.in|.firm.in|.gen.in|.ind.in|.net.in|.org.in|.in|.it|.jobs|.jp|.ms|.com.mx|.nl|.nu|.co.nz|.net.nz|.org.nz|.se|.tc|.tk|.com.tw|.idv.tw|.org.tw|.tw|.co.uk|.me.uk|.org.uk|.vg|.com.cn|.gov|.gov.cn|.cn)$/ig,"%divide%$1");
			
			var tail = str.split("%divide%")[1];
			if(typeof(tail)==="undefined")tail="";
			str = str.split("%divide%")[0];
			
			var strarr = str.split(".");
			
			return "."+strarr[strarr.length-1]+tail;
		},
		/**
		 * 新节点插入指定节点之后
		 * @method insertAfter
		 * @param {Object} 新节点
		 * @param {Object} 目标节点
		 */
		insertAfter:function(newElement, targetElement){
			var parent = targetElement.parentNode;
			if (parent.lastChild == targetElement){
				parent.appendChild(newElement);
			}
			else {
				parent.insertBefore(newElement, targetElement.nextSibling);
			}
		},
		/**
		 * 向页面追加样式文件
		 * @method appendCss
		 * @param {String} 样式文件路径
		 */
		appendCss : function(url) {
			var link = document.createElement( 'link' );
			link.setAttribute( 'href', url );
			link.setAttribute( 'charset', "utf-8" );
			link.setAttribute( 'rel', "stylesheet" );
			link.setAttribute( 'type', "text/css" );
			document.getElementsByTagName('head')[0].appendChild(link);
		},
		/**
		 * 根据样式名查找元素
		 * @method getChildByClass
		 * @param {DOM} target 要查找的DOM标签
		 * @param {String} name 标签Class属性名·
		 * @return 返回匹配元素数组
		*/
		getChildByClass:function(target, value){
			var result = new Array();
			for (var i = 0; i < target.childNodes.length; i++) {
				var myelement = target.childNodes.item(i);
				//如果该节点有属性
				if (myelement.nodeType == 1) {//1为dom
					var re=new RegExp('(^|\\s)'+value+'(\\s|$)', 'i');
					if(re.test(myelement.className)) {
						result.push(myelement);
					}
				}				
				//如果有子节点 则查询子节点
				if(myelement.hasChildNodes()) {
					var tmp = this.getChildByClass(myelement,value);
					if (tmp.length != 0) {
						result = result.concat(tmp);
					}
				}
			}			
			return result;
		},	
		createElement : function(tagName,attributes){
			var element = document.createElement(tagName); 
			if(attributes){ 
				for(var name in attributes){ 
					if (attributes.hasOwnProperty(name)) {
						if(name === "class" || name === "className"){
							element.className = attributes[name];
						}else if(name === "style"){
							element.style.cssText = attributes[name];	
						}else{
							element.setAttribute(name,attributes[name]);	
						}
					}	
				}
			}
			return element;
		},
		loadScript:function (url,callback) {
			var _this = this;
			setTimeout(function () {
				var script = _this.createElement("script", {
						"src" : url,
						"type" : 'text/javascript',
						"charset":"utf-8"
					});
				if (script.readyState) {
					_this.addEvent(script, "readystatechange", function () {
						if (script.readyState === "loaded" || script.readyState === "complete") {
							if (callback) {
								callback();
							}
							_this.delEvent(script, "readystatechange", arguments.callee);
						}
					});
				} else {
					_this.addEvent(script, "load", function () {
						if (callback) {
							callback();
						}
						_this.delEvent(script, "load", arguments.callee)
					});
				}
				document.getElementsByTagName("head")[0].appendChild(script);
			}, 0);
		},
		/**
		 * el节点是否是root节点的后代
		 */
		contains : function(root, el) {
			if (root.compareDocumentPosition)  
				return root === el || !!(root.compareDocumentPosition(el) & 16);  
			if (root.contains && el.nodeType === 1){  
				return root.contains(el) && root !== el;  
			}  
			while ((el = el.parentNode))  
				if (el === root) return true;  
			return false;  
		},
		/**
		 * 返回指定格式的URL
		 */
		filterUrl:function(url,pattern){
			var result='';
			//获取主路径
			if(pattern.match(/^M(\?.*)?$/ig)){
				var urlarr = url.split("?");
				result+=urlarr[0];
				url = urlarr.length>1?urlarr[1]:"";
				pattern = pattern.replace(/^M\?*/ig,"");
			}
			
			//获取get参数
			var getrst = [];
			if(url!==''){
				var getarr = url.split("&");
				var parmlist = pattern.split("&");
				var testobj = {};
				for(var i=0;i<parmlist.length;i++){
					testobj[parmlist[i]] = true;
				}
				for(var i=0;i<getarr.length;i++){
					if(testobj[getarr[i].split("=")[0]]){
						getrst.push(getarr[i]);
					}
				}
				
			}
			return result+(getrst.length>0?("?"+getrst.join("&")):'');
		},
		/**
		 * 数组去重方法
		 */
		unique : function(arr){
			if(!(typeof arr && arr.constructor === Array)) {
				return arr;
			}
			var n = {},r=[]; 
			for(var i = 0; i < arr.length; i++) {
				if (!n[arr[i]]) {
					n[arr[i]] = true; 
					r.push(arr[i]);
				}
			}
			return r;
		},
		/**
		 * 加载样式内容
		 */
		loadCss:function(cssString, id) {
			var doc = document;
			var style = doc.createElement("style");
			style.setAttribute("type", "text/css");
			//style.setAttribute("id", id);			
			if (style.styleSheet) { // IE
				style.styleSheet.cssText = cssString;
			} else { // w3c
				var cssText = doc.createTextNode(cssString);
				style.appendChild(cssText);
			}			
			var heads = doc.getElementsByTagName("head");
			if (heads.length)
				heads[0].appendChild(style);
			else
				doc.documentElement.appendChild(style);
			return;
		},
		/*
		 * 注册浏览器的DOMContentLoaded事件
		 * @param { Function } onready [必填]在DOMContentLoaded事件触发时需要执行的函数
		 * @param { Object } config [可选]配置项
		 */
		onReady:function(callback, config) {
			//设置是否在FF下使用DOMContentLoaded（在FF2下的特定场景有Bug）
			this.conf = {
				enableMozDOMReady : true
			};
			if (config)
				for (var p in config)
					this.conf[p] = config[p];

			var isReady = false;
			function doReady() {
				if (isReady)
					return;
				//确保onready只执行一次
				isReady = true;
				callback();
			}
			/*IE*/
			if (Wit.isIE) {
				Wit.addEvent(document, "readystatechange", function () {
					if(document.readyState === 'interactive' || document.readyState === 'complete') {						
						Wit.delEvent(document, "readystatechange", arguments.callee);		
						doReady();
						return;
					}
				});
				window.attachEvent('onload', doReady);
			}
			/*FF Opera 高版webkit 其他*/
			else {
				if (!Wit.isGecko || this.conf.enableMozDOMReady)
					document.addEventListener("DOMContentLoaded", function () {
						document.removeEventListener("DOMContentLoaded", arguments.callee, false);
						doReady();
					}, false);
				window.addEventListener('load', doReady, false);
			}
		}
	});
})();