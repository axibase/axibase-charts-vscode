import * as assert from "assert";
import { TimeParseError } from "../../time/timeParseError";
import { TimeParser } from "../../time/timeParser";

suite("TimeParser > parseDateTemplate() > parseCalendarKeyword()", () => {
    let realDateNow: () => number;
    let parser: TimeParser;
    const currentDate = "2019-06-11T10:15:20+03:00"; // Tuesday, Europe/Moscow
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

        suite("days of week", () => {
            test("sunday", () => {
                const template = "sunday";
                const actual = parser.parseDateTemplate(template);
                const expected = new Date("2019-06-09 00:00:00");
                assert.deepStrictEqual(actual, expected);
            });
            test("monday", () => {
                const template = "monday";
                const actual = parser.parseDateTemplate(template);
                const expected = new Date("2019-06-10 00:00:00");
                assert.deepStrictEqual(actual, expected);
            });
            test("tuesday", () => {
                const template = "tuesday";
                const actual = parser.parseDateTemplate(template);
                const expected = new Date("2019-06-11 00:00:00");
                assert.deepStrictEqual(actual, expected);
            });
            test("wednesday", () => {
                const template = "wednesday";
                const actual = parser.parseDateTemplate(template);
                const expected = new Date("2019-06-05 00:00:00");
                assert.deepStrictEqual(actual, expected);
            });
            test("thursday", () => {
                const template = "thursday";
                const actual = parser.parseDateTemplate(template);
                const expected = new Date("2019-06-06 00:00:00");
                assert.deepStrictEqual(actual, expected);
            });
            test("friday", () => {
                const template = "friday";
                const actual = parser.parseDateTemplate(template);
                const expected = new Date("2019-06-07 00:00:00");
                assert.deepStrictEqual(actual, expected);
            });
            test("saturday", () => {
                const template = "saturday";
                const actual = parser.parseDateTemplate(template);
                const expected = new Date("2019-06-08 00:00:00");
                assert.deepStrictEqual(actual, expected);
            });
        });

        suite("other keywords", () => {
            suite("current", () => {
                test("current_minute", () => {
                    const template = "current_minute";
                    const actual = parser.parseDateTemplate(template);
                    const expected = new Date("2019-06-11T10:15:00+03:00");
                    assert.deepStrictEqual(actual, expected);
                });
                test("current_hour", () => {
                    const template = "current_hour";
                    const actual = parser.parseDateTemplate(template);
                    const expected = new Date("2019-06-11T10:00:00+03:00");
                    assert.deepStrictEqual(actual, expected);
                });
                test("current_day", () => {
                    const template = "current_day";
                    const actual = parser.parseDateTemplate(template);
                    const expected = new Date("2019-06-11 00:00:00");
                    assert.deepStrictEqual(actual, expected);
                });
                test("current_week", () => {
                    const template = "current_week";
                    const actual = parser.parseDateTemplate(template);
                    const expected = new Date("2019-06-10 00:00:00");
                    assert.deepStrictEqual(actual, expected);
                });
                test("current_month", () => {
                    const template = "current_month";
                    const actual = parser.parseDateTemplate(template);
                    const expected = new Date("2019-06-01 00:00:00");
                    assert.deepStrictEqual(actual, expected);
                });
                test("current_quarter", () => {
                    const template = "current_quarter";
                    const actual = parser.parseDateTemplate(template);
                    const expected = new Date("2019-04-01 00:00:00");
                    assert.deepStrictEqual(actual, expected);
                });
                test("current_year", () => {
                    const template = "current_year";
                    const actual = parser.parseDateTemplate(template);
                    const expected = new Date("2019-01-01 00:00:00");
                    assert.deepStrictEqual(actual, expected);
                });
            });

            suite("previous", () => {
                test("previous_minute", () => {
                    const template = "previous_minute";
                    const actual = parser.parseDateTemplate(template);
                    const expected = new Date("2019-06-11T10:14:00+03:00");
                    assert.deepStrictEqual(actual, expected);
                });
                test("previous_hour", () => {
                    const template = "previous_hour";
                    const actual = parser.parseDateTemplate(template);
                    const expected = new Date("2019-06-11T09:00:00+03:00");
                    assert.deepStrictEqual(actual, expected);
                });
                test("previous_day", () => {
                    const template = "previous_day";
                    const actual = parser.parseDateTemplate(template);
                    const expected = new Date("2019-06-10 00:00:00");
                    assert.deepStrictEqual(actual, expected);
                });
                test("previous_week", () => {
                    const template = "previous_week";
                    const actual = parser.parseDateTemplate(template);
                    const expected = new Date("2019-06-03 00:00:00");
                    assert.deepStrictEqual(actual, expected);
                });
                test("previous_month", () => {
                    const template = "previous_month";
                    const actual = parser.parseDateTemplate(template);
                    const expected = new Date("2019-05-01 00:00:00");
                    assert.deepStrictEqual(actual, expected);
                });
                test("previous_quarter", () => {
                    const template = "previous_quarter";
                    const actual = parser.parseDateTemplate(template);
                    const expected = new Date("2019-01-01 00:00:00");
                    assert.deepStrictEqual(actual, expected);
                });
                test("previous_year", () => {
                    const template = "previous_year";
                    const actual = parser.parseDateTemplate(template);
                    const expected = new Date("2018-01-01 00:00:00");
                    assert.deepStrictEqual(actual, expected);
                });
                test("previous_working_day", () => {
                    const template = "previous_working_day";
                    const actual = parser.parseDateTemplate(template);
                    const expected = new Date("2019-06-10 00:00:00");
                    assert.deepStrictEqual(actual, expected);
                });
                test("previous_vacation_day", () => {
                    const template = "previous_vacation_day";
                    const actual = parser.parseDateTemplate(template);
                    const expected = new Date("2019-06-09 00:00:00");
                    assert.deepStrictEqual(actual, expected);
                });
            });

            suite("next", () => {
                test("next_minute", () => {
                    const template = "next_minute";
                    const actual = parser.parseDateTemplate(template);
                    const expected = new Date("2019-06-11T10:16:00+03:00");
                    assert.deepStrictEqual(actual, expected);
                });
                test("next_hour", () => {
                    const template = "next_hour";
                    const actual = parser.parseDateTemplate(template);
                    const expected = new Date("2019-06-11T11:00:00+03:00");
                    assert.deepStrictEqual(actual, expected);
                });
                test("next_day", () => {
                    const template = "next_day";
                    const actual = parser.parseDateTemplate(template);
                    const expected = new Date("2019-06-12 00:00:00");
                    assert.deepStrictEqual(actual, expected);
                });
                test("next_week", () => {
                    const template = "next_week";
                    const actual = parser.parseDateTemplate(template);
                    const expected = new Date("2019-06-17 00:00:00");
                    assert.deepStrictEqual(actual, expected);
                });
                test("next_month", () => {
                    const template = "next_month";
                    const actual = parser.parseDateTemplate(template);
                    const expected = new Date("2019-07-01 00:00:00");
                    assert.deepStrictEqual(actual, expected);
                });
                test("next_quarter", () => {
                    const template = "next_quarter";
                    const actual = parser.parseDateTemplate(template);
                    const expected = new Date("2019-07-01 00:00:00");
                    assert.deepStrictEqual(actual, expected);
                });
                test("next_year", () => {
                    const template = "next_year";
                    const actual = parser.parseDateTemplate(template);
                    const expected = new Date("2020-01-01 00:00:00");
                    assert.deepStrictEqual(actual, expected);
                });
                test("next_working_day", () => {
                    const template = "next_working_day";
                    const actual = parser.parseDateTemplate(template);
                    const expected = new Date("2019-06-12 00:00:00");
                    assert.deepStrictEqual(actual, expected);
                });
                test("next_vacation_day", () => {
                    const template = "next_vacation_day";
                    const actual = parser.parseDateTemplate(template);
                    const expected = new Date("2019-06-15 00:00:00");
                    assert.deepStrictEqual(actual, expected);
                });
            });

            suite("last", () => {
                test("last_day", () => {
                    const template = "last_day";
                    const actual = parser.parseDateTemplate(template);
                    const expected = new Date("2019-06-30 00:00:00");
                    assert.deepStrictEqual(actual, expected);
                });
                test("last_working_day", () => {
                    const template = "last_working_day";
                    const actual = parser.parseDateTemplate(template);
                    const expected = new Date("2019-06-28 00:00:00");
                    assert.deepStrictEqual(actual, expected);
                });
                test("last_vacation_day", () => {
                    const template = "last_vacation_day";
                    const actual = parser.parseDateTemplate(template);
                    const expected = new Date("2019-06-30 00:00:00");
                    assert.deepStrictEqual(actual, expected);
                });
            });

            suite("first", () => {
                test("first_working_day", () => {
                    const template = "first_working_day";
                    const actual = parser.parseDateTemplate(template);
                    const expected = new Date("2019-06-03 00:00:00");
                    assert.deepStrictEqual(actual, expected);
                });
                test("first_vacation_day", () => {
                    const template = "first_vacation_day";
                    const actual = parser.parseDateTemplate(template);
                    const expected = new Date("2019-06-01 00:00:00");
                    assert.deepStrictEqual(actual, expected);
                });
            });

            test("now", () => {
                const template = "now";
                const actual = parser.parseDateTemplate(template).getTime();
                const expected = Date.now();
                assert.strictEqual(actual, expected);
            });
        });
    });

    suite("utc", () => {
        setup(() => {
            parser = new TimeParser("utc");
        });

        suite("days of week", () => {
            test("sunday", () => {
                const template = "sunday";
                const actual = parser.parseDateTemplate(template);
                const expected = new Date("2019-06-09T00:00:00Z");
                assert.deepStrictEqual(actual, expected);
            });
            test("monday", () => {
                const template = "monday";
                const actual = parser.parseDateTemplate(template);
                const expected = new Date("2019-06-10T00:00:00Z");
                assert.deepStrictEqual(actual, expected);
            });
            test("tuesday", () => {
                const template = "tuesday";
                const actual = parser.parseDateTemplate(template);
                const expected = new Date("2019-06-11T00:00:00Z");
                assert.deepStrictEqual(actual, expected);
            });
            test("wednesday", () => {
                const template = "wednesday";
                const actual = parser.parseDateTemplate(template);
                const expected = new Date("2019-06-05T00:00:00Z");
                assert.deepStrictEqual(actual, expected);
            });
            test("thursday", () => {
                const template = "thursday";
                const actual = parser.parseDateTemplate(template);
                const expected = new Date("2019-06-06T00:00:00Z");
                assert.deepStrictEqual(actual, expected);
            });
            test("friday", () => {
                const template = "friday";
                const actual = parser.parseDateTemplate(template);
                const expected = new Date("2019-06-07T00:00:00Z");
                assert.deepStrictEqual(actual, expected);
            });
            test("saturday", () => {
                const template = "saturday";
                const actual = parser.parseDateTemplate(template);
                const expected = new Date("2019-06-08T00:00:00Z");
                assert.deepStrictEqual(actual, expected);
            });
        });

        suite("other keywords", () => {
            suite("current", () => {
                test("current_minute", () => {
                    const template = "current_minute";
                    const actual = parser.parseDateTemplate(template);
                    const expected = new Date("2019-06-11T07:15:00Z");
                    assert.deepStrictEqual(actual, expected);
                });
                test("current_hour", () => {
                    const template = "current_hour";
                    const actual = parser.parseDateTemplate(template);
                    const expected = new Date("2019-06-11T07:00:00Z");
                    assert.deepStrictEqual(actual, expected);
                });
                test("current_day", () => {
                    const template = "current_day";
                    const actual = parser.parseDateTemplate(template);
                    const expected = new Date("2019-06-11T00:00:00Z");
                    assert.deepStrictEqual(actual, expected);
                });
                test("current_week", () => {
                    const template = "current_week";
                    const actual = parser.parseDateTemplate(template);
                    const expected = new Date("2019-06-10T00:00:00Z");
                    assert.deepStrictEqual(actual, expected);
                });
                test("current_month", () => {
                    const template = "current_month";
                    const actual = parser.parseDateTemplate(template);
                    const expected = new Date("2019-06-01T00:00:00Z");
                    assert.deepStrictEqual(actual, expected);
                });
                test("current_quarter", () => {
                    const template = "current_quarter";
                    const actual = parser.parseDateTemplate(template);
                    const expected = new Date("2019-04-01T00:00:00Z");
                    assert.deepStrictEqual(actual, expected);
                });
                test("current_year", () => {
                    const template = "current_year";
                    const actual = parser.parseDateTemplate(template);
                    const expected = new Date("2019-01-01T00:00:00Z");
                    assert.deepStrictEqual(actual, expected);
                });
            });

            suite("previous", () => {
                test("previous_minute", () => {
                    const template = "previous_minute";
                    const actual = parser.parseDateTemplate(template);
                    const expected = new Date("2019-06-11T07:14:00Z");
                    assert.deepStrictEqual(actual, expected);
                });
                test("previous_hour", () => {
                    const template = "previous_hour";
                    const actual = parser.parseDateTemplate(template);
                    const expected = new Date("2019-06-11T06:00:00Z");
                    assert.deepStrictEqual(actual, expected);
                });
                test("previous_day", () => {
                    const template = "previous_day";
                    const actual = parser.parseDateTemplate(template);
                    const expected = new Date("2019-06-10T00:00:00Z");
                    assert.deepStrictEqual(actual, expected);
                });
                test("previous_week", () => {
                    const template = "previous_week";
                    const actual = parser.parseDateTemplate(template);
                    const expected = new Date("2019-06-03T00:00:00Z");
                    assert.deepStrictEqual(actual, expected);
                });
                test("previous_month", () => {
                    const template = "previous_month";
                    const actual = parser.parseDateTemplate(template);
                    const expected = new Date("2019-05-01T00:00:00Z");
                    assert.deepStrictEqual(actual, expected);
                });
                test("previous_quarter", () => {
                    const template = "previous_quarter";
                    const actual = parser.parseDateTemplate(template);
                    const expected = new Date("2019-01-01T00:00:00Z");
                    assert.deepStrictEqual(actual, expected);
                });
                test("previous_year", () => {
                    const template = "previous_year";
                    const actual = parser.parseDateTemplate(template);
                    const expected = new Date("2018-01-01T00:00:00Z");
                    assert.deepStrictEqual(actual, expected);
                });
                test("previous_working_day", () => {
                    const template = "previous_working_day";
                    const actual = parser.parseDateTemplate(template);
                    const expected = new Date("2019-06-10T00:00:00Z");
                    assert.deepStrictEqual(actual, expected);
                });
                test("previous_vacation_day", () => {
                    const template = "previous_vacation_day";
                    const actual = parser.parseDateTemplate(template);
                    const expected = new Date("2019-06-09T00:00:00Z");
                    assert.deepStrictEqual(actual, expected);
                });
            });

            suite("next", () => {
                test("next_minute", () => {
                    const template = "next_minute";
                    const actual = parser.parseDateTemplate(template);
                    const expected = new Date("2019-06-11T07:16:00Z");
                    assert.deepStrictEqual(actual, expected);
                });
                test("next_hour", () => {
                    const template = "next_hour";
                    const actual = parser.parseDateTemplate(template);
                    const expected = new Date("2019-06-11T08:00:00Z");
                    assert.deepStrictEqual(actual, expected);
                });
                test("next_day", () => {
                    const template = "next_day";
                    const actual = parser.parseDateTemplate(template);
                    const expected = new Date("2019-06-12T00:00:00Z");
                    assert.deepStrictEqual(actual, expected);
                });
                test("next_week", () => {
                    const template = "next_week";
                    const actual = parser.parseDateTemplate(template);
                    const expected = new Date("2019-06-17T00:00:00Z");
                    assert.deepStrictEqual(actual, expected);
                });
                test("next_month", () => {
                    const template = "next_month";
                    const actual = parser.parseDateTemplate(template);
                    const expected = new Date("2019-07-01T00:00:00Z");
                    assert.deepStrictEqual(actual, expected);
                });
                test("next_quarter", () => {
                    const template = "next_quarter";
                    const actual = parser.parseDateTemplate(template);
                    const expected = new Date("2019-07-01T00:00:00Z");
                    assert.deepStrictEqual(actual, expected);
                });
                test("next_year", () => {
                    const template = "next_year";
                    const actual = parser.parseDateTemplate(template);
                    const expected = new Date("2020-01-01T00:00:00Z");
                    assert.deepStrictEqual(actual, expected);
                });
                test("next_working_day", () => {
                    const template = "next_working_day";
                    const actual = parser.parseDateTemplate(template);
                    const expected = new Date("2019-06-12T00:00:00Z");
                    assert.deepStrictEqual(actual, expected);
                });
                test("next_vacation_day", () => {
                    const template = "next_vacation_day";
                    const actual = parser.parseDateTemplate(template);
                    const expected = new Date("2019-06-15T00:00:00Z");
                    assert.deepStrictEqual(actual, expected);
                });
            });

            suite("last", () => {
                test("last_day", () => {
                    const template = "last_day";
                    const actual = parser.parseDateTemplate(template);
                    const expected = new Date("2019-06-30T00:00:00Z");
                    assert.deepStrictEqual(actual, expected);
                });
                test("last_working_day", () => {
                    const template = "last_working_day";
                    const actual = parser.parseDateTemplate(template);
                    const expected = new Date("2019-06-28T00:00:00Z");
                    assert.deepStrictEqual(actual, expected);
                });
                test("last_vacation_day", () => {
                    const template = "last_vacation_day";
                    const actual = parser.parseDateTemplate(template);
                    const expected = new Date("2019-06-30T00:00:00Z");
                    assert.deepStrictEqual(actual, expected);
                });
            });

            suite("first", () => {
                test("first_working_day", () => {
                    const template = "first_working_day";
                    const actual = parser.parseDateTemplate(template);
                    const expected = new Date("2019-06-03T00:00:00Z");
                    assert.deepStrictEqual(actual, expected);
                });
                test("first_vacation_day", () => {
                    const template = "first_vacation_day";
                    const actual = parser.parseDateTemplate(template);
                    const expected = new Date("2019-06-01T00:00:00Z");
                    assert.deepStrictEqual(actual, expected);
                });
            });

            test("now", () => {
                const template = "now";
                const actual = parser.parseDateTemplate(template).getTime();
                const expected = Date.now();
                assert.strictEqual(actual, expected);
            });
        });
    });

    test("throws TimeParseError, if template is incorrect", () => {
        const template = "not-a-date-value";
        assert.throws(() => {
            new TimeParser().parseDateTemplate(template);
        }, new TimeParseError(template, "Incorrect time template"));
    });
});
