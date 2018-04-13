'use strict';

exports.scripts = [
	`${__dirname}/vendor/HTMLCS.js`
];

// Initialise the test runner
exports.init = async (options, pa11y) => {

	/**
	 * A map of issue type codes to names.
	 * @private
	 */
	const issueTypeMap = {
		1: 'error',
		2: 'warning',
		3: 'notice'
	};

	// Configure and run HTML CodeSniffer
	configureHtmlCodeSniffer();
	return runHtmlCodeSniffer();

	/**
	 * Configure HTML CodeSniffer.
	 * @private
	 * @returns {Undefined} Returns nothing.
	 */
	function configureHtmlCodeSniffer() {
		if (options.rules.length && options.standard !== 'Section508') {
			for (const rule of options.rules) {
				if (window.HTMLCS_WCAG2AAA.sniffs.includes(rule)) {
					window[`HTMLCS_${options.standard}`].sniffs[0].include.push(rule);
				} else {
					throw new Error(`${rule} is not a valid WCAG 2.0 rule`);
				}
			}
		}
	}

	/**
	 * Run HTML CodeSniffer on the current page.
	 * @private
	 * @returns {Promise} Returns a promise which resolves with HTML CodeSniffer issues.
	 */
	function runHtmlCodeSniffer() {
		return new Promise((resolve, reject) => {
			window.HTMLCS.process(options.standard, window.document, error => {
				if (error) {
					return reject(error);
				}
				resolve(window.HTMLCS.getMessages().map(processIssue));
			});
		});
	}

	/**
	 * Process an HTML CodeSniffer issue.
	 * @private
	 * @param {Object} issue - An HTML CodeSniffer issue to process.
	 * @returns {Object} Returns the processed issue.
	 */
	function processIssue(issue) {
		return {
			code: issue.code,
			message: issue.msg,
			type: issueTypeMap[issue.type] || 'unknown',
			context: pa11y.getElementContext(issue.element),
			selector: pa11y.getElementSelector(issue.element)
		};
	}

};
