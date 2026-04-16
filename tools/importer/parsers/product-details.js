/* eslint-disable */
/* global WebImporter */

/**
 * Parser for product-details (placeholder).
 * Base: product-details. Source: usa.canon.com product pages.
 * This is an empty placeholder block — outputs a block table with no content rows.
 */
export default function parse(element, { document }) {
  const cells = [];
  const block = WebImporter.Blocks.createBlock(document, { name: 'product-details', cells });
  element.replaceWith(block);
}
