import { codeBlock } from '@blocknote/code-block';
import {
  BlockNoteSchema,
  defaultBlockSpecs,
  defaultInlineContentSpecs,
  withPageBreak,
} from '@blocknote/core';
import '@blocknote/core/fonts/inter.css';
import * as locales from '@blocknote/core/locales';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/mantine/style.css';
import { useCreateBlockNote } from '@blocknote/react';
import { HocuspocusProvider } from '@hocuspocus/provider';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import * as Y from 'yjs';

import { Box, TextErrors } from '@/components';
import { Doc, useIsCollaborativeEditable } from '@/docs/doc-management';
import { useAuth } from '@/features/auth';

import {
  useHeadings,
  useSaveDoc,
  useShortcuts,
  useUploadFile,
  useUploadStatus,
} from '../hook';
import { useEditorStore } from '../stores';
import { cssEditor } from '../styles';
import { DocsBlockNoteEditor } from '../types';
import { randomColor } from '../utils';

import { BlockNoteSuggestionMenu } from './BlockNoteSuggestionMenu';
import { BlockNoteToolbar } from './BlockNoteToolBar/BlockNoteToolbar';
import { CalloutBlock, DividerBlock } from './custom-blocks';
import {
  InterlinkingLinkInlineContent,
  InterlinkingSearchInlineContent,
} from './custom-inline-content';
import XLMultiColumn from './xl-multi-column';

const multiColumnDropCursor = XLMultiColumn?.multiColumnDropCursor;
const multiColumnLocales = XLMultiColumn?.locales;
const withMultiColumn = XLMultiColumn?.withMultiColumn;

const baseBlockNoteSchema = withPageBreak(
  BlockNoteSchema.create({
    blockSpecs: {
      ...defaultBlockSpecs,
      callout: CalloutBlock,
      divider: DividerBlock,
    },
    inlineContentSpecs: {
      ...defaultInlineContentSpecs,
      interlinkingSearchInline: InterlinkingSearchInlineContent,
      interlinkingLinkInline: InterlinkingLinkInlineContent,
    },
  }),
);

export const blockNoteSchema = (withMultiColumn?.(baseBlockNoteSchema) ||
  baseBlockNoteSchema) as typeof baseBlockNoteSchema;

interface BlockNoteEditorProps {
  doc: Doc;
  provider: HocuspocusProvider;
}

export const BlockNoteEditor = ({ doc, provider }: BlockNoteEditorProps) => {
  const { user } = useAuth();
  const { setEditor } = useEditorStore();
  const { t } = useTranslation();

  const { isEditable, isLoading } = useIsCollaborativeEditable(doc);
  const isConnectedToCollabServer = provider.isSynced;
  const readOnly = !doc.abilities.partial_update || !isEditable || isLoading;

  useSaveDoc(doc.id, provider.document, !readOnly, isConnectedToCollabServer);
  const { i18n } = useTranslation();
  const lang = i18n.resolvedLanguage;

  const { uploadFile, errorAttachment } = useUploadFile(doc.id);

  const collabName = readOnly
    ? 'Reader'
    : user?.full_name || user?.email || t('Anonymous');
  const showCursorLabels: 'always' | 'activity' | (string & {}) = 'activity';

  const editor: DocsBlockNoteEditor = useCreateBlockNote(
    {
      codeBlock,
      collaboration: {
        provider,
        fragment: provider.document.getXmlFragment('document-store'),
        user: {
          name: collabName,
          color: randomColor(),
        },
        /**
         * We render the cursor with a custom element to:
         * - fix rendering issue with the default cursor
         * - hide the cursor when anonymous users
         */
        renderCursor: (user: { color: string; name: string }) => {
          const cursorElement = document.createElement('span');

          if (user.name === 'Reader') {
            return cursorElement;
          }

          cursorElement.classList.add('collaboration-cursor-custom__base');
          const caretElement = document.createElement('span');
          caretElement.classList.add('collaboration-cursor-custom__caret');
          caretElement.setAttribute('spellcheck', `false`);
          caretElement.setAttribute('style', `background-color: ${user.color}`);

          if (showCursorLabels === 'always') {
            cursorElement.setAttribute('data-active', '');
          }

          const labelElement = document.createElement('span');

          labelElement.classList.add('collaboration-cursor-custom__label');
          labelElement.setAttribute('spellcheck', `false`);
          labelElement.setAttribute(
            'style',
            `background-color: ${user.color};border: 1px solid ${user.color};`,
          );
          labelElement.insertBefore(document.createTextNode(user.name), null);

          caretElement.insertBefore(labelElement, null);

          cursorElement.insertBefore(document.createTextNode('\u2060'), null); // Non-breaking space
          cursorElement.insertBefore(caretElement, null);
          cursorElement.insertBefore(document.createTextNode('\u2060'), null); // Non-breaking space

          return cursorElement;
        },
        showCursorLabels: showCursorLabels as 'always' | 'activity',
      },
      dictionary: {
        ...locales[lang as keyof typeof locales],
        multi_column:
          multiColumnLocales?.[lang as keyof typeof multiColumnLocales],
      },
      tables: {
        splitCells: true,
        cellBackgroundColor: true,
        cellTextColor: true,
        headers: true,
      },
      uploadFile,
      schema: blockNoteSchema,
      dropCursor: multiColumnDropCursor,
    },
    [collabName, lang, provider, uploadFile],
  );

  useHeadings(editor);
  useShortcuts(editor);
  useUploadStatus(editor);

  useEffect(() => {
    setEditor(editor);

    return () => {
      setEditor(undefined);
    };
  }, [setEditor, editor]);

  return (
    <Box
      $padding={{ top: 'md' }}
      $background="white"
      $css={cssEditor(readOnly)}
      className="--docs--editor-container"
    >
      {errorAttachment && (
        <Box $margin={{ bottom: 'big', top: 'none', horizontal: 'large' }}>
          <TextErrors
            causes={errorAttachment.cause}
            canClose
            $textAlign="left"
          />
        </Box>
      )}

      <BlockNoteView
        editor={editor}
        formattingToolbar={false}
        slashMenu={false}
        editable={!readOnly}
        theme="light"
      >
        <BlockNoteSuggestionMenu />
        <BlockNoteToolbar />
      </BlockNoteView>
    </Box>
  );
};

interface BlockNoteEditorVersionProps {
  initialContent: Y.XmlFragment;
}

export const BlockNoteEditorVersion = ({
  initialContent,
}: BlockNoteEditorVersionProps) => {
  const readOnly = true;
  const editor = useCreateBlockNote(
    {
      collaboration: {
        fragment: initialContent,
        user: {
          name: '',
          color: '',
        },
        provider: undefined,
      },
      schema: blockNoteSchema,
    },
    [initialContent],
  );

  return (
    <Box $css={cssEditor(readOnly)} className="--docs--editor-container">
      <BlockNoteView editor={editor} editable={!readOnly} theme="light" />
    </Box>
  );
};
