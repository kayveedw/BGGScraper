import { existsSync, readFileSync, writeFile } from 'fs';

const maxID: number = 429191;
const country: string = 'uk';
const baseURL: string = 'https://api.geekdo.com/api/amazon/textads?objecttype=thing&locale=' + country + '&objectid=';

async function getAmazonURL(bBGID: number): Promise<string> {
	try {
		let currentURL: string = baseURL + bBGID;

		let response = await fetch(currentURL);
		if (response) {
			while (response.status == 429) {
				if (response.headers.get('Retry-After')) {
					await new Promise((resolve) =>
						setTimeout(resolve, 1000 * Number(response.headers.get('Retry-After')))
					);
					response = await fetch(currentURL);
				}
			}
			if (response.status == 200) {
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
		}

		return '';
	} catch (error) {
		console.log('bBGID = ' + bBGID + ' Error: ' + error);
		await new Promise((resolve) => setTimeout(resolve, 1000));

		return '';
	}
}

async function main() {
	process.argv.push('.\\data\\AmazonLinks.json');
	if (process.argv.length <= 2) {
		console.log('Must send an argumnent for input/output file.');
	} else {
		const DATA_FILE: string = process.argv[2];

		// Load previous results
		let bGGID2AmazonMapping: Map<number, string> = new Map<number, string>();

		if (existsSync(DATA_FILE)) {
			let fileData = JSON.parse(readFileSync(DATA_FILE, 'utf8'));

			if (fileData) {
				Object.entries(fileData).forEach((item) => {
					bGGID2AmazonMapping.set(Number(item[0]), String(item[1]));
				});
			}
		}

		// Start with highest numbers and work down
		for (let index: number = maxID; index >= 1; index--) {
			if (!bGGID2AmazonMapping.has(index)) {
				let url: string = await getAmazonURL(index);
				console.log(index + ': ' + url);
				if (url) {
					bGGID2AmazonMapping.set(index, url);
				}
			}
			if (index % 1000 == 0) {
				outputData(DATA_FILE, bGGID2AmazonMapping);
			}
		}
		outputData(DATA_FILE, bGGID2AmazonMapping);
	}

	function outputData(DATA_FILE: string, bGGID2AmazonMapping: Map<number, string>) {
		writeFile(DATA_FILE, JSON.stringify(Object.fromEntries(bGGID2AmazonMapping)), (err) => {
			if (err) {
				console.log('err = ' + err);
			}
		});
	}
}

main();
