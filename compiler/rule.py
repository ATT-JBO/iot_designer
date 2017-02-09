__author__ = 'Jan Bogaerts'
__copyright__ = "Copyright 2016, AllThingsTalk"
__credits__ = []
__maintainer__ = "Jan Bogaerts"
__email__ = "jb@allthingstalk.com"
__status__ = "Prototype"  # "Development", or "Production"


from service import Service
import json

class Rule(Service):
    def __init__(self):
        super(Rule, self).__init__()
        self.objects = {}                       #this dict contains the object declerations for this rule.py. Allows us to re-use objects as much as possible.

    def get_name(self):
        """
        get the name of this service
        :return: a string
        """
        return "code"

    def publish(self):
        """
        render the data that was previouls created with build.
        :return: string with result
        """
        return ", ".join([json.dumps(value) for key, value in self.results])

    def build(self, context, node, links, node_dict):
        """
        extract the information from the inpuat params, to build this service
        :param node: the node that represents this service
        :param links: a list of link objects between nodes (their id's, use node_dict to find object), with all the data
        for the links.
        :param node_dict: a dict with all the nodes (so that the links can be resolved).
        :return: None, Raise exception upon error.
        """
        rule_type = node['is']
        if rule_type == 'rule':
            self.build_rule(node, links, node_dict)
        elif rule_type == 'function':
            self.build_function(node, links, node_dict)

    def build_rule(self, node, links, node_dict):
        lines = []
        result = self._build_code(node, links, node_dict, lines)
        self.results.append(result)

    def build_function(self, node, links, node_dict):
        lines = node['code']
        result = self._build_code(node, links, node_dict, lines)
        self.results.append(result)



    def _build_code(self, node, links, node_dict, lines):
        name = node['name']
        key = node['key']
        in_links = [x for x in links if x['to'] == key]
        cond = ""
        monitor_assets = []
        for link in in_links:
            node = node_dict[link['from']]
            new_filter = self.build_when(link, node, monitor_assets, links, node_dict)
            if new_filter:
                if not filter:
                    cond = new_filter
                else:
                    raise Exception("invalid code: a rule or function can only have 1 incoming link that builds a filter, try using 'and' or 'or' nodes.")
        result = "@When([{monitor}], {filter})\ndef {name}:\n    {lines}".format(name=name,
                                                                                 lines="    ".join(lines),
                                                                                 monitor=",".join(monitor_assets),
                                                                                 filter="lambda: " + cond if filter else "")
        return result

    def build_when(self, link, node, monitor_assets, links, node_dict):
        if node['category'] == 'or':
            return self.build_cond(' or ', node, monitor_assets, links, node_dict)
        elif node['category'] == 'and':
            return self.build_cond(' and ', node, monitor_assets, links, node_dict)
        elif node['category'] == 'asset':
            return self.build_asset(link, node, monitor_assets, links, node_dict)

    def build_cond(self, cond, node, monitor_assets, links, node_dict):
        node_id = node['key']
        cond_links = [x for x in links if x['to'] == node_id]
        results = []
        for link in cond_links:
            from_node = node_dict[link['from']]
            results.append(self.build_when(link, from_node, monitor_assets, links, node_dict))
        return cond.join(results)

    def build_asset(self, link, node, monitor_assets, links, node_dict):
        asset_name = self.get_object_name(node)
        self.register_object(asset_name, node, links, node_dict)
        if link['trigger on event'] == True:
            monitor_assets.append(asset_name)
        operators = [x for x in links if x["to"] in link['labelKeys']]
        if len(operators) > 0:
            operator = operators[0]['operator']
            if operator != 'always':
                r_part = self.build_rpart(operators[0]['from'], links, node_dict)
                return "{} {} {}".format(asset_name, operator, r_part)

    def get_object_name(self, node, category='asset'):
        """
        build a var name for the asset object
        :param node:
        :return:
        """
        return node['name']


    def register_object(self, name, node, links, node_dict):
        """
        if there is no registration for the node, add it to the list of objects that needs to be rendered for the rule.
        :param name:
        :param node:
        :param links:
        :param node_dict:
        :return:
        """
        if name not in self.objects:
            if node['category'] == 'asset':
                init = node['is']
            else:
                init = node['category']
            if 'id' in node:
                init += "(id={id})".format(id=node['id'])
            else:
                gateway_node = None
                init += "(name={name}".format(name=node['name'])
                if node['category'] == 'asset':
                    device_node = self.get_device_for_asset(node,links, node_dict)
                    if device_node:
                        if 'isGateway' in device_node and device_node['isGateway'] == True:
                            gateway_node = device_node
                        else:
                            device_name = self.get_object_name(device_node, 'device')
                            init += ", device={dev}".format(dev=device_name)
                            self.register_object(device_name, device_node, links, node_dict)        # make certain that the device is also declared as object. Do before declaring this object.
                            gateway_node = self.get_device_for_asset(node, links, node_dict)            # a gateway is a device that contains other devices, so we use the same trick as for the asset: look for a link from a device
                else:
                    gateway_node = self.get_device_for_asset(node, links, node_dict)    # it's not an asset, so a device or gateway, let's see if we can find a parent reference...
                if gateway_node:
                    gateway_name = self.get_object_name(gateway_node, 'gateway')
                    init += ", gateway={gat}".format(gat=gateway_name)
                    self.register_object(gateway_name, gateway_node, links,node_dict)  # make certain that the device is also declared as object. Do before declaring this object.


            self.objects[name] = "{name} = {init}".format(name=name, init=init)

    def build_rpart(self, right_side, links, node_dict):
        return right_side
