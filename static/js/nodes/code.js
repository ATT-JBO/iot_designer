/**
 * Created by Jan on 23/12/2016.
 */
'use strict';


function Code()  {

    this.canHandleBuildLinkAsTo = function(caller, scope, fromnode, fromport, tonode, toport){
        return true;
    };

    this.canHandleBuildLinkAsFrom = function(caller, scope, fromnode, fromport, tonode, toport){
        return true;
    };

    //build a link for the graph, check if allowed.
    this.buildLinkAsTo = function(caller, scope, fromnode, fromport, tonode, toport) {
        if (fromnode.data.category == "asset") {
            caller.archetypeLinkData = {"label": "trigger", "trigger on event": true };
            caller.linkingTool.archetypeLabelNodeData = {"category": "LinkLabel", "is": "condition"};   //this is for creating links to links (it creates a node to give a position to link to the link.
            return go.LinkingTool.prototype.insertLink.call(caller, fromnode, fromport, tonode, toport);
        }
        else {
            var plugin = _plugins[fromnode.data.category];
            if(plugin.hasOwnProperty("isAsset") && plugin.isAsset() == true){                       //it's a service that creates an asset,and this also represents an asset (example: statistic)
                caller.archetypeLinkData = {"label": "trigger", "trigger on event": true };
                return go.LinkingTool.prototype.insertLink.call(caller, fromnode, fromport, tonode, toport);
            }
            else {
                scope.$parent.errors.push("a rule, function, 'or' and 'and' node can only link with assets, 'or' and 'and' nodes.");
                scope.$parent.hasError = true;
                scope.$parent.$apply();
                return null;
            }
        }
    };

    //build a link for the graph, check if allowed.
    this.buildLinkAsFrom = function(caller, scope, fromnode, fromport, tonode, toport) {
        if (fromnode.data.category == "constant"){
            if(tonode.data.category == "LinkLabel") {
                if(tonode.data.is == "output"){
                    caller.archetypeLinkData = {"label": "="};
                    return go.LinkingTool.prototype.insertLink.call(caller, fromnode, fromport, tonode, toport);
                }else {
                    caller.archetypeLinkData = {"category": "condition", "operator": "==", "dataInsectorPlugin": "code"};  // dataInsectorPlugin is used to allow the dataInspector use the code plugin when editing the link.
                    return go.LinkingTool.prototype.insertLink.call(caller, fromnode, fromport, tonode, toport);
                }
            }
            else{
                scope.$parent.errors.push("A constant can onl link to a link to code.");
                scope.$parent.hasError = true;
                scope.$parent.$apply();
                return null;
            }
        }
        else {
            if (tonode.data.category == "asset" && ["virtual", "actuator"].indexOf(tonode.data.is) != -1) {
                caller.archetypeLinkData = {"label": "output"};
                caller.linkingTool.archetypeLabelNodeData = {"category": "LinkLabel", "is": "output"};   //this is for creating links to links (it creates a node to give a position to link to the link. 'is' is used for checking the type of linklabel: condition or output
                return go.LinkingTool.prototype.insertLink.call(caller, fromnode, fromport, tonode, toport);
            }
            else if (tonode.data.category == "email") {
                caller.archetypeLinkData = {"label": "output"};
                caller.linkingTool.archetypeLabelNodeData = {"category": "LinkLabel", "is": "output"};   //this is for creating links to links (it creates a node to give a position to link to the link.
                return go.LinkingTool.prototype.insertLink.call(caller, fromnode, fromport, tonode, toport);
            }
            else if (["or", "and", "code"].indexOf(tonode.data.category) != -1) {
                if (fromnode.data.category == "code") {
                    caller.archetypeLinkData = {"label": "output/trigger"};
                    caller.linkingTool.archetypeLabelNodeData = {"category": "LinkLabel", "is": "condition"};   //this is for creating links to links (it creates a node to give a position to link to the link.
                }
                else {
                    caller.archetypeLinkData = {"label": "trigger"};
                }
                return go.LinkingTool.prototype.insertLink.call(caller, fromnode, fromport, tonode, toport);
            }
            else {
                scope.$parent.errors.push("A rule or code can render output to email, a virtual or actuator.");
                scope.$parent.hasError = true;
                scope.$parent.$apply();
                return null;
            }
        }
    };

    this.canHandleReconnectLinkAsFrom = function(caller, scope, existingLink, newnode, newport, toend){
        return true;
    };

    this.canHandleReconnectLinkAsTo = function(caller, scope, existingLink, newnode, newport, toend){
        return true;
    };

    this.reconnectLinkAsTo = function(caller, scope, existingLink, newnode, newport, toend) {
        if(toend == false) {
            if (newnode.data.category == "asset") {
                return go.RelinkingTool.prototype.reconnectLink.call(caller, existingLink, newnode, newport, toend);
            }
            else {
                var plugin = _plugins[newnode.data.category];
                if (plugin.hasOwnProperty("isAsset") && plugin.isAsset() == true) {                       //it's a service that creates an asset,and this also represents an asset (example: statistic)
                    return go.RelinkingTool.prototype.reconnectLink.call(caller, existingLink, newnode, newport, toend);
                }
                else {
                    scope.$parent.errors.push("a rule, function, 'or' and 'and' node can only link with assets, 'or' and 'and' nodes.");
                    scope.$parent.hasError = true;
                    scope.$parent.$apply();
                    return false;
                }
            }
        }
        else{
            if (["or", "and", "code"].indexOf(newnode.data.category) != -1){
                return go.RelinkingTool.prototype.reconnectLink.call(caller, existingLink, newnode, newport, toend);
            }
            else {
                    scope.$parent.errors.push("can only reconnect to [rule, or, and]");
                    scope.$parent.hasError = true;
                    scope.$parent.$apply();
                    return false;
                }
        }
    };

    this.reconnectLinkAsFrom = function(caller, scope, existingLink, newnode, newport, toend) {
        if (existingLink.fromNode.data.category == "constant"){
            if(newnode.data.category == "LinkLabel")
                return go.RelinkingTool.prototype.reconnectLink.call(caller, existingLink, newnode, newport, toend);
            else{
                scope.$parent.errors.push("A constant can onl link to a link to code.");
                scope.$parent.hasError = true;
                scope.$parent.$apply();
                return false;
            }
        }
        else {
            if (newnode.data.category == "asset" && ["virtual", "actuator"].indexOf(tonode.data.is) != -1)
                return go.RelinkingTool.prototype.reconnectLink.call(caller, existingLink, newnode, newport, toend);
            else if (newnode.data.category == "email")
                return go.RelinkingTool.prototype.reconnectLink.call(caller, existingLink, newnode, newport, toend);
            else if (["or", "and", "code"].indexOf(newnode.data.category) != -1)
                return go.RelinkingTool.prototype.reconnectLink.call(caller, existingLink, newnode, newport, toend);
            else {
                scope.$parent.errors.push("A rule or code can render output to email, a virtual or actuator.");
                scope.$parent.hasError = true;
                scope.$parent.$apply();
                return false;
            }
        }
    };

    this.getSelectionForField = function(name){
        if(name == "operator") return ["==", "!=", ">", ">=", "<", "<="];
        return null;
    };

    this.getPalette = function(key, category){
        if(category == "code") {
            return [
                {key: key, category: "root", name: "code"},
                {key: key + 1, category: "code", is: "rule", name: "rule", color: "lightgray", parent: key, image: "rule.png"},
                {key: key + 2, category: "code", is: "function", name: "function", color: "lightgray", code: "", parent: key, image: "code.png"},
                {key: key + 3, category: "or", name: "or", color: "white", parent: key},
                {key: key + 4, category: "and", name: "and", color: "white", parent: key},
                {key: key + 5, category: "root", name: "constants", parent: key},
                {key: key + 6, category: "constant", is: "number", name:"number", value: 0, color: "white", parent: key + 5, image: "number.png"},
                {key: key + 7, category: "constant", is: "string", name:"string", value: "", color: "white", parent: key + 5, image: "text.png"},
                {key: key + 8, category: "constant", is: "boolean", name:"bool", value: true, color: "white", parent: key + 5, image: "boolean.png"},
                ];
        }
        else{
            return [];
        }
    };

    this.getNodeTemplateMap = function($, category){
        if (category == 'or' || category == 'and'){
            return $(go.Node, "Auto",  { locationSpot: go.Spot.Center },
                  new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
                  $(go.Shape, "Circle",
                      {
                          portId: "", cursor: "pointer",
                          width: 45, height: 45,
                          fromLinkable: true, toLinkable: true
                      },
                      new go.Binding("fill", "color")),
                  $(go.TextBlock, { margin: 3, editable: false, text: category })
            );
        } else if (category == 'code'){
            return $(go.Node, "Auto",  { locationSpot: go.Spot.Center },
                  new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
                  $(go.Shape, "PrimitiveToCall",
                      {
                          portId: "", cursor: "pointer",
                          height: 45,
                          fromLinkable: true, toLinkable: true
                      },
                      new go.Binding("fill", "color")),
                  $(go.TextBlock, { margin: 3, editable: false},
                      new go.Binding("text", "name"))
            );
        } else if (category == 'constant'){
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
                      $(go.Panel, "Table", { defaultAlignment: go.Spot.Center },
                          $(go.Picture, { column: 0, rowSpan:2, width: 20, height: 20, stretch: go.GraphObject.None, alignment: go.Spot.Center},
                             new go.Binding("source", "image", function(prop){return "static/img/" + prop; } )),
                          $(go.TextBlock, {column: 1, row: 0, margin: 4, editable: false },
                              new go.Binding("text", "is", function(v){return v + ":";})),      //add a ':' to the end of the word
                          $(go.TextBlock, {column: 1, row: 1, margin: 4, editable: true },
                              new go.Binding("text", "value").makeTwoWay())
                      )
                  )
            );
        }

    };

}

//create an editor that can be used for operators (on rules).
//diagram: the gojs diagram
function loadOperatorEditor(diagram) {
    var helper = new Code();
    var customEditor = document.createElement("select");
    var op;
    var list = helper.getSelectionForField("operator");
    var l = list.length;
    for (var i = 0; i < l; i++) {
        op = document.createElement("option");
        op.text = list[i];
        op.value = list[i];
        customEditor.add(op, null);
    }
    // The TextEditingTool calls onActivate when a custom control is present
    // during the execution of TextEditingTool.doActivate
    // We need to have at least one place where acceptText is called.
    // The TextEditingTool also calls onDecativate when a custom control is present
    // during the execution of TextEditingTool.doDeactivate in case additional custom deactivation is needed
    // GoJS always handles the adding and removing of the textEditingTool.textEditor to and from the DOM.
    // The text used in acceptText is always the textEditingTool.textEditor's "value" property.
    // This is set naturally on elements such as Input, TextArea, and Select, but you would
    // need to set it yourself if your custom textEditor was a container Div.
    customEditor.onActivate = function () {
        customEditor.value = customEditor.textEditingTool.textBlock.text;
        // Do a few different things when a user presses a key
        customEditor.addEventListener("keydown", function (e) {
            var keynum = e.which;
            var tool = customEditor.textEditingTool;
            if (tool === null) return;
            if (keynum == 13) { // Accept on Enter
                tool.acceptText(go.TextEditingTool.Enter);
                return;
            } else if (keynum == 9) { // Accept on Tab
                tool.acceptText(go.TextEditingTool.Tab);
                e.preventDefault();
                return false;
            } else if (keynum === 27) { // Cancel on Esc
                tool.doCancel();
                if (tool.diagram) tool.diagram.focus();
            }
        }, false);
        var loc = customEditor.textEditingTool.textBlock.getDocumentPoint(go.Spot.TopLeft);
        var pos = diagram.transformDocToView(loc);
        customEditor.style.left = pos.x + "px";
        customEditor.style.top = pos.y + "px";
    }
    return customEditor;
}


