/**
 * Created by Jan on 23/12/2016.
 */

'use strict';


function Email()  {

    this.canHandleBuildLinkAsTo = function(caller, scope, fromnode, fromport, tonode, toport){
        return true;
    };

    this.canHandleBuildLinkAsFrom = function(caller, scope, fromnode, fromport, tonode, toport){
        return false;
    };

    //build a link for the graph, check if allowed.
    this.buildLinkAsTo = function(caller, scope, fromnode, fromport, tonode, toport) {
        if (fromnode.data.category == "asset") {
            caller.archetypeLinkData = {"label": "send to"};
            return go.LinkingTool.prototype.insertLink.call(caller, fromnode, fromport, tonode, toport);
        }
        else {
            var plugin = _plugins[fromnode.data.category];
            if(plugin.hasOwnProperty("isAsset") && plugin.isAsset() == true){                       //it's a service that creates an asset,and this also represents an asset (example: statistic)
                caller.archetypeLinkData =  {"label": "send to"};
                return go.LinkingTool.prototype.insertLink.call(caller, fromnode, fromport, tonode, toport);
            }
            else {
                scope.$parent.errors.push("email not yet fully ready, try an asset.");
                scope.$parent.hasError = true;
                scope.$parent.$apply();
                return null;
            }
        }
    };

    this.canHandleReconnectLinkAsFrom = function(caller, scope, existingLink, newnode, newport, toend){
        return false;
    };

    this.canHandleReconnectLinkAsTo = function(caller, scope, existingLink, newnode, newport, toend){
        return true;
    };


    this.reconnectLinkAsTo = function(caller, scope, existingLink, newnode, newport, toend) {
        if (newnode.data.category == "asset")
            return go.RelinkingTool.prototype.reconnectLink.call(caller, existingLink, newnode, newport, toend);
        else {
            var plugin = _plugins[newnode.data.category];
            if(plugin.hasOwnProperty("isAsset") && plugin.isAsset() == true)                       //it's a service that creates an asset,and this also represents an asset (example: statistic)
                return go.RelinkingTool.prototype.reconnectLink.call(caller, existingLink, newnode, newport, toend);
            else {
                scope.$parent.errors.push("email not yet fully ready, try an asset.");
                scope.$parent.hasError = true;
                scope.$parent.$apply();
                return false;
            }
        }
    };

    this.getPalette = function(key, category){
        return [{key: key,  category: "email", name: "email", color: "red", recipient:"email@address",subject: "", cc: "", image: "mail.png" }
               ]
    };

    this.getNodeTemplateMap = function($, category){
        if (category == 'email'){
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
                          $(go.TextBlock, { row: 1, margin: 4, editable: false, text: "mail to:" }),
                          $(go.TextBlock, { row: 2, margin: 4, editable: true },
                              new go.Binding("text", "recipient").makeTwoWay())
                      )
                  )
            );
        }
    };
}

