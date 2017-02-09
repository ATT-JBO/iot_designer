/**
 * Created by Jan on 23/12/2016.
 */
'use strict';


function DeviceTemplate()  {


    this.canHandleBuildLinkAsTo = function(caller, scope, fromnode, fromport, tonode, toport){
        return false;
    };

    this.canHandleBuildLinkAsFrom = function(caller, scope, fromnode, fromport, tonode, toport){
        return tonode.data.category == "asset";     //give other objects a change to receive a link from this object.
    };

    //build a link for the graph, check if allowed.
    this.buildLinkAsFrom = function(caller, scope, fromnode, fromport, tonode, toport) {
        if (tonode.data.category == "asset") {
            caller.archetypeLinkData = {"label": "has"};
            return go.LinkingTool.prototype.insertLink.call(caller, fromnode, fromport, tonode, toport);
        }
        else {
            scope.$parent.errors.push("A device (template) can only have assets."); //should normaly never be called.
            scope.$parent.hasError = true;
            scope.$parent.$apply();
            return null;
        }
    };

    this.canHandleReconnectLinkAsFrom = function(caller, scope, existingLink, newnode, newport, toend){
        return true;
    };

    this.canHandleReconnectLinkAsTo = function(caller, scope, existingLink, newnode, newport, toend){
        return false;
    };


    this.reconnectLinkAsFrom = function(caller, scope, existingLink, newnode, newport, toend) {
        if (newnode.data.category == "asset")
            return go.RelinkingTool.prototype.reconnectLink.call(caller, existingLink, newnode, newport, toend);
        else {
            scope.$parent.errors.push("A device (template) can only have assets.");
            scope.$parent.hasError = true;
            scope.$parent.$apply();
            return false;
        }
    };

    this.getPalette = function(key, category){
        return [{key: key, category: "root", color: "lightyellow", name: "templates"  },
                {key: key + 1, category: "device",  is: "new template", color: "white", name: "new template", type: "my-device 1.0", 'activity enabled': false, parent: key, description: "", image: "device.png" },
                {key: key + 2, category: "device", is: "template", color: "white", name: "template 1", parent: key , image: "device.png"},
                {key: key + 3, category: "asset", is: "sensor", color: "white", name: "new_sensor", title: "new sensor", parent: key, profile: "string", control: "label" , image: "sensor.png"},
                {key: key + 4, category: "asset", is: "actuator", color: "white", name: "new_actuator", title: "new actuator", parent: key, profile: "string", control: "input" , image: "actuator.png"},
                {key: key + 5, category: "asset", is: "virtual", color: "white", name: "new_virtual", title: "new virtual", parent: key, profile: "string", control: "input" , image: "actuator.png"},
                {key: key + 6, category: "asset", is: "config", color: "white", name: "new_config", title: "new config", parent: key, profile: "string", control: "input" , image: "sensor.png"}
               ]
    };

    this.getPaletteAsync = function($http, key, category){
        return $http({method:"GET", url:"/api/palette/" + (key + 1).toString()}).then(function(result){      // Angular $http() and then() both return promises themselves
            var list = [{key: key, category: "root", color: "lightyellow", name: "devices"  }];
            for(var i=0; i < result.data.length; i++){
                var record = result.data[i];
                if(!record.hasOwnProperty('color')){
                    record['color'] = 'white';
                }
                if(!record.hasOwnProperty('parent')){
                    record['parent'] = key;
                }
                list.push(record);
            }
            return list;
        });
    };
}
