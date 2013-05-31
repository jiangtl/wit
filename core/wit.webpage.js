/*!
 * Wit JS Library 1.2
 * Copyright(c) 2013 baifendian Inc.
 * http://www.baifendian.com/wit
 * author:Jack FED
 * tenglong.jiang@baifendian.com
 */

/**
 * @class Wit.Webpage
 * Wit.Webpage 处理页面指纹的通用函数，根据页面源码结构，生成经过一系列处理的字符串，用来标记页面指纹。
 * @singleton
 */
Wit.Webpage = function(){
	var me = this, e = me.events;
    me.events = e || {};
};

Wit.Webpage.prototype = {
	id : 1,//递增id
	maxLength : 600,//指纹上限
	url : window.location.href,//当前页面链接地址
	aTree:[],//a标签记录集
	domTree : [],	
	/**
     * 获取上级节点名称,直到body结束
	 * @param {Object} dom节点元素
     * @return {Array}
     */
	getNodePath : function(node) {
		var arr = [];
		while(node != null && node.nodeName != "BODY") {
			var nodeInfo = node.nodeName.toLowerCase();
			if(node.className && node.className != "") {
				nodeInfo += "@"+node.className;
			}
			arr.unshift(nodeInfo);
			node = node.parentNode;
		}
		return arr.join();
	},	
	/**
     * 获得元素节点值
	 * @param {Object} dom节点元素
     * @return {Array}
     */
	getNodeValue : function(node) {
		var type = node.nodeType;
		var value = node.nodeValue;					
		var nodeName = node.nodeName.toLowerCase();
		if(type == 1) {
			switch(nodeName) {
				case 'a' : value = node.href; break;
				case 'img' : value = node.src; break;
				case 'script' : value = !!node.src ?  node.src : ""; break;
				case 'style' : value = !!node.src ?  node.src : ""; break;
				case 'input' :
					switch(node.type) {
						case 'image' : value = node.src; break;
						default:value = node.value;				
					}
					break;
				default : value = node.innerHTML.replace(/^\s+|\s+$/g,'');
			}			
		} else if(type == 3) {
			value = value.replace(/^\s+|\s+$/g,'');
			try{
				value = decodeURIComponent(value);
				value = value.replace(/(%C2%A0)/g,"");
				value = decodeURIComponent(value);
			} catch(e) {
			}
		} else {
			value = "";
		}	
		return value;
	},
	/**
     * 获得元素在DOM树中的索引
	 * @param {Object} dom节点元素
     * @return {Array}
     */
	getNodePathIndex : function(node) {
		for(var i=0, len=this.domTree.length; i<len; i++) {
			if(node.nodeType === 3) {
				node = node.parentNode;
			}
			if(this.domTree[i].el === node) {
				return i;
			}		
		}
		return 0;
	},
	/**
     * 遍历DOM节点，获得相关信息，包括路径、值、叶子节点元素
	 * @param {Object} dom节点元素
     * @return {Array} 
     */
	getDomTree : function(node,filter) {
		var me = Wit.Webpage.prototype;
		var array = []
		if(arguments.length > 2 && arguments[2] instanceof Array) {
			array = arguments[2]
		}
		if(node.nodeType != 1) {			
			return array;
		}
		//遍历孩子节点
		if(node.childNodes.length > 0) {
			for(var i=0; i<node.childNodes.length; i++) {
				var n = node.childNodes[i];
				if(n.nodeType == 3) {
					var path = "";
					var value =  me.getNodeValue(n);
					if(value != "")	{
						++me.id;
						path = me.getNodePath(n);
						array.push({
							path : path,
							value : value,
							el : node
						});						
					}
					if(node.nodeName === "A") {
						me.aTree.push({path : path});//记录A标签
					}
					continue;
				}
				//过滤指定节点
				if(filter instanceof Array) {
					var flag = 0;
					for(var j=0; j<filter.length; j++) {
						fNode = filter[j];
						if(fNode.name.indexOf(n.nodeName) != -1 && 
							n[fNode.attr] == fNode.value) {
								flag = 1;
								break;
						}
					}
					if(flag) {
						continue;
					}
				}
				//报警，指纹过大。
				if(me.id>me.maxLength) {return array;}
				arguments.callee(n, filter, array);				
			}			
		} else {//如果是业主节点，取值。
			++me.id;
			var value = me.getNodeValue(node);
			array.push({
				path : me.getNodePath(node),
				value : value,
				el : node
			});
		}
		return array;
	},
	/**
     * 创建DOM树叶子节点路径集合
     * @return {Array}
     */
	createDomTreePath : function(filter) {
		var me = Wit.Webpage.prototype,
			body = document.getElementsByTagName("body")[0];
		me.domTree = [];
		me.aTree = [];
		me.id = 0;//重新清空指纹计数器
		me.domTree = me.getDomTree(body,filter);
		return me.domTree;
	},
	/**
     * 格式化DOM树路径，去掉叶子节点值，可加密。
	 * @param {Array} DOM树路径
	 * @param {String} 加密标志
     * @return {Array}
     */
	formatDomTreePath : function(tree, sign) {
		var arr = new Array() ;//tree.slice(0);//克隆一个新数组		
		for(var i=0; i<tree.length; i++) {
			var path = tree[i].path.replace(/:+[\s\S]*/gi,"");
			if(sign && sign == "md5") {
				arr.push(Wit.Encrypt.hex_md5(path).substring(0,11));	
			} else if(sign && sign == "md6") {
				arr.push(this.hashCode(path));
			} else {
				arr.push(path);	
			}	
		}
		return arr;
	},
	/**
     * 格式化DOM树路径，去重，去掉叶子节点值，可加密。
	 * @param {Array} DOM树路径
	 * @param {String} 加密标志
     * @return {Array}
     */
	formatUniqueDomTreePath : function(tree, sign) {
		var arr = new Array() ;//tree.slice(0);//克隆一个新数组	
		var obj = {}; 
		for(var i = 0; i < tree.length; i++) {
			if (!obj[tree[i].path]) {
				obj[tree[i].path] = true;
				var path = tree[i].path.replace(/:+[\s\S]*/gi,"");
				if(sign && sign == "md5") {
					arr.push(Wit.Encrypt.hex_md5(path).substring(0,11));	
				} else if(sign && sign == "md6") {
					arr.push(this.hashCode(path));
				} else {
					arr.push(path);	
				}
			}
		}
		return arr;
	},
	/**
	 * LCS算法，文本比较
	 * @param {String} 文本
	 * @param {String} 文本
	 * @return {Array}
	 */
	cala : function(s1Array,s2Array) {
		var dirs=new Array();//公共子集合
		var s1length=s1Array.length,
			s2length=s2Array.length;
		//初始化数组
		for(var i=0;i<=s1length;i++) {//纵向
			dirs[i]=new Array();
			dirs[i][0]='';//J==0
		}
		for(var j=0;j<=s2length;j++) {//纵向
			dirs[0][j]='';//i==0
		}
		for(var i=1,di,di1,s1i1,dij1,di1j1;i<=s1length;i++) {//纵向    
			di=dirs[i];//di,di1放在外面是为了里面的循环可以避免索引
			di1=dirs[i-1];
			s1i1=s1Array[i-1];		
			dij1 = '';
			di1j1 = '';
			for(var j=1;j<=s2length;j++) {//横向
				//里面去掉  56左右
				if(s1i1==s2Array[j-1]) {//比较字符，如果相等，则对应矩阵的值+1			  23毫秒   
					di[j]=di1j1+s1i1+",";				//11毫秒
				}
				else{
					di[j] = di1[j].length>dij1.length?di1[j]:dij1;
				}
				di1j1 = di1[j];
				dij1 = di[j];
			}
		}
		return ['',dirs];
	},
	/**
	 * 余弦夹角计算
	 * @param {Array} 字符数组
	 * @param {Array} 字符数组
	 * @return {Number}
	 */
	cosineCompare : function(_arr1,_arr2) {
		if(!_arr1 || !_arr2) return 0;
		var _arr = _arr1.concat(_arr2);
		var _uniq_arr = Wit.unique(_arr);
		var _squre1 = 0;
		var _squre2 = 0;
		var _multi = 0;
		var arrstr1 = _arr1.join(",");
		var arrstr2 = _arr2.join(",");
		for(var i = 0,_len = _uniq_arr.length ; i < _len; i++){
			var _len1 = _len2 = 0;
			if(arrstr1.match(_uniq_arr[i])){
				_len1 = arrstr1.match(_uniq_arr[i]).length;
				_squre1 += _len1*_len1;
			}
			if(arrstr2.match(_uniq_arr[i])){
				_len2 = arrstr2.match(_uniq_arr[i]).length;
				_squre2 += _len2*_len2;
			}
			_multi += _len1*_len2;
		}
		var result = _multi*10000/(Math.sqrt(_squre1)*Math.sqrt(_squre2));
		return parseInt(result)/100;
	},
	/**
	 * 生成文本比较函数
	 * @param {String} 源文本
	 * @return {Function}
	 */
	createComparisonFunction : function(source) {
		return function (current) {
			
			var s1length=source.length,
				s2length=current.length;
			var dirs=new Array(s1length);//公共子集合
			//初始化数组
			for(var i=0;i<=s1length;i++) {//纵向
				dirs[i]=new Array();;
				dirs[i][0]='';//J==0
			}
			for(var j=0;j<=s2length;j++) {//纵向
				dirs[0][j]='';//i==0
			}
			for(var i=1,di,di1,s1i1,dij1,di1j1;i<=s1length;i++) {//纵向    
				di=dirs[i];//di,di1放在外面是为了里面的循环可以避免索引
				di1=dirs[i-1];
				s1i1=source[i-1];		
				dij1 = '';
				di1j1 = '';
				for(var j=1;j<=s2length;j++) {//横向
					//里面去掉  56左右
					if(s1i1==current[j-1]) {//比较字符，如果相等，则对应矩阵的值+1
						di[j]=di1j1+s1i1+",";				//11毫秒
					}
					else{
						di[j] = di1[j].length>dij1.length?di1[j]:dij1;
					}
					di1j1 = di1[j];
					dij1 = di[j];
				}
			}
			return ['',dirs];
		}
	},
	/**
     * 生成带有标记的文本对象
	 * @param {String} 最大公共子串
	 * @param {String} 原始字符
     * @return {Array}
     */
	createNewUnitePath : function(/**最大公共子串*/str1,/**原始字符*/s2Array){
		var k = 0,
			i = 0,
			s2Length = s2Array.length;
		var obj = new Object;
		var s1Array = str1.split(",");
		while(i < s2Length){
			if(s1Array[k]==s2Array[i]){				
				obj[i] = {"path":s2Array[i],"eq":"yes"};
				k++;
			}else{
				obj[i] = {"path":s2Array[i],"eq":"no"};
			}
			i++;
		}
		return obj;
	},
	/**
     * 根据参考标记，返回在公共字串中的索引
	 * @param {Object} 公共子串对象
	 * @param {String} 参考索引
     * @return {Int}
     */
	getSubIndex : function(obj, index) {
		var newIndex = 0, index = parseInt(index);
		while(obj[index] && obj[index].eq==="no") {
			index += 1;
		}
		for(var i=index; i>=0; i--) {
			if(obj[i] && obj[i].eq==="no") {
				newIndex++;
			}
		}
		return index - newIndex;
	},
	/**
     * 根据在公共字串中的索引，返回实际索引
	 * @param {Object} 实际子串对象
	 * @param {String} 公共字串中的索引
     * @return {Int}
     */
	getAddIndex : function(obj, index, length) {		
		var index = parseInt(index);
		var k = 0;
		var i=0;
		while(k <= index && i<length) {
			if(obj[i] && obj[i].eq==="yes") {
				k+=1;
			}
			i++;
		}
		return i-1;
	},
	/**
     * 根据索引在DOM树中取值
	 * @param {Int} 索引
     * @return {String}
     */
	getTreePathValue : function(index,currPath) {		
		var me = Wit.Webpage.prototype;
		var path = me.domTree[index].path;//me.domTreePath[index];
		var sign = "md5";
		if(arguments.length > 2) {
			if(arguments[2] == "md6") {
				sign = "md6";
			}
		}
		var md5 = this.formatDomTreePath([me.domTree[index]],sign);
		var value = "";
		if(md5 == currPath)
			value =  me.domTree[index].value;
		return value;
	},
	getTreePathNode : function(index,currPath) {
		var me = Wit.Webpage.prototype;
		var sign = "md5";
		if(arguments.length > 2) {
			if(arguments[2] == "md6") {
				sign = "md6";
			}
		}
		var md5 = this.formatDomTreePath([me.domTree[index]],sign);
		var el = {innerHTML:'',href:''};
		if(md5 == currPath)
			el =  me.domTree[index].el;
		return el;
	},
	/**
     * 相似度计算，百分制
	 * @param {Int} 公共字串长度
	 * @param {Int} 串1长度
	 * @param {Int} 串2长度
     * @return {Int}
     */
	getPageSimilarResult : function(G,P1,P2) {
		return G/((P1+P2)/2)*100;
	},
	/**
     * 节点在DOM数中的索引
	 * @param {Node} 节点
     * @return {Int}
     */
	findDomTreeIndex : function(node) {
		var me = Wit.Webpage.prototype;
		if(me.domTree.length == 0) {
			me.createDomTreePath();
		}
		return me.getNodePathIndex(node);
	},
	encode : function(array) {
		var tempIndex = [],temp = Wit.unique(array);
		for (var i = 0, _len = array.length; i < _len; i++) {
			tempIndex.push(this.search(temp,array[i]));
		}
		return temp+"|"+tempIndex;
	},
	decode : function (string) {
		var arr = string.split("|");
		var temp = arr[0].split(",");
		var array = arr[1].split(",");
		var tempIndex = [];
		for (var i = 0, _len = array.length; i < _len; i++) {
			tempIndex.push(temp[array[i]]);
		}
		return tempIndex;
	},
	search : function (data,key) {
		re = new RegExp(key,[""])
		return (data.toString().replace(re,"#").replace(/[^,#]/g,"")).indexOf("#")
	},
	/**
     * 获得两个节点的相同父级节点
	 * @param {String} 路径
     * @return {Int}
     */
	getSplitNode : function(node1, node2) {
		var parent1 = node1.parentNode;
		var parent2 = node2.parentNode;
		var arrParent1 = [], arrParent2 = [];
		var i=0;
		while(parent1 && parent1.nodeName.toLowerCase() != "body") {					
			arrParent1.unshift(parent1);
			parent1 = parent1.parentNode;	
		}
		while(parent2 && parent2.nodeName.toLowerCase() != "body") {
			arrParent2.unshift(parent2);
			parent2 = parent2.parentNode;
		}
		for(;i<arrParent1.length&&i<arrParent2.length;i++) {
			if(arrParent1[i] !== arrParent2[i]) {
				break;
			}	
		}
		return {node:arrParent1[i-1],index:arrParent2.length - i};
	},
	/**
     * 获取元素的第一个子节点
     */
	getFirstNode : function(node) {
		if(node.hasChildNodes()) {
			var n = node.firstChild;
			while(n) {
				if(n.nodeType == 1) {
					if(!n.hasChildNodes()) {
						var value = Wit.Webpage.prototype.getNodeValue(n);
						if(value && value != "") {
							return n;
						}
					}
					break;					
				}
				n = n.nextSibling;		
			}
			if(n)
				return arguments.callee(n);
			else
				return node;
		}
		 else {
			return node;
		}		
	},
	showTag : 0,
	/**
     * 显示隐藏标签
     */
	showHideTag : function(el){
		var obody = document.getElementsByTagName('body')[0];
		if(this.showTag==0) {
			this.setHideTag(obody,"show");
			this.showTag=1;
		} else {
			this.showTag=0;
			this.setHideTag(obody,"hide");
		}
	},
	setHideTag : function(el,flag){
		var childs = el.childNodes;
		for(var i=0; i<childs.length; i++) {
			var currEl = childs[i];
			if(currEl.nodeType === 1) {
				if(flag == "show") {
					if(currEl.style.display == "none") {
						currEl.style.display = "";
						currEl.hidetag="1";
						currEl.style.border = "1px #000000 dotted";
						currEl.style.title = "隐藏标签"
					}
					if(currEl.nodeName.toLowerCase() == 'input') {
						switch(currEl.type) {
						case 'hidden':
							currEl.type="text";
							currEl.hidetag="1";
							currEl.style.backgroundColor = "#ccc";
							currEl.style.border = "1px #000000 dotted";
							currEl.style.title = "隐藏标签"
							break;			
						}
					}									
				} else if(flag == "hide" && currEl.hidetag=="1") {
					if(currEl.style.display != "none") {
						currEl.style.display = "none";
					}
					if(currEl.nodeName.toLowerCase() == 'input') {
						switch(currEl.type) {
						case 'text':
							currEl.type="hidden";
							break;			
						}						
					}				
				}
				if(currEl.hasChildNodes()) {
					arguments.callee(currEl,flag);
				}
			}
		}
	},
	/** 
	* java String hashCode 的实现 
	* @param strKey 
	* @return intValue 
	*/  
	hashCode : function(strKey) {  
		var hash = 0;  
		if(!Wit.isEmpty(strKey)) {
			for (var i = 0; i < strKey.length; i++) {
				hash = hash * 31 + strKey.charCodeAt(i);  
				hash = this.intValue(hash);  
			}  
		}  
		return hash;  
	},
	/** 
	* 将js页面的number类型转换为java的int类型 
	* @param num 
	* @return intValue 
	*/  
	intValue : function(num) {  
		var MAX_VALUE = 0x7fffffff;  
		var MIN_VALUE = -0x80000000;  
		if(num > MAX_VALUE || num < MIN_VALUE) {  
			return num &= 0xFFFFFFFF;  
		}  
		return num;  
	}  
}