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

class DeviceMonitor(Service):
    """
    render the data for a statistics
    """

    def __init__(self):
        super(DeviceMonitor, self).__init__()
        self.results = {}

    def get_name(self):
        """
        get the name of this service
        :return: a string
        """
        return "device_monitor"



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
        links = [x for x in links if x['from'] == node_id]

        devs = set()

        for link in links:
            node = node_dict[link['from']]
            dev_id = self.get_dev_id(node)
            devs.add(dev_id)

        for dev in devs:
            self.get_result(to_node)
            if not 'name' in self.result and 'name' in to_node:
                self.result['name'] = to_node['name']
            self.result['comment'] = "machine rendered"
            from_category = to_node['category']
            if from_category == "asset":                        # it's linking directly to an asset object
                self.set_asset_field(to_node, links, node_dict)
            else:
                from_service = Service.all_services[from_category]
                self.set_asset_field_from_service(from_service, to_node)
            groups = self.get_groups(node, links, node_dict)        # if we get here, it's a valid operation.
            function_obj = self.get_function_obj(node)
            for group in groups:
                group['calculate'].append(function_obj)
            self.set_output(node, links, node_dict)
            self.result['username'] = context.username
            self.result['pwd'] = context.pwd

    def is_asset(self):
        return True


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

    def get_dev_id(self, node):
        """
        if the node is a device, return it's id (or a placeholder
        if the node is an asset, first get it's device (template) and return it's id or placeholder
        :param node:
        :return:
        """