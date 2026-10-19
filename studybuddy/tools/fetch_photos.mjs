#!/usr/bin/env node
// Builds abc_photos.js (word -> realistic photo URL) from Wikipedia lead images.
// Usage: node tools/fetch_photos.mjs   (re-run after adding words; prints unresolved words)
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HTML = path.join(ROOT, 'abc-adventure-fullscreen.html');
const OUT = path.join(ROOT, 'abc_photos.js');

// Evaluate the DATA / EXTRA / CATS block from the page (stops before PALETTE).
const src = fs.readFileSync(HTML, 'utf8');
const start = src.indexOf('const DATA = {');
const end = src.indexOf('const PALETTE');
const { DATA } = vm.runInNewContext(src.slice(start, end) + '\n;({ DATA })');

const PHOTO_CATS = new Set(['fruits', 'vegetables', 'animals', 'birds', 'vehicles', 'food', 'things', 'clothes']);
const NATURE_OK = new Set(
	'Moon,Mountain,Tree,Flower,Rainbow,Sun,Cloud,Leaf,Lake,River,Ocean,Waterfall,Volcano,Desert,Forest,Beach,Snow,Rain,Rose,Tulip,Sunflower,Lotus,Cactus,Daisy,Island,Cave,Lightning,Tornado,Planet,Earth,Hill,Wave,Sand,Stone,Rock,Sunrise,Sunset,Fire,Dew,Seed,Wood,Galaxy,Plant,Pond,Grass,Umbrella,Nest'.split(
		','
	)
);
const SKIP = new Set(['Unicorn', 'Lentil Soup', 'Vegetable Soup', 'Grilled Cheese', 'Wagon']);

// Wikipedia article titles where the plain word is ambiguous or not the common-noun article.
const TITLE = {
	'Bell Pepper': 'Bell pepper',
	Brinjal: 'Eggplant',
	Capsicum: 'Bell pepper',
	Corn: 'Maize',
	Beans: 'Bean',
	'Green Beans': 'Green bean',
	Peas: 'Pea',
	Squash: 'Squash (plant)',
	'Sweet Potato': 'Sweet potato',
	Lime: 'Lime (fruit)',
	Kiwi: 'Kiwifruit',
	Orange: 'Orange (fruit)',
	Mandarin: 'Mandarin orange',
	'Star Fruit': 'Carambola',
	Chilli: 'Chili pepper',
	Mint: 'Mentha',
	Yam: 'Yam (vegetable)',
	'Bitter Gourd': 'Momordica charantia',
	Almonds: 'Almond',
	Bear: 'Brown bear',
	Cow: 'Cattle',
	Fox: 'Red fox',
	Peacock: 'Indian peafowl',
	Turkey: 'Turkey (bird)',
	Ladybug: 'Coccinellidae',
	Hippo: 'Hippopotamus',
	Rhino: 'Rhinoceros',
	Panda: 'Giant panda',
	'X-ray Fish': 'X-ray tetra',
	Fly: 'Housefly',
	Hen: 'Chicken',
	Panther: 'Black panther',
	Seal: 'Harbor seal',
	Worm: 'Earthworm',
	Buffalo: 'Water buffalo',
	Bison: 'American bison',
	Pigeon: 'Rock dove',
	Robin: 'European robin',
	Seagull: 'Gull',
	Rooster: 'Chicken',
	Bike: 'Motorcycle',
	Airplane: 'Airplane',
	Plane: 'Airplane',
	'Dumper Truck': 'Dump truck',
	'Fire Truck': 'Fire engine',
	Jet: 'Jet aircraft',
	Scooter: 'Motor scooter',
	Crane: 'Crane (machine)',
	'Cable Car': 'Aerial tramway',
	Metro: 'Rapid transit',
	'Police Car': 'Police car',
	'Race Car': 'Formula One car',
	Donut: 'Doughnut',
	Momos: 'Momo (food)',
	Tacos: 'Taco',
	Burger: 'Hamburger',
	Egg: 'Chicken egg',
	'Hot Dog': 'Hot dog',
	Biscuit: 'Biscuit',
	Cookie: 'Cookie',
	'Alarm Clock': 'Alarm clock',
	Battery: 'Electric battery',
	Dustbin: 'Waste container',
	Frame: 'Picture frame',
	Fan: 'Hand fan',
	Jigsaw: 'Jigsaw puzzle',
	Key: 'Key (lock)',
	Keyboard: 'Computer keyboard',
	'Light Bulb': 'Incandescent light bulb',
	Lock: 'Lock (security device)',
	'Mobile Phone': 'Mobile phone',
	Needle: 'Sewing needle',
	'Oil Lamp': 'Oil lamp',
	Plate: 'Plate (dishware)',
	'Paint Brush': 'Paintbrush',
	Parcel: 'Parcel (package)',
	Ring: 'Ring (jewellery)',
	Racket: 'Racket (sports equipment)',
	Sofa: 'Couch',
	Sponge: 'Sponge (tool)',
	Table: 'Table (furniture)',
	Torch: 'Flashlight',
	Wand: 'Magic wand',
	Boots: 'Boot',
	Cap: 'Baseball cap',
	Gloves: 'Glove',
	Pants: 'Trousers',
	Shoes: 'Shoe',
	Socks: 'Sock',
	Sandals: 'Sandal',
	Saree: 'Sari',
	Tie: 'Necktie',
	Wave: 'Wind wave',
	Stone: 'Rock (geology)',
	Rock: 'Rock (geology)',
	Earth: 'Earth',
	Hill: 'Hill',
	Sun: 'Sun',
	Moon: 'Moon',
	Squash: 'Butternut squash',
	Mint: 'Peppermint',
	Asparagus: 'White asparagus',
	Dosa: 'Dosai',
	Shark: 'Tiger shark',
	Daisy: 'Bellis perennis',
	Kangaroo: 'Red kangaroo',
	Lotus: 'Nelumbo nucifera',
	Nuts: 'Nut (fruit)',
	'Polar Bear': 'Polar bear',
	Purse: 'Handbag',
	'Race Car': 'Formula One',
	Shorts: 'Bermuda shorts',
	Sparrow: 'House sparrow',
	Tent: 'Camping',
	Ticket: 'Ticket (admission)',
	Toast: 'Toast (food)',
	Vada: 'Medu vada',
	Vest: 'Waistcoat'
};

const jobs = [];
for (const L of Object.keys(DATA)) {
	for (const [cat, list] of Object.entries(DATA[L])) {
		if (!PHOTO_CATS.has(cat) && cat !== 'nature') continue;
		for (const [word] of list) {
			if (SKIP.has(word) || (cat === 'nature' && !NATURE_OK.has(word))) continue;
			if (!jobs.some(j => j.word === word)) jobs.push({ word, title: TITLE[word] || word });
		}
	}
}

const photos = {};
if (fs.existsSync(OUT)) {
	const w = {};
	vm.runInNewContext(fs.readFileSync(OUT, 'utf8'), { window: w });
	Object.assign(photos, w.ABC_PHOTOS);
}
const failed = [];
const report = [];
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function resolve({ word, title }) {
	if (photos[word]) return;
	const url = 'https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(title.replace(/ /g, '_'));
	for (let attempt = 0; attempt < 6; attempt++) {
		try {
			await sleep(250);
			const res = await fetch(url, { headers: { 'User-Agent': 'setunex-abc-adventure/1.0 (educational flashcards)' } });
			if (res.status === 404) return failed.push(`${word}: no article "${title}"`);
			if (res.status === 429) {
				await sleep(3000 * (attempt + 1));
				continue;
			}
			if (!res.ok) throw new Error('HTTP ' + res.status);
			const d = await res.json();
			const img = d.thumbnail && d.thumbnail.source;
			if (d.type !== 'standard' || !img) return failed.push(`${word}: ${d.type === 'standard' ? 'no image' : d.type} ("${d.title}")`);
			if (/\.svg(\.png)?$/i.test(img)) return failed.push(`${word}: diagram/svg only ("${d.title}")`);
			photos[word] = img;
			return report.push(`${word} -> ${d.title} [${d.description || ''}]`);
		} catch (e) {
			if (attempt === 5) return failed.push(`${word}: ${e.message}`);
			await sleep(1000 * (attempt + 1));
		}
	}
	failed.push(`${word}: rate limited`);
}

const queue = jobs.slice();
await Promise.all(
	Array.from({ length: 2 }, async () => {
		while (queue.length) await resolve(queue.shift());
	})
);

const sorted = Object.fromEntries(Object.entries(photos).sort(([a], [b]) => a.localeCompare(b)));
fs.writeFileSync(OUT, '// Generated by tools/fetch_photos.mjs - do not edit.\nwindow.ABC_PHOTOS = ' + JSON.stringify(sorted, null, '\t') + ';\n');
fs.writeFileSync(path.join(ROOT, 'tools', 'photo_report.txt'), report.sort().join('\n') + '\n\nUNRESOLVED\n' + failed.sort().join('\n') + '\n');
console.log(`Resolved ${Object.keys(photos).length}/${jobs.length}; unresolved ${failed.length}. See tools/photo_report.txt`);
