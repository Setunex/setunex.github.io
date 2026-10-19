/*
  generator.js
  - Produces dynamic, parameterized questions across subjects
  - Avoids repeating recent patterns using localStorage
  - Exposes `generateQuestion(subject, difficulty)` that returns a question object
*/
(function (global) {
	const STORAGE_KEY = 'quiz_recent_patterns_v1';
	const RECENT_LIMIT = 100;

	function randInt(min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}
	function sample(arr) {
		return arr[Math.floor(Math.random() * arr.length)];
	}

	const templates = {
		math: [
			{
				id: 'arith_sum_ab',
				difficulty: 'easy',
				pattern: 'two-term-sum',
				text: 'Let a={{a}} and b={{b}}. Compute a + b.',
				generator: ({ a, b }) => a + b,
				params: () => ({ a: randInt(1, 30), b: randInt(1, 30) })
			},
			{
				id: 'arith_prod_series',
				difficulty: 'medium',
				pattern: 'product-series',
				text: 'Compute the product of the integers from {{a}} to {{b}} (inclusive).',
				generator: ({ a, b }) => {
					let p = 1;
					for (let i = a; i <= b; i++) p *= i;
					return p;
				},
				params: () => {
					const a = randInt(2, 5);
					const b = a + randInt(1, 3);
					return { a, b };
				}
			},
			{
				id: 'algebra_linear',
				difficulty: 'medium',
				pattern: 'linear-solve',
				text: 'Solve for x: {{A}}x + {{B}} = {{C}}.',
				generator: ({ A, B, C }) => (C - B) / A,
				params: () => {
					const A = randInt(2, 9);
					const x = randInt(1, 12);
					const B = randInt(-10, 10);
					const C = A * x + B;
					return { A, B, C };
				}
			},
			{
				id: 'combinatorics_choose',
				difficulty: 'hard',
				pattern: 'n-choose-k',
				text: 'How many ways to choose {{k}} items from {{n}} items?',
				generator: ({ n, k }) => {
					function C(n, k) {
						if (k < 0 || k > n) return 0;
						k = Math.min(k, n - k);
						let r = 1;
						for (let i = 1; i <= k; i++) {
							r = (r * (n + 1 - i)) / i;
						}
						return r;
					}
					return C(n, k);
				},
				params: () => {
					const n = randInt(5, 12);
					const k = randInt(1, Math.min(5, n - 1));
					return { n, k };
				}
			}
		],
		physics: [
			{
				id: 'kinematic_basic',
				difficulty: 'medium',
				pattern: 'kinematic-1d',
				text: 'An object accelerates at {{a}} m/s^2 from rest for {{t}} s. What is its final velocity (m/s)?',
				generator: ({ a, t }) => a * t,
				params: () => ({ a: [2, 3, 5, 9][randInt(0, 3)], t: randInt(2, 8) })
			}
		],
		general: [
			{
				id: 'concept_def',
				difficulty: 'easy',
				pattern: 'define-term',
				text: 'Which statement best defines: {{term}}?',
				generator: ({ term, correct }) => correct,
				params: subject => {
					const bank = {
						math: [
							{ term: 'Prime number', correct: 'An integer greater than 1 with no positive divisors other than 1 and itself.' },
							{ term: 'Rational number', correct: 'A number expressible as the ratio of two integers.' }
						],
						physics: [{ term: 'Velocity', correct: 'Rate of change of displacement with respect to time.' }]
					};
					const list = bank[subject] || [].concat(bank.math);
					return sample(list);
				}
			}
		]
	};

	function loadRecent() {
		try {
			return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
		} catch (e) {
			return [];
		}
	}
	function saveRecent(arr) {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(arr.slice(-RECENT_LIMIT)));
	}
	function addRecent(pattern) {
		const arr = loadRecent();
		arr.push({ pattern, ts: Date.now() });
		saveRecent(arr);
	}
	function recentlyUsed(pattern, windowMs = 1000 * 60 * 60 * 24) {
		const arr = loadRecent();
		const cutoff = Date.now() - windowMs;
		return arr.some(v => v.pattern === pattern && v.ts > cutoff);
	}

	function buildChoices(correctValue) {
		// Build a small multiple-choice set for numeric or textual answers.
		const choices = new Set();
		choices.add(String(correctValue));
		if (typeof correctValue === 'number') {
			const base = Number(correctValue);
			while (choices.size < 4) {
				const delta = Math.max(1, Math.round(Math.abs(base) * 0.15));
				const cand = base + randInt(-3, 3) * delta + randInt(-2, 2);
				choices.add(String(cand));
			}
		} else {
			// textual: make some naive distractors by truncation/alternate phrasing
			choices.add(correctValue + ' (precise)');
			choices.add('A different plausible statement');
			while (choices.size < 4) choices.add('Distractor ' + Math.floor(Math.random() * 100));
		}
		return Array.from(choices).sort(() => Math.random() - 0.5);
	}

	function pickTemplate(subject, difficulty) {
		const list = (templates[subject] || []).concat(templates.general || []);
		const filtered = list.filter(t => {
			if (!t.difficulty) return true;
			if (difficulty === 'hard') return true;
			if (difficulty === 'medium') return t.difficulty !== 'easy' ? t.difficulty !== 'easy' || true : true;
			return t.difficulty === difficulty;
		});
		// prefer templates not recently used
		for (let i = 0; i < 10; i++) {
			const cand = sample(filtered);
			if (!recentlyUsed(cand.pattern, 1000 * 60 * 60)) return cand;
		}
		return sample(filtered);
	}

	function generateQuestion(subject = 'math', difficulty = 'medium') {
		const t = pickTemplate(subject, difficulty);
		const params = typeof t.params === 'function' ? t.params(subject) : t.params || {};
		const answer = t.generator(params);
		// render text
		let text = t.text;
		for (const k in params) text = text.replace(new RegExp('{{' + k + '}}', 'g'), params[k]);
		// ensure pattern diversity
		addRecent(t.pattern);
		const choices = buildChoices(answer);
		return {
			id: t.id + '-' + Date.now(),
			pattern: t.pattern,
			subject,
			difficulty,
			text,
			params,
			choices,
			answer: String(answer)
		};
	}

	global.QuizGenerator = { generateQuestion, templates };
})(window);
