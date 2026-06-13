import { WORDBANK } from './wordbank.js';
import { state } from './state.js';

function getBracket(attribute, value) {
    const brackets = WORDBANK[attribute];
    return brackets.find(b => value >= b.range[0] && value <= b.range[1]) || brackets[0];
}

function getRandomTerm(bracket) {
    const difficulty = state.dialogueDifficulty || 'beginner';
    let termPool = [];

    const hasBeginner = bracket.beginner && bracket.beginner.length > 0;
    const hasSommelier = bracket.sommelier && bracket.sommelier.length > 0;

    if (difficulty === 'beginner' && hasBeginner) {
        termPool = bracket.beginner;
    } else if (difficulty === 'sommelier' && hasSommelier) {
        termPool = bracket.sommelier;
    } else if (difficulty === 'intermediate') {
        // 50/50 blend, with fallback if one is empty
        if (Math.random() < 0.5 && hasBeginner) {
            termPool = bracket.beginner;
        } else if (hasSommelier) {
            termPool = bracket.sommelier;
        } else if (hasBeginner) { // Fallback to beginner if sommelier was chosen but empty
            termPool = bracket.beginner;
        }
    }

    // If the chosen pool was empty, fall back to the other, then to a generic term.
    if (termPool.length === 0) {
        if (hasSommelier) termPool = bracket.sommelier;
        else if (hasBeginner) termPool = bracket.beginner;
        else return "balanced"; // Final fallback
    }

    return termPool[Math.floor(Math.random() * termPool.length)];
}

function generateFlavorDescriptor(attribute, range) {
    const brackets = WORDBANK[attribute];
    let minBracket = getBracket(attribute, range.min);
    let maxBracket = getBracket(attribute, range.max);

    const minBracketIndex = brackets.indexOf(minBracket);
    if (minBracket.range[0] < range.min && minBracketIndex < brackets.length - 1) {
        minBracket = brackets[minBracketIndex + 1];
    }

    const maxBracketIndex = brackets.indexOf(maxBracket);
    if (maxBracket.range[1] > range.max && maxBracketIndex > 0) {
        maxBracket = brackets[maxBracketIndex - 1];
    }

    // Reconciliation Step: If adjustments cause the brackets to cross over,
    // it means the range is very narrow. The safest description is for the
    // single bracket that contains the midpoint of the requested range.
    if (brackets.indexOf(minBracket) > brackets.indexOf(maxBracket)) {
        const midPoint = (range.min + range.max) / 2;
        const midBracket = getBracket(attribute, midPoint);
        minBracket = midBracket;
        maxBracket = midBracket;
    }

    const minWord = getRandomTerm(minBracket);

    if (minBracket === maxBracket) {
        return minWord;
    } else {
        const maxWord = getRandomTerm(maxBracket);
        const templates = [
            `ranging from ${minWord} to ${maxWord}`,
            `somewhere between ${minWord} and ${maxWord}`,
        ];
        return templates[Math.floor(Math.random() * templates.length)];
    }
}

function generateGenericDescriptor(attribute) {
    // Pick a word from a balanced, middle-of-the-road bracket.
    const brackets = WORDBANK[attribute];
    const midBracket = brackets[4]; // Index 4 is the 41-50 range, which is usually 'balanced'.
    return getRandomTerm(midBracket);
}

export function generateContractFlavorText(contract) {
    const greetings = ["Greetings", "Salutations", "Hello there", "A moment of your time"];
    const greeting = greetings[Math.floor(Math.random() * greetings.length)];
    const intros = [
        "I'm in need of a special wine.",
        "I'm searching for a particular vintage.",
        "I have a specific request for a client.",
        "I'm hoping you can help me with a unique order."
    ];
    const intro = intros[Math.floor(Math.random() * intros.length)];
    const closings = [
        "Can you help?",
        "Do you have anything that fits?",
        "I'd be most grateful.",
        "I await your finest work."
    ];
    const closing = closings[Math.floor(Math.random() * closings.length)];

    const requiredAttributes = Object.keys(contract.targets);
    if (requiredAttributes.length === 0) {
        return `${greeting}! I'm looking for a well-balanced wine. ${closing}`;
    }

    // Generate all descriptor strings first
    const descriptors = {};
    const attributeOrder = ['sw', 'ac', 'tn', 'bd'];
    attributeOrder.forEach(attr => {
        if (contract.targets[attr]) {
            descriptors[attr] = generateFlavorDescriptor(attr, contract.targets[attr]);
        }
    });

    // --- Sentence Builder ---
    const sentenceTemplates = [
        // Template 1: "I'm looking for a wine that..."
        (descs) => {
            let phrases = [];
            attributeOrder.forEach(attr => {
                if (descs[attr]) {
                    const descriptor = descs[attr];
                    const isMultiWord = descriptor.includes(' ');
                    let phrase = "";
                    if (attr === 'sw') {
                        phrase = `is ${descriptor}`;
                    } else if (attr === 'ac') {
                        phrase = isMultiWord ? `has an acidity ${descriptor}` : `has ${/^[aeiou]/.test(descriptor) ? 'an' : 'a'} ${descriptor} acidity`;
                    } else if (attr === 'tn') {
                        phrase = isMultiWord ? `has a structure ${descriptor}` : `has ${/^[aeiou]/.test(descriptor) ? 'an' : 'a'} ${descriptor} structure`;
                    } else if (attr === 'bd') {
                        phrase = isMultiWord ? `has a body ${descriptor}` : `has ${/^[aeiou]/.test(descriptor) ? 'an' : 'a'} ${descriptor} body`;
                    }
                    phrases.push(phrase);
                }
            });
            if (phrases.length === 1) return `I'm looking for a wine that ${phrases[0]}`;
            const last = phrases.pop();
            return `I'm looking for a wine that ${phrases.join(', ')}, and ${last}`;
        },
        // Template 2: "It should have..."
        (descs) => {
            let phrases = [];
            attributeOrder.forEach(attr => {
                if (descs[attr]) {
                    const descriptor = descs[attr];
                    if (attr === 'sw') phrases.push(`a sweetness that is ${descriptor}`);
                    else if (attr === 'ac') phrases.push(`an acidity described as ${descriptor}`);
                    else if (attr === 'tn') phrases.push(`a tannin profile that is ${descriptor}`);
                    else if (attr === 'bd') phrases.push(`a body that feels ${descriptor}`);
                }
            });
            if (phrases.length === 1) return `It should have ${phrases[0]}`;
            const last = phrases.pop();
            return `It should have ${phrases.join(', ')}, and ${last}`;
        },
        // Template 3: "Prepare me a vintage. I want it to be..."
        (descs) => {
            let phrases = [];
            attributeOrder.forEach(attr => {
                if (descs[attr]) {
                    const descriptor = descs[attr];
                    if (attr === 'sw') phrases.push(`I want it to be ${descriptor}`);
                    else if (attr === 'ac') phrases.push(`the acidity should be ${descriptor}`);
                    else if (attr === 'tn') phrases.push(`the structure must be ${descriptor}`);
                    else if (attr === 'bd') phrases.push(`I'm looking for a body that is ${descriptor}`);
                }
            });
            if (phrases.length === 1) return `Prepare me a vintage. ${phrases[0]}`;
            const last = phrases.pop();
            return `Prepare me a vintage. ${phrases.join('. ')}, and ${last}`;
        }
    ];

    const sentenceBuilder = sentenceTemplates[Math.floor(Math.random() * sentenceTemplates.length)];
    const sentence = sentenceBuilder(descriptors);

    return `${greeting}! ${intro} ${sentence}. ${closing}`;
}