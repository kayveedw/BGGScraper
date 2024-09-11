export type pair = {
	id: number;
	name: string;
};

export class BGGGame {
	id: number;
	name: string = '';
	slug: string | undefined;
	image?: URL;
	shortDescription: string = '';
	description: string = '';
	website?: URL;
	rank?: number;
	rating?: number;
	designers: pair[] = [];
	graphicDesigners: pair[] = [];
	sculptors: pair[] = [];
	artists: pair[] = [];
	publishers: pair[] = [];
	publishedYear?: number;
	developers: pair[] = [];
	editors: pair[] = [];
	writers: pair[] = [];
	insertDesigner: pair[] = [];
	baseGames: pair[] = [];
	expansions: pair[] = [];
	accessories: pair[] = [];
	versions: pair[] = [];
	type: string = '';
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
