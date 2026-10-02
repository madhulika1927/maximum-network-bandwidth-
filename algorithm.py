from collections import defaultdict, deque

def validate_graph(data):
    if not isinstance(data.get("source"), str) or not data["source"].strip():
        raise ValueError("A valid source node is required.")
    if not isinstance(data.get("sink"), str) or not data["sink"].strip():
        raise ValueError("A valid destination node is required.")
    if data["source"] == data["sink"]:
        raise ValueError("Source and destination must be different.")
    edges = data.get("edges")
    if not isinstance(edges, list) or not edges:
        raise ValueError("Add at least one network connection.")
    for e in edges:
        if not all(k in e for k in ("from", "to", "capacity")):
            raise ValueError("Every connection needs from, to and capacity.")
        if e["from"] == e["to"]:
            raise ValueError("Self-loops are not supported.")
        try:
            c = float(e["capacity"])
        except Exception:
            raise ValueError("Capacity must be numeric.")
        if c <= 0:
            raise ValueError("Capacity must be greater than zero.")

def edmonds_karp(edges, source, sink):
    nodes = {source, sink}
    capacity = defaultdict(lambda: defaultdict(float))
    original = []

    # Combine parallel directed edges into one residual capacity.
    for e in edges:
        u, v, c = e["from"], e["to"], float(e["capacity"])
        nodes.update([u, v])
        capacity[u][v] += c
        original.append({"from": u, "to": v, "capacity": c})

    residual = defaultdict(lambda: defaultdict(float))
    for u in nodes:
        for v in nodes:
            residual[u][v] = capacity[u][v]

    flow = defaultdict(lambda: defaultdict(float))
    steps = []
    max_flow = 0.0
    iteration = 0

    while True:
        iteration += 1
        parent = {source: None}
        q = deque([source])

        # BFS on residual graph.
        while q and sink not in parent:
            u = q.popleft()
            for v in sorted(nodes):
                if v not in parent and residual[u][v] > 1e-9:
                    parent[v] = u
                    q.append(v)
                    if v == sink:
                        break

        if sink not in parent:
            break

        path = []
        cur = sink
        while cur != source:
            path.append(cur)
            cur = parent[cur]
        path.append(source)
        path.reverse()

        bottleneck = min(
            residual[path[i]][path[i+1]] for i in range(len(path)-1)
        )

        before = []
        for i in range(len(path)-1):
            u, v = path[i], path[i+1]
            before.append({
                "from": u, "to": v,
                "residualBefore": round(residual[u][v], 4),
                "bottleneck": round(bottleneck, 4)
            })

        for i in range(len(path)-1):
            u, v = path[i], path[i+1]
            residual[u][v] -= bottleneck
            residual[v][u] += bottleneck
            flow[u][v] += bottleneck
            flow[v][u] -= bottleneck

        max_flow += bottleneck

        residual_snapshot = []
        for u in sorted(nodes):
            for v in sorted(nodes):
                if residual[u][v] > 1e-9:
                    residual_snapshot.append({
                        "from": u, "to": v,
                        "capacity": round(residual[u][v], 4)
                    })

        steps.append({
            "iteration": iteration,
            "path": path,
            "bottleneck": round(bottleneck, 4),
            "flowAdded": round(bottleneck, 4),
            "edges": before,
            "residual": residual_snapshot
        })

    final_edges = []
    for e in original:
        u, v = e["from"], e["to"]
        used = max(0.0, min(e["capacity"], flow[u][v]))
        final_edges.append({
            "from": u,
            "to": v,
            "capacity": round(e["capacity"], 4),
            "flow": round(used, 4),
            "remaining": round(e["capacity"] - used, 4)
        })

    return {
        "maxFlow": round(max_flow, 4),
        "nodes": sorted(nodes),
        "originalEdges": original,
        "finalEdges": final_edges,
        "steps": steps,
        "iterations": len(steps),
        "complexity": "O(VE²)"
    }
