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
		loopArrayAndPush(links.boardgamedesigner, currentGame.designers);
		loopArrayAndPush(links.boardgamesolodesigner, currentGame.designers);
		loopArrayAndPush(links.boardgamedartist, currentGame.artists);
		loopArrayAndPush(links.boardgamepublisher, currentGame.publishers);
		loopArrayAndPush(links.boardgamedeveloper, currentGame.developers);
		loopArrayAndPush(
			links.boardgamegraphicdesigner,
			currentGame.graphicDesigners
		);
		loopArrayAndPush(links.boardgamesculptor, currentGame.sculptors);
		loopArrayAndPush(links.boardgameeditor, currentGame.editors);
		loopArrayAndPush(links.boardgamewriter, currentGame.writers);
		loopArrayAndPush(
			links.boardgameinsertdesigner,
			currentGame.insertDesigner
		);
		// Classifications
		loopArrayAndPush(links.boardgamecategory, currentGame.categories);
		loopArrayAndPush(links.boardgamemechanic, currentGame.mechanics);
		loopArrayAndPush(links.boardgamefamily, currentGame.families);

		loopArrayAndPush(links.expandsboardgame, currentGame.baseGames);
		loopArrayAndPush(links.boardgameexpansion, currentGame.expansions);
		loopArrayAndPush(links.boardgameversion, currentGame.versions);
		loopArrayAndPush(links.boardgameaccessory, currentGame.accessories);

		loopArrayAndPush(links.boardgamehonor, currentGame.awards);
	}

	return currentGame;

	function loopArrayAndPush(input: Array<any>, output: pair[]) {
		if (input && input.length > 0) {
			input.forEach((item: any) => {
				output.push({ id: item.objectid, name: item.name });
			});
		}
	}
}

async function scrapeSite() {
	// perform an HTTP GET request to the target page

	const data: BGGGame[] = [];

	const response = await axios.get(
		'https://boardgamegeek.com/boardgame/342942/ark-nova/'
	);

	// get the HTML from the server response
	const html = response.data;
	const $ = load(html);

	// Check for div.messagebox.error: Present when item is not found
	if ($('.messagebox.error').length == 0) {
		// Find the right <script>
		const scriptHTMLElement = $('script').each((index, scriptTag) => {
			const child = scriptTag.children[0];
			if (
				child &&
				'data' in child &&
				child.data.includes('GEEK.geekitemPreload')
			) {
				// extract geekitemPreload from script and make its data available
				let start: number = child.data.indexOf('geekitemPreload');
				let end: number = child.data.indexOf('GEEK.geekitemSettings');
				let geekitemPreload: any;
				eval(child.data.substring(start, end));
				if (geekitemPreload && 'item' in geekitemPreload) {
					let currentGame: BGGGame = processEntry(
						geekitemPreload.item
					);

					data.push(currentGame);
					console.log(
						'Stored: Game ID = ' +
							currentGame.id +
							' Name = ' +
							currentGame.name
					);
				}
			}
		});
	}

	// Export the data
	writeFile(
		'./data/' +
			'games' +
			//  + (START_INDEX / 1000).toFixed(0)
			'.json',
		JSON.stringify(data),
		(err) => {
			if (err) {
				console.log('err = ' + err);
			}
		}
	);

	writeCSVToPath('data/games.csv', data, {
		headers: true,
		quoteHeaders: false,
		quoteColumns: true,
	}).on('error', (error) => console.error(error));
}

scrapeSite();
