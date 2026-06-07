// --- CUSTOM SVG GRAPHICS PIPELINE ---
export function getSeedIcon(key) {
	// ... (Keep existing implementation) ...
	return `
            <svg viewBox="0 0 64 64" class="w-full h-full drop-shadow">
                <path d="M16,48 C16,56 24,58 32,58 C40,58 48,56 48,48 C48,40 46,32 44,24 L20,24 C18,32 16,40 16,48 Z" fill="#8B5A2B" stroke="#593D1F" stroke-width="3" />
                <ellipse cx="32" cy="22" rx="14" ry="4" fill="#a67c52" stroke="#593D1F" stroke-width="2" />
                <path d="M22,22 L18,16" stroke="#593D1F" stroke-width="3" stroke-linecap="round" />
                <path d="M42,22 L46,16" stroke="#593D1F" stroke-width="3" stroke-linecap="round" />
                <circle cx="32" cy="22" r="3" fill="#D2B48C" />
                <g transform="translate(16, 28) scale(0.5)">
                    ${getCropIcon(key)}
                </g>
            </svg>
        `;
}

export function getCropIcon(key) {
	switch (key) {
		case "pinot_noir":
			return `<svg viewBox="0 0 64 64" class="w-full h-full"><circle cx="24" cy="24" r="7" fill="#722F37" /><circle cx="40" cy="24" r="7" fill="#722F37" /><circle cx="32" cy="34" r="7" fill="#722F37" /><circle cx="28" cy="44" r="7" fill="#58111A" /><circle cx="36" cy="44" r="7" fill="#58111A" /><circle cx="32" cy="52" r="6" fill="#3D0A10" /><path d="M32,18 L32,8" stroke="#4A5D23" stroke-width="4" stroke-linecap="round" /><path d="M32,14 Q42,10 44,16" fill="none" stroke="#6B821F" stroke-width="3" /></svg>`;
		case "chardonnay":
			return `<svg viewBox="0 0 64 64" class="w-full h-full"><circle cx="24" cy="24" r="7" fill="#B2C248" /><circle cx="40" cy="24" r="7" fill="#B2C248" /><circle cx="32" cy="34" r="7" fill="#9FB23B" /><circle cx="28" cy="44" r="7" fill="#9FB23B" /><circle cx="36" cy="44" r="7" fill="#879630" /><circle cx="32" cy="52" r="6" fill="#6B7825" /><path d="M32,18 L32,8" stroke="#4A5D23" stroke-width="4" stroke-linecap="round" /><path d="M32,14 Q42,10 44,16" fill="none" stroke="#6B821F" stroke-width="3" /></svg>`;
		case "cabernet":
			return `<svg viewBox="0 0 64 64" class="w-full h-full"><circle cx="24" cy="24" r="7" fill="#311432" /><circle cx="40" cy="24" r="7" fill="#311432" /><circle cx="32" cy="34" r="7" fill="#240E25" /><circle cx="28" cy="44" r="7" fill="#240E25" /><circle cx="36" cy="44" r="7" fill="#1B0A1C" /><circle cx="32" cy="52" r="6" fill="#0F0510" /><path d="M32,18 L32,8" stroke="#4A5D23" stroke-width="4" stroke-linecap="round" /><path d="M32,14 Q42,10 44,16" fill="none" stroke="#6B821F" stroke-width="3" /></svg>`;
		case "muscat":
			return `<svg viewBox="0 0 64 64" class="w-full h-full"><circle cx="24" cy="24" r="7" fill="#FFD700" /><circle cx="40" cy="24" r="7" fill="#FFD700" /><circle cx="32" cy="34" r="7" fill="#E6C300" /><circle cx="28" cy="44" r="7" fill="#E6C300" /><circle cx="36" cy="44" r="7" fill="#CCA300" /><circle cx="32" cy="52" r="6" fill="#B38F00" /><path d="M32,18 L32,8" stroke="#4A5D23" stroke-width="4" stroke-linecap="round" /><path d="M32,14 Q42,10 44,16" fill="none" stroke="#6B821F" stroke-width="3" /></svg>`;
		case "blackberry":
			return `<svg viewBox="0 0 64 64" class="w-full h-full"><circle cx="32" cy="28" r="8" fill="#1C1428" /><circle cx="24" cy="34" r="7" fill="#1C1428" /><circle cx="40" cy="34" r="7" fill="#1C1428" /><circle cx="28" cy="42" r="7" fill="#130D1C" /><circle cx="36" cy="42" r="7" fill="#130D1C" /><circle cx="32" cy="48" r="6" fill="#0B0711" /><path d="M32,20 Q24,14 18,22 Q32,22 32,20" fill="#4A5D23" /><path d="M32,20 Q40,14 46,22 Q32,22 32,20" fill="#4A5D23" /><circle cx="32" cy="18" r="3" fill="#3C4B1C" /></svg>`;
		case "raspberry":
			return `<svg viewBox="0 0 64 64" class="w-full h-full"><circle cx="32" cy="28" r="8" fill="#E30B5C" /><circle cx="24" cy="34" r="7" fill="#E30B5C" /><circle cx="40" cy="34" r="7" fill="#E30B5C" /><circle cx="28" cy="42" r="7" fill="#C30047" /><circle cx="36" cy="42" r="7" fill="#C30047" /><circle cx="32" cy="48" r="6" fill="#A10034" /><path d="M32,20 Q24,14 18,22 Q32,22 32,20" fill="#4A5D23" /><path d="M32,20 Q40,14 46,22 Q32,22 32,20" fill="#4A5D23" /><circle cx="32" cy="18" r="3" fill="#3C4B1C" /></svg>`;
		case "blueberry":
			return `<svg viewBox="0 0 64 64" class="w-full h-full"><circle cx="32" cy="34" r="18" fill="#4682B4" /><circle cx="36" cy="30" r="18" fill="#2E5C8A" opacity="0.4" /><path d="M26,18 L32,24 L38,18 L34,25 L32,21 L30,25 Z" fill="#1C3B5E" /><path d="M32,18 L32,10" stroke="#4A5D23" stroke-width="3" stroke-linecap="round" /></svg>`;
		case "strawberry":
			return `<svg viewBox="0 0 64 64" class="w-full h-full"><path d="M32,14 C16,14 14,34 32,54 C50,34 48,14 32,14 Z" fill="#FF283F" stroke="#CC1125" stroke-width="2" /><circle cx="24" cy="24" r="1.5" fill="#FFD700" /><circle cx="32" cy="24" r="1.5" fill="#FFD700" /><circle cx="40" cy="24" r="1.5" fill="#FFD700" /><circle cx="28" cy="34" r="1.5" fill="#FFD700" /><circle cx="36" cy="34" r="1.5" fill="#FFD700" /><circle cx="32" cy="42" r="1.5" fill="#FFD700" /><path d="M32,14 Q22,4 12,14 Q32,16 32,14" fill="#4A5D23" /><path d="M32,14 Q42,4 52,14 Q32,16 32,14" fill="#4A5D23" /><path d="M32,14 Q32,2 32,14" stroke="#4A5D23" stroke-width="3" stroke-linecap="round" /></svg>`;
		case "elderberry":
			return `<svg viewBox="0 0 64 64" class="w-full h-full"><path d="M32,12 L16,28 M32,12 L48,28 M32,12 L32,34" stroke="#5C1E4E" stroke-width="2.5" /><circle cx="16" cy="28" r="4.5" fill="#3D0C33" /><circle cx="22" cy="34" r="4.5" fill="#3D0C33" /><circle cx="12" cy="36" r="4.5" fill="#290521" /><circle cx="48" cy="28" r="4.5" fill="#3D0C33" /><circle cx="42" cy="34" r="4.5" fill="#3D0C33" /><circle cx="52" cy="36" r="4.5" fill="#290521" /><circle cx="32" cy="34" r="4.5" fill="#3D0C33" /><circle cx="28" cy="42" r="4.5" fill="#290521" /><circle cx="36" cy="42" r="4.5" fill="#290521" /></svg>`;
		case "hops":
			return `<svg viewBox="0 0 64 64" class="w-full h-full"><path d="M32,12 C18,22 22,48 32,54 C42,48 46,22 32,12 Z" fill="#6B821F" stroke="#4A5D23" stroke-width="2" /><path d="M26,24 Q32,30 38,24" fill="none" stroke="#4A5D23" stroke-width="2" /><path d="M22,32 Q32,38 42,32" fill="none" stroke="#4A5D23" stroke-width="2" /><path d="M25,40 Q32,46 39,40" fill="none" stroke="#4A5D23" stroke-width="2" /><path d="M32,12 L32,6" stroke="#4A5D23" stroke-width="3" stroke-linecap="round" /></svg>`;
		case "barley":
			return `<svg viewBox="0 0 64 64" class="w-full h-full"><path d="M32,54 L32,10" stroke="#DAA520" stroke-width="3" stroke-linecap="round" /><path d="M24,18 Q32,24 32,30" fill="none" stroke="#DAA520" stroke-width="3.5" stroke-linecap="round" /><path d="M40,18 Q32,24 32,30" fill="none" stroke="#DAA520" stroke-width="3.5" stroke-linecap="round" /><path d="M22,28 Q32,34 32,40" fill="none" stroke="#DAA520" stroke-width="3.5" stroke-linecap="round" /><path d="M42,28 Q32,34 32,40" fill="none" stroke="#DAA520" stroke-width="3.5" stroke-linecap="round" /><path d="M24,38 Q32,44 32,50" fill="none" stroke="#DAA520" stroke-width="3.5" stroke-linecap="round" /><path d="M40,38 Q32,44 32,50" fill="none" stroke="#DAA520" stroke-width="3.5" stroke-linecap="round" /><path d="M24,18 L16,10" stroke="#DAA520" stroke-width="1.5" stroke-linecap="round" /><path d="M40,18 L48,10" stroke="#DAA520" stroke-width="1.5" stroke-linecap="round" /><path d="M22,28 L12,20" stroke="#DAA520" stroke-width="1.5" stroke-linecap="round" /><path d="M42,28 L52,20" stroke="#DAA520" stroke-width="1.5" stroke-linecap="round" /></svg>`;
		case "wheat":
			return `<svg viewBox="0 0 64 64" class="w-full h-full"><path d="M32,54 L32,10" stroke="#F4D03F" stroke-width="3" stroke-linecap="round" /><path d="M26,16 Q32,20 32,26" fill="none" stroke="#F4D03F" stroke-width="3" stroke-linecap="round" /><path d="M38,16 Q32,20 32,26" fill="none" stroke="#F4D03F" stroke-width="3" stroke-linecap="round" /><path d="M26,26 Q32,30 32,36" fill="none" stroke="#F5B041" stroke-width="3" stroke-linecap="round" /><path d="M38,26 Q32,30 32,36" fill="none" stroke="#F5B041" stroke-width="3" stroke-linecap="round" /><path d="M26,36 Q32,40 32,46" fill="none" stroke="#E67E22" stroke-width="3" stroke-linecap="round" /><path d="M38,36 Q32,40 32,46" fill="none" stroke="#E67E22" stroke-width="3" stroke-linecap="round" /></svg>`;
		case "rye":
			return `<svg viewBox="0 0 64 64" class="w-full h-full"><path d="M32,54 L32,10" stroke="#CD5C5C" stroke-width="2.5" stroke-linecap="round" /><path d="M25,18 L32,24" stroke="#E9967A" stroke-width="3" stroke-linecap="round" /><path d="M39,18 L32,24" stroke="#E9967A" stroke-width="3" stroke-linecap="round" /><path d="M25,28 L32,34" stroke="#CD5C5C" stroke-width="3" stroke-linecap="round" /><path d="M39,28 L32,34" stroke="#CD5C5C" stroke-width="3" stroke-linecap="round" /><path d="M25,38 L32,44" stroke="#A52A2A" stroke-width="3" stroke-linecap="round" /><path d="M39,38 L32,44" stroke="#A52A2A" stroke-width="3" stroke-linecap="round" /></svg>`;
		case "pumpkin":
			return `<svg viewBox="0 0 64 64" class="w-full h-full"><ellipse cx="32" cy="36" rx="18" ry="14" fill="#E67E22" stroke="#D35400" stroke-width="2" /><ellipse cx="32" cy="36" rx="12" ry="14" fill="#F39C12" /><ellipse cx="32" cy="36" rx="5" ry="14" fill="#F5B041" /><path d="M32,22 Q32,12 38,14" fill="none" stroke="#27AE60" stroke-width="3.5" stroke-linecap="round" /></svg>`;
		case "wild_yeast":
			return `<svg viewBox="0 0 64 64" class="w-full h-full"><path d="M26,14 L38,14 L38,22 L44,32 L44,50 Q44,54 40,54 L24,54 Q20,54 20,50 L20,32 L26,22 Z" fill="#EAECEE" stroke="#5D6D7E" stroke-width="2.5" /><path d="M22,34 L42,34 L42,49 Q42,52 39,52 L25,52 Q22,52 22,49 Z" fill="#F5B041" opacity="0.8" /><ellipse cx="32" cy="42" rx="4" ry="4" fill="#FFFFFF" opacity="0.6" /><rect x="25" y="8" width="14" height="6" rx="1.5" fill="#A04000" stroke="#5D6D7E" stroke-width="1.5" /></svg>`;
		case "cacao_nibs":
			return `<svg viewBox="0 0 64 64" class="w-full h-full"><ellipse cx="26" cy="36" rx="8" ry="14" fill="#5C3A21" stroke="#3E2723" stroke-width="2" transform="rotate(-20 26 36)" /><ellipse cx="38" cy="34" rx="7" ry="12" fill="#4E342E" stroke="#3E2723" stroke-width="2" transform="rotate(20 38 34)" /><circle cx="32" cy="44" r="5" fill="#3E2723" /></svg>`;
		case "coffee_beans":
			return `<svg viewBox="0 0 64 64" class="w-full h-full"><ellipse cx="25" cy="32" rx="8" ry="13" fill="#3E2723" stroke="#271510" stroke-width="2.5" transform="rotate(-30 25 32)" /><path d="M20,22 Q27,32 22,42" fill="none" stroke="#271510" stroke-width="1.5" stroke-linecap="round" /><ellipse cx="39" cy="34" rx="8" ry="13" fill="#4E342E" stroke="#271510" stroke-width="2.5" transform="rotate(30 39 34)" /><path d="M34,24 Q41,34 36,44" fill="none" stroke="#271510" stroke-width="1.5" stroke-linecap="round" /></svg>`;
		case "pure_honey":
			return `<svg viewBox="0 0 64 64" class="w-full h-full"><rect x="22" y="20" width="20" height="28" rx="4" fill="#FEF9E7" stroke="#D35400" stroke-width="2.5" /><rect x="24" y="24" width="16" height="20" rx="2" fill="#F39C12" /><path d="M24,14 L40,14 L38,20 L26,20 Z" fill="#F5B041" stroke="#D35400" stroke-width="2" /><rect x="23" y="10" width="18" height="4" rx="1" fill="#A04000" /><circle cx="32" cy="34" r="3" fill="#900C3F" /></svg>`;
		case "coriander_peel":
			return `<svg viewBox="0 0 64 64" class="w-full h-full"><circle cx="32" cy="32" r="16" fill="#F39C12" stroke="#D35400" stroke-width="2" /><path d="M32,16 L32,48 M16,32 L48,32" stroke="#FEF9E7" stroke-width="1.5" /><circle cx="32" cy="32" r="12" fill="none" stroke="#FEF9E7" stroke-width="1.5" stroke-dasharray="4,4" /><circle cx="12" cy="18" r="2.5" fill="#8E44AD" /><circle cx="50" cy="16" r="2" fill="#8E44AD" /><circle cx="48" cy="48" r="3" fill="#8E44AD" /></svg>`;
		default:
			return `<svg viewBox="0 0 64 64" class="w-full h-full"><circle cx="32" cy="32" r="16" fill="#DAA520"/></svg>`;
	}
}

// Custom Dynamic SVG Renderer for Labels
function renderCustomLabelSVG(cx, cy, width, customLabel) {
	if (!customLabel) return "";
	const {bgShape, borderStyle, crestId, bgColor, crestColor} = customLabel;

	let bgElement = "";
	let borderAttrs = borderStyle === "none" ? "" : `stroke="${crestColor}" stroke-width="${borderStyle === "double" ? "1.5" : "1"}" ${borderStyle === "dashed" ? 'stroke-dasharray="2,2"' : ""}`;

	const rx = width / 2;
	const ry = width / 2;

	if (bgShape === "oval") {
		bgElement = `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${bgColor}" ${borderAttrs} />`;
		if (borderStyle === "double") {
			bgElement += `<ellipse cx="${cx}" cy="${cy}" rx="${rx - 2.5}" ry="${ry - 2.5}" fill="none" stroke="${crestColor}" stroke-width="0.5" />`;
		}
	} else if (bgShape === "shield") {
		bgElement = `<path d="M${cx - rx},${cy - ry} L${cx + rx},${cy - ry} L${cx + rx},${cy} Q${cx + rx},${cy + ry} ${cx},${cy + ry} Q${cx - rx},${cy + ry} ${cx - rx},${cy} Z" fill="${bgColor}" ${borderAttrs} />`;
	} else {
		// rect
		bgElement = `<rect x="${cx - rx}" y="${cy - ry}" width="${width}" height="${width}" rx="1" fill="${bgColor}" ${borderAttrs} />`;
		if (borderStyle === "double") {
			bgElement += `<rect x="${cx - rx + 2}" y="${cy - ry + 2}" width="${width - 4}" height="${width - 4}" rx="0.5" fill="none" stroke="${crestColor}" stroke-width="0.5" />`;
		}
	}

	let crestElement = "";
	const cRadius = width * 0.35;
	if (crestId === "star") {
		crestElement = `<polygon points="${cx},${cy - cRadius} ${cx + cRadius * 0.3},${cy - cRadius * 0.3} ${cx + cRadius},${cy - cRadius * 0.3} ${cx + cRadius * 0.4},${cy + cRadius * 0.2} ${cx + cRadius * 0.6},${cy + cRadius} ${cx},${cy + cRadius * 0.5} ${cx - cRadius * 0.6},${cy + cRadius} ${cx - cRadius * 0.4},${cy + cRadius * 0.2} ${cx - cRadius},${cy - cRadius * 0.3} ${cx - cRadius * 0.3},${cy - cRadius * 0.3}" fill="${crestColor}" />`;
	} else if (crestId === "crown") {
		crestElement = `<path d="M${cx - cRadius},${cy - cRadius / 2} L${cx - cRadius / 2},${cy + cRadius / 2} L${cx},${cy - cRadius / 2} L${cx + cRadius / 2},${cy + cRadius / 2} L${cx + cRadius},${cy - cRadius / 2} L${cx + cRadius * 0.8},${cy + cRadius} L${cx - cRadius * 0.8},${cy + cRadius} Z" fill="${crestColor}" />`;
	} else if (crestId === "grape") {
		crestElement = `<circle cx="${cx}" cy="${cy - cRadius / 2}" r="${cRadius / 2.5}" fill="${crestColor}"/><circle cx="${cx - cRadius / 2.5}" cy="${cy}" r="${cRadius / 2.5}" fill="${crestColor}"/><circle cx="${cx + cRadius / 2.5}" cy="${cy}" r="${cRadius / 2.5}" fill="${crestColor}"/><circle cx="${cx}" cy="${cy + cRadius / 2}" r="${cRadius / 2.5}" fill="${crestColor}"/>`;
	} else if (crestId === "leaf") {
		crestElement = `<path d="M${cx},${cy + cRadius} Q${cx - cRadius},${cy} ${cx},${cy - cRadius} Q${cx + cRadius},${cy} ${cx},${cy + cRadius}" fill="${crestColor}" />`;
	} else if (crestId === "droplet") {
		crestElement = `<path d="M${cx},${cy - cRadius} Q${cx + cRadius},${cy} ${cx},${cy + cRadius / 2} A${cRadius * 0.8},${cRadius * 0.8} 0 0,1 ${cx - cRadius * 0.8},${cy + cRadius / 2} Q${cx - cRadius},${cy} ${cx},${cy - cRadius}" fill="${crestColor}" />`;
	} else if (crestId === "diamond") {
		crestElement = `<polygon points="${cx},${cy - cRadius} ${cx + cRadius * 0.8},${cy} ${cx},${cy + cRadius} ${cx - cRadius * 0.8},${cy}" fill="${crestColor}" />`;
	}

	return `<g class="custom-label drop-shadow-md">${bgElement}${crestElement}</g>`;
}

export function getWineIcon(recipeKey, qualityKey, customLabel = null) {
	let bottleColor = "#3A1F13";
	let liquidColor = "#900C3F";
	let labelColor = "#FFF";
	let labelEmblem = "";

	switch (recipeKey) {
		case "chardonnay":
			bottleColor = "#A4B584";
			liquidColor = "#F4D03F";
			labelColor = "#FEF9E7";
			labelEmblem = `<rect x="28" y="36" width="8" height="8" rx="1" fill="#D4AC0D"/>`;
			break;
		case "pinot_noir":
			bottleColor = "#4D1C1B";
			liquidColor = "#C0392B";
			labelColor = "#F9EBEA";
			labelEmblem = `<circle cx="32" cy="40" r="4" fill="#78281F"/>`;
			break;
		case "cabernet":
			bottleColor = "#1F1212";
			liquidColor = "#58111A";
			labelColor = "#EAECEE";
			labelEmblem = `<path d="M28,38 L36,38 L32,44 Z" fill="#5B2C6F"/>`;
			break;
		case "muscat":
			bottleColor = "#E59866";
			liquidColor = "#F39C12";
			labelColor = "#FDEBD0";
			labelEmblem = `<circle cx="32" cy="40" r="3" fill="#D35400"/><circle cx="30" cy="38" r="2.5" fill="#E67E22"/>`;
			break;
		case "summer_rose":
			bottleColor = "#EAECEE";
			liquidColor = "#F1948A";
			labelColor = "#FDEDEC";
			labelEmblem = `<path d="M32,36 Q34,40 32,44 Q30,40 32,36" fill="#EC7063"/>`;
			break;
		case "blackberry_port":
			bottleColor = "#1C0A35";
			liquidColor = "#2E1156";
			labelColor = "#EBDEF0";
			labelEmblem = `<circle cx="32" cy="40" r="4.5" fill="#4A235A"/>`;
			break;
		case "royal_gold":
			bottleColor = "#F4D03F";
			liquidColor = "#D4AC0D";
			labelColor = "#FEF9E7";
			labelEmblem = `<polygon points="32,35 35,40 32,45 29,40" fill="#9A7D0A"/>`;
			break;
		case "elder_blue":
			bottleColor = "#212F3D";
			liquidColor = "#1F618D";
			labelColor = "#EAF2F8";
			labelEmblem = `<path d="M30,37 L34,37 L32,43 Z" fill="#2471A3"/>`;
			break;
		case "imperial_velvet":
			bottleColor = "#1B2631";
			liquidColor = "#4A154B";
			labelColor = "#D5F5E3";
			labelEmblem = `<path d="M32,35 L36,39 L32,43 L28,39 Z" fill="#FFD700"/>`;
			break;
		case "fruit_cider":
			bottleColor = "#D35400";
			liquidColor = "#E67E22";
			labelColor = "#FCF3CF";
			labelEmblem = `<circle cx="32" cy="40" r="4" fill="#BA4A00"/>`;
			break;
		case "house_red":
		default:
			bottleColor = "#2C3E50";
			liquidColor = "#78281F";
			labelColor = "#F2F4F4";
			labelEmblem = `<rect x="30" y="38" width="4" height="4" fill="#A9DFBF"/>`;
			break;
	}

	let ribbonColor = "#BDC3C7";
	if (qualityKey === "s") ribbonColor = "#A855F7";
	else if (qualityKey === "a") ribbonColor = "#EAB308";
	else if (qualityKey === "b") ribbonColor = "#3B82F6";
	else if (qualityKey === "c") ribbonColor = "#94A3B8";
	else if (qualityKey === "vinegar") ribbonColor = "#475569";

	// Inject Custom Label logic
	let activeLabelElement = customLabel ? renderCustomLabelSVG(32, 39.5, 14, customLabel) : `<rect x="25" y="32" width="14" height="15" rx="1.5" fill="${labelColor}" stroke="#1A1008" stroke-width="1.2" />${labelEmblem}`;

	return `
            <svg viewBox="0 0 64 64" class="w-full h-full drop-shadow">
                <path d="M28,10 L36,10 L36,18 L42,24 Q46,30 46,38 L46,50 Q46,54 42,54 L22,54 Q18,54 18,50 L18,38 Q18,30 22,24 L28,18 Z" fill="${bottleColor}" stroke="#1A1008" stroke-width="2.5" />
                <path d="M20,38 Q32,36 44,38 L44,49 Q44,52 41,52 L23,52 Q20,52 20,49 Z" fill="${liquidColor}" opacity="0.85" />
                ${activeLabelElement}
                <rect x="27.5" y="7" width="9" height="4" rx="1" fill="#7E5109" stroke="#1A1008" stroke-width="1.5" />
                <path d="M28,19 L36,19 L38,22 L26,22 Z" fill="${ribbonColor}" stroke="#1A1008" stroke-width="1" />
            </svg>
        `;
}

export function getBeerIcon(beerKey, customLabel = null) {
	let liquidColor = "#F1C40F";
	let cupStyle = "mug";
	let crestColor = "#D35400";

	switch (beerKey) {
		case "wheat_beer":
			liquidColor = "#F5B041";
			cupStyle = "stein";
			crestColor = "#E67E22";
			break;
		case "golden_ale":
			liquidColor = "#F1C40F";
			cupStyle = "bottle";
			crestColor = "#F4D03F";
			break;
		case "bitter_ipa":
			liquidColor = "#BA4A00";
			cupStyle = "stein";
			crestColor = "#27AE60";
			break;
		case "belgian_witbier":
			liquidColor = "#F4D03F";
			cupStyle = "stein";
			crestColor = "#3498DB";
			break;
		case "spiced_rye_ipa":
			liquidColor = "#D35400";
			cupStyle = "stein";
			crestColor = "#E67E22";
			break;
		case "wild_sour_ale":
			liquidColor = "#9B59B6";
			cupStyle = "bottle";
			crestColor = "#8E44AD";
			break;
		case "pumpkin_spice_ale":
			liquidColor = "#E67E22";
			cupStyle = "stein";
			crestColor = "#D35400";
			break;
		case "imperial_honey_braggot":
			liquidColor = "#F1C40F";
			cupStyle = "stein";
			crestColor = "#F39C12";
			break;
		case "blackberry_stout":
		case "double_espresso_stout":
			liquidColor = "#1B1212";
			cupStyle = "mug";
			crestColor = "#6C3483";
			break;
		default:
			break;
	}

	if (cupStyle === "mug") {
		let activeLabel = customLabel ? renderCustomLabelSVG(31, 34, 10, customLabel) : `<rect x="27" y="30" width="8" height="8" rx="1" fill="${crestColor}" opacity="0.9" /><circle cx="31" cy="34" r="2.5" fill="#FFFFFF" opacity="0.5"/>`;
		return `
                <svg viewBox="0 0 64 64" class="w-full h-full drop-shadow">
                    <path d="M42,24 C48,24 50,28 50,34 C50,40 48,44 42,44" fill="none" stroke="#BDC3C7" stroke-width="5" stroke-linecap="round"/>
                    <rect x="18" y="16" width="26" height="38" rx="4" fill="#ECF0F1" stroke="#95A5A6" stroke-width="2.5" />
                    <rect x="21" y="22" width="20" height="30" rx="1" fill="${liquidColor}" />
                    <path d="M16,16 Q20,10 26,14 Q32,10 38,14 Q44,10 48,16 Q44,20 32,18 Q20,20 16,16 Z" fill="#FFFFFF" stroke="#BDC3C7" stroke-width="1.2" />
                    <line x1="24" y1="26" x2="24" y2="46" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" opacity="0.6"/>
                    ${activeLabel}
                </svg>
            `;
	} else if (cupStyle === "stein") {
		let activeLabel = customLabel ? renderCustomLabelSVG(32, 33, 10, customLabel) : `<circle cx="32" cy="33" r="4.5" fill="${crestColor}" /><circle cx="32" cy="33" r="2" fill="#FFFFFF" opacity="0.6" />`;
		return `
                <svg viewBox="0 0 64 64" class="w-full h-full drop-shadow">
                    <path d="M18,14 Q24,6 32,10 Q40,6 46,14 Q42,18 32,16 Q22,18 18,14 Z" fill="#FFFFFF" stroke="#D5D8DC" stroke-width="1.2" />
                    <path d="M22,14 L42,14 L38,52 L26,52 Z" fill="#EAEDED" stroke="#7F8C8D" stroke-width="2" />
                    <path d="M24,18 L40,18 L36,50 L28,50 Z" fill="${liquidColor}" />
                    <line x1="28" y1="28" x2="36" y2="28" stroke="#FFFFFF" stroke-width="1.5" opacity="0.5" />
                    <line x1="29" y1="38" x2="35" y2="38" stroke="#FFFFFF" stroke-width="1.5" opacity="0.5" />
                    ${activeLabel}
                </svg>
            `;
	} else {
		let activeLabel = customLabel ? renderCustomLabelSVG(32, 39, 12, customLabel) : `<rect x="25" y="32" width="14" height="14" rx="2" fill="#FEF9E7" stroke="#3D2510" stroke-width="1.2" /><circle cx="32" cy="39" r="4" fill="${crestColor}"/>`;
		return `
                <svg viewBox="0 0 64 64" class="w-full h-full drop-shadow">
                    <path d="M27,10 L37,10 L37,20 L42,26 L42,54 L22,54 L22,26 L27,20 Z" fill="#5E3A1A" stroke="#3D2510" stroke-width="2.5" />
                    <rect x="24" y="28" width="16" height="24" fill="${liquidColor}" opacity="0.8"/>
                    ${activeLabel}
                    <rect x="26.5" y="7" width="11" height="4" rx="1" fill="#F4D03F" stroke="#3D2510" stroke-width="1.5" />
                </svg>
            `;
	}
}
