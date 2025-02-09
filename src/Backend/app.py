from flask import Flask, jsonify, render_template, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route("/")
def index():
    return render_template("index.html")

@app.route('/submit-nodes', methods=['POST'])
def submit_nodes():
    try:
        data = request.get_json()
        print("This is the data:", data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    return jsonify({"status": "success", "nodes": data})


if __name__ == '__main__':
    app.run(debug=True, port=8080)