__author__ = 'Jan Bogaerts'
__copyright__ = "Copyright 2016, AllThingsTalk"
__credits__ = []
__maintainer__ = "Jan Bogaerts"
__email__ = "jb@allthingstalk.com"
__status__ = "Prototype"  # "Development", or "Production"

##interface for the projects data

from pymongo import MongoClient
import bson
from publisher import Publisher
import config

class Projects():

    def __init__(self):
        self._db = None
        self._client = None

    def connect(self):
        """
        connect to the db.
        :return:
        """
        self._client = MongoClient('mongodb://localhost:27017')
        self._db = self._client[config.projects_db_name]

    def get_projects(self, user):
        """
        get the list of projects currently available in the system
        :return: a list of json objects
        """
        data = self._db.projects
        return data.find({"userId": user})

    def project_exists(self, user, name):
        """
        check ifa project name exists.
        :param name: the name of the project.
        :return: True: it exists, False: it doesn't
        """
        data = self._db.projects
        result = data.find({"userId": user, "name": name})
        return result.count() != 0

    def get_project(self, identifier):
        """
        get the project with the specified id.
        :return:
        """
        data = self._db.projects
        return data.find_one({"_id": bson.ObjectId(identifier)})

    def get_project_by_name(self, user, name):
        """
        get the definition for the specified project
        :param name: the name of the project
        :return: A json object
        """
        data = self._db.projects
        return data.find_one({"userId": user, "name": name})

    def store_project(self, user, name, definition, identifier=None):
        """
        store the specified project in the system.
        :param name: the name of the project
        :param definition: the definition.
        :return: the id of the newly created record. Raises error upon failure.
        """
        data = self._db.projects
        if identifier:
            result = data.save({"userId": user, "name": name, "definition": definition, "_id": bson.ObjectId(identifier)})
        else:
            result = data.save({"userId": user, "name": name, "definition": definition})
        return str(result)

    def publish_project(self, definition, identifer, username, pwd):
        """
        prepare and render the project.
        :param name: the name of the project
        :return: None
        """
        renderer = Publisher(username, pwd)
        result = renderer.run(definition)
        #self.store_project(user, name, definition, identifier)
        return result