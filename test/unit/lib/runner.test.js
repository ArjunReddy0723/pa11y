'use strict';

const assert = require('proclaim');
const createMockElement = require('../mock/element.mock');
const sinon = require('sinon');

describe('lib/runner', () => {
	let pa11y;
	let runner;

	beforeEach(() => {
		runner = require('../../../lib/runner');
		/* eslint-disable no-underscore-dangle */
		pa11y = runner.__pa11y;
		/* eslint-enable no-underscore-dangle */
	});

	it('is an object', () => {
		assert.isObject(runner);
	});

	describe('.__pa11y', () => {

		it('is an object', () => {
			assert.isObject(pa11y);
		});

		describe('.run(options)', () => {
			let options;
			let originalWindow;
			let resolvedValue;
			let mockIssues;

			beforeEach(async () => {
				originalWindow = global.window;
				global.window = require('../mock/window.mock');
				options = {
					ignore: [],
					rootElement: null,
					rules: [],
					standard: 'mock-standard',
					runners: [
						'mock-runner'
					],
					wait: 0
				};
				mockIssues = [
					{
						code: 'mock-code',
						context: 'mock-context',
						element: createMockElement(),
						message: 'mock issue',
						selector: 'mock-selector',
						type: 'error'
					}
				];
				pa11y.runners['mock-runner'] = sinon.stub().resolves(mockIssues);
				resolvedValue = await pa11y.run(options);
			});

			afterEach(() => {
				global.window = originalWindow;
			});

			it('runs all of the specified runners with the options and runner', () => {
				assert.calledOnce(pa11y.runners['mock-runner']);
				assert.calledWithExactly(pa11y.runners['mock-runner'], options, pa11y);
			});

			it('resolves with page details and an array of issues', () => {
				assert.isObject(resolvedValue);
				assert.strictEqual(resolvedValue.documentTitle, window.document.title);
				assert.strictEqual(resolvedValue.pageUrl, window.location.href);
				assert.isArray(resolvedValue.issues);
				assert.deepEqual(resolvedValue.issues, [
					{
						code: 'mock-code',
						context: 'mock-context',
						message: 'mock issue',
						selector: 'mock-selector',
						runner: 'mock-runner',
						runnerExtras: {},
						type: 'error',
						typeCode: 1
					}
				]);
			});

			describe('when the document title is not set', () => {

				beforeEach(async () => {
					delete window.document.title;
					pa11y.runners['mock-runner'].returns([]);
					resolvedValue = await pa11y.run(options);
				});

				it('resolves with an empty `documentTitle` property', () => {
					assert.strictEqual(resolvedValue.documentTitle, '');
				});

			});

			describe('when the location href is not set', () => {

				beforeEach(async () => {
					delete window.location.href;
					pa11y.runners['mock-runner'].returns([]);
					resolvedValue = await pa11y.run(options);
				});

				it('resolves with an empty `pageUrl` property', () => {
					assert.strictEqual(resolvedValue.pageUrl, '');
				});

			});

			describe('when an issue type is not found', () => {

				beforeEach(async () => {
					pa11y.runners['mock-runner'].returns([
						{
							code: 'mock-code',
							context: 'mock-context',
							element: createMockElement(),
							message: 'mock issue',
							selector: 'mock-selector',
							type: 'not-a-type'
						}
					]);
					resolvedValue = await pa11y.run(options);
				});

				it('resolves with a `typeCode` of 0', () => {
					assert.strictEqual(resolvedValue.issues[0].typeCode, 0);
				});

			});

			describe('when the runner errors', () => {
				let rejectedError;
				let runnerError;

				beforeEach(async () => {
					runnerError = new Error('HTML CodeSniffer error');
					pa11y.runners['mock-runner'].rejects(runnerError);
					try {
						await pa11y.run(options);
					} catch (error) {
						rejectedError = error;
					}
				});

				it('rejects with that error', () => {
					assert.strictEqual(rejectedError, runnerError);
				});

			});

			describe('when `options.ignore` includes an issue type', () => {

				beforeEach(async () => {
					pa11y.runners['mock-runner'].returns([
						{
							code: 'mock-error',
							context: 'mock-context-1',
							element: createMockElement(),
							message: 'mock issue 1',
							selector: 'mock-selector-1',
							type: 'error'
						},
						{
							code: 'mock-warning',
							context: 'mock-context-2',
							element: createMockElement(),
							message: 'mock issue 2',
							selector: 'mock-selector-2',
							type: 'warning'
						}
					]);
					options.ignore = [
						'error'
					];
					resolvedValue = await pa11y.run(options);
				});

				it('does not resolve with issues of that type', () => {
					assert.deepEqual(resolvedValue.issues, [
						{
							code: 'mock-warning',
							context: 'mock-context-2',
							message: 'mock issue 2',
							selector: 'mock-selector-2',
							runner: 'mock-runner',
							runnerExtras: {},
							type: 'warning',
							typeCode: 2
						}
					]);
				});

			});

			describe('when `options.ignore` includes an issue code', () => {

				beforeEach(async () => {
					pa11y.runners['mock-runner'].returns([
						{
							code: 'mock-code-1',
							context: 'mock-context-1',
							element: createMockElement(),
							message: 'mock issue 1',
							selector: 'mock-selector-1',
							type: 'error'
						},
						{
							code: 'mock-code-2',
							context: 'mock-context-2',
							element: createMockElement(),
							message: 'mock issue 2',
							selector: 'mock-selector-2',
							type: 'error'
						}
					]);
					options.ignore = [
						'mock-code-1'
					];
					resolvedValue = await pa11y.run(options);
				});

				it('does not resolve with issues with that code', () => {
					assert.deepEqual(resolvedValue.issues, [
						{
							code: 'mock-code-2',
							context: 'mock-context-2',
							message: 'mock issue 2',
							selector: 'mock-selector-2',
							runner: 'mock-runner',
							runnerExtras: {},
							type: 'error',
							typeCode: 1
						}
					]);
				});

				describe('when the issue code case does not match', () => {

					beforeEach(async () => {
						pa11y.runners['mock-runner'].returns([
							{
								code: 'MOCK-CODE',
								context: 'mock-context',
								element: createMockElement(),
								message: 'mock issue',
								selector: 'mock-selector',
								type: 'error'
							}
						]);
						options.ignore = [
							'mock-code'
						];
						resolvedValue = await pa11y.run(options);
					});

					it('still does not resolve with issues with that code', () => {
						assert.deepEqual(resolvedValue.issues, []);
					});

				});

			});

			describe('when `options.rootElement` is set', () => {
				let insideElement;
				let outsideElement;
				let rootElement;

				beforeEach(async () => {
					insideElement = createMockElement({
						id: 'mock-inside-element'
					});
					outsideElement = createMockElement({
						id: 'mock-outside-element'
					});
					rootElement = createMockElement({
						id: 'root-element'
					});

					global.window.document.querySelector.withArgs('#root-element').returns(rootElement);

					rootElement.contains.withArgs(insideElement).returns(true);
					rootElement.contains.withArgs(outsideElement).returns(false);

					pa11y.runners['mock-runner'].returns([
						{
							code: 'mock-code-1',
							context: 'mock-context-1',
							element: insideElement,
							message: 'mock issue 1',
							selector: 'mock-selector-1',
							type: 'error'
						},
						{
							code: 'mock-code-2',
							context: 'mock-context-2',
							element: outsideElement,
							message: 'mock issue 2',
							selector: 'mock-selector-2',
							type: 'error'
						}
					]);
					options.rootElement = '#root-element';
					resolvedValue = await pa11y.run(options);
				});

				it('selects the root element', () => {
					assert.calledWithExactly(window.document.querySelector, '#root-element');
				});

				it('does not resolve with issues outside of the root element', () => {
					assert.deepEqual(resolvedValue.issues, [
						{
							code: 'mock-code-1',
							context: 'mock-context-1',
							message: 'mock issue 1',
							selector: 'mock-selector-1',
							runner: 'mock-runner',
							runnerExtras: {},
							type: 'error',
							typeCode: 1
						}
					]);
				});

				describe('when `options.rootElement` cannot be found in the DOM', () => {

					beforeEach(async () => {
						global.window.document.querySelector.withArgs('#root-element').returns(null);
						resolvedValue = await pa11y.run(options);
					});

					it('resolves with all issues', () => {
						assert.deepEqual(resolvedValue.issues, [
							{
								code: 'mock-code-1',
								context: 'mock-context-1',
								message: 'mock issue 1',
								selector: 'mock-selector-1',
								runner: 'mock-runner',
								runnerExtras: {},
								type: 'error',
								typeCode: 1
							},
							{
								code: 'mock-code-2',
								context: 'mock-context-2',
								message: 'mock issue 2',
								selector: 'mock-selector-2',
								runner: 'mock-runner',
								runnerExtras: {},
								type: 'error',
								typeCode: 1
							}
						]);
					});

				});

			});

			describe('when `options.hideElements` is set', () => {
				let childOfHiddenElement;
				let hiddenElement;
				let unhiddenElement;

				beforeEach(async () => {
					hiddenElement = createMockElement({
						id: 'mock-hidden-element'
					});
					childOfHiddenElement = createMockElement({
						id: 'mock-child-of-hidden-element',
						parentNode: hiddenElement
					});
					unhiddenElement = createMockElement({
						id: 'mock-unhidden-element'
					});
					hiddenElement.contains.withArgs(hiddenElement).returns(true);
					hiddenElement.contains.withArgs(childOfHiddenElement).returns(true);

					global.window.document.querySelectorAll.withArgs('hidden1, hidden2').returns([
						hiddenElement
					]);

					pa11y.runners['mock-runner'].returns([
						{
							code: 'mock-code-1',
							context: 'mock-context-1',
							element: unhiddenElement,
							message: 'mock issue 1',
							selector: 'mock-selector-1',
							type: 'error'
						},
						{
							code: 'mock-code-2',
							context: 'mock-context-2',
							element: hiddenElement,
							message: 'mock issue 2',
							selector: 'mock-selector-2',
							type: 'error'
						},
						{
							code: 'mock-code-3',
							context: 'mock-context-3',
							element: childOfHiddenElement,
							message: 'mock issue 3',
							selector: 'mock-selector-3',
							type: 'error'
						}
					]);
					options.hideElements = 'hidden1, hidden2';
					resolvedValue = await pa11y.run(options);
				});

				it('selects the hidden elements', () => {
					assert.calledWithExactly(window.document.querySelectorAll, options.hideElements);
				});

				it('does not resolve with issues inside hidden elements, or that are hidden themselves', () => {
					assert.deepEqual(resolvedValue.issues, [
						{
							code: 'mock-code-1',
							context: 'mock-context-1',
							message: 'mock issue 1',
							selector: 'mock-selector-1',
							runner: 'mock-runner',
							runnerExtras: {},
							type: 'error',
							typeCode: 1
						}
					]);
				});

			});

		});

	});

});
