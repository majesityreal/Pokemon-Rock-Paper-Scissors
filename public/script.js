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
};

// Creates buttons for all the types
pokemonTypes.forEach(type => {
    const button = document.createElement('button');
    button.classList.add('type-button');
    button.textContent = type;
    
    const color = colors[type.toLowerCase()]; // changing background color of button according to its type
    if (color) {
        button.style.backgroundColor = color;
    }

    buttonContainer.appendChild(button);
});

buttonContainer.addEventListener('click', (event) => {
    // Remove 'selected' class from any other buttons
    buttonContainer.querySelectorAll('.selected').forEach(button => {
        button.classList.remove('selected');
    });

    // Add 'selected' class to the clicked button
    event.target.classList.add('selected'); 
});

typeButtons = buttonContainer.querySelectorAll('.type-button');
typeButtons.forEach(typeButton => {
    typeButton.addEventListener('click', (event) => {
        console.log("Type button pressed: " + typeButton.textContent);
    })
});

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