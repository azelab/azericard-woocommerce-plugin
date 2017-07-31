/**
 *
 *Custom Google Analytics
 *
 */

if (BrowserDetect.OS == 'Windows' || BrowserDetect.OS == 'Linux') {

var _gaq = _gaq || [];
	_gaq.push(['_setAccount', 'UA-295754-20']);
	_gaq.push(['_trackPageview']);
	
(function() {
	var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
	ga.src = 'https://ssl.google-analytics.com/ga.js';
	(document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(ga);
})();

function init() {
	switch (document.body.className) {
	case 'popup_page':
		trackPopup();
		break;
	case 'edit_page':
		trackEdit();
		break;
	case 'options_page':
		trackOptions();
		break;
	}

	function trackPopup() {
		var ul = document.getElementsByTagName('ul')[0];
		ul.addEventListener('click', clickHandler, false);
		
		function clickHandler(e) {
			_gaq.push(['_trackEvent', 'Captures', e.target.id, 'capture']);
		}
	}
	
	function trackEdit() {
		//track tool-panel link
		$('#tool-panel>a').click(function(e) {
			_gaq.push(['_trackEvent', 'Annotations', e.target.id, 'click']);
		});
	
		//track annotation panel
		$('#tool-panel>div, #feedback').click(function(e) {
			var target = getTarget(e.target);
			if (target.nodeName == 'DIV') 
				return;
			_gaq.push(['_trackEvent', 'Annotations', target.id, 'click']);
			function getTarget(t) {
				var node = t.nodeName;
				if ((node != 'A' && node != 'DIV') || t.parentNode.nodeName=='LI' || t.parentNode=='LI') { 
					t = t.parentNode;
					getTarget(t);
				}
				return t;
			}
		});
		
		$('#save').click(function(e) {
			//track re-edit
			$('#re-edit').click(function(e) {
				_gaq.push(['_trackEvent', 'SavePageActions', 're_edit', 'click']);
				$('#save-tip').unbind('click', saveTipTrackClickHandler);
			});
			
			//track all links in #save-tip
			$('#save-tip').click(saveTipTrackClickHandler);
		});
		
		function saveTipTrackClickHandler(e) {
			if (e.target.tagName == 'A') {
				_gaq.push(['_trackEvent', 'SavePageActions', $(e.target).attr('id'), 'click']);
				
				//track image file size
				/* if (e.target.id == 'upload') {
					//jpg 
					if (!localStorage['format'] || localStorage['format']=='jpg' || isPngCompressed) {
						_gaq.push([
							'_trackEvent', 
							isPngCompressed ? 'Image/JPG_by_PNG' : 'Image/JPG', 
							'file_size', 
							getGALabel($('#save-image').attr('src').length / (1024*1024))
						]);
					}
					
					//png
					if (localStorage['format'] || localStorage['format']=='png') {
						var src;
						if (!isPngCompressed)
							src = $('#save-image').attr('src');
						else 
							src = showCanvas.toDataURL();
						
						_gaq.push(['_trackEvent', 'Image/PNG', 'file_size', 
							getGALabel(src.length / (1024*1024))
						]);
					}
				} 
				*/
			}
			
			//share link 
			if (e.target.tagName == 'INPUT') {
				_gaq.push(['_trackEvent', 'SavePageActions', 'share_link', 'click']);
			}
			
			function getGALabel(imageFileSize) {
				var label = '0.0Mb';
				
				if (imageFileSize<=0.2) 
					label = '0.2Mb';
				else if (imageFileSize<=0.4) 
					label = '0.4Mb';
				else if (imageFileSize<=0.6) 
					label = '0.6Mb';
				else if (imageFileSize<=1.0) 
					label = '1.0Mb';
				else if (imageFileSize<=1.5) 
					label = '1.5Mb';
				else if (imageFileSize<=2.0) 
					label = '2.0Mb';
				else if (imageFileSize<=3.0) 
					label = '3.0Mb';
				else if (imageFileSize<=4.0) 
					label = '4.0Mb';
				else if (imageFileSize<=5.0) 
					label = '5.0Mb';
				else
					label = '>5.0Mb';
				
				return label;
			}
		}
		
		//track promote
		$('#feedback').click(function(e) {
			if (e.target.tagName == 'A') {
				/* alert($(e.target).parent().attr('id')); */
				_gaq.push(['_trackEvent', 'SavePageActions', $(e.target).parent().attr('id'), 'click']);
			}
		});
	}
	
	function trackOptions() {
		$('#action_panel').click(function(e) {
			if (e.target.tagName == 'INPUT') {
				switch (e.target.value) {
				case 'Reset':
					_gaq.push(['_trackEvent', 'OptionsPageActions', 'Reset', 'click']);
					break;
				case 'Save':
					_gaq.push(['_trackEvent', 'OptionsPageActions', 'Save', 'click']);
					break;
				case 'Close':
					_gaq.push(['_trackEvent', 'OptionsPageActions', 'Close', 'click']);
					break;
				}
			}
		});
	}
}

window.onload = init;
}