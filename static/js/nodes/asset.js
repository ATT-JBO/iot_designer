/**
 * Created by Jan on 8/01/2017.
 */
'use strict';

//note: in general, all link-related stuff from and to assets is handled by the 'other side' of the link. This is
//because everything works with assets.
//there is 1 exception: for links-to-links, this class handles the case when the asset is the 'from' part to a link.
//the alternative would be to set up a class for the linkLabel category ?
function Asset()  {


    this.canHandleBuildLinkAsTo = function(caller, scope, fromnode, fromport, tonode, toport){
        return false;
    };

    this.canHandleBuildLinkAsFrom = function(caller, scope, fromnode, fromport, tonode, toport){
        if(tonode.category == "LinkLabel")
            return true;
        return false;
    };

    //build a link for the graph, check if allowed.
    this.buildLinkAsFrom = function(caller, scope, fromnode, fromport, tonode, toport) {
        if(tonode.data.category == "LinkLabel") {
            if (tonode.data.is == "output") {
                caller.archetypeLinkData = {"label": "="};
                return go.LinkingTool.prototype.insertLink.call(caller, fromnode, fromport, tonode, toport);
            } else {
                caller.archetypeLinkData = {"category": "condition", "operator": "==", "dataInsectorPlugin": "code"};  // dataInsectorPlugin is used to allow the dataInspector use the code plugin when editing the link.
                return go.LinkingTool.prototype.insertLink.call(caller, fromnode, fromport, tonode, toport);
            }
        }
        else {
            scope.$parent.errors.push("can't process this link request.");
            scope.$parent.hasError = true;
            scope.$parent.$apply();
            return null;
        }
    };


    this.canHandleReconnectLinkAsFrom = function(caller, scope, existingLink, newnode, newport, toend){
        if(toend == true && newnode.category == "LinkLabel")
            return true;
        return false;
    };

    this.reconnectLinkAsFrom = function(caller, scope, existingLink, newnode, newport, toend) {
        if(newnode.data.category == "LinkLabel")
            return go.RelinkingTool.prototype.reconnectLink.call(caller, existingLink, newnode, newport, toend);
        else {
            scope.$parent.errors.push("can't process this link request.");
            scope.$parent.hasError = true;
            scope.$parent.$apply();
            return false;
        }
    };

    this.canHandleReconnectLinkAsTo = function(caller, scope, existingLink, newnode, newport, toend){
        return false;
    };




    this.getPalette = function(key, category){
        return [];
    };


    this.getNodeTemplateMap = function($, category){
        if (category == 'asset'){
            return $(go.Node, "Auto",  { locationSpot: go.Spot.Center },
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
                          $(go.Picture, { row: 0, width: 60, height: 60 },
                             new go.Binding("source", "image", function(prop){return "static/img/" + prop; } )),
                          $(go.TextBlock, { row: 1, margin: 4, editable: true },
                              new go.Binding("text", "title").makeTwoWay())
                      )
                  )
            );
        }

    };
}

