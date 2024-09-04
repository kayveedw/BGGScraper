import { Url } from 'url';
type pair = {
	id: number;
	name: string;
};

export class BGGGame {
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
