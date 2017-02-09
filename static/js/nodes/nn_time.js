/**
 * Created by Jan on 23/12/2016.
 */

'use strict';

function NN_Time()  {

    this.canHandleBuildLinkAsTo = function(caller, scope, fromnode, fromport, tonode, toport){
        return false;
    };

    this.canHandleBuildLinkAsFrom = function(caller, scope, fromnode, fromport, tonode, toport){
        return false;        //handled by nn (or any other that this can link to)
    };

    this.canHandleReconnectLinkAsFrom = function(caller, scope, existingLink, newnode, newport, toend){
        return false;
    };

    this.canHandleReconnectLinkAsTo = function(caller, scope, existingLink, newnode, newport, toend){
        return false;
    };

    this.getPalette = function(key, category){
        return [//done by nn
               ]
    };

    //a statistics node represents an asset, so indicate this to other services that can use assets as input.
    this.isAsset = function(){
        return true;
    };
}

