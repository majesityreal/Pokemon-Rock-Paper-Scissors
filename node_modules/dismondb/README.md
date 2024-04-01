![npm](https://img.shields.io/npm/v/dismondb)
![GitHub package.json version](https://img.shields.io/github/package-json/v/lockyz-dev/pokemontypedex)
![GitHub release (latest by date)](https://img.shields.io/github/v/release/Lockyz-Dev/pokemontypedex)

# DismonDB
The DismonDB is a node.js module that allows you to show information on all the Types in the Pokemon Games

Documentation: dismondb.lockyzdev.net

## Features
- Easy to use!
- Use only a few lines to get information on ANY pokemon type
- The database is constantly being expanded and improved upon

## Description
The Dismon Database was a feature we used in a few of our own bots.
We wanted to open-source it and give everyone access.

Basically, the DismonDB is full of information on any of the below.
- Pokemon Types
- MORE to come

## Installation
`npm install dismondb`

## Current Update
- ALL "versions" are now json files
- Added a single function for the typedex
- Added "images"
- Renamed to "DismonDB"
- Nested the "Name" and added properties for different languages
-- Only supports English and Japanese at this current time
- All Typemaps have been nested further
-- Instead of genOneAttackTypemap.noEffect it's typemaps.gen1.noEffect
-- This should increase clarity and all us to add more values in the future.
-- This also means they all can follow the same naming scheme
- Renamed counts to counters
-- Instead of counts.moveCount it's counters.moves
- Nested the stat averages by two more levels
-- Instead of statAverages.hp it's stats.average.overall.hp
-- More stat types will be added in the future (e.g min stat, max stat)
- Fixed a few spelling errors
-- Defence not Defense
- Changed relevant strings to int and long
- Updated outdated stat averages
-- Some hadn't been set when I updated the db to Gen 9 data