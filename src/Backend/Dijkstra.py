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