import * as assert from "assert";
import { TimeParser } from "../../time/timeParser";

suite("TimeParser > parseDateTemplate() > parseTime()", () => {
    let realDateNow: () => number;
    let parser: TimeParser;
    const currentDate = "2019-06-11 10:15:20";
    setup(() => {
        realDateNow = Date.now;
        Date.now = () => new Date(currentDate).getTime();
    });

    teardown(() => {
        Date.now = realDateNow;
    });

    suite("local", () => {
        setup(() => {
            parser = new TimeParser("local");
        });

        test("if hh:mm:ss, sets hours, minutes and seconds", () => {
            const template = "16:00:00";
            const actual = parser.parseDateTemplate(template);
            const expected = new Date("2019-06-11 16:00:00");
            assert.deepStrictEqual(actual, expected);
        });
        test("if hh:mm, sets hours and minutes", () => {
            const template = "16:00";
            const actual = parser.parseDateTemplate(template);
            const expected = new Date("2019-06-11 16:00:00");
            assert.deepStrictEqual(actual, expected);
        });
        test("if hh:mm:ss.S, sets hours, minutes, seconds and milliseconds", () => {
            const template = "16:20:05.333";
            const actual = parser.parseDateTemplate(template);
            const expected = new Date("2019-06-11 16:20:05.333");
            assert.deepStrictEqual(actual, expected);
        });
        test("if yyyy-MM-dd hh:mm:ss.S+hh:mm, sets all including TZ", () => {
            const template = "2016-06-24 20:00:45+02:00"; // MET
            const actual = parser.parseDateTemplate(template);
            const expected = new Date("2016-06-24T20:00:45+02:00");
            assert.deepStrictEqual(actual, expected);
        });
        test("if yyyy-MM-dd hh:mm:ss.S-hhmm, sets all including TZ", () => {
            const template = "2016-06-24 20:00:45-0200"; // Western Greenland Time
            const actual = parser.parseDateTemplate(template);
            const expected = new Date("2016-06-24T20:00:45-02:00");
            assert.deepStrictEqual(actual, expected);
        });
    });

    suite("utc", () => {
        setup(() => {
            parser = new TimeParser("utc");
        });

        test("if hh:mm:ss, sets hours, minutes and seconds", () => {
            const template = "16:00:00";
            const actual = parser.parseDateTemplate(template);
            const expected = new Date("2019-06-11T16:00:00Z");
            assert.deepStrictEqual(actual, expected);
        });
        test("if hh:mm, sets hours and minutes", () => {
            const template = "16:00";
            const actual = parser.parseDateTemplate(template);
            const expected = new Date("2019-06-11T16:00:00Z");
            assert.deepStrictEqual(actual, expected);
        });
        test("if hh:mm:ss.S, sets hours, minutes, seconds and milliseconds", () => {
            const template = "16:20:05.333";
            const actual = parser.parseDateTemplate(template);
            const expected = new Date("2019-06-11T16:20:05.333Z");
            assert.deepStrictEqual(actual, expected);
        });
        test("if yyyy-MM-dd hh:mm:ss.S+hh:mm, sets all including TZ", () => {
            const template = "2016-06-24 20:00:45+02:00"; // MET
            const actual = parser.parseDateTemplate(template);
            const expected = new Date("2016-06-24T20:00:45+02:00");
            assert.deepStrictEqual(actual, expected);
        });
    });
});
