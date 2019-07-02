import * as assert from "assert";
import { TimeParseError } from "../../time/timeParseError";
import { TimeParser } from "../../time/timeParser";

suite("TimeParser > parseDateTemplate() > parseDate()", () => {
    let realDateNow: () => number;
    const currentDate = "2019-06-11 10:15:20";
    let parser: TimeParser;
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

        test("throws TimeParseError, if date is less than 1970-01-01 00:00:00", () => {
            const template = "1969-01-01";
            assert.throws(() => {
                new TimeParser().parseDateTemplate(template);
            }, new TimeParseError(template, "Date must be greater than 1970-01-01 00:00:00"));
        });

        suite("possible templates", () => {
            test("if yyyy-mm-dd, sets year, month and day", () => {
                const actual = parser.parseDateTemplate("2015-01-03");
                const expected = new Date("2015-01-03 00:00:00");
                assert.deepStrictEqual(actual, expected);
            });
            test("if yyyy-m-d, sets year, month and day", () => {
                const actual = parser.parseDateTemplate("2015-1-3");
                const expected = new Date("2015-01-03 00:00:00");
                assert.deepStrictEqual(actual, expected);
            });
            test("if mm-dd, changes month and day in current date", () => {
                const actual = parser.parseDateTemplate("01-03");
                const expected = new Date("2019-01-03 00:00:00");
                assert.deepStrictEqual(actual, expected);
            });
            test("if dd, changes day in current date", () => {
                const actual = parser.parseDateTemplate("03");
                const expected = new Date("2019-06-03 00:00:00");
                assert.deepStrictEqual(actual, expected);
            });
            test("if yyyy, sets 1 January of specified year", () => {
                const actual = parser.parseDateTemplate("1999");
                const expected = new Date("1999-01-01 00:00:00");
                assert.deepStrictEqual(actual, expected);
            });
            test("if yyyy-mm, sets 1 day of specified year and month", () => {
                const actual = parser.parseDateTemplate("1999-02");
                const expected = new Date("1999-02-01 00:00:00");
                assert.deepStrictEqual(actual, expected);
            });
        });

        suite("boundaries", () => {
            suite("zero date", () => {
                test("if yyyy-00-00, sets 1st January of specified year", () => {
                    const actual = parser.parseDateTemplate("2016-00-00");
                    const expected = new Date("2016-01-01 00:00:00");
                    assert.deepStrictEqual(actual, expected);
                });
                test("if yyyy-mm-00, sets 1st day of specified month of year", () => {
                    const actual = parser.parseDateTemplate("2016-03-00");
                    const expected = new Date("2016-03-01 00:00:00");
                    assert.deepStrictEqual(actual, expected);
                });
                test("if 00-00, sets 1st January of current year", () => {
                    const actual = parser.parseDateTemplate("00-00");
                    const expected = new Date("2019-01-01 00:00:00");
                    assert.deepStrictEqual(actual, expected);
                });
                test("if mm-00, sets 1st day of specified month of current year", () => {
                    const actual = parser.parseDateTemplate("03-00");
                    const expected = new Date("2019-03-01 00:00:00");
                    assert.deepStrictEqual(actual, expected);
                });
                test("if 00, sets 1st day of current month", () => {
                    const actual = parser.parseDateTemplate("00");
                    const expected = new Date("2019-06-01 00:00:00");
                    assert.deepStrictEqual(actual, expected);
                });
                test("if 0, sets 1st day of current month", () => {
                    const actual = parser.parseDateTemplate("0");
                    const expected = new Date("2019-06-01 00:00:00");
                    assert.deepStrictEqual(actual, expected);
                });
            });

            suite("last day in month", () => {
                test("31 January", () => {
                    const expected = new Date("2019-01-31 00:00:00");
                    let actual = parser.parseDateTemplate("2019-01-31");
                    assert.deepStrictEqual(actual, expected);
                    actual = parser.parseDateTemplate("01-31");
                    assert.deepStrictEqual(actual, expected);
                });
                test("31 March", () => {
                    const expected = new Date("2019-03-31 00:00:00");
                    let actual = parser.parseDateTemplate("2019-03-31");
                    assert.deepStrictEqual(actual, expected);
                    actual = parser.parseDateTemplate("03-31");
                    assert.deepStrictEqual(actual, expected);
                });
                test("30 April", () => {
                    const expected = new Date("2019-04-30 00:00:00");
                    let actual = parser.parseDateTemplate("2019-04-30");
                    assert.deepStrictEqual(actual, expected);
                    actual = parser.parseDateTemplate("04-30");
                    assert.deepStrictEqual(actual, expected);
                });
                test("31 May", () => {
                    const expected = new Date("2019-05-31 00:00:00");
                    let actual = parser.parseDateTemplate("2019-05-31");
                    assert.deepStrictEqual(actual, expected);
                    actual = parser.parseDateTemplate("05-31");
                    assert.deepStrictEqual(actual, expected);
                });
                test("30 June", () => {
                    const expected = new Date("2019-06-30 00:00:00");
                    let actual = parser.parseDateTemplate("2019-06-30");
                    assert.deepStrictEqual(actual, expected);
                    actual = parser.parseDateTemplate("06-30");
                    assert.deepStrictEqual(actual, expected);
                });
                test("31 July", () => {
                    const expected = new Date("2019-07-31 00:00:00");
                    let actual = parser.parseDateTemplate("2019-07-31");
                    assert.deepStrictEqual(actual, expected);
                    actual = parser.parseDateTemplate("07-31");
                    assert.deepStrictEqual(actual, expected);
                });
                test("31 August", () => {
                    const expected = new Date("2019-08-31 00:00:00");
                    let actual = parser.parseDateTemplate("2019-08-31");
                    assert.deepStrictEqual(actual, expected);
                    actual = parser.parseDateTemplate("08-31");
                    assert.deepStrictEqual(actual, expected);
                });
                test("30 September", () => {
                    const expected = new Date("2019-09-30 00:00:00");
                    let actual = parser.parseDateTemplate("2019-09-30");
                    assert.deepStrictEqual(actual, expected);
                    actual = parser.parseDateTemplate("09-30");
                    assert.deepStrictEqual(actual, expected);
                });
                test("31 October", () => {
                    const expected = new Date("2019-10-31 00:00:00");
                    let actual = parser.parseDateTemplate("2019-10-31");
                    assert.deepStrictEqual(actual, expected);
                    actual = parser.parseDateTemplate("10-31");
                    assert.deepStrictEqual(actual, expected);
                });
                test("30 November", () => {
                    const expected = new Date("2019-11-30 00:00:00");
                    let actual = parser.parseDateTemplate("2019-11-30");
                    assert.deepStrictEqual(actual, expected);
                    actual = parser.parseDateTemplate("11-30");
                    assert.deepStrictEqual(actual, expected);
                });
                test("31 December", () => {
                    const expected = new Date("2019-12-31 00:00:00");
                    let actual = parser.parseDateTemplate("2019-12-31");
                    assert.deepStrictEqual(actual, expected);
                    actual = parser.parseDateTemplate("12-31");
                    assert.deepStrictEqual(actual, expected);
                });

                suite("February", () => {
                    test("28 February 2015 - year setup leap", () => {
                        Date.now = () => new Date("2015-03-20").getTime();
                        const expected = new Date("2015-02-28 00:00:00");
                        let actual = parser.parseDateTemplate("2015-02-28");
                        assert.deepStrictEqual(actual, expected);
                        actual = parser.parseDateTemplate("02-28");
                        assert.deepStrictEqual(actual, expected);
                    });
                    test("29 February 2016 - leap year", () => {
                        Date.now = () => new Date("2016-03-20").getTime();
                        const expected = new Date("2016-02-29 00:00:00");
                        let actual = parser.parseDateTemplate("2016-02-29");
                        assert.deepStrictEqual(actual, expected);
                        actual = parser.parseDateTemplate("02-29");
                        assert.deepStrictEqual(actual, expected);
                    });
                    test("28 February 2017 - year teardown leap", () => {
                        Date.now = () => new Date("2017-03-20").getTime();
                        const expected = new Date("2017-02-28 00:00:00");
                        let actual = parser.parseDateTemplate("2017-02-28");
                        assert.deepStrictEqual(actual, expected);
                        actual = parser.parseDateTemplate("02-28");
                        assert.deepStrictEqual(actual, expected);
                    });
                    teardown(() => {
                        Date.now = () => new Date(currentDate).getTime();
                    });
                });
            });

            suite("if next day after last in month, returns last day of previous month", () => {
                test("32 January", () => {
                    const expected = new Date("2019-01-31 00:00:00");
                    let actual = parser.parseDateTemplate("2019-01-32");
                    assert.deepStrictEqual(actual, expected);
                    actual = parser.parseDateTemplate("01-32");
                    assert.deepStrictEqual(actual, expected);
                });
                test("32 March", () => {
                    const expected = new Date("2019-03-31 00:00:00");
                    let actual = parser.parseDateTemplate("2019-03-32");
                    assert.deepStrictEqual(actual, expected);
                    actual = parser.parseDateTemplate("03-32");
                    assert.deepStrictEqual(actual, expected);
                });
                test("31 April", () => {
                    const expected = new Date("2019-04-30 00:00:00");
                    let actual = parser.parseDateTemplate("2019-04-31");
                    assert.deepStrictEqual(actual, expected);
                    actual = parser.parseDateTemplate("04-31");
                    assert.deepStrictEqual(actual, expected);
                });
                test("32 May", () => {
                    const expected = new Date("2019-05-31 00:00:00");
                    let actual = parser.parseDateTemplate("2019-05-32");
                    assert.deepStrictEqual(actual, expected);
                    actual = parser.parseDateTemplate("05-32");
                    assert.deepStrictEqual(actual, expected);
                });
                test("31 June", () => {
                    const expected = new Date("2019-06-30 00:00:00");
                    let actual = parser.parseDateTemplate("2019-06-31");
                    assert.deepStrictEqual(actual, expected);
                    actual = parser.parseDateTemplate("06-31");
                    assert.deepStrictEqual(actual, expected);
                });
                test("32 July", () => {
                    const expected = new Date("2019-07-31 00:00:00");
                    let actual = parser.parseDateTemplate("2019-07-32");
                    assert.deepStrictEqual(actual, expected);
                    actual = parser.parseDateTemplate("07-32");
                    assert.deepStrictEqual(actual, expected);
                });
                test("31 August", () => {
                    const expected = new Date("2019-08-31 00:00:00");
                    let actual = parser.parseDateTemplate("2019-08-32");
                    assert.deepStrictEqual(actual, expected);
                    actual = parser.parseDateTemplate("08-32");
                    assert.deepStrictEqual(actual, expected);
                });
                test("31 September", () => {
                    const expected = new Date("2019-09-30 00:00:00");
                    let actual = parser.parseDateTemplate("2019-09-31");
                    assert.deepStrictEqual(actual, expected);
                    actual = parser.parseDateTemplate("09-31");
                    assert.deepStrictEqual(actual, expected);
                });
                test("32 October", () => {
                    const expected = new Date("2019-10-31 00:00:00");
                    let actual = parser.parseDateTemplate("2019-10-32");
                    assert.deepStrictEqual(actual, expected);
                    actual = parser.parseDateTemplate("10-32");
                    assert.deepStrictEqual(actual, expected);
                });
                test("31 November", () => {
                    const expected = new Date("2019-11-30 00:00:00");
                    let actual = parser.parseDateTemplate("2019-11-31");
                    assert.deepStrictEqual(actual, expected);
                    actual = parser.parseDateTemplate("11-31");
                    assert.deepStrictEqual(actual, expected);
                });
                test("32 December", () => {
                    const expected = new Date("2019-12-31 00:00:00");
                    let actual = parser.parseDateTemplate("2019-12-32");
                    assert.deepStrictEqual(actual, expected);
                    actual = parser.parseDateTemplate("12-32");
                    assert.deepStrictEqual(actual, expected);
                });

                suite("February", () => {
                    test("29 February 2015 - year before leap", () => {
                        Date.now = () => new Date("2015-03-20").getTime();
                        const expected = new Date("2015-02-28 00:00:00");
                        let actual = parser.parseDateTemplate("2015-02-29");
                        assert.deepStrictEqual(actual, expected);
                        actual = parser.parseDateTemplate("02-29");
                        assert.deepStrictEqual(actual, expected);
                    });
                    test("30 February 2016 - leap year", () => {
                        Date.now = () => new Date("2016-03-20").getTime();
                        const expected = new Date("2016-02-29 00:00:00");
                        let actual = parser.parseDateTemplate("2016-02-30");
                        assert.deepStrictEqual(actual, expected);
                        actual = parser.parseDateTemplate("02-30");
                        assert.deepStrictEqual(actual, expected);
                    });
                    test("29 February 2017 - year after leap", () => {
                        Date.now = () => new Date("2017-03-20").getTime();
                        const expected = new Date("2017-02-28 00:00:00");
                        let actual = parser.parseDateTemplate("2017-02-29");
                        assert.deepStrictEqual(actual, expected);
                        actual = parser.parseDateTemplate("02-29");
                        assert.deepStrictEqual(actual, expected);
                    });
                });
            });
        });
    });
});
