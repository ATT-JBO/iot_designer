__author__ = 'Jan Bogaerts'
__copyright__ = "Copyright 2016, AllThingsTalk"
__credits__ = []
__maintainer__ = "Jan Bogaerts"
__email__ = "jb@allthingstalk.com"
__status__ = "Prototype"  # "Development", or "Production"

import json
from att_event_engine import att as iot
from compiler.serviceManager import ServiceManager
from compiler.service import Service

import att_service_manager.att_service_manager_pb2 as rpc
import grpc

class Publisher():
    """
    responsible for converting a file and dispatching the data to all relevant systems
    """

    def __init__(self, username, pwd):
        """
        :param user: id of hte user
        """
        self.username = username
        self.pwd = pwd
        self.iot = iot.HttpClient()
        self.iot.connect_api(username, pwd)
        self.services = ServiceManager()
        self.services.load()
#        self.channel = grpc.insecure_channel('localhost', 50051)

    def run(self, definition):
        """
        conver the definition into parts and send all out.
        :param definition: json struct containing the data of the map. Can be updated during processing (error messages, ids,...)
        :return:
        """
        for page in definition['definition']['pages']:
            self.extract_services(page)
        result = {}
        for key, value in Service.all_services.iteritems():
            if value != Service.template_service:
                to_add = value.publish()
                if to_add:
                    result[key] = [to_add]
        for key, value in Service.all_services.iteritems():     # we can only build the asset_mappings def after all services have been build and we have determined which need asset mappings.
            mappings = value.publish_asset_mappings()
            if mappings and len(mappings) > 0:
                result[key].append(mappings)
        to_add = Service.template_service.publish()
        if to_add:
            result[Service.template_service.get_name()] = [to_add]     # do the template service last, so that others have had the possibility to add their results that need mapping, to the template service.
        to_add = Service.template_service.build_activation()
        if to_add:
            result['template_activations'] = [to_add]
        result = "{{ {} }}".format(",".join([ '"{}": [{}]'.format(key, ", ".join(x)) for key, x in result.iteritems() if x]))
        #self.send_result_to_manager(result)
        return result

    def extract_services(self, definition):
        """
        walsk over each node in the definition and determin what needs to be built for it.
        :param definition:
        :return:
        """
        node_dict = {node['key']: node for node in definition['data']}  # create a dict of all the nodes on this page, so all node objects are easily found.
        for node in definition['data']:
            if node['category'] in Service.all_services:
                Service.all_services[node['category']].build(self, node, definition['links'], node_dict)

    def send_result_to_manager(self, result):
        stat_service = rpc.beta_create_ServiceManager_stub(self.channel)
        response = stat_service.create_application(result)
        if response:
            response = json.loads(response)
            if "error" in response:
                raise Exception(response['error'])

