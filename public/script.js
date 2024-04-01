const buttonContainer = document.querySelector('.button-container');
const pokemonTypes = [
    'Normal', 'Fire', 'Water', 'Grass', 'Electric', 'Ice',
    'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug',
    'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy'
];

pokemonTypes.forEach(type => {
    const button = document.createElement('button');
    button.classList.add('type-button');
    button.textContent = type;
    buttonContainer.appendChild(button);
});
