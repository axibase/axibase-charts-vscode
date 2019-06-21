import * as assert from "assert";
import { TimeParseError } from "../../time/timeParseError";
import { TimeParser } from "../../time/timeParser";

suite("TimeParser > parseDateTemplate() > parseIntervalExpression()", () => {
  let realDateNow: () => number;
  let parser: TimeParser;
  const currentDate = "2019-06-11T10:15:20+03:00"; // Europe/Moscow
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

    test("+ count unit + count unit", () => {
      const template = "current_day + 9 hour + 50 minute";
      const actual = parser.parseDateTemplate(template);
      const expected = new Date("2019-06-11 09:50:00");
      assert.deepStrictEqual(actual, expected);
    });

    test("+ count*unit + count * unit", () => {
      const template = "current_day + 9*hour + 50 * minute";
      const actual = parser.parseDateTemplate(template);
      const expected = new Date("2019-06-11 09:50:00");
      assert.deepStrictEqual(actual, expected);
    });

    test("- count unit", () => {
      const template = "current_hour - 15 min";
      const actual = parser.parseDateTemplate(template);
      const expected = new Date("2019-06-11T09:45:00+03:00");
      assert.deepStrictEqual(actual, expected);
    });

    test("+ fractional_count unit", () => {
      const template = "current_minute + 0.1 sec";
      const actual = parser.parseDateTemplate(template);
      const expected = new Date("2019-06-11T10:15:00.100+03:00");
      assert.deepStrictEqual(actual, expected);
    });
  });

  suite("utc", () => {
    setup(() => {
      parser = new TimeParser("utc");
    });

    test("+ count unit + count unit", () => {
      const template = "current_day + 9 hour + 50 minute";
      const actual = parser.parseDateTemplate(template);
      const expected = new Date("2019-06-11T09:50:00Z");
      assert.deepStrictEqual(actual, expected);
    });

    test("+ count*unit + count * unit", () => {
      const template = "current_day + 9*hour + 50 * minute";
      const actual = parser.parseDateTemplate(template);
      const expected = new Date("2019-06-11T09:50:00Z");
      assert.deepStrictEqual(actual, expected);
    });

    test("- count unit", () => {
      const template = "current_hour - 15 min";
      const actual = parser.parseDateTemplate(template);
      const expected = new Date("2019-06-11T06:45:00Z");
      assert.deepStrictEqual(actual, expected);
    });

    test("+ fractional_count unit", () => {
      const template = "current_minute + 0.1 sec";
      const actual = parser.parseDateTemplate(template);
      const expected = new Date("2019-06-11T07:15:00.100Z");
      assert.deepStrictEqual(actual, expected);
    });
  });

  test("throws TimeParseError, if template format is incorrect", () => {
    const base = "current_minute";
    const span = "+ 5=hour";
    assert.throws(() => {
      new TimeParser().parseDateTemplate(base + span);
    }, new TimeParseError(span, "Incorrect interval syntax"));
  });

  test("throws TimeParseError, if unit is incorrect", () => {
    const base = "current_minute";
    const span = "+ 5 hours";
    assert.throws(() => {
      new TimeParser().parseDateTemplate(base + span);
    }, new TimeParseError("hours", "Incorrect interval unit"));
  });
});
