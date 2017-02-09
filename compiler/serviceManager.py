__author__ = 'Jan Bogaerts'
__copyright__ = "Copyright 2016, AllThingsTalk"
__credits__ = []
__maintainer__ = "Jan Bogaerts"
__email__ = "jb@allthingstalk.com"
__status__ = "Prototype"  # "Development", or "Production"

from deviceTemplate import DeviceTemplate
from statistician import Statistician
from delay import Delay
from nn import NN
from rule import Rule
from deviceMonitor import DeviceMonitor
from service import Service

class ServiceManager(object):
    """
    manages all the available services
    """


    def load(self):
        # load all the service-objects. They work as functions, don't wrap the data, cause the data objects can be scattered
        to_add = DeviceTemplate()
        Service.all_services[to_add.get_name()] = to_add
        Service.template_service = to_add

        to_add = Statistician()
        Service.all_services[to_add.get_name()] = to_add

        to_add = Delay()
        Service.all_services[to_add.get_name()] = to_add

        to_add = NN()
        Service.all_services[to_add.get_name()] = to_add

        to_add = Rule()
        Service.all_services[to_add.get_name()] = to_add

        to_add = DeviceMonitor()
        Service.all_services[to_add.get_name()] = to_add