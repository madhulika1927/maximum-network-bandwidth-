from flask import Flask, render_template, request, jsonify
from algorithm import edmonds_karp, validate_graph

app = Flask(__name__)

DEFAULT_GRAPH = {
    "source": "S",
    "sink": "T",
    "edges": [
        {"from": "S", "to": "A", "capacity": 16},
        {"from": "S", "to": "C", "capacity": 13},
        {"from": "A", "to": "B", "capacity": 12},
        {"from": "B", "to": "C", "capacity": 9},
        {"from": "C", "to": "A", "capacity": 4},
        {"from": "B", "to": "T", "capacity": 20},
        {"from": "C", "to": "D", "capacity": 14},
        {"from": "D", "to": "B", "capacity": 7},
        {"from": "D", "to": "T", "capacity": 4},
    ],
}

@app.route("/")
def index():
    return render_template("index.html", graph=DEFAULT_GRAPH)

@app.post("/api/max-flow")
def max_flow():
    data = request.get_json(silent=True) or {}
    try:
        validate_graph(data)
        result = edmonds_karp(data["edges"], data["source"], data["sink"])
        return jsonify({"ok": True, **result})
    except ValueError as exc:
        return jsonify({"ok": False, "error": str(exc)}), 400
    except Exception as exc:
        return jsonify({"ok": False, "error": "Unexpected server error."}), 500

if __name__ == "__main__":
    app.run(debug=True)
