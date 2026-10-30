import * as THREE from 'three';
import { ProceduralTextures } from './ProceduralTextures.js';
import { Door } from './Door.js';
import { HidingSpot } from './HidingSpot.js';

export class WorldBuilder {
  constructor(scene, engine) {
    this.scene = scene;
    this.engine = engine;

    this.colliders = [];
    this.doors = [];
    this.hidingSpots = [];
    this.interactiveItems = [];
    this.ghostRunes = []; // Visible only during Ghost Vision
    this.pumpkinFragments = [];

    // Common materials
    this.woodFloorMat = new THREE.MeshStandardMaterial({
      map: ProceduralTextures.createWoodFloorTexture(),
      roughness: 0.85
    });

    this.checkerTileMat = new THREE.MeshStandardMaterial({
      map: ProceduralTextures.createCheckerTileTexture(),
      roughness: 0.65
    });

    this.kitchenWallMat = new THREE.MeshStandardMaterial({
      map: ProceduralTextures.createWallpaperTexture('kitchen'),
      roughness: 0.7
    });

    this.diningWallMat = new THREE.MeshStandardMaterial({
      map: ProceduralTextures.createWallpaperTexture('dining'),
      roughness: 0.9
    });

    this.hallwayWallMat = new THREE.MeshStandardMaterial({
      map: ProceduralTextures.createWallpaperTexture('hallway'),
      roughness: 0.85
    });

    this.ceilingMat = new THREE.MeshStandardMaterial({
      color: 0x110d14,
      roughness: 0.95
    });

    this.metalMat = new THREE.MeshStandardMaterial({
      map: ProceduralTextures.createRustyMetalTexture(),
      roughness: 0.45,
      metalness: 0.8
    });
  }

  buildAll() {
    this.buildFloorsAndCeilings();
    this.buildWalls();
    this.buildDoors();
    this.buildHidingSpots();
    this.buildFurnitureAndProps();
    this.buildLighting();
    this.buildGhostRunes();
  }

  // Helper to create a solid wall with collision box
  addWall(x, z, width, depth, height = 3.2, material = null, y = 1.6) {
    const mat = material || this.hallwayWallMat;
    const geo = new THREE.BoxGeometry(width, height, depth);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = !this.engine.isMobile;
    mesh.receiveShadow = true;
    this.scene.add(mesh);

    // Collision Box
    const colBox = new THREE.Box3().setFromObject(mesh);
    this.colliders.push({
      id: `wall_${x}_${z}`,
      mesh: mesh,
      isInteractable: false,
      box: colBox
    });
    return mesh;
  }

  buildFloorsAndCeilings() {
    // 1. Central Hallway & Junctions Floor
    const hallFloorGeo = new THREE.PlaneGeometry(8, 36);
    const hallFloor = new THREE.Mesh(hallFloorGeo, this.checkerTileMat);
    hallFloor.rotation.x = -Math.PI / 2;
    hallFloor.position.set(0, 0, -2);
    hallFloor.receiveShadow = true;
    this.scene.add(hallFloor);

    // Hallway Junction Horizontal
    const juncFloorGeo = new THREE.PlaneGeometry(36, 8);
    const juncFloor = new THREE.Mesh(juncFloorGeo, this.checkerTileMat);
    juncFloor.rotation.x = -Math.PI / 2;
    juncFloor.position.set(0, 0, -1);
    juncFloor.receiveShadow = true;
    this.scene.add(juncFloor);

    // 2. Bedroom Floor (Wood)
    const bedFloorGeo = new THREE.PlaneGeometry(8, 8);
    const bedFloor = new THREE.Mesh(bedFloorGeo, this.woodFloorMat);
    bedFloor.rotation.x = -Math.PI / 2;
    bedFloor.position.set(-6, 0, -17);
    this.scene.add(bedFloor);

    // 3. Security Room Floor (Tiles)
    const secFloorGeo = new THREE.PlaneGeometry(10, 8);
    const secFloor = new THREE.Mesh(secFloorGeo, this.checkerTileMat);
    secFloor.rotation.x = -Math.PI / 2;
    secFloor.position.set(8, 0, -17);
    this.scene.add(secFloor);

    // 4. Storage Room Floor (Concrete/Metal)
    const storeFloorGeo = new THREE.PlaneGeometry(10, 10);
    const storeFloor = new THREE.Mesh(storeFloorGeo, this.metalMat);
    storeFloor.rotation.x = -Math.PI / 2;
    storeFloor.position.set(-8, 0, -8);
    this.scene.add(storeFloor);

    // 5. Owner's Office Floor (Polished Wood)
    const offFloorGeo = new THREE.PlaneGeometry(10, 10);
    const offFloor = new THREE.Mesh(offFloorGeo, this.woodFloorMat);
    offFloor.rotation.x = -Math.PI / 2;
    offFloor.position.set(8, 0, -8);
    this.scene.add(offFloor);

    // 6. Kitchen Floor (Industrial Grime Tiles)
    const kitchFloorGeo = new THREE.PlaneGeometry(12, 12);
    const kitchFloor = new THREE.Mesh(kitchFloorGeo, this.checkerTileMat);
    kitchFloor.rotation.x = -Math.PI / 2;
    kitchFloor.position.set(-9, 0, 9);
    this.scene.add(kitchFloor);

    // 7. Dining Room Floor (Checkered Pizzeria Tiles)
    const dinFloorGeo = new THREE.PlaneGeometry(16, 16);
    const dinFloor = new THREE.Mesh(dinFloorGeo, this.checkerTileMat);
    dinFloor.rotation.x = -Math.PI / 2;
    dinFloor.position.set(10, 0, 11);
    this.scene.add(dinFloor);

    // 8. Main Exit Foyer Floor
    const exitFloorGeo = new THREE.PlaneGeometry(8, 8);
    const exitFloor = new THREE.Mesh(exitFloorGeo, this.checkerTileMat);
    exitFloor.rotation.x = -Math.PI / 2;
    exitFloor.position.set(0, 0, 16);
    this.scene.add(exitFloor);

    // 9. Basement Ritual Chamber Floor (Dark Stone)
    const baseFloorGeo = new THREE.PlaneGeometry(18, 16);
    const baseFloor = new THREE.Mesh(baseFloorGeo, this.metalMat);
    baseFloor.rotation.x = -Math.PI / 2;
    baseFloor.position.set(0, -3.5, -28);
    this.scene.add(baseFloor);

    // Overall Ceiling
    const ceilGeo = new THREE.PlaneGeometry(44, 46);
    const ceiling = new THREE.Mesh(ceilGeo, this.ceilingMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(0, 3.2, 0);
    this.scene.add(ceiling);
  }

  buildWalls() {
    const H = 3.2;

    // --- 1. BEDROOM (Spawn Location: -6, 0, -17) ---
    // Outer walls:
    this.addWall(-6, -21, 8.4, 0.4, H, this.diningWallMat); // North
    this.addWall(-10.2, -17, 0.4, 8.4, H, this.diningWallMat); // West
    this.addWall(-6, -12.8, 8.4, 0.4, H, this.diningWallMat); // South
    // East wall with Bedroom Doorway to Hallway at (-2.0, 0, -17)
    this.addWall(-2.0, -19.5, 0.4, 3.0, H, this.diningWallMat);
    this.addWall(-2.0, -14.5, 0.4, 3.0, H, this.diningWallMat);
    this.addWall(-2.0, -17.0, 0.4, 2.0, 0.8, this.diningWallMat, 2.8); // Lintel over door

    // --- 2. SECURITY ROOM (8, 0, -17) ---
    this.addWall(8, -21, 10.4, 0.4, H, this.kitchenWallMat); // North
    this.addWall(13.2, -17, 0.4, 8.4, H, this.kitchenWallMat); // East
    this.addWall(8, -12.8, 10.4, 0.4, H, this.kitchenWallMat); // South
    // West wall with Doorway to Hallway at (2.8, 0, -17)
    this.addWall(2.8, -19.5, 0.4, 3.0, H, this.kitchenWallMat);
    this.addWall(2.8, -14.5, 0.4, 3.0, H, this.kitchenWallMat);
    this.addWall(2.8, -17.0, 0.4, 2.0, 0.8, this.kitchenWallMat, 2.8);

    // --- 3. STORAGE ROOM (-8, 0, -8) ---
    this.addWall(-13.2, -8, 0.4, 10.4, H, this.metalMat); // West
    this.addWall(-8, -3.2, 10.4, 0.4, H, this.metalMat); // South
    // East wall with doorway at (-2.8, 0, -8)
    this.addWall(-2.8, -10.5, 0.4, 4.0, H, this.metalMat);
    this.addWall(-2.8, -5.5, 0.4, 4.0, H, this.metalMat);
    this.addWall(-2.8, -8.0, 0.4, 2.0, 0.8, this.metalMat, 2.8);

    // --- 4. OWNER'S OFFICE (8, 0, -8) ---
    this.addWall(13.2, -8, 0.4, 10.4, H, this.woodFloorMat); // East
    this.addWall(8, -3.2, 10.4, 0.4, H, this.woodFloorMat); // South
    // West wall with doorway at (2.8, 0, -8)
    this.addWall(2.8, -10.5, 0.4, 4.0, H, this.woodFloorMat);
    this.addWall(2.8, -5.5, 0.4, 4.0, H, this.woodFloorMat);
    this.addWall(2.8, -8.0, 0.4, 2.0, 0.8, this.woodFloorMat, 2.8);

    // --- 5. KITCHEN (-9, 0, 9) ---
    this.addWall(-9, 3.2, 12.4, 0.4, H, this.kitchenWallMat); // North
    this.addWall(-15.2, 9, 0.4, 12.4, H, this.kitchenWallMat); // West
    this.addWall(-9, 15.2, 12.4, 0.4, H, this.kitchenWallMat); // South
    // East wall with doorway to Hallway at (-2.8, 0, 9)
    this.addWall(-2.8, 6.0, 0.4, 5.0, H, this.kitchenWallMat);
    this.addWall(-2.8, 12.0, 0.4, 5.0, H, this.kitchenWallMat);
    this.addWall(-2.8, 9.0, 0.4, 2.0, 0.8, this.kitchenWallMat, 2.8);

    // --- 6. DINING ROOM (10, 0, 11) ---
    this.addWall(10, 3.2, 14.4, 0.4, H, this.diningWallMat); // North
    this.addWall(18.2, 11, 0.4, 16.4, H, this.diningWallMat); // East
    this.addWall(10, 19.2, 14.4, 0.4, H, this.diningWallMat); // South
    // West wall with double archway to Hallway at (2.8, 0, 11)
    this.addWall(2.8, 6.5, 0.4, 6.0, H, this.diningWallMat);
    this.addWall(2.8, 15.5, 0.4, 6.0, H, this.diningWallMat);
    this.addWall(2.8, 11.0, 0.4, 3.0, 0.8, this.diningWallMat, 2.8);

    // --- 7. MAIN HALLWAY & EXIT FOYER (0, 0, 16) ---
    this.addWall(-3.2, 17, 0.4, 6.0, H, this.hallwayWallMat); // West exit corridor
    this.addWall(3.2, 17, 0.4, 6.0, H, this.hallwayWallMat); // East exit corridor
    // North hallway boundary
    this.addWall(0, -21.2, 6.0, 0.4, H, this.hallwayWallMat);

    // Main Exit Gate Wall at z: 20.0
    this.addWall(-2.2, 20.0, 2.2, 0.6, H, this.metalMat);
    this.addWall(2.2, 20.0, 2.2, 0.6, H, this.metalMat);
    this.addWall(0, 20.0, 2.2, 0.6, 0.8, this.metalMat, 2.8);

    // --- 8. BASEMENT RITUAL CHAMBER (-3.5m lower) ---
    // Stairs opening at (0, 0, -2) descending south to z: -20
    const bH = 3.6;
    const bY = -1.75;
    this.addWall(-9.2, -28, 0.4, 16.4, bH, this.metalMat, bY); // West
    this.addWall(9.2, -28, 0.4, 16.4, bH, this.metalMat, bY); // East
    this.addWall(0, -36.2, 18.4, 0.4, bH, this.metalMat, bY); // North
    this.addWall(0, -20.2, 18.4, 0.4, bH, this.metalMat, bY); // South
  }

  buildDoors() {
    // 1. Bedroom Door (Starts Locked! Key is inside bedroom on nightstand/drawer)
    const bedDoor = new Door(this.scene, {
      id: 'door_bedroom',
      name: 'Bedroom Door',
      position: new THREE.Vector3(-2.0, 0, -17.6),
      rotationY: 0,
      width: 1.2,
      isLocked: true,
      requiredKeyId: 'key_bedroom',
      lockedMessage: 'Locked from outside. Find the Bedroom Key!'
    });
    this.doors.push(bedDoor);
    this.colliders.push(bedDoor.collider);

    // 2. Kitchen Door (Locked - requires Kitchen Key found in Storage Room)
    const kitchDoor = new Door(this.scene, {
      id: 'door_kitchen',
      name: 'Kitchen Swinging Door',
      position: new THREE.Vector3(-2.8, 0, 8.4),
      rotationY: 0,
      width: 1.2,
      isLocked: true,
      requiredKeyId: 'key_kitchen',
      lockedMessage: 'The kitchen is padlocked. Needs Kitchen Key.'
    });
    this.doors.push(kitchDoor);
    this.colliders.push(kitchDoor.collider);

    // 3. Storage Room Door (Unlocked)
    const storeDoor = new Door(this.scene, {
      id: 'door_storage',
      name: 'Storage Room Door',
      position: new THREE.Vector3(-2.8, 0, -8.6),
      rotationY: 0,
      width: 1.2,
      isLocked: false
    });
    this.doors.push(storeDoor);
    this.colliders.push(storeDoor.collider);

    // 4. Security Room Door (Locked - requires Security Keycard)
    const secDoor = new Door(this.scene, {
      id: 'door_security',
      name: 'Security Door',
      position: new THREE.Vector3(2.8, 0, -17.6),
      rotationY: 0,
      width: 1.2,
      isLocked: true,
      requiredKeyId: 'key_security',
      lockedMessage: 'Electronic security lock. Requires Security Key.'
    });
    this.doors.push(secDoor);
    this.colliders.push(secDoor.collider);

    // 5. Owner's Office Door (Unlocked)
    const offDoor = new Door(this.scene, {
      id: 'door_office',
      name: 'Office Door',
      position: new THREE.Vector3(2.8, 0, -8.6),
      rotationY: 0,
      width: 1.2,
      isLocked: false
    });
    this.doors.push(offDoor);
    this.colliders.push(offDoor.collider);

    // 6. Main Exit Double Door (Final Chapter Exit - Locked by ancient pumpkin spell)
    const exitDoor = new Door(this.scene, {
      id: 'door_main_exit',
      name: 'Pizzeria Main Exit',
      position: new THREE.Vector3(-0.9, 0, 20.0),
      rotationY: 0,
      width: 1.8,
      isLocked: true,
      requiredKeyId: 'pumpkin_full',
      lockedMessage: 'Sealed by ancient curse! Assemble all 5 Pumpkin Fragments to break the seal.'
    });
    this.doors.push(exitDoor);
    this.colliders.push(exitDoor.collider);
  }

  buildHidingSpots() {
    // 1. Bedroom Wardrobe
    const bedWardrobe = new HidingSpot(this.scene, {
      id: 'wardrobe_bedroom',
      name: 'Bedroom Wardrobe',
      type: 'wardrobe',
      position: new THREE.Vector3(-9.2, 0, -14.2),
      rotationY: 0
    });
    this.hidingSpots.push(bedWardrobe);
    this.colliders.push(bedWardrobe.collider);

    // 2. Storage Room Metal Locker
    const storeLocker = new HidingSpot(this.scene, {
      id: 'locker_storage',
      name: 'Storage Locker',
      type: 'wardrobe',
      position: new THREE.Vector3(-12.0, 0, -11.5),
      rotationY: Math.PI / 2
    });
    this.hidingSpots.push(storeLocker);
    this.colliders.push(storeLocker.collider);

    // 3. Dining Room Back Wardrobe
    const dinWardrobe = new HidingSpot(this.scene, {
      id: 'wardrobe_dining',
      name: 'Dining Coat Closet',
      type: 'wardrobe',
      position: new THREE.Vector3(17.0, 0, 17.5),
      rotationY: Math.PI
    });
    this.hidingSpots.push(dinWardrobe);
    this.colliders.push(dinWardrobe.collider);
  }

  buildFurnitureAndProps() {
    // --- 1. BEDROOM PROPS ---
    // Bed
    const bedGeo = new THREE.BoxGeometry(2.0, 0.6, 2.4);
    const bedMat = new THREE.MeshStandardMaterial({ color: 0x471d18, roughness: 0.8 });
    const bedMesh = new THREE.Mesh(bedGeo, bedMat);
    bedMesh.position.set(-8.0, 0.3, -19.5);
    this.scene.add(bedMesh);
    this.colliders.push({ id: 'bed', mesh: bedMesh, box: new THREE.Box3().setFromObject(bedMesh) });

    // Pillow
    const pillowGeo = new THREE.BoxGeometry(0.8, 0.2, 0.5);
    const pillowMat = new THREE.MeshStandardMaterial({ color: 0x8a7f72, roughness: 0.9 });
    const pillow = new THREE.Mesh(pillowGeo, pillowMat);
    pillow.position.set(-8.0, 0.65, -20.2);
    this.scene.add(pillow);

    // Nightstand
    const standGeo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    const standMat = new THREE.MeshStandardMaterial({ map: ProceduralTextures.createWoodFloorTexture() });
    const stand = new THREE.Mesh(standGeo, standMat);
    stand.position.set(-6.2, 0.4, -20.4);
    this.scene.add(stand);
    this.colliders.push({ id: 'nightstand', mesh: stand, box: new THREE.Box3().setFromObject(stand) });

    // --- 2. KITCHEN PROPS ---
    // Pizza Oven
    const ovenGeo = new THREE.BoxGeometry(3.6, 2.2, 1.4);
    const ovenMat = new THREE.MeshStandardMaterial({ map: ProceduralTextures.createRustyMetalTexture(), roughness: 0.5 });
    const ovenMesh = new THREE.Mesh(ovenGeo, ovenMat);
    ovenMesh.position.set(-13.0, 1.1, 9.0);
    this.scene.add(ovenMesh);
    this.colliders.push({ id: 'pizza_oven', mesh: ovenMesh, box: new THREE.Box3().setFromObject(ovenMesh) });

    // Glowing Oven Interior Light
    const ovenLight = new THREE.PointLight(0xff4400, 2.5, 4);
    ovenLight.position.set(-13.0, 1.0, 8.2);
    this.scene.add(ovenLight);

    // Kitchen Prep Counter / Table
    const counterGeo = new THREE.BoxGeometry(4.0, 1.0, 1.2);
    const counterMat = new THREE.MeshStandardMaterial({ color: 0x666970, metalness: 0.7, roughness: 0.3 });
    const counter = new THREE.Mesh(counterGeo, counterMat);
    counter.position.set(-8.5, 0.5, 9.0);
    counter.userData.interactiveData = {
      type: 'pizza_prep_table',
      getPrompt: () => '[E] Examine Pizza Prep Station'
    };
    this.scene.add(counter);
    this.colliders.push({ id: 'kitchen_prep', mesh: counter, isInteractable: true, box: new THREE.Box3().setFromObject(counter) });

    // --- 3. DINING ROOM PROPS ---
    // 4 Distinct Dining Tables for Puzzle 3 (arranged across the room)
    const tablePositions = [
      { id: 'table_1', x: 7.0, z: 8.0, rune: 'Ψ', chairCount: 3 },
      { id: 'table_2', x: 13.5, z: 8.0, rune: 'Ω', chairCount: 4 },
      { id: 'table_3', x: 7.0, z: 14.5, rune: '★', chairCount: 2 },
      { id: 'table_4', x: 13.5, z: 14.5, rune: '▲', chairCount: 5 }
    ];

    this.puzzleTables = [];
    tablePositions.forEach((tp) => {
      // Table top & leg
      const tableGroup = new THREE.Group();
      tableGroup.position.set(tp.x, 0, tp.z);

      const topGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.08, 16);
      const topMat = new THREE.MeshStandardMaterial({
        color: 0x5a1811,
        roughness: 0.6
      });
      const top = new THREE.Mesh(topGeo, topMat);
      top.position.y = 0.85;
      tableGroup.add(top);

      const legGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.85, 8);
      const legMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8 });
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.y = 0.425;
      tableGroup.add(leg);

      tableGroup.userData.interactiveData = {
        type: 'dining_table',
        tableId: tp.id,
        rune: tp.rune,
        chairs: tp.chairCount,
        getPrompt: () => `[E] Inspect Table (${tp.chairCount} chairs)`
      };

      this.scene.add(tableGroup);
      this.colliders.push({
        id: tp.id,
        mesh: tableGroup,
        isInteractable: true,
        box: new THREE.Box3().setFromObject(tableGroup)
      });
      this.puzzleTables.push(tableGroup);
    });

    // --- 4. OWNER'S OFFICE PROPS ---
    // Desk
    const deskGeo = new THREE.BoxGeometry(2.4, 0.9, 1.3);
    const deskMat = new THREE.MeshStandardMaterial({ map: ProceduralTextures.createWoodFloorTexture(), color: 0x3d2215 });
    const desk = new THREE.Mesh(deskGeo, deskMat);
    desk.position.set(8.0, 0.45, -9.0);
    this.scene.add(desk);
    this.colliders.push({ id: 'office_desk', mesh: desk, box: new THREE.Box3().setFromObject(desk) });

    // Safe / Locker Box for Puzzle 1 (Three-digit combination)
    const safeGeo = new THREE.BoxGeometry(0.7, 0.8, 0.7);
    const safeMat = new THREE.MeshStandardMaterial({ map: ProceduralTextures.createRustyMetalTexture(), metalness: 0.9 });
    const safeMesh = new THREE.Mesh(safeGeo, safeMat);
    safeMesh.position.set(11.8, 0.4, -4.0);
    safeMesh.userData.interactiveData = {
      type: 'combination_safe',
      getPrompt: () => '[E] Combination Safe (Locked)'
    };
    this.scene.add(safeMesh);
    this.colliders.push({ id: 'safe', mesh: safeMesh, isInteractable: true, box: new THREE.Box3().setFromObject(safeMesh) });

    // --- 5. SECURITY ROOM CCTV DESK ---
    const cctvDeskGeo = new THREE.BoxGeometry(3.0, 0.9, 1.2);
    const cctvDesk = new THREE.Mesh(cctvDeskGeo, this.metalMat);
    cctvDesk.position.set(8.0, 0.45, -19.5);
    cctvDesk.userData.interactiveData = {
      type: 'cctv_console',
      getPrompt: () => '[E] Access Security CCTV Console'
    };
    this.scene.add(cctvDesk);
    this.colliders.push({ id: 'cctv_desk', mesh: cctvDesk, isInteractable: true, box: new THREE.Box3().setFromObject(cctvDesk) });

    // CRT Monitors with eerie flickering glow
    for (let m = -1; m <= 1; m++) {
      const monGeo = new THREE.BoxGeometry(0.7, 0.5, 0.4);
      const monMat = new THREE.MeshStandardMaterial({ color: 0x1a2428, roughness: 0.3 });
      const monitor = new THREE.Mesh(monGeo, monMat);
      monitor.position.set(8.0 + m * 0.9, 1.2, -19.5);

      const screenGeo = new THREE.PlaneGeometry(0.55, 0.38);
      const screenMat = new THREE.MeshBasicMaterial({ color: 0x184232 });
      const screen = new THREE.Mesh(screenGeo, screenMat);
      screen.position.set(0, 0, 0.21);
      monitor.add(screen);

      this.scene.add(monitor);
    }

    // --- 6. BASEMENT RITUAL ALTAR ---
    const altarGeo = new THREE.CylinderGeometry(1.6, 2.0, 0.9, 8);
    const altarMat = new THREE.MeshStandardMaterial({ map: ProceduralTextures.createRustyMetalTexture(), color: 0x1c1218 });
    const altar = new THREE.Mesh(altarGeo, altarMat);
    altar.position.set(0, -3.05, -28.0);
    altar.userData.interactiveData = {
      type: 'ritual_altar',
      getPrompt: () => '[E] Examine Ancient Ritual Altar'
    };
    this.scene.add(altar);
    this.colliders.push({ id: 'altar', mesh: altar, isInteractable: true, box: new THREE.Box3().setFromObject(altar) });

    // Blood-red / Soul-purple Ritual Pentagram Circle
    const circleGeo = new THREE.RingGeometry(2.2, 2.6, 32);
    const circleMat = new THREE.MeshBasicMaterial({ color: 0xff4400, side: THREE.DoubleSide });
    const circle = new THREE.Mesh(circleGeo, circleMat);
    circle.rotation.x = -Math.PI / 2;
    circle.position.set(0, -3.48, -28.0);
    this.scene.add(circle);
  }

  buildLighting() {
    // Atmospheric Flickering Burnt Orange & Dark Purple Horror Lights
    const lightConfigs = [
      { pos: new THREE.Vector3(-6, 2.6, -17), color: 0xff6600, intensity: 1.8 }, // Bedroom
      { pos: new THREE.Vector3(0, 2.7, -14), color: 0xaa4400, intensity: 1.6 },  // North Hallway
      { pos: new THREE.Vector3(0, 2.7, 0), color: 0x8822bb, intensity: 2.0 },    // Central Hallway Junction
      { pos: new THREE.Vector3(0, 2.7, 12), color: 0xff5500, intensity: 1.8 },   // South Hallway
      { pos: new THREE.Vector3(-8, 2.6, -8), color: 0x775533, intensity: 1.5 },  // Storage
      { pos: new THREE.Vector3(8, 2.6, -8), color: 0xff7722, intensity: 1.8 },   // Office
      { pos: new THREE.Vector3(8, 2.6, -17), color: 0x2299aa, intensity: 1.9 },  // Security (CRT blue-green)
      { pos: new THREE.Vector3(-9, 2.7, 9), color: 0xff4400, intensity: 2.2 },   // Kitchen
      { pos: new THREE.Vector3(10, 2.7, 11), color: 0xff8833, intensity: 2.5 },  // Dining Room
      { pos: new THREE.Vector3(0, -1.0, -28), color: 0xcc2200, intensity: 2.8 }  // Basement Altar
    ];

    for (const cfg of lightConfigs) {
      this.engine.addFlickerLight(cfg.pos, cfg.color, cfg.intensity, 10);
    }
  }

  buildGhostRunes() {
    // Secret markings etched on walls and puzzle tables visible only during Ghost Vision
    const runeConfigs = [
      { text: 'Ψ', pos: new THREE.Vector3(7.0, 0.9, 8.0), rot: new THREE.Euler(-Math.PI/2, 0, 0), scale: 0.6 },
      { text: 'Ω', pos: new THREE.Vector3(13.5, 0.9, 8.0), rot: new THREE.Euler(-Math.PI/2, 0, 0), scale: 0.6 },
      { text: '★', pos: new THREE.Vector3(7.0, 0.9, 14.5), rot: new THREE.Euler(-Math.PI/2, 0, 0), scale: 0.6 },
      { text: '▲', pos: new THREE.Vector3(13.5, 0.9, 14.5), rot: new THREE.Euler(-Math.PI/2, 0, 0), scale: 0.6 },
      // Secret clue etched on Office wall: Combination "4 8 2"
      { text: '4 - 8 - 2', pos: new THREE.Vector3(13.0, 1.8, -9.0), rot: new THREE.Euler(0, -Math.PI/2, 0), scale: 1.0 }
    ];

    for (const rc of runeConfigs) {
      const tex = ProceduralTextures.createGhostRuneTexture(rc.text);
      const mat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        opacity: 0.0, // Invisible until Ghost Vision activated!
        depthWrite: false
      });
      const geo = new THREE.PlaneGeometry(1.0, 1.0);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(rc.pos);
      mesh.rotation.copy(rc.rot);
      mesh.scale.setScalar(rc.scale);
      this.scene.add(mesh);
      this.ghostRunes.push(mat);
    }
  }

  setGhostVisionActive(isActive) {
    const targetOpacity = isActive ? 0.9 : 0.0;
    for (const mat of this.ghostRunes) {
      mat.opacity = targetOpacity;
    }
  }

  update(delta) {
    // Update all doors
    for (const d of this.doors) {
      d.update(delta);
    }
  }
}

