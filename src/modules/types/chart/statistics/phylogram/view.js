define(['modules/default/defaultview', 'src/util/util', 'd3', 'src/util/api'], function(Default, Util, d3, API) {

    function view() {
    }
    ;
    view.prototype = $.extend(true, {}, Default, {
        init: function() {

            this._id = Util.getNextUniqueId();
            this.selectorId = "#" + this._id;
            this.chart = null;
            this.currentHighlightId = null;

            var $block = $('<div>', {id: this._id});
            $block.css( {
                'display' : 'table',
                'height' : '90%',
                'width' : '85%',
                'overflow' : 'hidden'
            } );
            this.dom = $block;
            this.module.getDomContent().html(this.dom);
			this.resolveReady();
        },
        blank: function() {
            this.dom.empty();
        },
        getIdHash: function(currentNode) {
            if (currentNode.id) {
                this._idHash[currentNode.id] = currentNode;
            }
            if (currentNode.children instanceof Array) {
                for (var i = 0; i < currentNode.children.length; i++) {
                    this.getIdHash(currentNode.children[i]);
                }
            }
        },
        update: {
            'tree': function(data) {

                if(!data)
                    return;
                
                data = data.get();

                this._idHash = [];
                this.getIdHash(data);

                API.killHighlight(this._id);
                
                this._data = $.extend(true, {}, data);
                
                this.drawPhylogram();
            }
        },
        getDom: function() {
            return this.dom;
        },
        typeToScreen: {},
    
    
    drawPhylogram: function(data, view) {
        
        if(!this._data)
            return;
        
        var data = this._data;
        var that = this;
        // Loading phylogram extension for D3
                require(['lib/d3/d3.phylogram'], function() {

                    that.dom.empty();
                    var skipBranchLengthScaling = true;
                    if (data.children && data.children.length > 0)
                        skipBranchLengthScaling = (data.children[0].length === undefined);
                    d3.phylogram.build(that.selectorId, data, {
                        //height : view._idHash.length*8,
                        skipBranchLengthScaling: skipBranchLengthScaling,
                        skipTicks: false,
                        skipLabels: true,
                        children : function(node) {
                            return node.children;
                        },
                        // LEAF
                        callbackMouseOverLeaf: function(data) {
                            that.module.controller.mouseOverLeaf(data);
                            API.highlight(data.data, 1);
                        },
                        callbackMouseOutLeaf: function(data) {
                            that.module.controller.mouseOutLeaf(data);
                            API.highlight(data.data, 0);
                        },
                        callbackClickLeaf: function(data) {
                            that.module.controller.clickLeaf(data);
                        },
                        // BRANCH
                        callbackMouseOverBranch: function(data) {
                            that.module.controller.mouseOverBranch(data.target);
                        },
                        callbackMouseOutBranch: function(data) {
                            that.module.controller.mouseOutBranch(data.target);
                        },
                        callbackClickBranch: function(data) {
                            that.module.controller.clickBranch(data.target);
                        }
                        //skipLabels: false
                    });

                    var leaves = d3.selectAll(that.selectorId + " .leaf");

                    leaves.each(function(data) {

                        (function(dataNode, leaf) {

                            if (dataNode.data && dataNode.data._highlight) {

                                API.listenHighlight(dataNode.data, function(value, what) {

                                    var point = leaf.select("circle");
                                    point.attr("fill", function(a) {
                                        if (a.data && a.data.$color)
                                            return a.data.$color;
                                        if (value)
                                            return "#f5f48d";
                                        return "grey";
                                    });
                                    point.attr("r", (value ? 9 : 4.5));

                                }, false, that._id);

                            }



                        })(data, d3.select(this));

                    });

                    // ( this.module.getConfiguration('defaultvalue') || '' )
                    d3.selectAll(that.selectorId + " .link").each(function() {
                        //d3.select(this).attr("stroke",( view.module.getConfiguration('branchColor') || '#cccccc' ));
                        d3.select(this).attr("stroke-width", (that.module.getConfiguration('branchWidth') + "px" || '5px'));
                    });

                }); // End require phylogram
        },
        onResize: function() {
            this.drawPhylogram();
        }
    });

    return view;
});