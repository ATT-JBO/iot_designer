__author__ = 'Jan Bogaerts'
__copyright__ = "Copyright 2016, AllThingsTalk"
__credits__ = []
__maintainer__ = "Jan Bogaerts"
__email__ = "jb@allthingstalk.com"
__status__ = "Prototype"  # "Development", or "Production"

from service import Service
import json

class DeviceTemplate(Service):
    """
    translate a device template .
    """

    def __init__(self):
        super(DeviceTemplate, self).__init__()
        self.results = {}
        self.to_activate = []           # contains results from other services that need to be rendered for templates.

    def get_name(self):
        """
        get the name of this service
        :return: a string
        """
        return "device"

    def publish(self):
        """
        render the data that was previouls created with build.
        :return: string with result
        """
        return ", ".join([json.dumps(value) for key, value in self.results.iteritems()])

    def get_result(self, node):
        """
        check if there is a preiously built partial result for this template, if so, use that, othwerise, create new.
        :param results:
        :return:
        """
        template_name = self.get_template_name(node)
        if template_name not in self.results:  # could be that the item was already created on another page
            self.result = {"template": {"assets": []}}
            self.results[template_name] = self.result
        else:
            self.result = self.results[template_name].result

    def build(self, context, node, links, node_dict):
        """
        extract the information from the inpuat params, to build this service
        :param node: the node that represents this service
        :param links: a list of link objects between nodes (their id's, use node_dict to find object), with all the data
        for the links.
        :param results: the dict with previously loaded (partial) items
        :return: None, Raise exception upon error.
        """

        def build_asset(from_node):
            category = from_node['category']
            if category == "asset":
                return {"is": from_node['is']}

        self.get_result(node)
        template = self.result['template']
        self.result['type'] = node['type']

        template['title'] = node['name']
        template['description'] = node['description']
        template['type'] = node['type']
        template['activityEnabled'] = node['activity enabled']

        node_id = node['key']
        for link in [x for x in links if x['from'] == node_id]:
            to_node = node_dict[link['to']]
            asset_def = build_asset(to_node)
            if asset_def:
                template['assets'].append(asset_def)
                asset_def['profile'] = to_node['profile']
                asset_def['control'] = to_node['control']
                asset_def['name'] = to_node['name']
                asset_def['title'] = to_node['title']


    def build_activation(self):
        """
        build the activation script that needs to be executed for this template
        :return: a string with the activation script
        """
        result = []
        for x in self.to_activate:
            record = {}
            result.append(record)
            if "asset_to_map" in x:
                template_node = x['template']
                if template_node:
                    record['template'] = self.get_template_name(template_node)
                    record['service'] = x['service'].get_name()
                    record['name'] = x['name']
                    record['asset'] = x['asset_to_map']['name']
                else:
                    raise Exception("asset node is not related to a template: can't build mappings")
            elif 'mappings' in x:
                record['service'] = x['service'].get_name()
                record['name'] = x['name']
                record['mappings'] = x['mappings']
            else:
                raise Exception("unknown field in mappings input")
        if len(result) > 0:
            return ", ".join([json.dumps(x) for x in result])
        else:
            return None


    def get_template_name(self, node):
        """
        build the template name for the node that represents the template
        :param node:
        :return:
        """
        return "dev_template_" + node['name']
