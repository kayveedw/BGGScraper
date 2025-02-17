export class BBGGame {
	bGGid: number;
	name: string | undefined;
	slug: string | undefined;
	description: string | undefined;
	publishedYear: number | undefined;
	website: URL | undefined;
	rank: number | undefined;
	rating: number | undefined;
	type: string | undefined;
	minimumPlayerAge: number | undefined;
	minimumPlayers: number | undefined;
	maximumPlayers: number | undefined;

	credits: string[] = [];
	classifications: string[] = [];

	constructor(bGGid: number) {
		this.bGGid = bGGid;
	}
}
