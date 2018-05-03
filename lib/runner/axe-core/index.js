'use strict';

/**
 * Scripts which the test runner depends on.
 * @private
 * @type {Array}
 */
exports.scripts = [
	`${__dirname}/node_modules/axe-core/axe.min.js`
];

/**
 * Initialise the test runner.
 * @private
 * @returns {Promise} Returns a promise which resolves with aXe issues.
 */
exports.init = async (options, pa11y) => {

	// Configure and run aXe
	return runAxeCore();

	/**
	 * Run aXe on the current page.
	 * @private
	 * @returns {Promise} Returns a promise which resolves with aXe issues.
	 */
	async function runAxeCore() {
		const result = await axe.run();
		return [].concat(
			result.violations.map(processViolation),
			result.incomplete.map(processIncomplete)
		);
	}

	/**
	 * Process an aXe issue with type of "violation".
	 * @private
	 * @param {Object} issue - An aXe issue to process.
	 * @returns {Object} Returns the processed issue.
	 */
	function processViolation(issue) {
		issue.type = 'error';
		return processIssue(issue);
	}

	/**
	 * Process an aXe issue with type of "incomplete".
	 * @private
	 * @param {Object} issue - An aXe issue to process.
	 * @returns {Object} Returns the processed issue.
	 */
	function processIncomplete(issue) {
		issue.type = 'warning';
		return processIssue(issue);
	}

	/**
	 * Process an aXe issue.
	 * @private
	 * @param {Object} issue - An aXe issue to process.
	 * @returns {Object} Returns the processed issue.
	 */
	function processIssue(issue) {

		// For now we just select the first element. This needs testing
		const selector = issue.nodes.map(node => selectorToString(node.target)).join(', ');
		const element = document.querySelector(selector);

		return {
			code: issue.id,
			message: issue.description,
			type: issue.type,
			context: pa11y.getElementContext(element),
			selector: pa11y.getElementSelector(element),
			runnerExtras: {
				impact: issue.impact,
				help: issue.help,
				helpUrl: issue.helpUrl
			}
		};
	}

	/**
	 * Convert an aXe selector array to a selector string. Copied from
	 * https://github.com/dequelabs/axe-cli/blob/develop/lib/utils.js
 	 * for now, wonder if we can share or move out.
	 * @private
	 * @param {Array} selectors - The selector parts.
	 * @returns {String} Returns the selector string.
	 */
	function selectorToString(selectors) {
		return selectors
			.reduce((selectorParts, selector) => selectorParts.concat(selector), [])
			.join(' ');
	}

};
