const CAR_BRANDS = [
    'Toyota', 'Honda', 'Ford', 'Chevrolet', 'Nissan',
    'BMW', 'Mercedes-Benz', 'Volkswagen', 'Audi',
    'Hyundai', 'Kia', 'Subaru', 'Lexus', 'Mazda',
    'Tesla', 'Jeep', 'Porsche', 'Volvo', 'Jaguar',
    'Land Rover', 'Mitsubishi', 'Ferrari', 'Lamborghini'
];

function esc(value) {
    return String(value === undefined || value === null ? '' : value)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}


function loadNavigation() {
    const html = `
<nav class="navbar">
    <a href="index.html"><img src="logojo.png" width="50" height="50" alt="TaxiReg logó"></a>
    <ul class="menu">
        <li><a href="index.html">Főoldal</a></li>
        <li><a href="cars.html">Autók</a></li>
        <li><a href="info.html">Információ</a></li>
    </ul>
</nav>`;
    document.body.insertAdjacentHTML('afterbegin', html);
}


const STORAGE_KEY = 'taxireg_cars';

function saveCars(cars) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cars));
}

function loadCars() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
    } catch (e) {
        console.error(e);
    }
    const seed = [
        { id: 1, brand: 'Toyota', model: 'Corolla', owner: 'Kovács Péter', dayOfCommission: '2020-05-14',
          electric: false, fuelUse: 5.8, color: '#f5c518', airCon: true, note: 'Megbízható belvárosi taxi.' },
        { id: 2, brand: 'Tesla', model: 'Model 3', owner: 'Nagy Anna', dayOfCommission: '2023-02-01',
          electric: true, fuelUse: 0, color: '#ffffff', airCon: true, note: '' },
        { id: 3, brand: 'BMW', model: 'M3', owner: 'Horváth Szilveszter', dayOfCommission: '2018-11-05',
        electric: false, fuelUse: 9.7, color: '#da2727', airCon: false, note: 'Néha veszélyesen közlekedik.'}
    ];
    saveCars(seed);
    return seed;
}

const FIELDS = ['model', 'owner', 'date', 'fuelUse', 'note'];

function todayString() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function validateCar(car) {
    const errors = {};

    if (!car.model) errors.model = 'A modell megadása kötelező.';
    else if (car.model.length < 2) errors.model = 'A modell neve legalább 2 karakter legyen.';
    else if (car.model.length > 40) errors.model = 'A modell neve legfeljebb 40 karakter lehet.';

    if (!car.owner) errors.owner = 'A tulajdonos nevének megadása kötelező.';
    else if (!car.owner.includes(' ')) errors.owner = 'Add meg a vezeték- és a keresztnevet is, szóközzel elválasztva.';
    else if (car.owner.length > 60) errors.owner = 'A tulajdonos neve legfeljebb 60 karakter lehet.';

    if (!car.dayOfCommission) errors.date = 'Az üzembe helyezés dátumának megadása kötelező.';
    else if (car.dayOfCommission > todayString()) errors.date = 'Az üzembe helyezés dátuma nem lehet a jövőben.';

    if (!car.electric) {
        if (isNaN(car.fuelUse)) errors.fuelUse = 'A fogyasztás megadása kötelező.';
        else if (car.fuelUse <= 0) errors.fuelUse = 'A fogyasztásnak 0-nál nagyobbnak kell lennie.';
        else if (car.fuelUse > 40) errors.fuelUse = 'A fogyasztás legfeljebb 40 l/100km lehet.';
    }

    if (car.note && car.note.length > 200) errors.note = 'A megjegyzés legfeljebb 200 karakter lehet (most ' + car.note.length + ').';

    return errors;
}

function setFieldError(key, suffix, message) {
    const input = document.getElementById(key + suffix);
    const out = document.getElementById('err-' + key + suffix);
    if (!input || !out) return;
    out.textContent = message || '';
    input.classList.toggle('input-error', !!message);
    input.classList.toggle('input-ok', !message && input.value.trim() !== '');
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
}

function showFieldErrors(errors, suffix) {
    FIELDS.forEach(key => setFieldError(key, suffix, errors[key]));
    const firstBad = FIELDS.find(key => errors[key]);
    if (firstBad) document.getElementById(firstBad + suffix).focus();
    return !firstBad;
}

function enableLiveValidation(readForm, suffix) {
    FIELDS.forEach(key => {
        const input = document.getElementById(key + suffix);
        const check = () => setFieldError(key, suffix, validateCar(readForm())[key]);
        input.addEventListener('blur', check);
        input.addEventListener('input', () => {
            if (input.classList.contains('input-error')) check();
        });
    });
}


function getCars() {
    return Promise.resolve(loadCars());
}

function getCarDetails(id) {
    const car = loadCars().find(c => c.id === parseInt(id));
    return car ? Promise.resolve(car) : Promise.reject(new Error('Nem található ilyen autó.'));
}

function createCar(carData) {
    const cars = loadCars();
    const nextId = cars.reduce((max, c) => Math.max(max, c.id), 0) + 1;
    const car = { ...carData, id: nextId };
    cars.push(car);
    saveCars(cars);
    return Promise.resolve(car);
}

function updateCar(id, carData) {
    const cars = loadCars();
    const index = cars.findIndex(c => c.id === parseInt(id));
    if (index === -1) return Promise.reject(new Error('Nem található ilyen autó.'));
    cars[index] = { ...carData, id: parseInt(id) };
    saveCars(cars);
    return Promise.resolve(cars[index]);
}

function deleteCar(id) {
    const cars = loadCars();
    const left = cars.filter(c => c.id !== parseInt(id));
    if (left.length === cars.length) return Promise.reject(new Error('Nem található ilyen autó.'));
    saveCars(left);
    return Promise.resolve({ deleted: true });
}

function fillBrandSelect(selectId) {
    const select = document.getElementById(selectId);
    CAR_BRANDS.forEach(brand => {
        const option = document.createElement('option');
        option.value = brand;
        option.textContent = brand;
        select.appendChild(option);
    });
}

loadNavigation();


let intro = document.querySelector('.intro');
let logo =document.querySelector('.logo-header');
let logoSpan = document.querySelectorAll('.logo');

window.addEventListener('DOMContentLoaded', ()=>{
        setTimeout(() => {
            logoSpan.forEach((span, idx)=>{
                setTimeout(() => {
                    span.classList.add('active');
                }, (idx + 1) * 400)
            });

            setTimeout(() => {
                logoSpan.forEach((span, idx) =>{
                    setTimeout(() => {
                       span.classList.remove('active');
                       span.classList.add('fade'); 
                    }, (idx+1)*50);
                })
            }, 2000);

            setTimeout(() => {
                intro.style.top = '-100vh';
            }, 2300);
        });    
})
