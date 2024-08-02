import fetch from 'node-fetch';
import { parse } from 'node-html-parser';

import { writeFile } from 'fs';

const baseURL: string = 'https://boardgamegeek.com/boardgame/';

for (let index: number = 276182; index <= 276182; index++) {
	// for (let index: number = 1; index <= 58000; index++) {
	const response = await fetch(baseURL + '/' + index.toString());

	// const headers = await response.headers.raw();
	const data = await response.text();

	// writeFile('./output.html', data, (err) => {
	// 	console.log(err);
	// });

	// console.log(headers);
	// console.log(data);

	const root = parse(data);
	// console.log(root);

	const scripts = root.querySelectorAll('script');
	console.log(scripts);

	// const canonical = root.querySelector("link[rel='canonical']");
	// if (canonical?.getAttribute('href')) {
	// 	const url: string = canonical.getAttribute('href')!;
	// 	// console.log(url);
	// 	const response2 = await fetch(url);

	// 	// const headers = await response.headers.raw();
	// 	const data2 = await response2.text();
	// 	// console.log(data2);
	writeFile('./output276182.js', scripts.toString(), (err) => {
		console.log('err = ' + err);
	});
	// }
}
