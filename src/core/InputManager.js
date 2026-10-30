export class InputManager {
  constructor(domElement, options = {}) {
    this.domElement = domElement;
    this.options = options;

    // Movement axes (-1 to 1)
    this.moveForward = 0;
    this.moveBackward = 0;
    this.moveLeft = 0;
    this.moveRight = 0;

    // Look deltas (radians / sensitivity)
    this.lookDeltaX = 0;
    this.lookDeltaY = 0;

    // Actions
    this.isRunning = false;
    this.isCrouching = false;
    this.interactPressed = false;
    this.pumpkinPressed = false;
    this.inventoryPressed = false;
    this.pausePressed = false;
    this.abilitySlot = 1; // 1 to 4

    // Mouse Pointer Lock
    this.isLocked = false;
    this.mouseSensitivity = 0.0022;
    this.touchSensitivity = 0.0035;

    // Device check
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // Mobile touch tracking
    this.activeTouches = {};
    this.joystickTouchId = null;
    this.lookTouchId = null;
    this.joystickOrigin = { x: 0, y: 0 };
    this.joystickDelta = { x: 0, y: 0 };
    this.joystickRadius = 45;

    this.initKeyboard();
    this.initMouse();
    this.initMobileControls();
  }

  initKeyboard() {
    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.moveForward = 1;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.moveBackward = 1;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.moveLeft = 1;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.moveRight = 1;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          this.isRunning = true;
          break;
        case 'ControlLeft':
        case 'ControlRight':
        case 'KeyC':
          this.isCrouching = !this.isCrouching;
          break;
        case 'KeyE':
          this.interactPressed = true;
          break;
        case 'KeyF':
        case 'Space':
          this.pumpkinPressed = true;
          break;
        case 'KeyI':
        case 'Tab':
          e.preventDefault();
          this.inventoryPressed = true;
          break;
        case 'Digit1': this.abilitySlot = 1; break;
        case 'Digit2': this.abilitySlot = 2; break;
        case 'Digit3': this.abilitySlot = 3; break;
        case 'Digit4': this.abilitySlot = 4; break;
        case 'Escape':
          this.pausePressed = true;
          break;
      }
    });

    window.addEventListener('keyup', (e) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.moveForward = 0;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.moveBackward = 0;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.moveLeft = 0;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.moveRight = 0;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          this.isRunning = false;
          break;
        case 'KeyE':
          this.interactPressed = false;
          break;
        case 'KeyF':
        case 'Space':
          this.pumpkinPressed = false;
          break;
        case 'KeyI':
        case 'Tab':
          this.inventoryPressed = false;
          break;
        case 'Escape':
          this.pausePressed = false;
          break;
      }
    });
  }

  initMouse() {
    let isMouseDown = false;
    let lastX = 0;
    let lastY = 0;

    window.addEventListener('mousedown', (e) => {
      if (e.button === 0 && document.body.classList.contains('in-game')) {
        isMouseDown = true;
        lastX = e.clientX;
        lastY = e.clientY;

        // Auto request pointer lock on screen click if not interacting with UI
        if (!this.isLocked && !this.isMobile) {
          if (!e.target.closest('button, .ability-slot, .inv-slot, .screen:not(#screen-hud)')) {
            try {
              this.domElement.requestPointerLock?.();
            } catch (err) {}
          }
        }
      }
    });

    window.addEventListener('mouseup', () => {
      isMouseDown = false;
    });

    document.addEventListener('pointerlockchange', () => {
      this.isLocked = document.pointerLockElement === this.domElement;
    });

    window.addEventListener('mousemove', (e) => {
      if (this.isLocked) {
        this.lookDeltaX += e.movementX * this.mouseSensitivity;
        this.lookDeltaY += e.movementY * this.mouseSensitivity;
      } else if (isMouseDown && document.body.classList.contains('in-game')) {
        // Fallback smooth drag-to-look when pointer lock is not active
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        this.lookDeltaX += dx * this.mouseSensitivity;
        this.lookDeltaY += dy * this.mouseSensitivity;
        lastX = e.clientX;
        lastY = e.clientY;
      }
    });
  }

  initMobileControls() {
    const touchArea = document.getElementById('touch-look-zone');
    const joystickZone = document.getElementById('virtual-joystick-zone');
    const joystickKnob = document.getElementById('joystick-knob');

    if (joystickZone) {
      joystickZone.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.changedTouches[0];
        this.joystickTouchId = touch.identifier;
        const rect = joystickZone.getBoundingClientRect();
        this.joystickOrigin = {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2
        };
        this.updateJoystick(touch.clientX, touch.clientY, joystickKnob);
      }, { passive: false });

      joystickZone.addEventListener('touchmove', (e) => {
        e.preventDefault();
        for (let i = 0; i < e.changedTouches.length; i++) {
          const touch = e.changedTouches[i];
          if (touch.identifier === this.joystickTouchId) {
            this.updateJoystick(touch.clientX, touch.clientY, joystickKnob);
            break;
          }
        }
      }, { passive: false });

      const resetJoystick = (e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === this.joystickTouchId) {
            this.joystickTouchId = null;
            this.joystickDelta = { x: 0, y: 0 };
            if (joystickKnob) {
              joystickKnob.style.transform = `translate(0px, 0px)`;
            }
            break;
          }
        }
      };

      joystickZone.addEventListener('touchend', resetJoystick, { passive: false });
      joystickZone.addEventListener('touchcancel', resetJoystick, { passive: false });
    }

    if (touchArea) {
      let lastTouchX = 0;
      let lastTouchY = 0;

      touchArea.addEventListener('touchstart', (e) => {
        const touch = e.changedTouches[0];
        this.lookTouchId = touch.identifier;
        lastTouchX = touch.clientX;
        lastTouchY = touch.clientY;
      }, { passive: false });

      touchArea.addEventListener('touchmove', (e) => {
        e.preventDefault();
        for (let i = 0; i < e.changedTouches.length; i++) {
          const touch = e.changedTouches[i];
          if (touch.identifier === this.lookTouchId) {
            const dx = touch.clientX - lastTouchX;
            const dy = touch.clientY - lastTouchY;
            this.lookDeltaX += dx * this.touchSensitivity;
            this.lookDeltaY += dy * this.touchSensitivity;
            lastTouchX = touch.clientX;
            lastTouchY = touch.clientY;
            break;
          }
        }
      }, { passive: false });

      const resetLook = (e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === this.lookTouchId) {
            this.lookTouchId = null;
            break;
          }
        }
      };
      touchArea.addEventListener('touchend', resetLook, { passive: false });
      touchArea.addEventListener('touchcancel', resetLook, { passive: false });
    }

    // Touch Action Buttons
    this.bindTouchButton('btn-touch-interact', () => { this.interactPressed = true; setTimeout(() => this.interactPressed = false, 150); });
    this.bindTouchButton('btn-touch-run', () => { this.isRunning = !this.isRunning; });
    this.bindTouchButton('btn-touch-crouch', () => { this.isCrouching = !this.isCrouching; });
    this.bindTouchButton('btn-touch-pumpkin', () => { this.pumpkinPressed = true; setTimeout(() => this.pumpkinPressed = false, 150); });
    this.bindTouchButton('btn-touch-inv', () => { this.inventoryPressed = true; setTimeout(() => this.inventoryPressed = false, 150); });
  }

  updateJoystick(clientX, clientY, knobElement) {
    let dx = clientX - this.joystickOrigin.x;
    let dy = clientY - this.joystickOrigin.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > this.joystickRadius) {
      dx = (dx / distance) * this.joystickRadius;
      dy = (dy / distance) * this.joystickRadius;
    }

    this.joystickDelta = {
      x: dx / this.joystickRadius,
      y: dy / this.joystickRadius
    };

    if (knobElement) {
      knobElement.style.transform = `translate(${dx}px, ${dy}px)`;
    }
  }

  bindTouchButton(id, callback) {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      btn.classList.add('active');
      callback();
    }, { passive: false });
    btn.addEventListener('touchend', (e) => {
      btn.classList.remove('active');
    }, { passive: false });
  }

  // Returns combined keyboard + joystick input vector: x (strafe), z (forward/back)
  getMovementVector() {
    let x = (this.moveRight - this.moveLeft) + (this.joystickDelta.x || 0);
    let z = (this.moveBackward - this.moveForward) + (this.joystickDelta.y || 0);

    // Clamp vector magnitude to 1
    const len = Math.sqrt(x * x + z * z);
    if (len > 1.0) {
      x /= len;
      z /= len;
    }

    return { x, z };
  }

  consumeLookDelta() {
    const res = { x: this.lookDeltaX, y: this.lookDeltaY };
    this.lookDeltaX = 0;
    this.lookDeltaY = 0;
    return res;
  }
}
