import * as THREE from 'three';
import { ProceduralTextures } from './ProceduralTextures.js';

export class HidingSpot {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.id = options.id || 'hiding_' + Math.random().toString(36).substr(2, 6);
    this.name = options.name || 'Wardrobe';
    this.type = options.type || 'wardrobe'; // 'wardrobe', 'locker', 'bed'
    this.position = options.position || new THREE.Vector3(0, 0, 0);
    this.rotationY = options.rotationY || 0;

    // Inside and exit coordinates
    this.facingYaw = this.rotationY + Math.PI;
    const forwardVec = new THREE.Vector3(Math.sin(this.rotationY), 0, Math.cos(this.rotationY));
    this.insidePosition = this.position.clone().add(new THREE.Vector3(0, 0.1, 0));
    this.exitPosition = this.position.clone().add(forwardVec.clone().multiplyScalar(1.2));

    this.isOccupied = false;
    this.suspicionCount = 0; // The Beast Remembers: increments when used

    this.mesh = null;
    this.collider = null;
    this.build();
  }

  build() {
    const group = new THREE.Group();
    group.position.copy(this.position);
    group.rotation.y = this.rotationY;

    if (this.type === 'wardrobe') {
      // Dark gothic wooden wardrobe
      const woodMat = new THREE.MeshStandardMaterial({
        map: ProceduralTextures.createWoodFloorTexture(),
        roughness: 0.8,
        color: 0x221612
      });

      // Frame: Back, Left, Right, Top
      const backGeo = new THREE.BoxGeometry(1.2, 2.4, 0.08);
      const backMesh = new THREE.Mesh(backGeo, woodMat);
      backMesh.position.set(0, 1.2, -0.4);
      group.add(backMesh);

      const sideGeo = new THREE.BoxGeometry(0.08, 2.4, 0.88);
      const leftSide = new THREE.Mesh(sideGeo, woodMat);
      leftSide.position.set(-0.56, 1.2, 0);
      group.add(leftSide);

      const rightSide = new THREE.Mesh(sideGeo, woodMat);
      rightSide.position.set(0.56, 1.2, 0);
      group.add(rightSide);

      const topGeo = new THREE.BoxGeometry(1.28, 0.08, 0.92);
      const topMesh = new THREE.Mesh(topGeo, woodMat);
      topMesh.position.set(0, 2.4, 0);
      group.add(topMesh);

      // Slatted doors with a vertical slit for peeking
      const doorGeo = new THREE.BoxGeometry(0.54, 2.3, 0.05);
      const leftDoor = new THREE.Mesh(doorGeo, woodMat);
      leftDoor.position.set(-0.29, 1.18, 0.42);
      group.add(leftDoor);

      const rightDoor = new THREE.Mesh(doorGeo, woodMat);
      rightDoor.position.set(0.29, 1.18, 0.42);
      group.add(rightDoor);

    } else if (this.type === 'locker') {
      // Rusty abandoned security locker
      const metalMat = new THREE.MeshStandardMaterial({
        map: ProceduralTextures.createRustyMetalTexture(),
        metalness: 0.85,
        roughness: 0.4
      });
      const lockerGeo = new THREE.BoxGeometry(0.9, 2.2, 0.8);
      const lockerMesh = new THREE.Mesh(lockerGeo, metalMat);
      lockerMesh.position.set(0, 1.1, 0);
      group.add(lockerMesh);
    }

    // Set interactive metadata
    group.userData.interactiveData = {
      type: 'hiding_spot',
      instance: this,
      getPrompt: () => {
        return this.isOccupied ? `[E] Exit ${this.name}` : `[E] Hide inside ${this.name}`;
      }
    };

    this.mesh = group;
    this.scene.add(group);

    // Physical obstacle box
    this.collider = {
      id: this.id,
      mesh: group,
      isInteractable: true,
      box: new THREE.Box3().setFromObject(group)
    };
  }

  interact(player, soundEngine = null) {
    if (this.isOccupied) {
      this.isOccupied = false;
      player.exitHiding();
      if (soundEngine) soundEngine.playDoorCreak();
      return { success: true, message: `Exited ${this.name}` };
    } else {
      this.isOccupied = true;
      this.suspicionCount++; // Elias remembers this spot!
      player.enterHiding(this);
      if (soundEngine) soundEngine.playDoorCreak();
      return { success: true, message: `Hiding inside ${this.name}. Press E to exit.` };
    }
  }
}

