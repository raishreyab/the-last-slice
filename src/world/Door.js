import * as THREE from 'three';
import { ProceduralTextures } from './ProceduralTextures.js';

export class Door {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.id = options.id || 'door_' + Math.random().toString(36).substr(2, 6);
    this.name = options.name || 'Wooden Door';
    this.position = options.position || new THREE.Vector3(0, 0, 0);
    this.rotationY = options.rotationY || 0;
    this.width = options.width || 1.3;
    this.height = options.height || 2.4;
    this.depth = 0.1;

    this.isOpen = false;
    this.isLocked = !!options.isLocked;
    this.requiredKeyId = options.requiredKeyId || null;
    this.lockedMessage = options.lockedMessage || 'Locked. Requires a key.';

    this.currentAngle = 0;
    this.targetAngle = 0;
    this.maxOpenAngle = options.swingDir ? -Math.PI / 2 : Math.PI / 2;

    this.doorMesh = null;
    this.pivot = null;
    this.collider = null;

    this.build();
  }

  build() {
    this.pivot = new THREE.Group();
    this.pivot.position.copy(this.position);
    this.pivot.rotation.y = this.rotationY;

    // Door Slab Geometry & Material (Dark worn wood with rusty handle)
    const slabGeo = new THREE.BoxGeometry(this.width, this.height, this.depth);
    // Shift geometry so pivot is along the left hinge
    slabGeo.translate(this.width / 2, this.height / 2, 0);

    const woodTex = ProceduralTextures.createWoodFloorTexture();
    const slabMat = new THREE.MeshStandardMaterial({
      map: woodTex,
      roughness: 0.85,
      metalness: 0.15,
      color: 0x3b2a20
    });

    this.doorMesh = new THREE.Mesh(slabGeo, slabMat);
    this.doorMesh.castShadow = true;
    this.doorMesh.receiveShadow = true;

    // Door Handle / Knob
    const handleGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.16, 8);
    const metalMat = new THREE.MeshStandardMaterial({
      map: ProceduralTextures.createRustyMetalTexture(),
      roughness: 0.4,
      metalness: 0.8
    });
    const handle = new THREE.Mesh(handleGeo, metalMat);
    handle.rotation.z = Math.PI / 2;
    handle.position.set(this.width - 0.15, this.height * 0.45, 0.07);
    this.doorMesh.add(handle);

    // Interactive metadata for raycasting
    this.doorMesh.userData.interactiveData = {
      type: 'door',
      instance: this,
      getPrompt: () => {
        if (this.isLocked) {
          return `[E] Locked (${this.name})`;
        }
        return this.isOpen ? `[E] Close ${this.name}` : `[E] Open ${this.name}`;
      }
    };

    this.pivot.add(this.doorMesh);
    this.scene.add(this.pivot);

    // Bounding Box Collider for player & monster
    this.collider = {
      id: this.id,
      enabled: !this.isOpen,
      mesh: this.doorMesh,
      isInteractable: true,
      box: new THREE.Box3()
    };
    this.updateColliderBox();
  }

  updateColliderBox() {
    if (!this.isOpen) {
      // Calculate world AABB when closed
      this.doorMesh.updateMatrixWorld(true);
      this.collider.box.setFromObject(this.doorMesh);
      // Expand slightly to prevent clipping
      this.collider.box.expandByScalar(0.08);
      this.collider.enabled = true;
    } else {
      this.collider.enabled = false;
    }
  }

  interact(inventory = null, soundDetector = null, soundEngine = null) {
    if (this.isLocked) {
      if (inventory && this.requiredKeyId && inventory.hasItem(this.requiredKeyId)) {
        this.unlock(inventory, soundEngine);
        return { success: true, message: `Unlocked ${this.name} using ${inventory.getItemName(this.requiredKeyId)}!` };
      } else {
        if (soundEngine) soundEngine.playLockedRattle();
        return { success: false, message: this.lockedMessage };
      }
    }

    this.toggle(soundDetector, soundEngine);
    return { success: true, message: this.isOpen ? `Opened ${this.name}` : `Closed ${this.name}` };
  }

  unlock(inventory, soundEngine = null) {
    this.isLocked = false;
    if (soundEngine) soundEngine.playLockClick();
    this.toggle();
  }

  toggle(soundDetector = null, soundEngine = null) {
    this.isOpen = !this.isOpen;
    this.targetAngle = this.isOpen ? this.maxOpenAngle : 0;
    this.collider.enabled = !this.isOpen;

    // Door creak sound & noise generation (noise: 30)
    if (soundEngine) {
      soundEngine.playDoorCreak();
    }
    if (soundDetector) {
      soundDetector.emitSound(this.pivot.position, 30, 'rusty_door');
    }
  }

  update(delta) {
    if (Math.abs(this.currentAngle - this.targetAngle) > 0.005) {
      this.currentAngle = THREE.MathUtils.lerp(this.currentAngle, this.targetAngle, delta * 6.0);
      this.doorMesh.rotation.y = this.currentAngle;
      this.updateColliderBox();
    }
  }
}

