import heapq

def dijkstra(graph, start, end):
    # Step 1: Initialize data structures
    distances = {node: float('inf') for node in graph}
    distances[start] = 0
    pq = [(0, start)]  # Priority queue with (distance, node)
    predecessors = {node: None for node in graph}  # Step 2: Predecessor map

    while pq:
        current_distance, current_node = heapq.heappop(pq)

        # Skip if we've already found a shorter path
        if current_distance > distances[current_node]:
            continue

        # Step 3: Process neighbors
        for neighbor, weight in graph[current_node].items():
            distance = current_distance + weight
            if distance < distances[neighbor]:
                distances[neighbor] = distance
                predecessors[neighbor] = current_node  # Step 4: Track the predecessor
                heapq.heappush(pq, (distance, neighbor))

    # Step 5: Reconstruct the shortest path from end to start
    path = []
    current = end
    while current is not None:
        path.append(current)
        current = predecessors[current]
    path.reverse()  # Reverse the path to get it from start to end

    return distances[end], path

def dijkstra_with_fuel(graph, fuels, start, end, fuel_capacity, fuel_efficiency):
    pq = []  # Min-heap priority queue (stops, fuel left, distance, current_node, path)
    heapq.heappush(pq, (0, fuel_capacity, 0, start, []))  # (stops, fuel_left, distance, node, path)
    
    visited = {}  # Store best (stops, fuel left) for each node to avoid redundant paths

    while pq:
        stops, fuel_left, dist_traveled, node, path = heapq.heappop(pq)
        path = path + [node]

        # If we reached the destination, return the result
        if node == end:
            return dist_traveled, path, stops

        # Avoid revisiting worse paths
        if node in visited and visited[node] <= (stops, fuel_left):
            continue
        visited[node] = (stops, fuel_left)

        # Explore neighbors
        for neighbor, distance in graph[node].items():
            required_fuel = distance * fuel_efficiency

            if fuel_left >= required_fuel:
                # Travel without refueling
                heapq.heappush(pq, (stops, fuel_left - required_fuel, dist_traveled + distance, neighbor, path))
            else:
                # Need to refuel at current node
                fuel_available = fuels.get(node, 0)
                if fuel_available > 0:
                    new_fuel = min(fuel_capacity, fuel_left + fuel_available)  # Refill without exceeding capacity
                    if new_fuel >= required_fuel:
                        heapq.heappush(pq, (stops + 1, new_fuel - required_fuel, dist_traveled + distance, neighbor, path))

    return float('inf'), [], -1  # No valid path found