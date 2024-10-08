let typeChosen = "None"; // defaulting to None, exporting it for use in client.js. chosenType is used by sendChoice()
const buttonContainer = document.querySelector('.button-container');
const pokemonTypes = [
    'Normal', 'Fire', 'Water', 'Grass', 'Electric', 'Ice',
    'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug',
    'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy'
];
const colors = {
	normal: '#A8A77A',
	fire: '#EE8130',
	water: '#6390F0',
	electric: '#F7D02C',
	grass: '#7AC74C',
	ice: '#96D9D6',
	fighting: '#C22E28',
	poison: '#A33EA1',
	ground: '#E2BF65',
	flying: '#A98FF3',
	psychic: '#F95587',
	bug: '#A6B91A',
	rock: '#B6A136',
	ghost: '#735797',
	dragon: '#6F35FC',
	dark: '#705746',
	steel: '#B7B7CE',
	fairy: '#D685AD',
    none: '#68a090',
    random: '#68a090',
};

// parentObject is what we append the button to
function createTypeButton(type, parentObject, additionalClasses="") {
    if (type == undefined) {
        return;
    }
    const button = document.createElement('button');
    button.classList.add('type-button');
    if (additionalClasses != "") {
        button.classList.add(additionalClasses.split(" "));
    }
    button.textContent = type;
    if (type == 'None' || type == 'Random') { // if no choice or random, we put '???'
        button.textContent = '???';
    }
    const color = colors[type.toLowerCase()]; // changing background color of button according to its type
    if (color) {
        button.style.backgroundColor = color;
    }
    parentObject.appendChild(button);
}

function createDeadTypeButton(type, parentObject) { // Buggandea Greece, buggadeez nuts
    const button = document.createElement('button');
    button.classList.add('type-button');
    button.textContent = type;
    button.style.backgroundColor = '#d3d3d3';
    button.style.color = '#808080'; // text color
    button.disabled = true;
    parentObject.appendChild(button);
}

function sendChoice(type) {
    console.log("Type button pressed: " + type);
    typeChosen = type;
}

buttonContainer.addEventListener('click', (event) => {
    // Remove 'selected' class from any other buttons
    buttonContainer.querySelectorAll('.selected').forEach(button => {
        button.classList.remove('selected');
    });

    // Add 'selected' class to the clicked button
    event.target.classList.add('selected'); // TODO - this event listener activates for even the blank space. Could be inefficient
    if (event.target.textContent.length < 9) {
        sendChoice(event.target.textContent);
    }
    else { // if it is longer, we just send 'None' to server
        sendChoice("None");
    }
});

// do not need this anymore. This was to add listener for each button being clicked.
// typeButtons = buttonContainer.querySelectorAll('.type-button');
// typeButtons.forEach(typeButton => {
//     typeButton.addEventListener('click', (event) => {
//         sendChoice(typeButton.textContent);
//     })
// });

// function adjustButtonColumns() {
//     const buttonContainer = document.querySelector('.button-container');
//     const containerWidth = buttonContainer.offsetWidth; 
//     const idealButtonWidth = 150; // Adjust this value 

//     let columns = Math.max(1, Math.floor(containerWidth / idealButtonWidth));
//     buttonContainer.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
// }

// // Initial setup
// adjustButtonColumns(); 

// // Resize event listener
// window.addEventListener('resize', adjustButtonColumns); 