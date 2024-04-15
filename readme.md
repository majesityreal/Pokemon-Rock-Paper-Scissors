### Known Bugs:
Login form has extra margins on left and right side. It is 3 nested <div> and that is likely why.
Issue bc if you click outside login popup, it closes it unless you click on these horizontal margins. Cannot figure out how to fix, minor bug as it does not significantly impact functionality

# Future developer:
#### VSCode
Install PostCSS to read the stuff that Tailwind adds on compiling
Also install _______________ for the EJS support

## /routes
Handles all routing related stuff.
auth.js = handles logging in/signing up/ logging out
game.js = handles game related routes (creating, joining, re-connecting)