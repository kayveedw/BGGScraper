export class BBGGame {
	bGGid: number;
	name: string | undefined;
	slug: string | undefined;
	description: string | undefined;
	credits: string[] = [];
	classifications: string[] = [];

	constructor(bGGid: number) {
		this.bGGid = bGGid;
	}
}
