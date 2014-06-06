define(['jquery', 'src/main/entrypoint', 'src/util/datatraversing', 'src/util/api', 'src/util/debug'], function($, Entry, Traversing, API, Debug) {

	return {

		setModule: function(module) { this.module = module; },

		init: function() {

			var sourceName, sourceAccepts;
			this.module.model = this;
			this.data = new DataObject();
		
			this.triggerChangeCallbacksByRels = {};
			this.mapVars();
		
			this.resetListeners();
			this.initImpl();

		},

		initImpl: function() {
			this.resolveReady();
		},

		
		inDom: function() {
			
		},

		resetListeners: function() {
			this.sourceMap = null;
		
			this.mapVars();

			//API.getRepositoryData( ).unListen( this.getVarNameList(), this._varlisten );
			API.getRepositoryActions( ).unListen( this.getActionNameList(), this._actionlisten );
			
			var list = this.getVarNameList();
			for( var i = 0, l = list.length ; i < l ; i ++ ) {

				API.getVar( list[ i ] ).listen( this.module, $.proxy( this.onVarChange, this ) );
			}

			//this._varlisten = API.getRepositoryData().listen( this.getVarNameList(), $.proxy(this.onVarGet, this) );
			this._actionlisten = API.getRepositoryActions().listen( this.getActionNameList(), $.proxy(this.onActionTrigger, this) );
		},

		mapVars: function() {
			// Indexing all variables in
			var list = this.module.vars_in( ),
				listNames = [],
				listRels = [],
				varsKeyedName = {};

			if( Array.isArray( list ) ) {

				for(var l = list.length, i = l - 1; i >= 0; i--) {

					listNames.push( list[ i ].name );
					listRels.push( list[ i ].rel );
					varsKeyedName[ list[i].name ] = list[ i ];
				}
			}

			this.sourceMap = varsKeyedName;
			this.listNames = listNames;
			this.listRels = listRels;
		},

		getVarNameList: function() {
			return this.listNames;
		},

		getActionNameList: function() {

			var list = this.module.actions_in(), 
				names = [],
				i,
				l;

			if( ! list ) {
				return names;
			}

			l = list.length,
			i = l - 1;

			for( ; i >= 0; i--) {
				names.push( list[ i ].name );
			}

			return names;
		},

		onVarChange: function( variable ) {

			var self = this,
				i,
				l,
				k,
				m,
				rel;

			this.module.onReady().then( function() {

				self.module.blankVariable( variable.getName() );
			});

			var rejectLatency;
			var latency = new Promise( function( resolve, reject ) {

				rejectLatency = reject;
				setTimeout( resolve, 500 );
			} );

			// Start loading
			var loadingState = Promise.all( [ this.module.onReady(), latency ] ).then( function() {

				self.module.startLoading( variable.getName( ) );
			} ).catch( function() {

			} );

			Promise.all( [ this.module.onReady( ), variable.onReady( ) ] ).then( function() {
			
				// Gets through the input filter first
				var varName = variable.getName();
				var varValue = variable.getValue();

				self.module.endLoading( variable.getName( ) );

				// Then validate
				if( ! varName || ! self.sourceMap || ! self.sourceMap[ varName ] || ! self.module.controller.references[ self.sourceMap[ varName ].rel ] ) {
					rejectLatency();
					return;
				}
                
                var data = self.buildData( varValue, self.module.controller.references[ self.sourceMap[ varName ].rel ].type );
console.log( varName, data );
                if( ! data ) {
                  	rejectLatency();
					return;
                }

				rel = self.module.getDataRelFromName( varName );
				
				i = 0,
				l = rel.length,
				k = 0;

				var vars = self.module.vars_in();

				m = vars.length;
				for( ; k < m ; k ++ ) {

					if( vars[ k ].name == varName && self.module.view.update[ vars[ k ].rel ] && varValue !== null ) {

						( function( j ) {

							new Promise( function( resolve, reject ) {

								if( vars[ j ].filter ) {

									require( [ vars[ j ].filter ], function( filterFunction ) {
									
										filterFunction( varValue, resolve );

									} );
								
								} else {
									resolve( varValue );
								}
							} ).then( function( varValue ) {

								self.data[ vars[ j ].rel ] = varValue;
								self.removeAllChangeListeners( vars[ j ].rel );
								self.module.view.update[ vars[ j ].rel ].call( self.module.view, self.data[ vars[ j ].rel ], varName );

							} ).catch( function() {

								Debug.error("Error while updating module ", arguments, arguments[0].stack );
							});

						}) ( k );
						
					}
					
				}

				rejectLatency();
				

			} ).catch( function() {
				Debug.error( "Error while updating variable ", arguments[ 0 ].getStack( ) );
				rejectLatency();

			} );

 		},

		onActionTrigger: function(value, actionName) {

			var actionRel = this.module.getActionRelFromName(actionName[0]);
			if(this.module.view.onActionReceive && this.module.view.onActionReceive[actionRel]) {
				this.module.view.onActionReceive[actionRel].call(this.module.view, value, actionName);
			}
 		},

 		buildData: function(data, sourceTypes) {
 			
 			if(!data) {
 				return false;
 			}
 			
			var dataRebuilt = {};
			if( ! sourceTypes ) { // Accepts everything
				return data;
			}

			if(!(sourceTypes instanceof Array))
				sourceTypes = [sourceTypes];

			var dataType = data.getType(),
				mustRebuild = false;
console.log( data, dataType );

			// If no in type is defined, the module accepts anything
			if( sourceTypes.length == 0) {
				return data;
			}


			for(var i = 0; i < sourceTypes.length; i++) {
				if(sourceTypes[i] == dataType) {
					return data;
				}
			}

			if(mustRebuild) {
				return dataRebuilt;
			}
			
			return false;
		},

		getValue: function() {
			return this.data;
		},
				
		getjPath: function(rel, subjPath) {
			return this._getjPath( rel, subjPath );
		},

		_getjPath: function(rel, subjPath) {
			var data = this.module.getDataFromRel(rel);

			if( data && subjPath !== undefined ) {
				data = data.getChildSync( subjPath );
			}

			return Traversing.getJPathsFromElement(data); // (data,jpaths)
		},

		resolveReady: function() {
			this.module._resolveModel();
		},

		dataListenChange: function( data, callback, bindToRel ) {

			if( ! data ) {
				return;
			}

			var self = this,
				proxiedCallback = function( moduleId ) {

					if( moduleId == self.module.getId( ) ) {
						return;// Do not update itself;
					}

					callback.call( data );
				};

			if( this.addChangeListener( bindToRel, data, proxiedCallback ) ) {

				data.onChange( proxiedCallback );

			} else {
				Debug.setDebugLevel(1);
				Debug.error("Adding the change callback is forbidden as no rel has been defined ! Aborting callback binding to prevent leaks");
			}
		},

		dataTriggerChange: function( data ) { // self is not available

			data.triggerChange( false, [ this.module.getId( ) ] );
		},

		dataSetChild: function( data, jpath, value ) {

			data.setChild( jpath, value, this.module.getId( ) );
		},

		addChangeListener: function( rel, data, callback ) {

			if( ! rel ) {
				return false;
			}

			if( this.listRels.indexOf( rel ) === -1 ) {
				return false;
			}

			this.triggerChangeCallbacksByRels[ rel ] = this.triggerChangeCallbacksByRels[ rel ] || [];
			this.triggerChangeCallbacksByRels[ rel ].push( { data: data, callback: callback } );

			return true;
		},

		removeAllChangeListeners: function( rel ) {

			if( ! this.triggerChangeCallbacksByRels[ rel ] ) {
				return;
			}

			for( var i = 0, l = this.triggerChangeCallbacksByRels[ rel ].length ; i < l ; i ++ ) {
				this.removeChangeListener( this.triggerChangeCallbacksByRels[ rel ][ i ].data, this.triggerChangeCallbacksByRels[ rel ][ i ].callback );
			}
		},

		removeChangeListener: function( data, callback ) {
			data.unbindChange( callback );
		}
	};
});