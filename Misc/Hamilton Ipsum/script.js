const text = [
	`I am not throwing away my shot.
I’m just like my country, I’m young, scrappy and hungry.
And I’m not throwing away my shot!`,

	`Rise up! When you’re living on your knees, you rise up.
Tell your brother that he’s got to rise up.
Tell your sister that she’s got to rise up.`,

	`Look around, look around at how lucky we are to be alive right now.
History is happening in Manhattan and we just happen to be
in the greatest city in the world.`,

	`I’m past patiently waitin’.
I’m passionately mashin’ every expectation.
Every action’s an act of creation, I’m laughin’ in the face of casualties and sorrow.`,

	`The world turned upside down.
No one is safe in a time like this.
We’ll get a little place in Harlem and we’ll figure it out.`,

	`How does a ragtag volunteer army in need of a shower
somehow defeat a global superpower?
How do we emerge victorious from the quagmire?`,

	`I’ve been readin’ Common Sense by Thomas Paine.
So men say that I’m intense or I’m insane.
You want a revolution? I want a revelation.`,

	`My dearest Angelica,
Tomorrow there’ll be more of us.
Heaven help the men who come.`,

	`Who lives, who dies, who tells your story?
When you’re gone, who remembers your name?
We’ll tell your story.`,

	`Legacy. What is a legacy?
It’s planting seeds in a garden you never get to see.
I wrote some notes at the beginning of time.`,

	`The doctor put his hands up.
He was turning away.
He took an oath in the army,
But he never took a swing.`,

	`You have no control—who lives, who dies, who tells your story?
No control.`,

	`I’m erasing myself from the narrative.
Let future historians wonder how Eliza
reacted when you broke her heart.`,

	`They think me Macbeth,
And me a peerless praise.`,

	`Why do you assume you’re the smartest in the room?
Soon that attitude may be your doom.`,

	`He looked at me like I was stupid.
I’m so blue I’m only thirty-two.`,

	`If this is the end of me,
at least I have a friendship with you.`,

	`Took up for me a man who’s just like me.
I looked at him like he was a friend.`,

	`I will send a fully armed battalion
to remind you of my love!`,

	`Cry, cry, cry.
You’ll never find anyone as trusting or as kind,
so unconditionally devoted, so dangerously undaunted.`,

	`How does a bastard, orphan,
son of a whore and a Scotsman,
dropped in the middle of a forgotten spot
in the Caribbean, by providence,
impoverished, in squalor, grow up to be a hero and a scholar?`,

	`Talk less.
Smile more.
Don’t let them know what you’re against
or what you’re for.`,

	`Demand satisfaction. No dueling necessary if they apologize.
If they don’t apologize, pick a second.
Have your seconds negotiate peace.
Aim no higher than the dueler’s eye.`,

	`Look into your eyes and the sky’s the limit.
I’m down for the count and I’m drownin’ in ‘em.
That boy is mine, that boy is mine.
I’m helpless.`,

	`In the eye of a hurricane,
there is quiet for just a moment, a yellow sky.
When I was seventeen a hurricane destroyed my town.
I didn’t drown. I couldn’t seem to die.`,

	`I don’t say no to this.
Show me how to say no to this,
‘cause I don’t know how to say no to this.`,

	`Life, liberty and the pursuit of happiness.
We fought for these ideals; we shouldn’t settle for less.
These are wise words, enterprising men quote ’em.
Don’t act surprised, you guys, ’cause I wrote ’em.`,

	`One last time.
Relax, have a drink with me, one last time.
Let’s teach ’em how to say goodbye,
To say goodbye, to say goodbye, one last time.`,

	`Adieu, best of wives and best of women.
Embrace all my darling children for me.`,

	`Thomas Jefferson’s coming home.
Sir, you’ve been off in Paris for so long.
So what’d I miss?
Headfirst into a political abyss!`,

	`Chaos and bloodshed are not a solution.
Don’t let them lead you astray.
This Congress does not speak for me.`,

	`A winter’s ball and the Schuyler sisters are the envy of all.
Yo, if you can marry a sister, you’re rich son.
Is it a question of if, Burr, or which one?`,

	`Lee, do you yield?
You shot him in the side.
Yes, he yields!`,

	`Eliza, do you like it uptown?
It’s quiet uptown.
He is trying to do the unimaginable.
See them walking in the park, long after dark.`,

	`British Admiral Howe’s got troops on the water.
Thirty-two thousand troops in New York harbor.
We gotta make an all-out stand.
Ayo, I’m gonna need a right-hand man.`,

	`Meet the latest graduate of King’s College!
I prob’ly shouldn’t brag, but, dag, I amaze and astonish.
I shoulder his legacy with pride.
Ensemble: Blow us all away!`,

	`It must be nice, it must be nice to have Washington on your side.
Every action has its equal opposite reaction.
Look in his eyes, see how he lies.
Follow the money and see where it goes.`,

	`The issue on the table: France is on the verge of war with England.
Remember, my decision on this matter is not subject to congressional approval.
Secretary Jefferson, you have the floor, sir.`,

	`John Adams? I know him. That can’t be.
That’s that little guy who spoke to me all those years ago.
“President John Adams”? Good luck!`,

	`Mr. Vice President… Senator Burr…
We have the check stubs, from separate accounts.
To a Mr. James Reynolds way back in seventeen ninety-one.
Is that what you have? Are you done?`,
];

function shuffleCopy(arr) {
	const a = arr.slice();
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
}

const form = document.querySelector(".form");
const amount = document.getElementById("amount");
const result = document.querySelector(".text");

const MIN_BLOCKS = 2;
const MAX_BLOCKS = 3;

form.addEventListener("submit", function (e) {
	e.preventDefault();

	let paraCount = parseInt(amount.value, 10);
	if (isNaN(paraCount) || paraCount < 1) paraCount = 1;

	// shuffle once
	let pool = shuffleCopy(text);
	let pointer = 0;
	let html = "";

	for (let i = 0; i < paraCount; i++) {
		// pick a random block count for this paragraph
		const blockCount = Math.floor(Math.random() * (MAX_BLOCKS - MIN_BLOCKS + 1)) + MIN_BLOCKS;

		// if we’d run past the pool, re‑shuffle & reset
		if (pointer + blockCount > pool.length) {
			pool = shuffleCopy(text);
			pointer = 0;
		}

		const blocks = pool.slice(pointer, pointer + blockCount);
		pointer += blockCount;

		html += `<p class="result">${blocks.join("\n\n")}</p>`;
	}

	result.innerHTML = html;
});
