import {
  transformConfigToEditorData,
  transformEditorDataToConfig,
} from '../../src/features/resource-placement/editor/configuration/dataTransform';
import {
  insertTreeNode,
  moveTreeNode,
  patchTreeNode,
  updateTreeNode,
} from '../../src/features/resource-placement/editor/state/componentTree';
import { getTypeChangeError } from '../../src/features/resource-placement/editor/configuration/componentCapabilities';
import type { ComponentInstance } from '../../src/features/resource-placement/editor/configuration/types';
const leaf = (id: string): ComponentInstance => ({
  id,
  properties: { type: 'FormInput', path: id, label: id },
});

test.each([
  'Card',
  'Container',
  'WrapContainer',
  'ArrayContainer',
  'FormCard',
  'FormContainer',
  'FormWrapContainer',
  'FormArrayContainer',
])(
  'empty %s survives save/reopen and accepts inserted and moved children',
  (type) => {
    const first = transformConfigToEditorData(
      JSON.stringify({
        content: [{ type, path: 'config.empty', label: '空容器' }],
      }),
    );
    const reopened = transformConfigToEditorData(
      JSON.stringify(transformEditorDataToConfig(first)),
    );
    expect(reopened[0].children).toEqual([]);
    const inserted = insertTreeNode(reopened, leaf('first'), reopened[0].id);
    expect(inserted[0].children![0].parent).toBe(reopened[0].id);
    const withLeaf = [...reopened, leaf('second')];
    const moved = moveTreeNode(withLeaf, 'second', reopened[0].id, 'inside');
    expect(moved).toHaveLength(1);
    expect(moved[0].children!.map((node) => node.id)).toEqual(['second']);
    expect(moved[0].children![0].parent).toBe(reopened[0].id);
    expect(() => transformEditorDataToConfig(moved)).not.toThrow();
  },
);
test('a leaf with legacy empty children never receives inserted or moved children', () => {
  const first = transformConfigToEditorData(
    JSON.stringify({
      content: [
        {
          type: 'FormInput',
          path: 'config.target',
          label: '目标',
          children: [],
        },
      ],
    }),
  );
  const target = first[0];
  expect(target.children).toBeUndefined();
  const malformed = { ...target, children: [] };
  const nodes = [malformed, leaf('source')];
  expect(insertTreeNode(nodes, leaf('new'), target.id)).toBe(nodes);
  expect(moveTreeNode(nodes, 'source', target.id, 'inside')).toBe(nodes);
});
test('type changes preserve subtrees and normalize both leaf/container directions', () => {
  const input = leaf('input');
  const nodes = [input];
  const toContainer = patchTreeNode(nodes, 'input', {
    properties: { ...input.properties, type: 'Container' },
  });
  expect(toContainer[0].children).toEqual([]);
  const withChild = insertTreeNode(toContainer, leaf('child'), 'input');
  expect(getTypeChangeError(withChild[0], 'FormInput')).toContain(
    '先移出或删除',
  );
  expect(
    patchTreeNode(withChild, 'input', {
      properties: { ...input.properties, type: 'FormInput' },
    }),
  ).toBe(withChild);
  expect(withChild[0].children![0].parent).toBe('input');
  const reopened = transformConfigToEditorData(
    JSON.stringify(transformEditorDataToConfig(withChild)),
  );
  expect(reopened[0].children).toHaveLength(1);
  const empty = updateTreeNode(withChild, 'child', () => null);
  const backToLeaf = patchTreeNode(empty, 'input', {
    properties: { ...input.properties, type: 'FormInput' },
  });
  expect(backToLeaf[0].children).toBeUndefined();
  expect(() => transformEditorDataToConfig(backToLeaf)).not.toThrow();
});
