# Change Log

## `v.1.0.17`

* Improved hovers for forecasts.

## `v.1.0.16`

* Added `forecast` family settings support.

## `v.1.0.15`

* Validator: underscore in percentile is deprecated.
* Added `data-labels` setting.

## `v.1.0.14`

* Revert validator error causing incorrect alert on `colors` setting.

## `v.1.0.13`

* Multiple fixes related to freemarker syntax validation.

## `v.1.0.12`

* Multiple validator fixes.

## `v.1.0.11`

* Click on Preview shows unsaved configuration.
* Multiple validator fixes.

## `v.1.0.10`

* Validator fixes:
  * Check required sections based on widget type.
  * Raise error on empty settings.
  * Raise error on multiple value settings.
  * Check `mode`, `class`, `horizontal-grid`, `expand-panels` setting values based on widget type.
  * Fix `statistics` check. Raise error on function aliases.
  * Allow `rgb()` function in color settings.
  * Check correlated settings: `thresholds` and `colors`.
  * Raise error on plural time units.
  * Remove incorrect `csv` warning.
  * Remove incorrect warnings on unknown variables.

* Diagnostic messages:
  * Display allowed values based on widget type.

## `v1.0.9`

* Remove suggestions based on Levenshtein distance due to low match quality.
* Add setting descriptions.
* Fix dark theme icon.
* Validator fixes:
  * Clear diagnostic messages when file is closed.
  * Warn on `[tag]` usage. Suggest `[tags]`.
  * Add `var` object check.
  * Ignore whitespace between setting name and value when applying rules.
  * Other fixes.

## `v1.0.8`

* Fix diagnostic message severity levels.

## `v1.0.7`

* Validator: Correct warning on `[tag]` section.

## `v1.0.6`

* Validator fixes: unnecessary FreeMarker warnings, `script`/`endscript` warning
* Remove suggestions: Low match quality.
* Remove errors from console when file is closed.

## `v1.0.5`

* Bug fixes and code improvements.
