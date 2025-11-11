// Основные переменные Three.js
let scene, camera, renderer, controls;
let reactorGroup, plasma, solenoid, toroidalCoils, poloidalCoils, vessel, particles, fieldLines;
let plasmaAnimation = true;
let showParticles = true;
let showFieldLines = false;

// Параметры реактора
let reactorParams = {
    powerLevel: 78,
    temperature: 150,
    magneticField: 12.5,
    fuelConcentration: 85,
    injectionRate: 50,
    heatingPower: 78,
    plasmaDensity: 5.2,
    qFactor: 1.25,
    neutronFlux: 2.4,
    vacuumPressure: 1.2
};

// Инициализация сцены
function init() {
    // Создание сцены
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000011);
    scene.fog = new THREE.Fog(0x000022, 50, 150);

    // Создание камеры
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 10, 25);

    // Создание рендерера
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.getElementById('reactorContainer').appendChild(renderer.domElement);

    // Добавление контролов для управления камерой
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 10;
    controls.maxDistance = 50;
    controls.maxPolarAngle = Math.PI / 2;

    // Добавление освещения
    const ambientLight = new THREE.AmbientLight(0x404060, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 20, 15);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0xff3333, 2, 100);
    pointLight.position.set(0, 0, 0);
    scene.add(pointLight);

    const blueLight = new THREE.PointLight(0x00aaff, 1, 100);
    blueLight.position.set(0, 5, 0);
    scene.add(blueLight);

    // Создание группы для реактора
    reactorGroup = new THREE.Group();
    scene.add(reactorGroup);

    // Создание компонентов реактора
    createReactorComponents();

    // Создание частиц
    createParticles();

    // Создание силовых линий магнитного поля
    createFieldLines();

    // Скрытие экрана загрузки
    setTimeout(() => {
        document.getElementById('loading').style.opacity = 0;
        setTimeout(() => {
            document.getElementById('loading').style.display = 'none';
        }, 500);
    }, 2000);

    // Обработка изменения размера окна
    window.addEventListener('resize', onWindowResize);

    // Инициализация обработчиков событий
    initEventListeners();

    // Обновление UI
    fusionCore.updateUI();

    // Запуск анимации
    animate();
}

// Создание компонентов реактора
function createReactorComponents() {
    // Центральный соленоид
    const solenoidGeometry = new THREE.CylinderGeometry(1.5, 1.5, 12, 32);
    const solenoidMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xaaaaaa,
        emissive: 0x333333,
        transparent: true,
        opacity: 0.9
    });
    solenoid = new THREE.Mesh(solenoidGeometry, solenoidMaterial);
    reactorGroup.add(solenoid);

    // Тороидальные катушки (8 штук)
    toroidalCoils = new THREE.Group();
    const toroidalCoilGeometry = new THREE.TorusGeometry(8, 0.8, 16, 100);
    const toroidalCoilMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x0066ff,
        emissive: 0x003399,
        transparent: true,
        opacity: 0.8
    });
    
    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const coil = new THREE.Mesh(toroidalCoilGeometry, toroidalCoilMaterial);
        coil.position.x = Math.cos(angle) * 0.1;
        coil.position.y = Math.sin(angle) * 0.1;
        coil.rotation.x = Math.PI / 2;
        coil.rotation.z = angle;
        toroidalCoils.add(coil);
    }
    reactorGroup.add(toroidalCoils);

    // Полоидальные катушки (6 штук)
    poloidalCoils = new THREE.Group();
    const poloidalCoilGeometry = new THREE.TorusGeometry(10, 0.4, 16, 100);
    const poloidalCoilMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x00cc66,
        emissive: 0x009933,
        transparent: true,
        opacity: 0.8
    });
    
    for (let i = 0; i < 6; i++) {
        const coil = new THREE.Mesh(poloidalCoilGeometry, poloidalCoilMaterial);
        coil.rotation.x = Math.PI / 2;
        coil.position.y = -6 + i * 2.4;
        poloidalCoils.add(coil);
    }
    reactorGroup.add(poloidalCoils);

    // Плазменный тор
    const plasmaGeometry = new THREE.TorusGeometry(6, 0.6, 32, 100);
    const plasmaMaterial = new THREE.MeshPhongMaterial({
        color: 0xff3333,
        emissive: 0xff0000,
        transparent: true,
        opacity: 0.7
    });
    plasma = new THREE.Mesh(plasmaGeometry, plasmaMaterial);
    plasma.rotation.x = Math.PI / 2;
    reactorGroup.add(plasma);

    // Вакуумная камера
    const vesselGeometry = new THREE.TorusGeometry(6, 1.2, 32, 100);
    const vesselMaterial = new THREE.MeshPhongMaterial({
        color: 0xffff00,
        wireframe: true,
        transparent: true,
        opacity: 0.3
    });
    vessel = new THREE.Mesh(vesselGeometry, vesselMaterial);
    vessel.rotation.x = Math.PI / 2;
    reactorGroup.add(vessel);

    // Дивертор (упрощенная модель)
    const divertorGeometry = new THREE.ConeGeometry(3, 2, 32);
    const divertorMaterial = new THREE.MeshPhongMaterial({
        color: 0xcc33ff,
        transparent: true,
        opacity: 0.7
    });
    const divertor = new THREE.Mesh(divertorGeometry, divertorMaterial);
    divertor.position.y = -6;
    divertor.rotation.x = Math.PI;
    reactorGroup.add(divertor);

    // Добавление опорной конструкции
    const supportGeometry = new THREE.CylinderGeometry(10, 10, 1, 32);
    const supportMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x333355,
        emissive: 0x111133
    });
    const support = new THREE.Mesh(supportGeometry, supportMaterial);
    support.position.y = -7;
    reactorGroup.add(support);
}

// Создание частиц для эффекта плазмы
function createParticles() {
    const particleCount = 500;
    const particlesGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount * 3; i += 3) {
        // Распределение частиц в торе
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI * 2;
        const radius = 6 + Math.random() * 0.6;
        
        positions[i] = radius * Math.cos(theta);
        positions[i + 1] = radius * Math.sin(phi) * 0.2;
        positions[i + 2] = radius * Math.sin(theta);
        
        // Цвета от красного к синему
        colors[i] = 1.0;     // R
        colors[i + 1] = Math.random() * 0.5; // G
        colors[i + 2] = Math.random() * 0.5; // B
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const particleMaterial = new THREE.PointsMaterial({
        size: 0.1,
        vertexColors: true,
        transparent: true,
        opacity: 0.8
    });
    
    particles = new THREE.Points(particlesGeometry, particleMaterial);
    reactorGroup.add(particles);
}

// Создание силовых линий магнитного поля
function createFieldLines() {
    const fieldLinesGeometry = new THREE.BufferGeometry();
    const positions = [];
    const colors = [];
    
    // Создаем силовые линии магнитного поля
    for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const radius = 8;
        
        for (let j = 0; j < 100; j++) {
            const t = j / 100;
            const theta = t * Math.PI * 2;
            
            const x = radius * Math.cos(theta) * Math.cos(angle);
            const y = radius * Math.sin(theta) * 0.3;
            const z = radius * Math.cos(theta) * Math.sin(angle);
            
            positions.push(x, y, z);
            
            // Цвет от синего к голубому
            colors.push(0.2, 0.5, 1.0);
        }
    }
    
    fieldLinesGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    fieldLinesGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    
    const fieldLinesMaterial = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.4,
        linewidth: 1
    });
    
    fieldLines = new THREE.Line(fieldLinesGeometry, fieldLinesMaterial);
    fieldLines.visible = false;
    reactorGroup.add(fieldLines);
}

// Анимация
function animate() {
    requestAnimationFrame(animate);
    controls.update();

    // Анимация плазмы
    if (plasmaAnimation) {
        const time = Date.now() * 0.001;
        plasma.scale.setScalar(1 + 0.05 * Math.sin(time * 3));
        plasma.material.emissiveIntensity = 0.5 + 0.5 * Math.sin(time * 2);
        
        // Анимация частиц
        if (showParticles && particles) {
            const positions = particles.geometry.attributes.position.array;
            
            for (let i = 0; i < positions.length; i += 3) {
                positions[i + 1] += (Math.random() - 0.5) * 0.05;
            }
            
            particles.geometry.attributes.position.needsUpdate = true;
        }
    }

    // Вращение тороидальных катушек
    toroidalCoils.rotation.y += 0.002;

    renderer.render(scene, camera);
}

// Обработка изменения размера окна
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Инициализация обработчиков событий
function initEventListeners() {
    // Кнопки управления
    document.getElementById('ignitePlasmaBtn').addEventListener('click', fusionCore.ignitePlasma);
    document.getElementById('stabilizeFieldBtn').addEventListener('click', fusionCore.stabilizeField);
    document.getElementById('injectFuelBtn').addEventListener('click', fusionCore.injectFuel);
    document.getElementById('boostPowerBtn').addEventListener('click', fusionCore.boostPower);
    document.getElementById('optimizeBtn').addEventListener('click', fusionCore.optimize);
    document.getElementById('emergencyStopBtn').addEventListener('click', fusionCore.emergencyStop);
    
    // Слайдеры
    document.getElementById('heatingPowerSlider').addEventListener('input', function() {
        reactorParams.heatingPower = parseInt(this.value);
        reactorParams.powerLevel = reactorParams.heatingPower;
        fusionCore.updateUI();
        fusionCore.updateFromSliders();
    });
    
    document.getElementById('fieldStrengthSlider').addEventListener('input', function() {
        reactorParams.magneticField = parseFloat(this.value);
        fusionCore.updateUI();
        fusionCore.updateFromSliders();
    });
    
    document.getElementById('plasmaTempSlider').addEventListener('input', function() {
        reactorParams.temperature = parseInt(this.value);
        fusionCore.updateUI();
        fusionCore.updateFromSliders();
    });
    
    document.getElementById('fuelConcentrationSlider').addEventListener('input', function() {
        reactorParams.fuelConcentration = parseInt(this.value);
        fusionCore.updateUI();
        fusionCore.updateFromSliders();
    });
    
    document.getElementById('injectionRateSlider').addEventListener('input', function() {
        reactorParams.injectionRate = parseInt(this.value);
        fusionCore.updateUI();
        fusionCore.updateFromSliders();
    });
    
    // Переключатели
    document.getElementById('plasmaAnimationToggle').addEventListener('change', function() {
        plasmaAnimation = this.checked;
    });
    
    document.getElementById('particlesToggle').addEventListener('change', function() {
        showParticles = this.checked;
        particles.visible = showParticles;
    });
    
    document.getElementById('fieldLinesToggle').addEventListener('change', function() {
        showFieldLines = this.checked;
        if (fieldLines) {
            fieldLines.visible = showFieldLines;
        }
    });
}

// Функционал управления реактором
const fusionCore = {
    ignitePlasma: function() {
        plasmaAnimation = true;
        reactorParams.powerLevel = Math.min(100, reactorParams.powerLevel + 10);
        reactorParams.temperature = Math.min(250, reactorParams.temperature + 20);
        this.updateUI();
        
        // Визуальный эффект
        plasma.material.emissive.setHex(0xff0000);
        setTimeout(() => {
            plasma.material.emissive.setHex(0xff3333);
        }, 500);
    },
    
    stabilizeField: function() {
        reactorParams.magneticField = Math.min(20, reactorParams.magneticField + 0.5);
        this.updateUI();
        
        // Визуальный эффект
        toroidalCoils.children.forEach(coil => {
            coil.material.emissive.setHex(0x0066ff);
            setTimeout(() => {
                coil.material.emissive.setHex(0x003399);
            }, 500);
        });
    },
    
    injectFuel: function() {
        reactorParams.fuelConcentration = Math.min(100, reactorParams.fuelConcentration + 10);
        reactorParams.powerLevel = Math.min(100, reactorParams.powerLevel + 5);
        this.updateUI();
        
        // Визуальный эффект
        if (particles) {
            particles.material.size = 0.15;
            setTimeout(() => {
                particles.material.size = 0.1;
            }, 1000);
        }
    },
    
    boostPower: function() {
        reactorParams.powerLevel = Math.min(100, reactorParams.powerLevel + 15);
        reactorParams.temperature = Math.min(250, reactorParams.temperature + 30);
        reactorParams.magneticField = Math.min(20, reactorParams.magneticField + 1);
        this.updateUI();
        
        // Визуальный эффект
        plasma.material.emissiveIntensity = 2;
        setTimeout(() => {
            plasma.material.emissiveIntensity = 1;
        }, 1000);
    },
    
    optimize: function() {
        // Автоматическая оптимизация параметров
        reactorParams.powerLevel = 85;
        reactorParams.temperature = 165;
        reactorParams.magneticField = 14.2;
        reactorParams.fuelConcentration = 92;
        reactorParams.injectionRate = 65;
        reactorParams.heatingPower = 85;
        reactorParams.qFactor = 1.42;
        reactorParams.plasmaDensity = 5.8;
        
        this.updateUI();
        this.updateSliders();
        
        // Визуальный эффект
        poloidalCoils.children.forEach(coil => {
            coil.material.emissive.setHex(0x00ff88);
            setTimeout(() => {
                coil.material.emissive.setHex(0x009933);
            }, 1000);
        });
    },
    
    emergencyStop: function() {
        plasmaAnimation = false;
        reactorParams.powerLevel = 0;
        reactorParams.temperature = 50;
        reactorParams.magneticField = 0;
        reactorParams.heatingPower = 0;
        this.updateUI();
        this.updateSliders();
        
        // Визуальный эффект
        plasma.material.emissive.setHex(0x330000);
        document.getElementById('warningMessage').style.color = '#ff3333';
        document.getElementById('warningMessage').textContent = '⚠️ АВАРИЙНАЯ ОСТАНОВКА: РЕАКТОР ОХЛАЖДАЕТСЯ';
    },
    
    updateFromSliders: function() {
        // Обновление визуальных эффектов на основе слайдеров
        plasma.material.emissiveIntensity = reactorParams.powerLevel / 100;
        
        // Обновление интенсивности свечения катушек
        const fieldIntensity = reactorParams.magneticField / 20;
        toroidalCoils.children.forEach(coil => {
            coil.material.emissiveIntensity = fieldIntensity;
        });
    },
    
    updateSliders: function() {
        // Обновление позиций слайдеров
        document.getElementById('heatingPowerSlider').value = reactorParams.heatingPower;
        document.getElementById('fieldStrengthSlider').value = reactorParams.magneticField;
        document.getElementById('plasmaTempSlider').value = reactorParams.temperature;
        document.getElementById('fuelConcentrationSlider').value = reactorParams.fuelConcentration;
        document.getElementById('injectionRateSlider').value = reactorParams.injectionRate;
        
        // Обновление отображаемых значений
        this.updateUI();
    },
    
    updateUI: function() {
        // Основные параметры
        document.getElementById('powerLevel').textContent = reactorParams.powerLevel + '%';
        document.getElementById('temperatureValue').textContent = reactorParams.temperature + 'М';
        document.getElementById('magneticField').textContent = reactorParams.magneticField.toFixed(1) + 'Т';
        document.getElementById('qFactor').textContent = reactorParams.qFactor.toFixed(2);
        document.getElementById('plasmaDensity').textContent = reactorParams.plasmaDensity.toFixed(1) + 'e20';
        
        // Индикаторы
        document.getElementById('energyOutput').textContent = Math.round(reactorParams.powerLevel * 0.8) + '%';
        document.getElementById('plasmaPressure').textContent = Math.round(reactorParams.powerLevel * 0.5) + '%';
        document.getElementById('currentInduction').textContent = Math.round(reactorParams.powerLevel * 0.78) + '%';
        document.getElementById('energyBar').style.width = (reactorParams.powerLevel * 0.8) + '%';
        
        // Расширенные настройки
        document.getElementById('heatingPowerValue').textContent = reactorParams.heatingPower;
        document.getElementById('fieldStrengthValue').textContent = reactorParams.magneticField.toFixed(1);
        document.getElementById('plasmaTempValue').textContent = reactorParams.temperature;
        document.getElementById('fuelConcentrationValue').textContent = reactorParams.fuelConcentration;
        document.getElementById('injectionRateValue').textContent = reactorParams.injectionRate;
        
        document.getElementById('heatingPowerDisplay').textContent = reactorParams.heatingPower + '%';
        document.getElementById('fieldStrengthDisplay').textContent = reactorParams.magneticField.toFixed(1) + 'Т';
        document.getElementById('plasmaTempDisplay').textContent = reactorParams.temperature + 'М';
        document.getElementById('fuelConcentrationDisplay').textContent = reactorParams.fuelConcentration + '%';
        document.getElementById('injectionRateDisplay').textContent = reactorParams.injectionRate + '%';
        
        // Статусы
        document.getElementById('fuelStatus').textContent = reactorParams.fuelConcentration + '%';
        document.getElementById('vacuumStatus').textContent = reactorParams.vacuumPressure.toFixed(1) + 'e-5 Па';
        document.getElementById('neutronFlux').textContent = reactorParams.neutronFlux.toFixed(1) + 'e18';
        
        // Обновление стабильности
        const stability = 100 - (reactorParams.temperature - 100) / 2;
        document.getElementById('stability').textContent = Math.max(0, Math.min(100, Math.round(stability))) + '%';
        
        // Обновление статусов
        if (reactorParams.powerLevel > 90) {
            document.getElementById('coolingStatus').textContent = 'ПЕРЕГРУЗКА';
            document.getElementById('coolingStatus').style.color = '#ff3333';
        } else if (reactorParams.powerLevel > 70) {
            document.getElementById('coolingStatus').textContent = 'ВЫСОКАЯ';
            document.getElementById('coolingStatus').style.color = '#ffaa00';
        } else {
            document.getElementById('coolingStatus').textContent = 'НОРМА';
            document.getElementById('coolingStatus').style.color = '#00aaff';
        }
        
        if (reactorParams.powerLevel < 10) {
            document.getElementById('tokamakStatus').textContent = 'НЕАКТИВЕН';
            document.getElementById('tokamakStatus').style.color = '#ff3333';
        } else {
            document.getElementById('tokamakStatus').textContent = 'АКТИВЕН';
            document.getElementById('tokamakStatus').style.color = '#00aaff';
        }
        
        // Обновление коэффициента Q (энергетическая эффективность)
        reactorParams.qFactor = 0.5 + (reactorParams.temperature * reactorParams.plasmaDensity) / 1000;
        document.getElementById('qFactor').textContent = reactorParams.qFactor.toFixed(2);
        
        // Обновление плотности плазмы на основе параметров
        reactorParams.plasmaDensity = 3 + (reactorParams.powerLevel * reactorParams.fuelConcentration) / 500;
        document.getElementById('plasmaDensity').textContent = reactorParams.plasmaDensity.toFixed(1) + 'e20';
        
        // Обновление потока нейтронов
        reactorParams.neutronFlux = 1.0 + (reactorParams.powerLevel * reactorParams.temperature) / 200;
        document.getElementById('neutronFlux').textContent = reactorParams.neutronFlux.toFixed(1) + 'e18';
    }
};

// Инициализация при загрузке страницы
window.onload = init;