import { assign, reduce } from 'min-dash';

var DEFAULT_FONT_SIZE = 12;
var LINE_HEIGHT_RATIO = 1.2;

var MIN_TEXT_ANNOTATION_HEIGHT = 30;

// approximate average character width as a ratio of font size
// (for Arial/sans-serif at normal weight)
var CHAR_WIDTH_RATIO = 0.6;

/**
 * Estimate the dimensions of a text string without
 * relying on DOM-based text measurement.
 *
 * @param {string} text
 * @param {Object} options
 * @param {Object} options.box
 * @param {Object} options.style
 * @param {number} [options.padding]
 *
 * @return { { width: number, height: number } }
 */
function estimateTextDimensions(text, options) {

  var box = options.box,
      style = options.style,
      padding = options.padding || 0;

  var fontSize = parseInt(style.fontSize, 10) || DEFAULT_FONT_SIZE;
  var lineHeight = (style.lineHeight || LINE_HEIGHT_RATIO) * fontSize;
  var charWidth = fontSize * CHAR_WIDTH_RATIO;

  var maxWidth = box.width - (typeof padding === 'number' ? padding * 2 : 0);

  var wrapped = text.split(/\r?\n/).map(function(line) {
    return wrapLine(line, maxWidth, charWidth);
  });

  var totalLines = reduce(wrapped, function(sum, line) {
    return sum + line.lineCount;
  }, 0);

  var maxLineWidth = reduce(wrapped, function(max, line) {
    return Math.max(max, line.width);
  }, 0);

  return {
    width: maxLineWidth,
    height: totalLines * lineHeight
  };
}


/**
 * Wrap a single hard line into rows of at most `maxWidth`,
 * greedily filling each row with words.
 *
 * @param {string} line
 * @param {number} maxWidth
 * @param {number} charWidth
 *
 * @return { { lineCount: number, width: number } }
 */
function wrapLine(line, maxWidth, charWidth) {
  var words = splitWords(line);

  if (words.length === 0) {

    // empty line
    return { lineCount: 1, width: 0 };
  }

  var lineCount = 1;
  var currentLineWidth = 0;
  var maxLineWidth = 0;

  for (var i = 0; i < words.length; i++) {
    var wordWidth = estimateWordWidth(words[i], charWidth);

    if (currentLineWidth === 0) {

      // first word on line always fits
      currentLineWidth = wordWidth;
    } else if (currentLineWidth + charWidth + wordWidth <= maxWidth) {

      // word fits on current line (with space)
      currentLineWidth += charWidth + wordWidth;
    } else {

      // wrap to next line
      maxLineWidth = Math.max(maxLineWidth, currentLineWidth);
      lineCount++;
      currentLineWidth = wordWidth;
    }
  }

  // finish last line
  maxLineWidth = Math.max(maxLineWidth, currentLineWidth);

  return {
    lineCount: lineCount,
    width: maxLineWidth
  };
}


/**
 * Split a line into words on whitespace.
 *
 * @param {string} line
 * @return {string[]}
 */
function splitWords(line) {
  return line.split(/\s+/).filter(Boolean);
}


/**
 * Estimate the rendered width of a word.
 *
 * @param {string} word
 * @param {number} charWidth
 * @return {number}
 */
function estimateWordWidth(word, charWidth) {
  return word.length * charWidth;
}


/**
 * A headless text renderer that computes text bounding boxes
 * without relying on DOM / SVG text measurement.
 *
 * Limitations compared to the DOM-based bpmn-js TextRenderer:
 *
 *   - Width is approximated as `fontSize * 0.6` per character, assuming an
 *     Arial/sans-serif font at normal weight. Actual rendered widths will
 *     differ, especially for non-Latin scripts and proportional glyphs.
 *   - No text alignment is applied; returned dimensions describe the
 *     bounding box only.
 *   - Word wrapping splits on whitespace only — soft hyphens (U+00AD),
 *     hyphens and other in-word break opportunities are not honored.
 *   - `createText` is not implemented (there is no SVG output in headless
 *     mode).
 *
 * @param {Object} [config]
 */
export default function TextRenderer(config) {

  var defaultStyle = assign({
    fontFamily: 'Arial, sans-serif',
    fontSize: DEFAULT_FONT_SIZE,
    fontWeight: 'normal',
    lineHeight: LINE_HEIGHT_RATIO
  }, config && config.defaultStyle || {});

  // external labels are rendered 1px smaller than the default style,
  // matching upstream bpmn-js/lib/draw/TextRenderer.js
  var fontSize = parseInt(defaultStyle.fontSize, 10) - 1;

  var externalStyle = assign({}, defaultStyle, {
    fontSize: fontSize
  }, config && config.externalStyle || {});

  /**
   * Get the new bounds of an externally rendered,
   * layouted label.
   *
   * @param {Object} bounds
   * @param {string} text
   *
   * @return {Object}
   */
  this.getExternalLabelBounds = function(bounds, text) {

    var layoutedDimensions = estimateTextDimensions(text, {
      box: {
        width: 90,
        height: 30
      },
      style: externalStyle
    });

    return {
      x: Math.round((bounds.x + bounds.width / 2) - (layoutedDimensions.width / 2)),
      y: Math.round(bounds.y),
      width: Math.ceil(layoutedDimensions.width),
      height: Math.ceil(layoutedDimensions.height)
    };
  };

  /**
   * Get the new bounds of text annotation.
   *
   * @param {Object} bounds
   * @param {string} text
   *
   * @return {Object}
   */
  this.getTextAnnotationBounds = function(bounds, text) {

    var layoutedDimensions = estimateTextDimensions(text, {
      box: bounds,
      style: defaultStyle,
      padding: 5
    });

    return {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: Math.max(MIN_TEXT_ANNOTATION_HEIGHT, Math.round(layoutedDimensions.height))
    };
  };

  /**
   * Create a layouted text element.
   *
   * @param {string} text
   * @param {Object} [options]
   *
   * @return {SVGElement}
   */
  this.createText = function(text, options) {
    throw new Error('not implemented in headless bpmn-js');
  };

  /**
   * Get default text style.
   */
  this.getDefaultStyle = function() {
    return defaultStyle;
  };

  /**
   * Get the external text style.
   */
  this.getExternalStyle = function() {
    return externalStyle;
  };
}

TextRenderer.$inject = [
  'config.textRenderer'
];
