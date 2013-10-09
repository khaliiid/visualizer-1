define(['modules/defaultview','util/api','util/util','util/datatraversing', 'util/typerenderer', 'ChemDoodle'], function(Default, API, Util, Traversing, Renderer) {
	
	function view() {};
	view.prototype = $.extend(true, {}, Default, {

		init: function() {	
			this._id = Util.getNextUniqueId();
			//this.dom = $('<canvas id="' + this._id + '"></div>');
			this.module.getDomContent().html(this.dom);
			this._highlighted = {};

			this.typeToScreen.molfile2D = this.typeToScreen.mol2d;
		},
		
		inDom: function() {
/*
			var canvas = new ChemDoodle.ViewerCanvas(this._id, 100, 100);

			canvas.specs.backgroundColor = "transparent";
			canvas.specs.bonds_width_2D = .6;
			canvas.specs.bonds_saturationWidth_2D = .18;
			canvas.specs.bonds_hashSpacing_2D = 2.5;
			canvas.specs.atoms_font_size_2D = 10;
			canvas.specs.atoms_font_families_2D = ['Helvetica', 'Arial', 'sans-serif'];
			canvas.specs.atoms_displayTerminalCarbonLabels_2D = true;

			this._canvas = canvas;*/

		},

		onResize: function(width, height) {

			this._height = height - 20;
			this._width = width - 20;

			if(this.def && this.def.canvas)
				this.def.canvas.resize(width - 20, height - 20);
			
			this.drawMolecule();
		},
		
		update: {
			'mol2d': function(moduleValue, canDoAtomLabels) {
				
				if(!moduleValue)
					return;

				API.killHighlight(this.module.id);
				this._lastMol = moduleValue;
				var view = this, self = this;
				var type = Traversing.getType(moduleValue);

//				moduleValue = moduleValue.get();

				var def = Renderer.toScreen(moduleValue, this.module, this._id);
				this.def = def;
				

				this.def.always(function(mol) {

					view.module.getDomContent().html(mol);

					if(!view.def.build)
						return;

					view.def.build();

					view._molecule = view.def.canvas;
					var atoms = view._molecule.atoms;
					if(canDoAtomLabels && self._atomLabels) {
						for(var i = 0, l = self._atomLabels.length; i < l; i++) {
							if(atoms[i])
								atoms[i].altLabel = self._atomLabels[i] == "" ? null : (self._atomLabels[i] || null);
						}
					} else {
						this._atomLabels = false;
					}

				//	view.drawMolecule();

					view.def.canvas.CIOnMouseMove(function(e) {

						var b, radius = view.def.canvas.specs.atoms_font_size_2D;
						var x = e.offsetX, y = e.offsetY;
						

						if(moduleValue._atoms && moduleValue._highlight) {

							x -= this.width / 2; x /= this.specs.scale; x += this.width / 2; 
							y -= this.height / 2; y /= this.specs.scale; y += this.height / 2;

							for(var i = 0, l = view.def.molecule.atoms.length; i < l; i++) {

								if(view.def.molecule.atoms[i].textBounds.length > 0) {
									inside = false;
									for(var j = 0, k = view.def.molecule.atoms[i].textBounds.length; j < k; j++) {
										b = view.def.molecule.atoms[i].textBounds[j];

										if(b.x < x && b.x + b.w > x && b.y < y && b.y + b.h > y) {
											self._doHighlight(i, true);
											inside = true;
											break;
										}
									}

									if(!inside) {
										self._doHighlight(i, false);
									}
									
								} else {
									var difX = x - view.def.molecule.atoms[i].x;
									var difY = y - view.def.molecule.atoms[i].y;
									if(Math.pow(Math.pow(difX, 2) + Math.pow(difY, 2), 0.5) < this.specs.atoms_font_size_2D)
										self._doHighlight(i, true);
									else 
										self._doHighlight(i, false);
								}
							}
						}
					});


				});
				
			},

			'atomLabels': function(moduleValue) {
				this._atomLabels = moduleValue;

				if(this._lastMol)
					this.update.mol2d.call(this, this._lastMol, true);
			}
		},
		
		drawMolecule: function() {

			if(!this._width || !this._height || !this.def || !this.def.molecule || !this.def.canvas)
				return;
/*
			var dim = this.def.molecule.getDimension();
			var ratio = Math.min(1, Math.max(this._width / dim.x, this._height / dim.y));
			if(this.def.canvasdom) {
				this.def.canvasdom.width = this._width;
				this.def.canvasdom.height = this._height;

				this.def.canvas.width = this._width;
				this.def.canvas.height = this._height;
			}
			
			this.def.molecule.scaleToAverageBondLength(30 * ratio);
			this.def.canvas.specs.atoms_font_size_2D = 10 * ratio;
			this.def.canvas.specs.bonds_hashSpacing_2D = 2.5 * ratio;
			this.def.canvas.specs.bonds_width_2D = .6 * ratio;
			this.def.canvas.loadMolecule(this.def.molecule);*/
		},
		
		getDom: function() {
			return this.dom;
		},
		
		_doHighlight: function(id, val) {

			if(this._highlighted[id] && val)
				return;
			if(!this._highlighted[id] && !val)
				return;
			
			this._highlighted[id] = val;

			for(var i in this._lastMol._atoms) {
				if(this._lastMol._atoms[i].indexOf(id) > -1) {
					API.highlight(i, val);
				}
			}
		},

		typeToScreen: {

			'mol2d': function(deferred, moduleValue) {
				var self = this;

				if(!this._canvas)
					return;
				
				var molLoaded = ChemDoodle.readMOL(moduleValue.value);
				molLoaded.scaleToAverageBondLength(30);
				deferred.resolve(molLoaded);
				self._currentValue = moduleValue;
				molLoaded._highlights = molLoaded._highlights || {};
				

				API.listenHighlight( moduleValue._highlight, function(value, commonKeys) {

					var canvas = self._canvas;
					var commonKeys2 = {};
					var atoms = {};
					molLoaded._highlights = molLoaded._highlights || {};
					for(var i = commonKeys.length - 1; i >= 0; i--) {
						atoms = moduleValue._atoms[commonKeys[i]]; // [0, 1, 15, 12]
						if(!atoms)
							continue;
						for(var j = atoms.length - 1; j >= 0; j--)
							molLoaded.atoms[atoms[j]].isHover = value;
					}
					canvas._domcanvas.width = canvas._domcanvas.width; // Erase canvas
					for(var i = 0; i < molLoaded.atoms.length; i++) {
						molLoaded.atoms[i].drawChildExtras = true;
					}
					canvas.repaint();
				}, true, this.module.id);
			}	
		}


	});
	return view;
});
 
 