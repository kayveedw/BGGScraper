import { Url } from 'url';
type pair = {
	id: number;
	name: string;
};

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
