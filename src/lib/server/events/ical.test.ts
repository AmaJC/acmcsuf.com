import { test, expect, assert } from 'vitest';
import { readFileSync, writeFileSync } from 'node:fs';
import { Temporal } from '@js-temporal/polyfill';
import { SAMPLE_EVENTS } from './data/sample-events';
import {
  makeEventSlug,
  parseDescription,
  makeEventLink,
  wrapText,
  walkICAL,
  replaceHtmlLinkTargets,
  parse,
} from './ical';

const ICAL_DATA = readFileSync('src/lib/server/events/data/sample-events.ics', 'utf-8');

test('ICAL parser integration test', () => {
  const events = parse(ICAL_DATA, { maxEvents: 10, filterBefore: false });

  // To generate 'src/lib/server/events/data/sample-events.ts', uncomment the
  // following lines of code then run 'npm t' (and 'npm run all'):
  //
  writeFileSync(
    'src/lib/server/events/data/sample-events.ts',
    `export const SAMPLE_EVENTS = ${JSON.stringify(events)};`
  );

  expect(events).toEqual(SAMPLE_EVENTS);
});

test('parses sample ICAL payload', () => {
  expect([...walkICAL(ICAL_DATA)].length).toBeGreaterThan(0);
});

test('parses sample ICAL payload into AcmEvent', () => {
  const acmEvents = parse(ICAL_DATA, {
    referenceDate: Temporal.Now.zonedDateTimeISO().subtract(Temporal.Duration.from({ years: 1 })),
  });
  expect(acmEvents.length).toBeGreaterThan(0);
});

test('slugifies simple event details', () => {
  const actual = makeEventSlug(
    'test-event',
    Temporal.ZonedDateTime.from({ timeZone: 'UTC', year: 2000, month: 1, day: 1 })
  );
  const expected = 'test-event-2000-january-1';
  expect(actual).toBe(expected);
});

test('slugifies capitalized event details', () => {
  const actual = makeEventSlug(
    'Test Event',
    Temporal.ZonedDateTime.from({ timeZone: 'UTC', year: 2000, month: 1, day: 1 })
  );
  const expected = 'test-event-2000-january-1';
  expect(actual).toBe(expected);
});

test('parses empty event description', () => {
  const { description, variables } = parseDescription('');
  expect(description).toBe('');
  expect(variables).toEqual(new Map());
});

test('parses text-only event description', () => {
  const { description, variables } = parseDescription('Hello, world!');
  expect(description).toBe('Hello, world!');
  expect(variables).toEqual(new Map());
});

test('parses variable-only event description', () => {
  const { description, variables } = parseDescription('ACM_TEST=test');
  expect(description).toBe('');
  expect(variables).toEqual(new Map([['ACM_TEST', 'test']]));
});

test('parses variables and text in event description', () => {
  const { description, variables } = parseDescription('Hello, world! ACM_TEST=test');
  expect(description).toBe('Hello, world!');
  expect(variables).toEqual(new Map([['ACM_TEST', 'test']]));
});

test('makes a link out of event slug and base URL', () => {
  const result = makeEventLink('test-event-2000-january-1', 'https://example.com/');
  expect(result).toEqual('https://example.com/#test-event-2000-january-1');
});

test('wraps long text into lines broken at column 100 3 times', () => {
  const lines = wrapText('*'.repeat(301), 100);
  assert(lines.length === 4, 'wraps text into 3 times, making 4 lines');
  assert(lines.at(-1)?.length === 1, 'where the last line is a single asterisk');
});

test('replaces link targets with "_blank" in HTML string', () => {
  const actual =
    replaceHtmlLinkTargets(`<a title="example" target="_self"  href="https://example.com/">Example Link</a>
  <a title="example" target="_self"href="https://example.com/">Example Link</a>
  <a target="_self" title="example" href="https://example.com/">Example Link</a>
  <a title="example" target="_self" target="poggers" target="not poggers"  href="https://example.com/">Example Link</a>
  <a title="example" target="" href="https://example.com/">Example Link</a>
  <a href="https://example.com/example/">https://example.com/example/</a>
  <a title="example">Example Link</a>
  <a href="https://example.com/">
  <a>
  <a title="example" href="https://example.com/">
  <a title="example" target="_self" href="https://example.com/">
  <a title="example" target="_blank" href="https://example.com/">
  <article href="https://example.com/">example</article>
  example`);
  expect(actual)
    .toBe(`<a title="example" href="https://example.com/" target="_blank">Example Link</a>
  <a title="example" href="https://example.com/" target="_blank">Example Link</a>
  <a title="example" href="https://example.com/" target="_blank">Example Link</a>
  <a title="example" href="https://example.com/" target="_blank">Example Link</a>
  <a title="example" href="https://example.com/" target="_blank">Example Link</a>
  <a href="https://example.com/example/" target="_blank">https://example.com/example/</a>
  <a title="example">Example Link</a>
  <a href="https://example.com/" target="_blank">
  <a>
  <a title="example" href="https://example.com/" target="_blank">
  <a title="example" href="https://example.com/" target="_blank">
  <a title="example" href="https://example.com/" target="_blank">
  <article href="https://example.com/">example</article>
  example`);
});
