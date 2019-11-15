var URL = 'http://api.lvshitang.cn/api/',
	BaseUrl = 'http://lvshitang.cn',
	AppName = '律师堂',
	isupdate = false,
	CaCheNum = 30;
var key = CryptoJS.enc.Utf8.parse("SlAgEAAoIBAQCYRO"),
	iv = CryptoJS.enc.Utf8.parse("NuFQIXN9LTiAglHN");
(function($, app) {
	app.PostData = function(oldData) {
		//app.deviceId(function(uuid) {
		var _uuid = app.deviceId();
		var _uid = app.isLogin() ? app.getuserinfo().uid : '0';
		var post = {};
		var _time = Date.parse(new Date());
		post.uid = _uid;
		post.deviceid = _uuid;

		post.time = _time; //new Date().toLocaleDateString();
		// if (app.isJsonFormat(oldData)) {
		// 	post.data = JSON.stringify(oldData || {});
		// } else {
		// 	post.data = oldData;
		// }			
		var newpost = $.extend({}, post, oldData);
		var newpost_str = JSON.stringify(newpost);
		//console.log(newpost_str);
		newpost_str = getAesString(newpost_str); //getAES(newpost_str);
		var result = {}
		result.sign = CryptoJS.SHA1("{\"data\":\"" + newpost_str + "\"}&$" + _uuid + "&$" + _uid + "&$" + _time).toString(
			CryptoJS.enc.Hex).toUpperCase(); //hex_sha1("{\"data\":\"" + newpost_str + "\"}&$" + uuid + "&$"+_uid+"&$" + _time).toUpperCase();
		result.data = newpost_str;
		return result;
		//});
	};
	// app.isJsonFormat = function(str) {
	// 	var obj = str;
	// 	var xy = Object.prototype.toString.call(obj);
	// 	if (xy == "[object Object]" || xy == "[object Array]") {
	// 		return true;
	// 	} else {
	// 		return false;
	// 	}
	// };
	app.RemoveItem = function(key) {
		plus.storage.removeItem(key);
	};
	app.getajax = function(path, callback, dataitem, mask, modth, cache) {
		//console.log(JSON.stringify(dataitem) + "/" + URL + path);
		//console.log("请求参数：" + JSON.stringify(app.PostData(dataitem)))
		cache = cache || {};
		if (cache.key) {
			//console.log("缓存开启");
			var cachedata = plus.storage.getItem(path + cache.key);
			if (cachedata != null && cachedata != 'null' && cachedata) {
				var cachejson = JSON.parse(cachedata);
				if (app.TimeDifference(new Date(cachejson.time), new Date()) < cache.num) {
					if (mask) {
						mask.close();
					}
					//console.log("用的缓存数据");
					return callback(cachejson.data);
				}
			}
		}
		var newpost = app.PostData(dataitem);
		//console.log(newpost.data+"/"+path);
		// console.log(newpost.sign);
		// console.log(encodeURIComponent(newpost.data));
		mui.ajax(URL + path, {
			headers: {
				'sign': newpost.sign
			},
			data: {
				data: encodeURIComponent(newpost.data)
			}, //app.PostData(dataitem),
			dataType: 'json',
			type: modth || 'post',
			timeout: 10000,
			success: function(data) {
				//console.log(JSON.stringify(app.PostData(dataitem)))
				//console.log(JSON.stringify(data));
				if (mask) {
					mask.close();
				}
				// 1101 : 您还未登陆,请先登陆!!!
				// 		1102 : 登录过期了,请重新登录！
				if (data.code == 1102) {
					mui.toast("登录过期了,请重新登录！");
					app.logout();
					app.openVW("login.html");
					setTimeout(function() {
						YiRu.closeAllwebview("login.html");
					}, 300);
					return;
				}
				if (data.code == 1000 || data.code == 1001) {
					if (cache.key) {
						plus.storage.setItem(path + cache.key, JSON.stringify({
							data: data,
							time: new Date()
						}));
					}
					return callback(data);
				} else {
					if (data.code == 1007 || data.code == 1011 || data.code == 1006) { //无数据
						return callback(data);
					}
					console.log(JSON.stringify(data));
					mui.toast(data.message);
					return;
				}
			},
			error: function(xhr, type, errorThrown) {
				//alert(xhr.responseText);
				//console.log(xhr.responseText + "/" + path);
				reloadWvLoad();
				if (mask) {
					mask.close();
				}
			}
		});
	};
	app.getupfile = function(filename, callback, dataitem, mask) {
		var newpost = app.PostData(dataitem);
		var task = plus.uploader.createUpload(URL + "common/upFiles", {
				method: "POST"
			},
			function(t, status) {
				if (mask) {
					mask.close();
				}
				// 上传完成
				if (status == 200) {
					var fh = JSON.parse(t.responseText);
					//上传成功					
					console.log(JSON.stringify(fh));
					if (fh.code == 1000) {
						callback(fh);
					} else {
						mui.toast(fh.message);
					}
				} else {
					console.log(JSON.stringify(t));
					console.log(status);
					mui.toast("上传失败，请重试");
				}
			}
		);

		var fff = filename.substring(filename.lastIndexOf("/") + 1, filename.length);
		//console.log(fff.split('.')[0]);
		task.addFile(filename, {
			key: 'file'
		});
		task.setRequestHeader('sign', newpost.sign);
		task.addData("data", encodeURIComponent(newpost.data));
		task.start();
	};
	app.WaitingStyle = function(s) {
		var _s = {
			color: "#ffffff",
			size: "14px",
			padding: "20px",
			background: "rgba(37,151,218,1)",
			loading: {
				type: "snow"
				// 	icon: "/img/touxiang.png",
				// 	height: "60px"
			}
		};
		if (s) _s.push(s);
		return _s;
	};
	// 获取用户头像
	app.getajax_nomark = function(path, callback, dataitem, modth) {
		mui.ajax(URL + path, {
			data: app.PostData(dataitem),
			dataType: 'json',
			type: modth || 'post',
			timeout: 10000,
			success: function(data) {
				//console.log(JSON.stringify(data)+"/"+dataitem);
				if (data.code == 200) {
					return callback(data);
				}
			},
			error: function(xhr, type, errorThrown) {
				//alert(xhr.responseText);
				//console.log(xhr.responseText + "/"+path+"/" + JSON.stringify(dataitem));
				//reloadWvLoad();
				//w.close();
			}
		});
	};
	//2各日期相差分钟数
	app.TimeDifference = function(k, j) {
		return (j.getTime() - k.getTime()) / 1000 / 60 //时间差的毫秒数
	};
	app.getpicture = function(filename, typename) {
		//var filename = loadUrl.substring(loadUrl.lastIndexOf("/") + 1, loadUrl.length);
		if (YiRu.ios() && filename.split('.')[1] == "mp3") {
			return "_downloads/" + typename + "/" + filename;
		}
		return plus.io.convertLocalFileSystemURL("_downloads/" + typename + "/" + filename);
	}
	//根据远程url地址返回本地文件地址，如果已经下载了的话
	app.getFileUrlbyLocal = function(loadUrl) {
		if (loadUrl == null || loadUrl == "") return loadUrl;
		var filename = loadUrl.substring(loadUrl.lastIndexOf("/") + 1, loadUrl.length);
		var relativePath = "_downloads/" + filename;
		if (YiRu.ios() && filename.split('.')[1] == "mp3") {
			return relativePath;
		}
		return plus.io.convertLocalFileSystemURL(relativePath);
		//}, function(e) {
		//return loadUrl;
		//});
	};
	app.getheadIconUrl = function(loadUrl, callback) {
		if (loadUrl == null || loadUrl == "" || loadUrl == " ") return callback("");
		if (loadUrl.split('.').length < 2) return callback("");
		var filename = loadUrl.substring(loadUrl.lastIndexOf("/") + 1, loadUrl.length);
		var relativePath = "_doc/" + filename;
		//检查是否已存在  
		plus.io.resolveLocalFileSystemURL(relativePath, function(entry) {
			return callback(plus.io.convertLocalFileSystemURL(relativePath));
		}, function(e) {
			return app.DownFile(loadUrl, relativePath, callback);
		});
	};
	app.getFileUrl = function(loadUrl, callback, loadback, file_name) {
		if (loadUrl == null || loadUrl == "" || loadUrl == " ") return callback("");
		//下载成功 默认保存在本地相对路径的"_downloads"文件夹里面, 如"_downloads/logo.jpg"  

		var filename = !!file_name ? file_name : loadUrl.substring(loadUrl.lastIndexOf("/") + 1, loadUrl.length);

		var relativePath = "_downloads/" + filename;
		//检查是否已存在  
		plus.io.resolveLocalFileSystemURL(relativePath, function(entry) {
			if (YiRu.ios() && filename.split('.')[1] == "mp3") {
				return callback(relativePath);
			}
			return callback(plus.io.convertLocalFileSystemURL(relativePath));
		}, function(e) {
			return app.DownFile(loadUrl, relativePath, callback, loadback);
		});
	};
	app.DownFile = function(loadUrl, relativePath, callback, loadback) {
		//创建下载任务  
		var dtask = plus.downloader.createDownload(loadUrl, {
			filename: relativePath,
			retryInterval: 1
		}, function(d, status) {
			//console.log(status);
			if (status == 200) {
				//console.log("下载成功");
				if (YiRu.ios() && relativePath.split('.')[1] == "mp3") {
					return callback(relativePath);
				}
				return callback(plus.io.convertLocalFileSystemURL(d.filename));
			} else {
				//console.log("下载失败");
				if (relativePath != null) delFile(relativePath);
				return callback(loadUrl);
			}
			plus.downloader.clear();
		});
		if (loadback) {
			dtask.addEventListener("statechanged", function(download, status) {
				if (download.state != 4) {
					return loadback(download.downloadedSize, download.totalSize);
				}
			}, false);
		}
		//启动下载任务
		dtask.start();
	};
	app.deviceId = function() {
		var thisuuid = localStorage.getItem('$uuid');
		if (thisuuid != "" && thisuuid != null) return thisuuid;
		plus.device.getInfo({
			success: function(e) {
				localStorage.setItem('$uuid', e.uuid);
				return e.uuid;
			},
			fail: function(e) {
				return "";
			}
		});
	};
	app.getuserinfo = function() {
		var stateText = localStorage.getItem('$lst_userinfo') || "{}";
		//var _stateText = JSON.parse(stateText);
		return JSON.parse(stateText);

	};
	app.setuserinfo = function(state) {
		//console.log(JSON.stringify(state));
		state = state || {};
		localStorage.setItem('$lst_userinfo', JSON.stringify(state));
	};
	app.logout = function() {
		localStorage.setItem('$lst_userinfo', "{}");
		localStorage.setItem('$lst_cityinfo', "[]");

	};
	app.isLogin = function() {
		var userState = JSON.parse(localStorage.getItem('$lst_userinfo') || "{}");
		if (userState.uid && userState.uid != '' && userState != {}) {
			return true;
		} else {
			return false;
		}
	};
	app.UserLogin = function() {
		if (!app.isLogin()) {
			YiRu.openVW('login.html');
			setTimeout(function() {
				app.closeAllwebview('login.html');
			}, 500);

			return false;
		} else {
			return true;
		};
	}

	app.checkEmail = function(email) {
		email = email || '';
		return (email.length > 3 && email.indexOf('@') > -1);
	};
	app.checkCntxt = function(txt) {
		if (txt.length == 0) return true;
		var reg = new RegExp("[\\u4E00-\\u9FFF-a-zA-Z]+", "g");
		return reg.test(txt);
	};

	app.checkNick = function(txt) {
		if (txt.length == 0 || txt.length > 12) {
			return false;
		}
		var reg = new RegExp("[\\u4E00-\\u9FFF-_A-Za-z0-9\.\@\#]+", "g");
		if (reg.test(txt)) {
			return true;
		}
		return false;
	};

	app.checkPhone = function(phone) {
		phone = phone || '';
		var reg = /^0?(13|15|18|16|14|17|19)[0-9]{9}$/;
		return (reg.test(phone));
	};

	app.checkNumber = function(Number) {
		if (Number === "" || Number == null) {
			return false;
		}
		if (!isNaN(Number)) {
			return true;
		}
		return false;
	};

	//判断是否是ios
	app.ios = function() {
		if (plus.os.name.toLocaleLowerCase() == 'ios') {
			return true;
		} else {
			return false;
		}
	};
	//关闭除指定webview之外的所有webview,current位null则关闭所有
	app.closeAllwebview = function(current) {
		setTimeout(function() {
			var all = plus.webview.all();
			for (var i = 0, len = all.length; i < len; i++) {
				if (current != null) {
					if (all[i].id !== current && all[i].id != plus.runtime.appid) {
						plus.webview.close(all[i], "none");
						//all[i].close();
					}
				} else {
					if (all[i].id != plus.runtime.appid) {
						plus.webview.close(all[i], "none");
					}
					//all[i].close();
				}
			}
		}, 300);
	};
	app.md5Data = function(oldData) {
		var data = JSON.parse(JSON.stringify(oldData || {})); //保存原始数据
		//data = data || {};
		return data;
	}
	//IOS判断QQ是否已经安装
	app.isQQInstalled = function() {
		var TencentOAuth = plus.ios.import("TencentOAuth");
		var isQQInstalled = TencentOAuth.iphoneQQInstalled();
		return isQQInstalled == '0' ? false : true;
	};
	//IOS判断微信是否已经安装
	app.isWXInstalled = function() {
		var Weixin = plus.ios.import("WXApi");
		var isWXInstalled = Weixin.isWXAppInstalled();
		return isWXInstalled == '0' ? false : true;
	};
	//去掉空白
	app.trim = function(str) {
		return str.replace(/(^\s*)|(\s*$)/g, "");
	};
	//移除class样式
	app.removeClass = function(el, name) {
		if (!el)
			return;
		if (el.className.indexOf(name) >= 0)
			el.className = el.className.replace(name, '');
	};
	//移除所有class样式
	app.removeAllClass = function(el, name) {
		if (!el)
			return;
		if (el.className.indexOf(name) >= 0) {
			var reg = new RegExp(name, "g");
			el.className = el.className.replace(reg, '');
		}
	};
	//重写退出应用
	app.quitApp = function() {
		$.oldBack = mui.back;
		var backButtonPress = 0;
		$.back = function(event) {
			backButtonPress++;
			if (backButtonPress > 1) {
				plus.runtime.quit();
			} else {
				plus.nativeUI.toast('再按一次退出' + AppName);
			}
			setTimeout(function() {
				backButtonPress = 0;
			}, 1000);
			return false;
		};
	};
	//复制到剪切板
	app.copyclip = function(text) {
		if (plus.os.name.toLocaleLowerCase() == 'ios') {
			var UIPasteboard = plus.ios.importClass("UIPasteboard");
			var generalPasteboard = UIPasteboard.generalPasteboard();
			generalPasteboard.setValueforPasteboardType(text, "public.utf8-plain-text");
			//var value = generalPasteboard.valueForPasteboardType("public.utf8-plain-text"); 
			mui.toast('复制成功');
		} else {
			var Context = plus.android.importClass("android.content.Context");
			var main = plus.android.runtimeMainActivity();
			var clip = main.getSystemService(Context.CLIPBOARD_SERVICE);
			plus.android.invoke(clip, "setText", text);
			mui.toast('复制成功');
		}
	};
	//打开软键盘
	app.openSoftKeyboard = function() {
		if (mui.os.ios) {
			var webView = plus.webview.currentWebview().nativeInstanceObject();
			webView.plusCallMethod({
				"setKeyboardDisplayRequiresUserAction": false
			});
		} else {
			var webview = plus.android.currentWebview();
			plus.android.importClass(webview);
			webview.requestFocus();
			var Context = plus.android.importClass("android.content.Context");
			var InputMethodManager = plus.android.importClass("android.view.inputmethod.InputMethodManager");
			var main = plus.android.runtimeMainActivity();
			var imm = main.getSystemService(Context.INPUT_METHOD_SERVICE);
			imm.toggleSoftInput(0, InputMethodManager.SHOW_FORCED);
		}
	};
	//打开新窗口
	app.openVW___ = function(id, extras, New) {
		//plus.webview.open('xinshou.html', 'new', {}, 'slide-in-right', 200);
		New = New || false;
		$.openWindow({
			id: id,
			url: id,
			extras: extras,
			createNew: New,
			show: {
				autoShow: true,
				aniShow: 'pop-in',
				duration: 300
			},
			waiting: {
				autoShow: true
			}
		});
	};
	app.openVW = function(id, extras, New) {
		//如果webview已经存在

		var _webview = plus.webview.getWebviewById(id);
		if (_webview) {
			//如果存在，但强制新建webview
			if (New) {
				_webview.close('none');
				_webview = app.createwebview(id, extras);
			}
		} else {
			//如果不存在webview则创建窗口
			_webview = app.createwebview(id, extras);
		}

		//setTimeout(function() {
		//if (app.ios()) {
		//	setTimeout(function() {
		//	_webview.show('pop-in', 300, function() {
		//显示完成的操作fade-in
		//	}, extras);
		//	}, 150);
		//} else {
		setTimeout(function() {
			_webview.show('pop-in', 300, function() {
				//显示完成的操作fade-in
			}, extras);
		}, 150);
		//}
		//}, 100);
	};
	//预加载
	app.preload = function(options) {
		if (options.url) {
			var _webview = plus.webview.getWebviewById(options.url);
			if (_webview) {
				//如果存在，但强制新建webview
				if (options.isnew) {
					_webview.close('none');
					app.createwebview(options.url, options.extras);
				}
			} else {
				//如果不存在webview则创建窗口
				app.createwebview(options.url, options.extras);
			}
		}
	};
	app.createwebview = function(id, extras) {
		return plus.webview.create(id, id, {
			background: '#ffffff', //transparent
			render: '', //always
			scrollIndicator: 'none',
			softinputMode: 'adjustPan', //软键盘模式，adjustResize|adjustPan
			softinputNavBar: 'none' //软键盘导航条
		}, extras || {});
	}
	//格式化图文信息得图片样式
	app.parseDomImg = function(str) {
		var objE = document.createElement("div");
		objE.innerHTML = str;

		var imgs = objE.querySelectorAll('img');
		for (var i = 0; i < imgs.length; i++) {
			var img = imgs[i];
			img.setAttribute('data-delay', img.src);
			img.src = 'images/blank.gif';
			img.setAttribute('height', '100px');
			img.setAttribute('width', '100%');
		}
		return objE.innerHTML;
	};
	//格式化图文信息得图片样式
	app.parseImg = function(str) {
		var objE = document.createElement("div");
		objE.innerHTML = str;

		var imgs = objE.querySelectorAll('img');
		for (var i = 0; i < imgs.length; i++) {
			var img = imgs[i];
			//img.setAttribute('data-delay', img.src);
			if (img.src.substring(0, 4) != "http") {
				img.src = img.src.replace('/ueditor/', wwwUrl + '/ueditor/').replace('file://', '');
			}
			img.setAttribute('height', 'auto');
			img.setAttribute('width', '100%');
		}
		return objE.innerHTML;
	};
	//格式化图文信息得图片样式
	app.parseDomImg_article = function(str) {
		var objE = document.createElement("div");
		objE.innerHTML = str;

		var imgs = objE.querySelectorAll('img');
		for (var i = 0; i < imgs.length; i++) {
			var img = imgs[i];
			img.setAttribute('data-delay', img.src);
			img.src = 'images/logo-bg.png';
			img.setAttribute('height', '100px');
			img.setAttribute('width', '100%');
		}
		return objE.innerHTML;
	};
	//APP更新
	app.update = function() {
		if (isupdate) return;
		setTimeout(function() {
			plus.runtime.getProperty(plus.runtime.appid, function(wgtinfo) {
				app.getajax('common/getVersionApk', function(data) {
					//版本号：wgtinfo.version
					var bb_a = toNum(wgtinfo.version);
					var bb_b = toNum(data.data.title);
					if ((data.data.qzstatus == "1" || app.getuserinfo().type == data.data.qzstatus) && bb_b > bb_a) {
						isupdate = true;
						plus.nativeUI.confirm(data.data.notes, function(event) {
							if (0 == event.index) {
								var pathstr = BaseUrl + "/" + data.data.apkurl;
								if (app.ios()) {
									pathstr = data.data.iosurl;
								}
								plus.runtime.openURL(pathstr);
							} else {
								plus.runtime.quit();
							}
						}, '', ["立即升级", "退出"]);
					} else {
						isupdate = false;
					}
				});
			});
		}, 5000);
	};
	app.installWgt = function(path) {
		plus.nativeUI.showWaiting('安装升级包文件...', app.WaitingStyle());
		plus.runtime.install(path, {}, function() {
			plus.nativeUI.closeWaiting();
			plus.nativeUI.alert("应用资源更新完成！", function() {
				plus.runtime.restart();
			});
		}, function(e) {
			plus.nativeUI.closeWaiting();
			plus.nativeUI.alert("安装升级包文件失败[" + e.code + "]：" + e.message);
		});
	};
	app.viewstyle = function() {
		var _style = {
			scrollIndicator: 'none',
			//bounce: 'vertical',
			//bounceBackground: '#ffffff'
		};
		return _style;
	};
	app.downstyle = function(pulldownRefresh) {
		var _style = {
			style: 'circle',
			color: '#1777fb',
			offset: '0px',
			callback: pulldownRefresh
		};
		return _style;
	};
}(mui, window.YiRu = {}));
//计算版本号大小,转化大小
function toNum(a) {
	var a = a.toString();
	var c = a.split('.');
	var num_place = ["", "0", "00", "000", "0000"],
		r = num_place.reverse();
	for (var i = 0; i < c.length; i++) {
		var len = c[i].length;
		c[i] = r[len] + c[i];
	}
	var res = c.join('');
	return res;
}

mui('body').on('tap', '.allclick', function(e) {
	//console.log(JSON.stringify($(this).click()));
	//return false;
	var alltxt = this.getAttribute("alltxt");
	if (alltxt) {
		var _alltxt = alltxt.split(',');
		//console.log(alltxt);
		YiRu.getajax('common/upUserOnClickLog', function(data) {

		}, {
			onclickid: _alltxt[1],
			notes: '',
			onclickname: _alltxt[0]
		}, null, 'post');
	}
	// 
});

//获取分类
function GetTagsData(callback) {
	YiRu.getajax('common/getCateAll', function(data) {
		return callback(data.data);
	}, {}, null, 'post', {
		key: '1',
		num: 1440
	});
}
//获取分类
function GetCommentTypeData(callback) {
	YiRu.getajax('shop/getCommentType', function(data) {
		return callback(data.data);
	}, {}, null, 'post', {
		key: '1',
		num: 1440
	});
}
//获取我要打官司分类
function GetToXiaoEr(id, callback) {
	YiRu.getajax('message/sendMessageToXiaoEr', function(data) {
		return callback(data);
	}, {
		cate_id: id
	}, null, 'post', {
		key: '1',
		num: 1440
	});
}
//获取隐藏中间4位的手机号码
function getMobile(m) {
	//YiRu.checkPhone(m)
	if (m.length == 11) {
		var m1 = m.substr(0, 3);
		var m2 = m.substr(3, 4);
		var m3 = m.substr(7, 4);
		m = m1 + '****' + m3;
	}
	return m;
}
mui('body').on('tap', '#reloadWv', function() {
	plus.webview.currentWebview().reload();
});
/*删除指定文件*/
function delFile(relativePath) {
	plus.io.resolveLocalFileSystemURL(relativePath, function(entry) {
		entry.remove(function(entry) {
			//console.log("文件删除成功==" + relativePath);
		}, function(e) {
			//console.log("文件删除失败=" + relativePath);
		});
	});
}

function getAesString(data) { //加密
	var encrypted = CryptoJS.AES.encrypt(data, key, {
		iv: iv,
		mode: CryptoJS.mode.CBC,
		padding: CryptoJS.pad.Pkcs7
	});
	return encrypted.toString(); //返回的是base64格式的密文
}

function getDAesString(encrypted) { //解密
	var decrypted = CryptoJS.AES.decrypt(encrypted, key, {
		iv: iv,
		mode: CryptoJS.mode.CBC,
		padding: CryptoJS.pad.Pkcs7
	});
	return decrypted.toString(CryptoJS.enc.Utf8);
}

function getAES(data) { //加密
	var encrypted = getAesString(data, key, iv); //密文
	var encrypted1 = CryptoJS.enc.Utf8.parse(encrypted);
	return encrypted;
}

function getDAes(data) { //解密
	var decryptedStr = getDAesString(data, key, iv);
	return decryptedStr;
}

function reloadWvLoad(msg) {
	var errorText = document.createElement('div');
	errorText.innerHTML = '<h4>' + (msg || '网络不给力，请检查网络！') +
		'</h4><button id="reloadWv" class="mui-btn mui-btn-negative">重新加载</button>';
	errorText.setAttribute('class', 'empty-show');

	var contentbox = document.querySelector('.mui-scroll-wrapper');
	if (contentbox) contentbox.classList.add("transparent");
	document.body.appendChild(errorText);
}

function getDateDiff(datestr) {
	var createtime = Date.parse(mui.os.ios ? datestr.replace(/-/g, '/') : datestr);
	createtime = createtime / 1000;
	var now = Date.parse(new Date()) / 1000;
	var limit = now - createtime;
	var content = "";
	if (limit < 60) {
		content = "刚刚";
	} else if (limit >= 60 && limit < 3600) {
		content = Math.floor(limit / 60) + "分钟前";
	} else if (limit >= 3600 && limit < 86400) {
		content = Math.floor(limit / 3600) + "小时前";
	} else if (limit >= 86400 && limit < 2592000) {
		content = Math.floor(limit / 86400) + "天前";
	} else if (limit >= 2592000 && limit < 31104000) {
		content = Math.floor(limit / 2592000) + "个月前";
	} else {
		//content = "很久前";
		content = datestr;
	}
	return content;
}

function formatTime(times, fmt) {
	//正则对应的格式
	if (times == null || times == '' || times == undefined || times == 'undefined' || times == 'null') {
		return "";
	}
	var d = new Date(mui.os.ios ? times.replace(/-/g, '/') : times);
	var o = {
		"M+": d.getMonth() + 1,
		"d+": d.getDate(),
		"h+": d.getHours(),
		"m+": d.getMinutes(),
		"s+": d.getSeconds(),
		"q+": Math.floor((d.getMonth() + 3) / 3),
		"S": d.getMilliseconds()
	};
	if (/(y+)/.test(fmt))
		fmt = fmt.replace(RegExp.$1, (d.getFullYear() + "").substr(4 - RegExp.$1.length));
	for (var k in o)
		if (new RegExp("(" + k + ")").test(fmt))
			fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
	return fmt;
}

//获取与毫秒数的转化比例（相差天数：1，相差小时数：2，相差分钟数：3，相差秒数：4）
function getDifferScale(value) {
	var format;
	//获取转化比（天数跟毫秒数的比例）
	if (value == 1) {
		format = parseFloat(24 * 60 * 60 * 1000);
	}
	//获取转化比（小时数跟毫秒数的比例）
	else if (value == 2) {
		format = parseFloat(60 * 60 * 1000);
	}
	//获取转化比（分钟数跟毫秒数的比例）
	else if (value == 3) {
		format = parseFloat(60 * 1000);
	}
	//获取转化比（秒数跟毫秒数的比例）
	else if (value == 4) {
		format = parseFloat(1000);
	}
	return format;
}

//获取两个日期的相差日期数(differ 相差天数：1、相差小时数：2、相差分钟数：3、相差秒数：4)
function getDifferDate(firstDate, secondDate, differ) {
	//1)将两个日期字符串转化为日期对象
	var startDate = new Date(firstDate);
	var endDate = new Date(secondDate);
	//2)计算两个日期相差的毫秒数
	var msecNum = endDate.getTime() - startDate.getTime();
	//3)计算两个日期相差的天数
	var dayNum = Math.floor(msecNum / getDifferScale(differ));
	return dayNum;
}
//分享模块
function shareWeixin(_this, mask) {
	var w = plus.nativeUI.showWaiting('', app.WaitingStyle()),
		msg = {
			extra: {
				scene: 'WXSceneSession'
			}
		};
	var shares = {};
	plus.share.getServices(function(s) {
		if (s && s.length > 0) {
			for (var i = 0; i < s.length; i++) {
				var t = s[i];
				shares[t.id] = t;
			}
			var share = shares['weixin'];
			msg.href = _this.getAttribute('data-href');
			msg.title = _this.getAttribute('data-title');
			msg.content = _this.getAttribute('data-content');
			msg.pictures = _this.getAttribute('data-img') ? [_this.getAttribute('data-img')] : ["_www/images/logo.png"];
			msg.thumbs = _this.getAttribute('data-img') ? [_this.getAttribute('data-img')] : ["_www/images/logo.png"];
			share.send(msg, function() {
				w.close();
				if (mask)
					mask.close();
				plus.nativeUI.toast("分享到" + share.description + "成功！ ");
			}, function(e) {
				w.close();
				plus.nativeUI.toast("分享到" + share.description + "取消");
			});
		}
	}, function() {
		w.close();
		plus.nativeUI.toast('获取分享列表失败');
	});
}

function initShare() {
	var shares = {};
	plus.share.getServices(function(s) {
		if (s && s.length > 0) {
			for (var i = 0; i < s.length; i++) {
				var t = s[i];
				shares[t.id] = t;
			}
			return shares;
		}
	}, function() {
		plus.nativeUI.toast('获取分享列表失败');
	});
	return shares;
}

function loadShare(params) {
	var ids = [],
		bts = [];
	// if (YiRu.ios()) {
	// 	ids.push({
	// 		id: "weixin",
	// 		ex: "WXSceneSession"
	// 	}, {
	// 		id: "weixin",
	// 		ex: "WXSceneTimeline"
	// 	});
	// 	bts.push({
	// 		title: "发送给微信好友"
	// 	}, {
	// 		title: "分享到微信朋友圈"
	// 	});
	// 	//if (YiRu.isQQInstalled()) {
	// 		ids.push({
	// 			id: "qq"
	// 		});
	// 		bts.push({
	// 			title: "分享给QQ好友"
	// 		});
	// 	//}
	// } else {
	ids.push({
		id: "weixin",
		ex: "WXSceneSession"
	}, {
		id: "weixin",
		ex: "WXSceneTimeline"
	}, {
		id: "qq"
	});
	bts.push({
		title: "发送给微信好友"
	}, {
		title: "分享到微信朋友圈"
	}, {
		title: "分享给QQ好友"
	});
	//}
	var shares = initShare();
	plus.nativeUI.actionSheet({
		cancel: "取消",
		buttons: bts
	}, function(e) {
		var i = e.index;
		if (i > 0) {
			var s_id = ids[i - 1].id;
			var share = shares[s_id];
			// if (YiRu.ios() && share.id == "weixin" && !YiRu.isWXInstalled()) {
			// 	plus.nativeUI.toast("检测到手机未安装微信!");
			// 	if (typeof params.NocallBack == 'function') {
			// 		return params.NocallBack();
			// 	}
			// 	return;
			// }
			try {
				if (share.authenticated) {
					shareMessage(share, ids[i - 1].ex, params);
				} else {
					share.authorize(function() {
						shareMessage(share, ids[i - 1].ex, params);
					}, function(e) {
						plus.nativeUI.toast("认证授权失败!");
						if (typeof params.NocallBack == 'function') {
							return params.NocallBack();
						}
					});
				}
			} catch (e) {
				plus.nativeUI.toast("分享失败!");
				if (typeof params.NocallBack == 'function') {
					return params.NocallBack();
				}
			}
		} else {
			plus.nativeUI.toast("分享取消");
			if (typeof params.NocallBack == 'function') {
				return params.NocallBack();
			}
		}
	});
}

function shareMessage(share, ex, params) {
	var msg = {
		extra: {
			scene: ex
		}
	};
	msg.href = params.href;
	msg.title = params.title;
	msg.content = params.content;
	/*if (~share.id.indexOf('weibo')>=0) {
		msg.content += '，<a href="'+ProductHref+'">Go血拼！ ></a>';
	}*/
	//msg.thumbs=productImg;
	//msg.pictures=productImg;
	msg.pictures = ["" + params.pictures + ""];
	msg.thumbs = [params.thumbs ? params.thumbs : params.pictures];
	share.send(msg, function() {
		plus.nativeUI.toast("分享到" + share.description + "成功！ ");
		if (typeof params.callBack == 'function') {
			return params.callBack();
		}
	}, function(e) {
		plus.nativeUI.toast("分享到" + share.description + "取消");
		if (typeof params.NocallBack == 'function') {
			return params.NocallBack();
		}
	});
}
//上传图片操作 选取图片的来源，拍照和相册
function showActionSheet(callback, dataitem, num) {
	if (!!num) {
		if (num >= 9) {
			mui.toast("您已上传了9张图片");
			return false;
		}
	}
	var actionbuttons = [{
		title: "拍照"
	}, {
		title: "相册选取"
	}];
	var actionstyle = {
		title: "选择照片",
		cancel: "取消",
		buttons: actionbuttons
	};
	plus.nativeUI.actionSheet(actionstyle, function(e) {
		if (e.index == 1) {
			getImage(dataitem, callback);
		} else if (e.index == 2) {
			galleryImg(dataitem, callback, num);
		}
	});
}
// 拍照 
function getImage(dataitem, callback) {
	w = plus.nativeUI.showWaiting('', {
		padlock: true
	});
	var cmr = plus.camera.getCamera();
	cmr.captureImage(function(p) {
		//alert(p);//_doc/camera/1467602809090.jpg 
		plus.io.resolveLocalFileSystemURL(p, function(entry) {
			//alert(entry.toLocalURL());//file:///storage/emulated/0/Android/data/io.dcloud...../doc/camera/1467602809090.jpg 
			//alert(entry.name);//1467602809090.jpg 
			compressImage(entry.toLocalURL(), entry.name, callback, dataitem, w);
		}, function(e) {
			w.close();
			plus.nativeUI.toast("读取拍照文件错误：" + e.message);
		});
	}, function(e) {}, {
		filename: "_doc/camera/",
		index: 1
	});
}
//相册
function galleryImg(dataitem, callback, num) {
	w = plus.nativeUI.showWaiting('', {
		padlock: true
	});
	var maxnum = 9;
	if (!!num) {
		maxnum = maxnum - num;
	}
	console.log(maxnum + "/" + num);
	plus.gallery.pick(function(e) {
		for (var i in e.files) {
			plus.io.resolveLocalFileSystemURL(e.files[i], function(entry) {
				//alert(entry.toLocalURL());
				compressImage(entry.toLocalURL(), entry.name, callback, dataitem, w, i + 1, e.files.length);
			}, function(e) {
				mui.toast("读取文件错误：" + e.message);
				w.close();
			});
			//} else {
			//	plus.nativeUI.toast("您每次只能选择1张图片");
			//}
		}
	}, function(e) {
		w.close();
		mui.toast("取消选择图片");
		//console.log("取消选择图片");
	}, {
		animation: true,
		filter: 'image',
		maximum: maxnum,
		multiple: true,
		onmaxed: function() {
			mui.toast("最多还能选择" + maxnum + "张图片");
		},
		system: true
	});
}
//压缩图片 
function compressImage(url, filename, callback, dataitem, w, i, ai) {
	var name = "_doc/image/" + filename; //_doc/upload/F_ZDDZZ-1467602809090.jpg 
	plus.zip.compressImage({
			src: url, //src: (String 类型 )压缩转换原始图片的路径 
			dst: name, //压缩转换目标图片的路径 
			quality: 100, //quality: (Number 类型 )压缩图片的质量.取值范围为1-100 
			width: "60%",
			overwrite: true //overwrite: (Boolean 类型 )覆盖生成新文件 
		},
		function(event) {
			//uploadf(event.target,divid); 
			//var path = name; //压缩转换目标图片的路径 
			//event.target获取压缩转换后的图片url路 
			//filename图片名称 
			//saveimage(event.target, filename, path);
			var _w = w;
			if (!!i && !!ai) {
				if (i < ai) _w = null;
			}
			YiRu.getupfile(event.target, function(data) {
				return callback(data);
			}, dataitem, _w);
		},
		function(error) {
			w.close();
			mui.toast("压缩图片失败，请稍候再试");
		});
}
//上传图片操作

//分享模块结束
// var mm = Encrypt('律师堂');
// console.log(mm);
// var jm = Decrypt(mm);
// console.log(jm);
// console.log(hex_sha1('abc'));
