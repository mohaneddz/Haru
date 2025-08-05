// src/components/Sphere.tsx
import { createSignal, onCleanup, onMount, type Component } from "solid-js";
import * as THREE from "three";

//================================================================
// CONFIGURATION
//================================================================
const THEME_CONFIG = {
  sphereColor: 0x22d3ee, // Dot color
  dotSize: 0.015,        // Dot size
  sphereRadius: 0.75,     // Sphere radius
  particleCount: 4000,   // Number of dots
  rotationSpeed: 0.001, // Rotation speed
  bassIntensity: 1.2,    // Bass effect
  trebleIntensity: 0.5,  // Treble effect
  overallIntensity: 0.5, // Master multiplier
  smoothing: 0.1,        // Smoothing factor
  fftSize: 512,          // Audio FFT size
};

// Linear interpolation for smooth transitions
const lerp = (start: number, end: number, amount: number): number =>
  (1 - amount) * start + amount * end;

//================================================================
// COMPONENT
//================================================================
const Sphere: Component = () => {
  // Canvas reference
  let canvasRef: HTMLCanvasElement | undefined;

  // State signals
  const [_, setIsInitialized] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  // Cleanup functions
  const cleanupFunctions: (() => void)[] = [];

  //================================================================
  // VISUALIZER LOGIC
  //================================================================
  const startVisualizer = async () => {
    if (!canvasRef) return;

    // Check browser support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("Your browser does not support the required Audio API.");
      return;
    }

    // --- SCENE SETUP ---
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 3;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef,
      antialias: true,
      alpha: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // --- SPHERE GEOMETRY ---
    const geometry = new THREE.BufferGeometry();
    const positions: number[] = [];
    const originalPositions: number[] = [];

    // Generate sphere dots
    for (let i = 0; i < THEME_CONFIG.particleCount; i++) {
      const phi = Math.acos(-1 + (2 * i) / THEME_CONFIG.particleCount);
      const theta = Math.sqrt(THEME_CONFIG.particleCount * Math.PI) * phi;

      const x = THEME_CONFIG.sphereRadius * Math.cos(theta) * Math.sin(phi);
      const y = THEME_CONFIG.sphereRadius * Math.sin(theta) * Math.sin(phi);
      const z = THEME_CONFIG.sphereRadius * Math.cos(phi);

      positions.push(x, y, z);
      originalPositions.push(x, y, z);
    }

    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3)
    );

    const material = new THREE.PointsMaterial({
      color: THEME_CONFIG.sphereColor,
      size: THEME_CONFIG.dotSize,
      sizeAttenuation: true,
      transparent: true,
    });

    const sphere = new THREE.Points(geometry, material);
    scene.add(sphere);

    // --- AUDIO SETUP ---
    let stream: MediaStream | undefined;
    let audioContext: AudioContext | undefined;

    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Support older browsers
      const AudioContext =
        window.AudioContext || (window as any).webkitAudioContext;
      audioContext = new AudioContext();

      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = THEME_CONFIG.fftSize;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      // --- ANIMATION LOOP ---
      let frameId: number | undefined;
      const currentMagnitudes = new Array(positions.length / 3).fill(1);

      const animate = () => {
        frameId = requestAnimationFrame(animate);

        // Get audio frequency data
        analyser.getByteFrequencyData(dataArray);

        // Calculate bass and treble averages
        const bassEndIndex = Math.floor(bufferLength * 0.2);
        const trebleStartIndex = Math.floor(bufferLength * 0.5);

        let bassSum = 0;
        for (let i = 0; i < bassEndIndex; i++) bassSum += dataArray[i];
        const bassAvg =
          (bassSum / bassEndIndex / 255) * THEME_CONFIG.bassIntensity;

        let trebleSum = 0;
        for (let i = trebleStartIndex; i < bufferLength; i++)
          trebleSum += dataArray[i];
        const trebleAvg =
          (trebleSum / (bufferLength - trebleStartIndex) / 255) *
          THEME_CONFIG.trebleIntensity;

        // Update sphere geometry based on audio
        const positionAttribute = sphere.geometry.attributes.position;
        for (let i = 0; i < positionAttribute.count; i++) {
          const targetMagnitude =
            1 + (bassAvg + trebleAvg) * THEME_CONFIG.overallIntensity;
          currentMagnitudes[i] = lerp(
            currentMagnitudes[i],
            targetMagnitude,
            THEME_CONFIG.smoothing
          );
          const magnitude = currentMagnitudes[i];

          const ox = originalPositions[i * 3];
          const oy = originalPositions[i * 3 + 1];
          const oz = originalPositions[i * 3 + 2];

          positionAttribute.setXYZ(i, ox * magnitude, oy * magnitude, oz * magnitude);
        }
        positionAttribute.needsUpdate = true;

        // Rotate sphere
        sphere.rotation.y += THEME_CONFIG.rotationSpeed;
        sphere.rotation.x += THEME_CONFIG.rotationSpeed / 2;

        renderer.render(scene, camera);
      };
      animate();

      // --- WINDOW RESIZE HANDLER ---
      const handleResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      };
      window.addEventListener("resize", handleResize);

      // --- CLEANUP ---
      cleanupFunctions.push(() => {
        if (frameId) cancelAnimationFrame(frameId);
        window.removeEventListener("resize", handleResize);
        if (stream)
          stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
        if (audioContext) audioContext.close();
        geometry.dispose();
        material.dispose();
        renderer.dispose();
      });

      setIsInitialized(true);
    } catch (err) {
      console.error("Error initializing audio:", err);
      setError("Could not access microphone. Please grant permission and refresh.");
    }
  };

  // Automatically start visualizer on mount
  onMount(() => {
    startVisualizer();
  });

  // Cleanup on component unmount
  onCleanup(() => {
    cleanupFunctions.forEach((fn) => fn());
  });

  //================================================================
  // RENDER
  //================================================================
  return (
    <div class="absolute mb-[10vh] z-10">
      <canvas ref={canvasRef} class="w-full h-full bg-transparent p-4" />
      <div class="absolute inset-0 flex items-center justify-center">
        {error() && (
          <div class="text-center text-white p-6 bg-black/50 rounded-lg backdrop-blur-sm z-30">
            <h2 class="text-xl font-bold mb-2 text-red-400">Error</h2>
            <p class="text-neutral-300">{error()}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sphere;