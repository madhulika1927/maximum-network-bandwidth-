# FLOWCORE — Network Flow Command Center

A visual DAA project for finding the **Maximum Network Bandwidth** using the **Edmonds–Karp algorithm**.

## Features
- Flask + Python backend
- Edmonds–Karp maximum-flow algorithm
- BFS-based augmenting path search
- Interactive network graph
- Animated data packets
- Step-by-step algorithm playback
- Residual graph visualization
- Capacity / flow / residual metrics
- Bandwidth utilization chart
- Add and remove network edges
- Demo graph included

## Run

### Windows
```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Open: http://127.0.0.1:5000

### macOS / Linux
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python3 app.py
```

## DAA concepts demonstrated
1. Flow network
2. Capacity constraint
3. Residual graph
4. BFS
5. Augmenting path
6. Bottleneck capacity
7. Residual capacity updates
8. Maximum flow
9. Edmonds–Karp complexity: O(VE²)
