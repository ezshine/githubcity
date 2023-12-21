var scene, camera, renderer, controls;

function URLParams(name) {
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
    var r = window.location.search.substr(1).match(reg);
    if (r != null)
        return unescape(r[2]);
    return null;
}

var user = URLParams("user") || "ezshine";
var year = URLParams("year") || 2023;

function mathRandom(num = 8) {
    var numValue = - Math.random() * num + Math.random() * num;
    return numValue;
};


function init() {

    scene = new THREE.Scene();

    var setcolor = 0xDB2099;

    scene.background = new THREE.Color(setcolor);
    scene.fog = new THREE.Fog(setcolor, .1, 5);

    camera = new THREE.PerspectiveCamera(75, document.body.clientWidth / document.body.clientHeight, 0.01, 1000);
    camera.position.set(-3, 0, 0);

    renderer = new THREE.WebGLRenderer({
        antialias: false
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(document.body.clientWidth, document.body.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    document.getElementById("container").appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.autoRotate = true;
    controls.autoRotateSpeed = .2;
    controls.maxZoom = 2;
    controls.minZoom = 1;
    controls.maxDistance = 4;
    controls.maxPolarAngle = Math.PI / 2;

    // createSkyBox();

    addLight();

    createFloor();

    loop();

    getArticleByThisYear((res) => {
        buildCity(res);
    });
}
function buildCity(data) {
    console.log(data);
    $("#userName").text(user + "'s");
    $("#dataYear").text(year);

    for (var i = 0; i < 12; i++) {
        var mothlyData = data[i];

        var monthWidth = 1;
        var monthPadding = 0.1;

        //grid布局算法
        var sx = Math.floor(i % 4) * (monthWidth + monthPadding) - (monthWidth * 4 / 2)
        var sy = Math.floor(i / 4) * (monthWidth * 0.7 + monthPadding) - (monthWidth * 3 / 2)

        if (!mothlyData) continue;

        var articleCount = Math.min(mothlyData.length, 31);

        var bpadding = 0.05;


        var xNum = 7;
        var bwidth = 1 / 7;

        for (var j = 0; j < articleCount; j++) {

            var bSize = {
                w: bwidth - bpadding,
                h: bwidth - bpadding
            }

            var item = mothlyData[j];

            var bx = sx + Math.floor(j % xNum) * bwidth;
            var by = sy + Math.floor(j / xNum) * bwidth;

            createBuilding(bx, by, bSize, item.count);
        }
    }

    var gmaterial = new THREE.MeshToonMaterial({ color: 0xFFFF00, side: THREE.DoubleSide });
    var gparticular = new THREE.CircleGeometry(0.01, 3);
    var aparticular = 5;

    for (var h = 1; h < 300; h++) {
        var particular = new THREE.Mesh(gparticular, gmaterial);
        particular.position.set(mathRandom(aparticular), mathRandom(aparticular), mathRandom(aparticular));
        particular.rotation.set(mathRandom(), mathRandom(), mathRandom());
        scene.add(particular);
    };

    generateLines();
}

function generateTextureCanvas(w = 32, h = 64) {
    var canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    var context = canvas.getContext('2d');
    // plain it in white
    context.fillStyle = '#111111';
    context.fillRect(0, 0, canvas.width, canvas.height);
    // draw the window rows - with a small noise to simulate light variations in each room
    for (var y = 2; y < canvas.height; y += 2) {
        for (var x = 0; x < canvas.width; x += 2) {
            var value = Math.random() > .5 ? 10 : (Math.random() * 128 + 128);
            context.fillStyle = 'rgb(' + [Math.random() * value, Math.random() * value, Math.random() * value].join(',') + ')';
            context.fillRect(x, y, 2, 1);
        }
    }

    return canvas;
}

function createBuilding(x, y, size, height) {
    let rHeight = height / 40;
    if (rHeight < 1) rHeight += (1 - rHeight) * .2;

    const buildingType = ['box'][Math.floor(Math.random() * 1)];

    let geometry;
    if (buildingType == "cylinder") {
        geometry = new THREE.CylinderGeometry(Math.random() * (size.w / 2), size.w / 2, rHeight, 32, 1)
    } else {
        geometry = new THREE.BoxGeometry(size.w, rHeight, size.h);
    }

    var texture = new THREE.Texture(generateTextureCanvas(size.w * 200, rHeight * 200));
    texture.needsUpdate = true;

    const material = new THREE.MeshLambertMaterial({ map: texture, vertexColors: THREE.VertexColors });
    material.roughness = 0.3;
    material.metalness = 1;
    material.shading = THREE.SmoothShading;
    const cmaterial = new THREE.MeshPhongMaterial({ color: "#000000" });
    const cube = new THREE.Mesh(geometry, [material, material, cmaterial, cmaterial, material, material]);
    cube.position.set(x, rHeight / 2 - .29, y);
    cube.castShadow = true;
    cube.receiveShadow = true;
    scene.add(cube);
}
function createFloor() {

    var geometry = new THREE.PlaneGeometry(15, 15);
    var material = new THREE.MeshPhongMaterial({ color: 0x000000 });
    var plane = new THREE.Mesh(geometry, material);
    plane.rotateX(-Math.PI / 2);
    plane.receiveShadow = true;
    plane.position.set(0, -.3, 0);
    scene.add(plane);
}
function addLight() {
    var ambientLight = new THREE.AmbientLight(0xFFFFFF, 1);
    scene.add(ambientLight);

    var light = new THREE.HemisphereLight(0xfffff0, 0x101020, 1.25);
    light.position.set(0.75, 1, 0.25);
    scene.add(light);
}
function loop() {
    requestAnimationFrame(loop);

    controls.update();

    renderer.render(scene, camera);
}

var createCarPos = true;
var createCars = function (cScale = 2, cPos = 20, cColor = 0xFFFF00) {
    var cMat = new THREE.MeshToonMaterial({ color: cColor, side: THREE.DoubleSide });
    var cGeo = new THREE.BoxGeometry(1, cScale / 40, cScale / 40);
    var cElem = new THREE.Mesh(cGeo, cMat);
    var cAmp = 3;

    if (createCarPos) {
        createCarPos = false;
        cElem.position.x = -cPos;
        cElem.position.z = (mathRandom(cAmp));

        TweenMax.to(cElem.position, 3, { x: cPos, repeat: -1, yoyo: true, delay: mathRandom(3) });
    } else {
        createCarPos = true;
        cElem.position.x = (mathRandom(cAmp));
        cElem.position.z = -cPos;
        cElem.rotation.y = 90 * Math.PI / 180;

        TweenMax.to(cElem.position, 5, { z: cPos, repeat: -1, yoyo: true, delay: mathRandom(3), ease: Power1.easeInOut });
    };
    cElem.receiveShadow = true;
    cElem.castShadow = true;
    cElem.position.y = -Math.abs(mathRandom(3));
    scene.add(cElem);
};

var generateLines = function () {
    for (var i = 0; i < 60; i++) {
        createCars(0.1, 20);
    };
};
async function getArticleByThisYear(cb) {
    // const res= await fetch('./2023.json');
    const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent('https://skyline.github.com/' + user + '/' + year + '.json')}`, {
        cache: "force-cache"
    });

    const jsonData = await res.json();

    const contributions = JSON.parse(jsonData.contents).contributions;

    let finalData = {};
    for (let i = 0; i < contributions.length; i++) {
        const weekData = contributions[i];

        for (let j = 0; j < weekData.days.length; j++) {
            var dayData = weekData.days[j];
            var date = new Date(year, 0);
            date.setDate(i * 7 + (j + 1));

            if (!finalData[date.getMonth()]) finalData[date.getMonth()] = [];
            finalData[date.getMonth()].push({
                count: dayData.count
            })
        }
    }

    cb(finalData)
}

$(function () {
    init();
});