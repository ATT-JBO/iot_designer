/**
 * Created by Jan on 23/12/2016.
 */
'use strict';


function DeviceMonitor()  {

    this.canHandleBuildLinkAsTo = function(caller, scope, fromnode, fromport, tonode, toport){
        return true;
    };

    this.canHandleBuildLinkAsFrom = function(caller, scope, fromnode, fromport, tonode, toport){
        return true;
    };

    //build a link for the graph, check if allowed.
    this.buildLinkAsFrom = function(caller, scope, fromnode, fromport, tonode, toport) {
        if (tonode.data.category == "asset") {
            caller.archetypeLinkData = {"label": "output"};
            return go.LinkingTool.prototype.insertLink.call(caller, fromnode, fromport, tonode, toport);
        }
        else {
            scope.$parent.errors.push("A device monitor only sends output to an asse.");
            scope.$parent.hasError = true;
            scope.$parent.$apply();
            return null;
        }
    };


    //build a link for the graph, check if allowed.
    this.buildLinkAsTo = function(caller, scope, fromnode, fromport, tonode, toport) {
        if (fromport.data.category == "device" || fromport.data.category == "asset") {
            caller.archetypeLinkData = {"label": "track"};
            return go.LinkingTool.prototype.insertLink.call(caller, fromnode, fromport, tonode, toport);
        }
        else {
            scope.$parent.errors.push("A device monitor only excepts input from a device (template) or assets.");
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

    this.reconnectLinkAsFrom = function(caller, scope, existingLink, newnode, newport, toend) {
        if (tonode.data.category == "asset") {
            return go.RelinkingTool.prototype.reconnectLink.call(caller, existingLink, newnode, newport, toend);
        }
        else {
            scope.$parent.errors.push("A device monitor only excepts input from a device (template).");
            scope.$parent.hasError = true;
            scope.$parent.$apply();
            return false;
        }
    };

    this.reconnectLinkAsTo = function(caller, scope, existingLink, newnode, newport, toend) {
        if (newnode.data.category == "device" || tonode.data.category == "asset") {
            return go.RelinkingTool.prototype.reconnectLink.call(caller, existingLink, newnode, newport, toend);
        }
        else {
            scope.$parent.errors.push("A device monitor only excepts input from a device (template).");
            scope.$parent.hasError = true;
            scope.$parent.$apply();
            return false;
        }
    };

    this.getPalette = function(key, category){
        return [{key: key,  category: "device_monitor", name: "device monitor", color: "white", image: "deviceMonitor.png" }
               ]
    };
}
