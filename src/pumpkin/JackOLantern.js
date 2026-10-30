import * as THREE from 'three';
import { ProceduralTextures } from '../world/ProceduralTextures.js';

export const PumpkinAbility = {
  SOUL_LIGHT: 1,
  GHOST_VISION: 2,
  FLASH_BURST: 3,
  SOUL_TRACKER: 4
};

export class JackOLantern {
  constructor(camera, scene, soundEngine = null) {
    this.camera = camera;
    this.scene = scene;
    this.soundEngine = soundEngine;

    // Energy stats
    this.energy = 100;
    this.maxEnergy = 100;
    this.regenRate = 3.5; // per sec passive recharge

    // Abilities state
    this.activeAbility = PumpkinAbility.SOUL_LIGHT;
    this.isSoulLightActive = true;
    this.isGhostVisionActive = false;

    // 3D Model Attached to Player Camera (First Person Left Hand)
    this.pumpkinGroup = null;
    this.interiorLight = null;
    this.soulLightSource = null;
    this.flashLight = null;

    // Soul Tracker Particles / Wisps
    this.wisps = [];

    this.build3DModel();
  }

  build3DModel() {
    this.pumpkinGroup = new THREE.Group();

    // Ribbed pumpkin geometry (flattened sphere)
    const pumpGeo = new THREE.SphereGeometry(0.18, 16, 12);
    pumpGeo.scale(1.2, 0.95, 1.2);

    // Pumpkin carved face material with procedural texture
    const faceTex = ProceduralTextures.createPumpkinFaceTexture();
    const pumpMat = new THREE.MeshStandardMaterial({
      map: faceTex,
      roughness: 0.7,
      metalness: 0.1,
      bumpScale: 0.05
    });

    const pumpkinMesh = new THREE.Mesh(pumpGeo, pumpMat);
    this.pumpkinGroup.add(pumpkinMesh);

    // Pumpkin Stem (dark green twisted stem)
    const stemGeo = new THREE.CylinderGeometry(0.02, 0.035, 0.09, 6);
    const stemMat = new THREE.MeshStandardMaterial({ color: 0x1f3316, roughness: 0.9 });
    const stem = new THREE.Mesh(stemGeo, stemMat);
    stem.position.y = 0.19;
    stem.rotation.z = 0.2;
    this.pumpkinGroup.add(stem);

    // Internal supernatural orange glow
    this.interiorLight = new THREE.PointLight(0xff6600, 2.2, 5.0);
    this.interiorLight.position.set(0, 0, 0.1);
    this.pumpkinGroup.add(this.interiorLight);

    // Flash Burst Light (very high intensity, short blast)
    this.flashLight = new THREE.PointLight(0xffaa22, 0.0, 15.0);
    this.flashLight.position.set(0, 0, 0.5);
    this.pumpkinGroup.add(this.flashLight);

    // Position relative to camera view (bottom-left corner)
    this.pumpkinGroup.position.set(-0.35, -0.28, -0.65);
    this.camera.add(this.pumpkinGroup);
    this.scene.add(this.camera);

    // Dynamic Soul Light (forward casting lantern)
    this.soulLightSource = new THREE.SpotLight(0xff8822, 3.0, 16.0, Math.PI / 4, 0.4, 1.2);
    this.soulLightSource.position.set(0, 0, 0);
    this.pumpkinGroup.add(this.soulLightSource);
    this.pumpkinGroup.add(this.soulLightSource.target);
    this.soulLightSource.target.position.set(0, 0, -5);
  }

  selectAbility(slotNumber) {
    if (slotNumber >= 1 && slotNumber <= 4) {
      this.activeAbility = slotNumber;
      if (this.soundEngine) this.soundEngine.playPumpkinAbilityHum();
    }
  }

  activateCurrentAbility(werewolf = null, soundDetector = null, worldBuilder = null, uncollectedFragments = []) {
    switch (this.activeAbility) {
      case PumpkinAbility.SOUL_LIGHT:
        this.toggleSoulLight();
        break;

      case PumpkinAbility.GHOST_VISION:
        this.toggleGhostVision(worldBuilder);
        break;

      case PumpkinAbility.FLASH_BURST:
        this.triggerFlashBurst(werewolf, soundDetector);
        break;

      case PumpkinAbility.SOUL_TRACKER:
        this.triggerSoulTracker(uncollectedFragments);
        break;
    }
  }

  toggleSoulLight() {
    this.isSoulLightActive = !this.isSoulLightActive;
    this.soulLightSource.intensity = this.isSoulLightActive ? 3.0 : 0.0;
    if (this.soundEngine) this.soundEngine.playPumpkinAbilityHum();
  }

  toggleGhostVision(worldBuilder) {
    if (this.energy < 5 && !this.isGhostVisionActive) return;

    this.isGhostVisionActive = !this.isGhostVisionActive;
    if (worldBuilder) {
      worldBuilder.setGhostVisionActive(this.isGhostVisionActive);
    }
    // Change interior light to eerie purple during Ghost Vision
    this.interiorLight.color.setHex(this.isGhostVisionActive ? 0xcc44ff : 0xff6600);
    if (this.soundEngine) this.soundEngine.playPumpkinAbilityHum();
  }

  triggerFlashBurst(werewolf, soundDetector) {
    const cost = 40;
    if (this.energy < cost) return false;

    this.energy -= cost;
    if (this.soundEngine) this.soundEngine.playPumpkinBurst();

    // Blinding visual flash
    this.flashLight.intensity = 18.0;
    setTimeout(() => {
      this.flashLight.intensity = 0.0;
    }, 280);

    // Stun Werewolf if within distance and line of sight
    if (werewolf) {
      const dist = this.camera.position.distanceTo(werewolf.position);
      if (dist < 12.0) {
        werewolf.applyStun(5.5);
      }
    }

    // Flash Burst generates high noise (noise: 80)
    if (soundDetector) {
      soundDetector.emitSound(this.camera.position, 80, 'flash_burst');
    }

    return true;
  }

  triggerSoulTracker(uncollectedFragments) {
    const cost = 15;
    if (this.energy < cost) return false;
    if (!uncollectedFragments || uncollectedFragments.length === 0) return false;

    this.energy -= cost;
    if (this.soundEngine) this.soundEngine.playPumpkinAbilityHum();

    // Find closest fragment
    let closest = null;
    let minDist = Infinity;
    for (const frag of uncollectedFragments) {
      const dist = this.camera.position.distanceTo(frag.position);
      if (dist < minDist) {
        minDist = dist;
        closest = frag;
      }
    }

    if (closest) {
      this.spawnTrackerWisps(this.camera.position, closest.position);
    }
    return true;
  }

  spawnTrackerWisps(startPos, targetPos) {
    // Spectral orange orb particles that drift along path towards the fragment
    const count = 5;
    const dir = new THREE.Vector3().subVectors(targetPos, startPos).normalize();

    for (let i = 0; i < count; i++) {
      const wispGeo = new THREE.SphereGeometry(0.12, 8, 8);
      const wispMat = new THREE.MeshBasicMaterial({ color: 0xff7700, transparent: true, opacity: 0.85 });
      const wisp = new THREE.Mesh(wispGeo, wispMat);
      wisp.position.copy(startPos).add(new THREE.Vector3((Math.random() - 0.5) * 0.4, 0.2, (Math.random() - 0.5) * 0.4));
      this.scene.add(wisp);

      this.wisps.push({
        mesh: wisp,
        velocity: dir.clone().multiplyScalar(4.5 + i * 0.8),
        life: 2.5
      });
    }
  }

  recharge(amount = 50) {
    this.energy = Math.min(this.maxEnergy, this.energy + amount);
    if (this.soundEngine) this.soundEngine.playPickup();
  }

  update(delta, worldBuilder = null) {
    // Energy Drain during toggled abilities
    if (this.isGhostVisionActive) {
      this.energy = Math.max(0, this.energy - 2.8 * delta);
      if (this.energy <= 0) {
        this.toggleGhostVision(worldBuilder); // auto disable when depleted
      }
    } else {
      // Passive recharge
      if (this.energy < this.maxEnergy) {
        this.energy = Math.min(this.maxEnergy, this.energy + this.regenRate * delta);
      }
    }

    // Gentle floating bob in player's view
    const time = performance.now() * 0.002;
    if (this.pumpkinGroup) {
      this.pumpkinGroup.position.y = -0.28 + Math.sin(time) * 0.015;
      this.pumpkinGroup.rotation.z = Math.sin(time * 0.8) * 0.03;
    }

    // Update soul tracker wisps
    for (let i = this.wisps.length - 1; i >= 0; i--) {
      const wisp = this.wisps[i];
      wisp.mesh.position.addScaledVector(wisp.velocity, delta);
      wisp.life -= delta;
      wisp.mesh.material.opacity = wisp.life / 2.5;
      if (wisp.life <= 0) {
        this.scene.remove(wisp.mesh);
        this.wisps.splice(i, 1);
      }
    }
  }
}

