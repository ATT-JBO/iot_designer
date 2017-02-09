__author__ = 'Jan Bogaerts'
__copyright__ = "Copyright 2016, AllThingsTalk"
__credits__ = []
__maintainer__ = "Jan Bogaerts"
__email__ = "jb@allthingstalk.com"
__status__ = "Prototype"  # "Development", or "Production"

import json

class Service(object):
    """
    base class for all services that can generate a definition.
    """

    template_service = None
    """the service that renders templates. This is provided as a global so that services that are rendering definitions with parameters in that need to be resolved when the device template is applied."""

    all_services = {}
    """a ref to the dict with all the services."""

    def __init__(self):
        self.mappings = {}  # when this service can't be rendered directly, but needs to go through the template loader -> every data point get's it's own mappings object. This is a helper ref.
        self.results = []   # the list of data objects that have been collected for this service. Are used to render the output.
        self.asset_mappings = []    # stores the list of results (and their services) that need to be rendered when the result of this service has been rendered and the asset has been ceated.

    def get_name(self):
        """
        get the name of this service
        :return: a string
        """

    def is_asset(self):
        """
        if this service represents an asset, this fuctnion returns true. Example: a statistics service which represents afunction like count. This generates a new asset.
        :return:
        """
        return False

    def get_asset_node(self, node, links, node_dict):
        """
        if this service represents an asset, it could that the asset is represented by an 'output' link (or similar).
        So ask the service if it already knows the node that represents the asset. if not (asset is dynamially created),
        then a mapping is made.
        :param node: the node that represents the service
        :return:
        """
        node_id = node['key']
        links = [x for x in links if x['from'] == node_id]
        for link in links:
            to_node = node_dict[link['to']]
            if to_node['category'] == "asset":
                return to_node
        return None


    def publish(self):
        """
        render the data that was previouls created with build.
        :return: None
        """
        res = ""
        for x in self.results:
            res = "{}\n{}".format(res, str(x))
        return res

    def publish_asset_mappings(self):
        """
        walks over the asset_mapping objects and generates a string that can be used as a parameter for
        creating the related services.
        :return: a string.
        """
        if self.asset_mappings and len(self.asset_mappings) > 0:
            result = {}
            #for x in self.asset_mappings:

            return json.dumps(result)
        return None

    def build(self, context, node, links, node_dict):
        """
        extract the information from the inpuat params, to build this service
        :param node: the node that represents this service
        :param links: a list of link objects between nodes (their id's, use node_dict to find object), with all the data
        for the links.
        :param node_dict: a dict with all the nodes (so that the links can be resolved).
        :return: None, Raise exception upon error.
        """



    def get_device_for_asset(self, asset, links, node_dict):
        """
        Gets the device node that defines the asset.
        :param asset: The asset to get the device for (or tempalte)
        :param links: the list of links
        :param node_dict: the dict with all known nodes
        :return: a device node (existing, template or new_template)
        """
        dev_link = [x for x in links if x['to'] == asset['key']]
        for link in dev_link:
            from_node = node_dict[link['from']]
            if from_node['category'] == "device":
                return from_node

    def get_template_for(self, node, links, node_dict):
        """
        looks for the template that declare the node (asset)
        :param node: a json object that represents the asset
        :return:
        """
        node_id = node['key']
        links = [x for x in links if x['to'] == node_id]
        for link in links:
            to_node = node_dict[link['from']]
            if to_node['category'] == "device" and to_node['is'] in ["template", "new template"]:
                return to_node
        return None

    def set_output(self, node, links, node_dict):
        """
        if there is an output node assigned, render the output field, otherwise don't add an output field, indicating
        that it should be auto rendered.
        This is a generic implementation that can be used by all services that have an output to an asset.
        :param node:
        :param links:
        :param node_dict:
        :return: True if an output was rendered, otherwise false.
        """
        asset_node = self.get_asset_node(node, links, node_dict)
        if asset_node:
            if 'id' in asset_node:
                self.result['output'] = asset_node['id']
                return True
            elif 'asset' not in self.result:                                # could be that it was defined in another view
                self.mappings[asset_node['key']] = "{{output}}"             # add a mapping so that we render a command for the service generator
                self.result['output'] = "{{output}}"
                return True
        return False