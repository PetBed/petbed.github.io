/**
 * Recursively traverses a MathJSON object and adds a unique `id` property
 * to every array that represents an expression. This is crucial for tracking nodes
 * for interactivity.
 * @param {any} json - The MathJSON object or primitive.
 * @returns {any} The MathJSON object with added IDs.
 */
const addIdsToMathJson = (json) => {
    if (Array.isArray(json)) {
        const head = json[0];
        const originalArgs = json.slice(1);
        let metadata = {};

        // Correctly separate arguments from a potential metadata object
        if (originalArgs.length > 0 && typeof originalArgs[originalArgs.length - 1] === 'object' && !Array.isArray(originalArgs[originalArgs.length - 1])) {
            metadata = originalArgs[originalArgs.length - 1];
        }

        // Add an ID to the metadata
        if (!metadata.id) {
            metadata.id = Math.random().toString(36).substr(2, 9);
        }

        const args = metadata.id ? originalArgs.slice(0, -1) : originalArgs;
        // Recurse on arguments only
        const newArgs = args.map(addIdsToMathJson);

        return [head, ...newArgs, metadata];
    }
    return json; // Primitives (numbers, strings) are returned as is.
};

/**
 * Parses the raw output from a MathLive field, structures it for the app,
 * and prepares it by adding unique IDs for tracking.
 * @param {any} rawJson - The raw value from mathfield.getValue('math-json').
 * @returns {object} An equation object like { left: MathJSON[], right: MathJSON[] }.
 */
export const parseAndPrepareEquation = (rawJson) => {
    let mathJson = rawJson;
    if (typeof rawJson === 'string') {
        try { mathJson = JSON.parse(rawJson); } catch (e) { mathJson = null; }
    }

    if (!mathJson) {
        return { left: [], right: [] };
    }

    const normalize = (node) => {
        if (!node) return [];
        const withIds = addIdsToMathJson(node);

        // If the node is a single expression (an array whose first element is a string operator),
        // wrap it in an outer array to represent a list containing one expression.
        if (Array.isArray(withIds) && typeof withIds[0] === 'string' && withIds[0] !== 'Sequence') {
            return [withIds];
        }
        // Otherwise, it's either a primitive (which we wrap in an array) or already a 
        // sequence of expressions (which we return as is).
        return Array.isArray(withIds) ? withIds : [withIds]; // This now correctly handles sequences and primitives.
    };

    let result;
    if (Array.isArray(mathJson) && mathJson[0] === 'Equal') {
        result = {
            left: normalize(mathJson[1]),
            right: normalize(mathJson[2]),
        };
    } else {
        // Handle cases where there's no equals sign.
        result = {
            left: normalize(mathJson),
            right: [],
        };
    }
    return result;
};

/**
 * Recursively creates a deep copy of a MathJSON object, removing any metadata objects
 * that were added for internal tracking. This prepares the JSON for external libraries
 * like the Compute Engine.
 * @param {any} json - The ID-augmented MathJSON object.
 * @returns {any} A clean MathJSON object.
 */
export const stripIdsFromMathJson = (json) => {
    if (Array.isArray(json)) {
        const head = json[0];
        let args = json.slice(1);

        // Check for our metadata object and remove it if it exists.
        if (args.length > 0 && typeof args[args.length - 1] === 'object' && !Array.isArray(args[args.length - 1])) {
            args.pop();
        }

        // Recurse on the actual arguments.
        const newArgs = args.map(stripIdsFromMathJson);
        return [head, ...newArgs];
    }
    return json; // Primitives are returned as is.
};

/**
 * Finds the name of the first variable encountered in a MathJSON tree.
 * @param {any} json - The MathJSON object.
 * @returns {string|null} The variable name (e.g., 'x') or null.
 */
export const findVariableName = (json) => {
    if (Array.isArray(json)) {
        // Start loop at 0 to traverse all elements of a sequence or expression.
        for (let i = 0; i < json.length; i++) {
            const name = findVariableName(json[i]);
            if (name) return name;
        }
    } else if (typeof json === 'string' && /^[a-zA-Z]$/.test(json)) {
        return json;
    }
    return null;
};

/**
 * Checks if a MathJSON tree contains a given variable.
 * @param {any} json - The MathJSON object.
 * @param {string} varName - The variable name to search for.
 * @returns {boolean}
 */
export const containsVariable = (json, varName) => {
    return JSON.stringify(json).includes(`"${varName}"`);
};

/**
 * Recursively traverses a MathJSON tree, applying a library of algebraic rules
 * at each node to find all possible transformations (actions).
 * @param {Array} json - The ID-augmented MathJSON array.
 * @param {string} side - The side of the equation ('left' or 'right').
 * @param {string} varName - The name of the variable we are solving for.
 * @param {object} ce - An instance of the Compute Engine.
 * @param {Array} actions - The array to push found actions into.
 */
const findActionsRecursive = (json, side, varName, ce, actions) => {
    if (!Array.isArray(json)) return; // Base case for primitives

    const head = json[0];
    const originalArgs = json.slice(1);
    const metadata = (originalArgs.length > 0 && typeof originalArgs[originalArgs.length - 1] === 'object' && !Array.isArray(originalArgs[originalArgs.length - 1])) ? originalArgs[originalArgs.length - 1] : {};

    // Create a version of args without the metadata object for checks. This is a safer, non-mutating pattern.
    const args = metadata.id ? originalArgs.slice(0, -1) : originalArgs;

    console.log(`[findActionsRecursive] Visiting node (id: ${metadata.id}, side: ${side}) -> Head: ${head}`, { args });

    // --- PATTERN 1: SIMPLIFICATION ---
    // An operation is simplifiable if all its arguments are numbers.
    const isSimplifiable = args.length > 0 && args.every(arg => typeof arg === 'number');
    if (isSimplifiable && head !== 'Sequence') {
        const cleanJson = stripIdsFromMathJson(json);
        const simplified = ce.box(cleanJson).evaluate();
        // Check if simplification actually changed the value
        if (simplified.json !== null && typeof simplified.json === 'number' && simplified.json.toString() !== ce.box(cleanJson).latex) {
            console.log(`[findActionsRecursive]   - >>> ACTION FOUND: SIMPLIFY to ${simplified.json}`);
            actions.push({ type: 'simplify', nodeId: metadata.id, to: simplified.json, side });
        }
    }

    // --- ALGEBRAIC PATTERNS (require a variable) ---
    if (varName) {
        // PATTERN 2: ISOLATE A TERM
        // Looks for `(var term) + (const term)` or `(const term) + (var term)`.
        if ((head === 'Add' || head === 'Subtract') && args.length === 2) {
            const [arg1, arg2] = args;
            const arg1HasVar = containsVariable(arg1, varName);
            const arg2HasVar = containsVariable(arg2, varName);

            if (arg1HasVar && !arg2HasVar) { // e.g., (2x) + 8 or (2x) - 8
                console.log(`[findActionsRecursive]   - >>> ACTION FOUND: ISOLATE term:`, arg2);
                actions.push({ type: 'isolate', side, op: head, termNode: arg2, nodeId: metadata.id });
            }
            if (!arg1HasVar && arg2HasVar && head === 'Add') { // e.g., 8 + (2x)
                console.log(`[findActionsRecursive]   - >>> ACTION FOUND: ISOLATE term:`, arg1);
                actions.push({ type: 'isolate', side, op: head, termNode: arg1, nodeId: metadata.id });
            }
        }

        // PATTERN 3: DIVIDE BY COEFFICIENT
        // Looks for `(coefficient) * (var term)`.
        if (head === 'Multiply' && args.length === 2) {
            const [arg1, arg2] = args;
            const arg1IsNum = typeof arg1 === 'number';
            const arg2IsNum = typeof arg2 === 'number';

            if ((containsVariable(arg1, varName) && arg2IsNum) || (containsVariable(arg2, varName) && arg1IsNum)) {
                const coefficient = arg1IsNum ? arg1 : arg2;
                console.log(`[findActionsRecursive]   - >>> ACTION FOUND: DIVIDE by coefficient:`, coefficient);
                actions.push({ type: 'divide', side, coefficient, nodeId: metadata.id });
            }
        }

        // PATTERN 4: MULTIPLY BY DENOMINATOR
        // Looks for `(var term) / (denominator)`.
        if (head === 'Divide' && args.length === 2) {
            const [numerator, denominator] = args;
            if (containsVariable(numerator, varName) && typeof denominator === 'number') {
                console.log(`[findActionsRecursive]   - >>> ACTION FOUND: MULTIPLY_BY_DENOMINATOR:`, denominator);
                actions.push({ type: 'multiply_by_denominator', side, denominator, nodeId: metadata.id });
            }
        }
    }
    
    // --- RECURSE ON CHILDREN ---
    // After checking the current node, traverse into its children to find more actions.
    for (const arg of args) {
        findActionsRecursive(arg, side, varName, ce, actions);
    }
};

/**
 * Analyzes an equation and finds all possible valid algebraic actions.
 * @param {object} equation - The equation object with `left` and `right` MathJSON.
 * @param {object} ce - An instance of the Compute Engine.
 * @returns {Array<object>} An array of action objects.
 */
export const findAllActions = (equation, ce) => {
    if (!equation || !ce) {
        console.log('[findAllActions] Aborting: Equation or Compute Engine is missing.');
        return [];
    }
    console.log('[findAllActions] Analyzing equation:', JSON.parse(JSON.stringify(equation)));
    const actions = [];
    
    const varName = findVariableName(equation.left) || findVariableName(equation.right);
    console.log(`[findAllActions] Found variable: "${varName}"`);

    for (const node of equation.left) {
        findActionsRecursive(node, 'left', varName, ce, actions);
    }
    for (const node of equation.right) {
        findActionsRecursive(node, 'right', varName, ce, actions);
    }
    console.log(`[findAllActions] Finished. Total actions found: ${actions.length}`);
    return actions;
};

/**
 * Recursively finds a node by its ID in a MathJSON tree and replaces it.
 * @returns {any} The modified tree.
 */
const findAndReplace = (json, nodeId, replacement) => {
    if (!Array.isArray(json)) return json;

    const head = json[0];
    let args = json.slice(1);
    let metadata = {};

    if (args.length > 0 && typeof args[args.length - 1] === 'object' && !Array.isArray(args[args.length - 1])) {
        metadata = args.pop();
    }

    if (metadata.id === nodeId) {
        return replacement;
    }

    const newArgs = args.map(arg => findAndReplace(arg, nodeId, replacement));

    return [head, ...newArgs, metadata];
};

/**
 * Creates a new equation state by applying a given action.
 * @param {object} equation - The current equation state.
 * @param {object} action - The action to perform.
 * @returns {object} The new equation state.
 */
export const performAction = (equation, action) => {
    const newEquation = JSON.parse(JSON.stringify(equation)); // Deep clone

    if (action.type === 'simplify') {
        const sideToUpdate = action.side;
        // Using .flatMap because the replacement of a node might result in its parent array being flattened.
        const updatedSide = newEquation[sideToUpdate].map(node => findAndReplace(node, action.nodeId, action.to));
        newEquation[sideToUpdate] = updatedSide.filter(n => n !== null); // Clean up any nulls from replacement
    }

    if (action.type === 'isolate') {
        const { side, op, termNode } = action;
        const otherSide = side === 'left' ? 'right' : 'left';

        // 1. Find the term to keep on the variable side
        const varSideRoot = newEquation[side][0];
        let args = varSideRoot.slice(1);
        if (typeof args[args.length - 1] === 'object') args.pop(); // remove metadata
        const termToKeep = args.find(arg => JSON.stringify(arg) !== JSON.stringify(termNode));
        
        // 2. Replace the variable side with only the term to keep
        newEquation[side] = [termToKeep];

        // 3. Construct the new constant side
        const oppositeOp = op === 'Add' ? 'Subtract' : 'Add';
        const currentConstSide = newEquation[otherSide];
        const constSideNode = currentConstSide.length > 1 ? ['Sequence', ...currentConstSide] : currentConstSide[0];
        
        newEquation[otherSide] = [addIdsToMathJson([oppositeOp, constSideNode, termNode])];
    }

    if (action.type === 'divide') {
        const { side, coefficient } = action;
        const otherSide = side === 'left' ? 'right' : 'left';

        // 1. Find the variable name
        const varName = findVariableName(equation);

        // 2. Replace var side with just the variable name
        newEquation[side] = [varName];

        // 3. Update other side to be a division
        const currentConstSide = newEquation[otherSide];
        const constSideNode = currentConstSide.length > 1 ? ['Sequence', ...currentConstSide] : currentConstSide[0];
        newEquation[otherSide] = [addIdsToMathJson(['Divide', constSideNode, coefficient])];
    }

    if (action.type === 'multiply_by_denominator') {
        const { side, denominator } = action;
        const otherSide = side === 'left' ? 'right' : 'left';

        // 1. Find the numerator of the division expression
        const varSideRoot = newEquation[side][0];
        const numerator = varSideRoot[1]; // In ['Divide', numerator, denominator]

        // 2. Replace var side with just the numerator
        newEquation[side] = [numerator];

        // 3. Update other side to be a multiplication
        const currentConstSide = newEquation[otherSide];
        const constSideNode = currentConstSide.length > 1 ? ['Sequence', ...currentConstSide] : currentConstSide[0];
        newEquation[otherSide] = [addIdsToMathJson(['Multiply', constSideNode, denominator])];
    }

    // Ensure all parts of the new equation have IDs for the next step
    newEquation.left = newEquation.left.map(node => addIdsToMathJson(node));
    newEquation.right = newEquation.right.map(node => addIdsToMathJson(node));

    return newEquation;
};