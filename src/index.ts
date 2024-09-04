const { XMLParser } = require('fast-xml-parser');

import { writeFile } from 'fs';
import { Url } from 'url';
import slug from 'slug';

type pair = {
	id: number;
	name: string;
};

class BBGGame {
	id: number;
	name: string = '';
	slug: string | undefined;
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
	graphicDesigners: pair[] = [];
	artists: pair[] = [];
	publishers: pair[] = [];
	publishedYear?: number;
	developers: pair[] = [];
	editors: pair[] = [];
	baseGames: pair[] = [];
	expansions: pair[] = [];
	accessories: pair[] = [];
	versions: pair[] = [];
	type?: string;
	categories: pair[] = [];
	mechanics: pair[] = [];
	families: pair[] = [];
	minimumNumberOfPlayers?: number;
	maximumNumberOfPlayers?: number;
	playingTime?: number;
	minimumPlayingTime?: number;
	maximumPlayingTime?: number;
	minimumPlayerAge?: number;
	awards: pair[] = [];

	constructor(id: number) {
		this.id = id;
	}
}

function processEntry(BGGInput: any): BBGGame {
	const currentGame: BBGGame = new BBGGame(Number(BGGInput['objectid']));

	if (BGGInput['name']) {
		for (let name of BGGInput['name']) {
			if (name['primary']) {
				currentGame.name = name['value'];
				currentGame.slug = slug(currentGame.name);
			}
		}
	}

	currentGame.description = BGGInput['description'];
	currentGame.image.href = BGGInput['image'];

	if (BGGInput['boardgamesolodesigner']) {
		currentGame.designers.push({
			id: BGGInput['boardgamesolodesigner'].objectid,
			name: BGGInput['boardgamesolodesigner'].value,
		});
	}
	if (BGGInput['boardgamedesigner']) {
		for (let designer of BGGInput['boardgamedesigner']) {
			currentGame.designers.push({
				id: designer.objectid,
				name: designer.value,
			});
		}
	}

	if (BGGInput['boardgamegraphicdesigner']) {
		for (let graphicDesigner of BGGInput['boardgamegraphicdesigner']) {
			currentGame.graphicDesigners.push({
				id: graphicDesigner.objectid,
				name: graphicDesigner.value,
			});
		}
	}

	if (BGGInput['boardgameartist']) {
		for (let artist of BGGInput['boardgameartist']) {
			currentGame.artists.push({
				id: artist.objectid,
				name: artist.value,
			});
		}
	}

	if (BGGInput['boardgamepublisher']) {
		for (let publisher of BGGInput['boardgamepublisher']) {
			currentGame.publishers.push({
				id: publisher.objectid,
				name: publisher.value,
			});
		}
	}

	currentGame.publishedYear = BGGInput['yearpublished'];

	if (BGGInput['boardgamedeveloper']) {
		for (let developer of BGGInput['boardgamedeveloper']) {
			currentGame.developers.push({
				id: developer.objectid,
				name: developer.value,
			});
		}
	}

	if (BGGInput['boardgameeditor']) {
		for (let editor of BGGInput['boardgameeditor']) {
			currentGame.editors.push({
				id: editor.objectid,
				name: editor.value,
			});
		}
	}

	if (BGGInput['boardgameexpansion']) {
		for (let expansion of BGGInput['boardgameexpansion']) {
			if (expansion['inbound']) {
				currentGame.baseGames.push({
					id: expansion.objectid,
					name: expansion.value,
				});
			} else {
				currentGame.expansions.push({
					id: expansion.objectid,
					name: expansion.value,
				});
			}
		}
	}

	if (BGGInput['boardgameimplementation']) {
		for (let implementation of BGGInput['boardgameimplementation']) {
			if (implementation['inbound']) {
				currentGame.baseGames.push({
					id: implementation.objectid,
					name: implementation.value,
				});
			} else {
				currentGame.expansions.push({
					id: implementation.objectid,
					name: implementation.value,
				});
			}
		}
	}

	if (BGGInput['boardgameaccessory']) {
		for (let accessory of BGGInput['boardgameaccessory']) {
			currentGame.accessories.push({
				id: accessory.objectid,
				name: accessory.value,
			});
		}
	}

	if (BGGInput['boardgameversion']) {
		for (let publisher of BGGInput['boardgameversion']) {
			currentGame.versions.push({
				id: publisher.objectid,
				name: publisher.value,
			});
		}
	}

	if (
		BGGInput['boardgamesubdomain'] &&
		BGGInput['boardgamesubdomain.value']
	) {
		currentGame.type = BGGInput['boardgamesubdomain.value'];
	}

	if (BGGInput['boardgamecategory']) {
		for (let category of BGGInput['boardgamecategory']) {
			currentGame.categories.push({
				id: category.objectid,
				name: category.value,
			});
		}
	}

	if (BGGInput['boardgamemechanic']) {
		for (let mechanic of BGGInput['boardgamemechanic']) {
			currentGame.mechanics.push({
				id: mechanic.objectid,
				name: mechanic.value,
			});
		}
	}

	if (BGGInput['boardgamefamily']) {
		for (let family of BGGInput['boardgamefamily']) {
			currentGame.families.push({
				id: family.objectid,
				name: family.value,
			});
		}
	}

	currentGame.minimumNumberOfPlayers = BGGInput['minplayers'];
	currentGame.maximumNumberOfPlayers = BGGInput['maxplayers'];
	currentGame.minimumPlayingTime = BGGInput['minplaytime'];
	currentGame.maximumPlayingTime = BGGInput['maxplaytime'];
	currentGame.playingTime = BGGInput['playingtime'];
	currentGame.minimumPlayerAge = BGGInput['age'];

	if (BGGInput['boardgamehonor']) {
		for (let award of BGGInput['boardgamehonor']) {
			currentGame.awards.push({
				id: award.objectid,
				name: award.value,
			});
		}
	}

	return currentGame;
}

async function main() {
	const baseURL: string = 'https://api.geekdo.com/xmlapi/boardgame'; // Use XML API see https://boardgamegeek.com/wiki/page/BGG_XML_API for details.

	if (process.argv.length <= 2) {
		console.log('Must send an argumnent for the starting index.');
	} else {
		const START_INDEX: number = Number(process.argv[2]);
		const data: BBGGame[] = [];

		for (
			let mainIndex: number = START_INDEX;
			mainIndex < START_INDEX + 1000;
			mainIndex += 20
		) {
			try {
				let currentURL = baseURL + '/';
				for (let loop: number = 0; loop < 20; loop++) {
					if (loop >= 1) {
						currentURL += ',';
					}
					currentURL += (mainIndex + loop).toString();
				}
				console.log('Reading: ' + currentURL);
				const response = await fetch(currentURL);

				if (response && response.status == 200) {
					const XMLData: string = await response.text();

					// Configure XMLParser
					const alwaysArray = [
						'boardgames.boardgame.name',
						'boardgameaccessory',
						'boardgameartist',
						'boardgamecategory',
						'boardgamedesigner',
						'boardgamedeveloper',
						'boardgameeditor',
						'boardgameexpansion',
						'boardgamefamily',
						'boardgamegraphicdesigner',
						'boardgamehonor',
						'boardgameimplementation',
						'boardgamemechanic',
						'boardgamepublisher',
						'boardgameversion',
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

					if (root && root.boardgames && root.boardgames.boardgame) {
						const boardGame = root.boardgames.boardgame;

						if (!boardGame['error'] && Array.isArray(boardGame)) {
							for (
								let gameIndex: number = 0;
								gameIndex < boardGame.length;
								gameIndex++
							) {
								// non-boardgames, such as RPG Items have this attribute present and set to True
								if (!boardGame[gameIndex].subtypemismatch) {
									let currentGame: BBGGame = processEntry(
										boardGame[gameIndex]
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
						}
					}
				}
			} catch (error) {
				console.log('Error: ' + error);
			}
		}

		// Export the data
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
