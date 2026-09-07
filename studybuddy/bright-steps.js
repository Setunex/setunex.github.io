// app.js: UI glue for the dynamic quiz
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

	const subjects = ['math', 'physics'];

	function initSubjects() {
		subjects.forEach(s => {
			const opt = document.createElement('option');
			opt.value = s;
			opt.textContent = s;
			subjectSelect.appendChild(opt);
		});
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
		const q = QuizGenerator.generateQuestion(subj, diff);
		// keep a short session history to avoid repetition beyond generator's pattern guard
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
	// auto-generate initial question
	window.addEventListener('load', () => setTimeout(newQuestion, 100));
})();
