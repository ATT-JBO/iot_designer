/**
 * Created by Jan on 23/12/2016.
 */

'use strict';


// a group for the statistics module. Can link with statistics nodes. Also represents an asset (it creates an asset in the device).
function Group()  {

    this.canHandleBuildLinkAsTo = function(caller, scope, fromnode, fromport, tonode, toport){
        return true;
    };

    this.canHandleBuildLinkAsFrom = function(caller, scope, fromnode, fromport, tonode, toport){
        return false;
    };

    //build a link for the graph, check if allowed.
    this.buildLinkAsTo = function(caller, scope, fromnode, fromport, tonode, toport) {
        if (fromnode.data.category == "statistics") {
            caller.archetypeLinkData = {"label": "in"};
            return go.LinkingTool.prototype.insertLink.call(caller, fromnode, fromport, tonode, toport);
        }
        else {
            scope.$parent.errors.push("A statistical grouping can only references statistical nodes.");
            scope.$parent.hasError = true;
            scope.$parent.$apply();
            return null;
        }
    };

    this.canHandleReconnectLinkAsFrom = function(caller, scope, existingLink, newnode, newport, toend){
        return false;
    };

    this.canHandleReconnectLinkAsTo = function(caller, scope, existingLink, newnode, newport, toend){
        return true;
    };


    this.reconnectLinkAsTo = function(caller, scope, existingLink, newnode, newport, toend) {
        if (newnode.data.category == "statistics")
            return go.RelinkingTool.prototype.reconnectLink.call(caller, existingLink, newnode, newport, toend);
        else {
            scope.$parent.errors.push("A statistical grouping can only references statistical nodes.");
            scope.$parent.hasError = true;
            scope.$parent.$apply();
            return false;
        }
    };

    this.getPalette = function(key, category){
        return [
               ]
    };

    //a statistics node represents an asset, so indicate this to other services that can use assets as input.
    this.isAsset = function(){
        return true;
    };
}

