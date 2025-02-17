import { readdirSync, readFileSync, writeFile } from 'fs';
import slug from 'slug';
import { writeToPath as writeCSVToPath } from '@fast-csv/format';

import { BBGGame } from './classes/bbggame';
import { BGGGame } from './classes/bgggame';
import { sortStringAsc } from './utilities';

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
	bargainBoardGameItem.description = bGGItem.description;

	bargainBoardGameItem.publishedYear = bGGItem.publishedYear;
	bargainBoardGameItem.website = bGGItem.website;
	bargainBoardGameItem.rank = bGGItem.rank;
	bargainBoardGameItem.type = bGGItem.type;

	if (bGGItem.rating) {
		const adustment = -5 + Math.random() * 10; // Number between -5 and +5
		bargainBoardGameItem.rating = Math.floor(bGGItem.rating * 10 + adustment); // BBG ratings are between 1-100
	}

	// Consolidate the different roles into single credits list
	if (bGGItem.artists && bGGItem.artists.length) {
		for (let item of bGGItem.artists) {
			if (!item.name.includes('Uncredited')) {
				bargainBoardGameItem.credits.pushIfNew('Artist: ' + item.name);
			}
		}
	}
	if (bGGItem.designers && bGGItem.designers.length) {
		for (let item of bGGItem.designers) {
			if (!item.name.includes('Uncredited')) {
				bargainBoardGameItem.credits.pushIfNew('Designer: ' + item.name);
			}
		}
	}
	if (bGGItem.developers && bGGItem.developers.length) {
		for (let item of bGGItem.developers) {
			if (!item.name.includes('Uncredited')) {
				bargainBoardGameItem.credits.pushIfNew('Developer: ' + item.name);
			}
		}
	}
	if (bGGItem.editors && bGGItem.editors.length) {
		for (let item of bGGItem.editors) {
			if (!item.name.includes('Uncredited')) {
				bargainBoardGameItem.credits.pushIfNew('Editor: ' + item.name);
			}
		}
	}
	if (bGGItem.graphicDesigners && bGGItem.graphicDesigners.length) {
		for (let item of bGGItem.graphicDesigners) {
			if (!item.name.includes('Uncredited')) {
				bargainBoardGameItem.credits.pushIfNew('Graphic Designer: ' + item.name);
			}
		}
	}
	if (bGGItem.publishers && bGGItem.publishers.length) {
		for (let item of bGGItem.publishers) {
			if (!item.name.includes('Uncredited')) {
				bargainBoardGameItem.credits.pushIfNew('Publisher: ' + item.name);
			}
		}
	}
	if (bGGItem.type) {
		bargainBoardGameItem.classifications.pushIfNew('Type');
		bargainBoardGameItem.classifications.pushIfNew('Type: ' + bGGItem.type);
	}
	if (bGGItem.minimumNumberOfPlayers || bGGItem.maximumNumberOfPlayers) {
		let playerRange = 'Players: ';
		if (bGGItem.minimumNumberOfPlayers == bGGItem.maximumNumberOfPlayers) {
			// Fixed number of player
			playerRange += String(bGGItem.minimumNumberOfPlayers);
		} else {
			playerRange += bGGItem.minimumNumberOfPlayers ? String(bGGItem.minimumNumberOfPlayers) : '1';
			playerRange += bGGItem.maximumNumberOfPlayers ? '-' + String(bGGItem.maximumNumberOfPlayers) : '+';
		}
		bargainBoardGameItem.classifications.pushIfNew('Players');
		bargainBoardGameItem.classifications.pushIfNew(playerRange);
		if (
			bGGItem.minimumNumberOfPlayers &&
			bGGItem.maximumNumberOfPlayers &&
			bGGItem.minimumNumberOfPlayers <= bGGItem.maximumNumberOfPlayers
		) {
			for (let index: number = bGGItem.minimumNumberOfPlayers; index <= bGGItem.maximumNumberOfPlayers; index++) {
				bargainBoardGameItem.classifications.pushIfNew('Players: ' + String(index));
			}
		}

		bargainBoardGameItem.minimumPlayers = bGGItem.minimumNumberOfPlayers; // Field as well as category
		bargainBoardGameItem.maximumPlayers = bGGItem.maximumNumberOfPlayers; // Field as well as category
	}
	if (bGGItem.minimumPlayerAge) {
		bargainBoardGameItem.classifications.pushIfNew('Age');
		bargainBoardGameItem.classifications.pushIfNew(String('Age: ' + String(bGGItem.minimumPlayerAge) + '+'));
		bargainBoardGameItem.minimumPlayerAge = bGGItem.minimumPlayerAge; // Field as well as category
	}

	// Consolidate into a single classifications list
	if (bGGItem.categories && bGGItem.categories.length) {
		for (let item of bGGItem.categories) {
			bargainBoardGameItem.classifications.pushIfNew('Category');
			bargainBoardGameItem.classifications.pushIfNew('Category: ' + item.name);
		}
	}
	if (bGGItem.mechanics && bGGItem.mechanics.length) {
		for (let item of bGGItem.mechanics) {
			bargainBoardGameItem.classifications.pushIfNew('Mechanism');
			bargainBoardGameItem.classifications.pushIfNew('Mechanism: ' + item.name);
		}
	}
	if (bGGItem.families && bGGItem.families.length) {
		for (let item of bGGItem.families) {
			// Any with an Admin: prefix are not needed
			if (!item.name.includes('Admin:')) {
				let prefixEnd = item.name.indexOf(':');
				let parentPrefix = item.name.substring(0, prefixEnd);
				bargainBoardGameItem.classifications.pushIfNew(parentPrefix);
				bargainBoardGameItem.classifications.pushIfNew(item.name); // Dont add a prefix as all family values already include one
			}
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
		let allGames: BBGGame[] = [];
		// Loop all JSON files in the folder
		readdirSync(INPUT_FOLDER)
			.filter((name) => name.toLowerCase().endsWith('.json'))
			.filter((name) => name != 'AmazonLinks.json')
			.forEach((file) => {
				let fileData: BGGGame[] = JSON.parse(readFileSync(INPUT_FOLDER + '/' + file, 'utf8'));
				let exportData: BBGGame[] = [];

				// Parse JSON data from BGG objects to BBG ones that match our needs better
				for (let currentBGGGame of fileData) {
					exportData.push(convert(currentBGGGame));
				}

				// Export the data
				writeFile(INPUT_FOLDER + '/BBG/' + file, JSON.stringify(exportData), (err) => {
					if (err) {
						console.log('err = ' + err);
					}
				});

				writeCSVToPath('./data/BBG/' + file + '.csv', exportData, {
					headers: true,
					quoteHeaders: false,
					quoteColumns: true,
				}).on('error', (error) => console.error(error));

				// Loop BBG formatted data

				for (let game of exportData) {
					for (let credit of game.credits) {
						// Check if value is already in allCredits and push if not
						let index: number = allCredits.findIndex((item) => item.name === credit);
						if (index == -1) {
							allCredits.push({ name: credit, count: 1 });
						} else {
							// # Keep count of matching games
							allCredits[index].count++;
						}
					}

					for (let classification of game.classifications) {
						// Check if value is already in allClassifications and push if not
						let index: number = allClassifications.findIndex((item) => item.name === classification);
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

				allGames.push(...exportData);
			});

		// Export all games JSON
		writeFile(INPUT_FOLDER + '/BBG/Games.json', JSON.stringify(allGames), (err) => {
			if (err) {
				console.log('err = ' + err);
			}
		});

		allCredits.sort((a, b) => sortStringAsc(a.name, b.name));
		allClassifications.sort((a, b) => sortStringAsc(a.name, b.name));

		// Export CSVs
		writeCSVToPath('./data/BBG/Credits.csv', allCredits, {
			headers: true,
			quoteHeaders: false,
			quoteColumns: true,
		}).on('error', (error) => console.error(error));

		writeCSVToPath('./data/BBG/Classifications.csv', allClassifications, {
			headers: true,
			quoteHeaders: false,
			quoteColumns: true,
		}).on('error', (error) => console.error(error));

		writeCSVToPath('./data/BBG/Games.csv', allGames, {
			headers: true,
			quoteHeaders: false,
			quoteColumns: true,
		}).on('error', (error) => console.error(error));

		// Export games with a Rank in order of ascending rank
		allGames = allGames.filter((game) => {
			return game.rank ? true : false;
		});
		allGames.sort((a, b) => {
			return a.rank !== b.rank ? (Number(a.rank) < Number(b.rank) ? -1 : 1) : 0;
		});

		writeFile(INPUT_FOLDER + '/BBG/RankedGames.json', JSON.stringify(allGames), (err) => {
			if (err) {
				console.log('err = ' + err);
			}
		});
		writeCSVToPath('./data/BBG/RankedGames.csv', allGames, {
			headers: true,
			quoteHeaders: false,
			quoteColumns: true,
		}).on('error', (error) => console.error(error));
	}
}

main();
