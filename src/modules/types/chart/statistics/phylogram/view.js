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

            $block = $('<div>', {id: this._id});
            $block.css( {
                'display' : 'table',
                'height' : '90%',
                'width' : '85%',
                'overflow' : 'hidden'
            } );
            this.dom = $block;
            this.module.getDomContent().html(this.dom);

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

                var view = this;
                var box = this.module;
                this._idHash = [];
                this.getIdHash(data.value);

                API.killHighlight(box.id);

                // Loading phylogram extension for D3
                require(['lib/d3/d3.phylogram'], function() {

                    view.dom.empty();
                    var skipBranchLengthScaling = true;
                    if (data.value.children && data.value.children.length > 0)
                        skipBranchLengthScaling = (data.value.children[0].length === undefined);

                    this.phylogram = d3.phylogram.build(view.selectorId, data.value, {
                        //height : view._idHash.length*8,
                        skipBranchLengthScaling: skipBranchLengthScaling,
                        skipTicks: false,
                        skipLabels: true,
                        children : function(node) {
                            return node.children;
                        },
                        // LEAF
                        callbackMouseOverLeaf: function(data) {
                            box.controller.mouseOverLeaf(data);
                            API.highlight(data.data, 1);
                        },
                        callbackMouseOutLeaf: function(data) {
                            box.controller.mouseOutLeaf(data);
                            API.highlight(data.data, 0);
                        },
                        callbackClickLeaf: function(data) {
                            box.controller.clickLeaf(data);
                        },
                        // BRANCH
                        callbackMouseOverBranch: function(data) {
                            box.controller.mouseOverBranch(data.target);
                        },
                        callbackMouseOutBranch: function(data) {
                            box.controller.mouseOutBranch(data.target);
                        },
                        callbackClickBranch: function(data) {
                            box.controller.clickBranch(data.target);
                        }
                        //skipLabels: false
                    });

                    var leaves = d3.selectAll(view.selectorId + " .leaf");

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

                                }, false, box.id);

                            }



                        })(data, d3.select(this));

                    });

                    // ( this.module.getConfiguration('defaultvalue') || '' )
                    d3.selectAll(view.selectorId + " .link").each(function() {
                        //d3.select(this).attr("stroke",( view.module.getConfiguration('branchColor') || '#cccccc' ));
                        d3.select(this).attr("stroke-width", (view.module.getConfiguration('branchWidth') + "px" || '5px'));
                    });

                }); // End require phylogram




            }
        },
        getDom: function() {
            return this.dom;
        },
        typeToScreen: {}
    });

    return view;
});