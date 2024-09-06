import {
	createWriteStream,
	readdirSync,
	readFileSync,
	writeFile,
	WriteStream,
} from 'fs';
import slug from 'slug';

import { BBGGame } from './classes/bbggame';
import { BGGGame } from './classes/bgggame';
import { quoteWrapper, sortStringAsc } from './utilities';

type nameCountPair = {
	name: string;
	count: number;
};

function convert(bGGItem: BGGGame): BBGGame {
	let bargainBoardGameItem = new BBGGame(bGGItem.id);

	bargainBoardGameItem.name = String(bGGItem.name);
	if (!bGGItem.slug) {
		bGGItem.slug = slug(bargainBoardGameItem.name);
	}
	bargainBoardGameItem.slug = bGGItem.slug;

	// Consolidate the different roles into single credits list
	if (bGGItem.artists && bGGItem.artists.length) {
		for (let item of bGGItem.artists) {
			bargainBoardGameItem.credits.pushIfNew('Artist: ' + item.name);
		}
	}
	if (bGGItem.designers && bGGItem.designers.length) {
		for (let item of bGGItem.designers) {
			bargainBoardGameItem.credits.pushIfNew('Designer: ' + item.name);
		}
	}
	if (bGGItem.developers && bGGItem.developers.length) {
		for (let item of bGGItem.developers) {
			bargainBoardGameItem.credits.pushIfNew('Developer: ' + item.name);
		}
	}
	if (bGGItem.editors && bGGItem.editors.length) {
		for (let item of bGGItem.editors) {
			bargainBoardGameItem.credits.pushIfNew('Editor: ' + item.name);
		}
	}
	if (bGGItem.graphicDesigners && bGGItem.graphicDesigners.length) {
		for (let item of bGGItem.graphicDesigners) {
			bargainBoardGameItem.credits.pushIfNew(
				'Graphic Designer: ' + item.name
			);
		}
	}
	if (bGGItem.publishers && bGGItem.publishers.length) {
		for (let item of bGGItem.publishers) {
			bargainBoardGameItem.credits.pushIfNew('Publisher: ' + item.name);
		}
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

	if (bGGItem.categories && bGGItem.categories.length) {
		for (let item of bGGItem.categories) {
			bargainBoardGameItem.classifications.pushIfNew(
				'Category: ' + item.name
			);
		}
	}
	if (bGGItem.mechanics && bGGItem.mechanics.length) {
		for (let item of bGGItem.mechanics) {
			bargainBoardGameItem.classifications.pushIfNew(
				'Mechanism: ' + item.name
			);
		}
	}
	if (bGGItem.families && bGGItem.families.length) {
		for (let item of bGGItem.families) {
			bargainBoardGameItem.classifications.pushIfNew(item.name); // Dont add a prefix as all values already include one
		}
	}
	return bargainBoardGameItem;
}

async function main() {
	if (process.argv.length <= 2) {
		console.log('Must send an argumnent for the input folder.');
	} else {
		const INPUT_FOLDER: string = process.argv[2];

		// Extract all Credits and Classifications
		let allCredits: nameCountPair[] = [];
		let allClassifications: nameCountPair[] = [];
		// Loop all JSON files in the folder
		readdirSync(INPUT_FOLDER)
			.filter((name) => name.toLowerCase().endsWith('.json'))
			.forEach((file) => {
				let fileData: BGGGame[] = JSON.parse(
					readFileSync(INPUT_FOLDER + '/' + file, 'utf8')
				);
				let exportData: BBGGame[] = [];

				// Parse JSON data from BGG objects to BBG ones that match our needs better
				for (let currentBGGGame of fileData) {
					exportData.push(convert(currentBGGGame));
				}

				// Export the data
				writeFile(
					INPUT_FOLDER + '/BBG/' + file,
					JSON.stringify(exportData),
					(err) => {
						if (err) {
							console.log('err = ' + err);
						}
					}
				);

				let outputFile: WriteStream = createWriteStream(
					'./data/BBG/' + file + '.csv',
					{ flags: 'w', encoding: 'utf8' }
				);

				Object.keys(exportData[0]).forEach((key) => {
					outputFile.write(key + ',');
				});
				outputFile.write('\n');

				for (let game of exportData) {
					let property: keyof typeof game;
					for (property in game) {
						outputFile.write(
							game[property]
								? quoteWrapper(
										String(game[property]).replaceAll(
											/\"/g,
											'""'
										)
								  )
								: ''
						);
						outputFile.write(',');
					}
					outputFile.write('\n');
				}
				outputFile.end();

				// Loop BBG formatted data

				for (let game of exportData) {
					for (let credit of game.credits) {
						// Check if value is already in allCredits and push if not
						let index: number = allCredits.findIndex(
							(item) => item.name === credit
						);
						if (index == -1) {
							allCredits.push({ name: credit, count: 1 });
						} else {
							// # Keep count of matching games
							allCredits[index].count++;
						}
					}

					for (let classification of game.classifications) {
						// Check if value is already in allClassifications and push if not
						let index: number = allClassifications.findIndex(
							(item) => item.name === classification
						);
						if (index == -1) {
							allClassifications.push({
								name: classification,
								count: 1,
							});
						} else {
							// # Keep count of matching games
							allClassifications[index].count++;
						}
					}
				}
			});

		allCredits.sort((a, b) => sortStringAsc(a.name, b.name));
		allClassifications.sort((a, b) => sortStringAsc(a.name, b.name));

		// Export CSVs
		let outputFile: WriteStream = createWriteStream(
			'./data/BBG/Credits.csv',
			{ flags: 'w', encoding: 'utf8' }
		);
		outputFile.write('Name,Count\n');
		for (let credit of allCredits) {
			outputFile.write(
				quoteWrapper(credit.name) + ',' + Number(credit.count) + '\n'
			);
		}
		outputFile.end();

		outputFile = createWriteStream('./data/BBG/Classification.csv', {
			flags: 'w',
			encoding: 'utf8',
		});
		outputFile.write('Name,Count\n');
		for (let classification of allClassifications) {
			outputFile.write(
				quoteWrapper(classification.name) +
					',' +
					Number(classification.count) +
					'\n'
			);
		}
		outputFile.end();
	}
}

main();
