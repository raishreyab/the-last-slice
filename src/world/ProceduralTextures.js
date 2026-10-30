import * as THREE from 'three';

// Procedural texture generator for dark atmospheric pizzeria
export class ProceduralTextures {
  static createCheckerTileTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Dusty black and aged cream/burnt orange checkerboard
    const tileSize = 64;
    for (let y = 0; y < 512; y += tileSize) {
      for (let x = 0; x < 512; x += tileSize) {
        const isBlack = ((x / tileSize) + (y / tileSize)) % 2 === 0;
        ctx.fillStyle = isBlack ? '#151318' : '#6a5540';
        ctx.fillRect(x, y, tileSize, tileSize);

        // Dirty grime and cracks
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.fillRect(x + 2, y + 2, tileSize - 4, tileSize - 4);
      }
    }

    // Add blood streaks / scuff marks
    ctx.strokeStyle = '#280c05';
    ctx.lineWidth = 3;
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      const sx = Math.random() * 512;
      const sy = Math.random() * 512;
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + (Math.random() - 0.5) * 80, sy + (Math.random() - 0.5) * 80);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    return texture;
  }

  static createWallpaperTexture(type = 'dining') {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Base burnt orange / dark purple wallpaper
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 512);
    if (type === 'dining') {
      bgGrad.addColorStop(0, '#2d1810');
      bgGrad.addColorStop(1, '#1b0c09');
    } else if (type === 'hallway') {
      bgGrad.addColorStop(0, '#1c1524');
      bgGrad.addColorStop(1, '#0e0a14');
    } else if (type === 'kitchen') {
      bgGrad.addColorStop(0, '#222629');
      bgGrad.addColorStop(1, '#131517');
    } else {
      bgGrad.addColorStop(0, '#181412');
      bgGrad.addColorStop(1, '#0c0908');
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 512, 512);

    // Weathered stripes or diamond pattern
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 512; i += 32) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 512);
      ctx.stroke();
    }

    // Claw scratch marks
    ctx.strokeStyle = '#050202';
    ctx.lineWidth = 4;
    for (let s = 0; s < 3; s++) {
      const cx = 100 + Math.random() * 300;
      const cy = 100 + Math.random() * 300;
      for (let c = 0; c < 4; c++) {
        ctx.beginPath();
        ctx.moveTo(cx + c * 8, cy);
        ctx.lineTo(cx + c * 8 + 15, cy + 90 + Math.random() * 20);
        ctx.stroke();
      }
    }

    // Dirt noise
    const imgData = ctx.getImageData(0, 0, 512, 512);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 20;
      data[i] = Math.min(255, Math.max(0, data[i] + noise));
      data[i+1] = Math.min(255, Math.max(0, data[i+1] + noise));
      data[i+2] = Math.min(255, Math.max(0, data[i+2] + noise));
    }
    ctx.putImageData(imgData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    return texture;
  }

  static createWoodFloorTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#22150d';
    ctx.fillRect(0, 0, 512, 512);

    // Planks
    const plankH = 40;
    for (let y = 0; y < 512; y += plankH) {
      ctx.fillStyle = (y % 80 === 0) ? '#281a11' : '#1e120a';
      ctx.fillRect(0, y, 512, plankH - 2);

      // Wood grain lines
      ctx.strokeStyle = 'rgba(10,5,2,0.4)';
      ctx.lineWidth = 1;
      for (let g = 0; g < 4; g++) {
        ctx.beginPath();
        ctx.moveTo(0, y + 8 + g * 7);
        ctx.bezierCurveTo(150, y + 10 + g * 7, 350, y + 6 + g * 7, 512, y + 8 + g * 7);
        ctx.stroke();
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(3, 3);
    return texture;
  }

  static createRustyMetalTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#2b2a2d';
    ctx.fillRect(0, 0, 256, 256);

    // Rust spots
    for (let i = 0; i < 40; i++) {
      const rx = Math.random() * 256;
      const ry = Math.random() * 256;
      const rRad = 5 + Math.random() * 25;
      const grad = ctx.createRadialGradient(rx, ry, 2, rx, ry, rRad);
      grad.addColorStop(0, '#662d10');
      grad.addColorStop(0.5, '#401806');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(rx, ry, rRad, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  static createPumpkinFaceTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Deep pumpkin orange
    ctx.fillStyle = '#1c0902';
    ctx.fillRect(0, 0, 256, 256);

    // Carved glowing eyes and jagged grin
    ctx.fillStyle = '#ff7700';
    ctx.shadowColor = '#ffaa00';
    ctx.shadowBlur = 15;

    // Triangle Eyes
    ctx.beginPath();
    ctx.moveTo(60, 80); ctx.lineTo(95, 80); ctx.lineTo(77, 50); ctx.closePath();
    ctx.moveTo(161, 80); ctx.lineTo(196, 80); ctx.lineTo(178, 50); ctx.closePath();
    ctx.fill();

    // Triangle Nose
    ctx.beginPath();
    ctx.moveTo(120, 115); ctx.lineTo(136, 115); ctx.lineTo(128, 95); ctx.closePath();
    ctx.fill();

    // Sinister Jagged Smile
    ctx.beginPath();
    ctx.moveTo(45, 145);
    ctx.lineTo(75, 175);
    ctx.lineTo(95, 150);
    ctx.lineTo(115, 180);
    ctx.lineTo(135, 150);
    ctx.lineTo(155, 180);
    ctx.lineTo(175, 150);
    ctx.lineTo(210, 145);
    ctx.lineTo(190, 195);
    ctx.lineTo(165, 175);
    ctx.lineTo(145, 205);
    ctx.lineTo(128, 175);
    ctx.lineTo(110, 205);
    ctx.lineTo(90, 175);
    ctx.lineTo(65, 195);
    ctx.closePath();
    ctx.fill();

    return new THREE.CanvasTexture(canvas);
  }

  static createGhostRuneTexture(symbolText = "Ψ") {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, 256, 256);
    ctx.fillStyle = 'rgba(0,0,0,0)';
    ctx.fillRect(0, 0, 256, 256);

    // Glowing ethereal rune
    ctx.font = 'bold 120px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.shadowColor = '#c77dff';
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#e0aaff';
    ctx.fillText(symbolText, 128, 128);

    // Occult outer ring
    ctx.strokeStyle = '#c77dff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(128, 128, 90, 0, Math.PI * 2);
    ctx.stroke();

    return new THREE.CanvasTexture(canvas);
  }
}

