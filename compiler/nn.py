__author__ = 'Jan Bogaerts'
__copyright__ = "Copyright 2016, AllThingsTalk"
__credits__ = []
__maintainer__ = "Jan Bogaerts"
__email__ = "jb@allthingstalk.com"
__status__ = "Prototype"  # "Development", or "Production"

from service import Service
from att_event_engine.resources import Asset
import json
import requests
import logging

class NN(Service):
    """
    translate a device template .
    """

    def __init__(self):
        super(NN, self).__init__()
        self.results = {}

    def get_name(self):
        """
        get the name of this service
        :return: a string
        """
        return "NN"

    def is_asset(self):
        return True


    def publish(self):
        """
        render the data that was previouls created with build.
        :return: string with result
        """
        to_render = []
        for key, value in self.results.iteritems():
            mappings = value['mappings']
            del value['mappings']
            node = value['node']
            del value['node']                   #node is a temp ref, in case we create NN
            if len(mappings) > 0:
                Service.template_service.to_activate.append({"mappings": mappings, "name": key, "value": value, "service": self})
            else:
                node['id'] = self.send(value)
            to_render.append(value)
        return ", ".join([json.dumps(value) for value in to_render])

    def get_result(self, node):
        """
        check if there is a preiously built partial result for this template, if so, use that, othwerise, create new.
        :return:
        """
        template_name = "nn_" + node['name']
        if template_name not in self.results:  # could be that the item was already created on another page
            id = node['id'] if 'id' in node else None
            self.result = {"features": [], "result": {}, "traindata": {}, "mappings": [], "id": id}
            self.result['node'] = node                      # temp ref to node, will be deleted during publish. Used for in case we need to assign the id of the NN, so we can make distnction between put (update) and post (create)
            self.results[template_name] = self.result
        else:
            self.result = self.results[template_name].result
        self.mappings = self.result['mappings']

    def build(self, context, node, links, node_dict):
        """
        extract the information from the inpuat params, to build this service
        :param node: the node that represents this service
        :param links: a list of link objects between nodes (their id's, use node_dict to find object), with all the data
        for the links.
        :param node_dict: a dict with all the nodes (so that the links can be resolved).
        :param results: the dict with previously loaded (partial) items
        :return: None, Raise exception upon error.
        """
        self.get_result(node)
        if 'hidden units' in node:                                  # not all use this form.
            self.result['hidden_units'] = node['hidden units']
        self.result['model'] = node['is']
        node_id = node['key']
        dev_link = [x for x in links if x['from'] == node_id]
        if len(dev_link) == 1:
            self.build_nn_result(dev_link[0], links, node_dict)
        else:
            raise Exception("An nn should always have an output to an asset (sensor or actuator/virtual)")

        features = self.result['features']
        to_links = [x for x in links if x['to'] == node_id]
        for link in to_links:
            from_node = node_dict[link['from']]
            if from_node['category'] in ['bucketizer', 'asset', 'nn_time']:
                feature = self.build_feature(link, from_node, links, node_dict)
                features.append(feature)
            elif from_node['category'] == 'data_generator':
                self.build_train_data(from_node, node, links, node_dict)
        self.result['result'] = self.build_result(node, links, node_dict, context)
        self.result['username'] = context.username
        self.result['pwd'] = context.pwd



    def build_nn_result(self, result_link, links, node_dict):
        out_node = node_dict[result_link['to']]
        result = self.result['result']
        if out_node['is'] == "sensor":
            result['sensor'] = out_node['name']
        elif out_node['is'] in ['virtual', 'asset']:
            result['actuator'] = out_node['name']
            result['steps'] = result_link['steps']
        device_node = self.get_device_for_asset(out_node, links, node_dict)
        if device_node:
            if device_node['is'] == 'existing':
                result['device'] = device_node['id']
            else:
                result['device'] = "{{device}}"
                self.mappings.append({'field': "device_id", "to_replace": "{{device}}"})

    def build_feature(self, link, from_node, links, node_dict):
        feature = {key: value for key, value in from_node.iteritems() if
                   key in ["comment", "name"]}  # create a dict and copy over all the useful fields.
        if 'trigger' in link and len(link['trigger']) > 0:
            feature['trigger'] = link['trigger']

        node_cat = from_node['category']
        if node_cat == 'bucketizer':
            feature['buckets'] = from_node['buckets']
            from_links = [x for x in links if
                          x['to'] == from_node['key']]  # get the links to the bucketizer object, should be 1: the asset or time.
            if len(from_links) != 1:
                raise Exception("Bucketizer expects 1 input from an asset")
            from_node = node_dict[from_links[0]['from']]
            node_cat = from_node['category']

        if node_cat == 'asset':         # warning: the previous code can change 'from_node and node_cat
            if 'id' in from_node:
                feature['asset'] = from_node['id']
            else:
                feature['asset'] = "{{asset}}"
                self.mappings.append({'field': from_node['name'], "to_replace": "{{asset}}" })
        elif node_cat == 'nn_time':
            feature['time'] = from_node['type']
        else:
            raise Exception("Unexpected link")
        return feature


    def build_train_data(self, from_node, to_node, links, node_dict):
        train_data = self.result['traindata']
        if 'columns' in train_data:
            raise Exception("multiple training declerations for nn")
        train_data['columns'] = from_node['columns']
        train_data['steps'] = from_node['steps']
        group_links = [x for x in links if x['to'] == from_node['key']]
        groups = []
        for link in group_links:
            group_node = node_dict[link['from']]
            groups.append({"values": group_node['values'], "randomize": group_node['randomize']})
        train_data['groups'] = groups

    def build_result(self, node, links, node_dict, context):
        try:
            link = [ x for x in links if x['from'] == node['key']]
            if link and len(link) == 1:
                link = link[0]
            else:
                raise Exception("can't create neural network: no result assigned")
            result_node = node_dict[link['to']]
            if result_node:
                result = {}
                if 'id' in result_node:
                    asset = Asset(id=result_node['id'], connection=context.iot)
                    asset_def =  asset._getDefinition()
                    result[self.get_result_output_field(asset_def['is'])] = asset.name
                    result['device'] = asset.device.id
                else:
                    device = self.get_device_for_asset(node, links, node_dict)
                    result['device'] = "{{device}}"
                    self.mappings.append({'field': device['name'], "to_replace": "{{device}}"})
                    result[self.get_result_output_field(node['is'])] = node.name
                result['steps'] = link['steps']
                return result
            else:
                raise Exception("can't create neural network: no result assigned")
        except Exception as e:
            node['error'] = e.message
            raise

    def get_result_output_field(self, actual):
        if actual in ['virtual', 'actuator']:
            return 'actuator'
        else:
            return 'sensor'

    def send(self, value):
        result = None
        if not 'id' in value:
            r = requests.put("http://attrdproduction.westeurope.cloudapp.azure.com:4000/definition/" + value['id'], data= json.dumps(value))
            value['id'] = r.content         # the api returns the id of the object.
            result = r.content
        else:
            r = requests.post("http://attrdproduction.westeurope.cloudapp.azure.com:4000/definition", data=json.dumps(value))
        logging.info("status: {}, reason: {}, content: {}".format(r.status_code, r.reason, r.content))
        return result



