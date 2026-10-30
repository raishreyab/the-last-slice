import * as THREE from 'three';

// Waypoint Navigation Graph for Pizzeria
export class NavigationGraph {
  constructor() {
    this.nodes = {};
    this.initPizzeriaWaypoints();
  }

  addNode(id, x, y, z, neighbors = []) {
    this.nodes[id] = {
      id,
      position: new THREE.Vector3(x, y, z),
      neighbors: [...neighbors]
    };
  }

  connect(id1, id2) {
    if (this.nodes[id1] && !this.nodes[id1].neighbors.includes(id2)) {
      this.nodes[id1].neighbors.push(id2);
    }
    if (this.nodes[id2] && !this.nodes[id2].neighbors.includes(id1)) {
      this.nodes[id2].neighbors.push(id1);
    }
  }

  initPizzeriaWaypoints() {
    // 1. Central Hallway Waypoints
    this.addNode('hall_north', 0, 0, -17);
    this.addNode('hall_mid_north', 0, 0, -8);
    this.addNode('hall_center', 0, 0, 0);
    this.addNode('hall_mid_south', 0, 0, 9);
    this.addNode('hall_south_exit', 0, 0, 16);

    this.connect('hall_north', 'hall_mid_north');
    this.connect('hall_mid_north', 'hall_center');
    this.connect('hall_center', 'hall_mid_south');
    this.connect('hall_mid_south', 'hall_south_exit');

    // 2. Bedroom Doorway & Interior
    this.addNode('door_bed_outside', -1.2, 0, -17);
    this.addNode('door_bed_inside', -3.2, 0, -17);
    this.addNode('bed_center', -6.0, 0, -17);
    this.addNode('bed_wardrobe', -8.0, 0, -15);

    this.connect('hall_north', 'door_bed_outside');
    this.connect('door_bed_outside', 'door_bed_inside');
    this.connect('door_bed_inside', 'bed_center');
    this.connect('bed_center', 'bed_wardrobe');

    // 3. Security Room
    this.addNode('door_sec_outside', 1.5, 0, -17);
    this.addNode('door_sec_inside', 4.0, 0, -17);
    this.addNode('sec_center', 8.0, 0, -17);

    this.connect('hall_north', 'door_sec_outside');
    this.connect('door_sec_outside', 'door_sec_inside');
    this.connect('door_sec_inside', 'sec_center');

    // 4. Storage Room
    this.addNode('door_store_outside', -1.5, 0, -8);
    this.addNode('door_store_inside', -4.5, 0, -8);
    this.addNode('store_center', -8.0, 0, -8);
    this.addNode('store_locker', -11.0, 0, -11);

    this.connect('hall_mid_north', 'door_store_outside');
    this.connect('door_store_outside', 'door_store_inside');
    this.connect('door_store_inside', 'store_center');
    this.connect('store_center', 'store_locker');

    // 5. Owner's Office
    this.addNode('door_off_outside', 1.5, 0, -8);
    this.addNode('door_off_inside', 4.5, 0, -8);
    this.addNode('office_center', 8.0, 0, -8);

    this.connect('hall_mid_north', 'door_off_outside');
    this.connect('door_off_outside', 'door_off_inside');
    this.connect('door_off_inside', 'office_center');

    // 6. Kitchen
    this.addNode('door_kitch_outside', -1.5, 0, 9);
    this.addNode('door_kitch_inside', -4.5, 0, 9);
    this.addNode('kitch_prep', -8.0, 0, 9);
    this.addNode('kitch_oven', -12.0, 0, 9);

    this.connect('hall_mid_south', 'door_kitch_outside');
    this.connect('door_kitch_outside', 'door_kitch_inside');
    this.connect('door_kitch_inside', 'kitch_prep');
    this.connect('kitch_prep', 'kitch_oven');

    // 7. Dining Room
    this.addNode('door_din_outside', 1.5, 0, 9);
    this.addNode('door_din_inside', 4.5, 0, 9);
    this.addNode('din_center', 10.0, 0, 11);
    this.addNode('din_north_tables', 10.0, 0, 7);
    this.addNode('din_south_tables', 10.0, 0, 15);
    this.addNode('din_wardrobe', 16.0, 0, 17);

    this.connect('hall_mid_south', 'door_din_outside');
    this.connect('door_din_outside', 'door_din_inside');
    this.connect('door_din_inside', 'din_center');
    this.connect('din_center', 'din_north_tables');
    this.connect('din_center', 'din_south_tables');
    this.connect('din_south_tables', 'din_wardrobe');
  }

  getNearestNode(pos) {
    let nearest = null;
    let minDist = Infinity;
    for (const id in this.nodes) {
      const node = this.nodes[id];
      const dist = pos.distanceTo(node.position);
      if (dist < minDist) {
        minDist = dist;
        nearest = node;
      }
    }
    return nearest;
  }

  // A* / Dijkstra pathfinder between two positions
  findPath(startPos, targetPos) {
    const startNode = this.getNearestNode(startPos);
    const targetNode = this.getNearestNode(targetPos);

    if (!startNode || !targetNode) return [targetPos];
    if (startNode.id === targetNode.id) return [targetPos];

    // Priority queue & cost tracking
    const frontier = [{ node: startNode, cost: 0, priority: 0 }];
    const cameFrom = {};
    const costSoFar = {};

    cameFrom[startNode.id] = null;
    costSoFar[startNode.id] = 0;

    while (frontier.length > 0) {
      frontier.sort((a, b) => a.priority - b.priority);
      const current = frontier.shift().node;

      if (current.id === targetNode.id) {
        break;
      }

      for (const neighborId of current.neighbors) {
        const neighbor = this.nodes[neighborId];
        if (!neighbor) continue;

        const newCost = costSoFar[current.id] + current.position.distanceTo(neighbor.position);
        if (costSoFar[neighborId] === undefined || newCost < costSoFar[neighborId]) {
          costSoFar[neighborId] = newCost;
          const priority = newCost + neighbor.position.distanceTo(targetNode.position);
          frontier.push({ node: neighbor, cost: newCost, priority });
          cameFrom[neighborId] = current;
        }
      }
    }

    // Reconstruct path
    const path = [];
    let curr = targetNode;
    while (curr) {
      path.unshift(curr.position.clone());
      curr = cameFrom[curr.id];
    }

    path.push(targetPos.clone());
    return path;
  }
}

