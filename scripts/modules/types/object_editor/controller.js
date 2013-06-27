
define(function(['modules/defaultcontroller'], function(Default)) {
	
	function controller() {};
	controller.prototype = $.extend(true, {}, Default, {
			
		configurationSend: {
			events: {
				
			},
			rels: {
				
			}			
		},
		
		configurationReceive: {
			source: {
				type: ["object"],
				label: 'Object source',
				description: 'An object to edit'
			},

			sourcepartial: {
				type: ["object"],
				label: 'Partial object',
				description: ''
			}		
		},
		
		moduleInformations: {
			moduleName: 'Object editor'
		},
		
		doConfiguration: function(section) {

			var group = section.addFieldGroup(new BI.Forms.GroupFields.List('xml'));

			var type = group.addField({
				type: 'Textarea',
				name: 'xml',
				title: new BI.Title('XML')
			});

			var type = group.addField({
				type: 'Checkbox',
				name: 'labels',
				title: new BI.Title('Display labels')
			});
			type.implementation.setOptions({'display': ''});
			return true;
		},
		
		doFillConfiguration: function() {
			var xml = this.module.getConfiguration().xml || '';
			var label = this.module.getConfiguration().labels;
			if(label == undefined)
				label = true;
			
			return {	
				groups: {
					xml: [{
						xml: [xml],
						labels: [label ? ['display'] : []]	
					}]
				}
			}
		},
		
		doSaveConfiguration: function(confSection) {
			
			this.module.getConfiguration().xml = confSection[0].xml[0].xml[0];
			this.module.getConfiguration().labels = !!confSection[0].xml[0].labels[0][0];
		},

		"export": function() {
			//return this.module.view.table.exportToTabDelimited();
		}

	});

	return controller;
});