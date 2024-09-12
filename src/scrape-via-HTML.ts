import axios from 'axios';
import { load } from 'cheerio';
import slug from 'slug';
import { writeToPath as writeCSVToPath } from '@fast-csv/format';

import { BGGGame, pair } from './classes/bgggame';
import { writeFile } from 'fs';

function processEntry(geekItemInput: any): BGGGame {
	const currentGame: BGGGame = new BGGGame(Number(geekItemInput.objectid));

	currentGame.name = geekItemInput.name;
	currentGame.slug = slug(currentGame.name);

	currentGame.shortDescription = geekItemInput.short_description;
	currentGame.description = geekItemInput.description;

	if (geekItemInput.images && geekItemInput.images.original) {
		currentGame.image = new URL(geekItemInput.images.original);
	}
	if (geekItemInput.website && geekItemInput.website.url) {
		currentGame.website = new URL(geekItemInput.website.url);
	}

	currentGame.publishedYear = Number(geekItemInput.yearpublished);

	currentGame.minimumNumberOfPlayers = Number(geekItemInput.minplayers);
	currentGame.maximumNumberOfPlayers = Number(geekItemInput.maxplayers);
	currentGame.minimumPlayingTime = Number(geekItemInput.minplaytime);
	currentGame.maximumPlayingTime = Number(geekItemInput.maxplaytime);
	currentGame.minimumPlayerAge = Number(geekItemInput.minage);

	if (geekItemInput.rankinfo && geekItemInput.rankinfo.length > 0) {
		geekItemInput.rankinfo.forEach((item: any) => {
			if (item.veryshortprettyname == 'Overall') {
				currentGame.rank = Number(item.rank);
			}
		});
	}

	if (geekItemInput.stats && geekItemInput.stats.average) {
		currentGame.rating = Number(geekItemInput.stats.average);
	}
	const links = geekItemInput.links;
	if (links) {
		if (links.boardgamesubdomain && links.boardgamesubdomain.length > 0) {
			links.boardgamesubdomain.forEach((item: any) => {
				if (currentGame.type != '') {
					currentGame.type += ', ';
				}
				currentGame.type += item.name;
			});
		}
		// Credits
		loopArrayAndPushPair(links.boardgamedesigner, currentGame.designers);
		loopArrayAndPushPair(links.boardgamesolodesigner, currentGame.designers);
		loopArrayAndPushPair(links.boardgamedartist, currentGame.artists);
		loopArrayAndPushPair(links.boardgamepublisher, currentGame.publishers);
		loopArrayAndPushPair(links.boardgamedeveloper, currentGame.developers);
		loopArrayAndPushPair(links.boardgamegraphicdesigner, currentGame.graphicDesigners);
		loopArrayAndPushPair(links.boardgamesculptor, currentGame.sculptors);
		loopArrayAndPushPair(links.boardgameeditor, currentGame.editors);
		loopArrayAndPushPair(links.boardgamewriter, currentGame.writers);
		loopArrayAndPushPair(links.boardgameinsertdesigner, currentGame.insertDesigner);
		// Classifications
		loopArrayAndPushPair(links.boardgamecategory, currentGame.categories);
		loopArrayAndPushPair(links.boardgamemechanic, currentGame.mechanics);
		loopArrayAndPushPair(links.boardgamefamily, currentGame.families);

		loopArrayAndPushPair(links.expandsboardgame, currentGame.baseGames);
		loopArrayAndPushPair(links.boardgameexpansion, currentGame.expansions);
		loopArrayAndPushPair(links.boardgameversion, currentGame.versions);
		loopArrayAndPushPair(links.boardgameaccessory, currentGame.accessories);

		loopArrayAndPushPair(links.boardgamehonor, currentGame.awards);
	}

	return currentGame;

	function loopArrayAndPushPair(input: Array<any>, output: pair[]) {
		if (input && input.length > 0) {
			input.forEach((item: any) => {
				output.push({ id: item.objectid, name: item.name });
			});
		}
	}
}

async function scrapeSite() {
	const baseURL: string = 'https://boardgamegeek.com/boardgame';

	if (process.argv.length <= 2) {
		console.log('Must send an argumnent for the starting index.');
	} else {
		const START_INDEX: number = Number(process.argv[2]);
		const data: BGGGame[] = [];

		for (let mainIndex: number = START_INDEX; mainIndex < START_INDEX + 1000; mainIndex++) {
			try {
				let currentURL = baseURL + '/' + mainIndex.toString();
				console.log('Reading: ' + currentURL);

				// perform an HTTP GET request to the target page
				const response = await axios.get(currentURL);
				if (response && response.status == 200) {
					// get the HTML from the server response
					const html = response.data;
					const $ = load(html);

					// Check for div.messagebox.error: Present when item is not found
					if ($('.messagebox.error').length == 0) {
						// Find the right <script>
						const scriptHTMLElement = $('script').each((index, scriptTag) => {
							const child = scriptTag.children[0];
							if (child && 'data' in child && child.data.includes('GEEK.geekitemPreload')) {
								// extract geekitemPreload from script and make its data available
								let start: number = child.data.indexOf('geekitemPreload');
								let end: number = child.data.indexOf('GEEK.geekitemSettings');
								let geekitemPreload: any;
								eval(child.data.substring(start, end));
								if (geekitemPreload && 'item' in geekitemPreload) {
									let currentGame: BGGGame = processEntry(geekitemPreload.item);

									data.push(currentGame);
									console.log('Stored: Game ID = ' + currentGame.id + ' Name = ' + currentGame.name);
								}
							}
						});
					}
				}
			} catch (error) {
				console.log('Error: ' + error);
			}
		}

		// Export the data
		writeFile('./data/' + (START_INDEX / 1000).toFixed(0) + '.json', JSON.stringify(data), (err) => {
			if (err) {
				console.log('err = ' + err);
			}
		});

		writeCSVToPath('./data/' + (START_INDEX / 1000).toFixed(0) + '.csv', data, {
			headers: true,
			quoteHeaders: false,
			quoteColumns: true,
		}).on('error', (error) => console.error(error));
	}
}

scrapeSite();
