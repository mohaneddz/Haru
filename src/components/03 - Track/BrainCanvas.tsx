import { onMount, onCleanup, createSignal } from 'solid-js';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface Props {
    class?: string;
}

export default function BrainCanvas(props: Props) {
    let canvasRef: HTMLCanvasElement | undefined;
    let renderer: THREE.WebGLRenderer;
    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;
    let controls: OrbitControls;
    let animationId: number;
    let brainMesh: THREE.Group;
    let raycaster: THREE.Raycaster;
    let mouse: THREE.Vector2;
    let originalMaterials: Map<THREE.Mesh, THREE.Material | THREE.Material[]> = new Map();

    const [controlsEnabled, setControlsEnabled] = createSignal(true);

    const initialCameraPosition = new THREE.Vector3(0, 0, 5);
    const initialCameraTarget = new THREE.Vector3(0, 0, 0);

    const resetCamera = () => {
        if (camera && controls) {
            camera.position.copy(initialCameraPosition);
            controls.target.copy(initialCameraTarget);
            controls.update();
        }
    };

    const toggleControls = () => {
        const enabled = !controlsEnabled();
        setControlsEnabled(enabled);
        if (controls) controls.enabled = enabled;
    };

    onMount(() => {
        if (!canvasRef) return;

        scene = new THREE.Scene();
        scene.background = null;        camera = new THREE.PerspectiveCamera(
            75,
            canvasRef.parentElement!.clientWidth / canvasRef.parentElement!.clientHeight,
            0.1,
            1000
        );
        camera.position.set(0, 0, 5);

        renderer = new THREE.WebGLRenderer({ canvas: canvasRef, antialias: true, alpha: true });
        renderer.setSize(canvasRef.parentElement!.clientWidth, canvasRef.parentElement!.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setClearColor(0x000000, 0);

        controls = new OrbitControls(camera, canvasRef);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.enableZoom = true;
        controls.enableRotate = true;
        controls.enablePan = true;
        controls.minDistance = 2;
        controls.maxDistance = 20;

        raycaster = new THREE.Raycaster();
        mouse = new THREE.Vector2();

        const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 5, 5);
        scene.add(directionalLight);

        const loader = new GLTFLoader();
        loader.load(
            '/brain.glb',
            (gltf) => {
                brainMesh = gltf.scene;

                const box = new THREE.Box3().setFromObject(brainMesh);
                const center = box.getCenter(new THREE.Vector3());
                const size = box.getSize(new THREE.Vector3());
                const maxSize = Math.max(size.x, size.y, size.z);
                const scale = 4 / maxSize;

                brainMesh.scale.multiplyScalar(scale);
                brainMesh.rotateX(Math.PI / 2);
                brainMesh.rotateY(Math.PI / 2);
                brainMesh.position.sub(center.multiplyScalar(scale));

                brainMesh.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        originalMaterials.set(child, child.material);
                        child.material = new THREE.MeshBasicMaterial({
                            color: 0x22D3EE,
                            wireframe: true,
                            transparent: true,
                            opacity: 0.6
                        });
                    }
                });

                scene.add(brainMesh);

                const animate = () => {
                    animationId = requestAnimationFrame(animate);
                    controls.update();
                    renderer.render(scene, camera);
                };
                animate();
            },
            undefined,
            (error) => {
                console.error('Error loading brain model:', error);
            }
        );

        const onMouseMove = (event: MouseEvent) => {
            if (!canvasRef || !brainMesh) return;

            const rect = canvasRef.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
            raycaster.setFromCamera(mouse, camera);

            const tooltip = document.getElementById("tooltip") as HTMLDivElement;

            const intersects = raycaster.intersectObjects(brainMesh.children, true);

            brainMesh.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    //   child.material = new THREE.MeshBasicMaterial({
                    //     color: 0x6366f1,
                    //     wireframe: true,
                    //     transparent: true,
                    //     opacity: 0.6
                    //   });
                }
            });

            if (intersects.length > 0 && tooltip) {
                intersects.forEach(intersect => {
                    if (intersect.object instanceof THREE.Mesh) {
                        // intersect.object.material = new THREE.MeshBasicMaterial({
                        //   color: 0x6366f1,
                        //   transparent: true,
                        //   opacity: 0.8
                        // });
                    }
                });

                canvasRef.style.cursor = 'pointer';
                const screenPosition = new THREE.Vector3();
                brainMesh.getWorldPosition(screenPosition);
                screenPosition.project(camera);

                const centerX = (screenPosition.x * 0.5 + 0.5) * canvasRef.clientWidth;
                const centerY = (-screenPosition.y * 0.5 + 0.5) * canvasRef.clientHeight;

                tooltip.style.left = `${centerX + 80}px`;
                tooltip.style.top = `${centerY + 80}px`;

                tooltip.classList.remove("hidden");
            } else if (tooltip) {
                canvasRef.style.cursor = 'grab';
                tooltip.classList.add("hidden");
            }
        };        const handleResize = () => {
            if (!canvasRef) return;
            const container = canvasRef.parentElement;
            if (container) {
                const width = container.clientWidth;
                const height = container.clientHeight;
                
                camera.aspect = width / height;
                camera.updateProjectionMatrix();
                renderer.setSize(width, height);
                
                canvasRef.width = width;
                canvasRef.height = height;
            }
        };        canvasRef.addEventListener('mousemove', onMouseMove);
        window.addEventListener('resize', handleResize);
        
        // Add ResizeObserver for better container size tracking
        const resizeObserver = new ResizeObserver(() => {
            handleResize();
        });
        
        if (canvasRef.parentElement) {
            resizeObserver.observe(canvasRef.parentElement);
        }

        onCleanup(() => {
            canvasRef?.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('resize', handleResize);
            resizeObserver.disconnect();
            if (animationId) cancelAnimationFrame(animationId);
            if (controls) controls.dispose();
            if (renderer) renderer.dispose();
        });
    });

    return (
        <div class={`relative w-full h-full border-accent/40 border-1 rounded-lg overflow-hidden ${props.class}`} >

            {/* Tooltip */}
            <div
                id="tooltip"
                class="absolute hidden z-50 p-2 px-3 text-sm rounded-lg shadow-md bg-sidebar border border-blue-500 text-accent pointer-events-none transition-opacity duration-200"
            >
                <div class="font-semibold text-sm mb-1">Brain</div>
                <div class="text-xs text-gray-400">This is your 3D brain model.</div>
                <div class="absolute -top-2 left-4 w-2 h-2 rotate-45 bg-white border-l border-t border-blue-500"></div>
            </div>

            {/* Canvas */}
            <canvas
                ref={canvasRef}
                class="w-full h-full"
                style="display: block; cursor: grab;"
            />

            {/* UI buttons */}
            <div class="absolute w-40 top-4 right-4 flex flex-col gap-2 z-10">
                
                <button
                    onClick={resetCamera}
                    class="px-3 py-2 cursor-pointer bg-accent hover:bg-accent-dark-1 text-white rounded-lg shadow-lg transition-colors duration-200 text-sm font-medium"
                    title="Reset camera position"
                >
                    Reset View
                </button>

                <button
                    onClick={toggleControls}
                    class={`px-3 py-2 cursor-pointer rounded-lg shadow-lg transition-colors duration-200 text-sm font-medium ${controlsEnabled()
                            ? 'bg-sidebar-light-3 hover:bg-sidebar-light-1 text-white'
                            : 'bg-sidebar-dark-1 hover:bg-sidebar-dark-3 outline text-text/70'
                        }`}
                    title={controlsEnabled() ? "Disable camera controls" : "Enable camera controls"}
                >
                    {controlsEnabled() ? 'Controls: ON' : 'Controls: OFF'}
                </button>
            </div>
        </div>
    );
}
