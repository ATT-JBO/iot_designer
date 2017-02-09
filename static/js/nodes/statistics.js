/**
 * Created by Jan on 23/12/2016.
 */
'use strict';

function Statistics()  {

    this.canHandleBuildLinkAsTo = function(caller, scope, fromnode, fromport, tonode, toport){
        return true;
    };

    this.canHandleBuildLinkAsFrom = function(caller, scope, fromnode, fromport, tonode, toport){
        return false;
    };

    //build a link for the graph, check if allowed.
    this.buildLinkAsTo = function(caller, scope, fromnode, fromport, tonode, toport) {
        if (fromnode.data.category == "asset") {
            caller.archetypeLinkData = {"label": "calc"};
            return go.LinkingTool.prototype.insertLink.call(caller, fromnode, fromport, tonode, toport);
        }
        else {
            var plugin = _plugins[fromnode.data.category];
            if(plugin.hasOwnProperty("isAsset") && plugin.isAsset() == true){                       //it's a service that creates an asset,and this also represents an asset (example: statistic)
                caller.archetypeLinkData = {"label": "calc"};
                return go.LinkingTool.prototype.insertLink.call(caller, fromnode, fromport, tonode, toport);
            }
            else {
                scope.$parent.errors.push("A statistic can only be calculated on assets.");
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
        if (newnode.data.category == "asset") {
            return go.RelinkingTool.prototype.reconnectLink.call(caller, caller, existingLink, newnode, newport, toend);
        }
        else {
            var plugin = _plugins[fromnode.data.category];
            if(plugin.hasOwnProperty("isAsset") && plugin.isAsset() == true){                       //it's a service that creates an asset,and this also represents an asset (example: statistic)
                return go.RelinkingTool.prototype.reconnectLink.call(existingLink, newnode, newport, toend);
            }
            else {
                scope.$parent.errors.push("A statistic can only be calculated on assets.");
                scope.$parent.hasError = true;
                scope.$parent.$apply();
                return false;
            }
        }
    };

    //a statistics node represents an asset, so indicate this to other services that can use assets as input.
    this.isAsset = function(){
        return true;
    };
    
    this.getPalette = function(key, category){
        return [
            {key: key,  category: "root", name: "statistics", color: "lightgreen" },
            {key: key + 1,  category: "statistics", is: "count", name: "count", color: "white", image: "statistics.png", parent: key },
            {key: key + 2,  category: "statistics", is: "min", name: "min", color: "white", image: "statistics.png" , parent: key},
            {key: key + 3,  category: "statistics", is: "max", name: "max", color: "white", image: "statistics.png", parent: key },
            {key: key + 4,  category: "statistics", is: "avg", name: "avg", color: "white", image: "statistics.png", parent: key },
            {key: key + 5,  category: "statistics", is: "std", name: "std", color: "white", image: "statistics.png", parent: key },
            {key: key + 6,  category: "statistics", is: "distribution", name: "distribution", color: "white", "bucket size": 2, min: "", max: "", image: "statistics.png", parent: key },
            {key: key + 7,  category: "statistics", is: "distribution %", name: "distribution %", color: "white" , "bucket size": 2, min: "", max: "", image: "statistics.png", parent: key},
            {key: key + 8,  category: "statistics", is: "time distribution", name: "time distribution", color: "white" , "bucket size": 2, min: "", max: "", image: "statistics.png", parent: key},
            {key: key + 9,  category: "statistics", is: "time distribution %", name: "time distribution %", color: "white" , "bucket size": 2, min: "", max: "", image: "statistics.png", parent: key},
            {key: key + 10,  category: "statistics", is: "delta", name: "delta", color: "white", image: "statistics.png" , parent: key},
            {key: key + 11,  category: "group", name: "group", color: "white", reset: '0:0:1:0:0:0', 'start date': '2017-1-1T00:00:00Z', comment: "groups are used for statstics, to create groupings based on time", image: "group.png" , parent: key}
               ]
    };
}
