from flask import Flask, jsonify, request
from flask_cors import CORS
from Database import retrieve_dict, insert

app = Flask(__name__)
CORS(app)  # Enable CORS for the frontend to fetch data

@app.route('/api/database/<database_name>/', methods=['GET'])
def get_data(database_name):
    try:
        response = retrieve_dict(database_name)
        return jsonify(response)
    except Exception as e:
        print(e)
        return jsonify({"error": str(e)}), 500

@app.route('/api/database/<database_name>/', methods=['POST'])
def set_data(database_name):
    try:
        data = request.json
        response = insert(data, database_name)
        return jsonify(response)
    except Exception as e:
        print(e)
        return jsonify({"error" : str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True)