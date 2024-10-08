import { debug } from 'console';
import { writeFile } from 'fs';

const maxID: number = 428089;
const country: string = 'uk';
const baseURL: string = 'https://api.geekdo.com/api/amazon/textads?objecttype=thing&locale=' + country + '&objectid=';

async function getAmazonURL(bBGID: number): Promise<string> {
	try {
		let currentURL: string = baseURL + bBGID;

		const response = await fetch(currentURL);

		if (response && response.status == 200) {
			const data: string = await response.text();

			let result = JSON.parse(data);
			if (result && result.uk && result.uk.url) {
				let url: URL = new URL(result.uk.url);
				let search: string = url.search;
				if (search != '') {
					let position: number = url.href.indexOf(search);
					url.href = url.href.substring(0, position);
				}
				return url.href;
			}
		}
		return '';
	} catch (error) {
		console.log('Error: ' + error);
		return '';
	}
}

async function main() {
	let bGGID2AmazonMapping = new Map<number, string>();

	for (let index: number = 1; index <= maxID; index++) {
		// let startIndex = 167791;
		// for (let index: number = startIndex; index <= startIndex + 100; index++) {
		let url: string = await getAmazonURL(index);
		if (url) {
			console.log(index + ': ' + url);
			bGGID2AmazonMapping.set(index, url);
		}
	}
	writeFile('./data/AmazonLinks.json', JSON.stringify(Object.fromEntries(bGGID2AmazonMapping)), (err) => {
		if (err) {
			console.log('err = ' + err);
		}
	});
}

main();
