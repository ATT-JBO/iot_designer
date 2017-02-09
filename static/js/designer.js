/**
 * Created by Jan on 14/11/2016.
 */
'use strict';

//var mldesigner = angular.module('mldesigner', ['ngRoute', 'ngMaterial', 'ngMdIcons', 'mldesigner.designer']);

//mldesigner.config(['$routeProvider',
//     function($routeProvider) {
//         $routeProvider
//             .when('/', {
//                 controller : 'designerController',
//                 templateUrl: '/static/partials/designer.html'
//             });
//    }]);

var diagram_hack = null;

var _code = new Code();         //we need to use this for a couple of categories (or, and)
var _dataGenGroup = new DataGeneration();
var _nn = new NN();
var _asset = new Asset();

var _plugins = {asset: _asset, bucketizer: new Bucketizer(), code: _code, or: _code, and: _code, constant: _code, data_generator: _dataGenGroup, data_generation_set: _dataGenGroup,
                delay: new Delay(), device_monitor: new DeviceMonitor(),
                device: new DeviceTemplate(), group: new Group(), NN: _nn, nn_time: new NN_Time(), statistics: new Statistics(), email: new Email(), reporter: new Reporter(), connection: new Connection()};

mldesigner.directive('goDiagram', function() {
      return {
        restrict: 'E',
        template: '<div></div>',  // just an empty DIV element
        replace: true,
        scope: { model: '=goModel' },
        link: function(scope, element, attrs) {
          var $ = go.GraphObject.make;
          var diagram = $(go.Diagram, element[0],
              {
                initialContentAlignment: go.Spot.Center,
                allowDrop: true,  // must be true to accept drops from the Palette
                "ModelChanged": updateAngular,
                "ChangedSelection": updateSelection,
                "linkingTool.insertLink": buildLink,
                "relinkingTool.reconnectLink": reconnectLink,
                "undoManager.isEnabled": true
              });
          diagram_hack = diagram;
          //all the templates:
          diagram.nodeTemplateMap.add("",           //the default category template
              $(go.Node, "Auto",  { locationSpot: go.Spot.Center },
                  new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
                  $(go.Panel, "Auto",
                      $(go.Shape, "RoundedRectangle",
                          {
                              portId: "", cursor: "pointer",
                              fromLinkable: true, toLinkable: true
                          },
                          new go.Binding("fill", "color")
                      ),
                      $(go.Panel, "Table",
                          $(go.Picture, { row: 0, width: 60, height: 60, stretch: go.GraphObject.None },
                             new go.Binding("source", "image", function(prop){return "static/img/" + prop; } )),
                          $(go.TextBlock, { row: 1, margin: 4, editable: true },
                              new go.Binding("text", "name").makeTwoWay())
                      )
                  )
            ));

          diagram.nodeTemplateMap.add("LinkLabel",           //the default category template
              $("Node",
                { selectable: false, avoidable: false,
                  layerName: "Foreground" },  // always have link label nodes in front of Links
                $("Shape", "Ellipse",
                  { width: 5, height: 5, stroke: null,
                    portId: "", fromLinkable: true, toLinkable: true, cursor: "pointer" })
              )
          );

          for(var category in _plugins){                    //add all the plugin templates
              var plugin = _plugins[category];
              if('getNodeTemplateMap' in plugin){
                  var item = plugin.getNodeTemplateMap($, category);
                  if(item){
                        diagram.nodeTemplateMap.add(category, item);
                  }
              }
          }

            var operatorEditor = loadOperatorEditor(diagram);            //load the editor that will be used in the linkTemplate. loaded here cause used in template decleration. loadOperatorEditor is in code.js
          // replace the default Link template in the linkTemplateMap
          diagram.linkTemplate =
              $(go.Link,  // the whole link panel
                {
                  curve: go.Link.Bezier, adjusting: go.Link.Stretch,
                  reshapable: true, relinkableFrom: true, relinkableTo: true,
                  toShortLength: 3
                },
                new go.Binding("points").makeTwoWay(),
                $(go.Shape,  // the link shape
                  { strokeWidth: 1.5 }),
                $(go.Shape,  // the arrowhead
                  { toArrow: "standard", stroke: null }),
                $(go.Panel, "Auto",
                  $(go.Shape,  // the label background, which becomes transparent around the edges
                    {
                      fill:  'white', //$(go.Brush, "Radial",
                              //{ 0: "rgb(255, 255, 255)", 0.3: "rgb(255, 255, 255)", 1: "rgba(255, 255, 255, 0)" }),
                      stroke: null
                    }),
                  $(go.TextBlock, "transition",  // the label text
                    {
                      textAlign: "center",
                      font: "9pt helvetica, arial, sans-serif",
                      margin: 4,
                      editable: true  // enable in-place editing
                    },
                    // editing the text automatically updates the model data
                    new go.Binding("text", "label").makeTwoWay())
                )
              );
          diagram.linkTemplateMap.add("condition",
              $(go.Link,  // the whole link panel
                {
                    curve: go.Link.Bezier, adjusting: go.Link.Stretch,
                  reshapable: true, relinkableFrom: true, relinkableTo: true,
                  toShortLength: 3
                },
                new go.Binding("points").makeTwoWay(),
                $(go.Shape,  // the link shape
                  { strokeWidth: 1.5 }),
                $(go.Shape,  // the arrowhead
                  { toArrow: "standard", stroke: null }),
                $(go.Panel, "Auto",
                  $(go.Shape,  // the label background, which becomes transparent around the edges
                    {
                      fill:  'white',  stroke: null
                    }),
                  $(go.TextBlock, "transition",  // the label text
                    {
                      textAlign: "center",
                      font: "9pt helvetica, arial, sans-serif",
                      margin: 4,
                      editable: true,  // enable in-place editing
                      textEditor: operatorEditor    //use a custom editor. editor is declared in 'code' unit.
                    },
                    // editing the text automatically updates the model data
                    new go.Binding("text", "operator").makeTwoWay())
                )
              ));

            // whenever a GoJS transaction has finished modifying the model, update all Angular bindings
            function updateAngular(e) {
                 if (e.isTransactionFinished) {
                  scope.$apply();
                }
            }

          // update the Angular model when the Diagram.selection changes
          function updateSelection(e) {
              diagram.model.selectedNodeData = null;
              var it = diagram.selection.iterator;
              while (it.next()) {
                  var selnode = it.value;
                  // ignore a selected link or a deleted node
                  if (selnode instanceof go.Node && selnode.data !== null) {
                    diagram.model.selectedNodeData = selnode.data;
                    break;
                  }
                }
                scope.$apply();
          }

            //diagram.toolManager.linkingTool.archetypeLabelNodeData = {"category": "LinkLabel"};
          function buildLink(fromnode, fromport, tonode, toport){
              diagram.toolManager.linkingTool.archetypeLabelNodeData = null;                //reset value to the default state for each link, not all services assign to this field.
              this.linkingTool = diagram.toolManager.linkingTool;                                                   //so we can pass on the linkingTool to the nodes.
                var node = _plugins[fromnode.data.category];
                if (node && node.canHandleBuildLinkAsFrom(this, scope, fromnode, fromport, tonode, toport))
                    return node.buildLinkAsFrom(this, scope, fromnode, fromport, tonode, toport);
                else{
                    node = _plugins[tonode.data.category];
                    if(node && node.canHandleBuildLinkAsTo(this, scope, fromnode, fromport, tonode, toport))
                        return node.buildLinkAsTo(this, scope, fromnode, fromport, tonode, toport);
                    else{
                        scope.$parent.errors.push("unsupported relationship");
                        scope.$parent.hasError = true;
                        scope.$parent.$apply();
                        return null;
                    }
                }
          }

          function reconnectLink(existingLink, newnode, newport, toend) {
              diagram.toolManager.linkingTool.archetypeLabelNodeData = null;                //reset value to the default state for each link, not all services assign to this field.
              this.linkingTool = diagram.toolManager.linkingTool;                                                   //so we can pass on the linkingTool to the nodes.
              if (toend)
                  var fromnode = existingLink.fromNode;
              else
                  var fromnode = newnode;
              var node = _plugins[fromnode.data.category];
              if (node && node.canHandleReconnectLinkAsFrom(this, scope, existingLink, newnode, newport, toend))
                  return node.reconnectLinkAsFrom(this, scope, existingLink, newnode, newport, toend);
              else {
                  if (toend)
                      var tonode = newnode;
                  else
                      var tonode = existingLink.toNode;
                  node = _plugins[tonode.data.category];
                  if (node && node.canHandleReconnectLinkAsTo(this, scope, existingLink, newnode, newport, toend))
                      return node.reconnectLinkAsTo(this, scope, existingLink, newnode, newport, toend);
                  else {
                      scope.$parent.errors.push("unsupported relationship");
                      scope.$parent.hasError = true;
                      scope.$parent.$apply();
                      return false;
                  }
              }
          }

          //update nodes that are dropped so that they have the correct data elements.
          diagram.addDiagramListener("ExternalObjectsDropped", function (e) {
              var newnode = diagram.selection.first();
              if(newnode.data.hasOwnProperty('parent')) {           //remove properties only used by the palette
                  delete newnode.data.parent;
              }
          });

          //monitor changes in diagram model, so we can update the data when needed.
          //this is used instead of linkdrawn, cause linkdrawn is not always triggered.
          /*diagram.addModelChangedListener(onModelChanged);
          function onModelChanged(e) {  // handle insertions
              if (e.model.skipsUndoManager) return;
              if (e.change === go.ChangedEvent.Insert) {
                  if (e.propertyName === "nodeDataArray") {
                      // do something with e.newValue
                      console.log('testing');
                  } else if (e.propertyName === "linkDataArray") {
                      // do something with e.newValue
                      console.log('testing');
                  }
              }
          }*/

          // notice when the value of "model" changes: update the Diagram.model
          scope.$watch("model", function(newmodel) {
              var oldmodel = diagram.model;
              if (oldmodel !== newmodel) {
                  diagram.removeDiagramListener("ChangedSelection", updateSelection);
                  diagram.model = newmodel;
                  diagram.addDiagramListener("ChangedSelection", updateSelection);
              }

          });
          scope.$watch("model.selectedNodeData.name", function(newname) {
            if (!diagram.model.selectedNodeData) return;
            // disable recursive updates
            diagram.removeModelChangedListener(updateAngular);
            // change the name
            diagram.startTransaction("change name");
            // the data property has already been modified, so setDataProperty would have no effect
            var node = diagram.findNodeForData(diagram.model.selectedNodeData);
            if (node !== null) node.updateTargetBindings("name");
            diagram.commitTransaction("change name");
            // re-enable normal updates
            diagram.addModelChangedListener(updateAngular);
          });
        }
      };
    });

mldesigner.directive('goTreePalette', function () {
    return {
        restrict: 'E',
        template: '<div></div>',  // just an empty DIV element
        replace: true,
        scope: { model: '=goModel' },
        link: function(scope, element, attrs){
            var $ = go.GraphObject.make;
            var myDiagram = $(go.Diagram, element[0],
              {
                  allowMove: false,
                //allowCopy: true,
                //allowDelete: false,
                  allowDrop: false,
                  allowDragOut: true,
                layout:
                  $(go.TreeLayout,
                    {
                      alignment: go.TreeLayout.AlignmentStart,
                      angle: 0,
                      compaction: go.TreeLayout.CompactionNone,
                      layerSpacing: 16,
                      layerSpacingParentOverlap: 1,
                      nodeIndent: 2,
                      nodeIndentPastParent: 0.88,
                      nodeSpacing: 0,
                      setsPortSpot: false,
                      setsChildPortSpot: false
                    })
                }
            );
            myDiagram.nodeTemplate =  $(go.Node,
              {
                selectionAdorned: false,            // no Adornment: instead change panel background color by binding to Node.isSelected
                doubleClick: function(e, node) {    // a custom function to allow expanding/collapsing on double-click this uses similar logic to a TreeExpanderButton
                    var cmd = myDiagram.commandHandler;
                    if (node.isTreeExpanded) {
                        if (!cmd.canCollapseTree(node)) return;
                    } else {
                        if (!cmd.canExpandTree(node)) return;
                    }
                    e.handled = true;
                    if (node.isTreeExpanded) {
                        cmd.collapseTree(node);
                    } else {
                        cmd.expandTree(node);
                    }
                }
              },
              $("TreeExpanderButton",
                {
                  width: 14,
                  "ButtonBorder.fill": "whitesmoke",
                  "ButtonBorder.stroke": null,
                  "_buttonFillOver": "rgba(0,128,255,0.25)",
                  "_buttonStrokeOver": null
                }),
              $(go.Panel, "Horizontal",
                { position: new go.Point(16, 0) },
                new go.Binding("background", "isSelected", function (s) { return (s ? "lightblue" : "white"); }).ofObject(),
                $(go.Picture,
                  {
                    width: 18, height: 18,
                    margin: new go.Margin(0, 4, 0, 0),
                    imageStretch: go.GraphObject.Uniform
                  },
                  // bind the picture source on two properties of the Node
                  // to display open folder, closed folder, or document
                  new go.Binding("source", "isTreeExpanded", imageConverter).ofObject(),
                  new go.Binding("source", "isTreeLeaf", imageConverter).ofObject()),
                $(go.TextBlock,
                  { font: '9pt Verdana, sans-serif' },
                  new go.Binding("text", "name"))
              )  // end Horizontal Panel
            );  // end Node

            myDiagram.nodeTemplateMap.add("asset", $(go.Node,
              {
                selectionAdorned: false,            // no Adornment: instead change panel background color by binding to Node.isSelected
                doubleClick: function(e, node) {    // a custom function to allow expanding/collapsing on double-click this uses similar logic to a TreeExpanderButton
                    var cmd = myDiagram.commandHandler;
                    if (node.isTreeExpanded) {
                        if (!cmd.canCollapseTree(node)) return;
                    } else {
                        if (!cmd.canExpandTree(node)) return;
                    }
                    e.handled = true;
                    if (node.isTreeExpanded) {
                        cmd.collapseTree(node);
                    } else {
                        cmd.expandTree(node);
                    }
                }
              },
              $("TreeExpanderButton",
                {
                  width: 14,
                  "ButtonBorder.fill": "whitesmoke",
                  "ButtonBorder.stroke": null,
                  "_buttonFillOver": "rgba(0,128,255,0.25)",
                  "_buttonStrokeOver": null
                }),
              $(go.Panel, "Horizontal",
                { position: new go.Point(16, 0) },
                new go.Binding("background", "isSelected", function (s) { return (s ? "lightblue" : "white"); }).ofObject(),
                $(go.Picture,
                  {
                    width: 18, height: 18,
                    margin: new go.Margin(0, 4, 0, 0),
                    imageStretch: go.GraphObject.Uniform
                  },
                  // bind the picture source on two properties of the Node
                  // to display open folder, closed folder, or document
                  new go.Binding("source", "isTreeExpanded", imageConverter).ofObject(),
                  new go.Binding("source", "isTreeLeaf", imageConverter).ofObject()),
                $(go.TextBlock,
                  { font: '9pt Verdana, sans-serif' },
                  new go.Binding("text", "title"))
              )  // end Horizontal Panel
            ));


            // without lines
            myDiagram.linkTemplate = $(go.Link);
            // takes a property change on either isTreeLeaf or isTreeExpanded and selects the correct image to use
            function imageConverter(prop, picture) {
                var node = picture.part;
                if (node.isTreeLeaf) {
                    if(node.data.hasOwnProperty('image')){
                        return "static/img/" + node.data.image;
                    }
                    else {
                        return "static/img/document.png";
                    }
                } else {
                    if (node.isTreeExpanded) {
                        return "static/img/open_folder.png";
                    } else {
                        return "static/img/closed_folder.png";
                    }
                }
            }

            scope.$watch("model", function(newmodel) {
                var oldmodel = myDiagram.model;
                if (newmodel && oldmodel !== newmodel) {
                  myDiagram.model = newmodel;
                }
          });
        }
    };
});

mldesigner.directive('goPalette', function () {
    return {
        restrict: 'E',
        template: '<div></div>',  // just an empty DIV element
        replace: true,
        scope: { model: '=goModel' },
        link: function(scope, element, attrs){
            var $ = go.GraphObject.make;
            var palette = $(go.Palette, element[0]);

            palette.nodeTemplateMap.add("",           //the default category template
              $(go.Node, "Auto",  { locationSpot: go.Spot.Left },
                  new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
                  $(go.Panel, "Horizontal",
                      $(go.Shape, "RoundedRectangle",
                          new go.Binding("fill", "color"),
                          {
                              desiredSize: new go.Size(80, 20),
                              portId: "", cursor: "pointer",
                              fromLinkable: true, toLinkable: true
                          }),
                        $(go.TextBlock,
                            {   margin: new go.Margin(4, 20, 4,4),
                                editable: true,
                                font: "bold 11pt Helvetica, Arial, sans-serif"
                            },
                          new go.Binding("text", "category").makeTwoWay())
                      )));

            palette.nodeTemplateMap.add("",           //the default category template
              $(go.Node, "Auto",  { locationSpot: go.Spot.Left },
                  new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
                  $(go.Panel, "Horizontal",
                      $(go.Shape, "RoundedRectangle",
                          new go.Binding("fill", "color"),
                          {
                              desiredSize: new go.Size(80, 20),
                              portId: "", cursor: "pointer",
                              fromLinkable: true, toLinkable: true
                          }),
                        $(go.TextBlock,
                            {   margin: new go.Margin(4, 20, 4,4),
                                editable: true,
                                font: "bold 11pt Helvetica, Arial, sans-serif"
                            },
                          new go.Binding("text", "category").makeTwoWay())
                      )));

            scope.$watch("model", function(newmodel) {
            var oldmodel = palette.model;
            if (oldmodel !== newmodel) {
              palette.model = newmodel;
            }
          });
        }
    };
});

mldesigner.directive('goInspector', function(){
    return {
        restrict: 'E',
        template: '<div></div>',  // just an empty DIV element
        replace: true,
        scope: { diagram: '@goModel'
               },
        link: function(scope, element, attrs){
            //var diagram = element[0].ownerDocument.getElementById(attrs.goDiagram);
            //var diagram = angular.element(document).find(attrs.goDiagram)[0];
            var inspector = new Inspector(element[0], diagram_hack,
                {
                    properties: {
                        "key": { show: false },
                        "id": {show: Inspector.showIfPresent, readOnly: true},
                        "loc": { show: false },
                        "category": { show: false },
                        "color": { show: Inspector.showIfPresent, type: 'color' },
                        "flag": { show: false  },
                        "Comments": { show: true  },
                        "points": { show: false  },
                        "image": { show: false  },
                        "labelKeys": { show: false  },
                        "from": { show: false  },
                        "is": { show: Inspector.showIfPresent, readOnly: true },
                        "to": { show: false  }              //if we were to set Inspector.showIfNode, then it is shown on all nodes, like comment.
                    }
                });
        }
    };
});


mldesigner.directive('modalDialog', function() {
  return {
    restrict: 'E',
    scope: {
      show: '='
    },
    replace: true, // Replace with the template below
    transclude: true, // we want to insert custom content inside the directive
    link: function(scope, element, attrs) {
      scope.dialogStyle = {};
      if (attrs.width)
        scope.dialogStyle.width = attrs.width;
      if (attrs.height)
        scope.dialogStyle.height = attrs.height;
      scope.hideModal = function() {
        scope.show = false;
      };
    },
    template: '<div class=\'ng-modal\' ng-show=\'show\'> <div class=\'ng-modal-overlay\' ng-click=\'hideModal()\'></div> <div class=\'ng-modal-dialog\' ng-style=\'dialogStyle\'> <div class=\'ng-modal-close\' ng-click=\'hideModal()\'>X</div> <div class=\'ng-modal-dialog-content\' ng-transclude></div> </div></div>'
  };
});

mldesigner.controller('designerController', ['$scope','$http', function($scope, $http){
    $scope.errors = [];                        //shows error messages
    $scope.hasError = false;
    $scope.showOpen = false;
    $scope.showResult = false;
    $scope.publishResult = null;

    $http({method: 'GET',  url: '/api/projects'})      //get the list of projects for this user, for the dlgopen (not ideal location, for proto only
                    .then(function (response){
                          $scope.projects = response.data
                    }
                    ).catch(function onError(response){
                        $scope.errors.push(response.data);
                        $scope.hasError = true;
                    }
            );

    $scope.projectName = "project 1";           //name of the project
    $scope.pages = [{"title": "page 1", data: [], links: []}];                          //all the data pages in the project. Each page has a model.
    $scope.currentPage = 0;                     //keep track of the currently selected page.
    $scope.project_id = null;                   //so we know if we need to do a post or put
    $scope.model = new go.GraphLinksModel(
        [

        ],
        [
        ]);
    $scope.model.linkLabelKeysProperty = "labelKeys";

    var paletteItems = [{key: 0, category: "root", color: "transparent", name: "parameter"},
                        {key: 1, category: "parameter", color: "transparent", name: "parameter", parent:0 }];
    var key = 2;

    var pluginId = 0;
    var keys = Object.keys(_plugins);

    $scope.build_palette_part = function(key, keys, pluginId, paletteItems) {
        if (pluginId >= keys.length){
            $scope.rootPalette = new go.TreeModel(paletteItems);
            return;                    // no more plugins to process
        }
        var plugin = _plugins[keys[pluginId]];
        if('getPaletteAsync' in plugin){
            var palettePromise = plugin.getPaletteAsync($http, key, keys[pluginId]);
            palettePromise.then(function(result){
                for (var i=0; i < result.length; i++) {
                    paletteItems.push( result[i] );
                }
                key += result.length
                if('getPalette' in plugin){
                    var newList = plugin.getPalette(key, keys[pluginId]);
                    for (var i=0; i < newList.length; i++) {
                         paletteItems.push( newList[i] );
                    }
                    key += newList.length
                }
                pluginId += 1;
                $scope.build_palette_part(key, keys, pluginId, paletteItems);
            });
        }
        else if('getPalette' in plugin){
            var newList = plugin.getPalette(key, keys[pluginId]);
            for (var i=0; i < newList.length; i++) {
                 paletteItems.push( newList[i] );
            }
            key += newList.length
            pluginId += 1;
            $scope.build_palette_part(key, keys, pluginId, paletteItems);
        }
    };
    $scope.build_palette_part(key, keys, pluginId, paletteItems);

    //$scope.rootPalette = new go.TreeModel(paletteItems);
    $scope.model.selectedNodeData = null;
      //$scope.replaceModel = function() {
      //  $scope.model = new go.GraphLinksModel(
      //      [
      //        { key: 11, name: "zeta", color: "red" },
      //        { key: 12, name: "eta", color: "green" }
      //      ],
      //      [
      //        { from: 11, to: 12 }
      //      ]
      //    );
      //}

    //callback for the save button
    $scope.on_save_clicked = function(event){
        $scope.showSave = false;                //close the save dialog
        $scope.save_current_page();             //make certain we store the data currently loaded for editing.
        var data = {name: $scope.projectName, pages: $scope.pages}
        if($scope.project_id == null)
            $http({method: 'POST',  url: '/api/project',  data: data, headers: {'userId': "test"}})
                    .then(function (response){
                          $scope.project_id = response.data.id  
                    }
                    ).catch(function onError(response){
                        $scope.errors.push(response.data);
                        $scope.hasError = true;
                    }
            );
        else{
            $http({method: 'PUT',  url: "/api/project/" + $scope.project_id,  data: data, headers: {'userId': "test"}})
                    .then(function (response){
                    }
                    ).catch(function onError(response){
                        $scope.errors.push(response.data);
                        $scope.hasError = true;
                    }
            );
        }

    };

    $scope.save_current_page = function(){
        var data = JSON.parse($scope.model.toJson());       //toJson gives us the correct data, but we need to extract the fields, don't need the entire json, also need to put the json struct in our json struct.
        $scope.pages[$scope.currentPage]['data'] = data["nodeDataArray"];
        $scope.pages[$scope.currentPage]['links'] = data["linkDataArray"];

    };

    //callback for the save button
    $scope.on_publish_clicked = function(event){
        if($scope.project_id == null){
            $scope.errors.push("The project needs to be saved first");
            $scope.hasError = true;
        }
        else{
            var data = {name: $scope.projectName, pages: $scope.pages};
            $http({method: 'PUT',  url: "/api/project/" + $scope.project_id,  data: data, headers: {'userId': "test"}})
                    .then(function (response){
                        $http({method: 'PUT',  url: "/api/publish/" + $scope.project_id, headers: {'user': "testjan", "pwd": "testtestjan"}})
                                .then(function (response){
                                    //success
                                    var myjson = JSON.stringify(response.data, null, 2);
                                    console.log(myjson);
                                    $scope.publishResult = myjson;
                                    $scope.showResult = true;

                                }).catch(function onError(response){
                                    $scope.errors.push(response.data);
                                    $scope.hasError = true;
                                }
                        );
                    }).catch(function onError(response){
                        $scope.errors.push(response.data);
                        $scope.hasError = true;
                    }
            );
        }

    };

    //callback for opening files from server.
    // name = name of the project to open.
    $scope.on_open_clicked = function(event, name){

        $http({method: 'GET',  url: '/api/project/' + encodeURIComponent(name), headers: {'userId': "test"}})
                    .then(function (response){
                        $scope.showOpen = false;
                        $scope.projectName = response.data.name;
                        $scope.pages = response.data.definition.pages;
                        $scope.currentPage = 0;
                        $scope.project_id = response.data._id.$oid;
                        $scope.model = new go.GraphLinksModel($scope.pages[0].data, $scope.pages[0].links);
                        $scope.model.linkLabelKeysProperty = "labelKeys";
                    }
                    ).catch(function onError(response){
                        $scope.showOpen = false;
                        $scope.errors.push(response.data);
                        $scope.hasError = true;
                    }
            );
    };

    //closes a single aleter
    $scope.closeAlert = function (index) {
        $scope.errors.splice(index, 1);
        if($scope.errors.length == 0)
            $scope.hasError = false;
    };

}]);


