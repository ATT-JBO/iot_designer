__author__ = 'Jan Bogaerts'
__copyright__ = "Copyright 2016, AllThingsTalk"
__credits__ = []
__maintainer__ = "Jan Bogaerts"
__email__ = "jb@allthingstalk.com"
__status__ = "Prototype"  # "Development", or "Production"

from att_event_engine import att as iot

class Palette(object):
    """
    provides features for managing palettes, like generation based on account content.
    """

    def get_device_nodes(self, username, pwd, key):
        """
        :param user: id of hte user
        """
        result = []
        self.iot = iot.HttpClient()
        self.iot.connect_api(username, pwd)
        grounds = self.iot.getGrounds(False)
        for ground in grounds:
            devices = self.iot.getDevices(ground['id'])
            for device in devices:
                result.append(self.get_dev_node(device, key))
                device_key = key
                key += 1
                assets = self.iot.getAssets(device['id'])
                for asset in assets:
                    result.append(self.get_asset_node(asset, key, device_key))
                    key += 1
        return result


    def get_dev_node(self, device, key):
        return {"key": key, "category": "device", "name": device['name'], "title": device['title'], "isGateway": False, "id": device['id'], "is": "existing", "image": "device.png" }

    def get_asset_node(self, asset, key, device_key):
        return {"key": key, "category": "asset", "name": asset['name'], "title": asset['title'], "is": asset['is'], "profile": asset['profile'], "control": asset['control'], "id": asset['id'], "parent": device_key, "image": self.get_asset_image(asset['is'])}

    def get_asset_image(self, asset_type):
        """
        convert asset-type name to image name
        :param asset_type:
        :return: string
        """
        if asset_type in ["actuator", "virtual", "config"]:
            return "actuator.png"
        else:
            return "sensor.png"


