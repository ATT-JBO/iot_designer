__author__ = 'Jan Bogaerts'
__copyright__ = "Copyright 2016, AllThingsTalk"
__credits__ = []
__maintainer__ = "Jan Bogaerts"
__email__ = "jb@allthingstalk.com"
__status__ = "Prototype"  # "Development", or "Production"

from service import Service
import json
import requests
import logging

class Statistician(Service):
    """
    render the data for a statistics
    """

    def __init__(self):
        super(Statistician, self).__init__()
        self.results = {}

    def get_name(self):
        """
        get the name of this service
        :return: a string
        """
        return "statistics"



    def publish(self):
        """
        render the data that was previouls created with build.
        :return: None
        """
        to_render = []
        for key, value in self.results.iteritems():
            asset_to_map = value['asset_to_map']
            node = value['node']
            del value['asset_to_map']
            del value['node']  # node is a temp ref, in case we create NN
            if asset_to_map:
                Service.template_service.to_activate.append({"asset_to_map": asset_to_map['node'], "template": asset_to_map['template'], "name": key, "value": value, "service": self})
            else:
                node['id'] = self.send(value)
            service_def = json.dumps(value)
            to_render.append(service_def)
        return ", ".join([value for value in to_render])



    def get_result(self, from_node):
        """
        check if there is a preiously built partial result for this template, if so, use that, othwerise, create new.
        :param results:
        :return:
        """
        template_name = "statistics_" + str(from_node['key'])
        if template_name not in self.results:  # could be that the item was already created on another page
            self.result = {"groups": [], "asset_to_map": None}     # the asset field stores a ref to the node that represents the asset, in case that the assetid is not yet known
            self.result['node'] = from_node                          # temp ref to node, will be deleted during publish. Used for in case we need to assign the id of the NN, so we can make distnction between put (update) and post (create)
            self.results[template_name] = self.result
        else:
            self.result = self.results[template_name]

    def build(self, context, node, links, node_dict):
        """
        extract the information from the inpuat params, to build this service
        :param node: the node that represents this service
        :param links: a list of link objects between nodes (their id's, use node_dict to find object), with all the data
        for the links.
        :param node_dict: a dict with all the nodes (so that the links can be resolved).
        :return: None, Raise exception upon error.
        """
        node_id = node['key']
        from_links = [x for x in links if x['to'] == node_id]
        if len(from_links) == 1:
            link = from_links[0]
            from_node = node_dict[link['from']]
            self.get_result(from_node)
            if not 'name' in self.result and 'name' in from_node:
                self.result['name'] = from_node['name']
            self.result['comment'] = "machine rendered"
            from_category = from_node['category']
            if from_category == "asset":                        # it's linking directly to an asset object
                self.set_asset_field(from_node, links, node_dict)
            else:
                from_service = Service.all_services[from_category]
                self.set_asset_field_from_service(from_service, from_node)
            groups = self.get_groups(node, links, node_dict)        # if we get here, it's a valid operation.
            function_obj = self.get_function_obj(node)
            for group in groups:
                group['calculate'].append(function_obj)
            self.set_output(node, links, node_dict)
            self.result['username'] = context.username
            self.result['pwd'] = context.pwd
        else:
            raise Exception("Expected 1 link towards a statiscs node, found {}".format(len(from_links)))

    def is_asset(self):
        return True


    def set_asset_field(self, from_node, links, node_dict):
        """
        assign the 'asset' field to the result
        :param from_node: the node that the statistics node received a link from
        :return:
        """
        if 'id' in from_node:
            self.result['asset'] = from_node['id']          # replace the asset field, could have been a mapping.
            self.result['asset_to_map'] = None
        elif 'asset' not in self.result:                    # could be that it was defined in another view
            self.result['asset_to_map'] = {"node": from_node, "template": self.get_template_for(from_node, links, node_dict)}
            self.result['asset'] = "{{asset}}"

    def set_asset_field_from_service(self, from_service, from_node):
        """
            assign the 'asset' field to the result, but the id of the asset needs to be supplied from a service. Either
            at compile time or after execution.
            :param from_node: the node that the statistics node received a link from
            :return:
            """
        if from_service and from_service.is_asset() == True:  # it's linking to an object that represents an asset (so it needs to request the asset id/name from the service)
            asset_node = from_service.get_asset_node(from_node)
            if asset_node:
                self.set_asset_field(asset_node)
            else:
                self.result['asset'] = "{{asset}}"
                from_service.asset_mappings.append({'data': self.result, 'service': self, 'key': 'asset'})
        else:
            raise Exception("link to statistics node should start from an asset.")

    def get_groups(self, node, links, node_dict):
        """
        look for or create the grouping objects that this statistics calculation should be added to.
        If there are no expicit groupings declared, then a default 'always' group is created.
        :param node:
        :return:
        """
        node_id = node['key']
        nodes = [ node_dict[x['to']] for x in links if x['from'] == node_id and node_dict[x['to']]['category'] == 'group']
        if len(nodes) > 0:
            group_names = [x['name'] for x in nodes]                        # get all the names of the groups we need, so we can extract those that we already havee
            groups = [x for x in self.result['groups'] if x['name'] in group_names]
            if len(groups) != len(nodes):
                group_names = [x['name'] for x in groups]               # get the names of the groups that we have, so we can see which are missing.
                for node in [x for x in nodes if x['name'] not in group_names]:
                    group = {"name": node['name'], "calculate": [], "comment": node['comment'], 'reset': node['reset'], 'start date': node['start date']}
                    self.result['groups'].append(group)
                    groups.append(group)
            return groups
        else:
            always_group = [x for x in self.result['groups'] if 'reset' not in x]
            if len(always_group) == 1:
                return always_group
            else:
                group = {"name": "always", "calculate":[], "comment": "no time grouping"}
                self.result['groups'].append(group)
                return [group]


    def get_function_obj(self, node):
        result = {"function": node['is']}
        if "bucket size" in node:
            result['bucket size'] = node['bucket size']
        if "max" in node:
            result['max'] = node['max']
        if "min" in node:
            result['min'] = node['min']
        return result


    def send(self, value):
        result = None
        if not 'id' in value:
            r = requests.put("http://attrdproduction.westeurope.cloudapp.azure.com:2000/definition/" + value['id'], data= json.dumps(value))
            value['id'] = r.content         # the api returns the id of the object.
            result = r.content
        else:
            r = requests.post("http://attrdproduction.westeurope.cloudapp.azure.com:2s000/definition", data=json.dumps(value))
        logging.info("status: {}, reason: {}, content: {}".format(r.status_code, r.reason, r.content))
        return result