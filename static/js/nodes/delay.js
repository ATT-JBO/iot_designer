/**
 * Created by Jan on 23/12/2016.
 */
'use strict';


function Delay()  {

    this.canHandleBuildLinkAsTo = function(caller, scope, fromnode, fromport, tonode, toport){
        return true;
    }

    this.canHandleBuildLinkAsFrom = function(caller, scope, fromnode, fromport, tonode, toport){
        return true;
    };

    //build a link for the graph, check if allowed.
    this.buildLinkAsTo = function(caller, scope, fromnode, fromport, tonode, toport) {
        if (fromnode.data.category == "asset") {
            caller.archetypeLinkData = {"label": "input"};
            return go.LinkingTool.prototype.insertLink.call(caller, fromnode, fromport, tonode, toport);
        }
        else {
            var plugin = _plugins[fromnode.data.category];
            if(plugin.hasOwnProperty("isAsset") && plugin.isAsset() == true){                       //it's a service that creates an asset,and this also represents an asset (example: statistic)
                caller.archetypeLinkData = {"label": "input"};
                return go.LinkingTool.prototype.insertLink.call(caller, fromnode, fromport, tonode, toport);
            }
            else {
                scope.$parent.errors.push("A delay works on an asset.");
                scope.$parent.hasError = true;
                scope.$parent.$apply();
                return null;
            }
        }
    };

    this.buildLinkAsFrom = function(caller, scope, fromnode, fromport, tonode, toport) {
        if (tonode.data.category == "asset") {
            caller.archetypeLinkData = {"label": "output"};
            return go.LinkingTool.prototype.insertLink.call(caller, fromnode, fromport, tonode, toport);
        }
        else {
            scope.$parent.errors.push("A delay sends it's output to an asset.");
            scope.$parent.hasError = true;
            scope.$parent.$apply();
            return null;
        }
    };

    this.canHandleReconnectLinkAsFrom = function(caller, scope, existingLink, newnode, newport, toend){
        return true;
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
                scope.$parent.errors.push("A delay works on an asset.");
                scope.$parent.hasError = true;
                scope.$parent.$apply();
                return false;
            }
        }
    };

    this.reconnectLinkAsFrom = function(caller, scope, existingLink, newnode, newport, toend) {
        if (newnode.data.category == "asset")
            return go.RelinkingTool.prototype.reconnectLink.call(caller, existingLink, newnode, newport, toend);
        else {
            scope.$parent.errors.push("A delay sends it's output to an asset.");
            scope.$parent.hasError = true;
            scope.$parent.$apply();
            return false;
        }
    };

    this.getPalette = function(key, category){
        return [{key: key,  category: "delay", name: "delay", color: "white", filter: "", duration: 240, image: "delay.png" }];
    };

    //a statistics node represents an asset, so indicate this to other services that can use assets as input.
    this.isAsset = function(){
        return true;
    };
}
