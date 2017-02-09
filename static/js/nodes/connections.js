/**
 * Created by Jan on 13/01/2017.
 */
'use strict';


function Connection()  {

    this.canHandleBuildLinkAsTo = function(caller, scope, fromnode, fromport, tonode, toport){
        return false;
    };

    this.canHandleBuildLinkAsFrom = function(caller, scope, fromnode, fromport, tonode, toport){
        return true;
    };

    //build a link for the graph, check if allowed.
    this.buildLinkAsFrom = function(caller, scope, fromnode, fromport, tonode, toport) {

    };

    this.canHandleReconnectLinkAsFrom = function(caller, scope, existingLink, newnode, newport, toend){
        return true;
    };

    this.canHandleReconnectLinkAsTo = function(caller, scope, existingLink, newnode, newport, toend){
        return false;
    };

    this.reconnectLinkAsFrom = function(caller, scope, existingLink, newnode, newport, toend) {

    };

    this.getPalette = function(key, category){
        return [{key: key,  category: "root", name: "connections", color: "red", image: "connections.png" },
                {key: key + 1, category: "connection", color: "red", name: "mqtt", topic: "", broker: "", username:"", pwd:"", parent: key, image: "mqtt.png"  },
                {key: key + 2, category: "connection", color: "red", name: "http push", uri: "", body: "", header: [],  parent: key, image: "httppush.png"  }
               ]
    };
}
