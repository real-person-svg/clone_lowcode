import type { ReactDiffViewerStylesOverride } from 'react-diff-viewer';

export const customStyles: ReactDiffViewerStylesOverride = {
  variables: {
    light: {
      codeFoldGutterBackground: '#f7f7f7',
      codeFoldBackground: '#f1f8ff',
      addedBackground: '#e6ffed',
      addedColor: '#24292e',
      removedBackground: '#ffeef0',
      removedColor: '#24292e',
      wordAddedBackground: '#acf2bd',
      wordRemovedBackground: '#fdb8c0',
      addedGutterBackground: '#cdffd8',
      removedGutterBackground: '#fdbcc0',
      gutterBackground: '#f7f7f7',
      gutterBackgroundDark: '#f7f7f7',
      highlightBackground: '#fffbdd',
      highlightGutterBackground: '#fff5b4'
    }
  }
};
