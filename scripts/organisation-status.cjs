/* Source-sheet provenance and current verification status are separate. */
module.exports = org => org.verification_status || org.source_sheet;
