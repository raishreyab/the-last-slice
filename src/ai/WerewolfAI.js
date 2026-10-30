import * as THREE from 'three';
import { ProceduralTextures } from '../world/ProceduralTextures.js';

export const AIState = {
  PATROLLING: 'PATROLLING',
  INVESTIGATING: 'INVESTIGATING',
  CHASING: 'CHASING',
  SEARCHING: 'SEARCHING',
  RETURNING: 'RETURNING',
  STUNNED: 'STUNNED'
};

export class WerewolfAI {
  constructor(scene, navGraph, options = {}) {
    this.scene = scene;
    this.navGraph = navGraph;
    this.soundEngine = options.soundEngine || null;

    // Movement Parameters
    this.position = new THREE.Vector3(0, 0, 10);
    this.patrolSpeed = 1.9;
    this.investigateSpeed = 2.6;
    this.chaseSpeed = 5.6;
    this.currentSpeed = this.patrolSpeed;
    this.rotationY = 0;

    // State Machine
    this.state = AIState.PATROLLING;
    this.stateTimer = 0;

    // Patrol Route
    this.patrolRoute = [
      'hall_north',
      'door_bed_outside',
      'hall_mid_north',
      'store_center',
      'hall_center',
      'office_center',
      'hall_mid_south',
      'kitch_prep',
      'hall_mid_south',
      'din_center',
      'din_north_tables',
      'din_center',
      'hall_south_exit'
    ];
    this.patrolIndex = 0;

    // Pathfinding queue
    this.currentPath = [];
    this.pathTarget = null;

    // Line of Sight & Target
    this.targetPos = new THREE.Vector3();
    this.lastKnownPlayerPos = null;
    this.canSeePlayer = false;
    this.sightRange = 16.0;
    this.sightFovCos = Math.cos(THREE.MathUtils.degToRad(65)); // 130 deg cone

    // The Beast Remembers (Memory System)
    this.memory = {
      lastSeenPosition: null,
      noiseHotspots: [],
      hidingSpotSuspicion: {}, // id -> suspicion score
      frequentDoors: {}
    };

    // Stun duration
    this.stunTimer = 0;

    // Raycaster for line-of-sight checks against walls
    this.losRaycaster = new THREE.Raycaster();

    // Procedural 3D Mesh
    this.mesh = null;
    this.leftArm = null;
    this.rightArm = null;
    this.leftLeg = null;
    this.rightLeg = null;
    this.head = null;
    this.eyeLight = null;
    this.jaw = null;

    this.animTime = 0;

    this.build3DModel();
  }

  build3DModel() {
    const group = new THREE.Group();
    group.position.copy(this.position);

    // Dark charcoal fur material with roughness
    const furMat = new THREE.MeshStandardMaterial({
      color: 0x181719,
      roughness: 0.9,
      metalness: 0.1
    });

    const clawMat = new THREE.MeshStandardMaterial({
      color: 0x050406,
      roughness: 0.3,
      metalness: 0.8
    });

    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff5500 });
    const teethMat = new THREE.MeshStandardMaterial({ color: 0xdedcd7, roughness: 0.4 });

    // 1. Muscular Torso & Hunched Spine
    const torsoGeo = new THREE.BoxGeometry(0.85, 1.1, 0.65);
    const torso = new THREE.Mesh(torsoGeo, furMat);
    torso.position.y = 1.35;
    torso.rotation.x = 0.22; // hunched forward beast posture
    torso.castShadow = true;
    group.add(torso);

    // Broad Shoulders
    const shoulderGeo = new THREE.BoxGeometry(1.25, 0.4, 0.6);
    const shoulders = new THREE.Mesh(shoulderGeo, furMat);
    shoulders.position.set(0, 1.8, 0.1);
    group.add(shoulders);

    // 2. Terrifying Werewolf Head
    this.head = new THREE.Group();
    this.head.position.set(0, 2.05, 0.25);

    const skullGeo = new THREE.BoxGeometry(0.48, 0.45, 0.5);
    const skull = new THREE.Mesh(skullGeo, furMat);
    this.head.add(skull);

    // Wolf Snout & Muzzle
    const snoutGeo = new THREE.BoxGeometry(0.32, 0.24, 0.45);
    const snout = new THREE.Mesh(snoutGeo, furMat);
    snout.position.set(0, -0.05, 0.4);
    this.head.add(snout);

    // Hinged Lower Jaw with Sharp Teeth
    this.jaw = new THREE.Group();
    this.jaw.position.set(0, -0.16, 0.2);
    const jawGeo = new THREE.BoxGeometry(0.3, 0.12, 0.42);
    const jawMesh = new THREE.Mesh(jawGeo, furMat);
    jawMesh.position.z = 0.2;
    this.jaw.add(jawMesh);

    // Teeth Fangs
    for (let f = -1; f <= 1; f += 2) {
      const fangGeo = new THREE.ConeGeometry(0.04, 0.12, 4);
      const fang = new THREE.Mesh(fangGeo, teethMat);
      fang.position.set(f * 0.1, 0.08, 0.35);
      fang.rotation.x = Math.PI;
      this.jaw.add(fang);
    }
    this.head.add(this.jaw);

    // Glowing Eerie Orange Eyes
    for (let e = -1; e <= 1; e += 2) {
      const eyeGeo = new THREE.SphereGeometry(0.065, 8, 8);
      const eye = new THREE.Mesh(eyeGeo, eyeMat);
      eye.position.set(e * 0.14, 0.08, 0.26);
      this.head.add(eye);
    }

    // Glowing Orange Eye Point Light (casts scary shadows when approaching)
    this.eyeLight = new THREE.PointLight(0xff4400, 2.0, 7);
    this.eyeLight.position.set(0, 0.1, 0.4);
    this.head.add(this.eyeLight);

    // Pointy Wolf Ears
    for (let side = -1; side <= 1; side += 2) {
      const earGeo = new THREE.ConeGeometry(0.09, 0.3, 4);
      const ear = new THREE.Mesh(earGeo, furMat);
      ear.position.set(side * 0.22, 0.32, -0.08);
      ear.rotation.z = -side * 0.25;
      ear.rotation.x = -0.2;
      this.head.add(ear);
    }
    group.add(this.head);

    // 3. Arms with Deadly Long Claws
    // Left Arm Pivot
    this.leftArm = new THREE.Group();
    this.leftArm.position.set(-0.65, 1.85, 0.1);
    const armGeo = new THREE.BoxGeometry(0.24, 0.85, 0.24);
    const leftArmMesh = new THREE.Mesh(armGeo, furMat);
    leftArmMesh.position.y = -0.42;
    this.leftArm.add(leftArmMesh);

    // Left Claws
    for (let c = -1; c <= 1; c++) {
      const clawGeo = new THREE.ConeGeometry(0.03, 0.22, 4);
      const claw = new THREE.Mesh(clawGeo, clawMat);
      claw.position.set(c * 0.07, -0.92, 0.05);
      claw.rotation.x = Math.PI / 3;
      this.leftArm.add(claw);
    }
    group.add(this.leftArm);

    // Right Arm Pivot
    this.rightArm = new THREE.Group();
    this.rightArm.position.set(0.65, 1.85, 0.1);
    const rightArmMesh = new THREE.Mesh(armGeo, furMat);
    rightArmMesh.position.y = -0.42;
    this.rightArm.add(rightArmMesh);

    for (let c = -1; c <= 1; c++) {
      const clawGeo = new THREE.ConeGeometry(0.03, 0.22, 4);
      const claw = new THREE.Mesh(clawGeo, clawMat);
      claw.position.set(c * 0.07, -0.92, 0.05);
      claw.rotation.x = Math.PI / 3;
      this.rightArm.add(claw);
    }
    group.add(this.rightArm);

    // 4. Digitigrade Beast Legs
    const legGeo = new THREE.BoxGeometry(0.3, 0.9, 0.32);

    this.leftLeg = new THREE.Group();
    this.leftLeg.position.set(-0.28, 0.9, 0);
    const lLegMesh = new THREE.Mesh(legGeo, furMat);
    lLegMesh.position.y = -0.45;
    this.leftLeg.add(lLegMesh);
    group.add(this.leftLeg);

    this.rightLeg = new THREE.Group();
    this.rightLeg.position.set(0.28, 0.9, 0);
    const rLegMesh = new THREE.Mesh(legGeo, furMat);
    rLegMesh.position.y = -0.45;
    this.rightLeg.add(rLegMesh);
    group.add(this.rightLeg);

    this.mesh = group;
    this.scene.add(group);
  }

  // Called when a noise is emitted in the pizzeria
  onSoundHeard(origin, intensity, soundType = 'noise') {
    if (this.state === AIState.STUNNED) return;

    // Distance calculation
    const dist = this.position.distanceTo(origin);

    // Threshold radius depends on noise intensity (Crouch: 5, Walk: 15, Run: 45, etc.)
    // radius = intensity * 0.52 (e.g., 90 noise -> ~46 meters)
    const audibleRadius = Math.max(3.0, intensity * 0.52);

    if (dist <= audibleRadius) {
      // Elias is alerted!
      this.memory.noiseHotspots.push({ pos: origin.clone(), time: Date.now(), intensity });
      if (this.memory.noiseHotspots.length > 8) this.memory.noiseHotspots.shift();

      if (this.state !== AIState.CHASING) {
        this.state = AIState.INVESTIGATING;
        this.stateTimer = 0;
        this.currentSpeed = this.investigateSpeed;
        this.navigateTo(origin);

        if (this.soundEngine && Math.random() < 0.45) {
          this.soundEngine.playWerewolfGrowl(dist < 12);
        }
      }
    }
  }

  // Flash burst stuns Elias
  applyStun(duration = 5.5) {
    this.state = AIState.STUNNED;
    this.stunTimer = duration;
    this.currentPath = [];
    if (this.leftArm) this.leftArm.rotation.x = -1.6; // Hands up to eyes
    if (this.rightArm) this.rightArm.rotation.x = -1.6;
    if (this.soundEngine) this.soundEngine.playWerewolfGrowl(true);
  }

  navigateTo(worldPos) {
    this.pathTarget = worldPos.clone();
    this.currentPath = this.navGraph.findPath(this.position, worldPos);
  }

  update(delta, player, worldColliders, hidingSpots, onPlayerCaughtCallback) {
    this.animTime += delta;

    // Check distance to player for dynamic audio & heartbeat
    const distToPlayer = this.position.distanceTo(player.position);
    if (this.soundEngine) {
      this.soundEngine.updateMonsterDistance(distToPlayer);
    }

    // 1. STUNNED STATE
    if (this.state === AIState.STUNNED) {
      this.stunTimer -= delta;
      // Recoil trembling animation
      this.mesh.position.x = this.position.x + (Math.random() - 0.5) * 0.05;
      if (this.stunTimer <= 0) {
        this.state = AIState.INVESTIGATING;
        this.navigateTo(this.position);
      }
      return;
    }

    // 2. LINE OF SIGHT CHECK
    this.canSeePlayer = this.checkLineOfSight(player, worldColliders);

    // 3. STATE LOGIC
    if (this.canSeePlayer && !player.isHiding) {
      // Transition to CHASE
      if (this.state !== AIState.CHASING) {
        this.state = AIState.CHASING;
        if (this.soundEngine) {
          this.soundEngine.playWerewolfHowl();
        }
      }
      this.currentSpeed = this.chaseSpeed;
      this.lastKnownPlayerPos = player.position.clone();
      this.memory.lastSeenPosition = player.position.clone();
      this.navigateTo(player.position);

    } else if (this.state === AIState.CHASING) {
      // Lost sight during chase
      this.state = AIState.SEARCHING;
      this.stateTimer = 8.0; // Search area for 8 seconds
      this.currentSpeed = this.investigateSpeed;
      if (this.lastKnownPlayerPos) {
        this.navigateTo(this.lastKnownPlayerPos);
      }

    } else if (this.state === AIState.INVESTIGATING) {
      this.stateTimer += delta;
      if (this.currentPath.length === 0 || this.stateTimer > 12.0) {
        // Finished investigating, switch to SEARCHING nearby hiding spots
        this.state = AIState.SEARCHING;
        this.stateTimer = 6.0;
        this.checkNearbyHidingSpots(hidingSpots);
      }

    } else if (this.state === AIState.SEARCHING) {
      this.stateTimer -= delta;
      if (this.stateTimer <= 0) {
        // Return to patrol
        this.state = AIState.RETURNING;
        this.currentSpeed = this.patrolSpeed;
        const nextPatrolId = this.patrolRoute[this.patrolIndex];
        const nextNode = this.navGraph.nodes[nextPatrolId];
        if (nextNode) {
          this.navigateTo(nextNode.position);
        }
      }

    } else if (this.state === AIState.PATROLLING || this.state === AIState.RETURNING) {
      this.currentSpeed = this.patrolSpeed;
      if (this.currentPath.length === 0) {
        this.patrolIndex = (this.patrolIndex + 1) % this.patrolRoute.length;
        const nextPatrolId = this.patrolRoute[this.patrolIndex];
        const nextNode = this.navGraph.nodes[nextPatrolId];
        if (nextNode) {
          this.navigateTo(nextNode.position);
        }
        if (this.state === AIState.RETURNING) {
          this.state = AIState.PATROLLING;
        }
      }
    }

    // 4. MOVE ALONG WAYPOINT PATH
    this.followPath(delta);

    // 5. BEAST ANIMATIONS
    this.updateAnimations(delta);

    // 6. CATCH PLAYER CHECK
    if (distToPlayer < 1.35 && !player.isHiding && this.state !== AIState.STUNNED) {
      if (onPlayerCaughtCallback) {
        onPlayerCaughtCallback();
      }
    }
  }

  followPath(delta) {
    if (this.currentPath.length === 0) return;

    const nextWay = this.currentPath[0];
    const toWay = new THREE.Vector3().subVectors(nextWay, this.position);
    toWay.y = 0;
    const dist = toWay.length();

    if (dist < 0.45) {
      this.currentPath.shift();
      return;
    }

    toWay.normalize();
    // Rotate towards movement direction
    const targetAngle = Math.atan2(toWay.x, toWay.z);
    this.rotationY = THREE.MathUtils.lerp(this.rotationY, targetAngle, delta * 7.0);

    // Move
    this.position.addScaledVector(toWay, this.currentSpeed * delta);
    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.rotationY;
  }

  checkLineOfSight(player, worldColliders) {
    if (player.isHiding) return false;

    const toPlayer = new THREE.Vector3().subVectors(player.position, this.position);
    const dist = toPlayer.length();
    if (dist > this.sightRange) return false;

    // Check FOV cone
    const forward = new THREE.Vector3(Math.sin(this.rotationY), 0, Math.cos(this.rotationY));
    toPlayer.y = 0;
    toPlayer.normalize();
    const dot = forward.dot(toPlayer);

    // In close proximity (under 3m), Elias senses player even outside direct cone
    if (dist > 3.0 && dot < this.sightFovCos) {
      return false;
    }

    // Raycast against walls
    const rayOrigin = this.position.clone().add(new THREE.Vector3(0, 1.8, 0));
    const rayTarget = player.position.clone().add(new THREE.Vector3(0, 1.2, 0));
    const dir = new THREE.Vector3().subVectors(rayTarget, rayOrigin).normalize();

    this.losRaycaster.set(rayOrigin, dir);
    this.losRaycaster.far = dist;

    const occluders = [];
    for (const c of worldColliders) {
      if (c.mesh && !c.isInteractable && c.enabled !== false) {
        occluders.push(c.mesh);
      }
    }

    const hits = this.losRaycaster.intersectObjects(occluders, true);
    // If something solid hit before player, sight is blocked!
    return hits.length === 0;
  }

  // The Beast Remembers: checks hiding spots with highest suspicion
  checkNearbyHidingSpots(hidingSpots) {
    let mostSuspiciousSpot = null;
    let highestSuspicion = 0;

    for (const spot of hidingSpots) {
      const dist = this.position.distanceTo(spot.position);
      if (dist < 9.0) {
        const score = spot.suspicionCount || 0;
        if (score > highestSuspicion) {
          highestSuspicion = score;
          mostSuspiciousSpot = spot;
        }
      }
    }

    // If a hiding spot has repeated usage, investigate it specifically!
    if (mostSuspiciousSpot && highestSuspicion >= 1) {
      this.navigateTo(mostSuspiciousSpot.position);
      // If player is inside this exact spot when inspected, caught!
      setTimeout(() => {
        if (mostSuspiciousSpot.isOccupied && this.position.distanceTo(mostSuspiciousSpot.position) < 2.0) {
          if (this.soundEngine) this.soundEngine.playJumpscare();
        }
      }, 3500);
    }
  }

  updateAnimations(delta) {
    const isMoving = this.currentPath.length > 0;
    const strideFreq = (this.state === AIState.CHASING) ? 14.0 : 7.0;

    if (isMoving && this.state !== AIState.STUNNED) {
      const stride = Math.sin(this.animTime * strideFreq);
      // Arm swing
      if (this.leftArm) this.leftArm.rotation.x = stride * 0.75;
      if (this.rightArm) this.rightArm.rotation.x = -stride * 0.75;

      // Leg stride
      if (this.leftLeg) this.leftLeg.rotation.x = -stride * 0.65;
      if (this.rightLeg) this.rightLeg.rotation.x = stride * 0.65;

      // Snarl jaw opening and closing
      if (this.jaw) {
        this.jaw.rotation.x = 0.2 + (this.state === AIState.CHASING ? Math.abs(stride) * 0.35 : 0.05);
      }
    } else {
      // Idle breathing
      const breath = Math.sin(this.animTime * 2.5) * 0.05;
      if (this.leftArm) this.leftArm.rotation.x = THREE.MathUtils.lerp(this.leftArm.rotation.x, breath, 0.1);
      if (this.rightArm) this.rightArm.rotation.x = THREE.MathUtils.lerp(this.rightArm.rotation.x, -breath, 0.1);
      if (this.head) this.head.rotation.y = Math.sin(this.animTime * 1.5) * 0.15;
    }
  }

  getDebugStatus(player) {
    return {
      state: this.state,
      speed: this.currentSpeed.toFixed(1),
      canSeePlayer: this.canSeePlayer,
      distanceToPlayer: this.position.distanceTo(player.position).toFixed(1),
      pathRemaining: this.currentPath.length,
      patrolIndex: this.patrolIndex
    };
  }
}

