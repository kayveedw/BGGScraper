const { XMLParser } = require('fast-xml-parser');

import { writeFile } from 'fs';
import { Url } from 'url';

type pair = {
	id: number;
	name: string;
};

class BBGGame {
	id: number;
	name: string = '';
	image: Url = {
		auth: null,
		hash: null,
		host: null,
		hostname: null,
		href: '',
		path: null,
		pathname: null,
		protocol: null,
		search: null,
		slashes: null,
		port: null,
		query: null,
	};
	description: string = '';
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

	if (process.argv.length >= 2) {
		const START_INDEX: number = Number(process.argv[2]);
		// const START_INDEX: number = 1000;

		const data: BBGGame[] = [];

		for (
			let index: number = START_INDEX;
			index < START_INDEX + 1000;
			index++
		) {
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

			const currentGame: BBGGame = new BBGGame(index);

			const boardGame = root.boardgames.boardgame;

			if (!boardGame['error']) {
				if (boardGame['name']) {
					for (let name of boardGame['name']) {
						// boardGame.name.forEach((item: any) => {
						if (name['primary']) {
							currentGame.name = name['value'];
						}
					}
				}

				currentGame.description = boardGame['description'];
				currentGame.image.href = boardGame['image'];

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

				data.push(currentGame);
			}
		}
		writeFile(
			'./data/' + (START_INDEX / 1000).toFixed(0) + '.json',
			JSON.stringify(data),
			(err) => {
				if (err) {
					console.log('err = ' + err);
				}
			}
		);
	}
}

main();
