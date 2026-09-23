import { minimalSetup } from "codemirror";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { foldGutter, foldKeymap, foldNodeProp, foldService, HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { EditorState, RangeSetBuilder, StateField } from "@codemirror/state";
import { Decoration, EditorView, WidgetType, keymap } from "@codemirror/view";
import { tags } from "@lezer/highlight";

var markdownHighlightStyle = HighlightStyle.define([
	{ tag: [tags.punctuation, tags.bracket, tags.operator], color: "var(--note-markdown-marker-color)", fontWeight: "600" },
	{ tag: tags.contentSeparator, color: "var(--note-markdown-marker-color)", fontWeight: "600" },
	{ tag: tags.emphasis, color: "var(--note-markdown-emphasis-color)" },
	{ tag: tags.strong, color: "var(--note-markdown-emphasis-color)", fontWeight: "700" }
]);

var indentationMarkdownParser = markdownLanguage.parser.configure({
	props: [foldNodeProp.add({
		BulletList: function () { return null; },
		OrderedList: function () { return null; },
		Table: function () { return null; }
	})]
});

function indentationWidth(text) {
	var match = text.match(/^[ \t]*/);
	return (match ? match[0] : "").replace(/\t/g, "  ").length;
}

function getMarkdownFoldRange(state, lineStart) {
	var line = state.doc.lineAt(lineStart);
	var heading = line.text.match(/^(#{1,6})\s+/);
	var currentIndent = indentationWidth(line.text);
	var currentHeadingLevel = heading ? heading[1].length : null;
	var isListItem = /^(?:\s*)(?:[-*+]|\d+[.)])\s+/.test(line.text);
	var hasIndentedChildren = false;
	var endLine = line.number;

	for (var lineNumber = line.number + 1; lineNumber <= state.doc.lines; lineNumber++) {
		var nextLine = state.doc.line(lineNumber);
		var nextHeading = nextLine.text.match(/^(#{1,6})\s+/);
		if (currentHeadingLevel !== null && nextHeading && nextHeading[1].length <= currentHeadingLevel) break;
		if (currentHeadingLevel === null) {
			if (!nextLine.text.trim()) {
				if (hasIndentedChildren) endLine = lineNumber;
				continue;
			}
			if (indentationWidth(nextLine.text) <= currentIndent) break;
			hasIndentedChildren = true;
		}
		endLine = lineNumber;
	}

	if (currentHeadingLevel === null && !isListItem && currentIndent === 0 && !hasIndentedChildren) return null;
	if (endLine <= line.number) return null;
	var end = state.doc.line(endLine).to;
	return { from: line.to, to: end };
}

var markdownFoldService = foldService.of(function (state, lineStart) {
	return getMarkdownFoldRange(state, lineStart);
});

function createFoldMarker(open) {
	var element = document.createElement("span");
	element.className = `cm-markdown-fold-marker${open ? " is-open" : " is-collapsed"}`;
	element.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7"></path></svg>';
	element.setAttribute("aria-label", open ? "Collapse section" : "Expand section");
	return element;
}

class MarkdownBulletWidget extends WidgetType {
	toDOM() {
		var element = document.createElement("span");
		element.className = "cm-md-list-marker cm-md-bullet-marker";
		element.textContent = "•";
		element.setAttribute("aria-hidden", "true");
		return element;
	}
}

class MarkdownNumberWidget extends WidgetType {
	constructor(number) {
		super();
		this.number = number;
	}

	toDOM() {
		var element = document.createElement("span");
		element.className = "cm-md-list-marker cm-md-number-marker";
		element.textContent = `${this.number}.`;
		element.setAttribute("aria-hidden", "true");
		return element;
	}
}

class MarkdownTaskWidget extends WidgetType {
	constructor(checked) {
		super();
		this.checked = checked;
	}

	toDOM() {
		var element = document.createElement("span");
		element.className = `cm-md-list-marker cm-md-task-marker${this.checked ? " is-checked" : ""}`;
		element.textContent = this.checked ? "✓" : "□";
		element.setAttribute("aria-hidden", "true");
		return element;
	}
}

class MarkdownDividerWidget extends WidgetType {
	toDOM() {
		var element = document.createElement("span");
		element.className = "cm-md-divider-widget";
		element.setAttribute("aria-hidden", "true");
		return element;
	}
}

class MarkdownCodeFenceWidget extends WidgetType {
	toDOM() {
		var element = document.createElement("span");
		element.className = "cm-md-code-fence-widget";
		element.setAttribute("aria-hidden", "true");
		return element;
	}
}

function buildMarkdownDecorations(document, selection) {
	var builder = new RangeSetBuilder();
	var ranges = [];
	var addRange = function (from, to, value) {
		ranges.push({ from: from, to: to, value: value });
	};
	var wikilinkPattern = /\[\[([^\]|\n]+)(?:\|([^\]\n]+))?\]\]/g;
	var boldPattern = /\*\*([^*\n]+)\*\*/g;
	var italicPattern = /(^|[^*])\*([^*\n]+)\*(?!\*)/g;
	var inlineCodePattern = /`([^`\n]+)`/g;
	var dividerPattern = /^\s*((?:[-*_]\s*){3,})$/;
	var tablePattern = /^\s*\|.*\|\s*$/;
	var tableDividerPattern = /^\s*\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?\s*$/;
	var cursor = selection ? selection.main.head : -1;
	var selectionStart = selection ? selection.main.from : -1;
	var selectionEnd = selection ? selection.main.to : -1;
	var selectionTouches = function (start, end) {
		return selectionStart !== selectionEnd
			? selectionStart < end && selectionEnd > start
			: cursor > start && cursor < end;
	};
	var inCodeFence = false;
	var inCallout = false;

	for (var lineNumber = 1; lineNumber <= document.lines; lineNumber++) {
		var line = document.line(lineNumber);
		var text = line.text;
		var headingMatch = text.match(/^(#{1,6})(\s+)(.*)$/);
		var codeFenceMatch = text.match(/^\s*(```+|~~~+)(.*)$/);
		var calloutMatch = text.match(/^\s*>\s*\[!([\w-]+)\](?:\s+)?(.*)$/i);
		var quoteMatch = text.match(/^\s*>\s?/);
		var dividerMatch = text.match(dividerPattern);
		var isTableRow = tablePattern.test(text);
		var isTableDivider = tableDividerPattern.test(text);

		if (codeFenceMatch || inCodeFence) {
			addRange(line.from, line.from, Decoration.line({ class: "cm-md-codeblock" }));
			if (codeFenceMatch) {
				addRange(line.from, line.to, Decoration.replace({ widget: new MarkdownCodeFenceWidget() }));
				inCodeFence = !inCodeFence;
				}
			continue;
		}

		if (calloutMatch) {
			addRange(line.from, line.from, Decoration.line({ class: `cm-md-callout cm-md-callout-${calloutMatch[1].toLowerCase()}` }));
			var calloutMarkerEnd = line.from + text.indexOf("]") + 1;
			addRange(line.from, calloutMarkerEnd, Decoration.replace({}));
			inCallout = true;
		} else if (inCallout && quoteMatch) {
			addRange(line.from, line.from, Decoration.line({ class: "cm-md-callout" }));
			addRange(line.from, line.from + quoteMatch[0].length, Decoration.replace({}));
		} else {
			inCallout = false;
		}

		if (dividerMatch) {
			addRange(line.from, line.to, Decoration.replace({ widget: new MarkdownDividerWidget() }));
			continue;
		}

		if (isTableRow) {
			addRange(line.from, line.from, Decoration.line({ class: `cm-md-table-row${isTableDivider ? " cm-md-table-divider" : ""}` }));
		}
		var listMatch = text.match(/^(\s*)([-*+]|(\d+)[.)])(\s+)(\[[ xX]\]\s+)?/);

		if (headingMatch) {
			var headingLevel = headingMatch[1].length;
			addRange(line.from, line.from, Decoration.line({ class: `cm-md-heading cm-md-heading-${headingLevel}` }));
			addRange(line.from, line.from + headingMatch[1].length + headingMatch[2].length, Decoration.replace({}));
		}

		if (listMatch) {
			var markerStart = line.from + listMatch[1].length;
			var markerEnd = line.from + listMatch[0].length;
			var widget;
			if (listMatch[5]) {
				widget = Decoration.replace({ widget: new MarkdownTaskWidget(/\[[xX]\]/.test(listMatch[5])) });
			} else if (listMatch[3]) {
				widget = Decoration.replace({ widget: new MarkdownNumberWidget(parseInt(listMatch[3], 10)) });
			} else {
				widget = Decoration.replace({ widget: new MarkdownBulletWidget() });
			}
			addRange(markerStart, markerEnd, widget);
		}

		wikilinkPattern.lastIndex = 0;
		var match;
		while ((match = wikilinkPattern.exec(text)) !== null) {
			var linkStart = line.from + match.index;
			var targetStart = linkStart + 2;
			var targetEnd = targetStart + (match[1] || "").length;
			var linkEnd = line.from + match.index + match[0].length;
			var target = match[1].trim();
			var isKnownTarget = !window.isStudyWikilinkKnown || window.isStudyWikilinkKnown(target);
			var linkClass = `cm-md-wikilink${isKnownTarget ? "" : " cm-md-wikilink-not-found"}`;
			addRange(targetStart, targetEnd, Decoration.mark({ class: linkClass }));
			if (!selectionTouches(linkStart, linkEnd)) {
				addRange(linkStart, targetStart, Decoration.replace({}));
				addRange(linkEnd - 2, linkEnd, Decoration.replace({}));
			}
		}

		boldPattern.lastIndex = 0;
		while ((match = boldPattern.exec(text)) !== null) {
			var boldStart = line.from + match.index;
			var boldEnd = boldStart + match[0].length;
			addRange(boldStart, boldEnd, Decoration.mark({ class: "cm-md-bold" }));
			if (!selectionTouches(boldStart, boldEnd)) {
				addRange(boldStart, boldStart + 2, Decoration.replace({}));
				addRange(boldEnd - 2, boldEnd, Decoration.replace({}));
			}
		}

		italicPattern.lastIndex = 0;
		while ((match = italicPattern.exec(text)) !== null) {
			var italicPrefixLength = match[1].length;
			var italicStart = line.from + match.index + italicPrefixLength;
			var italicEnd = italicStart + match[0].length - italicPrefixLength;
			addRange(italicStart, italicEnd, Decoration.mark({ class: "cm-md-italic" }));
			if (!selectionTouches(italicStart, italicEnd)) {
				addRange(italicStart, italicStart + 1, Decoration.replace({}));
				addRange(italicEnd - 1, italicEnd, Decoration.replace({}));
			}
		}

		inlineCodePattern.lastIndex = 0;
		while ((match = inlineCodePattern.exec(text)) !== null) {
			var codeStart = line.from + match.index;
			var codeEnd = codeStart + match[0].length;
			addRange(codeStart, codeEnd, Decoration.mark({ class: "cm-md-inline-code" }));
			if (!selectionTouches(codeStart, codeEnd)) {
				addRange(codeStart, codeStart + 1, Decoration.replace({}));
				addRange(codeEnd - 1, codeEnd, Decoration.replace({}));
			}
		}
	}

	ranges.sort(function (left, right) {
		return left.from - right.from ||
			(left.value.startSide || 0) - (right.value.startSide || 0) ||
			left.to - right.to;
	});
	ranges.forEach(function (range) {
		builder.add(range.from, range.to, range.value);
	});
	return builder.finish();
}

var markdownDecorations = StateField.define({
	create: function (state) {
		return buildMarkdownDecorations(state.doc, state.selection);
	},
	update: function (decorations, transaction) {
		return transaction.docChanged || transaction.selection ? buildMarkdownDecorations(transaction.state.doc, transaction.state.selection) : decorations;
	},
	provide: function (field) {
		return EditorView.decorations.from(field);
	}
});

function createStudyMarkdownEditor(container, initialValue, onChange) {
	var state = EditorState.create({
		doc: initialValue || "",
		extensions: [
			minimalSetup,
			markdown({ base: { parser: indentationMarkdownParser } }),
			syntaxHighlighting(markdownHighlightStyle),
			keymap.of([...defaultKeymap, ...historyKeymap, ...foldKeymap, indentWithTab]),
			history(),
			EditorView.lineWrapping,
			markdownFoldService,
			foldGutter({
				markerDOM: createFoldMarker,
				openText: "",
				closedText: ""
			}),
			markdownDecorations,
			EditorView.domEventHandlers({
				click: function (event, view) {
					if (!event.ctrlKey && !event.metaKey) return false;
					var position = view.posAtCoords({ x: event.clientX, y: event.clientY });
					if (position == null || !window.handleNoteWikilinkClick) return false;
					var line = view.state.doc.lineAt(position);
					var offset = position - line.from;
					var linkPattern = /\[\[([^\]|\n]+)(?:\|([^\]\n]+))?\]\]/g;
					var match;
					while ((match = linkPattern.exec(line.text)) !== null) {
						if (offset >= match.index && offset <= match.index + match[0].length) {
							event.preventDefault();
							window.handleNoteWikilinkClick((match[1] || "").trim());
							return true;
						}
					}
					return false;
				},
				keydown: function (event) {
					if (window.handleNoteEditorKeydown) {
						window.handleNoteEditorKeydown(event);
						return event.defaultPrevented;
					}
					return false;
				}
			}),
			EditorView.updateListener.of(function (update) {
				if (update.docChanged && onChange) onChange(update.state.doc.toString(), update);
			})
		]
	});
	var view = new EditorView({ state: state, parent: container });

	return {
		view: view,
		getValue: function () { return view.state.doc.toString(); },
		setValue: function (value) {
			view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value || "" } });
		},
		focus: function () { view.focus(); },
		getSelection: function () {
			return { start: view.state.selection.main.from, end: view.state.selection.main.to };
		},
		setSelection: function (start, end) {
			view.dispatch({ selection: { anchor: start, head: end === undefined ? start : end } });
		},
		replaceRange: function (start, end, value) {
			view.dispatch({ changes: { from: start, to: end, insert: value } });
		},
		destroy: function () { view.destroy(); }
	};
}

window.StudyMarkdownEditor = { create: createStudyMarkdownEditor };
