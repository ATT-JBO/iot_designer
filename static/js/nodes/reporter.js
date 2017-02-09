/**
 * Created by Jan on 13/01/2017.
 */
'use strict';


function Reporter()  {

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
        return [{key: key,  category: "root", name: "reports", color: "red", image: "report_generator.png"},
                {key: key + 1,  category: "reporter", name: "report generator", color: "red", image: "report_generator.png", parent: key, content: "" },
                {key: key + 2,  category: "reporter", name: "pdf output", color: "red", image: "pdf.png", parent: key }
               ]
    };
}
