import { createWriteStream, readFileSync, writeFile, WriteStream } from 'fs';
import slug from 'slug';

import { BBGGame } from './classes/bbggame';
import { BGGGame } from './classes/bgggame';
import { quoteWrapper, sortStringAsc } from './utilities';

function convert(bGGItem: BGGGame): BBGGame {
	let bargainBoardGameItem = new BBGGame(bGGItem.id);

	bargainBoardGameItem.name = bGGItem.name;
	if (!bGGItem.slug) {
		bGGItem.slug = slug(bGGItem.name);
	}
	bargainBoardGameItem.slug = bGGItem.slug;

	// Consolidate the different roles into single credits list
	for (let item of bGGItem.artists) {
		bargainBoardGameItem.credits.pushIfNew('Artist: ' + item.name);
	}
	for (let item of bGGItem.designers) {
		bargainBoardGameItem.credits.pushIfNew('Designer: ' + item.name);
	}
	for (let item of bGGItem.developers) {
		bargainBoardGameItem.credits.pushIfNew('Developer: ' + item.name);
	}
	for (let item of bGGItem.editors) {
		bargainBoardGameItem.credits.pushIfNew('Editor: ' + item.name);
	}
	for (let item of bGGItem.graphicDesigners) {
		bargainBoardGameItem.credits.pushIfNew(
			'Graphic Designer: ' + item.name
		);
	}
	for (let item of bGGItem.publishers) {
		bargainBoardGameItem.credits.pushIfNew('Publisher: ' + item.name);
	}

	if (bGGItem.type) {
		bargainBoardGameItem.classifications.pushIfNew('Type: ' + bGGItem.type);
	}
	if (bGGItem.minimumNumberOfPlayers || bGGItem.maximumNumberOfPlayers) {
		let playerRange = 'Players: ';
		playerRange += bGGItem.minimumNumberOfPlayers
			? String(bGGItem.minimumNumberOfPlayers)
			: '1';
		playerRange += bGGItem.maximumNumberOfPlayers
			? '-' + String(bGGItem.maximumNumberOfPlayers)
			: '+';
		bargainBoardGameItem.classifications.pushIfNew(playerRange);
	}
	if (bGGItem.minimumPlayerAge) {
		bargainBoardGameItem.classifications.pushIfNew(
			String('Age: ' + String(bGGItem.minimumPlayerAge) + '+')
		);
	}

	// Consolidate into a single classifications list
	for (let item of bGGItem.categories) {
		bargainBoardGameItem.classifications.pushIfNew(
			'Category: ' + item.name
		);
	}
	for (let item of bGGItem.mechanics) {
		bargainBoardGameItem.classifications.pushIfNew(
			'Mechanism: ' + item.name
		);
	}
	for (let item of bGGItem.families) {
		bargainBoardGameItem.classifications.pushIfNew(item.name); // Dont add a prefix as all values already include one
	}

	return bargainBoardGameItem;
}

async function main() {
	if (process.argv.length <= 2) {
		console.log('Must send an argumnent for the input file.');
	} else {
		const INPUT_FILE: string = process.argv[2];

		let fileData: BGGGame[] = JSON.parse(
			readFileSync('./data/' + INPUT_FILE, 'utf8')
		);

		let exportData: BBGGame[] = [];

		// Parse JSON data from BGG objects to BBG ones that match our needs better
		for (let currentBGGGame of fileData) {
			exportData.push(convert(currentBGGGame));
		}

		// Extract all Credits and Classifications
		let allCredits: string[] = [];
		let allClassifications: string[] = [];

		// Loop BBG formatted data

		for (let game of exportData) {
			for (let credit of game.credits) {
				// Check if value is already in allCredits and push if not
				allCredits.pushIfNew(credit);
			}

			for (let classification of game.classifications) {
				// Check if value is already in allCredits and push if not
				allClassifications.pushIfNew(classification);
			}
		}

		allCredits.sort((a, b) => sortStringAsc(a, b));
		allClassifications.sort((a, b) => sortStringAsc(a, b));

		// Export the data
		writeFile(
			'./data/BBG/' + INPUT_FILE,
			JSON.stringify(exportData),
			(err) => {
				if (err) {
					console.log('err = ' + err);
				}
			}
		);

		// Export CSVs
		let outputFile: WriteStream = createWriteStream(
			'./data/BBG/Credits.csv',
			{ flags: 'w', encoding: 'utf8' }
		);
		for (let credit of allCredits) {
			outputFile.write(quoteWrapper(credit) + '\n');
		}
		outputFile.end();

		outputFile = createWriteStream('./data/BBG/Classification.csv', {
			flags: 'w',
			encoding: 'utf8',
		});
		for (let classification of allClassifications) {
			outputFile.write(quoteWrapper(classification) + '\n');
		}
		outputFile.end();
	}
}

main();
