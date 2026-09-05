// app.js: UI glue for the dynamic quiz (copied from Cards)
(function () {
	const subjectSelect = document.getElementById('subjectSelect');
	const difficultySelect = document.getElementById('difficultySelect');
	const newBtn = document.getElementById('newBtn');
	const questionArea = document.getElementById('questionArea');
	const questionText = document.getElementById('questionText');
	const choicesDiv = document.getElementById('choices');
	const showAnswerBtn = document.getElementById('showAnswerBtn');
	const nextBtn = document.getElementById('nextBtn');
	const answerArea = document.getElementById('answerArea');
	const patternLabel = document.getElementById('patternLabel');
	const checkUpdatesBtn = document.getElementById('checkUpdatesBtn');
	const updateNotice = document.getElementById('updateNotice');
	const reloadBtn = document.getElementById('reloadBtn');

	const subjects = ['math', 'physics'];

	function initSubjects() {
		subjects.forEach(s => {
			const opt = document.createElement('option');
			opt.value = s;
			opt.textContent = s;
			subjectSelect.appendChild(opt);
		});
	}

	// Remote question bank (templates.json) stored in localStorage under 'remote_questions'
	function loadRemoteQuestions() {
		try {
			return JSON.parse(localStorage.getItem('remote_questions') || '[]');
		} catch (e) {
			return [];
		}
	}
	function saveRemoteQuestions(arr) {
		localStorage.setItem('remote_questions', JSON.stringify(arr || []));
	}

	async function fetchAndCacheTemplates() {
		try {
			const resp = await fetch('./templates.json');
			if (!resp.ok) throw new Error('templates fetch failed');
			const data = await resp.json();
			// cache in SW runtime cache for offline use
			try {
				const c = await caches.open('dynquiz-runtime-v1');
				await c.put('./templates.json', new Response(JSON.stringify(data)));
			} catch (e) {}
			saveRemoteQuestions(data);
			return data;
		} catch (err) {
			console.warn('fetchAndCacheTemplates failed', err);
			return null;
		}
	}

	function showQuestion(q) {
		questionArea.classList.remove('hidden');
		questionText.textContent = q.text;
		patternLabel.textContent = q.pattern;
		choicesDiv.innerHTML = '';
		q.choices.forEach(c => {
			const btn = document.createElement('button');
			btn.className = 'choice';
			btn.textContent = c;
			btn.addEventListener('click', () => {
				const correct = c === q.answer;
				btn.classList.add(correct ? 'correct' : 'wrong');
				answerArea.classList.remove('hidden');
				answerArea.textContent = correct ? 'Correct!' : `Incorrect — answer: ${q.answer}`;
			});
			choicesDiv.appendChild(btn);
		});
		answerArea.classList.add('hidden');
		answerArea.textContent = '';
	}

	function newQuestion() {
		const subj = subjectSelect.value || 'math';
		const diff = difficultySelect.value || 'medium';
		// Prefer remote questions sometimes if available
		const remote = loadRemoteQuestions();
		let q;
		if (remote && remote.length && Math.random() < 0.4) {
			q = remote[Math.floor(Math.random() * remote.length)];
		} else {
			q = QuizGenerator.generateQuestion(subj, diff);
		}
		sessionStorage.setItem('lastQuestion', JSON.stringify(q));
		showQuestion(q);
	}

	newBtn.addEventListener('click', newQuestion);
	showAnswerBtn.addEventListener('click', () => {
		const q = JSON.parse(sessionStorage.getItem('lastQuestion') || 'null');
		if (!q) return;
		answerArea.classList.remove('hidden');
		answerArea.textContent = 'Answer: ' + q.answer;
	});
	nextBtn.addEventListener('click', newQuestion);

	initSubjects();
	// Wire update / SW lifecycle handlers
	window.addEventListener('load', () => {
		setTimeout(newQuestion, 100);

		// load cached remote questions if available
		const rem = loadRemoteQuestions();
		if (rem && rem.length) console.log('Loaded remote question bank', rem.length);

		if ('serviceWorker' in navigator) {
			navigator.serviceWorker.getRegistration().then(reg => {
				if (!reg) return;
				reg.addEventListener('updatefound', () => {
					const newSW = reg.installing;
					newSW.addEventListener('statechange', () => {
						if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
							// new SW installed and waiting to activate
							updateNotice.style.display = 'inline';
						}
					});
				});
			});
		}
	});

	// Check updates button
	if (checkUpdatesBtn) {
		checkUpdatesBtn.addEventListener('click', async () => {
			checkUpdatesBtn.textContent = 'Checking...';
			await fetchAndCacheTemplates();
			checkUpdatesBtn.textContent = 'Check for updates';
			alert('Templates refreshed (if remote available)');
		});
	}
	if (reloadBtn) {
		reloadBtn.addEventListener('click', () => window.location.reload());
	}
})();
