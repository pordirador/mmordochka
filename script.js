// Словарь точек для ручной расстановки
const MANUAL_POINTS = {
    "Нижняя середина подбородка (152)": 152,
    "Верхняя середина подбородка(18)": 18,
    "Левый гонион": 58,
    "Правый гонион": 288,
    "Правая скула (356)": 356,
    "Левая скула (34)": 34,
    "Внутренний край левого глаза (243)": 243,
    "Внешний край левого глаза (7)": 7,
    "Левый зрачок (468)": 468,
    "Левая середина глаза верх (158)": 158,
    "Левая середина глаза низ (145)": 145,
    "Межбровье (8)": 8,
    "Внутренний угол правого глаза (382)": 382,
    "Правый зрачок (473)": 473,
    "Внешний угол правого глаза (359)": 359,
    "Середина низ правого глаза (374)": 374,
    "Середина верх правого глаза(386)": 386,
    "Середина контура верхней губы (0)": 0,
    "вершина лба (граница с волосами)(10)": 10,
    "точка под носом (168)": 168,
    "Левый нижний угол подбородка": 172,
    "Правый нижний угол подбородка": 397,
    "Левый край крыла носа": 49,
    "Правый край крыла носа": 279,
    "Левый уголок губы": 61,
    "Правый уголок губы": 291,
    "Левая челюсть до гониона": 400,
    "Правая челюсть до гониона": 401
};

class FaceAnalyzer {
    constructor() {
        this.canvas = document.getElementById('faceCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.image = null;
        this.points = {};
        this.currentPointName = null;
        this.selectedPointElement = null;
        this.landmarks = {};
        this.currentImageHeight = 0;
        this.currentImageWidth = 0;
        this.metricResults = [];
        this.currentMetricIndex = 0;
        this.totalScore = 0;
        this.maxScore = 0;
        this.gender = 'male';
        this.scale = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        
        this.initMetrics();
        this.initEventListeners();
        this.createPointsList();
    }
    
    initMetrics() {
        this.metrics = {
            eye_separation_ratio: {
                points: [468, 473, 34, 356],
                calculate: this.calcInterpupillaryToFaceWidth,
                ranges: {
                    male: [[44.3, 47.7, 3.0], [43.6, 48.4, 17.5], [43.1, 48.9, 8.7], [42.6, 49.4, 4.3], [42.5, 50.0, 0], [41.5, 51.0, 4.3], [35.5, 58.0, 0]],
                    female: [[45.7, 47.9, 3.0], [44.3, 48.6, 17.5], [43.8, 49.1, 8.7], [43.3, 49.6, 4.3], [42.7, 50.2, 0], [42.5, 51.0, 4.3], [35.5, 58.0, 0]]
                },
                description: "Соотношение расстояния между зрачками к ширине лица (%)",
                unit: "%"
            },
            facial_thirds: {
                points: [10, 8, 168, 152],
                calculate: this.calcFacialThirds,
                ranges: {
                    male: [[29.5, 36.5, 3.0], [28.3, 38.3, 15.0], [26.5, 39.5, 7.5], [25.4, 41.0, 3.75], [23.5, 42.5, 0], [22.5, 43.5, 7.5], [18.5, 50.0, 0]],
                    female: [[30.3, 36.0, 3.0], [29.5, 37.5, 15.0], [27.3, 39.0, 7.5], [25.4, 41.0, 3.75], [24.4, 42.0, 0], [23.4, 43.0, 7.5], [18.5, 50.0, 0]]
                },
                description: "Пропорции третей лица (верхняя, средняя, нижняя)",
                unit: "%"
            },
            lateral_canthal_tilt: {
                points: [7, 359, 243, 382],
                calculate: this.calcLateralCanthalTilt,
                ranges: {
                    male: [[5.2, 8.5, 2.5], [4.9, 7.0, 12.5], [3.0, 10.7, 6.25], [0.13, 7.0, 3.125], [-2.15, 7.0, 0], [-4.17, 7.0, 5], [-10.25, 7.0, 0]],
                    female: [[6.9, 6.6, 2.5], [4.8, 10.8, 12.5], [3.6, 12.0, 6.25], [1.5, 14.1, 3.125], [0.15, 6.6, 0], [-3.18, 6.6, 5], [-10.25, 6.6, 0]]
                },
                description: "Угол наклона глаз (Lateral Canthal Tilt)",
                unit: "°"
            },
            fwhr: {
                points: [34, 356, 8, 0],
                calculate: this.calcFwhr,
                ranges: {
                    male: [[1.9, 2.06, 2.5], [1.85, 2.11, 12.5], [1.8, 2.16, 6.25], [1.75, 2.21, 3.125], [1.7, 2.26, 0], [1.66, 2.3, 5], [1.3, 2.8, 0]],
                    female: [[1.9, 2.06, 2.5], [1.85, 2.11, 12.5], [1.8, 2.16, 6.25], [1.75, 2.21, 3.125], [1.7, 2.26, 0], [1.66, 2.3, 5], [1.3, 2.8, 0]]
                },
                description: "FWHR - соотношение ширины лица к высоте",
                unit: ""
            },
            jaw_frontal_angle: {
                points: [400, 172, 401, 397],
                calculate: this.calcJawAngle,
                ranges: {
                    male: [[84.5, 95, 2.5], [80.5, 99, 12.5], [76.5, 103, 6.25], [72.5, 107, 3.125], [69.5, 110, 0], [66.5, 113, 5], [40, 150, 0]],
                    female: [[86, 97, 2.5], [82.5, 100.5, 12.5], [79, 104, 6.25], [75.5, 107.5, 3.125], [72, 111, 0], [69, 114, 5], [40, 150, 0]]
                },
                description: "Угол челюсти (Jaw Frontal Angle)",
                unit: "°"
            },
            cheekbone_height: {
                points: [468, 473, 34, 356, 0],
                calculate: this.calcCheekHeightRatio,
                ranges: {
                    male: [[0.81, 1.00, 2.5], [0.76, 0.81, 12.5], [0.70, 0.76, 6.25], [0.65, 0.70, 3.125], [0.60, 0.65, 0], [0.55, 0.60, 5], [0.10, 0.55, 0]],
                    female: [[0.83, 1.00, 2.5], [0.79, 0.83, 12.5], [0.73, 0.79, 6.25], [0.68, 0.73, 3.125], [0.63, 0.68, 0], [0.58, 0.63, 5], [0.10, 0.58, 0]]
                },
                description: "Высота скул (Cheekbone Height)",
                unit: "%"
            },
            face_aspect_ratio: {
                points: [10, 152, 34, 356],
                calculate: this.calcFaceAspectRatio,
                ranges: {
                    male: [[1.33, 1.38, 1.5], [1.30, 1.41, 7.5], [1.26, 1.45, 3.75], [1.23, 1.48, 0], [1.20, 1.51, 3.75], [1.18, 1.53, 0], [1.0, 1.7, 3.75]],
                    female: [[1.29, 1.35, 1.5], [1.26, 1.38, 7.5], [1.22, 1.42, 3.75], [1.19, 1.45, 0], [1.17, 1.47, 3.75], [1.15, 1.49, 0], [1.0, 1.7, 3.75]]
                },
                description: "Соотношение длины лица к ширине (Total facial height-to-width ratio)",
                unit: ""
            },
            bigonial_width: {
                points: [58, 288, 34, 356],
                calculate: this.calcJawWidthToFace,
                ranges: {
                    male: [[0.85, 0.92, 1.5], [0.83, 0.94, 7.5], [0.80, 0.95, 3.75], [0.77, 1.00, 1.88], [0.75, 1.025, 0], [0.70, 1.05, 3.75], [0.50, 1.20, 0]],
                    female: [[0.81, 0.885, 1.5], [0.79, 0.905, 7.5], [0.76, 0.935, 3.75], [0.73, 0.965, 1.88], [0.70, 0.955, 0], [0.69, 1.02, 3.75], [0.50, 1.20, 0]]
                },
                description: "Ширина челюсти (Bigonial width) к ширине лица",
                unit: ""
            },
            chin_philtrum_ratio: {
                points: [152, 18, 0, 168],
                calculate: this.calcChinPhiltrumRatio,
                ranges: {
                    male: [[2.05, 2.55, 1.5], [1.87, 2.73, 6.25], [1.75, 2.85, 3.125], [1.55, 3.20, 1.5], [1.20, 3.55, 1.5], [1.00, 3.85, 3.125], [0.10, 5.00, 0]],
                    female: [[2.00, 2.50, 1.5], [1.85, 2.65, 6.25], [1.70, 2.80, 3.125], [1.50, 3.15, 1.5], [1.20, 3.50, 1.5], [1.00, 3.80, 3.125], [0.10, 5.00, 0]]
                },
                description: "Чин-ту фильтрум (Chin to Philtrum Ratio)",
                unit: ""
            }
        };
    }
    
    initEventListeners() {
        document.getElementById('loadImageBtn').addEventListener('click', () => {
            document.getElementById('imageInput').click();
        });
        
        document.getElementById('imageInput').addEventListener('change', (e) => {
            this.loadImage(e.target.files[0]);
        });
        
        document.getElementById('genderSelect').addEventListener('change', (e) => {
            this.gender = e.target.value;
            if (this.metricResults.length > 0) {
                this.analyzeFace();
            }
        });
        
        document.getElementById('clearPointsBtn').addEventListener('click', () => {
            this.clearAllPoints();
        });
        
        document.getElementById('analyzeBtn').addEventListener('click', () => {
            this.analyzeManualPoints();
        });
        
        document.getElementById('prevMetricBtn').addEventListener('click', () => {
            this.showPrevMetric();
        });
        
        document.getElementById('nextMetricBtn').addEventListener('click', () => {
            this.showNextMetric();
        });
        
        this.canvas.addEventListener('click', (e) => {
            if (this.currentPointName && this.image) {
                const rect = this.canvas.getBoundingClientRect();
                const x = (e.clientX - rect.left) / this.scale - this.offsetX;
                const y = (e.clientY - rect.top) / this.scale - this.offsetY;
                this.addPoint(x, y, this.currentPointName);
            }
        });
    }
    
    createPointsList() {
        const pointsList = document.getElementById('pointsList');
        pointsList.innerHTML = '';
        
        Object.keys(MANUAL_POINTS).forEach(pointName => {
            const div = document.createElement('div');
            div.className = 'point-item';
            div.textContent = `○ ${pointName}`;
            div.addEventListener('click', () => {
                this.selectPoint(pointName, div);
            });
            pointsList.appendChild(div);
        });
    }
    
    selectPoint(pointName, element) {
        // Снимаем выделение с предыдущего элемента
        if (this.selectedPointElement) {
            this.selectedPointElement.classList.remove('selected');
        }
        
        this.currentPointName = pointName;
        this.selectedPointElement = element;
        element.classList.add('selected');
        
        document.getElementById('metricName').textContent = `Поставьте точку: ${pointName}`;
        this.showInstruction(`Кликните на фото, чтобы поставить точку: ${pointName}`);
    }
    
    addPoint(x, y, pointName) {
        this.points[pointName] = { x, y };
        
        // Обновляем список точек
        const pointItems = document.querySelectorAll('.point-item');
        pointItems.forEach(item => {
            if (item.textContent.includes(pointName)) {
                item.classList.add('completed');
                item.textContent = `✓ ${pointName}`;
            }
        });
        
        // Обновляем статистику
        const pointsCount = Object.keys(this.points).length;
        document.getElementById('statsLabel').textContent = `Поставлено точек: ${pointsCount}/${Object.keys(MANUAL_POINTS).length}`;
        
        // Активируем кнопку анализа если точек достаточно
        document.getElementById('analyzeBtn').disabled = pointsCount < 15;
        
        // Перерисовываем
        this.drawAllPoints();
        
        // Выбираем следующую непоставленную точку
        this.selectNextUnsetPoint();
    }
    
    selectNextUnsetPoint() {
        const allPoints = Object.keys(MANUAL_POINTS);
        const setPoints = Object.keys(this.points);
        const unsetPoints = allPoints.filter(p => !setPoints.includes(p));
        
        if (unsetPoints.length > 0) {
            const nextPoint = unsetPoints[0];
            const nextElement = Array.from(document.querySelectorAll('.point-item'))
                .find(el => el.textContent.includes(nextPoint));
            if (nextElement) {
                this.selectPoint(nextPoint, nextElement);
            }
        } else {
            this.currentPointName = null;
            document.getElementById('metricName').textContent = '✓ Все точки поставлены! Нажмите "Анализировать"';
            this.hideInstruction();
        }
    }
    
    drawAllPoints() {
        if (!this.image) return;
        
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.drawImage(this.image, 0, 0, this.canvas.width, this.canvas.height);
        
        Object.entries(this.points).forEach(([name, point]) => {
            const isCurrent = name === this.currentPointName;
            const color = isCurrent ? '#ff0000' : '#0064ff';
            
            // Рисуем точку
            ctx.beginPath();
            ctx.arc(point.x, point.y, 6, 0, 2 * Math.PI);
            ctx.fillStyle = color;
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Рисуем номер точки
            const pointNumber = MANUAL_POINTS[name] || '?';
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 10px Arial';
            ctx.fillText(pointNumber, point.x - 4, point.y - 10);
        });
    }
    
    clearAllPoints() {
        this.points = {};
        this.metricResults = [];
        this.currentPointName = null;
        
        // Сбрасываем список точек
        const pointItems = document.querySelectorAll('.point-item');
        pointItems.forEach(item => {
            const pointName = Object.keys(MANUAL_POINTS).find(name => item.textContent.includes(name));
            if (pointName) {
                item.classList.remove('completed');
                item.textContent = `○ ${pointName}`;
            }
        });
        
        // Сбрасываем UI
        document.getElementById('statsLabel').textContent = `Поставлено точек: 0/${Object.keys(MANUAL_POINTS).length}`;
        document.getElementById('analyzeBtn').disabled = true;
        document.getElementById('ratingPercent').textContent = 'Общий рейтинг: 0%';
        document.getElementById('ratingScore').textContent = 'Баллы: 0/0';
        document.getElementById('resultsText').innerHTML = 'Поставьте точки на фото, затем нажмите "Анализировать"';
        document.getElementById('metricName').textContent = 'Выберите точку из списка слева';
        document.getElementById('metricValue').textContent = '';
        document.getElementById('metricScore').textContent = '';
        document.getElementById('metricLevel').textContent = '';
        document.getElementById('metricIdeal').textContent = '';
        
        this.hideInstruction();
        
        if (this.image) {
            const ctx = this.ctx;
            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            ctx.drawImage(this.image, 0, 0, this.canvas.width, this.canvas.height);
        }
    }
    
    loadImage(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.image = img;
                this.currentImageWidth = img.width;
                this.currentImageHeight = img.height;
                
                // Подгоняем размер канваса
                const maxWidth = this.canvas.parentElement.clientWidth - 40;
                const maxHeight = window.innerHeight * 0.7;
                
                this.scale = Math.min(maxWidth / img.width, maxHeight / img.height);
                this.canvas.width = img.width * this.scale;
                this.canvas.height = img.height * this.scale;
                this.offsetX = 0;
                this.offsetY = 0;
                
                const ctx = this.ctx;
                ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);
                
                this.clearAllPoints();
                
                // Выбираем первую точку
                const firstPoint = Object.keys(MANUAL_POINTS)[0];
                const firstElement = document.querySelector('.point-item');
                if (firstElement) {
                    this.selectPoint(firstPoint, firstElement);
                }
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
    
    analyzeManualPoints() {
        if (Object.keys(this.points).length < 15) {
            alert(`Поставлено только ${Object.keys(this.points).length} точек. Необходимо минимум 15.`);
            return;
        }
        
        // Конвертируем точки в landmarks
        this.landmarks = {};
        Object.entries(this.points).forEach(([name, point]) => {
            const pointId = MANUAL_POINTS[name];
            this.landmarks[pointId] = {
                x: point.x / this.canvas.width,
                y: point.y / this.canvas.height
            };
        });
        
        this.analyzeFace();
        alert('Анализ завершен успешно!');
    }
    
    analyzeFace() {
        this.metricResults = [];
        this.totalScore = 0;
        this.maxScore = 0;
        
        Object.entries(this.metrics).forEach(([key, metric]) => {
            try {
                const missingPoints = metric.points.filter(p => !(p in this.landmarks));
                
                if (missingPoints.length > 0) {
                    this.metricResults.push({
                        name: key,
                        value: null,
                        status: 'error',
                        message: `Отсутствуют точки: ${missingPoints.join(', ')}`,
                        description: metric.description,
                        unit: metric.unit
                    });
                    return;
                }
                
                const points = metric.points.map(p => this.landmarks[p]);
                let value = metric.calculate.call(this, ...points);
                
                let valueAvg;
                let valueDisplay;
                
                if (Array.isArray(value)) {
                    valueAvg = value.reduce((a, b) => a + b) / value.length;
                    valueDisplay = value;
                } else {
                    valueAvg = value;
                    valueDisplay = value;
                }
                
                const [score, level, maxPossible] = this.calculateScoreFromRanges(valueAvg, metric.ranges[this.gender]);
                
                const valueStr = Array.isArray(valueDisplay) 
                    ? valueDisplay.map(v => v.toFixed(3)).join(', ')
                    : valueDisplay.toFixed(3);
                
                this.metricResults.push({
                    name: key,
                    value: valueDisplay,
                    valueStr: valueStr,
                    status: score > 0 ? 'ok' : 'bad',
                    description: metric.description,
                    unit: metric.unit,
                    score: score,
                    maxScore: maxPossible,
                    level: level,
                    ranges: metric.ranges
                });
                
                this.totalScore += score;
                this.maxScore += maxPossible;
            } catch (e) {
                this.metricResults.push({
                    name: key,
                    value: null,
                    status: 'error',
                    message: e.message,
                    description: metric.description,
                    unit: metric.unit
                });
            }
        });
        
        this.showAllResults();
        this.showMetric(0);
    }
    
    calculateScoreFromRanges(value, ranges) {
        for (let i = 0; i < ranges.length; i++) {
            const [low, high, score] = ranges[i];
            if (value >= low && value <= high) {
                const levels = ["Идеально", "Хорошо", "Средне", "Ниже среднего", "Плохо", "Очень плохо", "К
