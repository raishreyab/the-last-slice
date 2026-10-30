import * as THREE from 'three';

export class Player {
  constructor(camera, inputManager, soundEngine = null) {
    this.camera = camera;
    this.input = inputManager;
    this.soundEngine = soundEngine;

    // Position and Physical Body (Bounding Capsule / Cylinder)
    this.position = new THREE.Vector3(0, 1.65, 0);
    this.velocity = new THREE.Vector3();
    this.radius = 0.35;
    this.standingHeight = 1.65;
    this.crouchHeight = 0.95;
    this.currentHeight = this.standingHeight;

    // Movement Parameters
    this.walkSpeed = 2.8;
    this.runSpeed = 5.2;
    this.crouchSpeed = 1.4;
    this.acceleration = 25.0;
    this.friction = 10.0;

    // Camera Angles
    this.pitch = 0;
    this.yaw = 0;

    // Head-bobbing
    this.bobTimer = 0;
    this.bobAmount = 0.045;
    this.bobFreq = 10;
    this.footstepTimer = 0;

    // Stamina for running
    this.stamina = 100;
    this.maxStamina = 100;
    this.staminaDrain = 22; // per sec
    this.staminaRegen = 15; // per sec
    this.isExhausted = false;

    // Hiding State
    this.isHiding = false;
    this.currentHidingSpot = null;

    // Noise level emitted this frame (5, 15, 45, etc.)
    this.currentNoise = 0;

    // Interactive targeting
    this.raycaster = new THREE.Raycaster();
    this.raycaster.far = 2.6;
    this.interactTarget = null;

    // Collision colliders (filled by WorldBuilder)
    this.colliders = [];
  }

  setPosition(x, y, z) {
    this.position.set(x, y, z);
    this.camera.position.set(x, y + this.currentHeight, z);
  }

  update(delta, soundDetector = null) {
    if (this.isHiding) {
      this.updateHidingCamera();
      this.currentNoise = 0;
      return;
    }

    // 1. Camera Look (Rotation)
    const look = this.input.consumeLookDelta();
    this.yaw -= look.x;
    this.pitch -= look.y;
    // Clamp pitch between roughly -80 and +80 degrees
    this.pitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, this.pitch));

    // 2. Crouch Height Interpolation
    const targetHeight = this.input.isCrouching ? this.crouchHeight : this.standingHeight;
    this.currentHeight = THREE.MathUtils.lerp(this.currentHeight, targetHeight, delta * 10);

    // 3. Movement Speeds & Stamina
    let targetSpeed = this.walkSpeed;
    let baseNoise = 15; // Walking

    if (this.input.isCrouching) {
      targetSpeed = this.crouchSpeed;
      baseNoise = 5; // Crouching
    } else if (this.input.isRunning && this.stamina > 5 && !this.isExhausted) {
      targetSpeed = this.runSpeed;
      baseNoise = 45; // Running
      this.stamina = Math.max(0, this.stamina - this.staminaDrain * delta);
      if (this.stamina <= 0) this.isExhausted = true;
    } else {
      if (this.stamina < this.maxStamina) {
        this.stamina = Math.min(this.maxStamina, this.stamina + this.staminaRegen * delta);
        if (this.stamina > 25) this.isExhausted = false;
      }
    }

    // 4. Direction Vector from Input
    const move = this.input.getMovementVector();
    const moveLen = Math.sqrt(move.x * move.x + move.z * move.z);

    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));

    const wishDir = new THREE.Vector3()
      .addScaledVector(forward, -move.z)
      .addScaledVector(right, move.x);

    if (moveLen > 0.05) {
      wishDir.normalize();
      // Acceleration towards wish direction
      const currentSpeedInDir = this.velocity.dot(wishDir);
      const addSpeed = targetSpeed - currentSpeedInDir;
      if (addSpeed > 0) {
        const accelSpeed = Math.min(this.acceleration * delta * targetSpeed, addSpeed);
        this.velocity.addScaledVector(wishDir, accelSpeed);
      }
    } else {
      // Friction / deceleration
      const speed = this.velocity.length();
      if (speed > 0) {
        const drop = speed * this.friction * delta;
        const newSpeed = Math.max(0, speed - drop);
        this.velocity.multiplyScalar(newSpeed / speed);
      }
    }

    // 5. Collision Detection & Slide
    this.applyCollision(delta);

    // 6. Head-bobbing & Footstep audio trigger
    const horizontalSpeed = Math.hypot(this.velocity.x, this.velocity.z);
    let bobY = 0;
    let bobX = 0;

    if (horizontalSpeed > 0.25) {
      const freq = (targetSpeed === this.runSpeed) ? this.bobFreq * 1.4 : this.bobFreq;
      this.bobTimer += delta * freq;
      bobY = Math.sin(this.bobTimer) * this.bobAmount * (horizontalSpeed / targetSpeed);
      bobX = Math.cos(this.bobTimer * 0.5) * (this.bobAmount * 0.6) * (horizontalSpeed / targetSpeed);

      // Footstep sound trigger
      this.footstepTimer += delta * (horizontalSpeed / targetSpeed) * 3.2;
      if (this.footstepTimer >= 1.0) {
        this.footstepTimer = 0;
        if (this.soundEngine) {
          this.soundEngine.playFootstep(this.input.isCrouching ? 'soft' : (this.input.isRunning ? 'run' : 'walk'));
        }
      }

      this.currentNoise = baseNoise;
    } else {
      this.bobTimer = 0;
      this.footstepTimer = 0;
      this.currentNoise = 0;
    }

    // Emit sound to SoundDetector (Werewolf hearing)
    if (this.currentNoise > 0 && soundDetector) {
      soundDetector.emitSound(this.position, this.currentNoise, 'player_movement');
    }

    // 7. Update Camera Position and Rotation
    this.camera.position.set(
      this.position.x + bobX,
      this.position.y + this.currentHeight + bobY,
      this.position.z
    );

    const euler = new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ');
    this.camera.quaternion.setFromEuler(euler);

    // 8. Raycast for Interacting
    this.updateRaycast();
  }

  applyCollision(delta) {
    // Attempt movement per axis to allow smooth wall sliding
    const moveX = this.velocity.x * delta;
    const moveZ = this.velocity.z * delta;

    // Test X movement
    this.position.x += moveX;
    if (this.checkCollision()) {
      this.position.x -= moveX;
      this.velocity.x = 0;
    }

    // Test Z movement
    this.position.z += moveZ;
    if (this.checkCollision()) {
      this.position.z -= moveZ;
      this.velocity.z = 0;
    }
  }

  checkCollision() {
    const playerMin = new THREE.Vector3(
      this.position.x - this.radius,
      this.position.y + 0.1,
      this.position.z - this.radius
    );
    const playerMax = new THREE.Vector3(
      this.position.x + this.radius,
      this.position.y + this.currentHeight,
      this.position.z + this.radius
    );
    const playerBox = new THREE.Box3(playerMin, playerMax);

    for (let i = 0; i < this.colliders.length; i++) {
      const col = this.colliders[i];
      if (col.enabled !== false && playerBox.intersectsBox(col.box)) {
        return true;
      }
    }
    return false;
  }

  updateRaycast() {
    this.raycaster.setFromCamera({ x: 0, y: 0 }, this.camera);
    const interactables = [];
    for (const c of this.colliders) {
      if (c.mesh && c.isInteractable) {
        interactables.push(c.mesh);
      }
    }

    const hits = this.raycaster.intersectObjects(interactables, true);
    if (hits.length > 0 && hits[0].distance < 2.5) {
      let target = hits[0].object;
      while (target.parent && !target.userData.interactiveData) {
        target = target.parent;
      }
      this.interactTarget = target.userData.interactiveData || null;
    } else {
      this.interactTarget = null;
    }
  }

  enterHiding(hidingSpot) {
    this.isHiding = true;
    this.currentHidingSpot = hidingSpot;
    this.position.copy(hidingSpot.insidePosition);
    this.camera.position.set(
      hidingSpot.insidePosition.x,
      hidingSpot.insidePosition.y + this.crouchHeight,
      hidingSpot.insidePosition.z
    );
    this.yaw = hidingSpot.facingYaw;
    this.pitch = 0;
    const euler = new THREE.Euler(0, this.yaw, 0, 'YXZ');
    this.camera.quaternion.setFromEuler(euler);
  }

  exitHiding() {
    if (!this.currentHidingSpot) return;
    this.position.copy(this.currentHidingSpot.exitPosition);
    this.isHiding = false;
    this.currentHidingSpot = null;
    this.camera.position.set(this.position.x, this.position.y + this.currentHeight, this.position.z);
  }

  updateHidingCamera() {
    const look = this.input.consumeLookDelta();
    // Constrain peeking angle while hiding inside wardrobe or locker
    const baseYaw = this.currentHidingSpot.facingYaw;
    this.yaw -= look.x;
    this.yaw = Math.max(baseYaw - 0.75, Math.min(baseYaw + 0.75, this.yaw));
    this.pitch = Math.max(-0.4, Math.min(0.4, this.pitch - look.y));

    const euler = new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ');
    this.camera.quaternion.setFromEuler(euler);
  }
}

