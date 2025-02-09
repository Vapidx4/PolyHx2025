from flask import Flask, jsonify, render_template, request
from flask_cors import CORS
from PathOptimizer import dijkstra, dijkstra_with_fuel

app = Flask(__name__)
CORS(app)

fuel_efficiency = 0.5

@app.route("/")
def index():
    return render_template("index.html")

@app.route('/submit-nodes', methods=['POST'])
def submit_nodes():
    try:
        data = request.get_json()

        graph = data.get('graph')
        start_node = data.get('startNode')
        end_node = data.get('endNode')
        fuels = data.get('fuels')
        fuel_capacity = int(data.get('fuel_capacity'))

        distance, path = dijkstra(graph, start_node, end_node)

        print(fuel_capacity)
        print(start_node)
        print(distance)
        print(fuel_efficiency)

        if (fuel_capacity < distance * fuel_efficiency) :
            distance, path, stops = dijkstra_with_fuel(graph, fuels, start_node, end_node, fuel_capacity, fuel_efficiency)

            if stops == -1:  # Not enough fuel
                print("Not enough fuel to travel")
                return jsonify({
                    "status": "error",
                    "message": "Not enough fuel to reach the destination."
                }), 400  # Return a 400 Bad Request error

        print(distance)
        print(path)
        print(fuels)

        return jsonify({
            "status": "success",
            "path": path,
            "distance": distance
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=8080)