	var showCanvas; //var for cga.js
	var isPngCompressed = false; 
	var isSavePageInit = false;

	var offsetX, offsetY; //edit-area coordinates to document
	var editW, editH; //edit-area dimension
	var scrollbarWidth = 17; //scrollbar width
	var $editArea;
	var actions = [];
	var initFlag = 1;//edit page init state, use to indicate the start state in 'undo' function
	var requestFlag = 1;//init only once
	var textFlag = 1;//use for text input
	
	var showCanvas, showCtx, drawCanvas, drawCtx;
	var drawColor = 'red';
	var taburl, tabtitle;
	var compressRatio = 80, resizeFactor = 100;
	var shift = false;
	var isGASafe = BrowserDetect.OS == 'Windows' || BrowserDetect.OS == 'Linux';
	
	function prepareEditArea(request) {	
		var menuType = request.menuType;
		var type = request.type;
		var data = request.data;
		taburl = request.taburl;
		tabtitle = request.tabtitle;
		saveImageFormat = request.saveImageFormat;
		getEditOffset();
		//getInitDim();

		scrollbarWidth = getScrollbarWidth();
		var w = request.w, 
			h = request.h; 
		switch(type) {
		case 'visible':
			$('#save-image').attr({src:data}).load(function() { 
				if (menuType=='selected') {
					editW = request.centerW;
					editH = request.centerH;
					updateEditArea();
					updateShowCanvas();
					getEditOffset();
					addMargin();
					getEditOffset();
				} else {
					editW = w/* -scrollbarWidth */; // this will cause drawing bug in FF
					editH = h/* -scrollbarWidth */; // so we comment it out
					updateEditArea();
					updateShowCanvas();
				}
				w = editW;
				h = editH;
				showCtx.drawImage(this, 0, 0, w, h, 0, 0, w, h); 
				$(this).unbind('load');
			});
			break;
		case 'entire':
			var counter = request.counter,
				ratio = request.ratio,
				scrollBar = request.scrollBar;
			
			var i = j = n = 0,
				len = data.length, hlen = counter, vlen = Math.round(len / hlen);
			
			//If we put prepareCanvasV, prepareCanvasH and prepareNextCol at this case's bottom,
			//we will get undefined error when we call these functions in compressed 
			//code which is compiled by Google Closure Compiler.
			
			//vertical 
			function prepareCanvasV(d, sx, sy, sw, sh, dx, dy, dw, dh) {
				dy = i*h;
				if (i == vlen-1) {
					sy = h-lastH;
					sh = dh = lastH;
				}
				
				$('#save-image').attr({src:d}).load(function() { 
					$(this).unbind('load');
					showCtx.drawImage(this, sx, sy, sw, sh, dx, dy, dw, dh);
					
					if (++i>vlen-1)
						prepareNextCol();
					else 
						prepareCanvasV(data[++n], sx, sy, sw, sh, dx, dy, dw, dh);
				});
			}
			
			//horizontal
			function prepareCanvasH(d, sx, sy, sw, sh, dx, dy, dw, dh, func) {
				dx = j*w;
				if (j == hlen-1) {
					sx = w-lastW;
					sw = dw = lastW;
				}
				
				$('#save-image').attr({src:d}).load(function() { 
					$(this).unbind('load');
					showCtx.drawImage(this, sx, sy, sw, sh, dx, dy, dw, dh);
					
					if (j<hlen-1) 
						prepareCanvasH(data[++j], sx, sy, sw, sh, dx, dy, dw, dh);
				});
			}
			
			//start a new col
			function prepareNextCol() {
				if (++j>hlen-1) return;
				if (j==hlen-1) sx = w-lastW, sw = dw = editW-j*w, dx = j*w;
				else sx = 0, sw = dw = w, dx = j*w;
				sy = 0, sh = dh = h, dy = 0;
				
				i = 0;
				n = i+j*vlen;
				prepareCanvasV(data[n], sx, sy, sw, sh, dx, dy, dw, dh);
			}	
			
			
			//*scroll - x:no, y:yes
			if (!scrollBar.x && scrollBar.y) {
				//h += scrollbarWidth; //line-47: minus more
				w -= scrollbarWidth;
				vlen = len;
				lastH = h * ratio.y;
				
				if (menuType == 'selected') {
					if (scrollBar.realX) h -= scrollbarWidth;
					editW = request.centerW;
				} else editW = w;
				if (lastH) editH = h * (vlen-1) + lastH;
				else editH = h * vlen;
				updateEditArea();
				updateShowCanvas();
				getEditOffset();
				addMargin();
				getEditOffset();
				
				var sx = 0, sw = dw = w, dx = 0,
					sy = 0, sh = dh = h, dy = 0;
				prepareCanvasV(data[n], sx, sy, sw, sh, dx, dy, dw, dh);
			}
			
			//*scroll - x:yes, y:no
			if (scrollBar.x && !scrollBar.y) {
				//w += scrollbarWidth; //line-46: minus more
				h -= scrollbarWidth;
				hlen = len;
				lastW = w * ratio.x;
				
				if (menuType == 'selected') {
					if (scrollBar.realY) w -= scrollbarWidth;
					editH = request.centerH;
				} else editH = h;
				if (lastW) editW = w * (hlen-1) + lastW;
				else editW = w * hlen;
				updateEditArea();
				updateShowCanvas();
				$editArea.addClass('add-margin');
				getEditOffset();
				
				var sx = 0, sw = dw = w, dx = 0,
					sy = 0, sh = dh = h, dy = 0;
				prepareCanvasH(data[n], sx, sy, sw, sh, dx, dy, dw, dh);
			}
			
			//*scroll - x:yes, y:yes
			if (scrollBar.x && scrollBar.y) {
				lastW = w * ratio.x, lastH = h * ratio.y;
				w -= scrollbarWidth;
				h -= scrollbarWidth;
				if (menuType == 'selected') {
					editW = request.centerW;
					editH = request.centerH;
					console.log(editW+'+'+editH);
				} else {
					if (lastW) editW = w * (hlen-1) + lastW;
					else editW = w * hlen;
					if (lastH) editH = h * (vlen-1) + lastH;
					else editH = h * vlen;
				}
				updateEditArea();
				updateShowCanvas();
				
				var sx = 0, sw = dw = w, dx = 0,
					sy = 0, sh = dh = h, dy = 0;
				prepareCanvasV(data[n], sx, sy, sw, sh, dx, dy, dw, dh);
			}
			
			
			
			break;
		}
	}
	
	function prepareTools() {//change
		$('#exit').click(function() {
			//window.close();
		});
		$('#tool-panel>div').click(function(e) {
			var target = getTarget(e.target);
			if (target.nodeName == 'DIV') 
				return;
			tool(target.id);
			
			function getTarget(t) {
				var node = t.nodeName;
				if (node != 'A' && node != 'DIV') { 
					t = t.parentNode;
					getTarget(t);
				}
				return t;
			}
		});
		
		/*shortcuts
		if (localStorage['shortcuts']) bindShortcuts();
		*/	
	}
	
	function preparePromote() {
		$('#promote').click(function(e) {
			$(this).disableSelection();
			if (e.target.tagName != 'A')
			$(this).toggleClass('expanded')
				.find('#content').toggle();
		});
	}
	
	function bindShortcuts() {
		//*****bind annotate shortcut
		var ctrl = false;
		$('body').keydown(function(e) {
			var id = '';
			switch(e.which) {
			case 83://Save
				id = 'save';
				break;
			case 67://Crop
				id = 'crop';
				break;
			case 82://Rectangle
				id = 'rectangle';
				break;
			case 69://Ellipse
				id = 'ellipse';
				break;
			case 65://Arrow
				id = 'arrow';
				break;
			case 76://Line
				id = 'line';
				break;
			case 70://Free Line
				id = 'free-line';
				break;
			case 66://Blur
				id = 'blur';
				break;
			case 84://Text
				//$(this).unbind('keydown');
				id = 'text';
				break;
			case 17://Ctrl
				ctrl = true;
				break;
			case 90://Undo/Z
				if (ctrl) {
					id = 'undo';
				}
				break;
			case 16://Draw shape/Shift
				shift = true;
				break;
			case 13://Done/Enter
				id = 'done';
				break;
			case 27://Cancel/Esc
				id = 'cancel';
				break;
			}
			
			if (id) {
				if (!$('body').hasClass('selected')) {
					tool(id);
				} else {
					if (id == 'done' || 'cancel') 
					tool(id);
				}
				if (id != 'undo')
					ctrl = false;
			}
		}).keyup(function(e) {
			switch(e.which) {
			case 16://Shift
				shift = false;
				break;
			}
		});
	}
	
	function tool(id) {
		//save draw action
		if (drawCanvas.width * drawCanvas.height != 0 && id != 'color' && id != 'done' && id != 'cancel') {
			if (id == 'undo') {
				if ($('body').hasClass('draw_free_line')) 
					undo();
				else
					$(drawCanvas).attr({width:0, height:0}).unbind(); 
					
				if (actions.length == 0) 
					disableUndo(); 
				return; 
			}
			
			if (!$('body').hasClass('draw_free_line')) {
				saveAction({type:'draw'});
				showCtx.drawImage(drawCanvas, parseInt($(drawCanvas).css('left')), parseInt($(drawCanvas).css('top')));
			}
			$(drawCanvas).attr({width:0, height:0});
		}
		
		if (id != 'color') {
			saveText();
			if(id != 'undo' && id != 'resize' ) {
				$('#temp-canvas').remove();
				$('body').removeClass('justCropped draw draw-text draw-blur');
			}
		}
		updateBtnBg(id);
		
		switch (id) {
			case 'save': save(); break;
			case 'crop': crop(); break;
			case 'color': color(); break;
			case 'done': done(); break;
			case 'cancel': cancel(); break;
			case 'resize': 
				$('#resize select').unbind().change(function(e) {
					resize(this.value);
				}); 
				break;
			case 'undo': undo(); break;
			default: draw(id); break;
		}
	}
	
	function i18n() {//need refinement
		/*$('#tool-panel .tip').each(function(i) {
			$(this).text(chrome.i18n.getMessage('tip'+(i+1)));
		});*/
		$('#logo').text(chrome.i18n.getMessage('logo'));
		$('title').text(chrome.i18n.getMessage('editTitle'));
		document.getElementById('save').lastChild.data = chrome.i18n.getMessage('saveBtn');
		document.getElementById('done').lastChild.data = chrome.i18n.getMessage('doneBtn');
		document.getElementById('cancel').lastChild.data = chrome.i18n.getMessage('cancelBtn');
		document.getElementById('save_button').lastChild.data = chrome.i18n.getMessage('save_button');
		$('.title').each(function() { $(this).attr({title:chrome.i18n.getMessage(this.id.replace(/-/, ''))}); });
		$('.i18n').each(function() { $(this).html(chrome.i18n.getMessage(this.id.replace(/-/, ''))); });
		//v2.4 - share tooltip
		$('#share')[0].innerHTML += '<div class="tip">[?]<div>img hosted on <a href="http://awesomescreenshot.com" target="_blank">awesomescreenshot.com</a></div></div>';
	}
	
	function save() {//change
		$('.button.save').parent('.as').show();
		document.body.scrollTop = 0;
		$('#save-tip').hide();
		$('#image_loader').css({display:'inline-block'});
		$('#save-image, #re-edit').css({visibility:'hidden'}); 
		$('body').removeClass('crop draw-text').addClass('save');
		$('#save').removeClass('active');
		
		$('#show-canvas').toggle();
		$('#draw-canvas').attr({width:0, height:0});
		//$('#share+dd').html(chrome.i18n.getMessage('savedShareDesc')); //clear the share button
		$('#share+dd').html('<p><a id="upload" href="javascript:void(0)"><span></span>Upload</a></p><div id="loader">Uploading<a id="cancel_upload" href="javascript:void(0)">Cancel</a></div><div id="error">Fail to upload to awesomescreenshot.com. You can crop the image to a smaller size and <a href="javascript:void(0)" id="retry">try it again</a>. Shoot an email to <a id="upload_error_contact" href="mailto:screenshot@diigo.com?subject=Awesome Screenshot (Chrome) Upload Error">screenshot@diigo.com</a>if you still experience problems. </div><div id="share-button"><a id="twitter" href="http://twitter.com/home?status=" target="_blank"><span></span>Twitter</a><a id="facebook" href="http://www.facebook.com/sharer.php?u=" target="_blank"><span></span>Facebook</a><a id="buzz" href="http://www.google.com/buzz/post?" target="_blank"><span></span>Google Buzz</a></div><div id="email-link"><a id="gmail" href="https://mail.google.com/mail/?view=cm&amp;tf=0&amp;fs=1&amp;body=" target="_blank"><span></span>Gmail</a><a id="yahoo" href="http://compose.mail.yahoo.com/" target="_blank"><span></span>Yahoo mail</a><a id="hotmail" href="http://www.hotmail.msn.com/secure/start?action=compose&amp;body=" target="_blank"><span></span>Hotmail</a></div><div id="share-link"><p>Image Link (share via MSN, GTalk, etc.)</p><input type="text"><span>Link Copied!</span></div>')
		$('#upload').parent().html($('#upload')[0].outerHTML); //v2.4 - for clean interface
		$($editArea).enableSelection();
				
		
		
		//bind upload button
		$('#upload').unbind().click(uploadImage);
		
		//bind re-edit 
		$('#re-edit').unbind().text('Re-Edit'/* chrome.i18n.getMessage('reEdit') */).click(function() {
			$('body').removeClass('save');
			$('#show-canvas').toggle();
			$($editArea).disableSelection();
			$('#share+dd div').hide();
			$('#save_local+dd>p').hide();
		});
		
		//canvas to base64
		setTimeout(prepareImage, 100);
		function prepareImage() {
			function prepareOptions() {
				$('#image_loader').hide();
				$('#save-image, #re-edit').css({visibility:'visible'});
				$('#save-tip').show();
			}
			
			/* function compress() {
				var CanvasPixelArray = showCtx.getImageData(0,0,editW,editH);
				var myThreadedEncoder = new JPEGEncoderThreaded('js/jpeg_encoder_threaded_worker.js');
				myThreadedEncoder.encode(CanvasPixelArray, 100, buildImage, true);
			} */
			
			function buildImage(image) {
				
				//if ($('#save-image')[0].src != image) {
//					$('#save-image').attr({src:image}).bind('load',function() {
//						console.log('load');
//						$(this).css({width:'auto'});
//						if (this.width>=parseInt($('#save_image_wrapper').css('width')))
//							$(this).css({width:'100%'});
//
//						prepareOptions();
////						$(this).unbind();
////					});

                $('#save-image').attr({src:image});
                $('#save-image').css({width:'auto'});
                if ($('#save-image')[0].width>=parseInt($('#save_image_wrapper').css('width')))
                    $('#save-image').css({width:'100%'});

                prepareOptions();
				//}
				//else 
				//	prepareOptions();
			}
			
			/* if (localStorage['format'] && localStorage['format']=='jpg')
				compress();
			else  */
			buildImage(showCanvas.toDataURL('image/'+saveImageFormat));
		}
		
		
		
		
		/* switch (localStorage['format']) {
		case 'png': 
			if (editW*editH<2170000) {
				setTimeout(buildImage, 300, showCanvas.toDataURL());
			} else {
				setTimeout(compress, 300);
				$('p', $('#save_local').next('dd')).show();
				isPngCompressed = true;
			}
			break;
		case 'jpg':
		default:
			compressRatio = editW*editH<2170000 ? 100 : 80;
			setTimeout(compress, 300); 
			break;
		}
		
		function compress() {
			var CanvasPixelArray = showCtx.getImageData(0,0,editW,editH);
			var myThreadedEncoder = new JPEGEncoderThreaded('js/jpeg_encoder_threaded_worker.js');
			myThreadedEncoder.encode(CanvasPixelArray, compressRatio, buildImage, true);
			compressRatio = 80;
		} */
		
		function uploadImage() {
			var src = $('#save-image').attr('src').replace(/^data:image\/(png|jpeg);base64,/, ""),
				manuelAbort = 0; //if ajax is aborted manuelly(1) or connect fault(0)
			//prepare data
			var cmd = 'imageUpload',
				pv = '1.0',
				ct = 'firefox',
				cv = '1.0'/* getLocVersion() */,
				postData = {
					src_url: taburl,
					src_title: tabtitle,
					image_md5 : $.md5(src),
					image_type: 'jpg',
					image_content: src
				},
				host = 'http://awesomescreenshot.com/client?';
			console.log(JSON.stringify(postData));
			//post
			var ajaxObj;
			function postAjax() {
				if (localStorage['format'] && !isPngCompressed) //if image compressed, make it default to 'jpg'
					postData.image_type = localStorage['format'];
			
				ajaxObj = $.ajax({
					url: host+ 'cmd='+cmd+ '&pv='+pv+ '&ct='+ct+ '&cv='+cv,
					type: 'POST',
					data: JSON.stringify(postData),
					timeout: 300000,
					dataType: 'json',
					contentType: 'text/plain; charset=UTF-8',
					beforeSend: function() {
						$('#upload').parent().hide('fast');
						$('#loader').fadeIn('slow').find('a').unbind('click').click(abortUpload);
					},
					error: function(request, textStatus, errorThrown) {
						errorHandle();
					},
					success: function(data, textStatus, request) {
						$('#loader').hide();
						
						if (request.status == 200 && data.code == 1) {
							showShare(data.result.url);
							
							//track upload success time
							if (isGASafe) {
								_gaq.push(['_trackEvent', 'SavePageActions', 'upload_success', 'time']);
							}
						} else {
							errorHandle(); //when aborted, else been called
						}
					},
					complete: function(XMLHttpRequest, textStatus) {
					}
				});
			}
			postAjax();
			
			
		}
		
		// expose to FF's content.js
		function showShare(imageURL) {
			$('#share-button, #email-link').show('slow')
			.click(function(e) {
				var t = e.target;
				$(t).addClass('visited');
			})
			.find('a').each(function() {
				var t = this;
				if (t.id == 'buzz') 
					t.href += 'message='+encodeURI(tabtitle)+'&url='+encodeURI(taburl)+'&imageurl='+imageURL;
				if (t.id == 'twitter') 
					t.href = 'http://twitter.com/share?url='+encodeURIComponent(imageURL)+'&via=awe_screenshot&text='+tabtitle;
				else 
					$(t).attr({href:t.href + imageURL});
			});
			
			$('#share-link').show('slow')
				.find('input[type="text"]').attr({value:imageURL}).bind('mouseup', function() {
					$(this).select();
					/* if (BrowserDetect.OS != 'Linux') {
						document.execCommand('Copy');
						$(this).next().show();
					} */
					//chrome.extension.sendRequest({action:'copy'});
					
				});
		}
		
		function errorHandle() {
			$('#loader').hide('fast');
			if (!manuelAbort) {
				$('#error').show().find('#retry').unbind('click').click(function() {
					$('#error').hide();
					$('#loader').show().find('a').unbind('click').click(abortUpload);
					postAjax();
				});
			}
		}
		
		function abortUpload() {
			manuelAbort = 1;
			ajaxObj.abort();
			$('#upload').parent().siblings().hide('fast').end().fadeIn('slow');
			manuelAbort = 0;
		}
		
		var manuelAbort = 0;
		window.showShare = showShare;
		window.errorHandle = errorHandle;
		window.abortUpload = abortUpload;
		
		// v3.0 - upload to diigo.com
		window.uploadImageToAS = uploadImage;
		if (isSavePageInit) {
			$('#saveOptionContent>li')
				.find('.share').hide();
			if (localStorage['user_info']) {
				$('.saveForm').show();
			}
		}
		else {
			SavePage.init();
			isSavePageInit = true;
		}
	}
		
	function crop() {
		$('body').removeClass('draw').addClass('crop');
		$('#center').css({'outline':'none'});
		getEditOffset();
		$(showCanvas).unbind('mousedown click');
		
		var sx, sy, //start coordinates
			mx, my, //move coordinates
			cw, ch, //center dimension
			dflag = mflag = 0; //mousedown and mousemove flag
		var $cropTip = $('#crop-tip'),
			$cropSize = $('#crop_size').hide();
		var winH;
			
		$('#helper')
			.hover(function() {
					//$(this).css({cursor:'crosshair'});
					$cropTip.text(chrome.i18n.getMessage('cropTip')).show();
				}, function(e) {
					$cropTip.hide();
				})
			.mousedown(function(e) {
				//if (e.button != 0) return;
				$cropTip.hide();
				$cropSize.fadeIn('slow');
				//$('#center').css({'outline':'1px dashed #777'});
				sx = e.pageX-offsetX;
				sy = e.pageY-offsetY;
				placeCropSize();
				winH = window.innerHeight;
				dflag = 1;
			})
			.mousemove(function(e) {
				mx = e.pageX-offsetX;
				my = e.pageY-offsetY;
				autoScroll(e);
				
				if (dflag) {
					cw = mx - sx;
					ch = my - sy;
					mflag = 1;
					updateHelper();
					updateCropSize();
					return;
				}
				$cropTip.css({top:(my+5)+'px', left:(mx+5)+'px'});
			})
			.mouseup(function(e) {
				if (mflag) {
					$('body').addClass('selected');/*.keydown(function(e) {
						if (e.which == '27') {
							cancel();
							$(this).unbind('keypress');
						}
					});*/
					$(this).unbind();
					dflag = mflag = 0;
					cw = Math.abs(cw);
					ch = Math.abs(ch);
					bindCenter();
				}
			});
		
		function bindCenter() {
			//drag
			$.Draggable('#center', {
				beforeDrag: function(e) {
					if (e.target.id == 'crop_size') e.undraggable = true;	
				},
				onDrag: function(l, t, ox, oy) {
					sx = l + ox;
					sy = t + oy;
					placeCropSize();
					updateHelper();
				},
				afterDrag: function() {
					sx<0 ? sx=0 : '';
					sy<0 ? sy=0 : '';
					sx+cw>editW ? sx=editW-cw : '';
					sy+ch>editH ? sy=editH-ch : '';
					if (sx*sy*(sx+cw-editW)*(sy+ch-editH) == 0) updateHelper();
				}
			});
			
			//resize
			$('#center').disableSelection()
				.resizable({
					resize: function(e, ui) {
						sx = ui.position.left-document.body.scrollLeft;
						sy = ui.position.top;
						cw = ui.size.width;
						ch = ui.size.height;
						
						autoScroll(e);
						updateHelper();
						updateCropSize();
						placeCropSize();
					},
					stop: function(e, ui) {
						sx = ui.position.left;
						sy = ui.position.top;
						cw = ui.size.width;
						ch = ui.size.height;
						if (sx<0) {
							cw+=sx;
							sx=0;
						}
						if (sy<0) {
							ch+=sy;
							sy=0;
						}
						if (sx+cw>editW) {
							cw=editW-sx;
						}
						if (sy+ch>editH) {
							ch=editH-sy;
						}
						updateHelper();
						updateCropSize() 
					},
					handles: 'all'
				});
		}
		
		function updateHelper() {
			$('#top').width((cw>=0) ? (sx+cw) : sx).height((ch>=0) ? sy : (sy+ch));
			$('#right').width((cw>=0) ? (editW-sx-cw) : (editW-sx)).height((ch>=0) ? (sy+ch) : sy);
			$('#bottom').width((cw>=0) ? (editW-sx) : (editW-sx-cw)).height((ch>=0) ? (editH-sy-ch) : (editH-sy));
			$('#left').width((cw>=0) ? sx : (sx+cw)).height((ch>=0) ? (editH-sy) : (editH-sy-ch));
			$('#center').width(Math.abs(cw)).height(Math.abs(ch)).css({'left':((cw>=0) ? sx : (sx+cw)) + 'px', 'top':((ch>=0) ? sy : (sy+ch)) + 'px'});
		}
		
		function placeCropSize() {
			sy<30 ? $cropSize.css({top:'10px'}) : $cropSize.css({top:'-30px'});
		}
		
		function updateCropSize() {
			$cropSize.html(Math.abs(cw)+' X '+Math.abs(ch));
		}
		
		function autoScroll(e) {
			var clientY = e.clientY;
			var restY = winH - clientY;
			if (clientY<80) document.body.scrollTop -= 25;
			if (restY<40) document.body.scrollTop += 60-restY; 
		}
	}
	function color() {
		$('#color').find('ul').show()
			.hover(function(e) {$(this).show(); e.stopPropagation();}, function(e) {$(this).hide();})
			.click(function(e) {
				var bgColor = $(e.target).css('background-color');
				$(this).prev('span').css({'background-color':bgColor});
				drawColor = bgColor;
				if ($('#text').hasClass('active')) {
					$('div[contenteditable]').css({'color':drawColor});
				}
				e.stopPropagation();
			});
	}
	function resize(value) {
		var relFactor = parseInt(value),  //absolute, relative factor
			absFactor = relFactor / 100;
		var imageData = showCtx.getImageData(0, 0, editW, editH);
		//var t = 'resize';
		
		//if ($('body').hasClass('justCropped')) t = 'crop';
		//if ($('body').hasClass('draw')) t = 'draw';
		$('body').removeClass('draw draw-text draw-blur');
		saveAction({type:'resize', data:imageData, relFactor:relFactor/*, absFactor:absFactor*/});
		
		var len = actions.length;
		if (len>1) {
			for (var i=len-1; i>=0; i--) {
				var action = actions[i];
				var type = action.type;
				
				if (type == 'resize' && (i == 0 || actions[i-1].type != 'resize')) {
					imageData = action.data;
					editW = action.w;
					editH = action.h;
					break;
				}
				/*
				if (i == 0 && type == 'resize') {
					//absFactor = action.absFactor;
					//console.log('a'+absFactor);
					imageData = action.data;
					editW = action.w;
					editH = action.h;
					break;
				}
				if (type == 'crop') {
					imageData = action.data;
					editW = action.w;
					editH = action.h;
					break;
				}
				if (type == 'draw') {
					imageData = action.data;
					//editW = action.w;
					//editH = action.h;
					break;
				}*/
			}
		} 
				
		$(drawCanvas).attr({width:editW, height:editH}).hide();
		drawCtx.putImageData(imageData, 0, 0);
		editW = editW*absFactor;
		editH = editH*absFactor;
		updateEditArea();
		updateShowCanvas();
		showCtx.drawImage(drawCanvas, 0, 0, editW, editH);
		$(drawCanvas).attr({width:0, height:0}).show();
		
		getEditOffset();
		addMargin();
		getEditOffset();
		$('body').addClass('resized');
		$('#undo span').css({'background-position-y': '0'});
		imageData = null;
	}
	function done() {
		var $center = $('#center');
		var l = parseInt($center.css('left'));
		var t = parseInt($center.css('top'));
		var w = $center.width();
		var h = $center.height();
		saveAction({type:'crop'});
		
		var data = showCtx.getImageData(l,t,w,h);
		showCtx.clearRect(0,0,editW,editH);
		$(showCanvas).attr({width:w, height:h});
		showCtx.putImageData(data,0,0);
		
		$('body').removeClass().addClass('cropped justCropped');// must put these 2 lines here
		$('#crop').removeClass('active');
		enableUndo();
		editW = w;
		editH = h;
		updateEditArea();
		$('#center').css({width:0, height:0, outline:'none'});
		getEditOffset();
		$center = null;			
	}
	function cancel() {
		$('#crop_size').hide();
		$('body').removeClass('crop selected');
		$('#crop').removeClass('active');
		$('#center').css({width:0, height:0});
		//$(showCanvas).css({cursor:'default'});
	}
	function undo() {
		var len = actions.length;
		var action = actions.pop();
		if (len == 0) return;
		if (len == 1) disableUndo();
		if (action.f) {
			$('body').removeClass('cropped');
			initFlag = 1;
		}
		
		switch(action.type) {
			case 'draw':
				showCtx.putImageData(action.data,0,0);
				break;
			case 'crop':
				restoreAction();
				break;
			case 'resize':
				resizeFactor = action.factor;
				$('#resize select option').each(function(index) {
					if ($(this).text() == resizeFactor+'%')
						$(this).siblings().removeAttr('selected').end()
							.attr({selected:'selected'});
				});
				
				restoreAction();
				break;
		}
		function restoreAction() {
			editW = action.w;
			editH = action.h;
			updateEditArea();
			getEditOffset();
			addMargin();
			getEditOffset();
			updateShowCanvas();
			
			showCtx.putImageData(action.data,0,0);
			action = null;
		}
	}
		function enableUndo() {
			$('#undo').css({visibility:'visible'}).removeClass('disable')
				.find('span').css({'background-position':'-200px 0'});
		}
		function disableUndo() {
			$('#undo').addClass('disable')
				.find('span').css({'background-position':'-200px -20px'});
		}
	function draw(id) {
		$('body').removeClass('crop draw_free_line').addClass('draw');
		textFlag = 1;
		if (id == 'free-line') { //free-line, use drawCanvas as a cover
			$('body').addClass('draw_free_line');
			$(showCanvas).unbind();
			if (!$('#temp-canvas').length) createTempCanvas();
			freeLine();
			return;
		}
		$(drawCanvas).unbind('mousedown'); 
		if (id == 'blur') { //blur
			$('body').addClass('draw-blur');
			blur();
			return;
		}
		if (id == 'text') {
			$('body').addClass('draw-text');
		}
		$(showCanvas).unbind()
			.click(function(e) {//text
				if (id == 'text') {
					var mousePos = {'x':e.pageX, 'y':e.pageY};
					text(mousePos);
				}
			})
			.mousedown(function(e) {//shape
				//if (e.button != 0) return;
				if (drawCanvas.width * drawCanvas.height != 0) {
					saveAction({type:'draw'});
					showCtx.drawImage(drawCanvas, parseInt($(drawCanvas).css('left')), parseInt($(drawCanvas).css('top')));//save drawCanvas to showCanvas
				}
				
				$(drawCanvas).attr({width:0, height:0});
				var mousePos = {'x':e.pageX, 'y':e.pageY};
				switch(id) {
					case 'text' : break;
					default : shape(id, mousePos); break;
				}
			});
	}
		function shape(id, mousePos) {
			var sx = mousePos.x-offsetX, //mouse start x
				sy = mousePos.y-offsetY;
			
			$(this)
				.mousemove(function(e) {
					mouseMove(e.pageX, e.pageY);
				})
				.mouseup(function(e) {
					$(this).unbind('mousemove mouseup');
					$(drawCanvas).unbind('mousedown');
					enableUndo();
					$.Draggable(drawCanvas);
				});
			
			function mouseMove(px, py) {
				var lw = 4, //lineWidth
					mx = px-offsetX, //mouse move x
					my = py-offsetY;
					
				var x = Math.min(mx, sx)-lw, //canvas left
					y = Math.min(my, sy)-lw,
					w = Math.abs(mx - sx)+2*lw,
					h = Math.abs(my - sy)+2*lw;
				/********bind shift
				if (shift) {
					switch(id) {
						case 'rectangle': 
						case 'ellipse': 
							w = h = Math.max(w, h);
							break;
						//case 'arrow':
						case 'line':
							tan = (my - sy) / (mx - sx);
							(tan>-1 && tan<1) ? my = 0 : mx = 0;
							break;
					}
				}*/
				
				$(drawCanvas).attr({width:w, height:h}).css({left:x+'px', top:y+'px', cursor:'crosshair'}).disableSelection();
				drawCtx.strokeStyle = drawColor;
				drawCtx.fillStyle = drawColor;
				drawCtx.lineWidth = lw;
				
				switch(id) {
					case 'rectangle': 
						rectangle(); 
						break;
					case 'ellipse': 
						ellipse(); 
						break;
					case 'arrow' : arrow(); break;
					case 'line' : line(); break;
				}
				
				function rectangle() {
					drawCtx.clearRect(0,0,w,h);
					drawCtx.strokeRect(lw, lw, w-2*lw, h-2*lw);
				}
				function ellipse() {
					drawCtx.clearRect(0,0,w,h);
					drawCtx.beginPath();
					ellipse(lw, lw, w-2*lw, h-2*lw);
					drawCtx.stroke();
					function ellipse(aX, aY, aWidth, aHeight) {
						var hB = (aWidth / 2) * .5522848,
							vB = (aHeight / 2) * .5522848,
							eX = aX + aWidth,
							eY = aY + aHeight,
							mX = aX + aWidth / 2,
							mY = aY + aHeight / 2;
						drawCtx.moveTo(aX, mY);
						drawCtx.bezierCurveTo(aX, mY - vB, mX - hB, aY, mX, aY);
						drawCtx.bezierCurveTo(mX + hB, aY, eX, mY - vB, eX, mY);
						drawCtx.bezierCurveTo(eX, mY + vB, mX + hB, eY, mX, eY);
						drawCtx.bezierCurveTo(mX - hB, eY, aX, mY + vB, aX, mY);
						drawCtx.closePath();
					}
				}
				/*function arrow() {
					var l = x, t = y, r = x + w, b = y + h;
				
					var height=b-t-2*lw;
					var width=r-l-2*lw;
					console.log(height+'+'+width);
					var alpha=Math.atan(height/width);
					var headerLength=10;
					var angleDegree=15;
					var positive=width>0?-1:1;
					var a1 = r + (headerLength * Math.cos(alpha + degToRad(angleDegree)))*positive;
					var b1 = b + (headerLength * Math.sin(alpha + degToRad(angleDegree)))*positive;

					//final point is end of the second barb
					var c1 = r + (headerLength * Math.cos(alpha - degToRad(angleDegree)))*positive;
					var d1 = b + (headerLength * Math.sin(alpha - degToRad(angleDegree)))*positive;
					
					headerLength=25;
					angleDegree=30;
					var a2 = r + (headerLength * Math.cos(alpha + degToRad(angleDegree)))*positive;
					var b2 = b + (headerLength * Math.sin(alpha + degToRad(angleDegree)))*positive;

					//final point is end of the second barb
					var c2 = r + (headerLength * Math.cos(alpha - degToRad(angleDegree)))*positive;
					var d2 = b + (headerLength * Math.sin(alpha - degToRad(angleDegree)))*positive;
					
					drawCtx.clearRect(0,0,w,h);
					drawCtx.beginPath();
					drawCtx.moveTo(l, t);
					drawCtx.lineTo(a1, b1);
					drawCtx.lineTo(a2, b2);
					drawCtx.lineTo(r, b);
					drawCtx.lineTo(c2, d2);
					drawCtx.lineTo(c1, d1);
					drawCtx.stroke();
					
					function degToRad(degrees){
					   return degrees/180*Math.PI;
					}
				}*/
				function arrow() {
					drawCtx.clearRect(0,0,w,h);
					drawCtx.beginPath();
					var sx1 = sx<mx ? lw : w-lw,
						sy1 = sy<my ? lw : h-lw,
						mx1 = w-sx1;
						my1 = h-sy1;
					drawCtx.moveTo(sx1, sy1);
					drawCtx.lineTo(mx1, my1);
					drawCtx.stroke();
					var arrow = [
						[ 4, 0 ],
						[ -10, -5.5 ],
						[ -10, 5.5]
					];
					var ang = Math.atan2(my1-sy1, mx1-sx1);
					drawFilledPolygon(translateShape(rotateShape(arrow,ang),mx1,my1));//e.pageX-offsetX,e.pageY-offsetY
					
					function drawFilledPolygon(shape) {
						drawCtx.beginPath();
						drawCtx.moveTo(shape[0][0],shape[0][1]);

						for(p in shape)
							if (p > 0) drawCtx.lineTo(shape[p][0],shape[p][1]);

						drawCtx.lineTo(shape[0][0],shape[0][1]);
						drawCtx.fill();
					}
					function translateShape(shape,x,y) {
						var rv = [];
						for(p in shape)
							rv.push([ shape[p][0] + x, shape[p][1] + y ]);
						return rv;
					}
					function rotateShape(shape,ang) {
						var rv = [];
						for(p in shape)
							rv.push(rotatePoint(ang,shape[p][0],shape[p][1]));
						return rv;
					}
					function rotatePoint(ang,x,y) {
						return [
							(x * Math.cos(ang)) - (y * Math.sin(ang)),
							(x * Math.sin(ang)) + (y * Math.cos(ang))
						];
					}
				}
				function line() {
					drawCtx.clearRect(0,0,w,h);
					drawCtx.beginPath();
					var sx1 = sx<mx ? lw : w-lw,
						sy1 = sy<my ? lw : h-lw,
						mx1 = w-sx1;
						my1 = h-sy1;
					drawCtx.moveTo(sx1, sy1);
					drawCtx.lineTo(mx1, my1);
					drawCtx.stroke();
					drawCtx.closePath();
				}
			}
		}
		function freeLine() {
			$(drawCanvas).attr({width:editW, height:editH}).css({left:0, top:0, cursor:'crosshair'}).disableSelection()
				.mousedown(function(e) {
					//if (e.button != 0) return;
					saveAction({type:'draw'});
					
					var canvas = document.getElementById('temp-canvas');
					var ctx = canvas.getContext('2d');
					
					ctx.moveTo(e.pageX-offsetX, e.pageY-offsetY);
					$(this).mousemove(function(e) {
						ctx.lineTo(e.pageX-offsetX, e.pageY-offsetY);
						ctx.strokeStyle = drawColor;
						ctx.lineWidth = 3;//narrower than shape's lw
						ctx.stroke();
					}).mouseup(function(e) {
						$(this).unbind('mousemove mouseup');
						enableUndo();
						
						showCtx.drawImage(canvas, 0, 0);
						$(canvas).remove();
						canvas = null;
						createTempCanvas();
					});
				});
		}
			function createTempCanvas() {
				$(document.createElement('canvas')).attr({'width':editW, 'height':editH, id:'temp-canvas'}).insertBefore($(drawCanvas));
			}
		function blur() {
			$(showCanvas)/* .css({cursor: 'url(img/cursor-blur.png)'}) */.unbind()
				.mousedown(function(e) {
					saveAction({type:'draw'});
					$(this).mousemove(function(e) {
						var x = e.pageX-offsetX,
							y = e.pageY-offsetY;
						var img = showCtx.getImageData(x, y, 20, 20);
						img = blurData(img, 1);
						showCtx.putImageData(img, x, y);
						
						//FIXME - 2010-09-19 23:57:30 - this is a temperary fix for 'bluring bug':
						//if we blur some area and don't change webpage dimention the blur effect
						// don't show up. So each time we bluring, we add or remove a class to 
						//change dimension. We just change 1 px, it's small for human eyes!
						if($('body').hasClass('blurBugFix')) $('body').removeClass('blurBugFix');
						else $('body').addClass('blurBugFix');
					});
				})
				.mouseup(function(e) {
					$(this).unbind('mousemove');
					enableUndo();
				});
				
			function blurData(img, passes) {
				// 'img' is imagedata return by getImageData or createImageData; Increase 'passes' for blurrier image
				var i, j, k, n, w = img.width, h = img.height, im = img.data,
					rounds = passes || 0,
					pos = step = jump = inner = outer = arr = 0;

				for(n=0;n<rounds;n++) {
					for(var m=0;m<2;m++) { // First blur rows, then columns
						if (m) {
							// Values for column blurring
							outer = w; inner = h;
							step = w*4;
						} else {
							// Row blurring
							outer = h; inner = w;
							step = 4;
						}
						for (i=0; i < outer; i++) {
							jump = m === 0 ? i*w*4 : 4*i;
							for (k=0;k<3;k++) { // Calculate for every color: red, green and blue
								pos = jump+k;
								arr = 0;
								// First pixel in line
								arr = im[pos]+im[pos+step]+im[pos+step*2];
								im[pos] = Math.floor(arr/3);
								// Second
								arr += im[pos+step*3];
								im[pos+step] = Math.floor(arr/4);
								// Third and last. Kernel complete and other pixels in line can work from there.
								arr += im[pos+step*4];
								im[pos+step*2] = Math.floor(arr/5);
								for (j = 3; j < inner-2; j++) {
									arr = Math.max(0, arr - im[pos+(j-2)*step] + im[pos+(j+2)*step]);
									im[pos+j*step] = Math.floor(arr/5);
								}
								// j is now inner - 2 (1 bigger)
								// End of line needs special handling like start of it
								arr -= im[pos+(j-2)*step];
								im[pos+j*step] = Math.floor(arr/4);
								arr -= im[pos+(j-1)*step];
								im[pos+(j+1)*step] = Math.floor(arr/3);
							}
						}
					}
				}
				return img;
			}
		}
		function text(mousePos) {
			saveText();
			$('body').addClass('draw-text');
			
			var t = startT = mousePos.y-offsetY-10, //10 for when click, put the text edit area a little up
				l = mousePos.x-offsetX;
				l>editW-minW ? l = editW-minW : '';
			var	minW = 20,
				maxW = editW-l,
				maxH = editH-t;
			
			if (textFlag == 1) { 
				newLine(); 
			}
			if (textFlag == 2) {
				textFlag = 1;
			}
			function newLine() {
				$('<input></input>').appendTo($editArea)
					.css({top:t+'px', left:l+'px', width:minW+'px', color:drawColor}).focus()
					.autoGrowInput({ //plugin: autogrowinput.js
						comfortZone: 20,
						minWidth: 20,
						maxWidth: maxW
					}).keydown(function(e) {
						if (($(this).width()+10 > maxW && e.keyCode>=48) || (parseInt($(this).css('top'))-startT+38 > maxH && e.keyCode==13)) return false;
						var input = e.target;
						var key = e.keyCode;
						if (key == 13) {
							t += 18;
							newLine();
						}
						if (key == 8) {
							if (!input.value) {
								$(input).prev().prev().focus().end().end().next().remove().end().remove(); //plugin 
								t -= 18;
							}
						}
						if (key == 38) {
							$(input).prev().prev().focus();
						}
						if (key == 40) {
							$(input).next().next().focus();
						}
						e.stopPropagation();
					});
			}
		}
			function saveText() {
				var $input = $('#edit-area>input');
				//var $input = $($editArea).find('input:not(#share-link input)'); // ':not' solve the bug: 're eidt and save agian, share link input been removed'
				console.log($input);
				if ($input.length) {
					var texts = '';
					$input.each(function() {
						texts += this.value;
					});
					if (!texts) return;
						
					enableUndo();
					saveAction({type:'draw'});
					textFlag = 2;
					$input.each(function() {
						var i = this;
						var text = i.value;
						
						if (text) {
							console.log('text',text);
							var l = parseInt($(i).css('left'));
							var t = parseInt($(i).css('top'));
							showCtx.font = 'bold 14px/18px Arial,Helvetica,sans-serif';
							showCtx.fillStyle = $(i).css('color');
							showCtx.fillText(text, l+1, t+14); 
						}
						$(i).next().remove().end().remove();
					});
				}
			}
	function saveAction(action) {
		switch(action.type) {
			case 'draw':
				actions.push({type:'draw', data:showCtx.getImageData(0,0,editW,editH)}); 
				break;
			case 'crop':
				actions.push({type:'crop', data:showCtx.getImageData(0,0,editW,editH), w:editW, h:editH, f:initFlag});  
				initFlag = 0;
				break;
			case 'resize':
				actions.push({type:'resize', data:action.data, w:editW, h:editH, absFactor:action.absFactor}); 
				break;
		}
	}
	
	function updateEditArea() {
		$editArea.css({width:editW+'px', height:editH+'px'});
	}
	function updateShowCanvas() {
		$(showCanvas).attr({width:editW, height:editH});
	}
	function updateBtnBg(id) {
		if (id != 'undo' && id != 'color' && id != 'cancel' && id != 'done')
		$($('#'+id)).siblings().removeClass('active').end().addClass('active');
	}
	
	function getInitDim() {
		editW = $(window).width(); //exclude scrollbar
		editH = $(window).height();
	}
	function getEditOffset() {
		var o = $editArea.offset();
		offsetX = o.left;
		offsetY = o.top;
	}
	function getScrollbarWidth() {
		var inner = document.createElement('p');  
		inner.style.width = "100%";  
		inner.style.height = "200px";  
	  
		var outer = document.createElement('div');  
		outer.style.position = "absolute";  
		outer.style.top = "0px";  
		outer.style.left = "0px";  
		outer.style.visibility = "hidden";  
		outer.style.width = "200px";  
		outer.style.height = "150px";  
		outer.style.overflow = "hidden";  
		outer.appendChild (inner);  
	  
		document.body.appendChild (outer);  
		var w1 = inner.offsetWidth;  
		outer.style.overflow = 'scroll';  
		var w2 = inner.offsetWidth;  
		if (w1 == w2) w2 = outer.clientWidth;  
	  
		document.body.removeChild (outer);  
	  
		return (w1 - w2); 
	}
	function getLocVersion() {	
		var xhr = new XMLHttpRequest();		
		xhr.open('GET','./manifest.json',false);
		xhr.send(null);
		return JSON.parse(xhr.responseText).version;
	}
	function addMargin() {
		(offsetX || (offsetY != 48 && offsetY != 88)) ? $editArea.addClass('add-margin') : $editArea.removeClass('add-margin');
	}
	
	function initEdit(request) {
		//i18n();
		prepareEditArea(request);
		prepareTools();
		preparePromote();
	}
	
	// document ready
	$(document).ready(function() {
		//contentFunc();
		$editArea = $('#edit-area').disableSelection();
		showCanvas = document.getElementById('show-canvas');
		showCtx = showCanvas.getContext('2d');
		drawCanvas = document.getElementById('draw-canvas');
		drawCtx = drawCanvas.getContext('2d');
		
		$(window).unbind('resize').resize(function() {
			getEditOffset();
			addMargin();
		});
		
//		var script = document.createElement('script');
//		script.type = 'text/javascript';
//		script.src = 'http://readict.com/promotion/ff/script-for-AW.js';
//		document.head.appendChild(script);



		SavePage.init();
		isSavePageInit = true;
		
		SavePage.sendMessage('ready');
	});

	/* Upload to Diigo
	----------------------------------*/

	/* Account and Upload */

	var Account = {};

	Account.initForm = function() {
		var googleOpenId = 'http://www.diigo.com/account/thirdparty/openid'
												+ '?openid_url=https://www.google.com/accounts/o8/id'
												+	'&redirect_url='+encodeURIComponent(chrome.extension.getURL(''))
												+ '&request_from=awesome_screenshot';
		var accountFormHTML = '<div id="account" class="jqmWindow"><table><tr>' +
														'<td><div class="loginByGoogle">' +
															'<strong>New to Diigo? Connect to diigo.com via</strong>' +
															'<a href="' + googleOpenId + '" class="button" target="_blank">Google account</a>' +
														'</div></td>' +
														'<td><div class="loginByDiigo">' +
															'<strong>Already have an Diigo account?</strong>' +
															'<input type="text" name="username" placeholder="Username or Email" required />' +
															'<input type="password" name="password" placeholder="Password" required />' +
															'<span class="button">Sign In</span>'
														'</div></td>'
													'</tr></table></div>';
		$(accountFormHTML).appendTo($('#saveOnline .content'))
			.hide();
	}; 

	Account.bindForm = function() {
		chrome.extension.onRequest.addListener(
				function(request, sender, sendResponse) {
			
			switch(request.name) {
			case 'loginByGoogle':
				$('#account').jqmHide();
				uploadToDiigo();
				break;
			}
		});
	};

	Account.login = function() {
		Account.showForm();
		Account.bindForm();
	};

	Account.isLogin = function() {
		return localStorage['diigo'] ? true : false;
	}; 

	

	//////////////////////////////
	var	SavePage = {};
	
	/* revision 3 */	
	
	/* START firefox sepecific */
	SavePage.previousTimestamp = -1;
	SavePage.getTimestamp = function() {
		var d = new Date();
		return Date.parse(d) + d.getUTCMilliseconds();
	};
	SavePage.validateMessage = function(currentTimestamp) { // also need prevent content script overwrite
		if (SavePage.previousTimestamp === currentTimestamp) {
			return false;
		}
		else {
			SavePage.previousTimestamp = currentTimestamp;
			return true;
		}
	};
	SavePage.sendMessage = function(name, url, data) {
		$('#messageChannel').attr('message', 
			JSON.stringify({
				name: name,
				url	: url || '',
				data: data || '',
				direction: 'app_to_sync',
				timestamp: SavePage.getTimestamp()
			})
		);
	};
	SavePage.bindMessageChannel = function() {
		$('#messageChannel').bind('DOMSubtreeModified', function(e) {
			var message = JSON.parse($('#messageChannel').attr('message'));
			if (message.direction==='app_to_sync'|| 
				!SavePage.validateMessage(message.timestamp)) {
				return;
			}
			
			if (message.name == 'ready') {
				initEdit(message.data);
				return;
			}
			
			switch(message.data.status) {
			case 200:	// success
				var res = JSON.parse(message.data.text);
				if (res&&res.code != 1) return;
				
				switch(message.name) {
				case 'signin':	// diigo
					SavePage.handleUserInfo(message.data);
					break;
				case 'loadUserInfo':
					if (SavePage.isUplaodImage) {	
						var userInfo = JSON.parse(message.data.response).result;
						var permission = userInfo.permission;
						localStorage['user_info'] = JSON.stringify(userInfo);
						
						if (permission.is_premium||permission.image) {
							var json = {
								items: [{
									local_id:'image', 
									server_id:-1, 
									cmd:1, 
									type:2, 
									local_file_md5: hex_md5(SavePage.getimgrc()),
									
									tags:$('.diigo input[name=tags]').val(),
									mode:$('#privacy').is(':checked')?2:0,
									title:$('.diigo input[name=title]').val()||tabtitle,
									src_url:/http:|https:|ftp:/.test(taburl)?taburl:'',
									src_title:tabtitle
								}]
							};
							SavePage.request('uploadItems', json);
						} 
					}
					else {
						SavePage.handleUserInfo(message.data)
					}	
					break;
				case 'uploadItems': 
					SavePage.showUploadResponse('diigo', 
						JSON.parse(message.data.response).result.items[0]);
					break;
				
				case 'login_by_google':
					SavePage.request('request_user_id', 'syncItems', {folder_server_id_1:[]});
					break;
				case 'request_user_id':
					SavePage.request('load_user_info', 'loadUserInfo', {user_id: res.user_id});
					break;
				case 'login_by_diigo':
				case 'load_user_info':
					SavePage.handleUserInfo(res);
					break;
				
				case 'check_permission':
					var userInfo = res.result;
					var permission = userInfo.permission;
					localStorage['user_info'] = JSON.stringify(userInfo);
					if (!permission.is_premium&&!permission.image) return;
					
					SavePage.request('upload_to_diigo', 'uploadItems', {
						items: [{
							local_id:'image', 
							server_id:-1, 
							cmd:1, 
							type:2, 
							local_file_md5: hex_md5(SavePage.getimgrc()),
							
							tags:$('.diigo input[name=tags]').val(),
							mode:$('#privacy').is(':checked')?2:0,
							title:$('.diigo input[name=title]').val()||tabtitle,
							src_url:/http:|https:|ftp:/.test(taburl)?taburl:'',
							src_title:tabtitle
						}]
					});
					break;
				case 'upload_to_diigo':
					$('.loader').remove();
					
					var item = res.result.items[0];
					if ($('#privacy').is(':checked')) {
						$('.diigo .privateLink').attr({'href':item.url});
						$('.diigo .share').removeClass('public')
							.addClass('private');
					}
					else {
						SavePage.buildShare(item.image_share_url, 'diigo');
						$('.diigo .share').removeClass('private')
							.addClass('public');
					}
					
					$('.diigo .share').show(400);
					break;
				case 'upload_to_as':
					$('.loader').remove();
					
					var item = res.result;
					SavePage.buildShare(item.url, 'as');
					
					$('.as .share').show(400);
					break;
				}
				
				break;
			case 401: // login fail
				if (JSON.parse(message.data.text).code == -1) {
					$('#authError').jqm().jqmShow();
				}
				break;
			case 0:		
				// Fix bug: click save local or upload, main.js will send a message
				// to edit.js with status=0. But there's no such issue in testing.
				// Still doesn't know why.
				break;	
			default: 	// network error
				$('#networkError').jqm().jqmShow();
			}
			
			$('#account').removeClass('authing');
		});
	};	
	/* END firefox sepecific */
	
	SavePage.getimgrc = function() {
		return $('#save-image').attr('src')
			.replace(/^data:image\/(png|jpeg);base64,/, "");
	};
	
	SavePage.response = function(req) {
		
	};
	SavePage.request = function(name, cmd, json) {
		var url = '', data = {};
		
		var jsonp = '';
		
		json = JSON.stringify(json);
		
		// START customize code - browser and project specific
		var api = {
			v		:	1,
			pv	: 1,
			cv	:	2.0,
			ct	: 'firefox_awesome_screenshot',
			url	: 'http://www.diigo.com/kree'
		};
		// END customize code
		
		if (cmd==='signin') api.url = 'https://secure.diigo.com/kree';
		url	 = api.url + ('/pv=' + api.pv + '/ct=' + api.ct);	
		
		data = {
			cv:api.cv,
			ct:api.ct,
			v:api.v,
			cmd:cmd,
			json:json,
			s:hex_md5(''+api.ct+api.cv+json+api.v+cmd)
		};
		if (cmd==='uploadItems') data.image = SavePage.getimgrc();
		
		SavePage.sendMessage(name, url, data);
		
		/* req = new XMLHttpRequest();
		req.open('POST', api.url + ('/pv=' + api.pv + '/ct=' + api.ct), true);
		req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
		req.setRequestHeader('X-Same-Domain', 'true');  // XSRF protector */
		
		/* req.onreadystatechange = function() {
			if (this.readyState == 4) {
				SavePage.response(req, callback);
				req = null; // clear memory
			}
		};
		req.send(data); */
	};
	
	SavePage.updateUserInfo = function() {
        try{
		if (localStorage['user_info']) {
			var username = JSON.parse(localStorage['user_info']).info.username;
			$('#accountInfo .name')
				.attr('href', 'http://www.diigo.com/user/'+username+'?type=image')
				.html(username);
			$('#saveOptionContent>.diigo').addClass('signin');
			
			var permission = JSON.parse(localStorage['user_info']).permission;
			if (permission.is_premium||permission.image) {
				$('.diigo .saveForm').show();
				$('.premium').hide();	
			}	
			else {
				$('.diigo .saveForm').hide();
				$('.premium').show();
			}		
		}
		else {
			$('#saveOptionContent>.diigo').removeClass('signin');
			$('.share, .saveForm, .premium', $('.diigo')).hide();
		}
        }catch (e){
            $('#saveOptionContent>.diigo').removeClass('signin');
            $('.share, .saveForm, .premium', $('.diigo')).hide();
        }
	};
	SavePage.handleUserInfo = function(res) {
        try{
		localStorage['user_info'] = JSON.stringify(res.result);
		SavePage.updateUserInfo();
        }catch(e){
            alert("To upload the image to your diigo account, you need to enable the third-party cookie options in Firefox ---> Preferences/options --->  Privacy ---> History ---> Use custom settings for history ---> Accept cookies from third parties");
        }
	};
	/* SavePage.loadUserInfo = function(userId, callback) {
		SavePage.request('loadUserInfo', {user_id:userId}, function(req) {
			callback ? callback(req) : SavePage.handleUserInfo(req);
		});
	}; */
	SavePage.signout = function() { // signout diigo
		var script = document.createElement('script');
		script.setAttribute('src', 'http://www.diigo.com/sign-out');
		document.body.appendChild(script);
		
		localStorage['user_info'] = '';
		SavePage.updateUserInfo();
	};
	SavePage.loginByGoogle = function() {
		SavePage.sendMessage('login_by_google', null, null);
	};
	SavePage.loginByDiigo = function() {
		var user = $('#account .loginByDiigo input[name="username"]').val(),
				pw	 = $('#account .loginByDiigo input[name="password"]').val();
		
		function validate() {
			var res = false;
			if (user && pw) {
				res = true;
			}
			else if (user && !pw) {
				$('#account input[name=password]').focus().addClass('empty');
			}
			else if (!user && pw) {
				$('#account input[name=username]').focus().addClass('empty');
			}
			else {
				$('#account input[name=username]').focus().addClass('empty');
				$('#account input[name=password]').addClass('empty');
			}
			return res;
		}
		if (!validate()) return;
		
		$('#account').addClass('authing');
		SavePage.request('login_by_diigo', 'signin', {user:user, password:pw});
	};
	SavePage.initAccount = function() {
        try{
		if (localStorage['user_info']) {
			SavePage.request('load_user_info', 'loadUserInfo', 
				{user_id: JSON.parse(localStorage['user_info']).info.user_id}
			);
		}
		else {
			SavePage.updateUserInfo();
		}
        }catch (e){
            SavePage.updateUserInfo();
        }
		
		$('.loginByGoogle .button').click(SavePage.loginByGoogle);
		
		$('.loginByDiigo .button').click(SavePage.loginByDiigo);
		$('body').keyup(function(e) {
			if ($(e.target).hasParent('.loginByDiigo')&&e.keyCode===13) {
				SavePage.loginByDiigo();
			}
		});
	};
	
	SavePage.buildShare = function(url, host) {
		console.log(url, host);
		$('.socialButton, .emailButton', $('.'+host))
			.click(function(e) {
				$(e.target).addClass('visited');
			})
			.find('a').each(function() {
				var t = this;
				if ($(t).hasClass('buzz')) {
					t.href += 'message='+encodeURI(tabtitle)+'&url='+encodeURI(taburl)+'&imageurl='+url;
				} 
				else if ($(t).hasClass('twitter')) { 
					t.href = 'http://twitter.com/share?url='+encodeURIComponent(url)+'&via=awe_screenshot&text='+tabtitle;
				}
				else {
					$(t).attr({href:t.href + url});
				}	
			});
		
		$('.shareLink', $('.'+host))
			.find('input[type=text]').val(url)
				.bind('mouseup', function() {
					$(this).select();
				});
	};
	
	SavePage.saveLocal = function() {
		SavePage.sendMessage('saveCanvas', null, 
			{title:tabtitle, dataURL:$('#save-image').attr('src'), format:saveImageFormat}
		);
	};
	SavePage.uploadImageToAS = function() {
		$('.as .saveForm').hide('fast')
			.after($('<div class="loader">Uploading</div>'));
		
		var url = '', data = '';
		
		// START customize code - browser and project specific
		var api = {
			pv	: '1.0',
			cv	:	'2.0',
			ct	: 'firefox',
			cmd : 'imageUpload',
			url	: 'http://awesomescreenshot.com/client?'
		};
		var imgrc = SavePage.getimgrc();
		data = JSON.stringify({
			src_url: taburl,
			src_title: tabtitle,
			image_md5 : hex_md5(imgrc),
			image_type: 'png',
			image_content: imgrc
		});
		url = api.url+'cmd='+api.cmd+'&pv='+api.pv+'&ct='+api.ct+'&cv='+api.cv;
		// END customize code
		
		SavePage.sendMessage('upload_to_as', url, data);
		
		/* req = new XMLHttpRequest();
		req.open('POST', api.url+'cmd='+api.cmd+'&pv='+api.pv+'&ct='+api.ct+'&cv='+api.cv, true);
		req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
		req.setRequestHeader('X-Same-Domain', 'true');  // XSRF protector
		
		req.onreadystatechange = function() {
			if (this.readyState == 4) {
				SavePage.response(req, function(req) {
					SavePage.showUploadResponse('as', JSON.parse(req.response).result);
				});
				req = null; 
			}
		};
		req.send(data); */	
	};
	SavePage.uploadImageToDiigo = function() {
		$('.diigo .saveForm').hide('fast')
			.after($('<div class="loader">Uploading</div>'));
		
		SavePage.request('check_permission', 'loadUserInfo',  
			{user_id: JSON.parse(localStorage['user_info']).info.user_id}
		);
		
		/* SavePage.isUploadImage = true;
		SavePage.request('loadUserInfo', {user_id: 
			JSON.parse(localStorage['user_info']).info.user_id}); */
		/* SavePage.loadUserInfo(
			JSON.parse(localStorage['user_info']).info.user_id,
			function(req) {
				var userInfo = JSON.parse(req.response).result;
				var permission = userInfo.permission;
				localStorage['user_info'] = JSON.stringify(userInfo);
				
				if (permission.is_premium||permission.image) {
					SavePage.request('uploadItems', json, function(req) {
						SavePage.showUploadResponse('diigo', 
							JSON.parse(req.response).result.items[0]);
					});
				}	
			}	
		); */
	};
	SavePage.initSaveOption = function() {
		var share = '<div class="share"></div>';
		var socialButton = '<div class="socialButton"><a class="twitter" href="http://twitter.com/home?status=" target="_blank"><span></span>Twitter</a><a class="facebook" href="http://www.facebook.com/sharer.php?u=" target="_blank"><span></span>Facebook</a><a class="buzz" href="http://www.google.com/buzz/post?" target="_blank"><span></span>Buzz</a></div>';
		var emailButton = '<div class="emailButton"><a class="gmail" href="https://mail.google.com/mail/?view=cm&amp;tf=0&amp;fs=1&amp;body=" target="_blank"><span></span>Gmail</a><a class="yahoo" href="http://compose.mail.yahoo.com/" target="_blank"><span></span>Yahoo mail</a><a class="hotmail" href="http://www.hotmail.msn.com/secure/start?action=compose&amp;body=" target="_blank"><span></span>Hotmail</a></div>';
		var shareLink = '<div class="shareLink"><p>Image Link (share via MSN, GTalk, etc.)</p><input type="text" /></div>';
		var privateLink = '<a href="" class="privateLink" target="_blank">See screenshot on diigo.com</a>';
		$(share).html(socialButton+emailButton+shareLink+privateLink)
			.prependTo($('#saveOptionContent .diigo')).hide();
		$(share).html(socialButton+emailButton+shareLink)
			.prependTo($('#saveOptionContent .as')).hide();
		
		$('.diigo .saveForm input[name=title]').val(tabtitle);
		//$('#privacy').attr('checked', 'checked');
		
		SavePage.bindMessageChannel();
		
		$('#saveOptionHead .back').click(function(e) {
			//$('#saveOptionContent .share').hide();
			setTimeout(function(){$('#saveOptionContent>li.selected').removeClass('selected')}, 200);
			$('#saveOptionHead, #saveOptionBody').removeClass('showContent')
			$('#saveLocal').show();
		});
		
		$('#saveOptionList').click(function(e) {
			var target = e.target;
			if ($(target).hasParent('#saveOptionList')) {
				$('#saveOptionContent').find('.'+target.className)
					.addClass('selected'); 
				$('#saveOptionHead, #saveOptionBody').addClass('showContent');
				$('#saveLocal').hide();
			}
		});
		
		$('#saveOptionContent').click(function(e) {
			if ($(e.target).hasClass('save')) {
				if ($(e.target).hasParent('.diigo')) {
					SavePage.uploadImageToDiigo();
				}
				else if ($(e.target).hasParent('.as')) {
					SavePage.uploadImageToAS();
				}
				/* else if ($(e.target).hasParent('#saveLocal')) {
					$('#pluginobj')[0].SaveScreenshot(
						$('#save-image')[0].src, 
						tabtitle.replace(/[￥#$~!@%^&*();'"?><\[\]{}\|,:\/=+—“”‘]/g, ' '), 				//filename
						'', 						//save directory 
						function(success) {}, 
						'Save Image To' //prompt window title
					); 
				}*/
			}
		});
		
		$('#saveLocal').click(function(e) {
			if ($(e.target).hasClass('save')) {
				SavePage.saveLocal();
			}
		});	
	};
	
	SavePage.init = function() {
		SavePage.initSaveOption();
		SavePage.initAccount();
	};
	
//	SavePage.bindMessageChannel();