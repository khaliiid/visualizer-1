define(['modules/defaultview', 'util/datatraversing', 'util/api', 'libs/formcreator/formcreator'], function(Default, Traversing, API, FormCreator) {
	
	function view() {};
	view.prototype = $.extend(true, {}, Default, {

		init: function() {	
			
			this.dom = $( '<div>' ).css( { } );
			this.module.getDomContent( ).html( this.dom );
			this.variables = {};
			this.cfgValue = {};

			this._jpathsFcts = {};

			var self = this,
				searchfields = this.module.getConfiguration( 'searchfields' ),
				varsoutCfg = this.module.definition.vars_out || [],
				varsout = [],
				j = 0,
				k = varsoutCfg.length,
				cfg = {
					sections: {
						cfg: {
							groups: {
								cfg: {
									options: {
										type: 'list'
									},
									fields: FormCreator.makeStructure( searchfields, function( field ) {
										for( var k = 0, m = field.groups.general[ 0 ].searchOnField.length; k < m ; k ++) {
											eval('this._jpathsFcts[ "' + fields[ i ].groups.general[ 0 ].searchOnField[ k ] + '" ] = function( el ) { return el' + fields[ i ].groups.general[ 0 ].searchOnField[ k ].replace(/^element/, '') + '; }');
										}
									} );
								}
							}
						}
					}
				};

			for( ; j < k ; j ++ ) {
				varsout.push( varsoutCfg[ j ].name );
			}
			
			
			var form = FormCreator.makeForm();

			form.init( {
				onValueChanged: function( value ) {
					var cfg = form.getValue().sections.cfg[ 0 ].groups.cfg[ 0 ],
						cfgFinal = {};

					for( var i in cfg ) {
						cfgFinal[ i ] = cfg[ i ][ 0 ];
					}

					$.extend( self.cfgValue, cfgFinal );
					self.search();
				}
			} );

			form.setStructure( cfg );
			form.onStructureLoaded().done(function() {
				form.fill({ });
			});

			form.onLoaded( ).done( function( ) {
				self.dom.html( form.makeDom( 2 ) );
				form.inDom();
			});
			
			this.makeSearchFilter();
		},

		blank: {
			value: function(varName) {
				this.dom.empty();
			}
		},
		
		inDom: function() { },

		search: function() {

			var self = this,
				cfg = this.cfgValue,
				val = this.module.getDataFromRel( 'array' ),
				i = 0,
				l = val.length,
				target = new DataArray();

			for( ; i < l ; i ++ ) {

				if( this.searchElement( cfg, val[ i ] ) ) {
					target.push( val[ i ] );
				}
			}

			this.module.controller.searchDone( target );		
		},

		_makeOp: function( op, val ) {

			val = "self.cfgValue[ '" + val + "' ] ";
			switch( op ) {

				case '=':
				case 'eq':
					return " (el + '') == " + val + " ";
				break;

				case '<>':
				case '><':
				case '!=':
					return " (el + '') !== " + val + " ";
				break;

				case '>':
					return " el > " + val + " ";
				break;

				case '>=':
					return " el >= " + val + " ";
				break;

				case '<':
					return " el > parseFloat( " + val + " ) ";
				break;

				case '<=':
					return " el <= parseFloat( " + val + " ) ";
				break;

				case 'btw':
					if( val instanceof Array ) {
						return " ( el > parseFloat( " + val[ 0 ] + " ) && el < parseFloat( " + val[ 1 ] + " ) ";
					}
				break;
			}

		},

		makeSearchFilter: function() {

			
			var self = this,
				searchfields = this.module.getConfiguration( 'searchfields' ),
				i = 0,
				l = searchfields.length,
					searchOn;


			var toEval = "";
			toEval += " this._searchFunc = function( cfg, row ) { ";
			
			toEval += " var el; "


			toEval += " var a = "
			for( ; i < l ; i ++ ) {

				searchOn = searchfields[ i ].groups.general[ 0 ].searchOnField || [];

				if( i > 0 ) {
					toEval += " && ";
				}

				j = 0,
				k = searchOn.length;

				/////////
				var add = "";
				if( k > 0 ) {
					toEval += " ( ";

					for( ; j < k ; j ++ ) {

						if( j > 0 ) {
							toEval += " || ";
						}

						toEval += " ( ( el = self.getJpath( '" + searchOn[ j ] + "', row ) ) && ( ";
						toEval += this._makeOp( searchfields[ i ].groups.general[ 0 ].operator[ 0 ], searchfields[ i ].groups.general[ 0 ].name[ 0 ] );
						toEval += " ) ) ";

					}
					toEval += " ) ";
				}
				/////////
			}

			toEval += "; ";
			toEval += add;
			toEval += " return a; ";
			toEval += "};";

			eval( toEval );
		},

		searchElement: function( cfg, row ) {
			return this._searchFunc( cfg, row );
		},

		getJpath: function( jpathEl, row ) {
			return this._jpathsFcts[ jpathEl ]( row );
		},

		update: {
			
			variable: function( variableValue, variableName ) {
				
				variableValue = Traversing.get( variableValue );

				this.variables[ variableName ] = variableValue;
				this.search( );
			}
		},
				
		typeToScreen: {}
	});

	return view;
});