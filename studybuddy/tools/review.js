// Simple review UI: loads abc_mapping.csv, shows images and word, allows flagging and CSV export
(function () {
	const params = new URLSearchParams(location.search);
	const source = params.get('source') || '';
	const MAPPING = source === 'openmoji' ? './abc_mapping_openmoji.csv' : './abc_mapping.csv';
	const grid = document.getElementById('grid');
	const countEl = document.getElementById('count');
	let rows = [];

	async function load() {
		const res = await fetch(MAPPING);
		const txt = await res.text();
		parseCSV(txt);
		render();
	}

	function parseCSV(txt) {
		const lines = txt.split(/\r?\n/).filter(Boolean);
		if (lines.length <= 1) return;
		const headers = lines[0].split(',').map(h => h.trim());
		rows = lines.slice(1).map(l => {
			// naive CSV split, mapping file is simple
			const parts = l.split(',');
			return { word: parts[0], svg: parts[1], emoji: parts[2] || '', flagged: false };
		});
	}

	function render() {
		grid.innerHTML = '';
		rows.forEach((r, i) => {
			const card = document.createElement('div');
			card.className = 'card';
			const img = document.createElement('img');
			img.src = r.svg;
			img.alt = r.word;
			img.onerror = () => {
				img.style.opacity = 0.6;
				img.style.filter = 'grayscale(60%)';
			};
			const w = document.createElement('div');
			w.className = 'word';
			w.textContent = r.word;
			const meta = document.createElement('div');
			meta.className = 'meta';
			meta.textContent = r.emoji || '';
			const btn = document.createElement('button');
			btn.className = 'flag';
			btn.textContent = 'Flag';
			btn.addEventListener('click', () => {
				r.flagged = !r.flagged;
				btn.classList.toggle('flagged', r.flagged);
				btn.textContent = r.flagged ? 'Flagged' : 'Flag';
				updateCount();
			});
			card.appendChild(img);
			card.appendChild(w);
			card.appendChild(meta);
			card.appendChild(btn);
			grid.appendChild(card);
		});
		updateCount();
	}

	function updateCount() {
		countEl.textContent = rows.length + ' / ' + rows.filter(r => r.flagged).length + ' flagged';
	}

	function downloadCSV() {
		const hdr = ['word', 'svg', 'emoji', 'flagged'];
		const out = [hdr.join(',')].concat(rows.map(r => [escapeCsv(r.word), escapeCsv(r.svg), escapeCsv(r.emoji || ''), r.flagged ? '1' : '0'].join(',')));
		const blob = new Blob([out.join('\n')], { type: 'text/csv;charset=utf-8' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'abc_mapping_with_flags.csv';
		document.body.appendChild(a);
		a.click();
		a.remove();
		URL.revokeObjectURL(url);
	}

	function escapeCsv(s) {
		if (s == null) return '';
		const need = /[",\n]/.test(s);
		if (need) return '"' + s.replace(/"/g, '""') + '"';
		return s;
	}

	document.getElementById('download').addEventListener('click', downloadCSV);
	document.getElementById('selectAll').addEventListener('click', () => {
		rows.forEach(r => (r.flagged = true));
		render();
	});
	document.getElementById('clearAll').addEventListener('click', () => {
		rows.forEach(r => (r.flagged = false));
		render();
	});

	load().catch(e => {
		grid.innerHTML = '<div style="padding:18px">Error loading mapping: ' + e.message + '</div>';
		console.error(e);
	});
})();
