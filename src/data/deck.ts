/**
 * Backward compatibility: the deck content is compiled from content/.
 * This module only re-exports the generated output.
 */
export {
  chapters,
  introGroup,
  slides,
  SAFETY_BUFFER,
  meta,
} from '../content.generated';
