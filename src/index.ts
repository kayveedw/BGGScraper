const { XMLParser } = require('fast-xml-parser');

import { writeFile } from 'fs';

type pair = {
	id: number;
	name: string;
};

class BBGGame {
	id: number;
	name: string = '';
	designers: pair[] = [];
	artists: pair[] = [];
	publishers: pair[] = [];
	publishedYear?: number;
	type?: string;
	categories: pair[] = [];
	mechanics: pair[] = [];
	families: pair[] = [];

	constructor(id: number) {
		this.id = id;
	}
}

async function main() {
	const baseURL: string = 'https://api.geekdo.com/xmlapi/boardgame/'; // Use XML API see https://boardgamegeek.com/wiki/page/BGG_XML_API for details.

	for (let index: number = 1; index <= 10; index++) {
		// for (let index: number = 1; index <= 58000; index++) {
		const response = await fetch(baseURL + '/' + index.toString());

		// const headers = await response.headers.raw();
		const XMLData: string = await response.text();

		// Configure XMLParser
		const alwaysArray = [
			'boardgames.boardgame.name',
			'boardgamedesigner',
			'boardgameartist',
			'boardgamepublisher',
			'boardgamemechanic',
			'boardgamecategory',
			'boardgamefamily',
		];
		const options = {
			ignoreAttributes: false,
			attributeNamePrefix: '',
			textNodeName: 'value',
			isArray: (
				name: string,
				jpath: string,
				isLeafNode: boolean,
				isAttribute: boolean
			) => {
				if (alwaysArray.indexOf(jpath) !== -1) return true;
				if (alwaysArray.indexOf(name) !== -1) return true;
			},
		};

		const parser = new XMLParser(options);
		const root = parser.parse(XMLData);
		// writeFile('./temp/' + index + '.json', JSON.stringify(root), (err) => {
		// 	if (err) {
		// 		console.log('err = ' + err);
		// 	}
		// });

		const currentGame: BBGGame = new BBGGame(index);

		const boardGame = root.boardgames.boardgame;

		if (boardGame['name']) {
			for (let name of boardGame['name']) {
				// boardGame.name.forEach((item: any) => {
				if (name['primary']) {
					currentGame.name = name['value'];
				}
			}
		}

		if (boardGame['boardgamedesigner']) {
			for (let designer of boardGame['boardgamedesigner']) {
				currentGame.designers.push({
					id: designer.objectid,
					name: designer.value,
				});
			}
		}

		if (boardGame['boardgameartist']) {
			for (let artist of boardGame['boardgameartist']) {
				currentGame.artists.push({
					id: artist.objectid,
					name: artist.value,
				});
			}
		}

		if (boardGame['boardgamepublisher']) {
			for (let publisher of boardGame['boardgamepublisher']) {
				currentGame.publishers.push({
					id: publisher.objectid,
					name: publisher.value,
				});
			}
		}

		currentGame.publishedYear = boardGame['yearpublished'];

		if (boardGame['boardgamesubdomain.value']) {
			currentGame.type = boardGame['boardgamesubdomain.value'];
		}

		if (boardGame['boardgamecategory']) {
			for (let category of boardGame['boardgamecategory']) {
				currentGame.categories.push({
					id: category.objectid,
					name: category.value,
				});
			}
		}

		if (boardGame['boardgamemechanic']) {
			for (let mechanic of boardGame['boardgamemechanic']) {
				currentGame.mechanics.push({
					id: mechanic.objectid,
					name: mechanic.value,
				});
			}
		}

		if (boardGame['boardgamefamily']) {
			for (let family of boardGame['boardgamefamily']) {
				currentGame.families.push({
					id: family.objectid,
					name: family.value,
				});
			}
		}

		// console.log(JSON.stringify(currentGame));
		writeFile(
			'./data/' + index + '.json',
			JSON.stringify(currentGame),
			(err) => {
				if (err) {
					console.log('err = ' + err);
				}
			}
		);
	}
}

main();
