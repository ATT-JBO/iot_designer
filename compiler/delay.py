__author__ = 'Jan Bogaerts'
__copyright__ = "Copyright 2016, AllThingsTalk"
__credits__ = []
__maintainer__ = "Jan Bogaerts"
__email__ = "jb@allthingstalk.com"
__status__ = "Prototype"  # "Development", or "Production"

from service import Service
import json

class Delay(Service):
    def __init__(self):
        super(Delay, self).__init__()

    def get_name(self):
        """
        get the name of this service
        :return: a string
        """
        return "delay"

    def is_asset(self):
        return True


    def publish(self):
        """
        render the data that was previouls created with build.
        :return: None
        """
        to_render = []
        for value in self.results:
            asset_to_map = value['asset_to_map']
            del value['asset_to_map']
            if asset_to_map:
                Service.template_service.to_activate.append({"asset_to_map": asset_to_map['node'], "template": asset_to_map['template'] ,"name": asset_to_map['name'], "value": value, "service": self})
            to_render.append(value)
        return ", ".join([json.dumps(value) for value in to_render])

    def get_result(self):
        """
        check if there is a preiously built partial result for this template, if so, use that, othwerise, create new.
        :param results:
        :return:
        """
        self.result = {"delay": {}, 'asset_to_map': None}
        self.results.append(self.result)

    def build(self, context, node, links, node_dict):
        """
        extract the information from the inpuat params, to build this service
        :param node: the node that represents this service
        :param links: a list of link objects between nodes (their id's, use node_dict to find object), with all the data
        for the links.
        :param node_dict: a dict with all the nodes (so that the links can be resolved).
        :return: None, Raise exception upon error.
        """
        self.get_result()
        if not 'comment' in self.result and 'comment' in node:
            self.result['comment'] = node['comment']

        self.set_input(node, links, node_dict)
        self.set_output(node, links, node_dict)

        self.result['delay']['filter'] = node['filter']
        self.result['delay']['duration'] = node['duration']



    def set_input(self, node, links, node_dict):
        node_id = node['key']
        links = [x for x in links if x['to'] == node_id]
        if len(links) == 1:
            link = links[0]
            from_node = node_dict[link['from']]
            from_category = from_node['category']
            if from_category == "asset":
                if 'id' in from_node:
                    self.result['input'] = from_node['id']
                elif 'asset' not in self.result:  # could be that it was defined in another view
                    self.result["asset_to_map"] = {"node": from_node, "template": self.get_template_for(from_node, links, node_dict)}
                    self.result['input'] = "{{input}}"
            else:
                from_service = Service.all_services[from_category]
                if from_service and from_service.is_asset() == True:
                    self.result['asset'] = "{{asset}}"
                    from_service.asset_mappings.append({'data': self.result, 'service': self, 'key': 'asset'})
                else:
                    raise Exception("A delay always needs 1 input from an asset.")
        else:
            raise Exception("Expected 1 link towards a delay node, found {}".format(len(links)))


