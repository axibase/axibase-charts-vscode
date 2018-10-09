# Change Log

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
