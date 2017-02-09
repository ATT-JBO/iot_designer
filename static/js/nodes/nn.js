/**
 * Created by Jan on 23/12/2016.
 */
'use strict';

function NN()  {


    this.canHandleBuildLinkAsTo = function(caller, scope, fromnode, fromport, tonode, toport){
        return true;
    };

    this.canHandleBuildLinkAsFrom = function(caller, scope, fromnode, fromport, tonode, toport){
        return true;
    };

    //build a link for the graph, check if allowed.
    this.buildLinkAsTo = function(caller, scope, fromnode, fromport, tonode, toport) {
        if (["asset", "bucketizer", "nn_time"].indexOf(fromnode.data.category) != -1) {
            caller.archetypeLinkData = {"label": "feature", "trigger": ""};
            return go.LinkingTool.prototype.insertLink.call(caller, fromnode, fromport, tonode, toport);
        }
        else {
            var plugin = _plugins[fromnode.data.category];
            if(plugin.hasOwnProperty("isAsset") && plugin.isAsset() == true){                       //it's a service that creates an asset,and this also represents an asset (example: statistic)
                caller.archetypeLinkData =  {"label": "feature", "trigger": ""};
                return go.LinkingTool.prototype.insertLink.call(caller, fromnode, fromport, tonode, toport);
            }
            else {
                scope.$parent.errors.push("A NN can only receive assets and training data as inputs.");
                scope.$parent.hasError = true;
                scope.$parent.$apply();
                return null;
            }
        }
    };

    //build a link for the graph, check if allowed.
    this.buildLinkAsFrom = function(caller, scope, fromnode, fromport, tonode, toport) {
        if (tonode.data.category == "asset" && ["virtual", "actuator", "sensor"].indexOf(tonode.data.is) != -1) {
            if (tonode.data.is == "sensor") {
                caller.archetypeLinkData = {"label": "result"};
            }else if(["virtual", "actuator"].indexOf(tonode.data.is) != -1){
                caller.archetypeLinkData = {"label": "result", "steps": 10};
            }
            return go.LinkingTool.prototype.insertLink.call(caller, fromnode, fromport, tonode, toport);
        }
        else {
            scope.$parent.errors.push("An nn can only link to assets (sensor or actuator/virtual).");
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
        if (["asset", "bucketizer", "nn_time"].indexOf(newnode.data.category) != -1) {
            return go.RelinkingTool.prototype.reconnectLink.call(caller, existingLink, newnode, newport, toend);
        }
        else if(newnode.data.category == "data_generator"){
            return go.RelinkingTool.prototype.reconnectLink.call(caller, existingLink, newnode, newport, toend);
        }
        else {
            var plugin = _plugins[newnode.data.category];
            if(plugin.hasOwnProperty("isAsset") && plugin.isAsset() == true){                       //it's a service that creates an asset,and this also represents an asset (example: statistic)
                return go.RelinkingTool.prototype.reconnectLink.call(caller, existingLink, newnode, newport, toend);
            }
            else {
                scope.$parent.errors.push("A NN can only receive assets and training data as inputs.");
                scope.$parent.hasError = true;
                scope.$parent.$apply();
                return false;
            }
        }
    };

    this.reconnectLinkAsFrom = function(caller, scope, existingLink, newnode, newport, toend) {
        if (newnode.data.category == "asset" && ["virtual", "actuator", "sensor"].indexOf(tonode.data.is) != -1)
            return go.RelinkingTool.prototype.reconnectLink.call(caller, existingLink, newnode, newport, toend);
        else {
            scope.$parent.errors.push("An nn can only link to assets (sensor or actuator/virtual).");
            scope.$parent.hasError = true;
            scope.$parent.$apply();
            return false;
        }
    };

    this.getPalette = function(key, category){
        if(category == "NN"){
            return [{key: key, category: "root", color: "lightyellow", name: "machine learning"  },
                    {key: key + 1, category: "test", color: "lightyellow", name: "time", parent: key  },
                    {key: key + 2, category: "nn_time", color: "white", type: "time_of_day", name: "time of day", image: "time.png", parent: key + 1 },
                    {key: key + 3, category: "nn_time", color: "white", type: "day_of_week", name: "day of week", image: "time.png",parent: key + 1 },
                    {key: key + 4, category: "nn_time", color: "white", type: "year", name: "year", image: "time.png",parent: key + 1 },
                    {key: key + 5, category: "nn_time", color: "white", type: "month", name: "month", image: "time.png",parent: key + 1 },
                    {key: key + 6, category: "nn_time", color: "white", type: "day", name: "day", image: "time.png",parent: key + 1 },
                    {key: key + 7, category: "nn_time", color: "white", type: "hour", name: "hour", image: "time.png",parent: key + 1 },
                    {key: key + 8, category: "nn_time", color: "white", type: "minutes", name: "minutes", image: "time.png",parent: key + 1 },
                    {key: key + 9, category: "nn_time", color: "white", type: "seconds", name: "seconds", image: "time.png",parent: key + 1 },
                    {key: key + 10, category: "root", color: "lightyellow", name: "NN", parent: key  },
                    {key: key + 11, category: "NN", is: "dnn classifier", name: "dnn classifier", color: "white", "hidden units": "[3,3]", image: "favicon.png", parent: key + 10 },
                    {key: key + 12, category: "NN", is: "dnn linear combined clasifier", name: "dnn linear combined clasifier", color: "red", "hidden units": "[3,3]", image: "favicon.png", parent: key + 10 },

                    {key: key + 13, category: "NN", is: "random forrest", name: "random forrest", color: "red", image: "favicon.png", parent: key + 10 },
                    {key: key + 14, category: "NN", is: "recurrent neural network", name: "recurrent neural network", color: "red", image: "favicon.png", parent: key + 10 },

                    {key: key + 15, category: "bucketizer", name: "buckets", color: "white", buckets: [], image: "bucket.jpg", parent: key },
                    {key: key + 16, category: "data_generator", name: "data generator", color: "white", image: "generator.png", columns: [], steps: 10, parent: key },
                    {key: key + 17, category: "data_generation_set", name: "generation set", color: "white", image: "generationset.png", values: [], randomize : [], parent: key }
                   ];
        }
    };

}
