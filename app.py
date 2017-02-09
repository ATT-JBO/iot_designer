from flask import Flask, send_file, make_response, render_template, request, Response, jsonify, session
from flask.ext.session import Session


app = Flask(__name__)
sess = Session()

import json
import logging
from projects import Projects
from palette import Palette
from bson.json_util import dumps
from att_event_engine import att as iot

projects = Projects()
palette = Palette()



@app.route("/")
def index():
    #return send_file("templates/index.html")
    return make_response(render_template('index.html'))


@app.route('/api/login', methods=['POST'])
def login():
    json_data = request.json
    client = iot.HttpClient()
    login_info = client.connect_api(json_data['user'], json_data['password'])
    if login_info:
        status = True
        session['user'] = client.get_user_info()['id']
        session['username'] = json_data['user']         # currently still need to pass these along to the services
        session['password'] = json_data['password']
    else:
        status = False
    return jsonify({'result': status})

@app.route('/api/logout')
def logout():
    session.pop('user', None)
    return jsonify({'result': 'success'})


@app.route('/api/loginstatus')
def status():
    if session.get('user'):
        if session['user']:
            return jsonify({'status': True})
    else:
        return jsonify({'status': False})


@app.route("/api/projects", methods=['GET'])
def get_projects():
    try:
        list = projects.get_projects(session['user'])
        return Response(dumps([x for x in list]), status=200)       # use bson dump, so it works with mongo fields like objectId
    except Exception as e:
        return Response(e.message, status=400)

@app.route("/api/project/<name>", methods=['GET'])
def get_project(name):
    try:
        result = projects.get_project_by_name(session['user'], name)
        return Response(dumps(result), status=200)                  # use bson dump, so it works with mongo fields like objectId
    except Exception as e:
        return Response(e.message, status=400)

@app.route("/api/project", methods=['POST'])
def post_project():
    try:
        data = json.loads(request.data)
        name = data['name']
        if projects.project_exists(session['user'], name) == False:
            id = projects.store_project(session['user'], name, data)
            result = {"id": id}
            resp = Response(dumps(result), status=200, mimetype='application/json')     # use bson dump, so it works with mongo fields like objectId
        else:
            resp = Response('"Project name already exists"', status=400, mimetype='application/json')
    except Exception as e:
        logging.exception("failed to create project")
        resp = Response(e.message, status=400)
    return resp

@app.route("/api/project/<id>", methods=['PUT'])
def put_project(id):
    data = json.loads(request.data)
    return _put_project(id, data)

def _put_project(id, data):
    """
    store the project
    :param id: the id of the project
    :param data: json structure representation of the projects
    :return:  Response
    """
    name = data['name']
    if projects.project_exists(session['user'], name) == True:
        projects.store_project(session['user'], name, json.loads(request.data), id)
        resp = Response('"ok"', status=200, mimetype='application/json')
    else:
        resp = Response("Project name doesn't exist", status=400)
    return resp

@app.route("/api/publish/<id>", methods=['PUT'])
def publish_project(id):
    try:
        data = projects.get_project(id)
        result = projects.publish_project(data, id, session['username'], session['password'])
        return Response(result, status=200)
    except Exception as e:
        logging.exception("failed to publish")
        return Response(e.message, status=400)



@app.route("/api/palette/<key>", methods=['GET'])
def get_palette(key):
    try:
        list = palette.get_device_nodes( session['username'],  session['password'], int(key))
        return Response(json.dumps(list), status=200)
    except Exception as e:
        logging.exception("failed to build palette")
        return Response(e.message, status=400)


projects.connect()
app.secret_key = 'graph designer proto type 1 by Jan Bogaerts for ATT'
app.config['SESSION_TYPE'] = 'filesystem'

sess.init_app(app)
if __name__ == '__main__':
    app.debug = True
    app.run(host='0.0.0.0', debug=True, threaded=True, port=1010) #, port=config.port
