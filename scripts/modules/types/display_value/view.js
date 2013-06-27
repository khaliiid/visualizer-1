define(['modules/view'], function(Default) {
	
	function view() {};
	view.prototype = $.extend(true, {}, Default, {

		init: function() {	
			var html = "";
			html += '<div></div>';
			this.dom = $(html).css('display', 'table').css('height', '100%').css('width', '100%');
			this.module.getDomContent().html(this.dom);

			var cfg = this.module.getConfiguration(), view = this;
			view.fillWithVal(cfg.defaultvalue || '');
		},
		
		onResize: function() {
			
		},
		
		blank: function() {
			this.dom.empty();
		},
		
		inDom: function() {},

		update2: {

			'color': function(color) {
				if(color === undefined)
					return;
				this.module.getDomContent().css('backgroundColor', color);
			},

			'value': function(moduleValue) {

				var cfg = this.module.getConfiguration(), view = this;
				CI.RepoHighlight.kill(this.module.id);
				
				if(moduleValue == undefined)
					view.fillWithVal(cfg.defaultvalue || '');
				else
					CI.DataType.toScreen(moduleValue, this.module).done(function(val) {

						try {
							if(cfg.sprintf && cfg.sprintf != "") {
								val = sprintf(cfg.sprintf, val);
								view.fillWithVal(val);	
							} else {
								view.fillWithVal(val);
							}
							
						} catch(e) {
							view.fillWithVal(val);
						}
					});
			}
		},
		
		fillWithVal: function(val) {
			
			var cfg = this.module.getConfiguration();
			
			var div = $("<div />").css({
				fontFamily: cfg.font || 'Arial',
				fontSize: cfg.fontsize || '10pt',
				color: cfg.frontcolor || '#000000',
				display: 'table-cell',
				'vertical-align': cfg.valign || 'top',
				textAlign: cfg.align || 'center',
				width: '100%',
				height: '100%'
			}).html(val);

			this.dom.html(div);
			CI.Util.ResolveDOMDeferred(div);
		},
		
		getDom: function() {
			return this.dom;
		},
		
		typeToScreen: {}
	});

	return view;
});