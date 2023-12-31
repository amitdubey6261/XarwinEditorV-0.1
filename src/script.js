import * as THREE from 'three';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js';


let cameraPersp, cameraOrtho, currentCamera;
let scene, renderer, control, orbit, glbModel ;
let selectedObject = null;
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const group = new THREE.Group() ; 

init();
render();

function init() {

    renderer = new THREE.WebGLRenderer({alpha:true , antialias : true});
    renderer.xr.enabled = true ; 
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.domElement.className = 'webgl' ;
    
    document.body.appendChild(renderer.domElement);
    document.body.appendChild( ARButton.createButton(renderer))


    const aspect = window.innerWidth / window.innerHeight;

    cameraPersp = new THREE.PerspectiveCamera(50, aspect, 0.01, 30000);
    cameraOrtho = new THREE.OrthographicCamera(- 600 * aspect, 600 * aspect, 600, - 600, 0.01, 30000);
    currentCamera = cameraPersp;

    currentCamera.position.set(1000, 500, 1000);
    currentCamera.lookAt(0, 200, 0);

    scene = new THREE.Scene();
    scene.add(new THREE.GridHelper(1000, 10, 0x888888, 0x444444));

    const light = new THREE.DirectionalLight(0xffffff, 10);
    const light2 = new THREE.DirectionalLight(0xffffff, 10);
    light.position.set(1, 10, 10);
    light2.position.set(10, 1, 1);
    scene.add(light);
    scene.add(light2);


    const geometry = new THREE.BoxGeometry(200, 200, 200);
    const material = new THREE.MeshBasicMaterial({ color: '0xff0000' });

    orbit = new OrbitControls(currentCamera, renderer.domElement);
    orbit.update();
    orbit.addEventListener('change', render);

    control = new TransformControls(currentCamera, renderer.domElement);

    control.addEventListener('change', render);

    control.addEventListener('dragging-changed', function (event) {

        orbit.enabled = !event.value;

    });



    new GLTFLoader()
        .load('https://xarwin-assests-spaces-prod.fra1.digitaloceanspaces.com/ZH5USSvI2uNI6EKAmJOdmCyZET02/car.glb', (gltf) => {
            scene.add(gltf.scene);
            group.add(gltf.scene);
            glbModel = gltf.scene.children[0];
            scene.add(control)
        })

    new GLTFLoader()
        .load('https://xarwin-assests-spaces-prod.fra1.digitaloceanspaces.com/ZH5USSvI2uNI6EKAmJOdmCyZET02/futuristic_building.glb', (gltf) => {
            scene.add(gltf.scene);
            group.add(gltf.scene);
            glbModel = gltf.scene.children[0];
            group.add( glbModel );
        })

        scene.add( group)

    window.addEventListener('resize', onWindowResize);

    window.addEventListener('keydown', function (event) {

        switch (event.keyCode) {

            case 81: // Q
                control.setSpace(control.space === 'local' ? 'world' : 'local');
                break;

            case 16: // Shift
                control.setTranslationSnap(100);
                control.setRotationSnap(THREE.MathUtils.degToRad(15));
                control.setScaleSnap(0.25);
                break;

            case 87: // W
                control.setMode('translate');
                break;

            case 69: // E
                control.setMode('rotate');
                break;

            case 82: // R
                control.setMode('scale');
                break;

            case 67: // C
                const position = currentCamera.position.clone();

                currentCamera = currentCamera.isPerspectiveCamera ? cameraOrtho : cameraPersp;
                currentCamera.position.copy(position);

                orbit.object = currentCamera;
                control.camera = currentCamera;

                currentCamera.lookAt(orbit.target.x, orbit.target.y, orbit.target.z);
                onWindowResize();
                break;

            case 86: // V
                const randomFoV = Math.random() + 0.1;
                const randomZoom = Math.random() + 0.1;

                cameraPersp.fov = randomFoV * 160;
                cameraOrtho.bottom = - randomFoV * 500;
                cameraOrtho.top = randomFoV * 500;

                cameraPersp.zoom = randomZoom * 5;
                cameraOrtho.zoom = randomZoom * 5;
                onWindowResize();
                break;

            case 187:
            case 107: // +, =, num+
                control.setSize(control.size + 0.1);
                break;

            case 189:
            case 109: // -, _, num-
                control.setSize(Math.max(control.size - 0.1, 0.1));
                break;

            case 88: // X
                control.showX = !control.showX;
                break;

            case 89: // Y
                control.showY = !control.showY;
                break;

            case 90: // Z
                control.showZ = !control.showZ;
                break;

            case 32: // Spacebar
                control.enabled = !control.enabled;
                break;

            case 27: // Esc
                control.reset();
                break;

        }

    });

    document.addEventListener( 'pointermove', onPointerMove );

    window.addEventListener('keyup', function (event) {

        switch (event.keyCode) {

            case 16: // Shift
                control.setTranslationSnap(null);
                control.setRotationSnap(null);
                control.setScaleSnap(null);
                break;

        }

    });

}

function onWindowResize() {

    const aspect = window.innerWidth / window.innerHeight;

    cameraPersp.aspect = aspect;
    cameraPersp.updateProjectionMatrix();

    cameraOrtho.left = cameraOrtho.bottom * aspect;
    cameraOrtho.right = cameraOrtho.top * aspect;
    cameraOrtho.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

    render();

}

function onPointerMove( event ) {

    if ( selectedObject ) {
        console.log( selectedObject );
        control.attach(selectedObject)
        selectedObject.material.color.set( '#69f' );

    }

    pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

    raycaster.setFromCamera( pointer, cameraPersp );

    const intersects = raycaster.intersectObject( group, true );

    if ( intersects.length > 0 ) {

        const res = intersects.filter( function ( res ) {

            return res && res.object;

        } )[ 0 ];

        if ( res && res.object ) {

            selectedObject = res.object;
            selectedObject.material.color.set( '#f00' );

        }

    }

}

function render() {

    renderer.render(scene, currentCamera);

}