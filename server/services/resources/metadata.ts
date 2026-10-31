import type { ResourcePlacement } from '../../../shared/types';

export function getUpdateMetadata(
  current: Pick<ResourcePlacement, 'revision'>,
  time: string,
  operator: string
) {
  // Revision belongs to the row being written, even when publishing another row's content.
  // The caller takes time after validation and can share it across one publish transaction.
  return {
    updatedAt: time,
    updater: operator,
    revision: current.revision + 1
  };
}
